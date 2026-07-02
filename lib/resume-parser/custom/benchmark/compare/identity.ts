/**
 * Identity section comparison.
 */

import { compareScalarField, scoreFieldComparisons } from '../match';
import type { FieldComparison, GroundTruthResume, IdentityComparisonReport } from '../types';

const IDENTITY_FIELDS = [
  { field: 'fullName', mode: 'text' as const },
  { field: 'email', mode: 'email' as const },
  { field: 'phone', mode: 'phone' as const },
  { field: 'linkedin', mode: 'url' as const },
  { field: 'location', mode: 'text' as const },
  { field: 'portfolio', mode: 'url' as const },
];

export function compareIdentity(
  expected: GroundTruthResume,
  actual: GroundTruthResume
): IdentityComparisonReport {
  const fields: FieldComparison[] = [];

  for (const { field, mode } of IDENTITY_FIELDS) {
    const exp = (expected as Record<string, string | undefined>)[field];
    if (!exp) continue;
    fields.push(
      compareScalarField({
        section: 'identity',
        field,
        expected: exp,
        actual: (actual as Record<string, string | undefined>)[field],
        mode,
      })
    );
  }

  if (expected.portfolio && !fields.some((f) => f.field === 'portfolio')) {
    fields.push(
      compareScalarField({
        section: 'identity',
        field: 'portfolio',
        expected: expected.portfolio,
        actual: actual.portfolio,
        mode: 'url',
      })
    );
  }

  return {
    fields,
    accuracy: scoreFieldComparisons(fields),
  };
}
