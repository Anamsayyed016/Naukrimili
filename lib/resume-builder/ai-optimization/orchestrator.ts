/**
 * Central Resume Optimization Orchestrator
 * Composes existing ATS engine, semantic matcher, enhanced AI, and unified AI — no duplicate clients.
 */

import { createHash } from 'crypto';
import { getUnifiedAI } from '@/lib/services/unified-ai-service';
import { EnhancedAIService } from '@/lib/services/enhanced-ai-service';
import {
  EnhancedATSSuggestionEngine,
  type ATSSuggestionResponse,
} from '@/lib/resume-builder/ats-suggestion-engine-enhanced';
import type { SemanticMatchResult } from '@/lib/services/semantic-ats-matcher';
import {
  buildResumeSnapshot,
  normalizeExperienceLevel,
  snapshotToAtsRequest,
} from './resume-snapshot';
import { calculateStructureAtsScore } from './resume-scorer';
import {
  buildRoleFirstReportBase,
  getRoleFirstProfile,
  mergeAtsIntoRoleFirstReport,
} from './role-first-intelligence';
import type {
  OptimizeResumeRequest,
  OptimizationReport,
  RecruiterAnalysisJSON,
  ExperienceBulletSuggestion,
  SkillGapItem,
} from './types';

const JD_MAX = 8000;
const RECRUITER_SYSTEM = `You are a senior technical recruiter, ATS specialist, and hiring manager.
Analyze the candidate resume against the job description.
Rules:
- Never invent employers, dates, degrees, or metrics not supported by the resume.
- Use [quantify impact] placeholders instead of fake numbers.
- Be specific, human, and recruiter-grade — not generic AI filler.
- Output valid JSON only matching the requested schema.`;

interface CacheEntry {
  report: OptimizationReport;
  timestamp: number;
}

class OptimizeCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000;

  key(userId: string, payload: string): string {
    return createHash('sha256').update(`${userId}:${payload}`).digest('hex').substring(0, 24);
  }

  get(key: string): OptimizationReport | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    return { ...entry.report, cached: true };
  }

  set(key: string, report: OptimizationReport): void {
    this.cache.set(key, { report: { ...report, cached: false }, timestamp: Date.now() });
    if (this.cache.size > 200) {
      const oldest = [...this.cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) this.cache.delete(oldest[0]);
    }
  }
}

let atsEngine: EnhancedATSSuggestionEngine | null = null;
let enhanceService: EnhancedAIService | null = null;
const optimizeCache = new OptimizeCache();

function getAtsEngine(): EnhancedATSSuggestionEngine {
  if (!atsEngine) atsEngine = new EnhancedATSSuggestionEngine();
  return atsEngine;
}

function getEnhanceService(): EnhancedAIService {
  if (!enhanceService) enhanceService = new EnhancedAIService();
  return enhanceService;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

function mapSkillGaps(raw: RecruiterAnalysisJSON['skillGaps']): SkillGapItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g) => g && typeof g.skill === 'string')
    .map((g) => ({
      skill: g.skill,
      priority: (['high', 'medium', 'low'].includes(g.priority) ? g.priority : 'medium') as SkillGapItem['priority'],
      reason: g.reason || '',
    }))
    .slice(0, 12);
}

function buildExperienceBullets(
  formData: Record<string, unknown>,
  atsBullets: string[],
  recruiterBullets: RecruiterAnalysisJSON['experienceBullets']
): ExperienceBulletSuggestion[] {
  const out: ExperienceBulletSuggestion[] = [];
  const experiences = Array.isArray(formData.experience) ? formData.experience : [];

  if (Array.isArray(recruiterBullets)) {
    for (const b of recruiterBullets) {
      if (typeof b.experienceIndex !== 'number' || !b.improved) continue;
      const exp = experiences[b.experienceIndex] as Record<string, unknown> | undefined;
      const original =
        exp && typeof exp.description === 'string' ? exp.description : '';
      out.push({
        experienceIndex: b.experienceIndex,
        original,
        improved: b.improved,
        rationale: b.rationale || '',
      });
    }
  }

  if (out.length === 0 && experiences.length > 0 && atsBullets.length > 0) {
    const exp0 = experiences[0] as Record<string, unknown>;
    const original = typeof exp0?.description === 'string' ? exp0.description : '';
    out.push({
      experienceIndex: 0,
      original,
      improved: atsBullets[0],
      rationale: 'ATS-optimized bullet aligned with role and JD keywords',
    });
  }

  return out.slice(0, 6);
}

export class ResumeOptimizationOrchestrator {
  async optimize(
    userId: string,
    request: OptimizeResumeRequest
  ): Promise<OptimizationReport> {
    const targetRole = (request.targetRole || '').trim();
    const jobDescription = truncate((request.jobDescription || '').trim(), JD_MAX);
    const hasJd = jobDescription.length >= 40;

    if (!targetRole) {
      throw new Error('Target role is required');
    }

    const formData = request.formData || {};
    const snapshot = buildResumeSnapshot(formData);
    const experienceLevel = normalizeExperienceLevel(request.experienceLevel, formData);
    const industry = (request.industry || snapshot.industry || '').trim();

    if (!hasJd) {
      return this.optimizeRoleFirst(
        userId,
        targetRole,
        experienceLevel,
        industry,
        formData,
        snapshot
      );
    }

    const cachePayload = JSON.stringify({
      targetRole,
      industry,
      experienceLevel,
      jd: jobDescription.slice(0, 500),
      snap: snapshot.resumeText.slice(0, 400),
    });
    const cacheKey = optimizeCache.key(userId, cachePayload);
    const cached = optimizeCache.get(cacheKey);
    if (cached) return cached;

    const structureScore = calculateStructureAtsScore(formData);
    const engine = getAtsEngine();
    const atsRequest = snapshotToAtsRequest(snapshot, targetRole, industry, experienceLevel);

    const userResumeForMatch = {
      summary: snapshot.summary,
      skills: snapshot.skills,
      experience: snapshot.experienceTexts,
      education: snapshot.educationTexts,
    };

    let semanticMatch: SemanticMatchResult | undefined;
    let atsResult: ATSSuggestionResponse & { semanticMatch?: SemanticMatchResult };
    let provider = 'hybrid';

    try {
      atsResult = await engine.generateSuggestionsWithSemanticInsights(
        atsRequest,
        jobDescription,
        userResumeForMatch
      );
      semanticMatch = atsResult.semanticMatch;
      provider = 'openai+ats';
    } catch (err) {
      console.warn('⚠️ ATS suggestions failed in optimize, using fallback:', err);
      atsResult = await engine.generateSuggestions(atsRequest);
      try {
        semanticMatch = await engine.calculateSemanticMatch(
          userResumeForMatch,
          jobDescription,
          snapshot.skills
        );
      } catch {
        /* ignore */
      }
    }

    const roleMatchPercent = semanticMatch?.matchScore ?? 0;
    const matchedKeywords =
      semanticMatch?.matchedKeywords?.map((k) =>
        typeof k === 'string' ? k : k.keyword
      ) ?? [];
    const missingKeywords = semanticMatch?.missingKeywords ?? [];
    const missingSkills = semanticMatch?.missingSkills ?? [];

    let recruiterJson: RecruiterAnalysisJSON = {};
    const unified = getUnifiedAI({ preferredProvider: 'openai', enableFallback: true });

    if (unified.isAvailable()) {
      const recruiterPrompt = `TARGET ROLE: ${targetRole}
EXPERIENCE LEVEL: ${experienceLevel}
INDUSTRY: ${industry || 'General'}

JOB DESCRIPTION (excerpt):
${truncate(jobDescription, 4000)}

CANDIDATE RESUME:
${truncate(snapshot.resumeText || '(minimal content)', 3500)}

SEMANTIC MATCH: ${roleMatchPercent}%
MISSING SKILLS FROM MATCHER: ${missingSkills.slice(0, 10).join(', ') || 'none'}
MISSING KEYWORDS: ${missingKeywords.slice(0, 12).join(', ') || 'none'}

Return JSON:
{
  "qualityIssues": ["issue tied to resume vs JD"],
  "skillGaps": [{"skill":"", "priority":"high|medium|low", "reason":""}],
  "roleSpecificRecommendations": ["recruiter action items"],
  "fresherGuidance": ["only if entry-level relevant"],
  "recruiterNotes": ["2-4 short insider notes"],
  "summary": {"suggested": "", "rationale": ""},
  "experienceBullets": [{"experienceIndex": 0, "improved": "", "rationale": ""}],
  "suggestedCertifications": ["realistic certs for role"]
}`;

      const structured = await unified.generateStructuredData<RecruiterAnalysisJSON>(
        recruiterPrompt,
        RECRUITER_SYSTEM,
        { temperature: 0.25, maxTokens: 2200, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }
      );

      if (structured.success && structured.data) {
        recruiterJson = structured.data;
        provider = structured.provider === 'gemini' ? 'gemini+ats' : 'openai+ats';
      }
    }

    const enhance = getEnhanceService();
    let summarySuggested = recruiterJson.summary?.suggested || atsResult.summary || '';
    const currentSummary = snapshot.summary;

    if (
      enhance.isAvailable() &&
      currentSummary &&
      !recruiterJson.summary?.suggested
    ) {
      try {
        const enhanced = await enhance.enhanceContent({
          jobTitle: targetRole,
          industry,
          experienceLevel,
          currentContent: `${currentSummary}\n\n---\nJD context:\n${truncate(jobDescription, 1500)}`,
          enhancementType: 'summary',
        });
        if (enhanced.enhanced) summarySuggested = enhanced.enhanced;
      } catch {
        /* use ats summary */
      }
    }

    const combinedAtsScore = Math.round(
      structureScore * 0.35 + roleMatchPercent * 0.65
    );

    const report: OptimizationReport = {
      success: true,
      atsScore: Math.min(100, combinedAtsScore),
      roleMatchPercent,
      targetRole,
      experienceLevel,
      matchedKeywords: matchedKeywords.slice(0, 20),
      missingKeywords: missingKeywords.slice(0, 20),
      missingSkills: missingSkills.slice(0, 15),
      skillGaps: mapSkillGaps(recruiterJson.skillGaps),
      qualityIssues: recruiterJson.qualityIssues?.slice(0, 8) ?? [],
      summary: {
        current: currentSummary,
        suggested: summarySuggested,
        rationale:
          recruiterJson.summary?.rationale ||
          'Aligned summary with JD keywords and role expectations.',
      },
      experienceBullets: buildExperienceBullets(
        formData,
        atsResult.experience_bullets || [],
        recruiterJson.experienceBullets
      ),
      suggestedProjects: (atsResult.projects || []).map((p) => ({
        title: p.title,
        description: p.description,
        forFresher: experienceLevel === 'fresher' || experienceLevel === 'student',
      })),
      suggestedCertifications: (
        recruiterJson.suggestedCertifications ||
        []
      ).slice(0, 6),
      suggestedSkills: [...new Set([...(atsResult.skills || []), ...missingSkills])].slice(0, 14),
      atsKeywords: (atsResult.ats_keywords || []).slice(0, 25),
      roleSpecificRecommendations:
        recruiterJson.roleSpecificRecommendations?.slice(0, 8) ??
        semanticMatch?.recommendations?.slice(0, 6) ??
        [],
      fresherGuidance:
        experienceLevel === 'fresher' || experienceLevel === 'student'
          ? recruiterJson.fresherGuidance?.slice(0, 6) ?? []
          : [],
      recruiterNotes: recruiterJson.recruiterNotes?.slice(0, 6) ?? [],
      provider,
      cached: false,
      mode: 'jd-enhanced',
    };

    optimizeCache.set(cacheKey, report);
    return report;
  }

  /** Layer 1–2: role + experience guidance without JD */
  private async optimizeRoleFirst(
    userId: string,
    targetRole: string,
    experienceLevel: string,
    industry: string,
    formData: Record<string, unknown>,
    snapshot: ReturnType<typeof buildResumeSnapshot>
  ): Promise<OptimizationReport> {
    const cachePayload = JSON.stringify({
      mode: 'role-first',
      targetRole,
      industry,
      experienceLevel,
      snap: snapshot.resumeText.slice(0, 400),
    });
    const cacheKey = optimizeCache.key(userId, cachePayload);
    const cached = optimizeCache.get(cacheKey);
    if (cached) return cached;

    const profile = getRoleFirstProfile(targetRole, experienceLevel);
    const structureScore = calculateStructureAtsScore(formData);
    let report = buildRoleFirstReportBase(
      targetRole,
      experienceLevel,
      formData,
      profile,
      structureScore
    );

    const engine = getAtsEngine();
    const atsRequest = snapshotToAtsRequest(snapshot, targetRole, industry, experienceLevel);

    try {
      const atsResult = await engine.generateSuggestions(atsRequest);
      report = mergeAtsIntoRoleFirstReport(report, atsResult, experienceLevel);
    } catch (err) {
      console.warn('⚠️ ATS role-first suggestions failed, using cached profile only:', err);
    }

    const unified = getUnifiedAI({ preferredProvider: 'openai', enableFallback: true });
    if (unified.isAvailable()) {
      const rolePrompt = `TARGET ROLE: ${targetRole}
EXPERIENCE LEVEL: ${experienceLevel}
INDUSTRY: ${industry || 'General'}
NO JOB DESCRIPTION — provide role-based recruiter guidance only.

CANDIDATE RESUME (excerpt):
${truncate(snapshot.resumeText || '(minimal content)', 2500)}

Return JSON:
{
  "qualityIssues": ["resume gaps for this role level"],
  "skillGaps": [{"skill":"", "priority":"high|medium|low", "reason":""}],
  "roleSpecificRecommendations": ["recruiter action items"],
  "fresherGuidance": ["only if entry-level relevant"],
  "recruiterNotes": ["2-4 short insider notes"],
  "summary": {"suggested": "", "rationale": ""},
  "suggestedCertifications": ["realistic certs"]
}`;

      const structured = await unified.generateStructuredData<RecruiterAnalysisJSON>(
        rolePrompt,
        'You are a senior recruiter and career coach. Provide role-based guidance without inventing experience. Output JSON only.',
        { temperature: 0.25, maxTokens: 1600, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }
      );

      if (structured.success && structured.data) {
        const rj = structured.data;
        report = {
          ...report,
          qualityIssues: rj.qualityIssues?.slice(0, 6) ?? report.qualityIssues,
          skillGaps: mapSkillGaps(rj.skillGaps).length
            ? mapSkillGaps(rj.skillGaps)
            : report.skillGaps,
          roleSpecificRecommendations:
            rj.roleSpecificRecommendations?.slice(0, 8) ?? report.roleSpecificRecommendations,
          fresherGuidance:
            experienceLevel === 'fresher' || experienceLevel === 'student'
              ? rj.fresherGuidance?.slice(0, 6) ?? report.fresherGuidance
              : report.fresherGuidance,
          recruiterNotes: rj.recruiterNotes?.slice(0, 6) ?? report.recruiterNotes,
          suggestedCertifications: (
            rj.suggestedCertifications || report.suggestedCertifications
          ).slice(0, 6),
          summary: {
            ...report.summary,
            suggested: rj.summary?.suggested?.trim() || report.summary.suggested,
            rationale:
              rj.summary?.rationale ||
              'Role-based guidance—paste a JD to personalize for a specific job.',
          },
          provider: `${structured.provider === 'gemini' ? 'gemini' : 'openai'}+role-first`,
        };
      }
    }

    report.mode = 'role-first';
    optimizeCache.set(cacheKey, report);
    return report;
  }
}

let orchestratorInstance: ResumeOptimizationOrchestrator | null = null;

export function getResumeOptimizationOrchestrator(): ResumeOptimizationOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ResumeOptimizationOrchestrator();
  }
  return orchestratorInstance;
}
