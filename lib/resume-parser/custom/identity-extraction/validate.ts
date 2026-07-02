/**
 * Validation — reject headings, companies, projects, colleges, skill lists as identity.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import {
  isPlausibleExperienceCompany,
  isPlausiblePersonName,
  isPlausibleProjectName,
  isResumeSectionHeadingLine,
  looksLikeCompanyNameLine,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';

import { looksLikePersonNameShape } from './name';
import type { CustomExtractedIdentity } from './types';

const SKILL_LIST_RE =
  /^(?:python|java|react|javascript|typescript|sql|aws|docker)(?:\s*,\s*(?:python|java|react|javascript|typescript|sql|aws|docker))+$/i;

export function sanitizeIdentityField(
  field: keyof CustomExtractedIdentity,
  value: string
): string {
  const trimmed = value?.trim() || '';
  if (!trimmed) return '';

  if (field === 'fullName') {
    if (!isPlausiblePersonName(trimmed) && !looksLikePersonNameShape(trimmed)) return '';
    if (isResumeSectionHeadingLine(trimmed)) return '';
    if (looksLikeCompanyNameLine(trimmed)) return '';
    if (isPlausibleProjectName(trimmed) && !looksLikePersonNameShape(trimmed)) return '';
    if (isLikelyEducationLine(trimmed)) return '';
    return trimmed;
  }

  if (field === 'professionalHeadline' || field === 'professionalTitle' || field === 'currentDesignation') {
    if (isResumeSectionHeadingLine(trimmed)) return '';
    if (looksLikeCompanyNameLine(trimmed) && !looksLikeJobTitleLine(trimmed)) return '';
    if (SKILL_LIST_RE.test(trimmed)) return '';
    return trimmed;
  }

  if (field === 'currentCompany') {
    if (isResumeSectionHeadingLine(trimmed)) return '';
    if (SKILL_LIST_RE.test(trimmed)) return '';
    return trimmed;
  }

  if (field === 'city' || field === 'state' || field === 'country' || field === 'address') {
    if (isResumeSectionHeadingLine(trimmed)) return '';
    if (SKILL_LIST_RE.test(trimmed)) return '';
    return trimmed;
  }

  return trimmed;
}

export function validateIdentity(identity: CustomExtractedIdentity): CustomExtractedIdentity {
  const cleaned = { ...identity };

  const stringFields: Array<keyof CustomExtractedIdentity> = [
    'fullName',
    'professionalHeadline',
    'email',
    'phone',
    'alternatePhone',
    'linkedin',
    'github',
    'portfolio',
    'website',
    'address',
    'city',
    'state',
    'country',
    'postalCode',
    'nationality',
    'dateOfBirth',
    'currentCompany',
    'currentDesignation',
    'professionalTitle',
  ];

  for (const field of stringFields) {
    if (typeof cleaned[field] === 'string') {
      (cleaned as Record<string, string>)[field] = sanitizeIdentityField(
        field,
        cleaned[field] as string
      );
    }
  }

  if (!cleaned.professionalTitle && cleaned.professionalHeadline) {
    cleaned.professionalTitle = cleaned.professionalHeadline;
  }

  return cleaned;
}

export function hasMinimumIdentity(identity: CustomExtractedIdentity): boolean {
  return Boolean(
    identity.fullName ||
      identity.email ||
      identity.phone ||
      identity.linkedin ||
      identity.github ||
      identity.portfolio
  );
}
