/**
 * Sanitization for resume import → builder mapping.
 * Rejects parser fallbacks and merged blobs; splits names for contact fields.
 */

import { cleanString } from './normalize-extracted';

const GARBAGE_PATTERNS = [
  /pdf parsing failed/i,
  /please complete your profile manually/i,
  /^resume:\s*.+\.(pdf|docx?|txt)\b/i,
  /not extracted/i,
  /details not extracted/i,
  /institution not specified/i,
  /company not specified/i,
  /experience details not extracted/i,
  /education details not extracted/i,
  /location not specified/i,
  /salary not specified/i,
];

/** Parser/AI fallback lines that must never land in form fields */
export function isGarbageResumeText(value: unknown): boolean {
  if (value == null) return true;
  const s = String(value).replace(/\s+/g, ' ').trim();
  if (s.length < 2) return true;
  if (GARBAGE_PATTERNS.some((p) => p.test(s))) return true;
  if (s.length > 200 && /@/.test(s) && /\b(linkedin|github|phone|email)\b/i.test(s)) {
    return true;
  }
  return false;
}

export function sanitizeFieldText(value: unknown, maxLen = 500): string {
  if (isGarbageResumeText(value)) return '';
  const s = cleanString(value);
  if (!s) return '';
  return s.length > maxLen ? s.slice(0, maxLen).trim() : s;
}

const HONORIFICS = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'madam']);

/**
 * Split full name → firstName + lastName (handles middle names, single names).
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const raw = sanitizeFieldText(fullName, 120);
  if (!raw) return { firstName: '', lastName: '' };

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };

  let start = 0;
  if (HONORIFICS.has(parts[0].replace(/\./g, '').toLowerCase())) {
    start = 1;
  }
  const nameParts = parts.slice(start);
  if (nameParts.length === 0) {
    return { firstName: parts[0] || '', lastName: '' };
  }
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' };
  }

  return {
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' '),
  };
}

export function sanitizeSkillEntry(skill: unknown): string {
  if (typeof skill !== 'string') {
    if (skill && typeof skill === 'object') {
      const rec = skill as Record<string, unknown>;
      const name = rec.name ?? rec.Name ?? rec.skill;
      if (name != null) return sanitizeSkillEntry(String(name));
    }
    return '';
  }
  let s = sanitizeFieldText(skill.replace(/\s+\d{1,3}%?\s*$/i, ''), 80);
  if (!s) return '';
  if (/^\d{1,3}%?$/.test(s)) return '';
  if (s.includes('\n') || (s.includes(',') && s.length > 60)) return '';
  return s;
}

export function sanitizeExperienceEntry(exp: Record<string, unknown>): Record<string, unknown> | null {
  const company = sanitizeFieldText(
    exp.company || exp.Company || exp.organization || exp.Organization || exp.employer,
    120
  );
  const position = sanitizeFieldText(
    exp.position ||
      exp.Position ||
      exp.jobTitle ||
      exp.JobTitle ||
      exp.job_title ||
      exp.title ||
      exp.role,
    120
  );
  const description = sanitizeFieldText(exp.description || exp.Description, 2000);
  if (!company && !position && !description) return null;
  if (isGarbageResumeText(company) && isGarbageResumeText(position)) return null;

  return {
    ...exp,
    company,
    Company: company,
    position,
    Position: position,
    title: position,
    description,
    Description: description,
    location: sanitizeFieldText(exp.location || exp.Location, 120),
    startDate: exp.startDate || exp.start_date || '',
    endDate: exp.endDate || exp.end_date || '',
  };
}

export function sanitizeEducationEntry(edu: Record<string, unknown>): Record<string, unknown> | null {
  const institution = sanitizeFieldText(
    edu.institution ||
      edu.Institution ||
      edu.school ||
      edu.School ||
      edu.organization ||
      edu.university,
    160
  );
  const degree = sanitizeFieldText(edu.degree || edu.Degree || edu.qualification, 160);
  const field = sanitizeFieldText(edu.field || edu.Field || edu.major, 120);
  if (!institution && !degree) return null;
  if (isGarbageResumeText(degree) && isGarbageResumeText(institution)) return null;

  return {
    ...edu,
    institution,
    degree,
    field,
    description: sanitizeFieldText(edu.description || edu.Description, 500),
    location: sanitizeFieldText(edu.location || edu.Location, 120),
    year: edu.year || edu.endDate || '',
    startDate: edu.startDate || edu.start_date || '',
    endDate: edu.endDate || edu.end_date || edu.year || '',
    gpa: sanitizeFieldText(edu.gpa || edu.GPA, 20),
  };
}
