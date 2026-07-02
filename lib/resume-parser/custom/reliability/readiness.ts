/**
 * Quality gates and production readiness scoring.
 */

import type { BenchmarkEvaluationReport } from '../benchmark/types';
import type {
  CompatibilityReport,
  PerformanceReport,
  ProductionReadinessScore,
  ParserStabilityScore,
  QualityGateResult,
  QualityGateThresholds,
  RegressionReport,
  StressRunResult,
} from './types';
import { DEFAULT_QUALITY_GATES } from './types';

function gateScore(actual: number, target: number, higherIsBetter: boolean): number {
  if (higherIsBetter) {
    if (actual >= target) return 100;
    return Math.max(0, Math.round((actual / target) * 100));
  }
  if (actual <= target) return 100;
  return Math.max(0, Math.round((target / actual) * 100));
}

export function evaluateQualityGates(
  evaluations: BenchmarkEvaluationReport[],
  performance: PerformanceReport,
  failureRate: number,
  gates: QualityGateThresholds = DEFAULT_QUALITY_GATES
): QualityGateResult {
  const withGroundTruth = evaluations.filter((e) => e.fieldComparisons.length > 0);
  const mean = (pick: (e: BenchmarkEvaluationReport) => number) =>
    withGroundTruth.length
      ? withGroundTruth.reduce((s, e) => s + pick(e), 0) / withGroundTruth.length
      : 0;

  const identityAcc = mean((e) => e.sectionScores.identity);
  const experienceAcc = mean((e) => e.sectionScores.experience);
  const projectsAcc = mean((e) => e.sectionScores.projects);
  const educationAcc = mean((e) => e.sectionScores.education);
  const skillsAcc = mean((e) => e.sectionScores.skills);
  const overallAcc = mean((e) => e.overallAccuracy);

  const checks: QualityGateResult['checks'] = [
    {
      gate: 'identityAccuracy',
      target: gates.identityAccuracy,
      actual: Math.round(identityAcc * 10) / 10,
      passed: identityAcc >= gates.identityAccuracy,
      unit: '%',
    },
    {
      gate: 'experienceAccuracy',
      target: gates.experienceAccuracy,
      actual: Math.round(experienceAcc * 10) / 10,
      passed: experienceAcc >= gates.experienceAccuracy,
      unit: '%',
    },
    {
      gate: 'projectsAccuracy',
      target: gates.projectsAccuracy,
      actual: Math.round(projectsAcc * 10) / 10,
      passed: projectsAcc >= gates.projectsAccuracy,
      unit: '%',
    },
    {
      gate: 'educationAccuracy',
      target: gates.educationAccuracy,
      actual: Math.round(educationAcc * 10) / 10,
      passed: educationAcc >= gates.educationAccuracy,
      unit: '%',
    },
    {
      gate: 'skillsAccuracy',
      target: gates.skillsAccuracy,
      actual: Math.round(skillsAcc * 10) / 10,
      passed: skillsAcc >= gates.skillsAccuracy,
      unit: '%',
    },
    {
      gate: 'overallAccuracy',
      target: gates.overallAccuracy,
      actual: Math.round(overallAcc * 10) / 10,
      passed: overallAcc >= gates.overallAccuracy,
      unit: '%',
    },
    {
      gate: 'averageParseTime',
      target: gates.maxAverageParseTimeMs,
      actual: performance.averageParseTimeMs,
      passed: performance.averageParseTimeMs <= gates.maxAverageParseTimeMs,
      unit: 'ms',
    },
    {
      gate: 'failureRate',
      target: gates.maxFailureRate,
      actual: failureRate,
      passed: failureRate <= gates.maxFailureRate,
      unit: '%',
    },
  ];

  return {
    gates,
    passed: checks.every((c) => c.passed),
    checks,
  };
}

export function computeStabilityScore(
  regression: RegressionReport,
  stress: StressRunResult[],
  compatibility: CompatibilityReport
): ParserStabilityScore {
  const stressFailure =
    stress.length ? stress.reduce((s, r) => s + r.failureRate, 0) / stress.length : 0;
  const times = stress.flatMap((r) => r.samples.map((s) => s.parseTimeMs));
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const variance =
    times.length > 1
      ? times.reduce((s, t) => s + (t - avg) ** 2, 0) / times.length
      : 0;
  const variancePenalty = Math.min(20, Math.round(Math.sqrt(variance) / 10));

  const score = Math.round(
    regression.passRate * 0.4 +
      (100 - stressFailure) * 0.35 +
      compatibility.passRate * 0.25 -
      variancePenalty
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    regressionPassRate: regression.passRate,
    stressFailureRate: stressFailure,
    compatibilityPassRate: compatibility.passRate,
    variancePenalty,
  };
}

export function computeProductionReadiness(
  regression: RegressionReport,
  stress: StressRunResult[],
  compatibility: CompatibilityReport,
  performance: PerformanceReport,
  qualityGates: QualityGateResult,
  evaluations: BenchmarkEvaluationReport[]
): ProductionReadinessScore {
  const stability = computeStabilityScore(regression, stress, compatibility);

  const withGt = evaluations.filter((e) => e.overallAccuracy > 0);
  const accuracyScore =
    withGt.length > 0
      ? Math.round(withGt.reduce((s, e) => s + e.overallAccuracy, 0) / withGt.length)
      : regression.passRate;

  const performanceScore = gateScore(
    performance.averageParseTimeMs,
    qualityGates.gates.maxAverageParseTimeMs,
    false
  );

  const reliabilityScore = Math.round(
    (100 - (stress[0]?.failureRate || 0)) * 0.6 + regression.passRate * 0.4
  );

  const compatibilityScore = compatibility.passRate;

  const score = Math.round(
    accuracyScore * 0.35 +
      performanceScore * 0.2 +
      reliabilityScore * 0.2 +
      compatibilityScore * 0.15 +
      stability.score * 0.1
  );

  const blockers: string[] = [];
  for (const check of qualityGates.checks) {
    if (!check.passed) {
      blockers.push(`${check.gate}: ${check.actual}${check.unit || ''} (target ${check.target})`);
    }
  }
  if (regression.regressionsDetected) {
    blockers.push(`Regression failures: ${regression.totalFailed} of ${regression.totalCases}`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    stability,
    qualityGates,
    accuracyScore,
    performanceScore,
    reliabilityScore,
    compatibilityScore,
    readyForProduction: blockers.length === 0 && score >= 85,
    blockers,
  };
}
