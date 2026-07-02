/**
 * Custom resume parser — public surface (foundation).
 *
 * Production code must not import this module until explicit integration.
 */

export { parseResume } from './custom-resume-parser';
export { detectResumeSections, SECTION_DETECTION_VERSION } from './section-detection';
export type {
  CustomSectionBlock,
  DetectedResumeSections,
  DetectedSectionBlock,
  NormalizedSectionType,
  SectionCoverageReport,
} from './section-detection';

export {
  EXPERIENCE_EXTRACTION_VERSION,
  extractCanonicalExperiences,
  extractExperiencesFromSection,
  extractExperiencesWithMeta,
  toCanonicalExperience,
} from './experience-extraction';
export type {
  CanonicalExperience,
  CustomExtractedExperience,
  ExperienceExtractionResult,
  ExperienceFieldConfidence,
} from './experience-extraction';

export {
  PROJECT_EXTRACTION_VERSION,
  extractCanonicalProjects,
  extractProjectsFromSection,
  extractProjectsWithMeta,
  toCanonicalProject,
} from './project-extraction';
export type {
  CanonicalProject,
  CustomExtractedProject,
  ProjectExtractionResult,
  ProjectFieldConfidence,
} from './project-extraction';

export {
  IDENTITY_EXTRACTION_VERSION,
  extractCanonicalIdentity,
  extractIdentityFromSections,
  extractIdentityWithMeta,
  toCanonicalIdentity,
} from './identity-extraction';
export type {
  CanonicalIdentity,
  CustomExtractedIdentity,
  IdentityExtractionInput,
  IdentityExtractionResult,
  IdentityFieldConfidence,
} from './identity-extraction';

export {
  SUMMARY_EXTRACTION_VERSION,
  extractCanonicalSummary,
  extractSummaryFromSection,
  extractSummaryWithMeta,
  toCanonicalSummary,
} from './summary-extraction';
export type {
  CanonicalSummary,
  CustomExtractedSummary,
  SummaryExtractionInput,
  SummaryExtractionResult,
  SummaryFieldConfidence,
} from './summary-extraction';

export {
  EDUCATION_EXTRACTION_VERSION,
  extractCanonicalEducation,
  extractEducationFromSection,
  extractEducationWithMeta,
  toCanonicalEducation,
} from './education-extraction';
export type {
  CanonicalEducation,
  CustomExtractedEducation,
  EducationExtractionResult,
  EducationFieldConfidence,
} from './education-extraction';

export {
  SKILLS_INTELLIGENCE_VERSION,
  extractCanonicalSkills,
  extractSkillsIntelligence,
  extractSkillsWithMeta,
  toCanonicalSkills,
} from './skills-intelligence';
export type {
  CanonicalSkills,
  IntelligentSkill,
  SkillCategory,
  SkillSource,
  SkillsIntelligenceInput,
  SkillsIntelligenceResult,
} from './skills-intelligence';

export {
  VALIDATION_REPAIR_VERSION,
  validateAndRepairResume,
  validateAndRepairIdentity,
  validateAndRepairSummary,
  validateAndRepairExperiences,
  validateAndRepairProjects,
  validateAndRepairEducation,
  validateAndRepairSkills,
  validateChronology,
  crossCheckSections,
  assembleValidatedResume,
  computeParserConfidenceScore,
  computeResumeQualityScore,
  computeSectionConfidence,
  createRepairContext,
  recordIssue,
  recordRepair,
} from './validation-repair';
export type {
  EvidenceSource,
  RepairContext,
  RepairRecord,
  RepairReport,
  SectionConfidenceScores,
  ValidatedResumeBundle,
  ValidationIssue,
  ValidationRepairInput,
  ValidationRepairResult,
  ValidationReport,
  ValidationSeverity,
} from './validation-repair';

export {
  CANONICAL_RESUME_VERSION,
  buildCanonicalResume,
  buildCanonicalResumeFromValidation,
  serializeCanonicalResume,
  deserializeCanonicalResume,
  serializeBuilderResume,
  parseBuilderResume,
  toExtractedResumeData,
  freezeCanonicalResume,
  deterministicNodeId,
  experienceNodeId,
  projectNodeId,
  educationNodeId,
  skillNodeId,
} from './canonical-resume';
export type {
  BuildCanonicalResumeInput,
  CanonicalResume,
  CanonicalResumeMetadata,
  CanonicalResumeSnapshot,
  CanonicalExperienceNode,
  CanonicalProjectNode,
  CanonicalEducationNode,
  CanonicalSkillNode,
  QualityMetadata,
  RejectedDiagnosticEntry,
} from './canonical-resume';

export {
  BENCHMARK_FRAMEWORK_VERSION,
  evaluateParserOutput,
  runBenchmarkCase,
  runBenchmarkSuite,
  evaluationReportToJson,
  suiteReportToJson,
  BENCHMARK_FIXTURES,
  getBenchmarkFixture,
  listBenchmarkFixtures,
} from './benchmark';
export type {
  BenchmarkActualOutput,
  BenchmarkCase,
  BenchmarkEvaluationReport,
  BenchmarkSuiteReport,
  BenchmarkRunOptions,
  GroundTruthResume,
  FieldComparison,
  FieldMatchStatus,
  BenchmarkErrorClass,
  ResumeFixtureTag,
  SectionAccuracyScores,
} from './benchmark';

export {
  RELIABILITY_FRAMEWORK_VERSION,
  DEFAULT_QUALITY_GATES,
  runReliabilitySuite,
  reliabilityReportToJson,
  runRegressionSuite,
  runStressTest,
  runStressBattery,
  runCompatibilitySuite,
  runCustomParserPipeline,
  RELIABILITY_FIXTURE_CATALOG,
  listReliabilityFixtures,
} from './reliability';
export type {
  ReliabilitySuiteReport,
  RegressionReport,
  StressRunResult,
  CompatibilityReport,
  PerformanceReport,
  FailureReport,
  RecoveryReport,
  ProductionReadinessScore,
  ParserStabilityScore,
  ReliabilityRunOptions,
  ReliabilityTestCategory,
  RegressionModuleId,
} from './reliability';

export {
  PARSER_ORCHESTRATOR_VERSION,
  orchestrateResumeParse,
  getOrchestratorConfig,
  resolveOrchestratorConfig,
  isCustomParserActive,
  ORCHESTRATOR_ENV,
  runLegacyProductionParser,
  runCustomParserAdapter,
  passesCustomQualityGates,
  logOrchestratorMetrics,
} from './integration';
export type {
  OrchestratorInput,
  OrchestratorResult,
  OrchestratorOptions,
  OrchestratorConfig,
  CustomParserMode,
  ParserId,
  ParserRunMetrics,
  OrchestratorMetrics,
} from './integration';
