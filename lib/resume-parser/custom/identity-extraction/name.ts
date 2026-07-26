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

/** Award / programme / role-title phrases that look Title Case but are not people. */
const NON_PERSON_TITLE_PHRASE_RE =
  /\b(?:award|awards|excellence|recognition|certificate|certification|honou?r|medal|prize|achievement|highlights?|programmes?|programs?|workshop|seminar|conference|summit|keynote|topics?|competenc(?:y|ies)|expertise|mission|summary|objective|motto|declaration)\b/i;

/** Strip honorific prefixes and multi-column padding from a header line. */
export function normalizeNameLine(line: string): string {
  let trimmed = line.trim();
  if (!trimmed) return '';

  // Social platform labels glued onto names ("LinkedIn Dr. Aamir Mehboob").
  trimmed = trimmed
    .replace(
      /^(?:linkedin|youtube|instagram|facebook|face\s*book|twitter|x|github|portfolio)\s*[:\-–—|]?\s+/i,
      ''
    )
    .trim();

  // Keep academic honorifics when credentials trail the name ("Dr. …, Ph.D.").
  const hasTrailingCredential =
    /,?\s*(?:ph\.?\s*d\.?|m\.?\s*d\.?|d\.?\s*phil\.?|mba|ll\.?\s*m|ll\.?\s*b)\.?\s*$/i.test(trimmed);
  if (!hasTrailingCredential) {
    trimmed = trimmed.replace(HONORIFIC_PREFIX_RE, '').trim();
  } else {
    // Normalize "DR." casing for display consistency while keeping the honorific.
    trimmed = trimmed.replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, (_, h: string) => {
      const map: Record<string, string> = {
        dr: 'Dr.',
        mr: 'Mr.',
        mrs: 'Mrs.',
        ms: 'Ms.',
        prof: 'Prof.',
      };
      return `${map[h.toLowerCase()] || 'Dr.'} `;
    });
  }
  // Keep academic doctorates / credentials as part of display name detection
  // but strip document-title prefixes.
  trimmed = trimmed
    .replace(
      /^(?:curriculum\s+vitae|curriculum\s+vita|resume|bio[- ]?data|biodata|c\.?v\.?)\s*[:\-–—]?\s+/i,
      ''
    )
    .trim();

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
  if (NON_PERSON_TITLE_PHRASE_RE.test(trimmed)) return false;
  if (
    /^(?:linkedin|youtube|instagram|facebook|face\s*book|twitter|github|portfolio)\b/i.test(
      trimmed
    )
  ) {
    return false;
  }
  if (isResumeSectionHeadingLine(trimmed)) return false;

  const core = trimmed
    .replace(/,?\s*(?:ph\.?\s*d\.?|m\.?\s*d\.?|d\.?\s*phil\.?|mba|ca|cs|acs|fcs)\.?$/i, '')
    .replace(/^(?:dr|mr|mrs|ms|prof)\.?\s+/i, '')
    .trim();
  const words = core.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 6) return false;

  const isTitleCaseName = /^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,4}$/.test(core);
  const isAllCapsName =
    /^[A-Z](?:[A-Z]|[\s'.\-]){3,}$/.test(core) &&
    words.every((w) => /^[A-Z][A-Z'-]*\.?$/.test(w));

  // Multi-word length heuristics often flag person names as "company lines".
  if (looksLikeCompanyNameLine(core) && !isTitleCaseName && !isAllCapsName) {
    return false;
  }
  if (looksLikeJobTitleLine(core) && !isTitleCaseName && !isAllCapsName) {
    return false;
  }

  if (isTitleCaseName) return true;
  if (isAllCapsName) return true;
  if (/^[A-Z][A-Z\s'-]{3,}$/.test(core)) return true;
  return false;
}

export function scoreNameCandidate(value: string, baseConfidence: number): number {
  const trimmed = value.trim();
  if (
    /^(?:linkedin|youtube|instagram|facebook|face\s*book|twitter|github|portfolio)\b/i.test(
      trimmed
    )
  ) {
    return 0;
  }
  if (NON_PERSON_TITLE_PHRASE_RE.test(trimmed)) return 0;
  const shapeOk = looksLikePersonNameShape(trimmed);
  const withCredentials = trimmed
    .replace(/,?\s*(?:ph\.?\s*d\.?|m\.?\s*d\.?|d\.?\s*phil\.?|mba|ca|cs|acs|fcs)\.?$/i, '')
    .trim();
  const shapeOkCred = withCredentials !== trimmed && looksLikePersonNameShape(withCredentials);
  if (!trimmed || (!isPlausiblePersonName(trimmed) && !shapeOk && !shapeOkCred)) return 0;
  if (isResumeSectionHeadingLine(trimmed) && !shapeOkCred) return 0;

  const classified = classifyResumeTextFragment(trimmed);
  if (classified.kind === 'COMPANY_NAME') return 0;
  if (classified.kind === 'SECTION_HEADER' && !shapeOkCred) return 0;
  if (classified.kind === 'DESIGNATION' && classified.confidence >= 75) return 0;
  if (classified.kind === 'EDUCATION' && !shapeOkCred) return 0;
  if (classified.kind === 'PROJECT_NAME' && classified.confidence >= 70) return 0;

  let score = baseConfidence;
  if (classified.kind === 'PERSON_NAME') score = Math.max(score, classified.confidence);
  if ((shapeOk || shapeOkCred) && score < 55) score = Math.max(score, 62);
  if (/^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,3}$/.test(trimmed)) score += 8;
  if (/^[A-Z][A-Z\s'-]{3,}$/.test(trimmed) && trimmed.split(/\s+/).length >= 2) score += 6;
  // Prefer formal document-title names (ALL CAPS + credentials) over social handle lines.
  if (
    /^DR\.?\s+[A-Z][A-Z\s.',-]{6,}$/i.test(trimmed) ||
    (/^[A-Z][A-Z\s.',-]{6,}$/.test(trimmed) &&
      trimmed.split(/\s+/).length >= 3 &&
      /(?:ph\.?\s*d|m\.?\s*d|mba|ca|cs)\.?/i.test(trimmed))
  ) {
    score += 18;
  }

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
  const firstLine = detectNameFromFirstLines(zones);
  const candidates = collectZoneNameCandidates(zones);

  // Always include early detectors as ranked candidates — never early-return a
  // Title Case award/role line before credentialed document headers are scored.
  if (near.fullName && near.confidence > 0) {
    candidates.push({
      value: near.fullName,
      confidence: near.confidence,
      source: 'near_contact',
    });
  }
  if (firstLine.fullName && firstLine.confidence > 0) {
    candidates.push({
      value: firstLine.fullName,
      confidence: firstLine.confidence,
      source: 'first_line',
    });
  }

  // Prefer the intact full-document text. Concatenating footer/contact/page zones
  // first buries the header name past the early-line scan windows and yields
  // section mottos / award titles instead.
  const fullZoneText =
    zones.find((z) => z.label === 'full')?.text?.trim() ||
    zones
      .filter((z) => z.label === 'header' || z.label === 'preamble')
      .map((z) => z.text)
      .join('\n')
      .trim();
  if (fullZoneText.length >= 40) {
    for (const c of collectNameCandidatesFromText(fullZoneText)) {
      candidates.push({
        ...c,
        confidence: scoreNameCandidate(c.value, c.confidence),
      });
    }
  }

  const ranked = candidates.filter((c) => c.confidence > 0 && scoreNameCandidate(c.value, c.confidence) > 0);
  const best = pickBestNameFromCandidates(ranked, primaryEmail);
  if (best) {
    const matched = ranked.find(
      (c) => c.value === best || sanitizeComparable(c.value) === sanitizeComparable(best)
    );
    const confidence = matched?.confidence ?? scoreNameCandidate(best, 70);
    return { fullName: best, confidence };
  }

  if (near.fullName && near.confidence >= 55) return near;
  if (firstLine.fullName && firstLine.confidence >= 58) return firstLine;

  const headerText = zones
    .filter((z) =>
      ['header', 'contact', 'preamble', 'footer', 'page', 'full'].includes(z.label)
    )
    .map((z) => z.text)
    .join('\n');
  const heuristic = headerText ? extractNameWithConfidence(
    zones.find((z) => z.label === 'full')?.text || headerText
  ) : '';
  if (heuristic) {
    return { fullName: heuristic, confidence: scoreNameCandidate(heuristic, 72) };
  }

  return { fullName: '', confidence: 0 };
}

function sanitizeComparable(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export function detectNameNearContactLines(zones: ScanZone[]): NameDetection {
  // Include the start of the full document so header names above the fold are seen
  // even when contact/footer zones are assembled from the resume tail.
  const lines = [
    ...getZoneLines(zones, ['header', 'contact', 'preamble', 'page']),
    ...(zones.find((z) => z.label === 'full')?.text || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 20),
    ...getZoneLines(zones, ['footer']),
  ];
  let best: NameDetection = { fullName: '', confidence: 0 };
  for (const rawLine of lines.slice(0, 40)) {
    const line = normalizeNameLine(rawLine);
    if (!line) continue;
    if (isResumeSectionHeadingLine(line)) continue;
    if (/[@+]|https?:\/\//i.test(line)) continue;
    const conf = scoreNameCandidate(line, looksLikePersonNameShape(line) ? 72 : 65);
    if (conf > best.confidence) {
      best = { fullName: line, confidence: conf };
    }
  }
  return best;
}

function detectNameFromFirstLines(zones: ScanZone[]): NameDetection {
  let best: NameDetection = { fullName: '', confidence: 0 };
  for (const zone of zones) {
    if (zone.label === 'full') continue;
    const first = zone.text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).find(Boolean);
    if (!first) continue;
    const line = normalizeNameLine(first);
    if (!line || /[@+]|https?:\/\//i.test(line)) continue;
    const conf = scoreNameCandidate(line, Math.round(70 * zone.weight));
    if (conf > best.confidence) {
      best = { fullName: line, confidence: conf };
    }
  }
  return best;
}
