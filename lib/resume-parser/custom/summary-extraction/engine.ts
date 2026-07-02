/**
 * Summary Extraction Engine — converts detected summary section into structured output.
 */

import { applySummaryBoundaries } from './boundaries';
import {
  computeOverallSummaryConfidence,
  scoreContentExtraction,
  scoreSectionDetection,
} from './confidence';
import { countParagraphs, isBulletSummary, normalizeSummaryFormatting } from './format';
import type {
  CanonicalSummary,
  CustomExtractedSummary,
  SummaryExtractionInput,
} from './types';
import { createEmptySummary, toCanonicalSummary } from './types';
import { isValidSummaryContent, sanitizeSummaryOutput } from './validate';

export interface SummaryExtractionResult {
  summary: CustomExtractedSummary;
  canonical: CanonicalSummary;
  accepted: boolean;
}

export function extractSummaryFromSection(
  input: SummaryExtractionInput | string
): CustomExtractedSummary {
  return extractSummaryWithMeta(input).summary;
}

export function extractSummaryWithMeta(
  input: SummaryExtractionInput | string
): SummaryExtractionResult {
  const resolved: SummaryExtractionInput =
    typeof input === 'string' ? { summarySectionText: input } : input;

  const sectionText = resolved.summarySectionText || '';
  if (!sectionText.trim()) {
    const empty = createEmptySummary();
    return { summary: empty, canonical: toCanonicalSummary(empty), accepted: false };
  }

  const boundary = applySummaryBoundaries(sectionText, resolved.detectedHeading);
  const formatted = normalizeSummaryFormatting(boundary.body);
  const validated = sanitizeSummaryOutput(formatted);

  if (!validated || !isValidSummaryContent(validated)) {
    const empty = createEmptySummary();
    empty.fieldConfidence.sectionDetection = scoreSectionDetection(
      sectionText,
      resolved.sectionConfidence,
      resolved.detectedHeading
    );
    return { summary: empty, canonical: toCanonicalSummary(empty), accepted: false };
  }

  const fieldConfidence = {
    sectionDetection: scoreSectionDetection(
      sectionText,
      resolved.sectionConfidence,
      resolved.detectedHeading
    ),
    contentExtraction: scoreContentExtraction(validated),
    boundaryAccuracy: boundary.boundaryAccuracy,
  };

  const summary: CustomExtractedSummary = {
    summary: validated.length > 4000 ? validated.slice(0, 4000) : validated,
    sourceLabel: boundary.sourceLabel || resolved.detectedHeading || 'summary',
    isBulletSummary: isBulletSummary(validated),
    paragraphCount: countParagraphs(validated),
    confidence: computeOverallSummaryConfidence(fieldConfidence),
    fieldConfidence,
  };

  return {
    summary,
    canonical: toCanonicalSummary(summary),
    accepted: true,
  };
}

export function extractCanonicalSummary(
  input: SummaryExtractionInput | string
): CanonicalSummary {
  return extractSummaryWithMeta(input).canonical;
}
