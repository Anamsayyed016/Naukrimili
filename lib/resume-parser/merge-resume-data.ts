/**
 * Field-level merge: Affinda (primary) + Eden AI (secondary enrichment).
 * Affinda always wins on populated values; Eden fills gaps only.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { EdenResumeParser } from '@/lib/eden-resume-parser';
import { isEdenEnabled } from '@/lib/resume-parser/eden-config';
import {
  isPlausiblePersonName,
  pickBestNameFromCandidates,
  type NameCandidate,
} from '@/lib/resume-parser/import-sanitize';

type ExperienceEntry = ExtractedResumeData['experience'][number];
type EducationEntry = ExtractedResumeData['education'][number];
type ProjectEntry = NonNullable<ExtractedResumeData['projects']>[number];
type CertificationEntry = NonNullable<ExtractedResumeData['certifications']>[number];

function isBlank(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim().length === 0);
}

function normKey(...parts: (string | undefined)[]): string {
  return parts
    .map((p) => String(p || '').toLowerCase().trim())
    .filter(Boolean)
    .join('|');
}

function mergeScalar(primary: string | undefined, secondary: string | undefined): string {
  return isBlank(primary) ? String(secondary || '').trim() : String(primary || '').trim();
}

/** Prefer plausible names; Eden can correct Affinda garbage that is non-blank but invalid. */
function mergeFullName(
  affindaName: string | undefined,
  edenName: string | undefined,
  email: string | undefined
): string {
  const emailStr = String(email || '').trim();
  const candidates: NameCandidate[] = [];

  const affinda = String(affindaName || '').trim();
  if (affinda) {
    candidates.push({
      value: affinda,
      confidence: isPlausiblePersonName(affinda) ? 72 : 0,
      source: 'affinda',
    });
  }

  const eden = String(edenName || '').trim();
  if (eden) {
    candidates.push({
      value: eden,
      confidence: isPlausiblePersonName(eden) ? 68 : 0,
      source: 'eden',
    });
  }

  return pickBestNameFromCandidates(candidates, emailStr);
}

/** When Affinda maps organization into position, Eden's job title should win. */
function mergeExperiencePosition(
  primary: ExperienceEntry,
  secondary: ExperienceEntry
): string {
  const primaryPosition = String(primary.position || '').trim();
  const primaryCompany = String(primary.company || '').trim();
  const secondaryPosition = String(secondary.position || '').trim();

  if (isBlank(primaryPosition)) return secondaryPosition;
  if (
    primaryCompany &&
    primaryPosition.toLowerCase() === primaryCompany.toLowerCase() &&
    secondaryPosition
  ) {
    return secondaryPosition;
  }
  return primaryPosition;
}

function mergeStringLists(primary: string[] = [], secondary: string[] = []): string[] {
  const result = [...primary];
  const seen = new Set(primary.map((s) => s.toLowerCase().trim()).filter(Boolean));
  for (const raw of secondary) {
    const value = String(raw || '').trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function mergeAchievements(primary: string[] = [], secondary: string[] = []): string[] {
  return mergeStringLists(primary, secondary);
}

function fillExperience(primary: ExperienceEntry, secondary: ExperienceEntry): ExperienceEntry {
  return {
    ...primary,
    company: mergeScalar(primary.company, secondary.company),
    position: mergeExperiencePosition(primary, secondary),
    location: mergeScalar(primary.location, secondary.location),
    startDate: mergeScalar(primary.startDate, secondary.startDate),
    endDate: primary.current ? primary.endDate || '' : mergeScalar(primary.endDate, secondary.endDate),
    current: primary.current || secondary.current,
    description: mergeScalar(primary.description, secondary.description),
    achievements: mergeAchievements(primary.achievements, secondary.achievements),
  };
}

function mergeExperience(primary: ExperienceEntry[] = [], secondary: ExperienceEntry[] = []): ExperienceEntry[] {
  if (primary.length === 0) {
    return secondary.map((entry) => ({ ...entry }));
  }

  const result = primary.map((entry) => ({
    ...entry,
    achievements: [...(entry.achievements || [])],
  }));

  for (const secondaryEntry of secondary) {
    const matchKey = normKey(secondaryEntry.position, secondaryEntry.company);
    const matchIdx = result.findIndex(
      (entry) => normKey(entry.position, entry.company) === matchKey
    );

    if (matchIdx >= 0) {
      result[matchIdx] = fillExperience(result[matchIdx], secondaryEntry);
      continue;
    }

    const isDuplicate = result.some(
      (entry) => normKey(entry.position, entry.company) === matchKey
    );
    if (!isDuplicate && matchKey) {
      result.push({ ...secondaryEntry });
    }
  }

  return result;
}

function fillEducation(primary: EducationEntry, secondary: EducationEntry): EducationEntry {
  return {
    ...primary,
    institution: mergeScalar(primary.institution, secondary.institution),
    degree: mergeScalar(primary.degree, secondary.degree),
    field: mergeScalar(primary.field, secondary.field),
    startDate: mergeScalar(primary.startDate, secondary.startDate),
    endDate: mergeScalar(primary.endDate, secondary.endDate),
    gpa: mergeScalar(primary.gpa, secondary.gpa),
    description: mergeScalar(primary.description, secondary.description),
  };
}

function mergeEducation(primary: EducationEntry[] = [], secondary: EducationEntry[] = []): EducationEntry[] {
  if (primary.length === 0) {
    return secondary.map((entry) => ({ ...entry }));
  }

  const result = primary.map((entry) => ({ ...entry }));

  for (const secondaryEntry of secondary) {
    const matchKey = normKey(secondaryEntry.degree, secondaryEntry.institution);
    const matchIdx = result.findIndex(
      (entry) => normKey(entry.degree, entry.institution) === matchKey
    );

    if (matchIdx >= 0) {
      result[matchIdx] = fillEducation(result[matchIdx], secondaryEntry);
      continue;
    }

    if (matchKey) {
      result.push({ ...secondaryEntry });
    }
  }

  return result;
}

function mergeProjects(
  primary: ProjectEntry[] = [],
  secondary: ProjectEntry[] = []
): ProjectEntry[] {
  const result = primary.map((entry) => ({
    ...entry,
    technologies: [...(entry.technologies || [])],
  }));

  for (const secondaryEntry of secondary) {
    const nameKey = String(secondaryEntry.name || '').toLowerCase().trim();
    if (!nameKey) continue;

    const matchIdx = result.findIndex(
      (entry) => String(entry.name || '').toLowerCase().trim() === nameKey
    );

    if (matchIdx >= 0) {
      const current = result[matchIdx];
      result[matchIdx] = {
        ...current,
        description: mergeScalar(current.description, secondaryEntry.description),
        technologies:
          (current.technologies || []).length > 0
            ? current.technologies
            : [...(secondaryEntry.technologies || [])],
        url: mergeScalar(current.url, secondaryEntry.url),
        startDate: mergeScalar(current.startDate, secondaryEntry.startDate),
        endDate: mergeScalar(current.endDate, secondaryEntry.endDate),
      };
      continue;
    }

    result.push({ ...secondaryEntry, technologies: [...(secondaryEntry.technologies || [])] });
  }

  return result;
}

function mergeCertifications(
  primary: CertificationEntry[] = [],
  secondary: CertificationEntry[] = []
): CertificationEntry[] {
  const result = primary.map((entry) => ({ ...entry }));

  for (const secondaryEntry of secondary) {
    const nameKey = String(secondaryEntry.name || '').toLowerCase().trim();
    if (!nameKey) continue;

    const matchIdx = result.findIndex(
      (entry) => String(entry.name || '').toLowerCase().trim() === nameKey
    );

    if (matchIdx >= 0) {
      const current = result[matchIdx];
      result[matchIdx] = {
        ...current,
        issuer: mergeScalar(current.issuer, secondaryEntry.issuer),
        date: mergeScalar(current.date, secondaryEntry.date),
        url: mergeScalar(current.url, secondaryEntry.url),
      };
      continue;
    }

    result.push({ ...secondaryEntry });
  }

  return result;
}

function mergeLanguages(
  primary: Array<string | { name: string; proficiency?: string }> = [],
  secondary: Array<string | { name: string; proficiency?: string }> = []
): Array<string | { name: string; proficiency?: string }> {
  const result: Array<string | { name: string; proficiency?: string }> = [...primary];
  const byName = new Map<string, { name: string; proficiency?: string }>();

  for (const item of result) {
    const name = typeof item === 'string' ? item : item.name;
    if (!name) continue;
    byName.set(name.toLowerCase(), typeof item === 'string' ? { name, proficiency: '' } : item);
  }

  for (const item of secondary) {
    const name = typeof item === 'string' ? item : item.name;
    if (!name) continue;
    const key = name.toLowerCase();
    const proficiency = typeof item === 'string' ? '' : item.proficiency || '';
    const existing = byName.get(key);
    if (!existing) {
      const next = { name, proficiency };
      byName.set(key, next);
      result.push(next);
      continue;
    }
    if (isBlank(existing.proficiency) && !isBlank(proficiency)) {
      existing.proficiency = proficiency;
    }
  }

  return result;
}

export function countResumeFields(data: ExtractedResumeData) {
  return {
    fullName: data.fullName ? 1 : 0,
    email: data.email ? 1 : 0,
    phone: data.phone ? 1 : 0,
    summary: data.summary ? 1 : 0,
    skills: data.skills?.length ?? 0,
    experience: data.experience?.length ?? 0,
    education: data.education?.length ?? 0,
    projects: data.projects?.length ?? 0,
    certifications: data.certifications?.length ?? 0,
    languages: data.languages?.length ?? 0,
    hobbies: data.hobbies?.length ?? 0,
    linkedin: data.linkedin ? 1 : 0,
    portfolio: data.portfolio ? 1 : 0,
  };
}

export function logResumeMergeStats(
  affindaData: ExtractedResumeData,
  edenData: ExtractedResumeData,
  mergedData: ExtractedResumeData
): void {
  console.log('[resume-merge] Affinda field counts:', countResumeFields(affindaData));
  console.log('[resume-merge] Eden field counts:', countResumeFields(edenData));
  console.log('[resume-merge] Merged field counts:', countResumeFields(mergedData));
}

/**
 * Merge Affinda (primary) with Eden (secondary). Affinda wins on populated values.
 */
export function mergeResumeData(
  affindaData: ExtractedResumeData,
  edenData: ExtractedResumeData
): ExtractedResumeData {
  const primaryRaw = affindaData.rawText || '';
  const secondaryRaw = edenData.rawText || '';

  return {
    ...affindaData,
    fullName: mergeFullName(
      affindaData.fullName,
      edenData.fullName,
      affindaData.email || edenData.email
    ),
    email: mergeScalar(affindaData.email, edenData.email),
    phone: mergeScalar(affindaData.phone, edenData.phone),
    location: mergeScalar(affindaData.location, edenData.location),
    linkedin: mergeScalar(affindaData.linkedin, edenData.linkedin),
    portfolio: mergeScalar(affindaData.portfolio, edenData.portfolio),
    summary: mergeScalar(affindaData.summary, edenData.summary),
    skills: mergeStringLists(affindaData.skills || [], edenData.skills || []),
    experience: mergeExperience(affindaData.experience || [], edenData.experience || []),
    education: mergeEducation(affindaData.education || [], edenData.education || []),
    projects: mergeProjects(affindaData.projects || [], edenData.projects || []),
    certifications: mergeCertifications(
      affindaData.certifications || [],
      edenData.certifications || []
    ),
    languages: mergeLanguages(affindaData.languages || [], edenData.languages || []),
    hobbies:
      (affindaData.hobbies || []).length > 0
        ? mergeStringLists(affindaData.hobbies || [], edenData.hobbies || [])
        : [...(edenData.hobbies || [])],
    confidence: affindaData.confidence,
    rawText: secondaryRaw.length > primaryRaw.length ? secondaryRaw : primaryRaw,
  };
}

/**
 * Affinda primary parse + optional Eden enrichment (same upload pipeline).
 */
export async function enrichAffindaWithEden(
  affindaData: ExtractedResumeData,
  fileBuffer: Buffer,
  fileName: string
): Promise<{ data: ExtractedResumeData; provider: string }> {
  if (!isEdenEnabled()) {
    return { data: affindaData, provider: 'affinda' };
  }

  try {
    const edenParser = new EdenResumeParser();
    const edenData = await edenParser.parseResume(fileBuffer, fileName);
    const merged = mergeResumeData(affindaData, edenData);
    logResumeMergeStats(affindaData, edenData, merged);
    return { data: merged, provider: 'affinda+eden' };
  } catch (error) {
    console.warn(
      '[resume-merge] Eden enrichment skipped:',
      error instanceof Error ? error.message : error
    );
    return { data: affindaData, provider: 'affinda' };
  }
}
