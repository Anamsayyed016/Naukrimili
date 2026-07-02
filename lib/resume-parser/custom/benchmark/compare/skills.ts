/**
 * Skills section comparison.
 */

import type { IntelligentSkill } from '../../skills-intelligence/types';
import { skillKey, normalizeSkill } from '../normalize';
import { compareScalarField, scoreFieldComparisons } from '../match';
import type {
  GroundTruthSkillExpectation,
  GroundTruthResume,
  SkillComparisonReport,
} from '../types';

export function compareSkills(
  expected: GroundTruthResume,
  actual: GroundTruthResume,
  skillExpectations?: GroundTruthSkillExpectation[],
  intelligentSkills?: IntelligentSkill[]
): SkillComparisonReport {
  const expectedNames = (skillExpectations?.map((s) => s.name) || expected.skills || []).map(
    normalizeSkill
  );
  const actualNames = (actual.skills || []).map(normalizeSkill);

  const expectedKeys = new Set(expectedNames.map(skillKey));
  const actualKeys = new Set(actualNames.map(skillKey));

  const missingSkills: string[] = [];
  const unexpectedSkills: string[] = [];
  const duplicateSkills: string[] = [];
  const fields = [];

  const actualKeyCounts = new Map<string, number>();
  for (const name of actualNames) {
    const key = skillKey(name);
    actualKeyCounts.set(key, (actualKeyCounts.get(key) || 0) + 1);
  }
  for (const [key, count] of actualKeyCounts) {
    if (count > 1) {
      const label = actualNames.find((n) => skillKey(n) === key) || key;
      duplicateSkills.push(label);
    }
  }

  for (const exp of expectedNames) {
    const key = skillKey(exp);
    if (!actualKeys.has(key)) {
      missingSkills.push(exp);
      fields.push(
        compareScalarField({
          section: 'skills',
          field: 'name',
          expected: exp,
          actual: '',
        })
      );
    } else {
      const act = actualNames.find((n) => skillKey(n) === key) || '';
      fields.push(
        compareScalarField({
          section: 'skills',
          field: 'name',
          expected: exp,
          actual: act,
        })
      );
    }
  }

  for (const act of actualNames) {
    const key = skillKey(act);
    if (!expectedKeys.has(key)) {
      unexpectedSkills.push(act);
      fields.push(
        compareScalarField({
          section: 'skills',
          field: 'name',
          expected: '',
          actual: act,
        })
      );
    }
  }

  if (skillExpectations?.length && intelligentSkills?.length) {
    for (const exp of skillExpectations) {
      const found = intelligentSkills.find((s) => skillKey(s.name) === skillKey(exp.name));
      if (!found) continue;
      if (exp.category) {
        fields.push(
          compareScalarField({
            section: 'skills',
            field: 'category',
            expected: exp.category,
            actual: found.category,
            confidence: found.confidence,
          })
        );
      }
      if (typeof exp.importance === 'number') {
        const impDiff = Math.abs(found.importance - exp.importance);
        fields.push(
          compareScalarField({
            section: 'skills',
            field: 'importance',
            expected: String(exp.importance),
            actual: String(found.importance),
            confidence: found.confidence,
          })
        );
        if (impDiff > 15) {
          fields[fields.length - 1].status = 'partial';
        }
      }
    }
  }

  return {
    fields,
    missingSkills,
    unexpectedSkills,
    duplicateSkills,
    accuracy: scoreFieldComparisons(fields),
  };
}
