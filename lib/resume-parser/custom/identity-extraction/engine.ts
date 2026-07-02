/**
 * Identity / Contact Extraction Engine.
 */

import { buildIdentityFromZones } from './fields';
import { buildIdentityScanZones } from './sources';
import type {
  CanonicalIdentity,
  CustomExtractedIdentity,
  IdentityExtractionInput,
} from './types';
import { createEmptyIdentity, toCanonicalIdentity } from './types';
import { hasMinimumIdentity, validateIdentity } from './validate';

export interface IdentityExtractionResult {
  identity: CustomExtractedIdentity;
  canonical: CanonicalIdentity;
  hasIdentity: boolean;
}

export function extractIdentityFromSections(
  input: IdentityExtractionInput
): CustomExtractedIdentity {
  return extractIdentityWithMeta(input).identity;
}

export function extractIdentityWithMeta(
  input: IdentityExtractionInput
): IdentityExtractionResult {
  const zones = buildIdentityScanZones(input);
  if (zones.length === 0) {
    const empty = createEmptyIdentity();
    return { identity: empty, canonical: toCanonicalIdentity(empty), hasIdentity: false };
  }

  const built = buildIdentityFromZones(zones);
  const identity = validateIdentity(built);

  return {
    identity,
    canonical: toCanonicalIdentity(identity),
    hasIdentity: hasMinimumIdentity(identity),
  };
}

export function extractCanonicalIdentity(input: IdentityExtractionInput): CanonicalIdentity {
  return extractIdentityWithMeta(input).canonical;
}
