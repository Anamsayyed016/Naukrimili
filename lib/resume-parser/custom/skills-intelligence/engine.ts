/**
 * Skills Intelligence Engine — semantic skill understanding across resume sources.
 */

import { collectAllSkillCandidates } from './collect';
import { dedupeAndMergeSkills } from './dedupe';
import type {
  CanonicalSkills,
  IntelligentSkill,
  SkillsIntelligenceInput,
  SkillsIntelligenceResult,
} from './types';
import { toCanonicalSkills } from './types';
import { filterValidCandidates } from './validate';

export function extractSkillsIntelligence(
  input: SkillsIntelligenceInput
): IntelligentSkill[] {
  return extractSkillsWithMeta(input).skills;
}

export function extractSkillsWithMeta(
  input: SkillsIntelligenceInput
): SkillsIntelligenceResult {
  const candidates = collectAllSkillCandidates(input);
  const { valid, rejectedCount } = filterValidCandidates(candidates);
  const skills = dedupeAndMergeSkills(valid);

  return {
    skills,
    canonical: toCanonicalSkills(skills),
    candidateCount: candidates.length,
    rejectedCount,
  };
}

export function extractCanonicalSkills(input: SkillsIntelligenceInput): CanonicalSkills {
  return extractSkillsWithMeta(input).canonical;
}
