/**
 * Validation — reject experience, education, skills, contact, headings.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import { isResumeSectionHeadingLine, looksLikeJobTitleLine } from '@/lib/resume-parser/import-sanitize';
import { isSuspectSummary } from '@/lib/resume-parser/map-to-upload-profile';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
const URL_RE = /https?:\/\/|(?:www\.)?(?:linkedin|github)\.com/i;

const SKILL_LIST_RE =
  /^(?:python|java|react|javascript|typescript|sql|aws|docker|html|css|node\.?js|redis|kafka)(?:\s*,\s*(?:python|java|react|javascript|typescript|sql|aws|docker|html|css|node\.?js|redis|kafka)){2,}$/i;

function looksLikeCommaSkillList(line: string): boolean {
  if (!line.includes(',')) return false;
  const tokens = line.split(',').map((t) => t.trim()).filter(Boolean);
  if (tokens.length < 4) return false;
  return tokens.every(
    (t) =>
      t.length >= 2 &&
      t.length <= 28 &&
      !/\b(with|and|the|for|years?|experience)\b/i.test(t) &&
      !/[.!?]$/.test(t)
  );
}

const EXPERIENCE_DATE_RE =
  /\b(?:19|20)\d{2}\s*[-–—to]+\s*(?:present|current|(?:19|20)\d{2})\b/i;

const JOB_HEADER_RE =
  /\b(?:software engineer|developer|manager|consultant|intern)\b.*\b(?:19|20)\d{2}\b/i;

export function isValidSummaryContent(text: string): boolean {
  const trimmed = text?.trim() || '';
  if (!trimmed || trimmed.length < 20) return false;
  if (isResumeSectionHeadingLine(trimmed) && trimmed.length < 80) return false;
  if (isSuspectSummary(trimmed)) return false;
  // OCR-glued heading remnants / employer stubs are not summaries.
  if (
    /^(?:summary|profile|areas?\s*of\s*expertise|organizational\s*experience)/i.test(
      trimmed.replace(/[^A-Za-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
    ) &&
    trimmed.length < 80
  ) {
    return false;
  }
  if (/^[A-Z]{8,}$/.test(trimmed.replace(/[^A-Za-z]/g, '')) && trimmed.length < 60) {
    return false;
  }
  if (
    /\b(?:pvt\.?\s*ltd|limited|llc|inc)\b/i.test(trimmed) &&
    /\b(?:19|20)\d{2}\b/.test(trimmed) &&
    trimmed.length < 120 &&
    !/\b(?:years?|experienced|skilled|professional)\b/i.test(trimmed)
  ) {
    return false;
  }

  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 1) {
    const line = lines[0];
    if (SKILL_LIST_RE.test(line) || looksLikeCommaSkillList(line)) return false;
    if (EMAIL_RE.test(line) && line.length < 80) return false;
    if (PHONE_RE.test(line) && !/[.!?]/.test(line) && line.length < 50) return false;
    if (URL_RE.test(line) && line.length < 120 && !/\b(with|experience|years?|skilled)\b/i.test(line)) {
      return false;
    }
    if (isLikelyEducationLine(line) && !/\b(passiona|motivat|experienc|skilled|years?)\b/i.test(line)) {
      return false;
    }
  }

  const contactOnly = lines.every(
    (l) => EMAIL_RE.test(l) || PHONE_RE.test(l) || URL_RE.test(l) || l.length < 4
  );
  if (contactOnly) return false;

  const skillHeavy =
    lines.filter((l) => SKILL_LIST_RE.test(l) || (l.includes(',') && l.split(',').length >= 5))
      .length >= 2;
  if (skillHeavy && trimmed.length < 200) return false;

  if (EXPERIENCE_DATE_RE.test(trimmed) && JOB_HEADER_RE.test(trimmed) && trimmed.length < 400) {
    return false;
  }

  if (
    looksLikeJobTitleLine(trimmed) &&
    trimmed.split(/\s+/).length <= 6 &&
    trimmed.length < 60 &&
    !/[.!?]$/.test(trimmed)
  ) {
    return false;
  }

  return true;
}

export function sanitizeSummaryOutput(text: string): string {
  const trimmed = text?.trim() || '';
  if (!trimmed) return '';
  if (!isValidSummaryContent(trimmed)) return '';
  return trimmed;
}
