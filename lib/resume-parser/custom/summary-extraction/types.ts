/**
 * Types for custom summary extraction (isolated module).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export const SUMMARY_EXTRACTION_VERSION = '1.0.0';

export interface SummaryFieldConfidence {
  sectionDetection: number;
  contentExtraction: number;
  boundaryAccuracy: number;
}

/** Rich summary record — maps to ExtractedResumeData.summary. */
export interface CustomExtractedSummary {
  summary: string;
  /** Semantic source detected from heading (objective, profile, etc.). */
  sourceLabel: string;
  isBulletSummary: boolean;
  paragraphCount: number;
  confidence: number;
  fieldConfidence: SummaryFieldConfidence;
}

export interface SummaryExtractionInput {
  summarySectionText: string;
  /** Confidence from section-detection engine when available. */
  sectionConfidence?: number;
  /** Raw heading text from section-detection when available. */
  detectedHeading?: string;
}

export type CanonicalSummary = Pick<ExtractedResumeData, 'summary'>;

export function toCanonicalSummary(extracted: CustomExtractedSummary): CanonicalSummary {
  return { summary: extracted.summary || '' };
}

export function createEmptySummary(): CustomExtractedSummary {
  return {
    summary: '',
    sourceLabel: '',
    isBulletSummary: false,
    paragraphCount: 0,
    confidence: 0,
    fieldConfidence: {
      sectionDetection: 0,
      contentExtraction: 0,
      boundaryAccuracy: 0,
    },
  };
}
