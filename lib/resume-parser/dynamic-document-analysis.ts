/**
 * Dynamic document analysis — layout/quality signals derived from raw text only.
 * No resume-specific rules; extends existing resume-document-analysis signals.
 */

import {
  classifyResumeDocument,
  type ResumeDocumentProfile,
} from '@/lib/resume-parser/resume-document-analysis';

export interface DynamicDocumentAnalysis {
  profile: ResumeDocumentProfile;
  /** Estimated column count (1–3) from gap/alternation heuristics. */
  columnCount: number;
  hasSidebar: boolean;
  hasFloatingSections: boolean;
  pageCountEstimate: number;
  textDensity: number;
  hasTables: boolean;
  hasIconsOrGraphics: boolean;
  hasMergedHeaders: boolean;
  ocrQualityScore: number;
  overallConfidence: number;
  readingOrderConfidence: number;
  sectionSeparationConfidence: number;
  overlappingRegionRisk: number;
}

function countWords(text: string): number {
  return (text.match(/[a-zA-Z]{3,}/g) || []).length;
}

function estimateColumnCount(lines: string[]): number {
  let gapPairs = 0;
  let tripleGaps = 0;
  for (const line of lines) {
    const gaps = (line.match(/\s{4,}/g) || []).length;
    if (gaps >= 2) tripleGaps += 1;
    else if (gaps >= 1) gapPairs += 1;
  }
  if (tripleGaps >= 3 || gapPairs >= 10) return 3;
  if (gapPairs >= 4) return 2;
  return 1;
}

function detectTableSignals(text: string, lines: string[]): boolean {
  if (/\|{2,}/.test(text)) return true;
  const tabRows = lines.filter((l) => (l.match(/\t/g) || []).length >= 2).length;
  if (tabRows >= 3) return true;
  const pipeRows = lines.filter((l) => (l.match(/\|/g) || []).length >= 2).length;
  return pipeRows >= 4;
}

function detectMergedHeaders(lines: string[]): boolean {
  let merged = 0;
  for (const line of lines.slice(0, 40)) {
    if (line.length > 55 && line.length < 120) {
      const caps = (line.match(/\b[A-Z]{2,}\b/g) || []).length;
      const sectionWords =
        /\b(EXPERIENCE|EDUCATION|SKILLS|PROJECTS|SUMMARY|CONTACT|CERTIFICATIONS?)\b/i.test(line);
      if (caps >= 2 && sectionWords) merged += 1;
    }
  }
  return merged >= 2;
}

function estimateOcrQuality(text: string, words: number): number {
  if (!text.trim()) return 0;
  const weird = (text.match(/[^\x20-\x7E\n\r\t\u00A0\u2013\u2014\u2022]/g) || []).length;
  const ratio = weird / Math.max(text.length, 1);
  const density = words / Math.max(text.length, 1);
  let score = 85;
  if (text.startsWith('%PDF')) score -= 35;
  if (ratio > 0.08) score -= 25;
  if (density < 0.0008 && words < 30) score -= 30;
  if (words < 15) score -= 20;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function estimateReadingOrderConfidence(
  profile: ResumeDocumentProfile,
  columnCount: number,
  mergedHeaders: boolean
): number {
  let score = 78;
  const { signals } = profile;
  if (signals.multiColumnLikely || columnCount > 1) score -= 12;
  if (signals.sidebarLikely) score -= 8;
  if (signals.executiveLayout) score -= 5;
  if (mergedHeaders) score -= 10;
  if (signals.scannedLikely) score -= 15;
  if (signals.coverLetterDetected) score -= 8;
  return Math.min(100, Math.max(0, score));
}

function estimateSectionSeparation(
  lines: string[],
  profile: ResumeDocumentProfile
): number {
  const headingLike = lines.filter(
    (l) =>
      l.length <= 48 &&
      (/^[A-Z][A-Z\s&/-]{2,}$/.test(l) ||
        /^(experience|education|skills|projects|summary|certifications?|languages?)\b/i.test(l))
  ).length;
  const density = headingLike / Math.max(lines.length, 1);
  let score = 50 + Math.min(40, headingLike * 6);
  if (profile.signals.multiColumnLikely) score -= 10;
  if (density < 0.02 && lines.length > 40) score -= 15;
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Analyze any resume document from extracted text — automatic, template-agnostic.
 */
export function analyzeResumeDocument(rawText: string): DynamicDocumentAnalysis {
  const text = (rawText || '').replace(/\r\n/g, '\n');
  const profile = classifyResumeDocument(text);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const words = countWords(text);
  const textDensity = words / Math.max(text.length, 1);
  const columnCount = estimateColumnCount(lines);
  const hasTables = detectTableSignals(text, lines);
  const hasMergedHeaders = detectMergedHeaders(lines);
  const hasIconsOrGraphics =
    /\[image|figure|photo|graphic|icon/i.test(text) ||
    (text.length < 500 && words < 30 && profile.signals.imageHeavyLikely);

  const charsPerPage = 2800;
  const pageCountEstimate = Math.max(1, Math.ceil(text.length / charsPerPage));

  const ocrQualityScore = estimateOcrQuality(text, words);
  const readingOrderConfidence = estimateReadingOrderConfidence(
    profile,
    columnCount,
    hasMergedHeaders
  );
  const sectionSeparationConfidence = estimateSectionSeparation(lines, profile);

  const overlappingRegionRisk = Math.min(
    100,
    (profile.signals.multiColumnLikely ? 25 : 0) +
      (profile.signals.sidebarLikely ? 20 : 0) +
      (hasMergedHeaders ? 15 : 0) +
      (columnCount > 2 ? 10 : 0)
  );

  const overallConfidence = Math.round(
    readingOrderConfidence * 0.35 +
      sectionSeparationConfidence * 0.3 +
      ocrQualityScore * 0.2 +
      (100 - overlappingRegionRisk) * 0.15
  );

  return {
    profile,
    columnCount,
    hasSidebar: profile.signals.sidebarLikely || profile.types.includes('TYPE_D_SIDEBAR'),
    hasFloatingSections: profile.signals.executiveLayout || hasMergedHeaders,
    pageCountEstimate,
    textDensity,
    hasTables,
    hasIconsOrGraphics,
    hasMergedHeaders,
    ocrQualityScore,
    overallConfidence,
    readingOrderConfidence,
    sectionSeparationConfidence,
    overlappingRegionRisk,
  };
}
