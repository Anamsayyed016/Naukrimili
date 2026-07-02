/**
 * Education section comparison.
 */

import { blendedSimilarity } from '../normalize';
import { compareScalarField, greedyMatchEntries, scoreFieldComparisons } from '../match';
import type { EducationComparisonReport, EntryComparisonSummary, GroundTruthResume } from '../types';

type EduEntry = GroundTruthResume['education'][number];

function educationMatchScore(expected: EduEntry, actual: EduEntry): number {
  const inst = blendedSimilarity(expected.institution, actual.institution);
  const degree = blendedSimilarity(expected.degree, actual.degree);
  const end = blendedSimilarity(expected.endDate || '', actual.endDate || '');
  return inst * 0.45 + degree * 0.35 + end * 0.2;
}

function compareEducationEntry(
  expected: EduEntry,
  actual: EduEntry | undefined,
  expectedIndex: number,
  actualIndex?: number
): EntryComparisonSummary {
  const fieldComparisons = [
    compareScalarField({
      section: 'education',
      field: 'institution',
      index: expectedIndex,
      expected: expected.institution,
      actual: actual?.institution,
    }),
    compareScalarField({
      section: 'education',
      field: 'degree',
      index: expectedIndex,
      expected: expected.degree,
      actual: actual?.degree,
    }),
    compareScalarField({
      section: 'education',
      field: 'field',
      index: expectedIndex,
      expected: expected.field || '',
      actual: actual?.field || '',
    }),
    compareScalarField({
      section: 'education',
      field: 'startDate',
      index: expectedIndex,
      expected: expected.startDate || '',
      actual: actual?.startDate || '',
    }),
    compareScalarField({
      section: 'education',
      field: 'endDate',
      index: expectedIndex,
      expected: expected.endDate || '',
      actual: actual?.endDate || '',
    }),
    compareScalarField({
      section: 'education',
      field: 'gpa',
      index: expectedIndex,
      expected: expected.gpa || '',
      actual: actual?.gpa || '',
    }),
  ];

  return {
    expectedIndex,
    actualIndex,
    matched: Boolean(actual),
    fieldComparisons,
    missingFields: fieldComparisons.filter((f) => f.status === 'missing').map((f) => f.field),
    unexpectedFields: fieldComparisons.filter((f) => f.status === 'unexpected').map((f) => f.field),
  };
}

export function compareEducation(
  expected: GroundTruthResume,
  actual: GroundTruthResume
): EducationComparisonReport {
  const expEntries = expected.education || [];
  const actEntries = actual.education || [];

  const { pairs, unmatchedExpected, unmatchedActual } = greedyMatchEntries(
    expEntries,
    actEntries,
    educationMatchScore
  );

  const entries: EntryComparisonSummary[] = pairs.map((p) =>
    compareEducationEntry(p.expected, p.actual, p.expectedIndex, p.actualIndex)
  );

  for (const ei of unmatchedExpected) {
    entries.push(compareEducationEntry(expEntries[ei], undefined, ei));
  }

  for (const ai of unmatchedActual) {
    entries.push({
      actualIndex: ai,
      matched: false,
      fieldComparisons: [
        compareScalarField({
          section: 'education',
          field: 'institution',
          index: ai,
          expected: '',
          actual: actEntries[ai].institution,
        }),
      ],
      missingFields: [],
      unexpectedFields: ['entry'],
    });
  }

  return {
    entries,
    missingEntries: unmatchedExpected.length,
    extraEntries: unmatchedActual.length,
    accuracy: scoreFieldComparisons(entries.flatMap((e) => e.fieldComparisons)),
  };
}
