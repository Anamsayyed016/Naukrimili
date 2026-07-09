/**
 * Confidence-driven hybrid repair — score deterministic ExtractedResumeData sections,
 * then repair ONLY weak sections via OpenAI (never full-document reparse).
 *
 * Reuses existing validators from import-sanitize / text-recovery heuristics.
 * Does not invent data: OpenAI patches are filtered through the same plausibility gates.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import type { HybridResumeAI } from '@/lib/hybrid-resume-ai';
import {
  isPersonalMetadataResumeLine,
  isPlaceholderProjectTitle,
  isPlausibleExperienceCompany,
  isPlausiblePersonName,
  isPlausibleProjectName,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';
import { normalizeExtractedResumeData } from '@/lib/resume-parser/normalize-extracted';

export type RepairableSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'achievements';

export type SectionConfidenceMap = Record<RepairableSectionKey, number>;

/** Below this score, a section may be handed to OpenAI for repair (if evidence exists in text). */
export const SECTION_REPAIR_CONFIDENCE_THRESHOLD = 55;

const SECTION_HEADING_RE: Record<RepairableSectionKey, RegExp> = {
  summary:
    /\b(professional\s+summary|executive\s+summary|career\s+objective|summary|profile|about\s+me|objective)\b/i,
  experience:
    /\b(work\s+experience|professional\s+experience|employment(?:\s+history)?|professional\s+journey|experience)\b/i,
  education: /\b(education|academic(?:\s+background)?|qualifications?)\b/i,
  projects: /\b(key\s+projects|personal\s+projects|academic\s+projects|projects?)\b/i,
  skills: /\b(technical\s+skills|key\s+skills|core\s+competenc|skills?|expertise)\b/i,
  languages: /\b(languages?\s+known|spoken\s+languages?|language\s+proficiency|languages?)\b/i,
  certifications: /\b(certifications?|certificates?|licenses?)\b/i,
  achievements: /\b(key\s+achievements|achievements?|awards?|honors?|accomplishments?)\b/i,
};

function hasSectionEvidence(rawText: string, key: RepairableSectionKey): boolean {
  const text = rawText || '';
  if (!text.trim()) return false;
  return SECTION_HEADING_RE[key].test(text);
}

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function scoreSummary(data: ExtractedResumeData, rawText: string): number {
  const summary = String(data.summary || '').trim();
  if (summary.length >= 80) return 90;
  if (summary.length >= 40) return 70;
  if (summary.length >= 15) return 50;
  if (hasSectionEvidence(rawText, 'summary')) return 20;
  return 85;
}

function scoreExperience(data: ExtractedResumeData, rawText: string): number {
  const rows = Array.isArray(data.experience) ? data.experience : [];
  if (rows.length === 0) {
    return hasSectionEvidence(rawText, 'experience') ? 15 : 85;
  }
  let points = 0;
  let max = 0;
  for (const exp of rows) {
    max += 4;
    const company = String(exp.company || '').trim();
    const position = String(exp.position || '').trim();
    const desc = String(exp.description || '').trim();
    if (company && isPlausibleExperienceCompany(company)) points += 1;
    if (position && looksLikeJobTitleLine(position)) points += 1;
    else if (position.length >= 3) points += 0.5;
    if (desc.length >= 40) points += 1;
    else if (desc.length >= 12) points += 0.5;
    if (exp.startDate || exp.endDate || exp.current) points += 1;
  }
  const ratio = max > 0 ? points / max : 0;
  return clampScore(ratio * 100);
}

function scoreEducation(data: ExtractedResumeData, rawText: string): number {
  const rows = Array.isArray(data.education) ? data.education : [];
  if (rows.length === 0) {
    return hasSectionEvidence(rawText, 'education') ? 20 : 85;
  }
  let good = 0;
  for (const edu of rows) {
    const institution = String(edu.institution || '').trim();
    const degree = String(edu.degree || '').trim();
    if (institution.length >= 3 || degree.length >= 3) good += 1;
  }
  return clampScore((good / rows.length) * 100);
}

function scoreProjects(data: ExtractedResumeData, rawText: string): number {
  const rows = Array.isArray(data.projects) ? data.projects : [];
  if (rows.length === 0) {
    return hasSectionEvidence(rawText, 'projects') ? 18 : 88;
  }
  let good = 0;
  for (const p of rows) {
    const name = String(p.name || '').trim();
    if (
      name &&
      isPlausibleProjectName(name) &&
      !isPlaceholderProjectTitle(name) &&
      !isPersonalMetadataResumeLine(name)
    ) {
      good += 1;
    }
  }
  return clampScore((good / rows.length) * 100);
}

function scoreSkills(data: ExtractedResumeData, rawText: string): number {
  const skills = Array.isArray(data.skills) ? data.skills.filter((s) => String(s || '').trim()) : [];
  if (skills.length >= 8) return 92;
  if (skills.length >= 4) return 75;
  if (skills.length >= 1) return 45;
  if (hasSectionEvidence(rawText, 'skills')) return 15;
  // Skills often appear only inside experience — still try repair if experience exists
  if ((data.experience?.length || 0) > 0) return 40;
  return 80;
}

function scoreLanguages(data: ExtractedResumeData, rawText: string): number {
  const langs = Array.isArray(data.languages) ? data.languages : [];
  if (langs.length > 0) return 90;
  return hasSectionEvidence(rawText, 'languages') ? 20 : 88;
}

function scoreCertifications(data: ExtractedResumeData, rawText: string): number {
  const certs = Array.isArray(data.certifications) ? data.certifications : [];
  if (certs.length > 0) {
    const named = certs.filter((c) => String(c?.name || '').trim().length >= 3);
    return named.length > 0 ? 88 : 35;
  }
  return hasSectionEvidence(rawText, 'certifications') ? 22 : 88;
}

function scoreAchievements(data: ExtractedResumeData, rawText: string): number {
  const rows = Array.isArray(data.achievements) ? data.achievements : [];
  if (rows.length === 0) {
    return hasSectionEvidence(rawText, 'achievements') ? 25 : 88;
  }
  let good = 0;
  for (const raw of rows) {
    const text =
      typeof raw === 'string'
        ? raw.trim()
        : String((raw as { title?: string; description?: string })?.title || '').trim();
    if (text && !isPersonalMetadataResumeLine(text) && !isPlaceholderProjectTitle(text)) {
      good += 1;
    }
  }
  return clampScore((good / Math.max(1, rows.length)) * 100);
}

/** Score every repairable section on deterministic parser output. */
export function scoreExtractedSectionConfidence(
  data: ExtractedResumeData,
  rawText?: string
): SectionConfidenceMap {
  const text = String(rawText || data.rawText || '');
  return {
    summary: scoreSummary(data, text),
    experience: scoreExperience(data, text),
    education: scoreEducation(data, text),
    projects: scoreProjects(data, text),
    skills: scoreSkills(data, text),
    languages: scoreLanguages(data, text),
    certifications: scoreCertifications(data, text),
    achievements: scoreAchievements(data, text),
  };
}

/** Sections that are weak AND have evidence in the source text (or skills from experience). */
export function selectWeakSectionsForRepair(
  scores: SectionConfidenceMap,
  data: ExtractedResumeData,
  rawText?: string,
  threshold = SECTION_REPAIR_CONFIDENCE_THRESHOLD
): RepairableSectionKey[] {
  const text = String(rawText || data.rawText || '');
  const weak: RepairableSectionKey[] = [];
  for (const key of Object.keys(scores) as RepairableSectionKey[]) {
    if (scores[key] >= threshold) continue;
    if (key === 'skills') {
      if (
        hasSectionEvidence(text, 'skills') ||
        (data.experience?.length || 0) > 0 ||
        (data.projects?.length || 0) > 0
      ) {
        weak.push(key);
      }
      continue;
    }
    if (!hasSectionEvidence(text, key) && scores[key] > 30) continue;
    if (!hasSectionEvidence(text, key) && (data as Record<string, unknown>)[key] == null) {
      // Empty optional section with no heading — skip
      if (key !== 'experience' && key !== 'education' && key !== 'summary') continue;
    }
    if (hasSectionEvidence(text, key) || scores[key] < 35) {
      weak.push(key);
    }
  }
  return weak;
}

function filterRepairedProjects(
  projects: ExtractedResumeData['projects']
): ExtractedResumeData['projects'] {
  if (!Array.isArray(projects)) return [];
  return projects.filter((p) => {
    const name = String(p?.name || '').trim();
    return (
      !!name &&
      isPlausibleProjectName(name) &&
      !isPlaceholderProjectTitle(name) &&
      !isPersonalMetadataResumeLine(name)
    );
  });
}

function filterRepairedAchievements(achievements: string[] | undefined): string[] {
  if (!Array.isArray(achievements)) return [];
  return achievements
    .map((a) => String(a || '').trim())
    .filter((a) => a.length >= 8 && !isPersonalMetadataResumeLine(a) && !isPlaceholderProjectTitle(a));
}

function mergeSkills(existing: string[], incoming: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [...existing, ...incoming]) {
    const s = String(raw || '').trim();
    if (!s || isPersonalMetadataResumeLine(s)) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

/**
 * Merge OpenAI section patches into deterministic data.
 * Strong sections are never overwritten. Skills are unioned (deduped).
 */
export function mergeSectionRepairs(
  base: ExtractedResumeData,
  patch: Partial<ExtractedResumeData>,
  repairedKeys: RepairableSectionKey[]
): ExtractedResumeData {
  const next: ExtractedResumeData = { ...base };
  const keys = new Set(repairedKeys);

  if (keys.has('summary') && typeof patch.summary === 'string' && patch.summary.trim().length > 20) {
    if (!base.summary || base.summary.trim().length < patch.summary.trim().length) {
      next.summary = patch.summary.trim();
    }
  }

  if (keys.has('experience') && Array.isArray(patch.experience) && patch.experience.length > 0) {
    const usable = patch.experience.filter(
      (e) =>
        (String(e.company || '').trim() && isPlausibleExperienceCompany(String(e.company))) ||
        String(e.position || '').trim().length >= 3 ||
        String(e.description || '').trim().length >= 20
    );
    if (usable.length > 0) next.experience = usable;
  }

  if (keys.has('education') && Array.isArray(patch.education) && patch.education.length > 0) {
    const usable = patch.education.filter(
      (e) => String(e.institution || '').trim().length >= 3 || String(e.degree || '').trim().length >= 3
    );
    if (usable.length > 0) next.education = usable;
  }

  if (keys.has('projects') && Array.isArray(patch.projects)) {
    const filtered = filterRepairedProjects(patch.projects);
    if (filtered && filtered.length > 0) next.projects = filtered;
  }

  if (keys.has('skills') && Array.isArray(patch.skills) && patch.skills.length > 0) {
    next.skills = mergeSkills(base.skills || [], patch.skills);
  }

  if (keys.has('languages') && Array.isArray(patch.languages) && patch.languages.length > 0) {
    next.languages = patch.languages;
  }

  if (keys.has('certifications') && Array.isArray(patch.certifications) && patch.certifications.length > 0) {
    next.certifications = patch.certifications.filter((c) => String(c?.name || '').trim().length >= 3);
  }

  if (keys.has('achievements') && Array.isArray(patch.achievements)) {
    const filtered = filterRepairedAchievements(patch.achievements as string[]);
    if (filtered.length > 0) next.achievements = filtered;
  }

  if (base.fullName && isPlausiblePersonName(base.fullName)) {
    next.fullName = base.fullName;
  }

  return next;
}

export interface SectionConfidenceRepairResult {
  data: ExtractedResumeData;
  scores: SectionConfidenceMap;
  repairedSections: RepairableSectionKey[];
  skipped: boolean;
  reason?: string;
}

/**
 * Stage 1: keep deterministic data.
 * Stage 2: score sections.
 * Stage 3: OpenAI repairs ONLY weak sections (if HybridResumeAI available).
 */
export async function repairLowConfidenceSections(
  data: ExtractedResumeData,
  options: {
    rawText?: string;
    hybridAI?: HybridResumeAI | null;
    threshold?: number;
  } = {}
): Promise<SectionConfidenceRepairResult> {
  const rawText = String(options.rawText || data.rawText || '');
  const scores = scoreExtractedSectionConfidence(data, rawText);
  const weak = selectWeakSectionsForRepair(scores, data, rawText, options.threshold);

  if (weak.length === 0) {
    return { data, scores, repairedSections: [], skipped: true, reason: 'all_sections_confident' };
  }

  if (!options.hybridAI || !rawText || rawText.length < 80) {
    return {
      data,
      scores,
      repairedSections: [],
      skipped: true,
      reason: !options.hybridAI ? 'no_hybrid_ai' : 'raw_text_too_short',
    };
  }

  try {
    const patch = await options.hybridAI.repairWeakSections(rawText, weak, data);
    if (!patch || Object.keys(patch).length === 0) {
      return { data, scores, repairedSections: [], skipped: true, reason: 'empty_patch' };
    }
    const merged = mergeSectionRepairs(data, patch, weak);
    const normalized = normalizeExtractedResumeData({
      ...merged,
      rawText: merged.rawText || rawText,
    });
    return {
      data: normalized,
      scores,
      repairedSections: weak,
      skipped: false,
    };
  } catch (error) {
    console.warn(
      '[section-confidence-repair] OpenAI section repair failed — keeping deterministic output:',
      error instanceof Error ? error.message : error
    );
    return {
      data,
      scores,
      repairedSections: [],
      skipped: true,
      reason: 'repair_failed',
    };
  }
}
