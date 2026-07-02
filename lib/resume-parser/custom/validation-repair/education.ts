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
  for (const line of lines) {
    if (INSTITUTION_MARKERS_RE.test(line) && line.toLowerCase().includes(edu.degree.toLowerCase().slice(0, 8))) {
      return { institution: line, confidence: 68 };
    }
    if (INSTITUTION_MARKERS_RE.test(line) && isLikelyEducationLine(line)) {
      return { institution: line, confidence: 62 };
    }
  }
  return { institution: '', confidence: 0 };
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
