/**
 * Validation — reject experience, companies, skills, contact noise.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import {
  isPlausibleExperienceCompany,
  isResumeSectionHeadingLine,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';

import type { CustomExtractedEducation } from './types';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}/;
const SKILL_LIST_RE =
  /^(?:python|java|react|javascript|sql|aws)(?:\s*,\s*(?:python|java|react|javascript|sql|aws)){3,}$/i;

const EXPERIENCE_VERB_RE =
  /\b(managed|mentored|developed|implemented|responsible\s+for|full[- ]?time|employer)\b/i;

export function isValidEducation(edu: CustomExtractedEducation): boolean {
  const hasIdentity = Boolean(edu.institution?.trim() || edu.degree?.trim());
  const hasDates = Boolean(edu.startDate || edu.endDate || edu.current);
  const hasPerformance = Boolean(
    edu.cgpa || edu.gpa || edu.percentage || edu.grade
  );
  const hasField = Boolean(edu.fieldOfStudy?.trim() || edu.specialization?.trim());
  const hasDescription =
    Boolean(edu.description?.trim()) ||
    (edu.achievements?.length ?? 0) > 0 ||
    (edu.coursework?.length ?? 0) > 0;

  if (!hasIdentity) return false;
  // Degree + institution is a complete education row even without dates/GPA.
  if (edu.institution?.trim() && edu.degree?.trim()) {
    // fall through to noise checks
  } else if (!hasDates && !hasPerformance && !hasDescription && !hasField) {
    return false;
  }

  if (edu.institution && isPlausibleExperienceCompany(edu.institution) && !edu.degree) {
    return false;
  }

  if (edu.degree && looksLikeJobTitleLine(edu.degree) && !isLikelyEducationLine(edu.degree)) {
    return false;
  }

  const combined = [edu.institution, edu.degree, edu.description, ...edu.achievements].join(' ');
  if (SKILL_LIST_RE.test(combined.trim()) && !hasIdentity) return false;
  if (EMAIL_RE.test(combined) && combined.length < 100) return false;
  if (
    EXPERIENCE_VERB_RE.test(combined) &&
    !isLikelyEducationLine(combined) &&
    !edu.degree &&
    edu.achievements.length > 0
  ) {
    return false;
  }

  if (isResumeSectionHeadingLine(edu.institution) || isResumeSectionHeadingLine(edu.degree)) {
    return false;
  }

  return true;
}

export function filterValidEducation(
  entries: CustomExtractedEducation[]
): CustomExtractedEducation[] {
  return entries.filter(isValidEducation);
}
