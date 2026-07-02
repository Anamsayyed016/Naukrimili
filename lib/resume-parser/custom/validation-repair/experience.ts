/**
 * Experience validation and evidence-based repair.
 */

import {
  isPlausibleExperienceCompany,
  looksLikeJobTitleLine,
  looksLikeStandaloneLocationLine,
  reconcileExperienceHeaderFields,
  splitCompanyLocationPipe,
} from '@/lib/resume-parser/import-sanitize';

import { TECH_SKILL_AS_COMPANY_RE } from '../experience-extraction/constants';
import { looksLikeSentenceNotCompany } from '../experience-extraction/company';
import { isValidExperience } from '../experience-extraction/validate';
import type { CustomExtractedExperience } from '../experience-extraction/types';
import type { RepairContext } from './types';
import { recordIssue, recordRepair } from './types';

function expKey(exp: CustomExtractedExperience): string {
  return [
    exp.company?.toLowerCase() || '',
    exp.designation?.toLowerCase() || '',
    exp.startDate || '',
    exp.endDate || '',
  ].join('|');
}

function recoverCompanyFromBullets(exp: CustomExtractedExperience): {
  company: string;
  confidence: number;
} {
  for (const bullet of exp.bulletPoints) {
    if (looksLikeSentenceNotCompany(bullet)) continue;
    const atMatch = bullet.match(/\bat\s+([A-Z][A-Za-z0-9&.,'()\- ]{2,60})/);
    if (atMatch?.[1] && isPlausibleExperienceCompany(atMatch[1])) {
      return { company: atMatch[1].trim(), confidence: 72 };
    }
  }
  for (const bullet of exp.bulletPoints) {
    if (looksLikeSentenceNotCompany(bullet)) continue;
    const pipe = splitCompanyLocationPipe(bullet);
    if (pipe?.company && isPlausibleExperienceCompany(pipe.company)) {
      return { company: pipe.company, confidence: 68 };
    }
  }
  return { company: '', confidence: 0 };
}

export function repairExperienceEntry(
  exp: CustomExtractedExperience,
  index: number,
  ctx: RepairContext
): CustomExtractedExperience {
  let fixed: CustomExtractedExperience = { ...exp };

  const reconciled = reconcileExperienceHeaderFields({
    company: fixed.company,
    position: fixed.designation,
    location: fixed.location,
    startDate: fixed.startDate || '',
    endDate: fixed.endDate || '',
    current: fixed.current,
    description: fixed.description,
    achievements: fixed.bulletPoints,
  }) as Record<string, unknown>;

  const newCompany = String(reconciled.company || '').trim();
  const newPosition = String(reconciled.position || '').trim();
  const newLocation = String(reconciled.location || '').trim();

  if (newCompany !== fixed.company) {
    recordRepair(ctx, {
      section: 'experience',
      field: 'company',
      index,
      originalValue: fixed.company,
      recoveredValue: newCompany,
      evidenceSource: 'parser_aliases',
      confidence: 82,
      reason: 'Reconciled company via header field rules.',
    });
    fixed.company = newCompany;
  }

  if (newPosition !== fixed.designation) {
    recordRepair(ctx, {
      section: 'experience',
      field: 'designation',
      index,
      originalValue: fixed.designation,
      recoveredValue: newPosition,
      evidenceSource: 'parser_aliases',
      confidence: 80,
      reason: 'Reconciled designation via header field rules.',
    });
    fixed.designation = newPosition;
  }

  if (fixed.company && looksLikeSentenceNotCompany(fixed.company)) {
    recordRepair(ctx, {
      section: 'experience',
      field: 'company',
      index,
      originalValue: fixed.company,
      recoveredValue: '',
      evidenceSource: 'current_section',
      confidence: 90,
      reason: 'Cleared sentence-like text from company slot.',
    });
    fixed.company = '';
  }

  if (newLocation !== fixed.location) {
    recordRepair(ctx, {
      section: 'experience',
      field: 'location',
      index,
      originalValue: fixed.location,
      recoveredValue: newLocation,
      evidenceSource: 'parser_aliases',
      confidence: 78,
      reason: 'Reconciled location via header field rules.',
    });
    fixed.location = newLocation;
  }

  if (!fixed.company && fixed.designation && looksLikeJobTitleLine(fixed.designation)) {
    recordIssue(ctx, {
      severity: 'warning',
      section: 'experience',
      field: 'company',
      index,
      code: 'missing_company',
      message: 'Experience entry missing company.',
    });
  }

  if (!fixed.designation && fixed.company && !isPlausibleExperienceCompany(fixed.company)) {
    recordIssue(ctx, {
      severity: 'warning',
      section: 'experience',
      field: 'designation',
      index,
      code: 'missing_designation',
      message: 'Experience entry missing designation.',
    });
  }

  if (fixed.company && TECH_SKILL_AS_COMPANY_RE.test(fixed.company.toLowerCase())) {
    recordIssue(ctx, {
      severity: 'error',
      section: 'experience',
      field: 'company',
      index,
      code: 'tech_as_company',
      message: 'Technology misclassified as company.',
    });
    if (fixed.bulletPoints.length > 0) {
      recordRepair(ctx, {
        section: 'experience',
        field: 'company',
        index,
        originalValue: fixed.company,
        recoveredValue: '',
        evidenceSource: 'current_section',
        confidence: 85,
        reason: 'Cleared tech skill from company slot.',
      });
      fixed.company = '';
    }
  }

  if (!fixed.company) {
    const recovered = recoverCompanyFromBullets(fixed);
    if (recovered.company) {
      recordRepair(ctx, {
        section: 'experience',
        field: 'company',
        index,
        originalValue: '',
        recoveredValue: recovered.company,
        evidenceSource: 'current_section',
        confidence: recovered.confidence,
        reason: 'Recovered company from bullet evidence (at/pipe pattern).',
      });
      fixed.company = recovered.company;
    }
  }

  if (fixed.current && fixed.endDate) {
    recordRepair(ctx, {
      section: 'experience',
      field: 'endDate',
      index,
      originalValue: fixed.endDate,
      recoveredValue: '',
      evidenceSource: 'current_section',
      confidence: 92,
      reason: 'Cleared end date on current role.',
    });
    fixed.endDate = null;
  }

  if (fixed.company && looksLikeStandaloneLocationLine(fixed.company)) {
    recordRepair(ctx, {
      section: 'experience',
      field: 'location',
      index,
      originalValue: fixed.location,
      recoveredValue: fixed.company,
      evidenceSource: 'current_section',
      confidence: 70,
      reason: 'Moved location from company slot.',
    });
    fixed.location = fixed.company;
    fixed.company = '';
  }

  return fixed;
}

export function validateAndRepairExperiences(
  experiences: CustomExtractedExperience[] | undefined,
  ctx: RepairContext
): CustomExtractedExperience[] {
  if (!experiences?.length) return [];

  const repaired = experiences.map((exp, i) => repairExperienceEntry(exp, i, ctx));
  const seen = new Map<string, number>();

  const deduped: CustomExtractedExperience[] = [];
  for (let i = 0; i < repaired.length; i++) {
    const exp = repaired[i];
    if (!isValidExperience(exp)) {
      recordIssue(ctx, {
        severity: 'error',
        section: 'experience',
        index: i,
        code: 'invalid_experience',
        message: 'Experience entry rejected by validation rules.',
      });
      continue;
    }

    const key = expKey(exp);
    if (seen.has(key)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'experience',
        index: i,
        code: 'duplicate_experience',
        message: 'Duplicate experience entry detected.',
      });
      continue;
    }
    seen.set(key, i);
    deduped.push(exp);
  }

  return deduped;
}

export function scoreExperienceSection(experiences: CustomExtractedExperience[]): number {
  if (!experiences.length) return 0;
  const avg =
    experiences.reduce((sum, e) => sum + (e.confidence || 0), 0) / experiences.length;
  return Math.min(100, Math.round(avg));
}
