/**
 * Public exports for identity / contact extraction engine.
 */

export {
  extractCanonicalIdentity,
  extractIdentityFromSections,
  extractIdentityWithMeta,
  type IdentityExtractionResult,
} from './engine';

export { buildIdentityScanZones, combineZoneText, getZoneLines } from './sources';
export { detectFullName, scoreNameCandidate } from './name';
export { detectHeadline, scoreHeadlineCandidate } from './headline';
export { extractEmailCandidates, pickPrimaryEmail } from './email';
export { extractPhoneCandidates, normalizePhoneNumber, pickPrimaryPhone } from './phone';
export { extractProfileLinks } from './links';
export { detectAddress } from './address';
export { detectIdentityMetadata } from './metadata';
export { validateIdentity, hasMinimumIdentity, sanitizeIdentityField } from './validate';

export {
  IDENTITY_EXTRACTION_VERSION,
  createEmptyIdentity,
  toCanonicalIdentity,
  type CanonicalIdentity,
  type CustomExtractedIdentity,
  type IdentityExtractionInput,
  type IdentityFieldConfidence,
} from './types';
