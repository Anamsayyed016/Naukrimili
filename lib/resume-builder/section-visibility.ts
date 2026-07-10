/**
 * Centralized section visibility and meaningful-content checks.
 * Shared by preview (template-loader) and PDF export (template-loader-server).
 */

import {
  canonicalizeSkillName,
  dedupeExperienceBodyLines,
  scoreBulletQuality,
  scoreSkillConfidence,
  countPlausibleExperienceCompanies,
  countPlausibleProjects,
  demoteImplausibleExperienceCompany,
  finalizeExperienceListForCustomParserImport,
  recoverStructuredExperienceFromRawText,
} from '@/lib/resume-parser/import-sanitize';
import { overlaySparseSectionsFromTextRecovery } from '@/lib/resume-parser/prefer-recovered-wording';
import { extractResumeFromText } from '@/lib/resume-parser/text-recovery';
import { splitBullets } from '@/lib/resume-parser/normalize-extracted';
import {
  readExperienceDescriptionForForm,
  syncExperienceEntryAliases,
} from '@/lib/resume-builder/experience-entry-sync';
import { isCustomParserImport } from '@/lib/resume-parser/custom-parser-import';
import {
  isImportFieldTraceEnabled,
  traceImportStageTransform,
} from '@/lib/resume-parser/import-field-trace';

export type ResumeSectionKey =
  | 'contact'
  | 'profileImage'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'languages'
  | 'hobbies';

/** Maps template conditional names (uppercase) to formData sectionVisibility keys */
export const TEMPLATE_SECTION_TO_KEY: Record<string, ResumeSectionKey> = {
  CONTACT: 'contact',
  PROFILE_IMAGE: 'profileImage',
  SUMMARY: 'summary',
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
  SKILLS: 'skills',
  PROJECTS: 'projects',
  CERTIFICATIONS: 'certifications',
  ACHIEVEMENTS: 'achievements',
  LANGUAGES: 'languages',
  HOBBIES: 'hobbies',
};

/** Sections whose placeholders contain rendered HTML (not plain text) */
const HTML_SECTIONS = new Set([
  'CONTACT',
  'EXPERIENCE',
  'EDUCATION',
  'SKILLS',
  'PROJECTS',
  'CERTIFICATIONS',
  'ACHIEVEMENTS',
  'LANGUAGES',
  'HOBBIES',
]);

function getStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Strip tags/whitespace to detect empty HTML shells */
export function hasMeaningfulRenderedHtml(html: string | undefined | null): boolean {
  if (!html || typeof html !== 'string') return false;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 0;
}

function isGarbageFieldText(value: string): boolean {
  if (!value) return true;
  if (/pdf parsing failed|please complete your profile manually|not extracted|\.pdf\b/i.test(value)) {
    return true;
  }
  if (value.length > 200 && /@/.test(value) && /\b(linkedin|github)\b/i.test(value)) {
    return true;
  }
  return false;
}

export function hasMeaningfulText(value: unknown): boolean {
  const text = getStringValue(value);
  if (!text) return false;
  return !isGarbageFieldText(text);
}

export function isDemoProfileImage(url: unknown): boolean {
  const value = getStringValue(url);
  if (!value) return false;
  if (value.includes('naulogoimg_j5uodj')) return true;
  if (value.includes('drot7xb9m/image/upload') && value.includes('naulogoimg')) return true;
  return false;
}

export function isValidProfileImage(url: unknown): boolean {
  const value = getStringValue(url);
  if (!value) return false;
  // Legacy sample avatars should not count as user-uploaded photos
  if (value.includes('ui-avatars.com')) return false;
  if (isDemoProfileImage(value)) return false;
  return true;
}

export function isSectionForcedHidden(
  sectionKey: ResumeSectionKey,
  formData: Record<string, unknown>
): boolean {
  const visibility = formData.sectionVisibility;
  if (!visibility || typeof visibility !== 'object' || Array.isArray(visibility)) {
    return false;
  }
  return (visibility as Record<string, boolean>)[sectionKey] === false;
}

export function shouldRenderSection(
  templateSectionName: string,
  placeholderValue: string | undefined,
  formData: Record<string, unknown>
): boolean {
  const upper = templateSectionName.toUpperCase();
  const sectionKey = TEMPLATE_SECTION_TO_KEY[upper];

  if (sectionKey && isSectionForcedHidden(sectionKey, formData)) {
    return false;
  }

  if (!placeholderValue || typeof placeholderValue !== 'string') {
    return false;
  }

  if (HTML_SECTIONS.has(upper)) {
    return hasMeaningfulRenderedHtml(placeholderValue);
  }

  return placeholderValue.trim().length > 0;
}

export function renderContactListHtml(
  formData: Record<string, unknown>,
  escapeHtml: (text: string) => string
): string {
  if (isSectionForcedHidden('contact', formData)) {
    return '';
  }

  const readField = (keys: string[]): string => {
    for (const key of keys) {
      const value = formData[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  };

  const fields: Array<{ keys: string[] }> = [
    { keys: ['Phone', 'phone'] },
    { keys: ['Email', 'email'] },
    { keys: ['Location', 'location'] },
    { keys: ['LinkedIn', 'linkedin'] },
    { keys: ['Portfolio', 'website', 'portfolio'] },
  ];

  return fields
    .map(({ keys }) => readField(keys))
    .filter(Boolean)
    .map(
      (value) =>
        `<div class="contact-item"><span class="contact-label">${escapeHtml(value)}</span></div>`
    )
    .join('');
}

const PROFILE_IMAGE_FIELD_KEYS = [
  'profileImage',
  'photo',
  'profilePhoto',
  'Profile Image',
  'Photo',
] as const;

export function resolveProfileImageForRender(
  formData: Record<string, unknown>,
  _getString?: (keys: string[]) => string
): string {
  if (isSectionForcedHidden('profileImage', formData)) {
    return '';
  }
  for (const key of PROFILE_IMAGE_FIELD_KEYS) {
    const value = formData[key];
    if (isValidProfileImage(value)) {
      return getStringValue(value);
    }
  }
  return '';
}

export function filterMeaningfulExperiences(
  experiences: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  if (!Array.isArray(experiences)) return [];
  return experiences.filter(isMeaningfulExperience);
}

export function isMeaningfulExperience(exp: Record<string, unknown>): boolean {
  const textFields = [
    'Company',
    'company',
    'organization',
    'Organization',
    'employer',
    'Employer',
    'companyName',
    'CompanyName',
    'Position',
    'position',
    'title',
    'Title',
    'designation',
    'Designation',
    'role',
    'Role',
    'jobTitle',
    'JobTitle',
    'Description',
    'description',
    'Duration',
    'duration',
    'startDate',
    'StartDate',
    'Start Date',
    'endDate',
    'EndDate',
    'End Date',
    'location',
    'Location',
  ];

  if (textFields.some((key) => hasMeaningfulText(exp[key]))) {
    return true;
  }

  return exp.current === true || exp.Current === true;
}

export function filterMeaningfulEducation(
  education: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  if (!Array.isArray(education)) return [];
  return education.filter(isMeaningfulEducation);
}

export function isMeaningfulEducation(edu: Record<string, unknown>): boolean {
  const textFields = [
    'Institution',
    'institution',
    'school',
    'School',
    'university',
    'University',
    'college',
    'College',
    'Degree',
    'degree',
    'Year',
    'year',
    'graduationDate',
    'GraduationDate',
    'Field',
    'field',
    'CGPA',
    'cgpa',
  ];
  return textFields.some((key) => hasMeaningfulText(edu[key]));
}

const NON_SKILL_PATTERNS: RegExp[] = [
  /\bhusband\b/i,
  /\bwife\b/i,
  /\bfather\b/i,
  /\bmother\b/i,
  /\bmarital\b/i,
  /\bmarried\b/i,
  /\bunmarried\b/i,
  /\bdate of birth\b/i,
  /\bd\.?o\.?b\.?\b/i,
  /\bbirth\s*date\b/i,
  /\bnationality\b/i,
  /\breligion\b/i,
  /\bgender\b/i,
  /\bpassport\b/i,
  /\bpan\s*card\b/i,
  /\baadhaar\b/i,
  /\blanguage\s*known\b/i,
  /\blanguages?\s*:/i,
  /\bseptember\b/i,
  /\bjanuary\b|\bfebruary\b|\bmarch\b|\bapril\b|\bmay\b|\bjune\b|\bjuly\b|\baugust\b|\boctober\b|\bnovember\b|\bdecember\b/i,
  /\bcooking\b/i,
  /\byoga\b/i,
  /\bmeditation\b/i,
  /\bexercise\b/i,
  /\bsports\b/i,
  /^hobbies?\b/i,
  /^interests?\b/i,
  /^personal\b/i,
  /^\d{1,2}\s*$/,
  /^\d{4}$/,
];

const LANGUAGE_HINT_PATTERN =
  /\b(english|hindi|tamil|telugu|bengali|marathi|gujarati|kannada|malayalam|punjabi|urdu|french|spanish|german|arabic|mandarin|cantonese)\b/i;

/** Personal / hobby / metadata lines that parsers often misplace into skills. */
export function isPersonalOrNonSkillEntry(value: string): boolean {
  const text = value.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
  if (!text || text.length < 2) return true;
  if (NON_SKILL_PATTERNS.some((p) => p.test(text))) return true;
  if (text.length > 48 && /\s/.test(text) && !/^[A-Z][a-z]+(\s+[A-Z][a-z]+){0,3}$/.test(text)) {
    return true;
  }
  if (/@/.test(text) || /\d{10}/.test(text)) return true;
  return false;
}

/** Status words, date-only tokens, and labeled personal-detail lines — not valid section content. */
const PERSONAL_METADATA_LABEL_RE =
  /^(marital\s*status|date\s*of\s*birth|d\.?o\.?b\.?|gender|nationality|languages?\s*known|religion|passport|blood\s*group)\s*[:.\-]/i;

const INVALID_SECTION_TITLE_RE =
  /^(single|married|unmarried|widowed|divorced|current|present|ongoing|na|n\/a)$/i;

const DATE_ONLY_TITLE_RE =
  /^((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(19|20)\d{2}$/i;

/** Shared render-time guard — extends skill metadata checks to all sections. */
export function isPersonalMetadataEntry(value: string): boolean {
  const text = value.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
  if (!text) return true;
  if (isPersonalOrNonSkillEntry(text)) return true;
  if (PERSONAL_METADATA_LABEL_RE.test(text)) return true;
  if (INVALID_SECTION_TITLE_RE.test(text)) return true;
  if (DATE_ONLY_TITLE_RE.test(text)) return true;
  if (/^marital\s+status\s*:\s*\w+$/i.test(text)) return true;
  return false;
}

const VOLUNTEER_CONTEXT_RE =
  /\b(volunteer(?:ing)?|pro\s*bono|community\s+service|nonprofit|non-profit|ngo|charity|hospice|shelter|food\s+bank|mentor(?:ing)?)\b/i;

const PROFESSIONAL_WORK_VOLUNTEER_RE =
  /\b(pvt\.?\s*ltd|limited|inc\.?|corp(?:oration)?\.?|llp|plc|gmbh|consultancy|consulting|erp|sap|invoic|stakeholder|accounts?\s+payable)\b/i;

/** Paid employment lines that must not render under volunteer (mirrors import reconcile rules). */
export function isMisroutedProfessionalVolunteerLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 6) return false;
  if (PERSONAL_METADATA_LABEL_RE.test(t) || INVALID_SECTION_TITLE_RE.test(t)) return true;
  if (/^marital\s+status\s*:/i.test(t)) return true;
  if (VOLUNTEER_CONTEXT_RE.test(t)) return false;
  if (PROFESSIONAL_WORK_VOLUNTEER_RE.test(t)) return true;
  if (
    /\b(manager|analyst|engineer|developer|director|executive|consultant|associate|accountant|auditor|specialist)\b/i.test(
      t
    ) &&
    (/\bat\s+[A-Za-z]/i.test(t) ||
      /\|\s*(19|20)\d{2}/.test(t) ||
      /\b(19|20)\d{2}\s*[-–—]/.test(t))
  ) {
    return true;
  }
  if (/\b(19|20)\d{2}\s*[-–—]\s*(present|current|(19|20)\d{2})\b/i.test(t) && t.length > 20) {
    return true;
  }
  return false;
}

function projectDisplayName(project: Record<string, unknown>): string {
  return String(
    project.name ?? project.Name ?? project.title ?? project.Title ?? ''
  ).trim();
}

export function isInvalidProjectEntry(project: Record<string, unknown>): boolean {
  const name = projectDisplayName(project);
  if (!hasMeaningfulText(name)) return true;
  if (isPersonalMetadataEntry(name)) return true;
  const desc = String(
    project.description ?? project.Description ?? project.summary ?? project.Summary ?? ''
  ).trim();
  if (desc && isPersonalMetadataEntry(desc)) return true;
  return false;
}

export function isInvalidAchievementEntry(item: unknown): boolean {
  if (typeof item === 'string') {
    return !hasMeaningfulText(item) || isPersonalMetadataEntry(item);
  }
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const title = String(record.Title ?? record.title ?? record.name ?? '').trim();
    const desc = String(record.description ?? record.Description ?? '').trim();
    if (!hasMeaningfulText(title) && !hasMeaningfulText(desc)) return true;
    if (title && isPersonalMetadataEntry(title)) return true;
    if (desc && isPersonalMetadataEntry(desc)) return true;
    return false;
  }
  return true;
}

function isExperiencePersonalMetadataOnly(exp: Record<string, unknown>): boolean {
  const company = String(exp.company ?? exp.Company ?? '').trim();
  const title = String(
    exp.title ?? exp.Title ?? exp.position ?? exp.Position ?? ''
  ).trim();
  const desc = String(exp.description ?? exp.Description ?? '').trim();
  if (company && isPersonalMetadataEntry(company)) return true;
  if (title && isPersonalMetadataEntry(title) && !company && !desc) return true;
  if (!company && !title && desc && isPersonalMetadataEntry(desc)) return true;
  return false;
}

function parseVolunteerLineAsExperience(line: string): Record<string, unknown> | null {
  const t = line.trim();
  if (!t) return null;
  const atMatch = t.match(/^(.+?)\s+at\s+(.+?)(?:\s*[-–—|]\s*(.+))?$/i);
  if (atMatch) {
    const role = atMatch[1].trim();
    const company = atMatch[2].trim();
    const duration = atMatch[3]?.trim() || '';
    return {
      title: role,
      position: role,
      company,
      description: duration,
      duration,
    };
  }
  return { company: t.slice(0, 160), title: '', position: '', description: t };
}

function mergeExperienceEntries(
  base: Record<string, unknown>[],
  incoming: Record<string, unknown>[]
): Record<string, unknown>[] {
  const out = [...base];
  for (const row of incoming) {
    const fp = `${String(row.company || '').trim()}|${String(row.title || row.position || '').trim()}`.toLowerCase();
    if (!fp.replace(/\|/g, '')) continue;
    if (
      out.some(
        (e) =>
          `${String(e.company || '').trim()}|${String(e.title || e.position || '').trim()}`.toLowerCase() === fp
      )
    ) {
      continue;
    }
    out.push(row);
  }
  return out;
}

function filterVolunteerStrings(items: unknown[]): {
  kept: string[];
  rerouteExperience: Record<string, unknown>[];
} {
  const kept: string[] = [];
  const rerouteExperience: Record<string, unknown>[] = [];
  for (const raw of items) {
    if (typeof raw !== 'string') continue;
    const text = raw.trim();
    if (!text) continue;
    if (isMisroutedProfessionalVolunteerLine(text)) {
      const exp = parseVolunteerLineAsExperience(text);
      if (exp) rerouteExperience.push(exp);
      continue;
    }
    if (isPersonalMetadataEntry(text)) continue;
    kept.push(text);
  }
  return { kept, rerouteExperience };
}

/** Reject invalid section assignments before template injection (single coalesce gate). */
export function applyRenderSectionIntegrity(input: {
  experience: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  achievements: unknown[];
  volunteer?: unknown[];
  extendedSections?: Record<string, unknown>;
  additionalResumeData?: Record<string, unknown>;
}): {
  experience: Record<string, unknown>[];
  projects: Record<string, unknown>[];
  achievements: unknown[];
  volunteer: string[];
  extendedSections: Record<string, unknown>;
  additionalResumeData: Record<string, unknown>;
} {
  let experience = input.experience.filter(
    (entry) => isMeaningfulExperience(entry) && !isExperiencePersonalMetadataOnly(entry)
  );
  const projects = filterMeaningfulProjects(input.projects);
  const achievements = filterMeaningfulAchievements(input.achievements);

  const reroute: Record<string, unknown>[] = [];
  const volunteerSources: unknown[][] = [
    Array.isArray(input.volunteer) ? input.volunteer : [],
  ];
  const ext =
    input.extendedSections && typeof input.extendedSections === 'object'
      ? { ...input.extendedSections }
      : {};
  if (Array.isArray(ext.volunteer)) volunteerSources.push(ext.volunteer as unknown[]);

  const additional =
    input.additionalResumeData && typeof input.additionalResumeData === 'object'
      ? { ...input.additionalResumeData }
      : {};
  if (Array.isArray(additional.volunteerWork)) {
    volunteerSources.push(additional.volunteerWork as unknown[]);
  }

  const keptVolunteer: string[] = [];
  for (const source of volunteerSources) {
    const { kept, rerouteExperience } = filterVolunteerStrings(source);
    keptVolunteer.push(...kept);
    reroute.push(...rerouteExperience);
  }
  const volunteer = [...new Set(keptVolunteer)];

  if (reroute.length > 0) {
    experience = mergeExperienceEntries(experience, reroute);
  }

  ext.volunteer = volunteer;
  additional.volunteerWork = volunteer;

  return {
    experience,
    projects,
    achievements,
    volunteer,
    extendedSections: ext,
    additionalResumeData: additional,
  };
}

/** List-item guard for extended/native string sections (volunteer, achievements, etc.). */
export function isInvalidStringListItemForSection(text: string, sectionLabel?: string): boolean {
  if (isPersonalMetadataEntry(text)) return true;
  if (sectionLabel && /volunteer/i.test(sectionLabel) && isMisroutedProfessionalVolunteerLine(text)) {
    return true;
  }
  return false;
}

export function isLikelyLanguageEntry(value: string): boolean {
  const text = value.trim();
  if (!text || text.length > 80) return false;
  if (LANGUAGE_HINT_PATTERN.test(text)) return true;
  if (/^[A-Za-z\s&]+\(\s*(native|fluent|basic|intermediate|advanced)\s*\)$/i.test(text)) {
    return true;
  }
  if (/^(english|hindi|tamil|telugu|bengali|marathi|gujarati|kannada|malayalam|punjabi|urdu)(?:\s*&\s*\w+)*$/i.test(text)) {
    return true;
  }
  return false;
}

export function partitionSkillsForRender(skills: string[]): {
  skills: string[];
  languageHints: string[];
  droppedPersonal: number;
} {
  const kept: string[] = [];
  const languageHints: string[] = [];
  let droppedPersonal = 0;

  for (const raw of skills) {
    if (typeof raw !== 'string') continue;
    const name = raw.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
    if (!name) continue;
    if (isPersonalOrNonSkillEntry(name)) {
      droppedPersonal += 1;
      if (isLikelyLanguageEntry(name)) languageHints.push(name);
      continue;
    }
    if (isLikelyLanguageEntry(name) && name.split(/\s+/).length <= 6) {
      languageHints.push(name);
      continue;
    }
    if (!kept.some((s) => s.toLowerCase() === name.toLowerCase())) {
      kept.push(name);
    }
  }

  return { skills: kept, languageHints, droppedPersonal };
}

export function filterMeaningfulSkills<T>(skills: T[]): T[] {
  if (!Array.isArray(skills)) return [];
  return skills.filter((skill) => {
    if (typeof skill === 'string') {
      const name = skill.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
      if (name.length === 0 || /^\d{1,3}%?$/.test(name)) return false;
      return !isPersonalOrNonSkillEntry(name);
    }
    if (skill && typeof skill === 'object') {
      const record = skill as Record<string, unknown>;
      const name = record.name ?? record.Name ?? record.skill ?? record.Skill;
      if (!hasMeaningfulText(name)) return false;
      return !isPersonalOrNonSkillEntry(String(name));
    }
    return false;
  });
}

/**
 * Split a single skill token that was concatenated without delimiters
 * (e.g. PythonJavaScriptTypeScript from PDF extraction).
 */
export function splitSkillToken(token: string): string[] {
  const trimmed = token.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
  if (!trimmed) return [];
  if (/[,;|•\n]/.test(trimmed)) {
    return trimmed
      .split(/[,;|•\n]+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  if (trimmed.length < 18 || /\s{2,}/.test(trimmed)) {
    return [trimmed];
  }
  const hasCamelBlob = /[a-z][A-Z]/.test(trimmed) || /[A-Z]{2,}[a-z]/.test(trimmed);
  if (!hasCamelBlob) {
    return [trimmed];
  }
  const parts = trimmed
    .split(/(?=[A-Z][a-z])|(?<=[a-z0-9])(?=[A-Z]{2,}(?![a-z]))|(?<=[0-9])(?=[A-Za-z])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 1);
  if (parts.length >= 3) {
    return parts;
  }
  return [trimmed];
}

function resolveSkillsRawForRender(formData: Record<string, unknown>): unknown {
  // Canonical `skills` is authoritative when present (including []) — never revive
  // deleted tokens from Skills / technicalSkills aliases after the user edits.
  if (Object.prototype.hasOwnProperty.call(formData, 'skills')) {
    const canonical = formData.skills;
    if (Array.isArray(canonical)) return canonical;
    if (typeof canonical === 'string') return canonical;
  }

  const keys = ['Skills', 'technicalSkills'];
  for (const key of keys) {
    const value = formData[key];
    if (Array.isArray(value) && value.length > 0) return value;
    if (typeof value === 'string' && value.trim()) return value;
  }
  for (const key of keys) {
    const value = formData[key];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value;
  }
  return undefined;
}

/** Normalize skills from array, comma-separated string, or legacy object rows. */
export function normalizeSkillsForRender(formData: Record<string, unknown>): string[] {
  const raw = resolveSkillsRawForRender(formData);
  const collected: string[] = [];

  const pushToken = (token: string) => {
    for (const part of splitSkillToken(token)) {
      const name = part.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
      if (!name || /^\d{1,3}%?$/.test(name)) continue;
      if (!collected.some((s) => s.toLowerCase() === name.toLowerCase())) {
        collected.push(name);
      }
    }
  };

  if (typeof raw === 'string') {
    raw.split(/[,;|•\n]+/).forEach((part) => pushToken(part));
  } else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string') {
        if (item.includes(',') || item.includes(';')) {
          item.split(/[,;|•\n]+/).forEach((part) => pushToken(part));
        } else {
          pushToken(item);
        }
      } else if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        pushToken(String(record.name ?? record.Name ?? record.skill ?? record.Skill ?? ''));
      }
    }
  }

  return filterMeaningfulSkills(collected);
}

export function filterMeaningfulProjects(
  projects: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  if (!Array.isArray(projects)) return [];
  return projects.filter((project) => !isInvalidProjectEntry(project));
}

export function filterMeaningfulCertifications(
  certifications: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  if (!Array.isArray(certifications)) return [];
  return certifications.filter((cert) => {
    const name = cert.Name ?? cert.name ?? cert.title ?? cert.Title;
    return hasMeaningfulText(name);
  });
}

export function filterMeaningfulAchievements(
  achievements: unknown[]
): unknown[] {
  if (!Array.isArray(achievements)) return [];
  return achievements.filter((item) => {
    if (isInvalidAchievementEntry(item)) return false;
    if (typeof item === 'string') return hasMeaningfulText(item);
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      return hasMeaningfulText(record.Title ?? record.title ?? record.name);
    }
    return false;
  });
}

function parseYearMonth(value: unknown): number | null {
  const text = getStringValue(value);
  if (!text || /present|current|now|ongoing/i.test(text)) return null;
  const ym = text.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) return parseInt(ym[1], 10) * 12 + parseInt(ym[2], 10);
  const y = text.match(/\b(19|20)\d{2}\b/);
  if (y) return parseInt(y[0], 10) * 12;
  return null;
}

/** Rough total years of experience from date fields (for layout only). */
export function estimateExperienceYears(
  experiences: Array<Record<string, unknown>>
): number {
  if (!Array.isArray(experiences) || experiences.length === 0) return 0;

  let earliest: number | null = null;
  let latest: number | null = null;
  const now = new Date();
  const nowMonths = now.getFullYear() * 12 + now.getMonth() + 1;

  for (const exp of experiences) {
    if (!isMeaningfulExperience(exp)) continue;
    const start =
      parseYearMonth(exp.startDate) ??
      parseYearMonth(exp.StartDate) ??
      parseYearMonth(exp['Start Date']);
    const end =
      parseYearMonth(exp.endDate) ??
      parseYearMonth(exp.EndDate) ??
      parseYearMonth(exp['End Date']) ??
      (exp.current === true || exp.Current === true ? nowMonths : null);

    if (start != null) earliest = earliest == null ? start : Math.min(earliest, start);
    const endPoint = end ?? nowMonths;
    if (endPoint != null) latest = latest == null ? endPoint : Math.max(latest, endPoint);
  }

  if (earliest == null || latest == null) {
    return experiences.filter(isMeaningfulExperience).length > 0 ? 2 : 0;
  }
  return Math.max(0, (latest - earliest) / 12);
}

export function isFresherProfile(formData: Record<string, unknown>): boolean {
  const level = getStringValue(formData.experienceLevel).toLowerCase();
  if (level === 'fresher' || level === 'student') return true;

  const experience = resolveCanonicalArray(formData, 'experience', [
    'workExperience',
    'Work Experience',
    'Experience',
  ]) as Array<Record<string, unknown>>;

  const meaningful = filterMeaningfulExperiences(experience);
  if (meaningful.length === 0) return true;

  return estimateExperienceYears(meaningful) <= 1;
}

export function filterMeaningfulStringList(items: unknown[]): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function mergeLanguageHints(existing: unknown[], hints: string[]): unknown[] {
  const out = [...existing];
  const seen = new Set(
    existing.map((l) => {
      if (typeof l === 'string') return l.toLowerCase();
      if (l && typeof l === 'object') {
        const r = l as Record<string, unknown>;
        return String(r.language ?? r.Language ?? r.name ?? '').toLowerCase();
      }
      return '';
    })
  );
  for (const hint of hints) {
    const key = hint.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ language: hint, name: hint, Language: hint, proficiency: '' });
  }
  return out;
}

/** Strip resume metadata wrongly placed in hobbies — not legitimate hobby names (cooking, sports, etc.). */
const HOBBIES_METADATA_PATTERNS: RegExp[] = [
  /\bhusband\b/i,
  /\bwife\b/i,
  /\bfather\b/i,
  /\bmother\b/i,
  /\bmarital\b/i,
  /\bmarried\b/i,
  /\bdate of birth\b/i,
  /\bd\.?o\.?b\.?\b/i,
  /\bnationality\b/i,
  /\breligion\b/i,
  /\bgender\b/i,
  /\bpassport\b/i,
  /language\s*known/i,
  /^hobbies?\s*$/i,
  /^interests?\s*$/i,
];

function filterHobbiesExcludingPersonal(hobbies: unknown[]): unknown[] {
  if (!Array.isArray(hobbies)) return [];
  return hobbies.filter((item) => {
    const text =
      typeof item === 'string'
        ? item
        : String((item as Record<string, unknown>).name ?? (item as Record<string, unknown>).title ?? '');
    if (!hasMeaningfulText(text)) return false;
    if (HOBBIES_METADATA_PATTERNS.some((pattern) => pattern.test(text))) {
      return false;
    }
    return true;
  });
}

type TemplateSectionShell = {
  sectionClass: string;
  headingClass: string;
  listClass: string;
  headingLabel: string;
  placement: 'main' | 'sidebar';
};

const TEMPLATE_SECTION_LABELS: Record<string, string> = {
  EXPERIENCE: 'Professional Experience',
  PROJECTS: 'Projects',
  EDUCATION: 'Education',
  SKILLS: 'Skills',
  CERTIFICATIONS: 'Certifications',
  LANGUAGES: 'Languages',
  ACHIEVEMENTS: 'Achievements',
  SUMMARY: 'Summary',
  HOBBIES: 'Interests',
};

const TEMPLATE_SECTION_LIST_CLASS: Record<string, string> = {
  EXPERIENCE: 'experience-list',
  PROJECTS: 'projects-list',
  EDUCATION: 'education-list',
  SKILLS: 'skills-list',
  CERTIFICATIONS: 'certifications-list',
  LANGUAGES: 'languages-list',
  ACHIEVEMENTS: 'achievements-list',
  HOBBIES: 'hobbies-list',
};

/** Detect section shell markup from an existing template block (import-mode injection). */
export function detectTemplateSectionShell(
  htmlTemplate: string,
  sectionToken: string
): TemplateSectionShell {
  const token = sectionToken.toUpperCase();
  const re = new RegExp(`\\{\\{#if ${token}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'i');
  const match = htmlTemplate.match(re);

  if (match) {
    const block = match[1];
    const headingFromTemplate =
      block.match(/<h2[^>]*>([^<]+)</i)?.[1]?.trim() ||
      block.match(/<h3[^>]*>([^<]+)</i)?.[1]?.trim();
    const sectionClass =
      block.match(/<section[^>]*class="([^"]*)"/i)?.[1] ||
      block.match(/class="([^"]*section[^"]*)"/i)?.[1] ||
      'content-section';
    const headingClass =
      block.match(/<h2[^>]*class="([^"]*)"/i)?.[1] ||
      block.match(/<h3[^>]*class="([^"]*)"/i)?.[1] ||
      'section-title';
    const listClass =
      block.match(/<div[^>]*class="([^"]*-list[^"]*)"/i)?.[1] ||
      TEMPLATE_SECTION_LIST_CLASS[token] ||
      'content-list';
    const inSidebar =
      /sidebar-section|tm-sidebar-panel|ese-section--side|[\s-]side[\s-]/i.test(block) ||
      /<aside/i.test(block) ||
      (htmlTemplate.includes('sidebar') &&
        htmlTemplate.indexOf(match[0]) < htmlTemplate.indexOf('main-content'));

    return {
      sectionClass,
      headingClass,
      listClass,
      headingLabel: headingFromTemplate || TEMPLATE_SECTION_LABELS[token] || token,
      placement: inSidebar ? 'sidebar' : 'main',
    };
  }

  for (const fallbackToken of [
    'EXPERIENCE',
    'PROJECTS',
    'EDUCATION',
    'SKILLS',
    'CERTIFICATIONS',
    'LANGUAGES',
    'ACHIEVEMENTS',
    'HOBBIES',
  ]) {
    if (fallbackToken === token) continue;
    const shell = detectTemplateSectionShell(htmlTemplate, fallbackToken);
    if (shell.sectionClass !== 'content-section' || shell.listClass !== 'content-list') {
      return {
        ...shell,
        headingLabel: TEMPLATE_SECTION_LABELS[token] || token,
        listClass: TEMPLATE_SECTION_LIST_CLASS[token] || shell.listClass,
      };
    }
  }

  return {
    sectionClass: 'content-section',
    headingClass: 'section-title',
    listClass: TEMPLATE_SECTION_LIST_CLASS[token] || 'content-list',
    headingLabel: TEMPLATE_SECTION_LABELS[token] || token,
    placement: htmlTemplate.includes('sidebar') ? 'sidebar' : 'main',
  };
}

function detectHobbiesSectionShell(htmlTemplate: string): TemplateSectionShell {
  return detectTemplateSectionShell(htmlTemplate, 'HOBBIES');
}

function injectSectionHtmlIntoLayout(
  renderedHtml: string,
  sectionHtml: string,
  placement: 'main' | 'sidebar'
): string {
  if (placement === 'sidebar') {
    const sidebarMatch = renderedHtml.match(/(<aside[^>]*>[\s\S]*?)(\s*<\/aside>)/i);
    if (sidebarMatch) {
      return renderedHtml.replace(sidebarMatch[0], `${sidebarMatch[1]}\n${sectionHtml}\n${sidebarMatch[2]}`);
    }
    const sidebarDiv = renderedHtml.match(
      /(<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?)(\s*<\/div>)/i
    );
    if (sidebarDiv) {
      return renderedHtml.replace(sidebarDiv[0], `${sidebarDiv[1]}\n${sectionHtml}\n${sidebarDiv[2]}`);
    }
  }

  const mainMatch = renderedHtml.match(/(<main[^>]*>[\s\S]*?)(\s*<\/main>)/i);
  if (mainMatch) {
    return renderedHtml.replace(mainMatch[0], `${mainMatch[1]}\n${sectionHtml}\n${mainMatch[2]}`);
  }

  const containerMatch = renderedHtml.match(
    /(<div[^>]*class="[^"]*main-content[^"]*"[^>]*>[\s\S]*?)(\s*<\/div>)/i
  );
  if (containerMatch) {
    return renderedHtml.replace(containerMatch[0], `${containerMatch[1]}\n${sectionHtml}\n${containerMatch[2]}`);
  }

  return `${renderedHtml}\n${sectionHtml}`;
}

function buildStandardSectionHtml(
  shell: TemplateSectionShell,
  innerHtml: string,
  sectionToken: string
): string {
  const safeInner =
    sectionToken === 'SUMMARY'
      ? innerHtml
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
      : innerHtml;

  if (sectionToken === 'SUMMARY') {
    return `
    <section class="${shell.sectionClass}" data-import-section="${sectionToken}">
      <h2 class="${shell.headingClass}">${shell.headingLabel}</h2>
      <p class="summary-text">${safeInner}</p>
    </section>
  `;
  }

  return `
    <section class="${shell.sectionClass}" data-import-section="${sectionToken}">
      <h2 class="${shell.headingClass}">${shell.headingLabel}</h2>
      <div class="${shell.listClass}">
        ${innerHtml}
      </div>
    </section>
  `;
}

const IMPORT_SECTION_RENDER_SPECS: Array<{
  token: string;
  marker: RegExp;
}> = [
  { token: 'SUMMARY', marker: /\bsummary-text\b|professional-summary\b/i },
  { token: 'EXPERIENCE', marker: /\bexperience-item\b/i },
  { token: 'PROJECTS', marker: /\bproject-item\b/i },
  { token: 'EDUCATION', marker: /\beducation-item\b/i },
  { token: 'SKILLS', marker: /\bskill-tag\b|psp-skill-item\b/i },
  { token: 'CERTIFICATIONS', marker: /\bcertification-item\b/i },
  { token: 'LANGUAGES', marker: /\blanguage-item\b|psp-language-item\b/i },
  { token: 'ACHIEVEMENTS', marker: /\bachievement-item\b/i },
];

/**
 * Import mode — inject standard sections that have data but were stripped by template
 * conditionals or missing placeholders. Reuses template shell patterns when present.
 */
export function appendMissingImportSections(
  renderedHtml: string,
  htmlTemplate: string,
  placeholders: Record<string, string>,
  formData: Record<string, unknown>
): string {
  if (!shouldPreserveFullContentForRender(formData)) {
    return renderedHtml;
  }

  let result = renderedHtml;

  for (const spec of IMPORT_SECTION_RENDER_SPECS) {
    const placeholderKey = `{{${spec.token}}}`;
    const renderedContent = placeholders[placeholderKey] || '';
    if (!shouldRenderSection(spec.token, renderedContent, formData)) {
      continue;
    }
    if (spec.marker.test(result)) {
      continue;
    }

    const shell = detectTemplateSectionShell(htmlTemplate, spec.token);
    const sectionHtml = buildStandardSectionHtml(shell, renderedContent, spec.token);
    result = injectSectionHtmlIntoLayout(result, sectionHtml, shell.placement);
  }

  return result;
}

/**
 * When a template has no {{HOBBIES}} block (or the conditional stripped it), inject hobbies
 * using the same section shell pattern as achievements/projects/languages on that template.
 */
export function appendHobbiesSectionIfMissing(
  renderedHtml: string,
  htmlTemplate: string,
  hobbiesRenderedHtml: string,
  formData: Record<string, unknown>
): string {
  if (!shouldRenderSection('HOBBIES', hobbiesRenderedHtml, formData)) {
    return renderedHtml;
  }

  if (/\bhobby-item\b/i.test(renderedHtml)) {
    return renderedHtml;
  }

  const shell = detectHobbiesSectionShell(htmlTemplate);
  const sectionHtml = `
    <section class="${shell.sectionClass}" data-import-section="HOBBIES">
      <h2 class="${shell.headingClass}">${shell.headingLabel}</h2>
      <div class="${shell.listClass}">
        ${hobbiesRenderedHtml}
      </div>
    </section>
  `;

  return injectSectionHtmlIntoLayout(renderedHtml, sectionHtml, shell.placement);
}

/** Coerce hobbies/interests from builder, import, or parser into a string array. */
function normalizeHobbiesInput(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/[,;|•\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function resolveHobbiesArray(formData: Record<string, unknown>): unknown[] {
  const fromArrays = resolveCanonicalArray(formData, 'hobbies', [
    'Hobbies',
    'Hobbies & Interests',
    'interests',
    'Interests',
    'personalInterests',
  ]);

  if (fromArrays.length > 0) {
    const expanded: unknown[] = [];
    for (const item of fromArrays) {
      if (typeof item === 'string') {
        const parts = normalizeHobbiesInput(item);
        expanded.push(...(parts.length > 0 ? parts : [item]));
      } else {
        expanded.push(item);
      }
    }
    return expanded;
  }

  for (const key of [
    'hobbies',
    'interests',
    'Interests',
    'personalInterests',
    'Hobbies',
    'Hobbies & Interests',
  ]) {
    const normalized = normalizeHobbiesInput(formData[key]);
    if (normalized.length > 0) return normalized;
  }

  return [];
}

/**
 * Prefer non-empty canonical array; when canonical is missing or [], fall back to first non-empty alias.
 * After the user edits (`_userEdited`), trust the canonical array even when empty so deleted
 * rows never reappear from stale import aliases.
 */
function resolveCanonicalArray(
  data: Record<string, unknown>,
  canonicalKey: string,
  aliasKeys: string[]
): unknown[] {
  const canonical = data[canonicalKey];
  if (data._userEdited === true && Array.isArray(canonical)) {
    return canonical;
  }

  if (Array.isArray(canonical) && canonical.length > 0) {
    return canonical;
  }

  for (const key of aliasKeys) {
    const value = data[key];
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }

  if (Array.isArray(canonical)) {
    return canonical;
  }
  for (const key of aliasKeys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

/**
 * Final binding repair for imported / fragmented experience before template HTML.
 * Does not mutate parser output — runs on a coalesced copy at render time only.
 */
export function repairExperienceForTemplateBinding(
  formData: Record<string, unknown>,
  experience: Record<string, unknown>[]
): Record<string, unknown>[] {
  const rawText = String(formData.rawText ?? '').trim();
  const meaningful = filterMeaningfulExperiences(
    Array.isArray(experience)
      ? experience.filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
      : []
  );
  const plausible = countPlausibleExperienceCompanies(experience);

  if (
    formData._userEdited !== true &&
    rawText.length >= 80 &&
    (meaningful.length === 0 || (plausible <= 1 && formData._imported === true))
  ) {
    const structured = recoverStructuredExperienceFromRawText(rawText);
    if (structured.length > 0) {
      const finalized = finalizeExperienceListForCustomParserImport(structured);
      const recovered = filterMeaningfulExperiences(finalized);
      if (recovered.length > meaningful.length || (meaningful.length === 0 && recovered.length > 0)) {
        return recovered;
      }
    }
    const overlaid = overlaySparseSectionsFromTextRecovery({ ...formData, experience: meaningful });
    const fromOverlay = Array.isArray(overlaid.experience)
      ? (overlaid.experience as Record<string, unknown>[])
      : [];
    const overlayMeaningful = filterMeaningfulExperiences(fromOverlay);
    if (overlayMeaningful.length > meaningful.length) {
      return overlayMeaningful;
    }
  }

  if (!Array.isArray(experience) || experience.length === 0) return experience;

  const sparseCompanies = plausible < experience.length;
  const needsRepair =
    formData._userEdited !== true &&
    !isCustomParserImport(formData) &&
    (formData._imported === true || sparseCompanies);
  if (!needsRepair) return experience;

  let working = experience;
  if (rawText.length >= 80 && sparseCompanies && !isCustomParserImport(formData)) {
    const overlaid = overlaySparseSectionsFromTextRecovery({ ...formData, experience });
    if (Array.isArray(overlaid.experience) && overlaid.experience.length > 0) {
      working = overlaid.experience as Record<string, unknown>[];
    }
  }

  const demoted = working
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map(demoteImplausibleExperienceCompany);

  return finalizeExperienceListForCustomParserImport(demoted);
}

/** Backfill projects from raw-text recovery when parser/builder left the section empty. */
export function repairProjectsForTemplateBinding(
  formData: Record<string, unknown>,
  projects: Record<string, unknown>[]
): Record<string, unknown>[] {
  const plausible = countPlausibleProjects(projects);
  if (plausible > 0) return projects;

  const rawText = String(formData.rawText ?? '').trim();
  if (rawText.length < 80) return projects;

  const overlaid = overlaySparseSectionsFromTextRecovery({ ...formData, projects });
  const fromOverlay = Array.isArray(overlaid.projects) ? overlaid.projects : [];
  if (countPlausibleProjects(fromOverlay) > 0) {
    return fromOverlay as Record<string, unknown>[];
  }

  const recovered = extractResumeFromText(rawText);
  const recProj = (recovered.projects || []) as unknown as Record<string, unknown>[];
  return recProj.length > 0 ? recProj : projects;
}

/**
 * Normalize formData section keys before template injection (preview + PDF).
 * Coalesces parser/import aliases onto canonical keys without mutating the caller object.
 */
export function coalesceFormDataForTemplateRender(
  formData: Record<string, unknown>
): Record<string, unknown> {
  const traceInput = formData;
  const experienceRaw = resolveCanonicalArray(formData, 'experience', [
    'workExperience',
    'Work Experience',
    'Experience',
  ]);
  const skipHeaderReconcile =
    isCustomParserImport(formData) || formData._builderCoalesced === true;
  const experienceRepaired = repairExperienceForTemplateBinding(formData, experienceRaw);
  // Custom-parser imports are finalized in transformImportDataToBuilder — do not re-split here.
  const experiencePrepared = skipHeaderReconcile
    ? experienceRepaired
    : finalizeExperienceListForCustomParserImport(experienceRepaired);
  const experience = experiencePrepared
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry) =>
      syncExperienceEntryAliases(entry, { reconcileHeaders: !skipHeaderReconcile })
    );
  const education = resolveCanonicalArray(formData, 'education', ['Education']);
  const rawSkills = normalizeSkillsForRender(formData);
  const { skills, languageHints } = partitionSkillsForRender(rawSkills);
  const languagesRaw = resolveCanonicalArray(formData, 'languages', ['Languages']);
  const languages = mergeLanguageHints(languagesRaw, languageHints);
  const projectsRaw = resolveCanonicalArray(formData, 'projects', [
    'Projects',
    'Projects(optional)',
    'Academic Projects',
  ]);
  const projectsRepaired = repairProjectsForTemplateBinding(formData, projectsRaw);
  const projects = projectsRepaired
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object');
  const certifications = resolveCanonicalArray(formData, 'certifications', ['Certifications']);
  const achievements = resolveCanonicalArray(formData, 'achievements', [
    'Achievements',
    'Key Achievements',
  ]);
  const hobbies = filterHobbiesExcludingPersonal(resolveHobbiesArray(formData));

  if (process.env.NODE_ENV === 'development' && hobbies.length > 0) {
    console.log('HOBBIES STATE coalesce', { hobbies, raw: formData.hobbies, interests: formData.interests });
  }

  const coalesced = {
    ...formData,
    experience,
    education,
    skills,
    projects,
    certifications,
    achievements,
    languages,
    hobbies,
    'Work Experience': experience,
    Experience: experience,
    Education: education,
    Skills: skills,
    Projects: projects,
    Certifications: certifications,
    Achievements: achievements,
    Languages: languages,
    Hobbies: hobbies,
    'Hobbies & Interests': hobbies,
    interests: hobbies,
    Interests: hobbies,
    personalInterests: hobbies,
  };
  const integrity = applyRenderSectionIntegrity({
    experience: experience as Record<string, unknown>[],
    projects: projects as Record<string, unknown>[],
    achievements,
    volunteer: Array.isArray(formData.volunteer) ? (formData.volunteer as unknown[]) : undefined,
    extendedSections:
      formData.extendedSections && typeof formData.extendedSections === 'object'
        ? (formData.extendedSections as Record<string, unknown>)
        : undefined,
    additionalResumeData:
      formData.additionalResumeData && typeof formData.additionalResumeData === 'object'
        ? (formData.additionalResumeData as Record<string, unknown>)
        : undefined,
  });
  const integrityChecked = {
    ...coalesced,
    experience: integrity.experience,
    projects: integrity.projects,
    achievements: integrity.achievements,
    volunteer: integrity.volunteer,
    extendedSections: integrity.extendedSections,
    additionalResumeData: integrity.additionalResumeData,
    'Work Experience': integrity.experience,
    Experience: integrity.experience,
    Projects: integrity.projects,
    Achievements: integrity.achievements,
  };
  if (isImportFieldTraceEnabled()) {
    traceImportStageTransform('16_template_render_input', traceInput, integrityChecked, 'template-render');
  }
  return integrityChecked;
}

/** Shared skills render thresholds — single source of truth for filtering and caps. */
export const SKILLS_RENDER_CONFIG = {
  minConfidenceScore: 35,
  progressBarDisplayMax: 12,
  mediumSkillDisplayMax: 18,
  denseSkillDisplayMax: 22,
} as const;

export type ResumeRenderMode = 'gallery' | 'live' | 'pdf';

/** Resolve gallery / live / pdf from inject options (one entry point for render parity). */
export function resolveResumeRenderMode(options?: {
  galleryPreview?: boolean;
  mode?: 'preview' | 'pdf';
}): ResumeRenderMode {
  if (options?.galleryPreview) return 'gallery';
  if (options?.mode === 'pdf') return 'pdf';
  return 'live';
}

export interface TemplateRenderCapacity {
  maxSkills: number;
  maxBulletsPerExperience: number;
  maxProjects: number;
  maxSummaryWords: number;
}

/** Stricter render budgets for template gallery cards only. */
export interface GalleryRenderCapacity extends TemplateRenderCapacity {
  maxExperienceEntries: number;
  maxEducationEntries: number;
  maxCertifications: number;
  maxLanguages: number;
  maxAchievements: number;
  maxHobbies: number;
  maxProjectDescriptionChars: number;
}

export const GALLERY_RENDER_CAPACITY: GalleryRenderCapacity = {
  maxSummaryWords: 52,
  maxExperienceEntries: 2,
  maxBulletsPerExperience: 3,
  maxProjects: 2,
  maxProjectDescriptionChars: 110,
  maxSkills: 10,
  maxEducationEntries: 2,
  maxCertifications: 2,
  maxLanguages: 2,
  maxAchievements: 2,
  maxHobbies: 3,
};

export interface OptimizeResumeForRenderOptions {
  htmlTemplate?: string;
  templateId?: string;
  mode?: 'preview' | 'pdf';
  /** Gallery card previews use compact showcase content only. */
  galleryPreview?: boolean;
  /** When true, all section content is kept for render (no bullet/skill/summary caps). */
  preserveFullContent?: boolean;
}

/**
 * Parser-imported resumes keep full content in editor, live preview, and PDF.
 * Gallery previews always use compact showcase trimming via optimizeResumeDataForRender.
 */
export function shouldPreserveFullContentForRender(
  formData: Record<string, unknown>,
  options?: Pick<OptimizeResumeForRenderOptions, 'galleryPreview' | 'preserveFullContent'>
): boolean {
  if (options?.galleryPreview) return false;
  if (options?.preserveFullContent === true) return true;
  if (formData.customParserUsed === true) return true;
  if (formData._imported === true) return true;
  return false;
}

/** Derive per-template display budgets from HTML structure (no template file edits). */
export function resolveTemplateRenderCapacity(
  htmlTemplate: string = '',
  _options?: Pick<OptimizeResumeForRenderOptions, 'templateId'>
): TemplateRenderCapacity {
  const useProgressBars =
    htmlTemplate.includes('psp-skills-progress') ||
    htmlTemplate.includes('psp-languages-progress');
  const hasSidebar = /\bsidebar\b|tm-sidebar|<aside[\s>]/i.test(htmlTemplate);
  const denseSkillGrid =
    /skills-grid|skill-cards|capability|expertise-board/i.test(htmlTemplate);

  let maxSkills = 15;
  if (useProgressBars || hasSidebar) {
    maxSkills = 12;
  } else if (denseSkillGrid) {
    maxSkills = 18;
  }
  maxSkills = Math.min(18, Math.max(8, maxSkills));

  return {
    maxSkills,
    maxBulletsPerExperience: 5,
    maxProjects: 4,
    maxSummaryWords: 90,
  };
}

function trimSummaryForRender(summary: string, maxWords: number): string {
  const text = summary.trim();
  if (!text) return '';
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;

  const truncated = words.slice(0, maxWords).join(' ');
  const sentenceEnd = truncated.match(/^([\s\S]*[.!?])(?:\s+[^.!?]*)?$/);
  if (sentenceEnd) {
    const sentenceWords = sentenceEnd[1].trim().split(/\s+/).filter(Boolean);
    if (sentenceWords.length >= 50) {
      return sentenceEnd[1].trim();
    }
  }
  return truncated.trim();
}

function normalizeBulletLine(value: unknown): string {
  if (typeof value === 'string') {
    return value.replace(/^[\s\-–—*•·]+/, '').trim();
  }
  if (value && typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    return String(rec.title ?? rec.description ?? rec.text ?? '')
      .replace(/^[\s\-–—*•·]+/, '')
      .trim();
  }
  return '';
}

function extractExperienceBullets(exp: Record<string, unknown>): string[] {
  const hasLiveDescription = Object.prototype.hasOwnProperty.call(exp, 'description');
  const description = hasLiveDescription
    ? String(exp.description ?? '').trim()
    : readExperienceDescriptionForForm(exp).trim();

  if (description) {
    return dedupeExperienceBodyLines(
      '',
      splitBullets(description)
        .map((line) => line.replace(/^[\s\-–—*•·]+/, '').trim())
        .filter((line) => line.length >= 3)
    ).achievements;
  }

  if (hasLiveDescription) {
    return [];
  }

  const fromArrays = [
    ...(Array.isArray(exp.achievements) ? (exp.achievements as unknown[]) : []),
    ...(Array.isArray(exp.bullets) ? (exp.bullets as unknown[]) : []),
    ...(Array.isArray(exp.bulletPoints) ? (exp.bulletPoints as unknown[]) : []),
  ]
    .map(normalizeBulletLine)
    .filter((line) => line.length >= 3);

  return dedupeExperienceBodyLines('', fromArrays).achievements;
}

function selectTopBulletsForRender(bullets: string[], maxBullets: number): string[] {
  if (bullets.length === 0) return [];
  if (bullets.length <= 2) {
    return dedupeExperienceBodyLines('', bullets).achievements;
  }

  const ranked = bullets
    .map((text) => ({ text, score: scoreBulletQuality(text) }))
    .filter((entry) => entry.score >= 12)
    .sort((a, b) => b.score - a.score || a.text.length - b.text.length);

  const pool = ranked.length > 0 ? ranked : bullets.map((text) => ({ text, score: 40 }));
  const upper = Math.min(maxBullets, 5, pool.length);
  const keepCount = Math.max(Math.min(3, bullets.length), upper);

  return pool.slice(0, keepCount).map((entry) => entry.text);
}

function optimizeExperienceListForRender(
  experiences: unknown[],
  maxBullets: number
): Array<Record<string, unknown>> {
  if (!Array.isArray(experiences)) return [];

  return experiences.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw as Record<string, unknown>;
    const exp = { ...(raw as Record<string, unknown>) };
    const bullets = extractExperienceBullets(exp);
    const selected = selectTopBulletsForRender(bullets, maxBullets);

    if (selected.length === 0) {
      return exp;
    }

    const description = getStringValue(exp.description ?? exp.Description);

    return {
      ...exp,
      achievements: selected,
      bullets: selected,
      bulletPoints: selected,
      Achievements: selected,
      description: description || selected[0] || '',
      Description: description || selected[0] || '',
    };
  });
}

function scoreProjectForRender(project: Record<string, unknown>): number {
  const name = getStringValue(project.name ?? project.Name ?? project.title ?? project.Title);
  const description = getStringValue(
    project.description ?? project.Description ?? project.summary ?? project.Summary
  );
  let score = name ? 40 : 0;
  if (description) score += Math.min(30, description.length / 8);
  if (/\d+[%xX]?|\$\d|₹|\b\d+\s*(users|clients)\b/i.test(`${name} ${description}`)) score += 22;
  if (/\b(react|node|python|aws|docker|kubernetes|api|ml|ai)\b/i.test(`${name} ${description}`)) {
    score += 10;
  }
  return score;
}

function optimizeProjectsListForRender(
  projects: unknown[],
  maxProjects: number
): unknown[] {
  if (!Array.isArray(projects) || projects.length === 0) return [];
  if (projects.length <= maxProjects) return projects;

  return [...projects]
    .map((item, index) => ({
      item,
      index,
      score: item && typeof item === 'object' ? scoreProjectForRender(item as Record<string, unknown>) : 0,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxProjects)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.item);
}

function rankAndCapSkills(
  skills: string[],
  maxSkills: number,
  options?: { applyConfidenceFilter?: boolean }
): string[] {
  const applyConfidenceFilter = options?.applyConfidenceFilter !== false;
  const ranked = new Map<string, { name: string; score: number }>();

  for (const raw of skills) {
    const name = canonicalizeSkillName(String(raw || '').replace(/\s+\d{1,3}%?\s*$/i, '').trim());
    if (!name) continue;
    const score = scoreSkillConfidence(name);
    if (applyConfidenceFilter && score < SKILLS_RENDER_CONFIG.minConfidenceScore) continue;
    const key = name.toLowerCase();
    const prev = ranked.get(key);
    if (!prev || score > prev.score) {
      ranked.set(key, { name, score });
    }
  }

  return [...ranked.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((entry) => entry.name)
    .slice(0, maxSkills);
}

export interface PrepareSkillsForRenderOptions {
  renderMode: ResumeRenderMode;
  htmlTemplate?: string;
  formData?: Record<string, unknown>;
}

/**
 * Single skills pipeline — normalize/partition in coalesce; rank/cap here only.
 * Gallery trims for cards; live/pdf share identical content (caps only for manual builder resumes).
 */
export function prepareSkillsForRender(
  partitionedSkills: string[],
  options: PrepareSkillsForRenderOptions
): string[] {
  const skills = partitionedSkills.filter(
    (skill) => typeof skill === 'string' && skill.trim().length > 0
  );
  if (skills.length === 0) return [];

  if (options.renderMode === 'gallery') {
    return rankAndCapSkills(skills, GALLERY_RENDER_CAPACITY.maxSkills);
  }

  const formData = options.formData;
  if (
    formData &&
    shouldPreserveFullContentForRender(formData, { galleryPreview: false })
  ) {
    return skills;
  }

  const capacity = resolveTemplateRenderCapacity(options.htmlTemplate ?? '');
  return rankAndCapSkills(skills, capacity.maxSkills);
}

function resolveSummaryForRender(formData: Record<string, unknown>, maxWords: number): string {
  const keys = [
    'summary',
    'professionalSummary',
    'Professional Summary',
    'Career Objective',
    'Objective',
    'Executive Summary',
  ];
  for (const key of keys) {
    const value = formData[key];
    if (typeof value === 'string' && value.trim()) {
      return trimSummaryForRender(value, maxWords);
    }
  }
  return '';
}

function shortenTextForGallery(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length <= maxChars) return trimmed;

  const sentenceMatch = trimmed.match(/^[\s\S]{1,140}?[.!?](?:\s|$)/);
  if (sentenceMatch && sentenceMatch[0].trim().length <= maxChars) {
    return sentenceMatch[0].trim();
  }

  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxChars * 0.55 ? cut.slice(0, lastSpace) : cut).trim();
}

function optimizeEducationListForGallery(
  education: unknown[],
  maxEntries: number
): Array<Record<string, unknown>> {
  if (!Array.isArray(education)) return [];

  return education.slice(0, maxEntries).map((raw) => {
    if (!raw || typeof raw !== 'object') return raw as Record<string, unknown>;
    const entry = raw as Record<string, unknown>;
    const degree = getStringValue(entry.degree ?? entry.Degree);
    const school = getStringValue(
      entry.school ?? entry.School ?? entry.institution ?? entry.Institution
    );
    const year = getStringValue(
      entry.year ?? entry.Year ?? entry.graduationDate ?? entry.GraduationDate
    );

    return {
      degree,
      Degree: degree,
      school,
      School: school,
      institution: school,
      Institution: school,
      year,
      Year: year,
      graduationDate: year,
      GraduationDate: year,
    };
  });
}

function optimizeCertificationsListForGallery(
  certifications: unknown[],
  maxEntries: number
): Array<Record<string, unknown>> {
  if (!Array.isArray(certifications)) return [];

  return certifications.slice(0, maxEntries).map((raw) => {
    if (!raw || typeof raw !== 'object') return raw as Record<string, unknown>;
    const cert = raw as Record<string, unknown>;
    const name = getStringValue(cert.name ?? cert.Name ?? cert.title ?? cert.Title);
    const issuer = getStringValue(cert.issuer ?? cert.Issuer ?? cert.organization ?? cert.Organization);
    const date = getStringValue(cert.date ?? cert.Date ?? cert.year ?? cert.Year);

    return {
      name,
      Name: name,
      issuer,
      Issuer: issuer,
      date,
      Date: date,
    };
  });
}

function optimizeLanguagesListForGallery(
  languages: unknown[],
  maxEntries: number
): unknown[] {
  if (!Array.isArray(languages)) return [];
  return languages.slice(0, maxEntries);
}

function optimizeAchievementsListForGallery(achievements: unknown[], maxEntries: number): unknown[] {
  if (!Array.isArray(achievements)) return [];
  return achievements
    .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
    .filter((item) => item.length > 0)
    .slice(0, maxEntries);
}

function optimizeHobbiesListForGallery(hobbies: unknown[], maxEntries: number): unknown[] {
  if (!Array.isArray(hobbies)) return [];
  return hobbies
    .map((item) => (typeof item === 'string' ? item.trim() : String(item ?? '').trim()))
    .filter((item) => item.length > 0)
    .slice(0, maxEntries);
}

function optimizeProjectsListForGallery(
  projects: unknown[],
  capacity: GalleryRenderCapacity
): unknown[] {
  if (!Array.isArray(projects) || projects.length === 0) return [];

  const selected = optimizeProjectsListForRender(projects, capacity.maxProjects);

  return selected.map((raw) => {
    if (!raw || typeof raw !== 'object') return raw;
    const project = { ...(raw as Record<string, unknown>) };
    const description = getStringValue(
      project.description ?? project.Description ?? project.summary ?? project.Summary
    );
    if (description) {
      const shortened = shortenTextForGallery(description, capacity.maxProjectDescriptionChars);
      project.description = shortened;
      project.Description = shortened;
      project.summary = shortened;
      project.Summary = shortened;
    }
    return project;
  });
}

function optimizeGalleryResumeDataForRender(
  formData: Record<string, unknown>,
  capacity: GalleryRenderCapacity = GALLERY_RENDER_CAPACITY
): Record<string, unknown> {
  const experienceSource = Array.isArray(formData.experience) ? formData.experience : [];
  const experience = optimizeExperienceListForRender(
    experienceSource.slice(0, capacity.maxExperienceEntries),
    capacity.maxBulletsPerExperience
  );
  const projects = optimizeProjectsListForGallery(
    Array.isArray(formData.projects) ? formData.projects : [],
    capacity
  );
  const skills = prepareSkillsForRender(
    Array.isArray(formData.skills) ? (formData.skills as string[]) : normalizeSkillsForRender(formData),
    { renderMode: 'gallery', htmlTemplate: '', formData }
  );
  const education = optimizeEducationListForGallery(
    Array.isArray(formData.education) ? formData.education : [],
    capacity.maxEducationEntries
  );
  const certifications = optimizeCertificationsListForGallery(
    Array.isArray(formData.certifications) ? formData.certifications : [],
    capacity.maxCertifications
  );
  const languages = optimizeLanguagesListForGallery(
    Array.isArray(formData.languages) ? formData.languages : [],
    capacity.maxLanguages
  );
  const achievements = optimizeAchievementsListForGallery(
    Array.isArray(formData.achievements) ? formData.achievements : [],
    capacity.maxAchievements
  );
  const hobbies = optimizeHobbiesListForGallery(
    Array.isArray(formData.hobbies) ? formData.hobbies : [],
    capacity.maxHobbies
  );
  const summary = resolveSummaryForRender(formData, capacity.maxSummaryWords);

  const optimized: Record<string, unknown> = {
    ...formData,
    experience,
    projects,
    skills,
    education,
    certifications,
    languages,
    achievements,
    hobbies,
    Experience: experience,
    'Work Experience': experience,
    Projects: projects,
    Skills: skills,
    Education: education,
    Certifications: certifications,
    Languages: languages,
    Achievements: achievements,
    Hobbies: hobbies,
  };

  if (summary) {
    optimized.summary = summary;
    optimized.professionalSummary = summary;
    optimized['Professional Summary'] = summary;
  }

  return optimized;
}

/**
 * Layout-aware content optimization for preview/PDF only.
 * Editor formData is never mutated — call on a coalesced copy from injectResumeData.
 */
export function optimizeResumeDataForRender(
  formData: Record<string, unknown>,
  options?: OptimizeResumeForRenderOptions
): Record<string, unknown> {
  const renderMode = resolveResumeRenderMode(options);

  if (renderMode === 'gallery') {
    return optimizeGalleryResumeDataForRender(formData);
  }

  if (shouldPreserveFullContentForRender(formData, options)) {
    return formData;
  }

  const capacity = resolveTemplateRenderCapacity(options?.htmlTemplate ?? '', options);
  const experience = optimizeExperienceListForRender(
    Array.isArray(formData.experience) ? formData.experience : [],
    capacity.maxBulletsPerExperience
  );
  const projects = optimizeProjectsListForRender(
    Array.isArray(formData.projects) ? formData.projects : [],
    capacity.maxProjects
  );
  const skills = prepareSkillsForRender(
    Array.isArray(formData.skills) ? (formData.skills as string[]) : normalizeSkillsForRender(formData),
    { renderMode, htmlTemplate: options?.htmlTemplate ?? '', formData }
  );
  const summary = resolveSummaryForRender(formData, capacity.maxSummaryWords);

  const optimized: Record<string, unknown> = {
    ...formData,
    experience,
    projects,
    skills,
    Experience: experience,
    'Work Experience': experience,
    Projects: projects,
    Skills: skills,
  };

  if (summary) {
    optimized.summary = summary;
    optimized.professionalSummary = summary;
    optimized['Professional Summary'] = summary;
  }

  return optimized;
}

type HandlebarsBlockType = 'if' | 'unless';

function findMatchingHandlebarsClose(
  html: string,
  openIndex: number,
  blockType: HandlebarsBlockType
): number {
  const openRe = blockType === 'if' ? /\{\{#if\s+\w+\}\}/g : /\{\{#unless\s+\w+\}\}/g;
  const closeStr = blockType === 'if' ? '{{/if}}' : '{{/unless}}';
  const firstOpen = html.slice(openIndex).match(openRe);
  if (!firstOpen) return -1;

  let pos = openIndex + firstOpen[0].length;
  let depth = 1;

  while (pos < html.length && depth > 0) {
    const rest = html.slice(pos);
    const nestedOpen = rest.match(openRe);
    const openIdx = nestedOpen ? rest.indexOf(nestedOpen[0]) : -1;
    const closeIdx = rest.indexOf(closeStr);
    if (closeIdx === -1) return -1;

    if (openIdx !== -1 && openIdx < closeIdx) {
      depth += 1;
      pos += openIdx + nestedOpen![0].length;
    } else {
      depth -= 1;
      if (depth === 0) return pos + closeIdx;
      pos += closeIdx + closeStr.length;
    }
  }

  return -1;
}

function findInnermostHandlebarsBlock(html: string): {
  start: number;
  end: number;
  type: HandlebarsBlockType;
  name: string;
  inner: string;
} | null {
  const openRe = /\{\{#(if|unless)\s+(\w+)\}\}/gi;
  let match: RegExpExecArray | null;

  while ((match = openRe.exec(html)) !== null) {
    const type = match[1].toLowerCase() as HandlebarsBlockType;
    const name = match[2];
    const openStart = match.index;
    const innerStart = openStart + match[0].length;
    const closeStart = findMatchingHandlebarsClose(html, openStart, type);
    if (closeStart === -1) continue;

    const closeTag = type === 'if' ? '{{/if}}' : '{{/unless}}';
    const inner = html.slice(innerStart, closeStart);
    if (!/\{\{#(if|unless)\s+\w+\}\}/i.test(inner)) {
      return {
        start: openStart,
        end: closeStart + closeTag.length,
        type,
        name,
        inner,
      };
    }
  }

  return null;
}

function evaluateHandlebarsBlock(
  type: HandlebarsBlockType,
  name: string,
  inner: string,
  placeholders: Record<string, string>,
  formData: Record<string, unknown>
): string {
  const sectionPlaceholder = `{{${name.toUpperCase()}}}`;
  const renderedContent = placeholders[sectionPlaceholder];
  const hasContent = shouldRenderSection(name, renderedContent, formData);
  if (type === 'if') return hasContent ? inner : '';
  return hasContent ? '' : inner;
}

/**
 * Process Handlebars-style {{#if}} / {{#unless}} blocks using shared visibility rules.
 * Handles nested conditionals (e.g. {{#if CONTACT}} wrapping {{#if PHONE}}).
 */
export function processHandlebarsConditionals(
  htmlTemplate: string,
  placeholders: Record<string, string>,
  formData: Record<string, unknown>
): string {
  let result = htmlTemplate;
  let guard = 0;

  while (guard++ < 1000) {
    const block = findInnermostHandlebarsBlock(result);
    if (!block) break;
    const replacement = evaluateHandlebarsBlock(
      block.type,
      block.name,
      block.inner,
      placeholders,
      formData
    );
    result = result.slice(0, block.start) + replacement + result.slice(block.end);
  }

  return result;
}

/**
 * Final safety pass — remove any orphaned Handlebars syntax after placeholder substitution.
 */
export function stripRemainingHandlebarsSyntax(html: string): string {
  let result = html;

  for (let pass = 0; pass < 32; pass++) {
    const before = result;
    const block = findInnermostHandlebarsBlock(result);
    if (block) {
      result = result.slice(0, block.start) + result.slice(block.end);
      continue;
    }
    if (before === result) break;
  }

  result = result.replace(/\{\{#if\s+\w+\}\}/gi, '');
  result = result.replace(/\{\{\/if\}\}/gi, '');
  result = result.replace(/\{\{#unless\s+\w+\}\}/gi, '');
  result = result.replace(/\{\{\/unless\}\}/gi, '');
  result = result.replace(/\{\{else\}\}/gi, '');
  result = result.replace(/\{\{[A-Za-z_][A-Za-z0-9_]*\}\}/g, '');

  return result;
}

export const EDITOR_SECTION_TOGGLES: Array<{
  key: ResumeSectionKey;
  label: string;
  hint: string;
}> = [
  { key: 'contact', label: 'Contact', hint: 'Phone, email, location, and links' },
  { key: 'profileImage', label: 'Profile photo', hint: 'Hide when no photo is uploaded' },
  { key: 'summary', label: 'Summary', hint: 'About me / professional summary' },
  { key: 'experience', label: 'Experience', hint: 'Work history and internships' },
  { key: 'education', label: 'Education', hint: 'Degrees and schools' },
  { key: 'skills', label: 'Skills', hint: 'Technical and professional skills' },
  { key: 'projects', label: 'Projects', hint: 'Personal or academic projects' },
  { key: 'certifications', label: 'Certifications', hint: 'Licenses and certificates' },
  { key: 'achievements', label: 'Achievements', hint: 'Awards and milestones' },
  { key: 'languages', label: 'Languages', hint: 'Language proficiency' },
  { key: 'hobbies', label: 'Interests', hint: 'Hobbies and interests' },
];
