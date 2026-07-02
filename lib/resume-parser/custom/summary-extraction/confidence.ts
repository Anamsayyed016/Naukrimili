/**
 * Confidence scoring for summary extraction.
 */

import { countParagraphs, countSentences, isBulletSummary } from './format';
import type { SummaryFieldConfidence } from './types';

export function scoreContentExtraction(summary: string): number {
  const trimmed = summary.trim();
  if (!trimmed) return 0;

  let score = 40;
  const len = trimmed.length;
  if (len >= 60) score += 15;
  if (len >= 120) score += 12;
  if (len >= 250) score += 8;
  if (len > 4000) score -= 15;

  const sentences = countSentences(trimmed);
  if (sentences >= 2) score += 10;
  if (sentences >= 4) score += 8;

  const paragraphs = countParagraphs(trimmed);
  if (paragraphs >= 1) score += 6;
  if (paragraphs >= 2) score += 6;

  if (isBulletSummary(trimmed)) score += 5;

  return Math.min(100, Math.round(score));
}

export function scoreSectionDetection(
  sectionText: string,
  sectionConfidence?: number,
  detectedHeading?: string
): number {
  if (!sectionText?.trim()) return 0;
  if (typeof sectionConfidence === 'number' && sectionConfidence > 0) {
    return Math.min(100, Math.round(sectionConfidence));
  }
  if (detectedHeading?.trim()) return 72;
  return 65;
}

export function computeOverallSummaryConfidence(fc: SummaryFieldConfidence): number {
  const weights = {
    sectionDetection: 0.25,
    contentExtraction: 0.45,
    boundaryAccuracy: 0.3,
  };

  let sum = 0;
  let weightSum = 0;
  for (const [key, w] of Object.entries(weights)) {
    sum += fc[key as keyof SummaryFieldConfidence] * w;
    weightSum += w;
  }

  return Math.min(100, Math.round(weightSum > 0 ? sum / weightSum : 0));
}
