/**
 * Regression, Stress & Compatibility Framework — public exports.
 */

export {
  RELIABILITY_FRAMEWORK_VERSION,
  DEFAULT_QUALITY_GATES,
} from './types';

export {
  runReliabilitySuite,
  reliabilityReportToJson,
  runRegressionSuite,
  runStressTest,
  runStressBattery,
  runCompatibilitySuite,
  runCompatibilityCase,
  runCustomParserPipeline,
  runCustomParserPipelineSafe,
  RELIABILITY_FIXTURE_CATALOG,
  getReliabilityFixture,
  listReliabilityFixtures,
  generateStressFixtures,
  expandCatalogForStress,
  evaluateQualityGates,
  computeProductionReadiness,
  computeStabilityScore,
  formatReliabilityHumanReport,
  serializeReliabilityJson,
} from './engine';

export type {
  ReliabilityTestCategory,
  RegressionModuleId,
  CompatibilityProfile,
  StressScale,
  QualityGateThresholds,
  ReliabilityFixture,
  ParsePerformanceSample,
  StressRunResult,
  ModuleRegressionResult,
  RegressionReport,
  CompatibilityCaseResult,
  CompatibilityReport,
  PerformanceReport,
  FailureRecord,
  FailureReport,
  RecoveryRecord,
  RecoveryReport,
  QualityGateResult,
  ParserStabilityScore,
  ProductionReadinessScore,
  CustomParserPipelineResult,
  ReliabilityRunOptions,
  ReliabilitySuiteReport,
} from './types';
