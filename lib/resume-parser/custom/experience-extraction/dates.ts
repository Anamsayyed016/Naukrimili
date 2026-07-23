/**
 * Date range parsing for experience blocks — never invents missing dates.
 */

import { normalizeDate } from '@/lib/resume-parser/normalize-extracted';

import type { ParsedDateRange } from './types';
import { parseTenureExperienceLine } from './tenure';

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
    .replace(/[\u2018\u2019\u201A\u201B']/g, "'")
    .replace(/\b(\d{1,2})\s*(?:\r?\n|\s)*(?:st|nd|rd|th)\b/gi, '$1')
    // "Oct'2017" / "Oct'2017" / "Sep2011" → "Oct 2017" / "Sep 2011"
    .replace(
      new RegExp(`\\b((?:${MONTH_NAMES}))\\.?['']?\\s*((?:19|20)\\d{2})\\b`, 'gi'),
      '$1 $2'
    )
    .replace(
      new RegExp(`\\b((?:${MONTH_NAMES}))\\.?((?:19|20)\\d{2})\\b`, 'gi'),
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

/** Abbreviated year: "July'22 – Apr'25", "May 25 – till date", "Nov'14 to May'17" */
const ABBREV_MONTH_YEAR_RANGE_RE = new RegExp(
  `\\b((?:${MONTH_NAMES})\\.?\\s*['’]?\\d{2})\\s*(?:[-–—−]|\\s+to\\s+)\\s*((?:${MONTH_NAMES})\\.?\\s*['’]?\\d{2}|present|current|till\\s*date|to\\s*date|running|ongoing)\\b`,
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

/** Mixed: "03 Jun 2019 to 29/05/2023" or "03 Jun 2019 to 05/2023" */
const DAY_MONTH_YEAR_TO_NUMERIC_RANGE_RE = new RegExp(
  `\\b(\\d{1,2}\\s+(?:${MONTH_NAMES})\\.?\\s+(?:19|20)\\d{2})\\s*(?:[-–—−]|\\s+to\\s+)\\s*(\\d{1,2}[\\/.-]\\d{1,2}[\\/.-](?:19|20)\\d{2}|\\d{1,2}[\\/.-](?:19|20)\\d{2})\\b`,
  'i'
);

/** Mixed reverse: "29/05/2019 to 03 Jun 2023" */
const NUMERIC_TO_DAY_MONTH_YEAR_RANGE_RE = new RegExp(
  `\\b(\\d{1,2}[\\/.-]\\d{1,2}[\\/.-](?:19|20)\\d{2}|\\d{1,2}[\\/.-](?:19|20)\\d{2})\\s*(?:[-–—−]|\\s+to\\s+)\\s*(\\d{1,2}\\s+(?:${MONTH_NAMES})\\.?\\s+(?:19|20)\\d{2}|present|current|till\\s*date|running|ongoing)\\b`,
  'i'
);

/** Parenthetical / pipe CTC tenures already covered once ranges match. */
const PRESENT_RE = /^(present|current|till\s*date|to\s*date|running|ongoing|now)$/i;

const TENURE_LABEL_RE = /^tenure\s*[-–—:]?\s*/i;

/** Expand 2-digit year tokens for normalizeDate (assume 2000+ for YY < 80, else 1900+). */
function expandAbbrevYearToken(token: string): string {
  const t = token.trim().replace(/['’]/g, ' ');
  const m = t.match(
    new RegExp(`^(${MONTH_NAMES})\\.?\\s*'?(\\d{2})$`, 'i')
  );
  if (!m) return t;
  const yy = Number.parseInt(m[2], 10);
  if (!Number.isFinite(yy)) return t;
  const fullYear = yy >= 80 ? 1900 + yy : 2000 + yy;
  return `${m[1]} ${fullYear}`;
}

function parseEndToken(token: string): { endDate: string | null; current: boolean } {
  const t = token.trim();
  if (PRESENT_RE.test(t)) return { endDate: null, current: true };
  const expanded = expandAbbrevYearToken(t);
  const normalized = normalizeDate(expanded);
  return { endDate: normalized || null, current: false };
}

/** True when a line is only a tenure/date header (never a company). */
export function isTenureOrDateOnlyHeaderLine(text: string): boolean {
  const line = healOcrDateArtifacts(String(text || '').trim());
  if (!line || line.length > 72) return false;
  // Condensed "N years experience as Title at Company" is a full job header.
  if (parseTenureExperienceLine(line)) return false;
  if (TENURE_LABEL_RE.test(line)) {
    const rest = line.replace(TENURE_LABEL_RE, '').trim();
    return !rest || parseDateRangeFromText(rest) !== null || parseDateRangeFromText(line) !== null;
  }
  if (/^(?:duration|period|from|dates?)\s*[-–—:]/i.test(line)) {
    return parseDateRangeFromText(line) !== null;
  }
  // Whole line is a date range with no employer cues.
  if (parseDateRangeFromText(line) && !/\b(?:ltd|limited|pvt|llc|inc|corp|company|group|university)\b/i.test(line)) {
    const withoutDates = line
      .replace(TENURE_LABEL_RE, '')
      .replace(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*['’]?\d{2,4}\b/gi, '')
      .replace(/\b(?:19|20)\d{2}\b/g, '')
      .replace(/\b(?:present|current|till\s*date|to\s*date|ongoing|to|from|-|–|—)\b/gi, '')
      .replace(/\d+/g, '')
      .replace(/[^\p{L}\s]/gu, '')
      .trim();
    return withoutDates.length < 3;
  }
  return false;
}

export function parseDateRangeFromText(text: string): ParsedDateRange | null {
  let line = healOcrDateArtifacts(text);
  if (!line) return null;
  // Strip leading Tenure/Duration labels before matching.
  line = line.replace(TENURE_LABEL_RE, '').replace(/^(?:duration|period|from|dates?)\s*[-–—:]?\s*/i, '').trim();

  for (const re of [
    DAY_MONTH_YEAR_RANGE_RE,
    DAY_MONTH_YEAR_TO_NUMERIC_RANGE_RE,
    NUMERIC_TO_DAY_MONTH_YEAR_RANGE_RE,
    MONTH_YEAR_RANGE_RE,
    ABBREV_MONTH_YEAR_RANGE_RE,
    NUMERIC_MONTH_RANGE_RE,
    ISO_RANGE_RE,
    YEAR_RANGE_RE,
  ]) {
    const m = line.match(re);
    if (!m) continue;
    const startRaw = expandAbbrevYearToken(m[1]);
    const endRaw = m[2];
    const startDate = normalizeDate(startRaw);
    if (!startDate) continue;
    const { endDate, current } = parseEndToken(endRaw);
    return {
      startDate,
      endDate,
      current,
      confidence: re === YEAR_RANGE_RE ? 72 : re === ABBREV_MONTH_YEAR_RANGE_RE ? 84 : 88,
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
