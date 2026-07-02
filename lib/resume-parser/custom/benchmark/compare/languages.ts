/**
 * Languages section comparison.
 */

import { blendedSimilarity, normalizeCompareText } from '../normalize';
import { compareScalarField, greedyMatchEntries, scoreFieldComparisons } from '../match';
import type { GroundTruthResume, LanguagesComparisonReport, EntryComparisonSummary } from '../types';

interface LangEntry {
  name: string;
  proficiency?: string;
}

function toLangEntries(languages: GroundTruthResume['languages']): LangEntry[] {
  if (!languages?.length) return [];
  return languages.map((l) =>
    typeof l === 'string' ? { name: l } : { name: l.name, proficiency: l.proficiency }
  );
}

function langMatchScore(expected: LangEntry, actual: LangEntry): number {
  return blendedSimilarity(expected.name, actual.name);
}

export function compareLanguages(
  expected: GroundTruthResume,
  actual: GroundTruthResume
): LanguagesComparisonReport {
  const expEntries = toLangEntries(expected.languages);
  const actEntries = toLangEntries(actual.languages);

  const { pairs, unmatchedExpected, unmatchedActual } = greedyMatchEntries(
    expEntries,
    actEntries,
    langMatchScore,
    0.8
  );

  const entries: EntryComparisonSummary[] = pairs.map((p) => ({
    expectedIndex: p.expectedIndex,
    actualIndex: p.actualIndex,
    matched: true,
    fieldComparisons: [
      compareScalarField({
        section: 'languages',
        field: 'name',
        index: p.expectedIndex,
        expected: p.expected.name,
        actual: p.actual.name,
      }),
      ...(p.expected.proficiency
        ? [
            compareScalarField({
              section: 'languages',
              field: 'proficiency',
              index: p.expectedIndex,
              expected: p.expected.proficiency,
              actual: p.actual.proficiency || '',
            }),
          ]
        : []),
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
          section: 'languages',
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
          section: 'languages',
          field: 'name',
          index: ai,
          expected: '',
          actual: actEntries[ai].name,
        }),
      ],
      missingFields: [],
      unexpectedFields: ['name'],
    });
  }

  const allFields = entries.flatMap((e) => e.fieldComparisons);
  if (!expEntries.length && !actEntries.length) {
    return { entries, accuracy: 100 };
  }

  return {
    entries,
    accuracy: scoreFieldComparisons(allFields),
  };
}
