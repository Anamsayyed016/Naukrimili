/**
 * Public exports for Skills Intelligence Engine.
 */

export {
  extractCanonicalSkills,
  extractSkillsIntelligence,
  extractSkillsWithMeta,
} from './engine';

export { collectAllSkillCandidates, collectFromSkillsSection, collectFromPreambleText } from './collect';
export { normalizeSkillAlias, skillDedupeKey } from './aliases';
export { categorizeSkill } from './categorize';
export { scoreSkillCandidate, aggregateSkillCandidates, computeImportance } from './confidence';
export { dedupeAndMergeSkills } from './dedupe';
export { isValidSkillCandidate, filterValidCandidates } from './validate';

export {
  SKILLS_INTELLIGENCE_VERSION,
  toCanonicalSkills,
  type CanonicalSkills,
  type IntelligentSkill,
  type SkillCandidate,
  type SkillCategory,
  type SkillSource,
  type SkillsIntelligenceInput,
  type SkillsIntelligenceResult,
} from './types';
