/**
 * Certifications section comparison.
 */

import { blendedSimilarity } from '../normalize';
import { compareScalarField, greedyMatchEntries, scoreFieldComparisons } from '../match';
import type {
  CertificationsComparisonReport,
  EntryComparisonSummary,
  GroundTruthResume,
} from '../types';

type CertEntry = NonNullable<GroundTruthResume['certifications']>[number];

function certMatchScore(expected: CertEntry, actual: CertEntry): number {
  const name = blendedSimilarity(expected.name, actual.name);
  const issuer = blendedSimilarity(expected.issuer || '', actual.issuer || '');
  return name * 0.7 + issuer * 0.3;
}

export function compareCertifications(
  expected: GroundTruthResume,
  actual: GroundTruthResume
): CertificationsComparisonReport {
  const expEntries = expected.certifications || [];
  const actEntries = actual.certifications || [];

  const { pairs, unmatchedExpected, unmatchedActual } = greedyMatchEntries(
    expEntries,
    actEntries,
    certMatchScore
  );

  const entries: EntryComparisonSummary[] = pairs.map((p) => ({
    expectedIndex: p.expectedIndex,
    actualIndex: p.actualIndex,
    matched: true,
    fieldComparisons: [
      compareScalarField({
        section: 'certifications',
        field: 'name',
        index: p.expectedIndex,
        expected: p.expected.name,
        actual: p.actual.name,
      }),
      compareScalarField({
        section: 'certifications',
        field: 'issuer',
        index: p.expectedIndex,
        expected: p.expected.issuer || '',
        actual: p.actual.issuer || '',
      }),
      compareScalarField({
        section: 'certifications',
        field: 'date',
        index: p.expectedIndex,
        expected: p.expected.date || '',
        actual: p.actual.date || '',
      }),
    ],
    missingFields: [],
    unexpectedFields: [],
  }));

  for (const ei of unmatchedExpected) {
    entries.push({
      expectedIndex: ei,
      matched: false,
      fieldComparisons: [
        compareScalarField({
          section: 'certifications',
          field: 'name',
          index: ei,
          expected: expEntries[ei].name,
          actual: '',
        }),
      ],
      missingFields: ['name'],
      unexpectedFields: [],
    });
  }

  for (const ai of unmatchedActual) {
    entries.push({
      actualIndex: ai,
      matched: false,
      fieldComparisons: [
        compareScalarField({
          section: 'certifications',
          field: 'name',
          index: ai,
          expected: '',
          actual: actEntries[ai].name,
        }),
      ],
      missingFields: [],
      unexpectedFields: ['entry'],
    });
  }

  if (!expEntries.length && !actEntries.length) {
    return { entries, accuracy: 100 };
  }

  return {
    entries,
    accuracy: scoreFieldComparisons(entries.flatMap((e) => e.fieldComparisons)),
  };
}
