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
  const valid = experiences.filter(isValidExperience);
  return dedupeOverlappingExperiences(valid);
}

/**
 * Collapse duplicate employer+role rows produced by OCR column bleed / labeled
 * block recovery. Prefer the entry with calendar dates and the cleaner body.
 */
function dedupeOverlappingExperiences(
  experiences: CustomExtractedExperience[]
): CustomExtractedExperience[] {
  if (experiences.length < 2) return experiences;

  const norm = (s: string) =>
    String(s || '')
      .toLowerCase()
      .replace(/\s*[–—-]\s*[a-z].*$/i, '')
      .replace(/[^a-z0-9]+/g, '')
      .trim();

  const educationBleedScore = (exp: CustomExtractedExperience) => {
    const body = `${exp.description || ''}\n${(exp.bulletPoints || []).join('\n')}`;
    let score = 0;
    if (/\b(?:bachelor|master|higher\s+secondary|secondary\s+school|aggregate\s+of|matriculation)\b/i.test(body)) {
      score += 3;
    }
    if (/\b(?:payables?|receivables?|reconciliat|gst|invoice|tally|vendor|booking)\b/i.test(body)) {
      score -= 2;
    }
    return score;
  };

  const quality = (exp: CustomExtractedExperience) => {
    let q = 0;
    if (exp.startDate || exp.endDate || exp.current) q += 40;
    if (exp.company && isPlausibleExperienceCompany(exp.company)) q += 15;
    const descLen = (exp.description || '').length + (exp.bulletPoints || []).join('').length;
    q += Math.min(25, Math.round(descLen / 40));
    q -= educationBleedScore(exp) * 12;
    return q;
  };

  const groups = new Map<string, CustomExtractedExperience[]>();
  for (const exp of experiences) {
    const key = `${norm(exp.company)}|${norm(exp.designation)}`;
    if (!key.replace(/\|/g, '')) {
      // No identity — keep as its own singleton group.
      groups.set(`__singleton_${groups.size}`, [exp]);
      continue;
    }
    const list = groups.get(key) || [];
    list.push(exp);
    groups.set(key, list);
  }

  const out: CustomExtractedExperience[] = [];
  for (const list of groups.values()) {
    if (list.length === 1) {
      out.push(list[0]);
      continue;
    }
    list.sort((a, b) => quality(b) - quality(a));
    out.push(list[0]);
  }
  return out;
}
