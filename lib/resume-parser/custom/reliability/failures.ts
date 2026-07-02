/**
 * Failure and recovery report builders.
 */

import type { StressRunResult } from './types';
import type { ReliabilityFixture } from './types';
import { runCustomParserPipelineSafe } from './pipeline';
import type { FailureReport, RecoveryReport } from './types';

export function buildFailureReport(
  fixtures: ReliabilityFixture[],
  stressResults: StressRunResult[]
): FailureReport {
  const failures: FailureReport['failures'] = [];

  for (const fixture of fixtures) {
    const result = runCustomParserPipelineSafe(fixture.rawText);
    if ('error' in result) {
      failures.push({
        fixtureId: fixture.id,
        phase: 'parse',
        error: result.error,
        categories: fixture.categories,
      });
    }
  }

  for (const stress of stressResults) {
    for (const sample of stress.samples) {
      if (!sample.succeeded && sample.errorMessage) {
        failures.push({
          fixtureId: sample.fixtureId,
          phase: 'parse',
          error: sample.errorMessage,
          categories: [],
        });
      }
    }
  }

  const totalRuns = fixtures.length + stressResults.reduce((s, r) => s + r.sampleCount, 0);
  const byPhase: Record<string, number> = {};
  for (const f of failures) {
    byPhase[f.phase] = (byPhase[f.phase] || 0) + 1;
  }

  return {
    failures,
    failureRate: totalRuns
      ? Math.round((failures.length / totalRuns) * 1000) / 10
      : 0,
    byPhase,
  };
}

export function buildRecoveryReport(fixtures: ReliabilityFixture[]): RecoveryReport {
  const records: RecoveryReport['records'] = [];

  for (const fixture of fixtures) {
    const result = runCustomParserPipelineSafe(fixture.rawText);
    if ('error' in result) continue;

    const repairCount = result.validation.repairReport.repairCount;
    const validationErrors = result.validation.validationReport.errors.length;
    records.push({
      fixtureId: fixture.id,
      repairCount,
      validationErrors,
      recovered: repairCount > 0 && validationErrors === 0,
    });
  }

  const withRepairs = records.filter((r) => r.repairCount > 0);
  const recovered = withRepairs.filter((r) => r.recovered).length;

  return {
    records,
    recoveryRate: withRepairs.length
      ? Math.round((recovered / withRepairs.length) * 1000) / 10
      : 100,
    totalRepairs: records.reduce((s, r) => s + r.repairCount, 0),
  };
}
