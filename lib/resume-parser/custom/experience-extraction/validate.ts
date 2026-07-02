/**
 * Validation — reject orphan bullets, isolated tech, and invalid experiences.
 */

import { TECH_SKILL_AS_COMPANY_RE } from './constants';
import { looksLikeSentenceNotCompany } from './company';

import type { CustomExtractedExperience } from './types';

const ORPHAN_BULLET_RE =
  /^(skills?|technologies?|tools?|languages?|certifications?|references?)\s*:?\s*$/i;

const SENTENCE_ONLY_RE = /^[a-z].{40,}[.!?]$/;

export function isValidExperience(exp: CustomExtractedExperience): boolean {
  const hasIdentity = Boolean(exp.company?.trim() || exp.designation?.trim());
  const hasDates = Boolean(exp.startDate || exp.endDate || exp.current);
  const hasDescription =
    Boolean(exp.description?.trim()) || (exp.bulletPoints?.length ?? 0) > 0;

  if (!hasIdentity) return false;
  if (!hasDescription && !hasDates) return false;

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

  if (
    exp.company &&
    SENTENCE_ONLY_RE.test(exp.company) &&
    !exp.designation &&
    exp.bulletPoints.length === 0
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
