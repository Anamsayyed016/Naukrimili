/**
 * Section and overall accuracy scoring.
 */

import { aggregateFieldStats } from './match';
import type {
  BenchmarkStatistics,
  CertificationsComparisonReport,
  EducationComparisonReport,
  ExperienceComparisonReport,
  FieldComparison,
  IdentityComparisonReport,
  LanguagesComparisonReport,
  ProjectComparisonReport,
  SectionAccuracyScores,
  SkillComparisonReport,
  SummaryComparisonReport,
  ValidationBenchmarkReport,
  CanonicalBenchmarkReport,
} from './types';

const SECTION_WEIGHTS = {
  identity: 0.14,
  summary: 0.08,
  experience: 0.22,
  projects: 0.1,
  education: 0.14,
  skills: 0.14,
  languages: 0.05,
  certifications: 0.05,
  validation: 0.04,
  canonical: 0.04,
} as const;

export interface SectionReportsForScoring {
  identity: IdentityComparisonReport;
  summary: SummaryComparisonReport;
  experience: ExperienceComparisonReport;
  projects: ProjectComparisonReport;
  education: EducationComparisonReport;
  skills: SkillComparisonReport;
  languages: LanguagesComparisonReport;
  certifications: CertificationsComparisonReport;
  validation: ValidationBenchmarkReport;
  canonical: CanonicalBenchmarkReport;
}

export interface ComputeSectionScoresOptions {
  includeValidation?: boolean;
  includeCanonical?: boolean;
}

export function computeSectionScores(
  reports: SectionReportsForScoring,
  options?: ComputeSectionScoresOptions
): SectionAccuracyScores {
  const identity = reports.identity.accuracy;
  const summary = reports.summary.accuracy;
  const experience = reports.experience.accuracy;
  const projects = reports.projects.accuracy;
  const education = reports.education.accuracy;
  const skills = reports.skills.accuracy;
  const languages = reports.languages.accuracy;
  const certifications = reports.certifications.accuracy;
  const validation = options?.includeValidation ? reports.validation.accuracy : 100;
  const canonical = options?.includeCanonical ? reports.canonical.accuracy : 100;

  const weights: Record<keyof typeof SECTION_WEIGHTS, number> = { ...SECTION_WEIGHTS };
  if (!options?.includeValidation) weights.validation = 0;
  if (!options?.includeCanonical) weights.canonical = 0;

  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const overall = Math.round(
    (identity * weights.identity +
      summary * weights.summary +
      experience * weights.experience +
      projects * weights.projects +
      education * weights.education +
      skills * weights.skills +
      languages * weights.languages +
      certifications * weights.certifications +
      validation * weights.validation +
      canonical * weights.canonical) /
      weightSum
  );

  return {
    identity,
    summary,
    experience,
    projects,
    education,
    skills,
    languages,
    certifications,
    validation,
    canonical,
    overall,
  };
}

export function collectAllFieldComparisons(reports: SectionReportsForScoring): FieldComparison[] {
  return [
    ...reports.identity.fields,
    ...reports.summary.fields,
    ...reports.experience.entries.flatMap((e) => e.fieldComparisons),
    ...reports.projects.entries.flatMap((e) => e.fieldComparisons),
    ...reports.education.entries.flatMap((e) => e.fieldComparisons),
    ...reports.skills.fields,
    ...reports.languages.entries.flatMap((e) => e.fieldComparisons),
    ...reports.certifications.entries.flatMap((e) => e.fieldComparisons),
    ...reports.validation.issues,
    ...reports.canonical.issues,
  ];
}

export function buildStatistics(
  fieldComparisons: FieldComparison[],
  parserConfidence: number,
  resumeQuality: number,
  validation: ValidationBenchmarkReport
): BenchmarkStatistics {
  const stats = aggregateFieldStats(fieldComparisons);
  return {
    totalFieldsCompared: fieldComparisons.length,
    matchedFields: stats.matchedFields,
    partialFields: stats.partialFields,
    missingFields: stats.missingFields,
    unexpectedFields: stats.unexpectedFields,
    parserConfidence,
    resumeQuality,
    repairCount: validation.repairCount,
    validationErrors: validation.errorCount,
    validationWarnings: validation.warningCount,
  };
}

export function emptyErrorClassCounts(): Record<string, number> {
  return {
    parser_missed_field: 0,
    boundary_detection_failure: 0,
    wrong_section: 0,
    incorrect_normalization: 0,
    duplicate: 0,
    ordering_issue: 0,
    repair_failure: 0,
    validation_rejection: 0,
    confidence_too_low: 0,
    unknown: 0,
  };
}
