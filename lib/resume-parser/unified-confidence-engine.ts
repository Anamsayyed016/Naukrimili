/**
 * Unified confidence engine — bridges custom-parser scores, upload-profile scores,
 * and section-confidence-repair scoring into one section map.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import {
  scoreExtractedSectionConfidence,
  selectWeakSectionsForRepair,
  SECTION_REPAIR_CONFIDENCE_THRESHOLD,
  type RepairableSectionKey,
  type SectionConfidenceMap,
} from '@/lib/resume-parser/section-confidence-repair';
import type { DynamicDocumentAnalysis } from '@/lib/resume-parser/dynamic-document-analysis';
import { isPlausiblePersonName } from '@/lib/resume-parser/import-sanitize';

export type UnifiedSectionKey =
  | RepairableSectionKey
  | 'identity'
  | 'contact'
  | 'hobbies'
  | 'personalDetails';

export type UnifiedSectionConfidence = SectionConfidenceMap & {
  identity: number;
  contact: number;
  hobbies: number;
  personalDetails: number;
  overall: number;
};

function clamp(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function scoreIdentity(data: ExtractedResumeData): number {
  const name = String(data.fullName || '').trim();
  if (name && isPlausiblePersonName(name)) return 90;
  if (name.length >= 4) return 55;
  return 15;
}

function scoreContact(data: ExtractedResumeData): number {
  let pts = 0;
  if (String(data.email || '').includes('@')) pts += 35;
  if (String(data.phone || '').replace(/\D/g, '').length >= 8) pts += 25;
  if (String(data.location || '').trim().length >= 3) pts += 20;
  if (String(data.linkedin || '').trim()) pts += 10;
  if (String(data.portfolio || '').trim()) pts += 10;
  return clamp(pts);
}

function scoreHobbies(data: ExtractedResumeData, rawText: string): number {
  const hobbies = Array.isArray(data.hobbies) ? data.hobbies : [];
  if (hobbies.length > 0) return 88;
  return /\b(hobbies?|interests?|extracurricular)\b/i.test(rawText) ? 22 : 85;
}

function scorePersonalDetails(data: ExtractedResumeData): number {
  const leak =
    (data.projects || []).some((p) =>
      /\b(marital|gender|dob|date of birth|father|mother|nationality)\b/i.test(
        String(p?.name || p?.description || '')
      )
    ) ||
    (data.achievements || []).some((a) =>
      /\b(marital|gender|dob|date of birth)\b/i.test(String(a || ''))
    );
  return leak ? 25 : 90;
}

/** Apply document-quality modifiers to section scores (never resume-specific). */
function applyDocumentModifiers(
  scores: UnifiedSectionConfidence,
  analysis?: DynamicDocumentAnalysis
): UnifiedSectionConfidence {
  if (!analysis) return scores;
  const next = { ...scores };
  const penalty = Math.max(0, 100 - analysis.overallConfidence) * 0.15;
  if (analysis.profile.signals.multiColumnLikely) {
    next.experience = clamp(next.experience - penalty);
    next.skills = clamp(next.skills - penalty * 0.5);
  }
  if (analysis.readingOrderConfidence < 60) {
    next.experience = clamp(next.experience - 8);
    next.projects = clamp(next.projects - 6);
  }
  if (analysis.ocrQualityScore < 50) {
    next.identity = clamp(next.identity - 10);
    next.contact = clamp(next.contact - 8);
  }
  return next;
}

function computeOverall(scores: Omit<UnifiedSectionConfidence, 'overall'>): number {
  const weights: Record<keyof Omit<UnifiedSectionConfidence, 'overall'>, number> = {
    identity: 0.12,
    contact: 0.08,
    summary: 0.08,
    experience: 0.22,
    education: 0.12,
    projects: 0.1,
    skills: 0.14,
    languages: 0.04,
    certifications: 0.04,
    achievements: 0.04,
    hobbies: 0.01,
    personalDetails: 0.01,
  };
  let sum = 0;
  let w = 0;
  for (const [k, weight] of Object.entries(weights)) {
    sum += (scores as Record<string, number>)[k] * weight;
    w += weight;
  }
  return clamp(w > 0 ? sum / w : 0);
}

/**
 * Score every section with a unified confidence model.
 * Optionally blends custom-parser per-section scores when available.
 */
export function computeUnifiedSectionConfidence(
  data: ExtractedResumeData,
  options: {
    rawText?: string;
    customSectionScores?: Record<string, number>;
    documentAnalysis?: DynamicDocumentAnalysis;
  } = {}
): UnifiedSectionConfidence {
  const rawText = String(options.rawText || data.rawText || '');
  const base = scoreExtractedSectionConfidence(data, rawText);

  const blend = (repairKey: RepairableSectionKey, customKey?: string): number => {
    const repair = base[repairKey];
    const custom = customKey ? options.customSectionScores?.[customKey] : undefined;
    if (typeof custom === 'number' && custom > 0) {
      return clamp(repair * 0.45 + custom * 0.55);
    }
    return repair;
  };

  const partial: Omit<UnifiedSectionConfidence, 'overall'> = {
    identity: scoreIdentity(data),
    contact: scoreContact(data),
    summary: blend('summary', 'summary'),
    experience: blend('experience', 'experience'),
    education: blend('education', 'education'),
    projects: blend('projects', 'projects'),
    skills: blend('skills', 'skills'),
    languages: blend('languages', 'languages'),
    certifications: blend('certifications', 'certifications'),
    achievements: blend('achievements'),
    hobbies: scoreHobbies(data, rawText),
    personalDetails: scorePersonalDetails(data),
  };

  const modified = applyDocumentModifiers(
    { ...partial, overall: 0 },
    options.documentAnalysis
  );
  modified.overall = computeOverall(modified);
  return modified;
}

export type HybridRepairTier = 'none' | 'section-only' | 'full-fallback';

/**
 * Decide how much OpenAI involvement is needed — custom parser stays primary.
 */
export function selectHybridRepairTier(
  scores: UnifiedSectionConfidence,
  threshold = SECTION_REPAIR_CONFIDENCE_THRESHOLD
): HybridRepairTier {
  if (scores.overall >= 75) return 'none';
  const weakCount = (Object.keys(scores) as UnifiedSectionKey[]).filter(
    (k) => k !== 'overall' && k !== 'personalDetails' && scores[k] < threshold
  ).length;
  if (weakCount === 0) return 'none';
  if (scores.overall >= 50 || weakCount <= 3) return 'section-only';
  return 'section-only';
}

/** Sections to hand to OpenAI repairWeakSections — never the whole resume. */
export function selectSectionsForHybridRepair(
  data: ExtractedResumeData,
  scores: UnifiedSectionConfidence,
  rawText?: string,
  threshold = SECTION_REPAIR_CONFIDENCE_THRESHOLD
): RepairableSectionKey[] {
  const repairScores: SectionConfidenceMap = {
    summary: scores.summary,
    experience: scores.experience,
    education: scores.education,
    projects: scores.projects,
    skills: scores.skills,
    languages: scores.languages,
    certifications: scores.certifications,
    achievements: scores.achievements,
  };
  return selectWeakSectionsForRepair(repairScores, data, rawText, threshold);
}

/** Merge strategy: keep highest-confidence source per section (metadata only). */
export function pickHigherConfidenceSection<T>(
  customValue: T | undefined,
  repairedValue: T | undefined,
  customConfidence: number,
  repairedConfidence: number
): T | undefined {
  if (customValue == null && repairedValue == null) return undefined;
  if (customValue == null) return repairedValue;
  if (repairedValue == null) return customValue;
  return repairedConfidence > customConfidence ? repairedValue : customValue;
}
