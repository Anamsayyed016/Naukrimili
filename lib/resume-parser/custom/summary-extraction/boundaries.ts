/**
 * Summary boundary detection — stop at foreign sections, strip headings.
 */

import { isResumeSectionHeadingLine } from '@/lib/resume-parser/import-sanitize';
import { truncateSummaryAtSectionBoundary } from '@/lib/resume-parser/text-recovery';

import { SECTION_TAXONOMY } from '../section-detection/taxonomy';

const SUMMARY_HEADING_PHRASES = [
  ...SECTION_TAXONOMY.summary.phrases,
  'personal statement',
  'biography',
  'career profile',
  'professional overview',
  'background summary',
  'profile summary',
];

const FOREIGN_SECTION_HEADING =
  /^(?:(?:(?:work|professional)\s+)?experience|employment(?:\s+history)?|education|academic(?:\s+background|\s+history)?|skills?|technical\s+skills|key\s+skills|core\s+competenc(?:y|ies)|projects?|certifications?|achievements?|languages?|references?|contact(?:\s+info)?|personal\s+details)\s*:?\s*$/i;

const BULLET_RE = /^[\s]*(?:[-–—•·▪‣●○◦]|\d+[\.\)])\s+/;

export interface BoundaryResult {
  body: string;
  sourceLabel: string;
  headingStripped: boolean;
  truncatedAtBoundary: boolean;
  boundaryAccuracy: number;
}

function normalizeHeading(line: string): string {
  return line
    .trim()
    .replace(/[:|\-_=]+$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function isSummaryHeading(line: string): boolean {
  const norm = normalizeHeading(line);
  if (!norm || norm.length > 80) return false;
  return SUMMARY_HEADING_PHRASES.some(
    (phrase) => norm === phrase || norm === `${phrase}:` || norm.startsWith(`${phrase} `)
  );
}

function detectSourceLabel(line: string): string {
  const norm = normalizeHeading(line);
  for (const phrase of SUMMARY_HEADING_PHRASES) {
    if (norm === phrase || norm.startsWith(phrase)) return phrase;
  }
  return '';
}

export function stripLeadingSummaryHeading(text: string): {
  body: string;
  sourceLabel: string;
  stripped: boolean;
} {
  const lines = (text || '').replace(/\r\n/g, '\n').split('\n');
  let start = 0;
  let sourceLabel = '';

  while (start < lines.length && !lines[start].trim()) start += 1;
  if (start >= lines.length) return { body: '', sourceLabel: '', stripped: false };

  const first = lines[start].trim();
  if (isSummaryHeading(first) || isResumeSectionHeadingLine(first)) {
    sourceLabel = detectSourceLabel(first) || first;
    start += 1;
    while (start < lines.length && !lines[start].trim()) start += 1;
    return {
      body: lines.slice(start).join('\n').trim(),
      sourceLabel,
      stripped: true,
    };
  }

  return { body: text.trim(), sourceLabel: '', stripped: false };
}

export function applySummaryBoundaries(
  text: string,
  detectedHeading?: string
): BoundaryResult {
  const raw = (text || '').replace(/\r\n/g, '\n').trim();
  if (!raw) {
    return {
      body: '',
      sourceLabel: detectedHeading || '',
      headingStripped: false,
      truncatedAtBoundary: false,
      boundaryAccuracy: 0,
    };
  }

  const { body: afterHeading, sourceLabel, stripped } = stripLeadingSummaryHeading(raw);
  let body = afterHeading;
  let truncatedAtBoundary = false;

  const beforeTruncate = body;
  body = truncateSummaryAtSectionBoundary(body);
  if (body.length < beforeTruncate.length) truncatedAtBoundary = true;

  const lines = body.split('\n');
  const kept: string[] = [];
  for (const line of lines) {
    const norm = line.trim().replace(/[:|\-_=]+$/, '').replace(/\s+/g, ' ').trim();
    if (
      norm.length > 0 &&
      norm.length <= 72 &&
      FOREIGN_SECTION_HEADING.test(norm) &&
      !isSummaryHeading(norm)
    ) {
      truncatedAtBoundary = true;
      break;
    }
    if (isResumeSectionHeadingLine(norm) && !BULLET_RE.test(line) && norm.length <= 60) {
      truncatedAtBoundary = true;
      break;
    }
    kept.push(line);
  }
  body = kept.join('\n').trim();

  let boundaryAccuracy = 88;
  if (truncatedAtBoundary) boundaryAccuracy -= 12;
  if (stripped) boundaryAccuracy += 4;

  return {
    body,
    sourceLabel: sourceLabel || (detectedHeading ? detectSourceLabel(detectedHeading) : ''),
    headingStripped: stripped,
    truncatedAtBoundary,
    boundaryAccuracy: Math.max(0, Math.min(100, boundaryAccuracy)),
  };
}
