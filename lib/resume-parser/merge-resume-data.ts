/**
 * Field-level merge: Affinda (primary) + Eden AI (secondary enrichment).
 * Affinda always wins on populated values; Eden fills gaps only.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { EdenResumeParser } from '@/lib/eden-resume-parser';
import { ApilayerResumeParser } from '@/lib/apilayer-resume-parser';
import { isEdenEnabled } from '@/lib/resume-parser/eden-config';
import { isApilayerEnabled } from '@/lib/resume-parser/apilayer-config';
import {
  hasAutofillPayload,
  hasMinimalAutofillPayload,
  hasSubstantiveStructuredSections,
  isDocumentAutofillCompleteEnough,
  isDocumentParserAcceptable,
  isSkillsOnlyAutofillPayload,
  isSuspectSummary,
} from '@/lib/resume-parser/map-to-upload-profile';
import { extractResumeFromText } from '@/lib/resume-parser/text-recovery';
import { mergeParserWithRecoveredWording } from '@/lib/resume-parser/prefer-recovered-wording';
import type { ParserTimeBudget, UploadPipelineTiming } from '@/lib/resume-parser/upload-pipeline-trace';
import {
  deriveDisplayNameFromEmail,
  isLikelyJobTitle,
  isPlausiblePersonName,
  isPlausibleExperienceCompany,
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

/** Eden wins when Affinda scalar is populated but classified invalid (summary, etc.). */
function mergeScalarPreferValid(
  primary: string | undefined,
  secondary: string | undefined,
  isInvalid: (value: string) => boolean
): string {
  const p = String(primary || '').trim();
  const s = String(secondary || '').trim();
  if (p && isInvalid(p) && s && !isInvalid(s)) return s;
  if (!p && s) return s;
  if (p && s && isInvalid(p) && isInvalid(s)) return p;
  if (p && s && !isInvalid(p) && !isInvalid(s)) return p;
  return mergeScalar(primary, secondary);
}

function isValidEmail(value: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim());
}

function isInvalidEmail(value: string): boolean {
  return !isValidEmail(value);
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function isInvalidPhone(value: string): boolean {
  return !isValidPhone(value);
}

function isInvalidLocation(value: string): boolean {
  const s = value.trim();
  if (!s || s.length < 2) return true;
  if (/@|https?:|\bwww\./i.test(s)) return true;
  return false;
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
    const edenPlausible = isPlausiblePersonName(eden);
    candidates.push({
      value: eden,
      confidence: edenPlausible ? (affinda && !isPlausiblePersonName(affinda) ? 78 : 68) : 0,
      source: 'eden',
    });
  }

  const emailDerived = deriveDisplayNameFromEmail(emailStr);
  if (emailDerived) {
    candidates.push({
      value: emailDerived,
      confidence: 92,
      source: 'email_derived',
    });
  }

  return pickBestNameFromCandidates(candidates, emailStr);
}

function isExperienceStub(entry: ExperienceEntry): boolean {
  const company = String(entry.company || '').trim();
  const position = String(entry.position || '').trim();
  const startDate = String(entry.startDate || '').trim();
  const endDate = String(entry.endDate || '').trim();
  const description = String(entry.description || '').trim();
  const achievements = entry.achievements?.length ?? 0;
  return !!position && !company && !startDate && !endDate && !description && achievements === 0;
}

function experienceRichness(entry: ExperienceEntry): number {
  let score = 0;
  if (entry.company) score += 3;
  if (entry.position) score += 2;
  if (entry.startDate || entry.endDate) score += 2;
  if (entry.description && entry.description.length > 20) score += 4;
  if ((entry.achievements?.length ?? 0) > 0) score += 2;
  return score;
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
  if (
    isExperienceStub(primary) &&
    secondaryPosition &&
    experienceRichness(secondary) > experienceRichness(primary)
  ) {
    return secondaryPosition;
  }
  if (
    primaryPosition &&
    isLikelyJobTitle(primaryPosition) &&
    !primaryCompany &&
    secondaryPosition &&
    secondary.company
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

function isInvalidExperienceCompany(value: string): boolean {
  const s = String(value || '').trim();
  if (!s) return true;
  return !isPlausibleExperienceCompany(s);
}

function findExperienceMatchIndex(
  result: ExperienceEntry[],
  secondary: ExperienceEntry
): number {
  const matchKey = normKey(secondary.position, secondary.company);
  let idx = result.findIndex((entry) => normKey(entry.position, entry.company) === matchKey);
  if (idx >= 0) return idx;

  const posKey = normKey(secondary.position);
  const dateKey = normKey(secondary.startDate);
  if (posKey && dateKey) {
    idx = result.findIndex(
      (entry) => normKey(entry.position) === posKey && normKey(entry.startDate) === dateKey
    );
    if (idx >= 0) return idx;
  }

  if (posKey) {
    const matches = result
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => normKey(entry.position) === posKey);
    if (matches.length === 1) return matches[0].index;
  }

  return -1;
}

function fillExperience(primary: ExperienceEntry, secondary: ExperienceEntry): ExperienceEntry {
  return {
    ...primary,
    company: mergeScalarPreferValid(primary.company, secondary.company, isInvalidExperienceCompany),
    position: mergeExperiencePosition(primary, secondary),
    location: mergeScalarPreferValid(primary.location, secondary.location, isInvalidLocation),
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
    const matchIdx = findExperienceMatchIndex(result, secondaryEntry);

    if (matchIdx >= 0) {
      result[matchIdx] = fillExperience(result[matchIdx], secondaryEntry);
      continue;
    }

    const matchKey = normKey(secondaryEntry.position, secondaryEntry.company);
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

function isProjectStub(entry: ProjectEntry): boolean {
  const name = String(entry.name || '').trim();
  const description = String(entry.description || '').trim();
  const technologies = entry.technologies?.length ?? 0;
  return !!name && !description && technologies === 0 && !entry.url;
}

function projectRichness(entry: ProjectEntry): number {
  let score = 0;
  if (entry.name) score += 2;
  if (entry.description && entry.description.length > 20) score += 4;
  if ((entry.technologies?.length ?? 0) > 0) score += 2;
  if (entry.url) score += 1;
  if (entry.startDate || entry.endDate) score += 1;
  return score;
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
      const preferSecondary =
        isProjectStub(current) && projectRichness(secondaryEntry) > projectRichness(current);
      result[matchIdx] = {
        ...current,
        description: preferSecondary
          ? String(secondaryEntry.description || current.description || '').trim()
          : mergeScalar(current.description, secondaryEntry.description),
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
    email: mergeScalarPreferValid(affindaData.email, edenData.email, isInvalidEmail),
    phone: mergeScalarPreferValid(affindaData.phone, edenData.phone, isInvalidPhone),
    location: mergeScalarPreferValid(affindaData.location, edenData.location, isInvalidLocation),
    linkedin: mergeScalar(affindaData.linkedin, edenData.linkedin),
    portfolio: mergeScalar(affindaData.portfolio, edenData.portfolio),
    summary: mergeScalarPreferValid(affindaData.summary, edenData.summary, isSuspectSummary),
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
    achievements: mergeStringLists(affindaData.achievements || [], edenData.achievements || []),
    confidence: affindaData.confidence,
    rawText: secondaryRaw.length > primaryRaw.length ? secondaryRaw : primaryRaw,
  };
}

function emptyExtractedResumeData(): ExtractedResumeData {
  return {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    confidence: 0,
    rawText: '',
  };
}

/** Merge parser structure with verbatim text-recovery wording on matched sections. */
export function mergeTextRecoveryIntoExtracted(
  base: ExtractedResumeData,
  rawText: string
): ExtractedResumeData {
  const text = (rawText || '').trim();
  if (text.length < 30) return base;
  const recovered = extractResumeFromText(text);
  return mergeParserWithRecoveredWording(base, recovered);
}

export type DocumentParserResult = {
  data: ExtractedResumeData;
  provider: string;
  affindaData: ExtractedResumeData | null;
  edenData?: ExtractedResumeData;
  apilayerData?: ExtractedResumeData;
};

/**
 * ApiLayer standalone or Affinda+ApiLayer merge — used when Eden is unavailable or fails.
 */
export async function tryApilayerDocumentParse(
  affindaData: ExtractedResumeData | null,
  fileBuffer: Buffer,
  fileName: string
): Promise<DocumentParserResult | null> {
  const affindaBase = affindaData || emptyExtractedResumeData();

  if (!isApilayerEnabled()) {
    return null;
  }

  try {
    const apilayerParser = new ApilayerResumeParser();
    const apilayerData = await apilayerParser.parseResume(fileBuffer, fileName);
    const merged = mergeResumeData(affindaBase, apilayerData);
    logResumeMergeStats(affindaBase, apilayerData, merged);
    const provider = affindaData ? 'affinda+apilayer' : 'apilayer';
    console.log('[resume-merge] ApiLayer document parse accepted:', provider);
    return {
      data: merged,
      provider,
      affindaData,
      apilayerData,
    };
  } catch (error) {
    console.warn(
      '[resume-merge] ApiLayer document parse failed:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Eden standalone or Affinda+Eden merge — used when Affinda primary is rejected or AI is unavailable.
 */
export async function tryEdenAffindaDocumentParse(
  affindaData: ExtractedResumeData | null,
  fileBuffer: Buffer,
  fileName: string
): Promise<DocumentParserResult | null> {
  const affindaBase = affindaData || emptyExtractedResumeData();

  if (!isEdenEnabled()) {
    if (
      affindaData &&
      isDocumentParserAcceptable(affindaData) &&
      hasSubstantiveStructuredSections(affindaData)
    ) {
      return { data: affindaData, provider: 'affinda', affindaData };
    }
    return null;
  }

  try {
    const edenParser = new EdenResumeParser();
    const edenData = await edenParser.parseResume(fileBuffer, fileName);
    const merged = mergeResumeData(affindaBase, edenData);
    logResumeMergeStats(affindaBase, edenData, merged);
    const provider = affindaData ? 'affinda+eden' : 'eden';
    return {
      data: merged,
      provider,
      affindaData,
      edenData,
    };
  } catch (error) {
    console.warn(
      '[resume-merge] Eden document parse failed:',
      error instanceof Error ? error.message : error
    );
    if (
      affindaData &&
      isDocumentParserAcceptable(affindaData) &&
      hasSubstantiveStructuredSections(affindaData)
    ) {
      return { data: affindaData, provider: 'affinda', affindaData };
    }
    return null;
  }
}

function resolveTextRecoveryAutofill(
  affindaData: ExtractedResumeData | null,
  extractedText: string
): (DocumentParserResult & { data: ExtractedResumeData }) | null {
  const affindaTextBase = affindaData
    ? mergeTextRecoveryIntoExtracted(affindaData, extractedText)
    : null;
  if (affindaTextBase && hasMinimalAutofillPayload(affindaTextBase)) {
    return {
      data: affindaTextBase,
      provider: 'affinda+text-recovery',
      affindaData,
    };
  }

  const textOnly = extractResumeFromText(extractedText);
  if (hasMinimalAutofillPayload(textOnly)) {
    return {
      data: textOnly,
      provider: 'text-recovery',
      affindaData,
    };
  }

  return null;
}

export type DocumentParserAutofillOptions = {
  budget?: ParserTimeBudget;
  timing?: UploadPipelineTiming;
  /** When true, skip Eden/Apilayer and use text recovery only (duplicate-call guard). */
  skipExternalParsers?: boolean;
};

/** Document parsers + text recovery — independent of OpenAI/Gemini quota. */
export async function resolveDocumentParserAutofill(
  affindaData: ExtractedResumeData | null,
  fileBuffer: Buffer,
  fileName: string,
  extractedText: string,
  options?: DocumentParserAutofillOptions
): Promise<(DocumentParserResult & { data: ExtractedResumeData }) | null> {
  const budget = options?.budget;
  const timing = options?.timing;

  if (options?.skipExternalParsers) {
    console.warn('[resume-merge] Skipping Eden/Apilayer — document autofill already attempted this request');
    return resolveTextRecoveryAutofill(affindaData, extractedText);
  }

  if (budget && !budget.shouldRunNextParser(8000)) {
    console.warn('[resume-merge] Parser budget low — skipping Eden/Apilayer, using text recovery');
    return resolveTextRecoveryAutofill(affindaData, extractedText);
  }

  let doc: DocumentParserResult | null = null;
  if (!budget || budget.shouldRunNextParser(8000)) {
    const edenStart = Date.now();
    doc = await tryEdenAffindaDocumentParse(affindaData, fileBuffer, fileName);
    timing?.record('edenMs', Date.now() - edenStart);
  }

  if (doc) {
    const withText = mergeTextRecoveryIntoExtracted(doc.data, extractedText);
    if (isDocumentAutofillCompleteEnough(withText)) {
      return { ...doc, data: withText };
    }
    if (isSkillsOnlyAutofillPayload(withText)) {
      console.warn('[resume-merge] Document parser returned skills-only payload — trying Apilayer');
    }
  }

  if (!doc?.provider?.includes('apilayer') && (!budget || budget.shouldRunNextParser(5000))) {
    const apilayerStart = Date.now();
    const apilayerDoc = await tryApilayerDocumentParse(affindaData, fileBuffer, fileName);
    timing?.record('apilayerMs', Date.now() - apilayerStart);
    if (apilayerDoc) {
      const withText = mergeTextRecoveryIntoExtracted(apilayerDoc.data, extractedText);
      if (isDocumentAutofillCompleteEnough(withText)) {
        console.warn('[resume-merge] ApiLayer document parse accepted:', apilayerDoc.provider);
        return { ...apilayerDoc, data: withText };
      }
      if (hasMinimalAutofillPayload(withText)) {
        console.warn('[resume-merge] ApiLayer payload minimal — merging with text recovery');
        return { ...apilayerDoc, data: withText };
      }
    }
  } else if (budget && !budget.shouldRunNextParser(5000)) {
    console.warn('[resume-merge] Parser budget low — skipping Apilayer');
  }

  return resolveTextRecoveryAutofill(affindaData, extractedText);
}

/**
 * Affinda primary parse + optional Eden enrichment (same upload pipeline).
 */
export async function enrichAffindaWithEden(
  affindaData: ExtractedResumeData,
  fileBuffer: Buffer,
  fileName: string
): Promise<{
  data: ExtractedResumeData;
  provider: string;
  affindaData: ExtractedResumeData;
  edenData?: ExtractedResumeData;
}> {
  if (!isEdenEnabled()) {
    return { data: affindaData, provider: 'affinda', affindaData };
  }

  try {
    const edenParser = new EdenResumeParser();
    const edenData = await edenParser.parseResume(fileBuffer, fileName);
    const merged = mergeResumeData(affindaData, edenData);
    logResumeMergeStats(affindaData, edenData, merged);
    return { data: merged, provider: 'affinda+eden', affindaData, edenData };
  } catch (error) {
    console.warn(
      '[resume-merge] Eden enrichment skipped:',
      error instanceof Error ? error.message : error
    );
    return { data: affindaData, provider: 'affinda', affindaData };
  }
}
