/**
 * Benchmark engine — evaluate custom parser output against ground truth.
 */

import { compareCanonical } from './compare/canonical';
import { compareCertifications } from './compare/certifications';
import { compareEducation } from './compare/education';
import { compareExperience } from './compare/experience';
import { compareIdentity } from './compare/identity';
import { compareLanguages } from './compare/languages';
import { compareProjects } from './compare/projects';
import { compareSkills } from './compare/skills';
import { compareSummary } from './compare/summary';
import { compareValidation } from './compare/validation';
import {
  collectMismatches,
  formatHumanReport,
  formatSuiteHumanReport,
  serializeEvaluationJson,
  serializeSuiteJson,
} from './report';
import { resolveBenchmarkActual } from './resolve';
import {
  buildStatistics,
  collectAllFieldComparisons,
  computeSectionScores,
  emptyErrorClassCounts,
} from './scoring';
import type {
  BenchmarkActualOutput,
  BenchmarkCase,
  BenchmarkEvaluateInput,
  BenchmarkEvaluationReport,
  BenchmarkRunOptions,
  BenchmarkSuiteReport,
} from './types';
import { BENCHMARK_FRAMEWORK_VERSION } from './types';

function evaluatedAt(options?: BenchmarkRunOptions): string {
  return options?.deterministic ? '1970-01-01T00:00:00.000Z' : new Date().toISOString();
}

function buildEvaluationReport(
  input: BenchmarkEvaluateInput,
  actual: BenchmarkActualOutput,
  options?: BenchmarkRunOptions
): BenchmarkEvaluationReport {
  const resolved = resolveBenchmarkActual(actual);
  const expected = input.groundTruth;
  const actualData = resolved.extracted;

  const identity = compareIdentity(expected, actualData);
  const summary = compareSummary(expected, actualData);
  const experience = compareExperience(expected, actualData);
  const projects = compareProjects(expected, actualData);
  const education = compareEducation(expected, actualData);
  const skills = compareSkills(
    expected,
    actualData,
    input.skillExpectations,
    resolved.intelligentSkills
  );
  const languages = compareLanguages(expected, actualData);
  const certifications = compareCertifications(expected, actualData);
  const validation = compareValidation(resolved.validation, input.validationExpectation);
  const canonical = compareCanonical(expected, resolved.canonical);

  const sectionReports = {
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
  };

  const sectionScores = computeSectionScores(sectionReports, {
    includeValidation: Boolean(resolved.validation),
    includeCanonical: Boolean(resolved.canonical),
  });
  const fieldComparisons = collectAllFieldComparisons(sectionReports);
  const mismatches = collectMismatches(fieldComparisons);

  const parserConfidence =
    resolved.validation?.parserConfidenceScore ??
    resolved.canonical?.metadata.quality.parserConfidenceScore ??
    actualData.confidence ??
    0;

  const resumeQuality =
    resolved.validation?.resumeQualityScore ??
    resolved.canonical?.metadata.quality.resumeQualityScore ??
    0;

  const statistics = buildStatistics(fieldComparisons, parserConfidence, resumeQuality, validation);

  const report: BenchmarkEvaluationReport = {
    frameworkVersion: BENCHMARK_FRAMEWORK_VERSION,
    caseId: input.caseId,
    caseName: input.name,
    tags: input.tags,
    evaluatedAt: evaluatedAt(options),
    overallAccuracy: sectionScores.overall,
    sectionScores,
    fieldComparisons,
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
    mismatches,
    statistics,
    humanReport: '',
  };

  if (options?.includeHumanReport !== false) {
    report.humanReport = formatHumanReport(report);
  }

  return report;
}

/** Evaluate parser output against ground truth JSON. */
export function evaluateParserOutput(
  input: BenchmarkEvaluateInput,
  options?: BenchmarkRunOptions
): BenchmarkEvaluationReport {
  return buildEvaluationReport(input, input.actual, options);
}

/** Run a single registered benchmark case. */
export function runBenchmarkCase(
  benchmarkCase: BenchmarkCase,
  actual: BenchmarkActualOutput,
  options?: BenchmarkRunOptions
): BenchmarkEvaluationReport {
  return evaluateParserOutput(
    {
      caseId: benchmarkCase.id,
      name: benchmarkCase.name,
      tags: benchmarkCase.tags,
      groundTruth: benchmarkCase.groundTruth,
      actual,
      rawText: benchmarkCase.rawText,
      skillExpectations: benchmarkCase.skillExpectations,
      validationExpectation: benchmarkCase.validationExpectation,
    },
    options
  );
}

export interface BenchmarkSuiteCase {
  fixture: BenchmarkCase;
  actual: BenchmarkActualOutput;
}

/** Run multiple benchmark cases and aggregate statistics. */
export function runBenchmarkSuite(
  cases: BenchmarkSuiteCase[],
  options?: BenchmarkRunOptions
): BenchmarkSuiteReport {
  const results = cases.map((c) => runBenchmarkCase(c.fixture, c.actual, options));

  const errorClassCounts = emptyErrorClassCounts();
  for (const r of results) {
    for (const m of r.mismatches) {
      errorClassCounts[m.errorClass] = (errorClassCounts[m.errorClass] || 0) + 1;
    }
  }

  const mean = (vals: number[]) =>
    vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

  const suite: BenchmarkSuiteReport = {
    frameworkVersion: BENCHMARK_FRAMEWORK_VERSION,
    runAt: evaluatedAt(options),
    caseCount: results.length,
    cases: results,
    aggregate: {
      meanOverallAccuracy: mean(results.map((r) => r.overallAccuracy)),
      meanParserConfidence: mean(results.map((r) => r.statistics.parserConfidence)),
      meanResumeQuality: mean(results.map((r) => r.statistics.resumeQuality)),
      accuracyTrend: results.map((r) => ({
        caseId: r.caseId || 'unknown',
        overallAccuracy: r.overallAccuracy,
        parserConfidence: r.statistics.parserConfidence,
        resumeQuality: r.statistics.resumeQuality,
      })),
      errorClassCounts: errorClassCounts as BenchmarkSuiteReport['aggregate']['errorClassCounts'],
    },
    humanReport: '',
  };

  suite.humanReport = formatSuiteHumanReport(suite);
  return suite;
}

export function evaluationReportToJson(report: BenchmarkEvaluationReport): string {
  return serializeEvaluationJson(report);
}

export function suiteReportToJson(suite: BenchmarkSuiteReport): string {
  return serializeSuiteJson(suite);
}
