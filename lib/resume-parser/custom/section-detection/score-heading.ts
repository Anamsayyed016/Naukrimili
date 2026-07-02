/**
 * Hybrid heading scoring — keywords, formatting, layout context, content hints.
 */

import type { ResumeDocumentProfile } from '@/lib/resume-parser/resume-document-analysis';

import { lineContentDensity } from './line-index';
import { SECTION_TAXONOMY, scoreHeadingKeywords } from './taxonomy';
import type { HeadingCandidate, LineSpan, NormalizedSectionType, SectionScoreBreakdown } from './types';

const BULLET_LINE_RE = /^[\s]*(?:[-–—•·▪‣●○◦]|\d+[\.\)])\s+/;
const CONTACT_LINE_RE =
  /@|linkedin\.com|github\.com|https?:\/\/|\+?\d[\d\s().-]{7,}\d|www\./i;
const MIN_KNOWN_TYPE_SCORE = 38;
const MIN_CUSTOM_HEADING_SCORE = 22;

export function isBulletLine(line: string): boolean {
  return BULLET_LINE_RE.test(line);
}

export function isAllCapsHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 64) return false;
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

export function isTitleCaseHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 56) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 8) return false;
  const titled = words.filter((w) => /^[A-Z][a-z]+(?:['-][A-Z][a-z]+)?$/.test(w)).length;
  return titled >= Math.max(1, Math.ceil(words.length * 0.6));
}

export function looksLikeHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (isBulletLine(t)) return false;
  if (CONTACT_LINE_RE.test(t) && t.length < 120) return false;
  if (t.split(/\s+/).length > 12) return false;
  if (/[.!?]$/.test(t) && t.split(/\s+/).length > 7) return false;
  return true;
}

function scoreCapitalization(rawHeading: string): number {
  if (isAllCapsHeading(rawHeading)) return 28;
  if (isTitleCaseHeading(rawHeading)) return 22;
  const t = rawHeading.trim();
  if (t.length <= 32 && t === t.toLowerCase()) return 8;
  return 0;
}

function scoreFormatting(lineIndex: number, lines: LineSpan[]): number {
  let score = 0;
  const prevBlank = lineIndex > 0 && lines[lineIndex - 1].isBlank;
  const nextBlank =
    lineIndex < lines.length - 1 && lines[lineIndex + 1].isBlank;
  if (prevBlank) score += 18;
  if (nextBlank) score += 6;
  const line = lines[lineIndex];
  if (line.text.trim().length <= 40) score += 8;
  if (/[:\-–—|]$/.test(line.text.trim())) score += 6;
  return score;
}

function scoreDocumentContext(
  type: NormalizedSectionType,
  lineIndex: number,
  totalLines: number,
  profile: ResumeDocumentProfile
): number {
  if (type === 'custom') return 0;
  const tax = SECTION_TAXONOMY[type];
  const position = totalLines > 1 ? lineIndex / (totalLines - 1) : 0.5;
  const distance = Math.abs(position - tax.typicalOrder);
  let score = Math.max(0, 24 - distance * 40);

  if (profile.signals.executiveLayout && (type === 'summary' || type === 'experience')) {
    score += 6;
  }
  if (profile.signals.multiColumnLikely || profile.signals.sidebarLikely) {
    score += 4;
  }
  if (profile.signals.scannedLikely) {
    score -= 4;
  }
  return Math.max(0, Math.min(30, score));
}

export function scoreContentHint(
  type: NormalizedSectionType,
  density: ReturnType<typeof lineContentDensity>
): number {
  if (type === 'custom') return 0;
  switch (type) {
    case 'experience':
      return Math.min(25, density.dateDensity * 40 + density.bulletDensity * 15);
    case 'education':
      return Math.min(20, density.dateDensity * 25);
    case 'skills':
      return Math.min(25, density.skillLineDensity * 30 + density.commaDensity * 12);
    case 'projects':
      return Math.min(18, density.bulletDensity * 20);
    case 'languages':
      return Math.min(15, density.commaDensity * 10);
    default:
      return Math.min(12, density.bulletDensity * 10);
  }
}

function pickBestType(
  typeScores: Partial<Record<NormalizedSectionType, number>>,
  formattingScore: number,
  capScore: number
): { type: NormalizedSectionType; keywordScore: number } {
  let bestType: NormalizedSectionType = 'custom';
  let bestKeyword = 0;
  for (const [type, score] of Object.entries(typeScores) as Array<
    [NormalizedSectionType, number]
  >) {
    if (score > bestKeyword) {
      bestKeyword = score;
      bestType = type;
    }
  }

  const headingSignal = formattingScore + capScore;
  if (bestKeyword < MIN_KNOWN_TYPE_SCORE && headingSignal >= MIN_CUSTOM_HEADING_SCORE) {
    return { type: 'custom', keywordScore: bestKeyword };
  }
  if (bestKeyword < MIN_KNOWN_TYPE_SCORE) {
    return { type: 'custom', keywordScore: bestKeyword };
  }
  return { type: bestType, keywordScore: bestKeyword };
}

export function scoreHeadingCandidate(
  lineIndex: number,
  lines: LineSpan[],
  profile: ResumeDocumentProfile,
  contentDensity?: ReturnType<typeof lineContentDensity>
): HeadingCandidate | null {
  const line = lines[lineIndex];
  if (!line || line.isBlank || !looksLikeHeadingLine(line.text)) return null;

  const rawHeading = line.text.trim();
  const typeScores = scoreHeadingKeywords(rawHeading);
  const keywordBase = Math.max(0, ...Object.values(typeScores));
  const capScore = scoreCapitalization(rawHeading);
  const formattingScore = scoreFormatting(lineIndex, lines);
  const { type, keywordScore } = pickBestType(typeScores, formattingScore, capScore);

  const contextScore = scoreDocumentContext(type, lineIndex, lines.length, profile);
  const contentScore = contentDensity ? scoreContentHint(type, contentDensity) : 0;

  const total = Math.min(
    100,
    Math.round(keywordScore * 0.52 + capScore * 0.12 + formattingScore * 0.18 + contextScore * 0.1 + contentScore * 0.08)
  );

  if (type === 'custom' && total < MIN_CUSTOM_HEADING_SCORE) return null;
  if (type !== 'custom' && total < MIN_KNOWN_TYPE_SCORE) return null;

  const scores: SectionScoreBreakdown = {
    keyword: keywordScore,
    capitalization: capScore,
    formatting: formattingScore,
    context: contextScore,
    content: contentScore,
    profile: profile.primaryType ? 4 : 0,
    total,
  };

  return {
    lineIndex,
    rawHeading,
    type,
    confidence: total,
    scores,
    typeScores,
  };
}

export function rescoreWithContent(
  candidate: HeadingCandidate,
  density: ReturnType<typeof lineContentDensity>
): HeadingCandidate {
  const contentScore = scoreContentHint(candidate.type, density);
  const total = Math.min(
    100,
    Math.round(
      candidate.scores.keyword * 0.5 +
        candidate.scores.capitalization * 0.12 +
        candidate.scores.formatting * 0.16 +
        candidate.scores.context * 0.1 +
        contentScore * 0.12
    )
  );
  return {
    ...candidate,
    confidence: total,
    scores: { ...candidate.scores, content: contentScore, total },
  };
}
