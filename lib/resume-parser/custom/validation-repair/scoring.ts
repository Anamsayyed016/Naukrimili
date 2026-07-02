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
  parserConfidence?: number
): number {
  const weighted =
    sectionConfidence.identity * SECTION_WEIGHTS.identity +
    sectionConfidence.summary * SECTION_WEIGHTS.summary +
    sectionConfidence.experience * SECTION_WEIGHTS.experience +
    sectionConfidence.projects * SECTION_WEIGHTS.projects +
    sectionConfidence.education * SECTION_WEIGHTS.education +
    sectionConfidence.skills * SECTION_WEIGHTS.skills +
    sectionConfidence.languages * SECTION_WEIGHTS.languages +
    sectionConfidence.certifications * SECTION_WEIGHTS.certifications;

  const blended =
    typeof parserConfidence === 'number' && parserConfidence > 0
      ? weighted * 0.7 + parserConfidence * 0.3
      : weighted;

  return Math.min(100, Math.max(0, Math.round(blended)));
}

export function computeResumeQualityScore(input: QualityScoreInput): number {
  const { sectionConfidence, validationReport, repairReport } = input;

  let base =
    sectionConfidence.identity * SECTION_WEIGHTS.identity +
    sectionConfidence.summary * SECTION_WEIGHTS.summary +
    sectionConfidence.experience * SECTION_WEIGHTS.experience +
    sectionConfidence.projects * SECTION_WEIGHTS.projects +
    sectionConfidence.education * SECTION_WEIGHTS.education +
    sectionConfidence.skills * SECTION_WEIGHTS.skills +
    sectionConfidence.languages * SECTION_WEIGHTS.languages +
    sectionConfidence.certifications * SECTION_WEIGHTS.certifications;

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
