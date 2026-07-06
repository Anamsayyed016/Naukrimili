/**
 * Semantic person name detection with confidence scoring.
 */

import { classifyResumeTextFragment } from '@/lib/resume-parser/field-classification';
import {
  isPlausiblePersonName,
  isResumeSectionHeadingLine,
  looksLikeCompanyNameLine,
  looksLikeJobTitleLine,
  pickBestNameFromCandidates,
  type NameCandidate,
} from '@/lib/resume-parser/import-sanitize';
import {
  collectNameCandidatesFromText,
  extractNameWithConfidence,
} from '@/lib/resume-parser/text-recovery';

import { getZoneLines, type ScanZone } from './sources';

export interface NameDetection {
  fullName: string;
  confidence: number;
}

const NAME_SUFFIX_RE = /^(dr|mr|mrs|ms|prof|sir|jr|sr|ii|iii|iv)\.?$/i;

const TRAILING_SECTION_NOISE_RE =
  /\s+(?:skills?|technical\s+skills|experience|work\s+experience|education|summary|objective|profile|resume|cv|contact)\s*$/i;

const HONORIFIC_PREFIX_RE = /^(?:dr|mr|mrs|ms|prof|sir)\.?\s+/i;

/** Strip honorific prefixes and multi-column padding from a header line. */
export function normalizeNameLine(line: string): string {
  let trimmed = line.trim();
  if (!trimmed) return '';

  trimmed = trimmed.replace(HONORIFIC_PREFIX_RE, '').trim();

  const multiCol = trimmed.match(
    /^([A-Z][A-Za-z'.\-]+(?:\s+[A-Z][A-Za-z'.\-]+){0,4})\s+(.+)$/
  );
  if (multiCol?.[1] && multiCol[2]) {
    const tail = multiCol[2].trim().toLowerCase();
    if (
      looksLikePersonNameShape(multiCol[1]) &&
      /^(?:skills?|technical\s+skills|experience|education|summary|objective|profile|resume|cv|contact)\b/.test(
        tail
      )
    ) {
      trimmed = multiCol[1].trim();
    }
  }

  trimmed = trimmed.replace(TRAILING_SECTION_NOISE_RE, '').trim();

  const beforePipe = trimmed.split(/\s*\|\s*/)[0]?.trim() || trimmed;
  if (beforePipe && beforePipe !== trimmed && looksLikePersonNameShape(beforePipe)) {
    return beforePipe;
  }

  return trimmed;
}

/** Local shape heuristic when production plausibility gates are too strict (e.g. uncommon surnames). */
export function looksLikePersonNameShape(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 80) return false;
  if (/[@+0-9]|https?:\/\//i.test(trimmed)) return false;
  if (isResumeSectionHeadingLine(trimmed)) return false;
  if (looksLikeCompanyNameLine(trimmed)) return false;
  if (looksLikeJobTitleLine(trimmed) && !/^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)+$/.test(trimmed)) {
    return false;
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;
  if (/^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,3}$/.test(trimmed)) return true;
  if (/^[A-Z][A-Z\s'-]{3,}$/.test(trimmed)) return true;
  return false;
}

export function scoreNameCandidate(value: string, baseConfidence: number): number {
  const trimmed = value.trim();
  const shapeOk = looksLikePersonNameShape(trimmed);
  if (!trimmed || (!isPlausiblePersonName(trimmed) && !shapeOk)) return 0;
  if (isResumeSectionHeadingLine(trimmed)) return 0;

  const classified = classifyResumeTextFragment(trimmed);
  if (classified.kind === 'COMPANY_NAME') return 0;
  if (classified.kind === 'SECTION_HEADER') return 0;
  if (classified.kind === 'DESIGNATION' && classified.confidence >= 75) return 0;
  if (classified.kind === 'EDUCATION') return 0;
  if (classified.kind === 'PROJECT_NAME' && classified.confidence >= 70) return 0;

  let score = baseConfidence;
  if (classified.kind === 'PERSON_NAME') score = Math.max(score, classified.confidence);
  if (shapeOk && score < 55) score = Math.max(score, 62);
  if (/^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,3}$/.test(trimmed)) score += 8;
  if (/^[A-Z][A-Z\s'-]{3,}$/.test(trimmed) && trimmed.split(/\s+/).length >= 2) score += 6;

  const words = trimmed.split(/\s+/);
  if (words.some((w) => NAME_SUFFIX_RE.test(w))) score += 4;

  return Math.min(100, Math.round(score));
}

function collectZoneNameCandidates(zones: ScanZone[]): NameCandidate[] {
  const all: NameCandidate[] = [];

  for (const zone of zones) {
    if (zone.label === 'full') continue;
    const candidates = collectNameCandidatesFromText(zone.text);
    for (const c of candidates) {
      all.push({
        ...c,
        confidence: scoreNameCandidate(c.value, Math.round(c.confidence * zone.weight)),
      });
    }
  }

  const headerContactText = zones
    .filter((z) => z.label === 'header' || z.label === 'contact' || z.label === 'preamble')
    .map((z) => z.text)
    .join('\n');

  if (headerContactText) {
    const heuristic = extractNameWithConfidence(headerContactText);
    if (heuristic) {
      all.push({
        value: heuristic,
        confidence: scoreNameCandidate(heuristic, 78),
        source: 'text_recovery',
      });
    }
  }

  return all.filter((c) => c.confidence > 0);
}

export function detectFullName(zones: ScanZone[], primaryEmail = ''): NameDetection {
  const near = detectNameNearContactLines(zones);
  if (near.confidence >= 55) return near;

  const firstLine = detectNameFromFirstLines(zones);
  if (firstLine.confidence >= 58) return firstLine;

  const candidates = collectZoneNameCandidates(zones);
  const best = pickBestNameFromCandidates(candidates, primaryEmail);
  if (best) {
    const matched = candidates.find((c) => c.value === best);
    const confidence = matched?.confidence ?? scoreNameCandidate(best, 70);
    return { fullName: best, confidence };
  }

  const nearFallback = detectNameNearContactLines(zones);
  if (nearFallback.fullName) return nearFallback;

  const headerText = zones
    .filter((z) =>
      ['header', 'contact', 'preamble', 'footer', 'page'].includes(z.label)
    )
    .map((z) => z.text)
    .join('\n');
  const heuristic = headerText ? extractNameWithConfidence(headerText) : '';
  if (heuristic) {
    return { fullName: heuristic, confidence: scoreNameCandidate(heuristic, 72) };
  }

  return { fullName: '', confidence: 0 };
}

export function detectNameNearContactLines(zones: ScanZone[]): NameDetection {
  const lines = getZoneLines(zones, ['header', 'contact', 'preamble', 'footer', 'page']);
  for (const rawLine of lines.slice(0, 14)) {
    const line = normalizeNameLine(rawLine);
    if (!line) continue;
    if (isResumeSectionHeadingLine(line)) continue;
    if (/[@+]|https?:\/\//i.test(line)) continue;
    if (looksLikePersonNameShape(line)) {
      return { fullName: line, confidence: scoreNameCandidate(line, 68) };
    }
    const conf = scoreNameCandidate(line, 65);
    if (conf >= 55) return { fullName: line, confidence: conf };
  }
  return { fullName: '', confidence: 0 };
}

function detectNameFromFirstLines(zones: ScanZone[]): NameDetection {
  for (const zone of zones) {
    if (zone.label === 'full') continue;
    const first = zone.text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).find(Boolean);
    if (!first) continue;
    const line = normalizeNameLine(first);
    if (!line || /[@+]|https?:\/\//i.test(line)) continue;
    const conf = scoreNameCandidate(line, Math.round(66 * zone.weight));
    if (conf >= 58) return { fullName: line, confidence: conf };
  }
  return { fullName: '', confidence: 0 };
}
