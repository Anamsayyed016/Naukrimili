/**
 * Canonical resume graph comparison.
 */

import { compareScalarField, scoreFieldComparisons } from '../match';
import { countCanonicalNodes } from '../resolve';
import type { CanonicalBenchmarkReport, GroundTruthResume } from '../types';
import type { CanonicalResume } from '../../canonical-resume/types';

function expectedNodeCount(expected: GroundTruthResume): number {
  return (
    2 +
    (expected.experience?.length || 0) +
    (expected.projects?.length || 0) +
    (expected.education?.length || 0) +
    (expected.skills?.length || 0) +
    (expected.languages?.length || 0) +
    (expected.certifications?.length || 0)
  );
}

export function compareCanonical(
  expected: GroundTruthResume,
  canonical?: CanonicalResume
): CanonicalBenchmarkReport {
  if (!canonical) {
    return {
      accuracy: 100,
      nodeCountExpected: expectedNodeCount(expected),
      nodeCountActual: 0,
      stableIds: true,
      metadataPresent: false,
      issues: [],
    };
  }

  const nodeCountExpected = expectedNodeCount(expected);
  const nodeCountActual = countCanonicalNodes(canonical);
  const issues = [];

  issues.push(
    compareScalarField({
      section: 'canonical',
      field: 'experienceCount',
      expected: String(expected.experience?.length || 0),
      actual: String(canonical.experience.length),
    })
  );
  issues.push(
    compareScalarField({
      section: 'canonical',
      field: 'skillsCount',
      expected: String(expected.skills?.length || 0),
      actual: String(canonical.skills.length),
    })
  );

  const stableIds = [
    canonical.identity.id,
    canonical.summary.id,
    ...canonical.experience.map((e) => e.id),
    ...canonical.skills.map((s) => s.id),
  ].every((id) => /^[a-z]+_[0-9a-f]{8}$/.test(id));

  const metadataPresent = Boolean(
    canonical.metadata?.validation && canonical.metadata?.quality && canonical.metadata?.parser
  );

  const countDiff = Math.abs(nodeCountExpected - nodeCountActual);
  let accuracy = scoreFieldComparisons(issues);
  if (countDiff > 0) accuracy = Math.max(0, accuracy - countDiff * 5);
  if (!stableIds) accuracy = Math.max(0, accuracy - 10);
  if (!metadataPresent) accuracy = Math.max(0, accuracy - 10);

  return {
    accuracy,
    nodeCountExpected,
    nodeCountActual,
    stableIds,
    metadataPresent,
    issues,
  };
}
