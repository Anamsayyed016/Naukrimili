/**
 * Human-readable and JSON benchmark reports.
 */

import { fieldComparisonToMismatch } from './classify';
import type {
  BenchmarkEvaluationReport,
  BenchmarkSuiteReport,
  ClassifiedMismatch,
  FieldComparison,
} from './types';

export function collectMismatches(fieldComparisons: FieldComparison[]): ClassifiedMismatch[] {
  return fieldComparisons
    .filter((f) => f.status !== 'match')
    .map(fieldComparisonToMismatch);
}

export function formatHumanReport(report: BenchmarkEvaluationReport): string {
  const lines: string[] = [
    '══════════════════════════════════════════════════',
    '  CUSTOM RESUME PARSER — BENCHMARK EVALUATION',
    '══════════════════════════════════════════════════',
    '',
    `Case:        ${report.caseName || report.caseId || 'unnamed'}`,
    `Evaluated:   ${report.evaluatedAt}`,
    `Framework:   v${report.frameworkVersion}`,
    '',
    '── Overall Scores ──',
    `Overall Accuracy:     ${report.overallAccuracy}%`,
    `Parser Confidence:    ${report.statistics.parserConfidence}`,
    `Resume Quality:       ${report.statistics.resumeQuality}`,
    '',
    '── Section Accuracy ──',
    `Identity:       ${report.sectionScores.identity}%`,
    `Summary:        ${report.sectionScores.summary}%`,
    `Experience:     ${report.sectionScores.experience}%`,
    `Projects:       ${report.sectionScores.projects}%`,
    `Education:      ${report.sectionScores.education}%`,
    `Skills:         ${report.sectionScores.skills}%`,
    `Languages:      ${report.sectionScores.languages}%`,
    `Certifications: ${report.sectionScores.certifications}%`,
    `Validation:     ${report.sectionScores.validation}%`,
    `Canonical:      ${report.sectionScores.canonical}%`,
    '',
    '── Statistics ──',
    `Fields compared:  ${report.statistics.totalFieldsCompared}`,
    `Matched:          ${report.statistics.matchedFields}`,
    `Partial:          ${report.statistics.partialFields}`,
    `Missing:          ${report.statistics.missingFields}`,
    `Unexpected:       ${report.statistics.unexpectedFields}`,
    `Repairs:          ${report.statistics.repairCount}`,
    `Val. errors:      ${report.statistics.validationErrors}`,
    `Val. warnings:    ${report.statistics.validationWarnings}`,
  ];

  if (report.experience.missingEntries || report.experience.extraEntries) {
    lines.push(
      '',
      '── Experience Issues ──',
      `Missing entries: ${report.experience.missingEntries}`,
      `Extra entries:   ${report.experience.extraEntries}`,
      `Ordering issues: ${report.experience.orderingIssues}`
    );
  }

  if (report.skills.missingSkills.length || report.skills.unexpectedSkills.length) {
    lines.push(
      '',
      '── Skills Issues ──',
      `Missing:    ${report.skills.missingSkills.join(', ') || 'none'}`,
      `Unexpected: ${report.skills.unexpectedSkills.join(', ') || 'none'}`,
      `Duplicates: ${report.skills.duplicateSkills.join(', ') || 'none'}`
    );
  }

  if (report.mismatches.length) {
    lines.push('', '── Top Mismatches ──');
    for (const m of report.mismatches.slice(0, 15)) {
      lines.push(`[${m.errorClass}] ${m.section}${m.field ? `.${m.field}` : ''}: ${m.message}`);
    }
    if (report.mismatches.length > 15) {
      lines.push(`... and ${report.mismatches.length - 15} more`);
    }
  }

  lines.push('', '══════════════════════════════════════════════════');
  return lines.join('\n');
}

export function serializeEvaluationJson(report: BenchmarkEvaluationReport): string {
  const { humanReport: _hr, ...machine } = report;
  return JSON.stringify(machine, null, 2);
}

export function formatSuiteHumanReport(suite: BenchmarkSuiteReport): string {
  const lines = [
    '══════════════════════════════════════════════════',
    '  CUSTOM RESUME PARSER — BENCHMARK SUITE',
    '══════════════════════════════════════════════════',
    '',
    `Run at:     ${suite.runAt}`,
    `Cases:      ${suite.caseCount}`,
    `Mean acc:   ${suite.aggregate.meanOverallAccuracy}%`,
    `Mean conf:  ${suite.aggregate.meanParserConfidence}`,
    `Mean qual:  ${suite.aggregate.meanResumeQuality}`,
    '',
    '── Per Case ──',
  ];

  for (const c of suite.cases) {
    lines.push(
      `  ${c.caseId || 'case'}: ${c.overallAccuracy}% (conf ${c.statistics.parserConfidence}, qual ${c.statistics.resumeQuality})`
    );
  }

  lines.push('', '── Error Classes ──');
  for (const [cls, count] of Object.entries(suite.aggregate.errorClassCounts)) {
    if (count > 0) lines.push(`  ${cls}: ${count}`);
  }

  lines.push('', '══════════════════════════════════════════════════');
  return lines.join('\n');
}

export function serializeSuiteJson(suite: BenchmarkSuiteReport): string {
  const { humanReport: _hr, ...machine } = suite;
  return JSON.stringify(machine, null, 2);
}
