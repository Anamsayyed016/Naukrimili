/**
 * Project section comparison.
 */

import { blendedSimilarity } from '../normalize';
import {
  compareScalarField,
  compareStringArrays,
  greedyMatchEntries,
  scoreFieldComparisons,
} from '../match';
import type { GroundTruthResume, ProjectComparisonReport, EntryComparisonSummary } from '../types';

type ProjectEntry = NonNullable<GroundTruthResume['projects']>[number];

function projectMatchScore(expected: ProjectEntry, actual: ProjectEntry): number {
  const title = blendedSimilarity(expected.name, actual.name);
  const url = blendedSimilarity(expected.url || '', actual.url || '');
  return title * 0.75 + url * 0.25;
}

function compareProjectEntry(
  expected: ProjectEntry,
  actual: ProjectEntry | undefined,
  expectedIndex: number,
  actualIndex?: number
): EntryComparisonSummary {
  const fieldComparisons = [
    compareScalarField({
      section: 'projects',
      field: 'name',
      index: expectedIndex,
      expected: expected.name,
      actual: actual?.name,
    }),
    compareScalarField({
      section: 'projects',
      field: 'description',
      index: expectedIndex,
      expected: expected.description || '',
      actual: actual?.description || '',
    }),
    compareScalarField({
      section: 'projects',
      field: 'url',
      index: expectedIndex,
      expected: expected.url || '',
      actual: actual?.url || '',
      mode: 'url',
    }),
    compareScalarField({
      section: 'projects',
      field: 'startDate',
      index: expectedIndex,
      expected: expected.startDate || '',
      actual: actual?.startDate || '',
    }),
    compareScalarField({
      section: 'projects',
      field: 'endDate',
      index: expectedIndex,
      expected: expected.endDate || '',
      actual: actual?.endDate || '',
    }),
    ...compareStringArrays(
      'projects',
      'technologies',
      expected.technologies || [],
      actual?.technologies || []
    ),
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

export function compareProjects(
  expected: GroundTruthResume,
  actual: GroundTruthResume
): ProjectComparisonReport {
  const expEntries = expected.projects || [];
  const actEntries = actual.projects || [];

  const { pairs, unmatchedExpected, unmatchedActual } = greedyMatchEntries(
    expEntries,
    actEntries,
    projectMatchScore
  );

  const entries: EntryComparisonSummary[] = pairs.map((p) =>
    compareProjectEntry(p.expected, p.actual, p.expectedIndex, p.actualIndex)
  );

  for (const ei of unmatchedExpected) {
    entries.push(compareProjectEntry(expEntries[ei], undefined, ei));
  }

  for (const ai of unmatchedActual) {
    const act = actEntries[ai];
    entries.push({
      actualIndex: ai,
      matched: false,
      fieldComparisons: [
        compareScalarField({
          section: 'projects',
          field: 'name',
          index: ai,
          expected: '',
          actual: act.name,
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
