/**
 * Performance metrics aggregation from stress runs.
 */

import type { PerformanceReport, StressRunResult } from './types';

export function buildPerformanceReport(stressResults: StressRunResult[]): PerformanceReport {
  if (!stressResults.length) {
    return {
      averageParseTimeMs: 0,
      worstCaseParseTimeMs: 0,
      p95ParseTimeMs: 0,
      averageHeapDeltaBytes: 0,
      peakHeapDeltaBytes: 0,
      throughputPerSecond: 0,
    };
  }

  const allTimes = stressResults.flatMap((r) => r.samples.filter((s) => s.succeeded).map((s) => s.parseTimeMs));
  const avgTime = stressResults.reduce((s, r) => s + r.parseTimeMs.average, 0) / stressResults.length;
  const worst = Math.max(...stressResults.map((r) => r.parseTimeMs.worstCase));
  const p95 = Math.max(...stressResults.map((r) => r.parseTimeMs.p95));
  const avgHeap =
    stressResults.reduce((s, r) => s + r.memory.averageHeapDeltaBytes, 0) / stressResults.length;
  const peakHeap = Math.max(...stressResults.map((r) => r.memory.peakHeapDeltaBytes));
  const totalSamples = stressResults.reduce((s, r) => s + r.samples.filter((x) => x.succeeded).length, 0);
  const totalMs = allTimes.reduce((a, b) => a + b, 0);

  return {
    averageParseTimeMs: Math.round(avgTime),
    worstCaseParseTimeMs: worst,
    p95ParseTimeMs: p95,
    averageHeapDeltaBytes: Math.round(avgHeap),
    peakHeapDeltaBytes: peakHeap,
    throughputPerSecond: totalMs > 0 ? Math.round((totalSamples / totalMs) * 1000 * 100) / 100 : 0,
  };
}
