/**
 * Benchmark & Evaluation Framework — types.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

import type { CanonicalResume } from '../canonical-resume/types';
import type { ValidationRepairResult } from '../validation-repair/types';

export const BENCHMARK_FRAMEWORK_VERSION = '1.0.0';

export type FieldMatchStatus = 'match' | 'partial' | 'missing' | 'unexpected';

export type BenchmarkErrorClass =
  | 'parser_missed_field'
  | 'boundary_detection_failure'
  | 'wrong_section'
  | 'incorrect_normalization'
  | 'duplicate'
  | 'ordering_issue'
  | 'repair_failure'
  | 'validation_rejection'
  | 'confidence_too_low'
  | 'unknown';

export type ResumeFixtureTag =
  | 'ats'
  | 'creative'
  | 'academic'
  | 'government'
  | 'international'
  | 'developer'
  | 'designer'
  | 'healthcare'
  | 'mba'
  | 'executive'
  | 'fresher'
  | 'experienced'
  | 'single_column'
  | 'two_column'
  | 'multi_page'
  | 'scanned_ocr'
  | 'docx'
  | 'pdf';

export type BenchmarkSectionId =
  | 'identity'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'validation'
  | 'canonical';

/** Ground truth resume — reuses ExtractedResumeData schema. */
export type GroundTruthResume = ExtractedResumeData;

export interface GroundTruthSkillExpectation {
  name: string;
  category?: string;
  importance?: number;
}

export interface GroundTruthValidationExpectation {
  maxErrors?: number;
  maxWarnings?: number;
  maxManualReview?: number;
  maxRepairs?: number;
  forbiddenIssueCodes?: string[];
}

export interface BenchmarkCase {
  id: string;
  name: string;
  description?: string;
  tags: ResumeFixtureTag[];
  format?: 'text' | 'pdf' | 'docx';
  rawText?: string;
  groundTruth: GroundTruthResume;
  skillExpectations?: GroundTruthSkillExpectation[];
  validationExpectation?: GroundTruthValidationExpectation;
}

export type BenchmarkActualOutput =
  | { kind: 'extracted'; data: ExtractedResumeData }
  | { kind: 'canonical'; resume: CanonicalResume }
  | { kind: 'validation'; result: ValidationRepairResult };

export interface BenchmarkEvaluateInput {
  caseId?: string;
  name?: string;
  tags?: ResumeFixtureTag[];
  groundTruth: GroundTruthResume;
  actual: BenchmarkActualOutput;
  rawText?: string;
  skillExpectations?: GroundTruthSkillExpectation[];
  validationExpectation?: GroundTruthValidationExpectation;
}

export interface BenchmarkRunOptions {
  /** Omit timestamps for repeatable JSON output. */
  deterministic?: boolean;
  includeHumanReport?: boolean;
}

export interface FieldComparison {
  section: BenchmarkSectionId | string;
  field: string;
  index?: number;
  expected: string;
  actual: string;
  status: FieldMatchStatus;
  similarity: number;
  confidence?: number;
  errorClass: BenchmarkErrorClass;
  message: string;
}

export interface EntryComparisonSummary {
  expectedIndex?: number;
  actualIndex?: number;
  matched: boolean;
  orderCorrect?: boolean;
  fieldComparisons: FieldComparison[];
  missingFields: string[];
  unexpectedFields: string[];
}

export interface SectionAccuracyScore {
  section: BenchmarkSectionId;
  accuracy: number;
  matchedFields: number;
  partialFields: number;
  missingFields: number;
  unexpectedFields: number;
  totalExpectedFields: number;
}

export interface SectionAccuracyScores {
  identity: number;
  summary: number;
  experience: number;
  projects: number;
  education: number;
  skills: number;
  languages: number;
  certifications: number;
  validation: number;
  canonical: number;
  overall: number;
}

export interface IdentityComparisonReport {
  fields: FieldComparison[];
  accuracy: number;
}

export interface SummaryComparisonReport {
  fields: FieldComparison[];
  paragraphCountExpected: number;
  paragraphCountActual: number;
  bulletPreserved: boolean;
  accuracy: number;
}

export interface ExperienceComparisonReport {
  entries: EntryComparisonSummary[];
  missingEntries: number;
  extraEntries: number;
  orderingIssues: number;
  accuracy: number;
}

export interface ProjectComparisonReport {
  entries: EntryComparisonSummary[];
  missingEntries: number;
  extraEntries: number;
  accuracy: number;
}

export interface EducationComparisonReport {
  entries: EntryComparisonSummary[];
  missingEntries: number;
  extraEntries: number;
  accuracy: number;
}

export interface SkillComparisonReport {
  fields: FieldComparison[];
  missingSkills: string[];
  unexpectedSkills: string[];
  duplicateSkills: string[];
  accuracy: number;
}

export interface LanguagesComparisonReport {
  entries: EntryComparisonSummary[];
  accuracy: number;
}

export interface CertificationsComparisonReport {
  entries: EntryComparisonSummary[];
  accuracy: number;
}

export interface ValidationBenchmarkReport {
  accuracy: number;
  errorCount: number;
  warningCount: number;
  manualReviewCount: number;
  repairCount: number;
  expectationMet: boolean;
  issues: FieldComparison[];
}

export interface CanonicalBenchmarkReport {
  accuracy: number;
  nodeCountExpected: number;
  nodeCountActual: number;
  stableIds: boolean;
  metadataPresent: boolean;
  issues: FieldComparison[];
}

export interface ClassifiedMismatch {
  errorClass: BenchmarkErrorClass;
  section: string;
  field?: string;
  index?: number;
  message: string;
  expected?: string;
  actual?: string;
}

export interface BenchmarkStatistics {
  totalFieldsCompared: number;
  matchedFields: number;
  partialFields: number;
  missingFields: number;
  unexpectedFields: number;
  parserConfidence: number;
  resumeQuality: number;
  repairCount: number;
  validationErrors: number;
  validationWarnings: number;
}

export interface AccuracyTrendPoint {
  caseId: string;
  overallAccuracy: number;
  parserConfidence: number;
  resumeQuality: number;
}

export interface BenchmarkEvaluationReport {
  frameworkVersion: string;
  caseId?: string;
  caseName?: string;
  tags?: ResumeFixtureTag[];
  evaluatedAt: string;
  overallAccuracy: number;
  sectionScores: SectionAccuracyScores;
  fieldComparisons: FieldComparison[];
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
  mismatches: ClassifiedMismatch[];
  statistics: BenchmarkStatistics;
  humanReport: string;
}

export interface BenchmarkSuiteReport {
  frameworkVersion: string;
  runAt: string;
  caseCount: number;
  cases: BenchmarkEvaluationReport[];
  aggregate: {
    meanOverallAccuracy: number;
    meanParserConfidence: number;
    meanResumeQuality: number;
    accuracyTrend: AccuracyTrendPoint[];
    errorClassCounts: Record<BenchmarkErrorClass, number>;
  };
  humanReport: string;
}

/** Future external parser comparison slot — not wired yet. */
export type ExternalParserId = 'affinda' | 'apilayer' | 'hybrid';

export interface ExternalParserComparator {
  id: ExternalParserId;
  label: string;
  /** Reserved for future benchmark runs against legacy parsers. */
  parse: (rawText: string) => Promise<ExtractedResumeData>;
}

export interface ResolvedBenchmarkActual {
  extracted: ExtractedResumeData;
  canonical?: CanonicalResume;
  validation?: ValidationRepairResult;
  intelligentSkills?: import('../skills-intelligence/types').IntelligentSkill[];
}
