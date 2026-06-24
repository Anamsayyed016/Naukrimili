/**
 * Centralized section visibility and meaningful-content checks.
 * Shared by preview (template-loader) and PDF export (template-loader-server).
 */

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
    'Position',
    'position',
    'title',
    'Title',
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
  const keys = ['skills', 'Skills', 'technicalSkills'];
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
  return projects.filter((project) => {
    const name = project.Name ?? project.name ?? project.title ?? project.Title;
    return hasMeaningfulText(name);
  });
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

type HobbiesSectionShell = {
  sectionClass: string;
  headingClass: string;
  listClass: string;
  headingLabel: string;
  placement: 'main' | 'sidebar';
};

function detectHobbiesSectionShell(htmlTemplate: string): HobbiesSectionShell {
  for (const token of ['HOBBIES', 'ACHIEVEMENTS', 'PROJECTS', 'LANGUAGES', 'CERTIFICATIONS']) {
    const re = new RegExp(`\\{\\{#if ${token}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'i');
    const match = htmlTemplate.match(re);
    if (!match) continue;

    const block = match[1];
    const sectionClass =
      block.match(/<section[^>]*class="([^"]*)"/i)?.[1] ||
      block.match(/class="([^"]*section[^"]*)"/i)?.[1] ||
      'content-section';
    const headingClass =
      block.match(/<h2[^>]*class="([^"]*)"/i)?.[1] ||
      block.match(/<h3[^>]*class="([^"]*)"/i)?.[1] ||
      'section-title';
    const listClass =
      block.match(/<div[^>]*class="([^"]*-list[^"]*)"/i)?.[1] || 'hobbies-list';
    const inSidebar =
      /sidebar-section|tm-sidebar-panel|<aside/i.test(block) ||
      (htmlTemplate.includes('sidebar') &&
        htmlTemplate.indexOf(match[0]) < htmlTemplate.indexOf('main-content'));

    return {
      sectionClass,
      headingClass,
      listClass: token === 'HOBBIES' ? listClass : listClass.replace(/achievements|projects|languages|certifications/gi, 'hobbies') || 'hobbies-list',
      headingLabel: token === 'HOBBIES' ? 'Interests' : 'Interests',
      placement: inSidebar ? 'sidebar' : 'main',
    };
  }

  return {
    sectionClass: 'content-section',
    headingClass: 'section-title',
    listClass: 'hobbies-list',
    headingLabel: 'Interests',
    placement: 'main',
  };
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
    <section class="${shell.sectionClass}">
      <h2 class="${shell.headingClass}">${shell.headingLabel}</h2>
      <div class="${shell.listClass}">
        ${hobbiesRenderedHtml}
      </div>
    </section>
  `;

  if (shell.placement === 'sidebar') {
    const sidebarMatch = renderedHtml.match(
      /(<aside[^>]*>[\s\S]*?)(\s*<\/aside>)/i
    );
    if (sidebarMatch) {
      return renderedHtml.replace(sidebarMatch[0], `${sidebarMatch[1]}\n${sectionHtml}\n${sidebarMatch[2]}`);
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

/** Prefer non-empty canonical array; when canonical is missing or [], fall back to first non-empty alias. */
function resolveCanonicalArray(
  data: Record<string, unknown>,
  canonicalKey: string,
  aliasKeys: string[]
): unknown[] {
  const canonical = data[canonicalKey];
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
 * Normalize formData section keys before template injection (preview + PDF).
 * Coalesces parser/import aliases onto canonical keys without mutating the caller object.
 */
export function coalesceFormDataForTemplateRender(
  formData: Record<string, unknown>
): Record<string, unknown> {
  const experience = resolveCanonicalArray(formData, 'experience', [
    'workExperience',
    'Work Experience',
    'Experience',
  ]);
  const education = resolveCanonicalArray(formData, 'education', ['Education']);
  const rawSkills = normalizeSkillsForRender(formData);
  const { skills, languageHints } = partitionSkillsForRender(rawSkills);
  const languagesRaw = resolveCanonicalArray(formData, 'languages', ['Languages']);
  const languages = mergeLanguageHints(languagesRaw, languageHints);
  const projects = resolveCanonicalArray(formData, 'projects', [
    'Projects',
    'Projects(optional)',
    'Academic Projects',
  ]);
  const certifications = resolveCanonicalArray(formData, 'certifications', ['Certifications']);
  const achievements = resolveCanonicalArray(formData, 'achievements', [
    'Achievements',
    'Key Achievements',
  ]);
  const hobbies = filterHobbiesExcludingPersonal(resolveHobbiesArray(formData));

  if (process.env.NODE_ENV === 'development' && hobbies.length > 0) {
    console.log('HOBBIES STATE coalesce', { hobbies, raw: formData.hobbies, interests: formData.interests });
  }

  return {
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
}

/**
 * Process Handlebars-style {{#if}} / {{#unless}} blocks using shared visibility rules.
 */
export function processHandlebarsConditionals(
  htmlTemplate: string,
  placeholders: Record<string, string>,
  formData: Record<string, unknown>
): string {
  let result = htmlTemplate;

  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/gi, (_match, sectionName, content) => {
    const sectionPlaceholder = `{{${sectionName.toUpperCase()}}}`;
    const renderedContent = placeholders[sectionPlaceholder];
    return shouldRenderSection(sectionName, renderedContent, formData) ? content : '';
  });

  result = result.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/gi,
    (_match, sectionName, content) => {
      const sectionPlaceholder = `{{${sectionName.toUpperCase()}}}`;
      const renderedContent = placeholders[sectionPlaceholder];
      const hasContent = shouldRenderSection(sectionName, renderedContent, formData);
      return hasContent ? '' : content;
    }
  );

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
