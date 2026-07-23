/**
 * Education validation and evidence-based repair.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import {
  isPlausibleExperienceCompany,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';

import { isValidEducation } from '../education-extraction/validate';
import type { CustomExtractedEducation } from '../education-extraction/types';
import type { RepairContext } from './types';
import { recordIssue, recordRepair } from './types';

const INSTITUTION_MARKERS_RE =
  /\b(university|college|institute|school|academy|polytechnic|vidyalaya|vidyapeeth)\b/i;

const EDUCATION_TABLE_HEADER_RE =
  /^(?:degree|board|university|college|school|institute|institution|year|academic(?:\s+year)?|percentage|percent(?:\s*-\s*age)?|percent(?:age)?(?:\s*\/\s*cgpa)?|cgpa|gpa|marks|score|result|division|grade|name\s+of\s+(?:school|college|institute|institution|university)|board\s*\/\s*university|degree\s+board(?:\s*\/\s*university)?)\s*$/i;

function eduKey(edu: CustomExtractedEducation): string {
  return [
    edu.institution?.toLowerCase() || '',
    edu.degree?.toLowerCase() || '',
    edu.endDate || edu.startDate || '',
  ].join('|');
}

function recoverInstitutionFromDegree(
  edu: CustomExtractedEducation,
  sectionText: string
): { institution: string; confidence: number } {
  if (!sectionText || edu.institution || !edu.degree) return { institution: '', confidence: 0 };

  const lines = sectionText.split(/\n/).map((l) => l.trim()).filter(Boolean);
  let best: { institution: string; confidence: number } = { institution: '', confidence: 0 };
  for (const rawLine of lines) {
    const line = rawLine.replace(/([A-Za-z])-\s+([a-z])/g, '$1$2').replace(/\s+/g, ' ').trim();
    if (EDUCATION_TABLE_HEADER_RE.test(line)) continue;
    if (/^\d{1,2}(?:\.\d{1,2})?\s*(?:cgpa|gpa|sgpa|%)\s*$/i.test(line)) continue;
    // Prefer full school/college names over degree+acronym mash lines.
    if (
      INSTITUTION_MARKERS_RE.test(line) &&
      !/\b(?:b\.?\s*tech|m\.?\s*tech|b\.?\s*e\.?|mba|b\.?\s*sc|m\.?\s*sc)\b/i.test(line) &&
      isLikelyEducationLine(line)
    ) {
      const conf = line.split(/\s+/).length >= 4 ? 78 : 62;
      if (conf > best.confidence) best = { institution: line, confidence: conf };
      continue;
    }
    // Compact "B.Tech. CAMPUS, CITY 2004-2008" — recover campus acronym.
    const campus = line.match(
      /(?:b\.?\s*tech\.?|b\.?\s*e\.?|m\.?\s*tech\.?|mba)\s+([A-Z]{3,8})\s*,/i
    );
    if (campus?.[1] && best.confidence < 70) {
      best = { institution: campus[1], confidence: 70 };
    }
  }
  return best;
}

export function repairEducationEntry(
  edu: CustomExtractedEducation,
  index: number,
  ctx: RepairContext
): CustomExtractedEducation {
  const fixed: CustomExtractedEducation = { ...edu };

  if (!fixed.institution && fixed.degree) {
    const recovered = recoverInstitutionFromDegree(fixed, ctx.sectionTexts.education || '');
    if (recovered.institution) {
      recordRepair(ctx, {
        section: 'education',
        field: 'institution',
        index,
        originalValue: '',
        recoveredValue: recovered.institution,
        evidenceSource: 'section_metadata',
        confidence: recovered.confidence,
        reason: 'Recovered institution from education section lines.',
      });
      fixed.institution = recovered.institution;
    }
  }

  // Drop table-header debris that slipped into institution.
  if (fixed.institution && EDUCATION_TABLE_HEADER_RE.test(fixed.institution.trim())) {
    recordRepair(ctx, {
      section: 'education',
      field: 'institution',
      index,
      originalValue: fixed.institution,
      recoveredValue: '',
      evidenceSource: 'section_metadata',
      confidence: 90,
      reason: 'Cleared education table header misfiled as institution.',
    });
    fixed.institution = '';
    if (fixed.degree) {
      const recovered = recoverInstitutionFromDegree(fixed, ctx.sectionTexts.education || '');
      if (recovered.institution) fixed.institution = recovered.institution;
    }
  }

  // Promote institute-shaped field-of-study into institution when missing.
  if (
    !fixed.institution &&
    fixed.fieldOfStudy &&
    INSTITUTION_MARKERS_RE.test(fixed.fieldOfStudy) &&
    !EDUCATION_TABLE_HEADER_RE.test(fixed.fieldOfStudy.trim())
  ) {
    fixed.institution = fixed.fieldOfStudy.replace(/\s*-\s+/g, ' ').replace(/\s+/g, ' ').trim();
    fixed.fieldOfStudy = '';
  }

  if (!fixed.degree && fixed.institution && isLikelyEducationLine(fixed.institution)) {
    recordIssue(ctx, {
      severity: 'warning',
      section: 'education',
      field: 'degree',
      index,
      code: 'missing_degree',
      message: 'Education entry missing degree.',
    });
  }

  if (!fixed.institution && fixed.degree) {
    recordIssue(ctx, {
      severity: 'warning',
      section: 'education',
      field: 'institution',
      index,
      code: 'missing_institution',
      message: 'Education entry missing institution.',
    });
  }

  if (fixed.institution && isPlausibleExperienceCompany(fixed.institution) && !INSTITUTION_MARKERS_RE.test(fixed.institution)) {
    recordIssue(ctx, {
      severity: 'manual_review',
      section: 'education',
      field: 'institution',
      index,
      code: 'company_as_institution',
      message: 'Company name may be misclassified as institution.',
    });
  }

  if (fixed.degree && looksLikeJobTitleLine(fixed.degree) && !isLikelyEducationLine(fixed.degree)) {
    recordIssue(ctx, {
      severity: 'manual_review',
      section: 'education',
      field: 'degree',
      index,
      code: 'degree_in_wrong_field',
      message: 'Degree field may contain job title.',
    });
  }

  if (fixed.current && fixed.endDate) {
    recordRepair(ctx, {
      section: 'education',
      field: 'endDate',
      index,
      originalValue: fixed.endDate,
      recoveredValue: '',
      evidenceSource: 'current_section',
      confidence: 90,
      reason: 'Cleared end date on current education.',
    });
    fixed.endDate = null;
  }

  return fixed;
}

export function validateAndRepairEducation(
  educations: CustomExtractedEducation[] | undefined,
  ctx: RepairContext
): CustomExtractedEducation[] {
  if (!educations?.length) return [];

  const repaired = educations.map((e, i) => repairEducationEntry(e, i, ctx));
  const seen = new Map<string, number>();
  const deduped: CustomExtractedEducation[] = [];

  for (let i = 0; i < repaired.length; i++) {
    const edu = repaired[i];
    if (!isValidEducation(edu)) {
      recordIssue(ctx, {
        severity: 'error',
        section: 'education',
        index: i,
        code: 'invalid_education',
        message: 'Education entry rejected by validation rules.',
      });
      continue;
    }

    const key = eduKey(edu);
    if (seen.has(key)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'education',
        index: i,
        code: 'duplicate_education',
        message: 'Duplicate education entry detected.',
      });
      continue;
    }
    seen.set(key, i);
    deduped.push(edu);
  }

  return deduped;
}

export function scoreEducationSection(educations: CustomExtractedEducation[]): number {
  if (!educations.length) return 0;
  const avg = educations.reduce((sum, e) => sum + (e.confidence || 0), 0) / educations.length;
  return Math.min(100, Math.round(avg));
}
