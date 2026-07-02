/**
 * Date range parsing for experience blocks — never invents missing dates.
 */

import { normalizeDate } from '@/lib/resume-parser/normalize-extracted';

import type { ParsedDateRange } from './types';

const MONTH_NAMES =
  'jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december';

const MONTH_YEAR_RANGE_RE = new RegExp(
  `\\b((?:${MONTH_NAMES})\\.?\\s+(?:19|20)\\d{2})\\s*(?:[-–—to]{1,3}|\\s+to\\s+)\\s*((?:${MONTH_NAMES})\\.?\\s+(?:19|20)\\d{2}|present|current|till\\s*date|running|ongoing)\\b`,
  'i'
);

const NUMERIC_MONTH_RANGE_RE =
  /\b(0?[1-9]|1[0-2])[\/\-]((?:19|20)\d{2})\s*(?:[-–—to]{1,3}|to)\s*(?:(0?[1-9]|1[0-2])[\/\-]((?:19|20)\d{2})|present|current|till\s*date|running|ongoing)\b/i;

const YEAR_RANGE_RE =
  /\b((?:19|20)\d{2})\s*(?:[-–—to]{1,3}|to)\s*((?:19|20)\d{2}|present|current|till\s*date|running|ongoing)\b/i;

const ISO_RANGE_RE =
  /\b((?:19|20)\d{2}-(?:0[1-9]|1[0-2]))\s*(?:[-–—to]{1,3}|to)\s*((?:19|20)\d{2}-(?:0[1-9]|1[0-2])|present|current)\b/i;

const PRESENT_RE = /^(present|current|till\s*date|running|ongoing|now)$/i;

function parseEndToken(token: string): { endDate: string | null; current: boolean } {
  const t = token.trim();
  if (PRESENT_RE.test(t)) return { endDate: null, current: true };
  const normalized = normalizeDate(t);
  return { endDate: normalized || null, current: false };
}

export function parseDateRangeFromText(text: string): ParsedDateRange | null {
  const line = text.trim();
  if (!line) return null;

  for (const re of [MONTH_YEAR_RANGE_RE, NUMERIC_MONTH_RANGE_RE, ISO_RANGE_RE, YEAR_RANGE_RE]) {
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
