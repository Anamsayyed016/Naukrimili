/**
 * Public exports for experience extraction engine.
 */

export {
  extractCanonicalExperiences,
  extractExperiencesFromSection,
  extractExperiencesWithMeta,
  type ExperienceExtractionResult,
} from './engine';

export { partitionExperienceBlocks, scoreExperienceBoundaries } from './boundaries';
export { detectCompanyFromLine, scoreCompanyCandidate } from './company';
export { detectDesignationFromLine, scoreDesignationCandidate } from './designation';
export { parseDateRangeFromText, lineHasDateSignal } from './dates';
export { detectLocationFromLine, detectEmploymentTypeFromText } from './location';
export { extractDescriptionFromBlock } from './description';
export { extractTechnologiesFromText, extractTechnologiesFromBlock } from './technologies';
export { isValidExperience, filterValidExperiences } from './validate';

export {
  EXPERIENCE_EXTRACTION_VERSION,
  toCanonicalExperience,
  type CanonicalExperience,
  type CustomExtractedExperience,
  type ExperienceFieldConfidence,
  type ExperienceLine,
  type ExperienceRawBlock,
  type ParsedDateRange,
} from './types';
