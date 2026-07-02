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
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;
const RESPONSIBILITY_RE =
  /\b(responsible for|managed|mentored|developed|implemented|designed|delivered)\b/i;

const SECTION_HEADING_RE =
  /^(?:skills?|technical\s+skills|core\s+skills|expertise|competencies|technologies|tools|frameworks)$/i;

const KNOWN_TECH_ACRONYMS_RE =
  /^(?:aws|gcp|azure|rest\s+api|api|ci\/cd|html|css|git|sql|nosql|saas|paas|iaas|oauth|jwt|grpc|tcp|udp|http|https|json|xml|yaml|sdk|ide|ui|ux|ml|ai|nlp|ocr|etl|erp|crm)$/i;

export { KNOWN_TECH_ACRONYMS_RE };

export function isValidSkillCandidate(raw: string): boolean {
  const trimmed = (raw || '').trim();
  if (!trimmed) return false;
  if (KNOWN_TECH_ACRONYMS_RE.test(trimmed)) return true;

  const cleaned = sanitizeSkillEntry(raw);
  if (!cleaned) return false;

  if (SECTION_HEADING_RE.test(cleaned)) return false;
  if (isResumeSectionHeadingLine(cleaned)) return false;
  if (EMAIL_RE.test(cleaned) || URL_RE.test(cleaned) || PHONE_RE.test(cleaned)) return false;

  if (isPlausibleExperienceCompany(cleaned) && cleaned.split(/\s+/).length >= 2) {
    return false;
  }
  if (isLikelyLocationFragment(cleaned) && cleaned.split(/\s+/).length <= 3) {
    return false;
  }
  if (isLikelyEducationLine(cleaned) && !/^(java|python|r|go|c|git|aws|css|html)$/i.test(cleaned)) {
    return false;
  }
  if (looksLikeJobTitleLine(cleaned) && cleaned.split(/\s+/).length >= 2) {
    if (!/^(rest\s+api|machine\s+learning)$/i.test(cleaned)) return false;
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
