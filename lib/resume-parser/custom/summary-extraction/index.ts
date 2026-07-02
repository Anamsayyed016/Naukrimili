/**
 * Public exports for summary extraction engine.
 */

export {
  extractCanonicalSummary,
  extractSummaryFromSection,
  extractSummaryWithMeta,
  type SummaryExtractionResult,
} from './engine';

export { applySummaryBoundaries, stripLeadingSummaryHeading } from './boundaries';
export {
  normalizeSummaryFormatting,
  countParagraphs,
  isBulletSummary,
  countSentences,
} from './format';
export { isValidSummaryContent, sanitizeSummaryOutput } from './validate';
export {
  scoreContentExtraction,
  scoreSectionDetection,
  computeOverallSummaryConfidence,
} from './confidence';

export {
  SUMMARY_EXTRACTION_VERSION,
  createEmptySummary,
  toCanonicalSummary,
  type CanonicalSummary,
  type CustomExtractedSummary,
  type SummaryExtractionInput,
  type SummaryFieldConfidence,
} from './types';
