/**
 * Experience section comparison.
 */

import { blendedSimilarity } from '../normalize';
import {
  compareScalarField,
  compareStringArrays,
  greedyMatchEntries,
  scoreFieldComparisons,
} from '../match';
import type {
  EntryComparisonSummary,
  ExperienceComparisonReport,
  GroundTruthResume,
} from '../types';

type ExpEntry = GroundTruthResume['experience'][number];

function experienceMatchScore(expected: ExpEntry, actual: ExpEntry): number {
  const company = blendedSimilarity(expected.company, actual.company);
  const position = blendedSimilarity(expected.position, actual.position);
  const start = blendedSimilarity(expected.startDate, actual.startDate);
  const location = blendedSimilarity(expected.location || '', actual.location || '');
  return company * 0.4 + position * 0.3 + start * 0.2 + location * 0.1;
}

function compareExperienceEntry(
  expected: ExpEntry,
  actual: ExpEntry | undefined,
  expectedIndex: number,
  actualIndex?: number
): EntryComparisonSummary {
  const fieldComparisons = [
    compareScalarField({
      section: 'experience',
      field: 'company',
      index: expectedIndex,
      expected: expected.company,
      actual: actual?.company,
    }),
    compareScalarField({
      section: 'experience',
      field: 'position',
      index: expectedIndex,
      expected: expected.position,
      actual: actual?.position,
    }),
    compareScalarField({
      section: 'experience',
      field: 'startDate',
      index: expectedIndex,
      expected: expected.startDate,
      actual: actual?.startDate,
    }),
    compareScalarField({
      section: 'experience',
      field: 'endDate',
      index: expectedIndex,
      expected: expected.endDate || '',
      actual: actual?.endDate || '',
    }),
    compareScalarField({
      section: 'experience',
      field: 'location',
      index: expectedIndex,
      expected: expected.location || '',
      actual: actual?.location || '',
    }),
    compareScalarField({
      section: 'experience',
      field: 'description',
      index: expectedIndex,
      expected: expected.description || '',
      actual: actual?.description || '',
    }),
    ...compareStringArrays(
      'experience',
      'achievements',
      expected.achievements || [],
      actual?.achievements || []
    ),
  ];

  const missingFields = fieldComparisons
    .filter((f) => f.status === 'missing')
    .map((f) => f.field);
  const unexpectedFields = fieldComparisons
    .filter((f) => f.status === 'unexpected')
    .map((f) => f.field);

  return {
    expectedIndex,
    actualIndex,
    matched: Boolean(actual),
    fieldComparisons,
    missingFields,
    unexpectedFields,
  };
}

export function compareExperience(
  expected: GroundTruthResume,
  actual: GroundTruthResume
): ExperienceComparisonReport {
  const expEntries = expected.experience || [];
  const actEntries = actual.experience || [];

  const { pairs, unmatchedExpected, unmatchedActual } = greedyMatchEntries(
    expEntries,
    actEntries,
    experienceMatchScore
  );

  const entries: EntryComparisonSummary[] = pairs.map((p) => {
    const entry = compareExperienceEntry(p.expected, p.actual, p.expectedIndex, p.actualIndex);
    entry.orderCorrect = p.expectedIndex === p.actualIndex;
    return entry;
  });

  for (const ei of unmatchedExpected) {
    entries.push(compareExperienceEntry(expEntries[ei], undefined, ei));
  }

  for (const ai of unmatchedActual) {
    const act = actEntries[ai];
    entries.push({
      expectedIndex: undefined,
      actualIndex: ai,
      matched: false,
      orderCorrect: false,
      fieldComparisons: [
        compareScalarField({
          section: 'experience',
          field: 'company',
          index: ai,
          expected: '',
          actual: act.company,
        }),
      ],
      missingFields: [],
      unexpectedFields: ['entry'],
    });
  }

  const allFields = entries.flatMap((e) => e.fieldComparisons);
  const orderingIssues = pairs.filter((p) => p.expectedIndex !== p.actualIndex).length;

  return {
    entries,
    missingEntries: unmatchedExpected.length,
    extraEntries: unmatchedActual.length,
    orderingIssues,
    accuracy: scoreFieldComparisons(allFields),
  };
}
