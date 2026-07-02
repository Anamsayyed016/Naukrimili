/**
 * Human-readable reliability suite reports.
 */

import type { ReliabilitySuiteReport } from './types';

export function formatReliabilityHumanReport(report: ReliabilitySuiteReport): string {
  const lines = [
    '══════════════════════════════════════════════════════════',
    '  CUSTOM RESUME PARSER — RELIABILITY SUITE',
    '══════════════════════════════════════════════════════════',
    '',
    `Framework:  v${report.frameworkVersion}`,
    `Run at:     ${report.runAt}`,
    '',
    '── Production Readiness ──',
    `Score:              ${report.readiness.score}/100`,
    `Ready:              ${report.readiness.readyForProduction ? 'YES' : 'NO'}`,
    `Stability:          ${report.stability.score}/100`,
    `Accuracy:           ${report.readiness.accuracyScore}%`,
    `Performance:        ${report.readiness.performanceScore}/100`,
    `Compatibility:      ${report.readiness.compatibilityScore}%`,
    '',
    '── Quality Gates ──',
    ...report.readiness.qualityGates.checks.map(
      (c) => `  ${c.passed ? '✓' : '✗'} ${c.gate}: ${c.actual}${c.unit || ''} (target ${c.target})`
    ),
    '',
    '── Regression ──',
    `Pass rate: ${report.regression.passRate}% (${report.regression.totalPassed}/${report.regression.totalCases})`,
    ...report.regression.modules.map(
      (m) => `  ${m.module}: ${m.passRate}% (${m.passed}/${m.caseCount})`
    ),
    '',
    '── Stress ──',
    ...report.stress.map(
      (s) =>
        `  Scale ${s.scale}: avg ${s.parseTimeMs.average}ms, p95 ${s.parseTimeMs.p95}ms, fail ${s.failureRate}%, recovery ${s.recoveryRate}%`
    ),
    '',
    '── Compatibility ──',
    `Pass rate: ${report.compatibility.passRate}% (${report.compatibility.passed}/${report.compatibility.cases.length})`,
    '',
    '── Performance ──',
    `Avg parse:    ${report.performance.averageParseTimeMs}ms`,
    `Worst case:   ${report.performance.worstCaseParseTimeMs}ms`,
    `P95:          ${report.performance.p95ParseTimeMs}ms`,
    `Throughput:   ${report.performance.throughputPerSecond} resumes/sec`,
    '',
    '── Failures & Recovery ──',
    `Failure rate: ${report.failures.failureRate}%`,
    `Recovery rate: ${report.recovery.recoveryRate}%`,
    `Total repairs: ${report.recovery.totalRepairs}`,
  ];

  if (report.readiness.blockers.length) {
    lines.push('', '── Blockers ──');
    for (const b of report.readiness.blockers) lines.push(`  • ${b}`);
  }

  lines.push('', '══════════════════════════════════════════════════════════');
  return lines.join('\n');
}

export function serializeReliabilityJson(report: ReliabilitySuiteReport): string {
  const { humanReport: _h, ...machine } = report;
  return JSON.stringify(machine, null, 2);
}
