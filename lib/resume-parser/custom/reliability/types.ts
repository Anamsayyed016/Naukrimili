/**
 * Regression, Stress & Compatibility Framework — types.
 */

import type { BenchmarkEvaluationReport } from '../benchmark/types';
import type { ValidationRepairResult } from '../validation-repair/types';
import type { CanonicalResume } from '../canonical-resume/types';

export const RELIABILITY_FRAMEWORK_VERSION = '1.0.0';

export type ReliabilityTestCategory =
  | 'ats'
  | 'one_column'
  | 'two_column'
  | 'three_column'
  | 'executive'
  | 'academic'
  | 'fresher'
  | 'experienced'
  | 'government'
  | 'international'
  | 'healthcare'
  | 'it'
  | 'mba'
  | 'creative'
  | 'ocr_scanned'
  | 'low_quality_ocr'
  | 'multi_page'
  | 'very_large'
  | 'docx'
  | 'pdf'
  | 'mixed_formatting'
  | 'tables'
  | 'icons'
  | 'unicode'
  | 'multiple_languages'
  | 'empty_sections'
  | 'missing_sections'
  | 'duplicate_sections';

export type RegressionModuleId =
  | 'identity'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'validation'
  | 'canonical';

export type CompatibilityProfile =
  | 'windows_pdf'
  | 'mac_pdf'
  | 'libreoffice_docx'
  | 'microsoft_word_docx'
  | 'google_docs_docx'
  | 'ocr_pdf'
  | 'scanned_image'
  | 'unicode_text'
  | 'rtl_safe';

export type StressScale = 100 | 500 | 1000 | 5000;

export interface QualityGateThresholds {
  identityAccuracy: number;
  experienceAccuracy: number;
  projectsAccuracy: number;
  educationAccuracy: number;
  skillsAccuracy: number;
  overallAccuracy: number;
  maxAverageParseTimeMs: number;
  maxFailureRate: number;
}

export const DEFAULT_QUALITY_GATES: QualityGateThresholds = {
  identityAccuracy: 99,
  experienceAccuracy: 97,
  projectsAccuracy: 95,
  educationAccuracy: 97,
  skillsAccuracy: 95,
  overallAccuracy: 95,
  maxAverageParseTimeMs: 2000,
  maxFailureRate: 1,
};

export interface ReliabilityFixture {
  id: string;
  name: string;
  description?: string;
  categories: ReliabilityTestCategory[];
  compatibilityProfiles?: CompatibilityProfile[];
  format?: 'text' | 'pdf' | 'docx';
  rawText: string;
  groundTruth?: import('../benchmark/types').GroundTruthResume;
  validationExpectation?: import('../benchmark/types').GroundTruthValidationExpectation;
  skillExpectations?: import('../benchmark/types').GroundTruthSkillExpectation[];
  /** Expected modules to exercise */
  modules: RegressionModuleId[];
}

export interface ParsePerformanceSample {
  fixtureId: string;
  parseTimeMs: number;
  heapDeltaBytes: number;
  cpuUserMicros: number;
  cpuSystemMicros: number;
  succeeded: boolean;
  recovered: boolean;
  errorMessage?: string;
}

export interface StressRunResult {
  scale: StressScale;
  sampleCount: number;
  parseTimeMs: {
    average: number;
    min: number;
    max: number;
    p95: number;
    worstCase: number;
  };
  memory: {
    averageHeapDeltaBytes: number;
    peakHeapDeltaBytes: number;
  };
  cpu: {
    averageUserMicros: number;
    averageSystemMicros: number;
  };
  failureRate: number;
  recoveryRate: number;
  samples: ParsePerformanceSample[];
}

export interface ModuleRegressionResult {
  module: RegressionModuleId;
  caseCount: number;
  passed: number;
  failed: number;
  passRate: number;
  averageAccuracy: number;
  failures: Array<{ fixtureId: string; reason: string }>;
}

export interface RegressionReport {
  modules: ModuleRegressionResult[];
  totalCases: number;
  totalPassed: number;
  totalFailed: number;
  passRate: number;
  regressionsDetected: boolean;
}

export interface CompatibilityCaseResult {
  fixtureId: string;
  profile: CompatibilityProfile;
  categories: ReliabilityTestCategory[];
  passed: boolean;
  issues: string[];
  parseTimeMs: number;
}

export interface CompatibilityReport {
  cases: CompatibilityCaseResult[];
  passed: number;
  failed: number;
  passRate: number;
  byProfile: Record<string, { passed: number; failed: number }>;
}

export interface PerformanceReport {
  averageParseTimeMs: number;
  worstCaseParseTimeMs: number;
  p95ParseTimeMs: number;
  averageHeapDeltaBytes: number;
  peakHeapDeltaBytes: number;
  throughputPerSecond: number;
}

export interface FailureRecord {
  fixtureId: string;
  phase: 'parse' | 'validation' | 'canonical' | 'benchmark';
  error: string;
  categories: ReliabilityTestCategory[];
}

export interface FailureReport {
  failures: FailureRecord[];
  failureRate: number;
  byPhase: Record<string, number>;
}

export interface RecoveryRecord {
  fixtureId: string;
  repairCount: number;
  validationErrors: number;
  recovered: boolean;
}

export interface RecoveryReport {
  records: RecoveryRecord[];
  recoveryRate: number;
  totalRepairs: number;
}

export interface QualityGateResult {
  gates: QualityGateThresholds;
  passed: boolean;
  checks: Array<{
    gate: string;
    target: number;
    actual: number;
    passed: boolean;
    unit?: string;
  }>;
}

export interface ParserStabilityScore {
  score: number;
  regressionPassRate: number;
  stressFailureRate: number;
  compatibilityPassRate: number;
  variancePenalty: number;
}

export interface ProductionReadinessScore {
  score: number;
  stability: ParserStabilityScore;
  qualityGates: QualityGateResult;
  accuracyScore: number;
  performanceScore: number;
  reliabilityScore: number;
  compatibilityScore: number;
  readyForProduction: boolean;
  blockers: string[];
}

export interface CustomParserPipelineResult {
  validation: ValidationRepairResult;
  canonical: CanonicalResume;
  parseTimeMs: number;
  heapDeltaBytes: number;
  cpuUserMicros: number;
  cpuSystemMicros: number;
}

export interface ReliabilityRunOptions {
  deterministic?: boolean;
  stressScales?: StressScale[];
  qualityGates?: QualityGateThresholds;
  includeHumanReports?: boolean;
}

export interface ReliabilitySuiteReport {
  frameworkVersion: string;
  runAt: string;
  regression: RegressionReport;
  stress: StressRunResult[];
  compatibility: CompatibilityReport;
  performance: PerformanceReport;
  failures: FailureReport;
  recovery: RecoveryReport;
  benchmark: {
    meanOverallAccuracy: number;
    evaluations: BenchmarkEvaluationReport[];
  };
  stability: ParserStabilityScore;
  readiness: ProductionReadinessScore;
  humanReport: string;
}
