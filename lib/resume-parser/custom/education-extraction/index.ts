/**
 * Public exports for education extraction engine.
 */

export {
  extractCanonicalEducation,
  extractEducationFromSection,
  extractEducationWithMeta,
  type EducationExtractionResult,
} from './engine';

export {
  partitionEducationBlocks,
  scoreEducationBoundaries,
  lineHasEducationBoundarySignal,
} from './boundaries';
export { detectInstitutionFromLine, scoreInstitutionCandidate } from './institution';
export { detectDegreeFromLine, scoreDegreeCandidate, lineHasDegreeSignal } from './degree';
export { parseEducationDates, lineHasEducationDateSignal } from './dates';
export { detectPerformanceFromText } from './performance';
export { detectFieldFromLine, parseCourseworkLine } from './field';
export { extractDescriptionFromBlock } from './description';
export { isValidEducation, filterValidEducation } from './validate';

export {
  EDUCATION_EXTRACTION_VERSION,
  toCanonicalEducation,
  type CanonicalEducation,
  type CustomExtractedEducation,
  type EducationFieldConfidence,
  type EducationLine,
  type EducationRawBlock,
} from './types';
