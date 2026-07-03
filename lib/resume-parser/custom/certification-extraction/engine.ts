/**
 * Certification Extraction Engine — converts detected certifications section into structured entries.
 */

import { parseCertificationsFromSectionWithStats } from './parse';
import type {
  CanonicalCertification,
  CertificationExtractionResult,
  CustomExtractedCertification,
} from './types';
import { toCanonicalCertification } from './types';

export function extractCertificationsFromSection(
  certificationsSectionText: string
): CustomExtractedCertification[] {
  return extractCertificationsWithMeta(certificationsSectionText).certifications;
}

export function extractCertificationsWithMeta(
  certificationsSectionText: string
): CertificationExtractionResult {
  const { certifications: parsed, rejectedCount, blockCount } =
    parseCertificationsFromSectionWithStats(certificationsSectionText || '');
  const certifications: CustomExtractedCertification[] = parsed.map((p) => ({
    name: p.name,
    issuer: p.issuer,
    date: p.date,
    url: p.url,
    credentialId: p.credentialId,
    confidence: p.confidence,
  }));

  return {
    certifications,
    canonical: certifications.map(toCanonicalCertification),
    rejectedCount,
    blockCount,
  };
}

export function extractCanonicalCertifications(
  certificationsSectionText: string
): CanonicalCertification[] {
  return extractCertificationsWithMeta(certificationsSectionText).certifications.map(
    toCanonicalCertification
  );
}
