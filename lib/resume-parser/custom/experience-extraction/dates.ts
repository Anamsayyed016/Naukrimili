/**
 * Date range parsing for experience blocks — never invents missing dates.
 */

import { normalizeDate } from '@/lib/resume-parser/normalize-extracted';

import type { ParsedDateRange } from './types';

const MONTH_NAMES =
  'jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december';

/**
 * Heal OCR artifacts common in PDF text extraction before range matching:
 * - Ordinal line breaks: "26\nth\nJune 2025" / "1 st Feb"
 * - Glued month+year: "June2025"
 * - Compact "to till date" / "tilldate"
 */
export function healOcrDateArtifacts(text: string): string {
  return String(text || '')
    .replace(/\b(\d{1,2})\s*(?:\r?\n|\s)*(?:st|nd|rd|th)\b/gi, '$1')
    .replace(
      new RegExp(`\\b((?:${MONTH_NAMES}))\\s*((?:19|20)\\d{2})\\b`, 'gi'),
      '$1 $2'
    )
    // Keep a range separator when normalizing "to till date" → present.
    .replace(/\bto\s*till\s*date\b/gi, 'to present')
    .replace(/\btill\s*date\b/gi, 'present')
    .replace(/\s+/g, ' ')
    .trim();
}

const MONTH_YEAR_RANGE_RE = new RegExp(
  `\\b((?:${MONTH_NAMES})\\.?\\s+(?:19|20)\\d{2})\\s*(?:[-–—−]|\\s+to\\s+)\\s*((?:${MONTH_NAMES})\\.?\\s+(?:19|20)\\d{2}|present|current|till\\s*date|running|ongoing)\\b`,
  'i'
);

const NUMERIC_MONTH_RANGE_RE =
  /\b(0?[1-9]|1[0-2])[\/\-]((?:19|20)\d{2})\s*(?:[-–—−]|to)\s*(?:(0?[1-9]|1[0-2])[\/\-]((?:19|20)\d{2})|present|current|till\s*date|running|ongoing)\b/i;

const YEAR_RANGE_RE =
  /\b((?:19|20)\d{2})\s*(?:[-–—−]|\s+to\s+)\s*((?:19|20)\d{2}|present|current|till\s*date|running|ongoing)\b/i;

const ISO_RANGE_RE =
  /\b((?:19|20)\d{2}-(?:0[1-9]|1[0-2]))\s*(?:[-–—−]|\s+to\s+)\s*((?:19|20)\d{2}-(?:0[1-9]|1[0-2])|present|current)\b/i;

/** Day+Month+Year ranges: "26 June 2025 to till date", "1 Feb 2022 – 25 June 2025" */
const DAY_MONTH_YEAR_RANGE_RE = new RegExp(
  `\\b(\\d{1,2}\\s+(?:${MONTH_NAMES})\\.?\\s+(?:19|20)\\d{2})\\s*(?:[-–—−]|\\s+to\\s+)\\s*(\\d{1,2}\\s+(?:${MONTH_NAMES})\\.?\\s+(?:19|20)\\d{2}|present|current|till\\s*date|running|ongoing)\\b`,
  'i'
);

const PRESENT_RE = /^(present|current|till\s*date|running|ongoing|now)$/i;

function parseEndToken(token: string): { endDate: string | null; current: boolean } {
  const t = token.trim();
  if (PRESENT_RE.test(t)) return { endDate: null, current: true };
  const normalized = normalizeDate(t);
  return { endDate: normalized || null, current: false };
}

export function parseDateRangeFromText(text: string): ParsedDateRange | null {
  const line = healOcrDateArtifacts(text);
  if (!line) return null;

  for (const re of [
    DAY_MONTH_YEAR_RANGE_RE,
    MONTH_YEAR_RANGE_RE,
    NUMERIC_MONTH_RANGE_RE,
    ISO_RANGE_RE,
    YEAR_RANGE_RE,
  ]) {
    const m = line.match(re);
    if (!m) continue;
    const startRaw = m[1];
    const endRaw = m[2];
    const startDate = normalizeDate(startRaw);
    if (!startDate) continue;
    const { endDate, current } = parseEndToken(endRaw);
    return {
      startDate,
      endDate,
      current,
      confidence: re === YEAR_RANGE_RE ? 72 : 88,
      raw: m[0],
    };
  }

  const singleYear = line.match(/\b((?:19|20)\d{2})\b/);
  if (singleYear && line.length <= 24) {
    const y = normalizeDate(singleYear[1]);
    if (y) {
      return {
        startDate: y,
        endDate: null,
        current: false,
        confidence: 55,
        raw: singleYear[0],
      };
    }
  }

  return null;
}

export function lineHasDateSignal(text: string): boolean {
  return parseDateRangeFromText(text) !== null;
}
