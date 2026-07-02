/**
 * Validation — reject companies, cities, headings, sentences, contact info.
 */

import {
  isLikelyEducationLine,
  isLikelyLocationFragment,
} from '@/lib/resume-parser/field-classification';
import {
  isPlausibleExperienceCompany,
  isResumeSectionHeadingLine,
  looksLikeJobTitleLine,
  sanitizeSkillEntry,
} from '@/lib/resume-parser/import-sanitize';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_RE = /https?:\/\//i;
const RESPONSIBILITY_RE =
  /\b(responsible for|managed|mentored|developed|implemented|designed|delivered)\b/i;

const SECTION_HEADING_RE =
  /^(?:skills?|technical\s+skills|core\s+skills|expertise|competencies|technologies|tools|frameworks)$/i;

export function isValidSkillCandidate(raw: string): boolean {
  const cleaned = sanitizeSkillEntry(raw);
  if (!cleaned) return false;

  if (SECTION_HEADING_RE.test(cleaned)) return false;
  if (isResumeSectionHeadingLine(cleaned)) return false;
  if (EMAIL_RE.test(cleaned) || URL_RE.test(cleaned)) return false;

  if (isPlausibleExperienceCompany(cleaned) && cleaned.split(/\s+/).length >= 2) {
    return false;
  }
  if (isLikelyLocationFragment(cleaned) && cleaned.split(/\s+/).length <= 3) {
    return false;
  }
  if (isLikelyEducationLine(cleaned) && !/^(java|python|r|go|c)$/i.test(cleaned)) {
    return false;
  }
  if (looksLikeJobTitleLine(cleaned) && cleaned.split(/\s+/).length >= 2) {
    return false;
  }

  if (RESPONSIBILITY_RE.test(cleaned) && cleaned.split(/\s+/).length > 4) {
    return false;
  }
  if (/[.!?]$/.test(cleaned) && cleaned.split(/\s+/).length > 5) {
    return false;
  }

  return true;
}

export function filterValidCandidates<T extends { raw: string }>(candidates: T[]): {
  valid: T[];
  rejectedCount: number;
} {
  const valid: T[] = [];
  let rejectedCount = 0;

  for (const c of candidates) {
    if (isValidSkillCandidate(c.raw)) valid.push(c);
    else rejectedCount += 1;
  }

  return { valid, rejectedCount };
}
