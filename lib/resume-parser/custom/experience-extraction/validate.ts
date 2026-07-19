/**
 * Validation — reject orphan bullets, isolated tech, and invalid experiences.
 */

import { TECH_SKILL_AS_COMPANY_RE } from './constants';
import { looksLikeSentenceNotCompany } from './company';
import { isPlausibleExperienceCompany } from '@/lib/resume-parser/import-sanitize';

import type { CustomExtractedExperience } from './types';

const ORPHAN_BULLET_RE =
  /^(skills?|technologies?|tools?|languages?|certifications?|references?)\s*:?\s*$/i;

const SENTENCE_ONLY_RE = /^[a-z].{40,}[.!?]$/;

/** Education / exam-result lines mis-attributed as employers (multi-column bleed). */
const ACADEMIC_BLEED_COMPANY_RE =
  /\b(?:rank\s+in\s+(?:college|class|university|school|semester)|(?:sgpa|cgpa|gpa)\b|(?:\d+(?:st|nd|rd|th)\s+in\s+(?:class|college|semester))|semester\s+\d+|percentage\s*(?:obtained|scored)?|marks?\s+obtained)\b/i;

export function isValidExperience(exp: CustomExtractedExperience): boolean {
  const hasIdentity = Boolean(exp.company?.trim() || exp.designation?.trim());
  const hasDates = Boolean(exp.startDate || exp.endDate || exp.current);
  const hasDescription =
    Boolean(exp.description?.trim()) || (exp.bulletPoints?.length ?? 0) > 0;

  if (!hasIdentity) return false;
  // Condensed tenure rows ("N years as Title at Company") are valid even without
  // calendar dates or bullet bodies when both employer and title are present.
  const hasCondensedTenure =
    Boolean(exp.company?.trim()) &&
    Boolean(exp.designation?.trim()) &&
    isPlausibleExperienceCompany(exp.company) &&
    exp.designation.split(/\s+/).length <= 10;
  if (!hasDescription && !hasDates && !hasCondensedTenure) return false;

  if (exp.company && ACADEMIC_BLEED_COMPANY_RE.test(exp.company)) {
    return false;
  }

  if (
    exp.company &&
    !exp.designation &&
    !hasDates &&
    !isPlausibleExperienceCompany(exp.company)
  ) {
    return false;
  }

  if (exp.company && TECH_SKILL_AS_COMPANY_RE.test(exp.company.toLowerCase())) {
    if (!exp.designation) return false;
  }

  if (
    !exp.company &&
    !exp.designation &&
    exp.bulletPoints.length === 1 &&
    exp.bulletPoints[0].length < 30
  ) {
    return false;
  }

  if (ORPHAN_BULLET_RE.test(exp.company) || ORPHAN_BULLET_RE.test(exp.designation)) {
    return false;
  }

  // Role:/Project- field labels must never become the employer identity.
  if (
    /^(?:role|designation|position|title|project|team\s*size)\s*[:\-–—]/i.test(exp.company || '') ||
    /^(?:role|designation|position|title|project|team\s*size)\s*[:\-–—]/i.test(exp.designation || '')
  ) {
    return false;
  }

  if (
    exp.company &&
    SENTENCE_ONLY_RE.test(exp.company) &&
    !exp.designation &&
    exp.bulletPoints.length === 0
  ) {
    return false;
  }

  // Long imperative / prose lines are never employers.
  if (
    exp.company &&
    exp.company.split(/\s+/).length >= 10 &&
    /^(?:conducted|managed|responsible|handled|prepared|developed|supported|coordinated|assisted|monitor)\b/i.test(
      exp.company
    )
  ) {
    return false;
  }

  // Slash-separated department lists are not employers.
  if (exp.company && (exp.company.match(/\//g) || []).length >= 2) {
    return false;
  }

  if (
    exp.designation &&
    (/^(?:to|ensure|carry|organize|planning|taking|doing|coordinating)\b/i.test(exp.designation) ||
      /\broles?\s*(?:&|and)?\s*responsibilit/i.test(exp.designation))
  ) {
    return false;
  }

  if (
    exp.designation &&
    looksLikeSentenceNotCompany(exp.designation) &&
    exp.designation.split(/\s+/).length > 8
  ) {
    return false;
  }

  if (exp.company && looksLikeSentenceNotCompany(exp.company)) {
    return false;
  }

  if (
    exp.technologies.length > 0 &&
    !exp.company &&
    !exp.designation &&
    exp.bulletPoints.length === 0 &&
    !exp.description
  ) {
    return false;
  }

  return true;
}

export function filterValidExperiences(experiences: CustomExtractedExperience[]): CustomExtractedExperience[] {
  return experiences.filter(isValidExperience);
}
