/**
 * Optional identity metadata — DOB, nationality, current employer.
 */

import { isPlausibleExperienceCompany } from '@/lib/resume-parser/import-sanitize';
import { looksLikeJobTitleLine } from '@/lib/resume-parser/import-sanitize';

import { getZoneLines, type ScanZone } from './sources';

export interface IdentityMetadata {
  nationality: string;
  dateOfBirth: string;
  currentCompany: string;
  currentDesignation: string;
  nationalityConfidence: number;
  dateOfBirthConfidence: number;
  currentCompanyConfidence: number;
  currentDesignationConfidence: number;
}

const DOB_RE =
  /(?:date\s+of\s+birth|dob|born(?:\s+on)?)\s*[:–-]\s*([^\n|]+)/i;
const NATIONALITY_RE = /(?:nationality|citizen(?:ship)?)\s*[:–-]\s*([^\n|]+)/i;
const CURRENT_COMPANY_RE =
  /(?:currently\s+at|current\s+company|employer|working\s+at)\s*[:–-]\s*([^\n|]+)/i;
const CURRENT_ROLE_RE =
  /(?:current\s+(?:role|position|designation|title)|working\s+as)\s*[:–-]\s*([^\n|]+)/i;

export function detectIdentityMetadata(zones: ScanZone[]): IdentityMetadata {
  const text = zones
    .filter((z) => z.label !== 'full')
    .map((z) => z.text)
    .join('\n');
  const lines = getZoneLines(zones, ['header', 'contact', 'preamble']);

  const out: IdentityMetadata = {
    nationality: '',
    dateOfBirth: '',
    currentCompany: '',
    currentDesignation: '',
    nationalityConfidence: 0,
    dateOfBirthConfidence: 0,
    currentCompanyConfidence: 0,
    currentDesignationConfidence: 0,
  };

  const dobMatch = text.match(DOB_RE);
  if (dobMatch?.[1]) {
    out.dateOfBirth = dobMatch[1].trim().slice(0, 40);
    out.dateOfBirthConfidence = 82;
  }

  const natMatch = text.match(NATIONALITY_RE);
  if (natMatch?.[1]) {
    out.nationality = natMatch[1].trim().slice(0, 60);
    out.nationalityConfidence = 80;
  }

  for (const line of lines.slice(0, 15)) {
    const companyMatch = line.match(CURRENT_COMPANY_RE);
    if (companyMatch?.[1] && isPlausibleExperienceCompany(companyMatch[1].trim())) {
      out.currentCompany = companyMatch[1].trim();
      out.currentCompanyConfidence = 78;
    }

    const roleMatch = line.match(CURRENT_ROLE_RE);
    if (roleMatch?.[1] && looksLikeJobTitleLine(roleMatch[1].trim())) {
      out.currentDesignation = roleMatch[1].trim();
      out.currentDesignationConfidence = 76;
    }
  }

  return out;
}
