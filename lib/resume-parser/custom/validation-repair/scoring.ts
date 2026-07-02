/**
 * Resume quality and parser confidence scoring.
 */

import type {
  RepairReport,
  SectionConfidenceScores,
  ValidationReport,
} from './types';

export interface QualityScoreInput {
  sectionConfidence: SectionConfidenceScores;
  validationReport: ValidationReport;
  repairReport: RepairReport;
  parserConfidence?: number;
  hasIdentity: boolean;
  hasSummary: boolean;
  experienceCount: number;
  projectCount: number;
  educationCount: number;
  skillCount: number;
  sectionPresence?: SectionPresenceFlags;
}

export interface SectionPresenceFlags {
  languages: boolean;
  certifications: boolean;
  projects: boolean;
}

const SECTION_WEIGHTS: Record<keyof SectionConfidenceScores, number> = {
  identity: 0.18,
  summary: 0.08,
  experience: 0.22,
  projects: 0.12,
  education: 0.15,
  skills: 0.15,
  languages: 0.05,
  certifications: 0.05,
};

const SECTION_HEADING_PATTERNS: Record<keyof SectionPresenceFlags, RegExp[]> = {
  languages: [
    /^languages?\s*:?\s*$/i,
    /^language\s+proficiency\s*:?\s*$/i,
    /^spoken\s+languages?\s*:?\s*$/i,
  ],
  certifications: [
    /^certifications?\s*(?:and\s+licenses?)?\s*:?\s*$/i,
    /^licenses?\s*(?:and\s+certifications?)?\s*:?\s*$/i,
    /^professional\s+certifications?\s*:?\s*$/i,
    /^certificates?\s*:?\s*$/i,
  ],
  projects: [
    /^projects?\s*:?\s*$/i,
    /^personal\s+projects?\s*:?\s*$/i,
    /^academic\s+projects?\s*:?\s*$/i,
    /^key\s+projects?\s*:?\s*$/i,
    /^major\s+projects?\s*:?\s*$/i,
  ],
};

/** Detect whether optional sections exist in source text (not parser output). */
export function inferSectionPresence(input: {
  rawText?: string;
  sectionTexts?: {
    projects?: string;
    languages?: string;
    certifications?: string;
  };
  projectCount?: number;
  languageCount?: number;
  certificationCount?: number;
}): SectionPresenceFlags {
  const raw = input.rawText || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  const hasHeading = (patterns: RegExp[]) =>
    lines.some((line) => line.length <= 60 && patterns.some((re) => re.test(line)));

  return {
    languages:
      (input.languageCount ?? 0) > 0 ||
      Boolean(input.sectionTexts?.languages?.trim()) ||
      hasHeading(SECTION_HEADING_PATTERNS.languages),
    certifications:
      (input.certificationCount ?? 0) > 0 ||
      Boolean(input.sectionTexts?.certifications?.trim()) ||
      hasHeading(SECTION_HEADING_PATTERNS.certifications),
    projects:
      (input.projectCount ?? 0) > 0 ||
      Boolean(input.sectionTexts?.projects?.trim()) ||
      hasHeading(SECTION_HEADING_PATTERNS.projects),
  };
}

function getActiveWeights(presence?: SectionPresenceFlags): Record<keyof SectionConfidenceScores, number> {
  const weights = { ...SECTION_WEIGHTS };
  if (presence) {
    if (!presence.languages) weights.languages = 0;
    if (!presence.certifications) weights.certifications = 0;
    if (!presence.projects) weights.projects = 0;
  }
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights;
  const normalized = { ...weights };
  for (const key of Object.keys(normalized) as Array<keyof SectionConfidenceScores>) {
    normalized[key] = weights[key] / sum;
  }
  return normalized;
}

function computeWeightedScore(
  sectionConfidence: SectionConfidenceScores,
  presence?: SectionPresenceFlags
): number {
  const weights = getActiveWeights(presence);
  let weighted = 0;
  for (const key of Object.keys(weights) as Array<keyof SectionConfidenceScores>) {
    weighted += sectionConfidence[key] * weights[key];
  }
  return weighted;
}

export function computeSectionConfidence(input: {
  identityScore: number;
  summaryScore: number;
  experienceScore: number;
  projectsScore: number;
  educationScore: number;
  skillsScore: number;
  languagesScore: number;
  certificationsScore: number;
}): SectionConfidenceScores {
  return {
    identity: input.identityScore,
    summary: input.summaryScore,
    experience: input.experienceScore,
    projects: input.projectsScore,
    education: input.educationScore,
    skills: input.skillsScore,
    languages: input.languagesScore,
    certifications: input.certificationsScore,
  };
}

export function computeParserConfidenceScore(
  sectionConfidence: SectionConfidenceScores,
  parserConfidence?: number,
  sectionPresence?: SectionPresenceFlags
): number {
  const weighted = computeWeightedScore(sectionConfidence, sectionPresence);

  const blended =
    typeof parserConfidence === 'number' && parserConfidence > 0
      ? weighted * 0.7 + parserConfidence * 0.3
      : weighted;

  return Math.min(100, Math.max(0, Math.round(blended)));
}

export function computeResumeQualityScore(input: QualityScoreInput): number {
  const { sectionConfidence, validationReport, repairReport, sectionPresence } = input;

  let base = computeWeightedScore(sectionConfidence, sectionPresence);

  const completenessBonus =
    (input.hasIdentity ? 4 : 0) +
    (input.hasSummary ? 2 : 0) +
    (input.experienceCount > 0 ? 3 : 0) +
    (input.educationCount > 0 ? 2 : 0) +
    (input.skillCount >= 3 ? 2 : 0);

  base = Math.min(100, base + completenessBonus);

  const errorPenalty = validationReport.errors.length * 6;
  const warningPenalty = validationReport.warnings.length * 2;
  const manualPenalty = validationReport.manualReview.length * 3;
  const repairPenalty = Math.min(15, repairReport.repairCount * 1.5);

  const score = base - errorPenalty - warningPenalty - manualPenalty - repairPenalty;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function buildValidationReport(
  issues: ValidationReport['errors'],
  sectionConfidence: SectionConfidenceScores
): ValidationReport {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const manualReview = issues.filter((i) => i.severity === 'manual_review');

  return {
    errors,
    warnings,
    manualReview,
    sectionConfidence,
  };
}

export function buildRepairReport(repairs: RepairReport['repairs']): RepairReport {
  return {
    repairs,
    repairCount: repairs.length,
  };
}
