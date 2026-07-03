/**
 * Types for Certification Extraction module (custom parser).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export const CERTIFICATION_EXTRACTION_VERSION = '1.0.0';

export interface CustomExtractedCertification {
  name: string;
  issuer: string;
  date: string;
  url: string;
  credentialId: string;
  confidence: number;
}

export type CanonicalCertification = NonNullable<ExtractedResumeData['certifications']>[number];

export interface CertificationExtractionResult {
  certifications: CustomExtractedCertification[];
  canonical: CanonicalCertification[];
  rejectedCount: number;
  blockCount: number;
}

export function toCanonicalCertification(cert: CustomExtractedCertification): CanonicalCertification {
  return {
    name: cert.name,
    issuer: cert.issuer || '',
    date: cert.date || '',
    ...(cert.url ? { url: cert.url } : {}),
  };
}
