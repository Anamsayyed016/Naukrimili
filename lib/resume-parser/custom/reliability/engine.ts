/**
 * Reliability suite orchestrator — regression, stress, compatibility, readiness.
 */

import { runBenchmarkSuite } from '../benchmark/engine';
import type { BenchmarkCase, BenchmarkEvaluationReport } from '../benchmark/types';
import { RELIABILITY_FIXTURE_CATALOG } from './fixtures/catalog';
import { resetSyntheticCounter } from './fixtures/generator';
import { runCompatibilitySuite } from './compatibility';
import { buildFailureReport, buildRecoveryReport } from './failures';
import { buildPerformanceReport } from './performance';
import { runCustomParserPipeline } from './pipeline';
import { computeProductionReadiness, evaluateQualityGates } from './readiness';
import { runRegressionSuite } from './regression';
import { formatReliabilityHumanReport, serializeReliabilityJson } from './reports';
import { runStressBattery } from './stress';
import type {
  ReliabilityFixture,
  ReliabilityRunOptions,
  ReliabilitySuiteReport,
  StressScale,
} from './types';
import { DEFAULT_QUALITY_GATES, RELIABILITY_FRAMEWORK_VERSION } from './types';

function evaluatedAt(deterministic?: boolean): string {
  return deterministic ? '1970-01-01T00:00:00.000Z' : new Date().toISOString();
}

function fixtureToBenchmarkCase(fixture: ReliabilityFixture): BenchmarkCase {
  return {
    id: fixture.id,
    name: fixture.name,
    description: fixture.description,
    tags: fixture.categories as BenchmarkCase['tags'],
    format: fixture.format,
    rawText: fixture.rawText,
    groundTruth: fixture.groundTruth || {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      skills: [],
      experience: [],
      education: [],
      confidence: 0,
      rawText: fixture.rawText,
    },
    skillExpectations: fixture.skillExpectations,
    validationExpectation: fixture.validationExpectation,
  };
}

function runBenchmarkEvaluations(
  fixtures: ReliabilityFixture[]
): { evaluations: BenchmarkEvaluationReport[]; meanOverallAccuracy: number } {
  const withGroundTruth = fixtures.filter((f) => f.groundTruth);
  if (!withGroundTruth.length) {
    return { evaluations: [], meanOverallAccuracy: 0 };
  }

  const cases = withGroundTruth.map((fixture) => {
    const pipeline = runCustomParserPipeline(fixture.rawText);
    return {
      fixture: fixtureToBenchmarkCase(fixture),
      actual: { kind: 'validation' as const, result: pipeline.validation },
    };
  });

  const suite = runBenchmarkSuite(cases, { deterministic: true, includeHumanReport: false });
  return {
    evaluations: suite.cases,
    meanOverallAccuracy: suite.aggregate.meanOverallAccuracy,
  };
}

/** Run full reliability suite — regression, stress, compatibility, readiness. */
export function runReliabilitySuite(options?: ReliabilityRunOptions): ReliabilitySuiteReport {
  resetSyntheticCounter();

  const fixtures = RELIABILITY_FIXTURE_CATALOG;
  const stressScales: StressScale[] = options?.stressScales || [100];
  const gates = options?.qualityGates || DEFAULT_QUALITY_GATES;

  const regression = runRegressionSuite(fixtures);
  const stress = runStressBattery(stressScales);
  const compatibility = runCompatibilitySuite(fixtures);
  const performance = buildPerformanceReport(stress);
  const failures = buildFailureReport(fixtures, stress);
  const recovery = buildRecoveryReport(fixtures);
  const benchmark = runBenchmarkEvaluations(fixtures);

  const qualityGates = evaluateQualityGates(
    benchmark.evaluations,
    performance,
    failures.failureRate,
    gates
  );

  const readiness = computeProductionReadiness(
    regression,
    stress,
    compatibility,
    performance,
    qualityGates,
    benchmark.evaluations
  );

  const report: ReliabilitySuiteReport = {
    frameworkVersion: RELIABILITY_FRAMEWORK_VERSION,
    runAt: evaluatedAt(options?.deterministic),
    regression,
    stress,
    compatibility,
    performance,
    failures,
    recovery,
    benchmark: {
      meanOverallAccuracy: benchmark.meanOverallAccuracy,
      evaluations: benchmark.evaluations,
    },
    stability: readiness.stability,
    readiness,
    humanReport: '',
  };

  if (options?.includeHumanReports !== false) {
    report.humanReport = formatReliabilityHumanReport(report);
  }

  return report;
}

export function reliabilityReportToJson(report: ReliabilitySuiteReport): string {
  return serializeReliabilityJson(report);
}

export { runRegressionSuite } from './regression';
export { runStressTest, runStressBattery } from './stress';
export { runCompatibilitySuite, runCompatibilityCase } from './compatibility';
export { runCustomParserPipeline, runCustomParserPipelineSafe } from './pipeline';
export {
  RELIABILITY_FIXTURE_CATALOG,
  getReliabilityFixture,
  listReliabilityFixtures,
} from './fixtures/catalog';
export { generateStressFixtures, expandCatalogForStress } from './fixtures/generator';
export {
  evaluateQualityGates,
  computeProductionReadiness,
  computeStabilityScore,
} from './readiness';
export { formatReliabilityHumanReport, serializeReliabilityJson } from './reports';
