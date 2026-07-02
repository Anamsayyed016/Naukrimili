/**
 * Validation engine output comparison.
 */

import { compareScalarField, scoreFieldComparisons } from '../match';
import type { GroundTruthValidationExpectation, ValidationBenchmarkReport } from '../types';
import type { ValidationRepairResult } from '../../validation-repair/types';

export function compareValidation(
  validation: ValidationRepairResult | undefined,
  expectation?: GroundTruthValidationExpectation
): ValidationBenchmarkReport {
  if (!validation) {
    return {
      accuracy: 100,
      errorCount: 0,
      warningCount: 0,
      manualReviewCount: 0,
      repairCount: 0,
      expectationMet: !expectation,
      issues: [],
    };
  }

  const report = validation.validationReport;
  const repairs = validation.repairReport;
  const issues = [];

  const errorCount = report.errors.length;
  const warningCount = report.warnings.length;
  const manualReviewCount = report.manualReview.length;
  const repairCount = repairs.repairCount;

  let expectationMet = true;

  if (expectation?.maxErrors !== undefined && errorCount > expectation.maxErrors) {
    expectationMet = false;
    issues.push(
      compareScalarField({
        section: 'validation',
        field: 'errorCount',
        expected: String(expectation.maxErrors),
        actual: String(errorCount),
      })
    );
  }

  if (expectation?.maxWarnings !== undefined && warningCount > expectation.maxWarnings) {
    expectationMet = false;
    issues.push(
      compareScalarField({
        section: 'validation',
        field: 'warningCount',
        expected: String(expectation.maxWarnings),
        actual: String(warningCount),
      })
    );
  }

  if (expectation?.maxManualReview !== undefined && manualReviewCount > expectation.maxManualReview) {
    expectationMet = false;
    issues.push(
      compareScalarField({
        section: 'validation',
        field: 'manualReviewCount',
        expected: String(expectation.maxManualReview),
        actual: String(manualReviewCount),
      })
    );
  }

  if (expectation?.maxRepairs !== undefined && repairCount > expectation.maxRepairs) {
    expectationMet = false;
    issues.push(
      compareScalarField({
        section: 'validation',
        field: 'repairCount',
        expected: String(expectation.maxRepairs),
        actual: String(repairCount),
      })
    );
  }

  if (expectation?.forbiddenIssueCodes?.length) {
    const allCodes = [
      ...report.errors,
      ...report.warnings,
      ...report.manualReview,
    ].map((i) => i.code);
    for (const forbidden of expectation.forbiddenIssueCodes) {
      if (allCodes.includes(forbidden)) {
        expectationMet = false;
        issues.push(
          compareScalarField({
            section: 'validation',
            field: 'issueCode',
            expected: `absent:${forbidden}`,
            actual: forbidden,
          })
        );
      }
    }
  }

  const structuralScore = expectation
    ? scoreFieldComparisons(issues.length ? issues : [
        compareScalarField({
          section: 'validation',
          field: 'expectation',
          expected: 'met',
          actual: expectationMet ? 'met' : 'failed',
        }),
      ])
    : 100;

  return {
    accuracy: expectationMet ? structuralScore : Math.max(0, structuralScore - 20),
    errorCount,
    warningCount,
    manualReviewCount,
    repairCount,
    expectationMet,
    issues,
  };
}
