/**
 * Stress testing — scale runs with performance measurement.
 */

import { expandCatalogForStress } from './fixtures/generator';
import { runCustomParserPipelineSafe } from './pipeline';
import type { ParsePerformanceSample, StressRunResult, StressScale } from './types';

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export function runStressTest(scale: StressScale): StressRunResult {
  const fixtures = expandCatalogForStress(scale);
  const samples: ParsePerformanceSample[] = [];

  for (const fixture of fixtures) {
    const result = runCustomParserPipelineSafe(fixture.rawText);
    if ('error' in result) {
      samples.push({
        fixtureId: fixture.id,
        parseTimeMs: result.parseTimeMs,
        heapDeltaBytes: 0,
        cpuUserMicros: 0,
        cpuSystemMicros: 0,
        succeeded: false,
        recovered: false,
        errorMessage: result.error,
      });
      continue;
    }

    const repairs = result.validation.repairReport.repairCount;
    const errors = result.validation.validationReport.errors.length;
    samples.push({
      fixtureId: fixture.id,
      parseTimeMs: result.parseTimeMs,
      heapDeltaBytes: result.heapDeltaBytes,
      cpuUserMicros: result.cpuUserMicros,
      cpuSystemMicros: result.cpuSystemMicros,
      succeeded: true,
      recovered: repairs > 0 && errors === 0,
    });
  }

  const succeeded = samples.filter((s) => s.succeeded);
  const times = succeeded.map((s) => s.parseTimeMs);
  const heaps = succeeded.map((s) => s.heapDeltaBytes);
  const recovered = samples.filter((s) => s.recovered).length;
  const recoverable = samples.filter((s) => s.succeeded).length;

  return {
    scale,
    sampleCount: samples.length,
    parseTimeMs: {
      average: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      min: times.length ? Math.min(...times) : 0,
      max: times.length ? Math.max(...times) : 0,
      p95: Math.round(percentile(times, 95)),
      worstCase: times.length ? Math.max(...times) : 0,
    },
    memory: {
      averageHeapDeltaBytes: heaps.length
        ? Math.round(heaps.reduce((a, b) => a + b, 0) / heaps.length)
        : 0,
      peakHeapDeltaBytes: heaps.length ? Math.max(...heaps) : 0,
    },
    cpu: {
      averageUserMicros: succeeded.length
        ? Math.round(succeeded.reduce((a, s) => a + s.cpuUserMicros, 0) / succeeded.length)
        : 0,
      averageSystemMicros: succeeded.length
        ? Math.round(succeeded.reduce((a, s) => a + s.cpuSystemMicros, 0) / succeeded.length)
        : 0,
    },
    failureRate: Math.round(((samples.length - succeeded.length) / samples.length) * 1000) / 10,
    recoveryRate: recoverable
      ? Math.round((recovered / recoverable) * 1000) / 10
      : 100,
    samples,
  };
}

export function runStressBattery(scales: StressScale[] = [100]): StressRunResult[] {
  return scales.map(runStressTest);
}
