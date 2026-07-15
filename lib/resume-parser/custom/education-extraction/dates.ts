/**
 * Education date parsing — never invents missing dates.
 */

import { normalizeDate } from '@/lib/resume-parser/normalize-extracted';

import { parseDateRangeFromText } from '../experience-extraction/dates';

export interface EducationDateRange {
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  confidence: number;
  raw: string;
}

const EXPECTED_GRAD_RE =
  /(?:expected\s+graduation|graduating|completion)\s*[:–-]?\s*((?:19|20)\d{2}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?:19|20)\d{2})/i;

const SINGLE_YEAR_RE = /\b((?:19|20)\d{2})\b/;

export function parseEducationDates(text: string): EducationDateRange | null {
  const line = text.trim();
  if (!line) return null;

  const expected = line.match(EXPECTED_GRAD_RE);
  if (expected?.[1]) {
    const endDate = normalizeDate(expected[1]);
    if (endDate) {
      return {
        startDate: null,
        endDate,
        current: /expected|graduating/i.test(line),
        confidence: 75,
        raw: expected[0],
      };
    }
  }

  const range = parseDateRangeFromText(line);
  if (range && range.confidence >= 55) {
    return {
      startDate: range.startDate,
      endDate: range.endDate,
      current: range.current,
      confidence: range.confidence,
      raw: range.raw,
    };
  }

  // Trailing "(YYYY)" / bare year on compact Degree – School lines.
  const parenYear = line.match(/\((?:19|20)\d{2}\)\s*$/);
  const bareYear =
    line.length <= 24 || parenYear
      ? line.match(SINGLE_YEAR_RE)
      : null;
  if (bareYear) {
    const y = normalizeDate(bareYear[1]);
    if (y) {
      return {
        startDate: null,
        endDate: y,
        current: false,
        confidence: parenYear ? 72 : 58,
        raw: parenYear?.[0] || bareYear[0],
      };
    }
  }

  return null;
}

export function lineHasEducationDateSignal(text: string): boolean {
  return parseEducationDates(text) !== null;
}