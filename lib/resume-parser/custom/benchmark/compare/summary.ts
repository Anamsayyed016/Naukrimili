/**
 * Summary section comparison.
 */

import { compareScalarField, scoreFieldComparisons } from '../match';
import { countParagraphs, hasBulletLines } from '../normalize';
import type { GroundTruthResume, SummaryComparisonReport } from '../types';

export function compareSummary(
  expected: GroundTruthResume,
  actual: GroundTruthResume
): SummaryComparisonReport {
  const expSummary = expected.summary || '';
  const actSummary = actual.summary || '';

  const fields = [
    compareScalarField({
      section: 'summary',
      field: 'summary',
      expected: expSummary,
      actual: actSummary,
    }),
  ];

  const paragraphCountExpected = Math.max(1, countParagraphs(expSummary));
  const paragraphCountActual = Math.max(actSummary ? countParagraphs(actSummary) : 0, 0);
  const bulletPreserved =
    !hasBulletLines(expSummary) || (hasBulletLines(expSummary) && hasBulletLines(actSummary));

  let accuracy = scoreFieldComparisons(fields);
  if (expSummary && paragraphCountActual > 0) {
    const paraRatio =
      1 - Math.abs(paragraphCountExpected - paragraphCountActual) / paragraphCountExpected;
    accuracy = Math.round(accuracy * 0.8 + Math.max(0, paraRatio) * 100 * 0.2);
  }
  if (!bulletPreserved) accuracy = Math.max(0, accuracy - 10);

  return {
    fields,
    paragraphCountExpected,
    paragraphCountActual,
    bulletPreserved,
    accuracy,
  };
}
