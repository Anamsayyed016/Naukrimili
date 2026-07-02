/**
 * Benchmark & Evaluation Framework — public exports.
 */

export {
  evaluateParserOutput,
  runBenchmarkCase,
  runBenchmarkSuite,
  evaluationReportToJson,
  suiteReportToJson,
} from './engine';

export { BENCHMARK_FRAMEWORK_VERSION } from './types';

export type { BenchmarkSuiteCase } from './engine';

export {
  BENCHMARK_FIXTURES,
  getBenchmarkFixture,
  listBenchmarkFixtures,
} from './fixtures/registry';

export {
  normalizeCompareText,
  normalizeSkill,
  skillKey,
  blendedSimilarity,
  tokenOverlapRatio,
} from './normalize';

export {
  compareScalarField,
  greedyMatchEntries,
  scoreFieldComparisons,
} from './match';

export { classifyMismatch } from './classify';
export { resolveBenchmarkActual } from './resolve';
export { computeSectionScores, buildStatistics } from './scoring';
export {
  formatHumanReport,
  formatSuiteHumanReport,
  serializeEvaluationJson,
  serializeSuiteJson,
  collectMismatches,
} from './report';

export { compareIdentity } from './compare/identity';
export { compareSummary } from './compare/summary';
export { compareExperience } from './compare/experience';
export { compareProjects } from './compare/projects';
export { compareEducation } from './compare/education';
export { compareSkills } from './compare/skills';
export { compareLanguages } from './compare/languages';
export { compareCertifications } from './compare/certifications';
export { compareValidation } from './compare/validation';
export { compareCanonical } from './compare/canonical';

export type {
  BenchmarkActualOutput,
  BenchmarkCase,
  BenchmarkErrorClass,
  BenchmarkEvaluateInput,
  BenchmarkEvaluationReport,
  BenchmarkRunOptions,
  BenchmarkSectionId,
  BenchmarkStatistics,
  BenchmarkSuiteReport,
  BenchmarkSuiteCase,
  ExternalParserComparator,
  ExternalParserId,
  FieldComparison,
  FieldMatchStatus,
  GroundTruthResume,
  GroundTruthSkillExpectation,
  GroundTruthValidationExpectation,
  ResumeFixtureTag,
  SectionAccuracyScores,
} from './types';
