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

export function isValidProfileImage(url: unknown): boolean {
  const value = getStringValue(url);
  if (!value) return false;
  // Legacy sample avatars should not count as user-uploaded photos
  if (value.includes('ui-avatars.com')) return false;
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

export function resolveProfileImageForRender(
  formData: Record<string, unknown>,
  getString: (keys: string[]) => string
): string {
  if (isSectionForcedHidden('profileImage', formData)) {
    return '';
  }
  const profileImage = getString(['Profile Image', 'Photo', 'profileImage', 'photo', 'profilePhoto']);
  return isValidProfileImage(profileImage) ? profileImage : '';
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

export function filterMeaningfulSkills<T>(skills: T[]): T[] {
  if (!Array.isArray(skills)) return [];
  return skills.filter((skill) => {
    if (typeof skill === 'string') {
      const name = skill.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
      return name.length > 0 && !/^\d{1,3}%?$/.test(name);
    }
    if (skill && typeof skill === 'object') {
      const record = skill as Record<string, unknown>;
      const name = record.name ?? record.Name ?? record.skill ?? record.Skill;
      return hasMeaningfulText(name);
    }
    return false;
  });
}

export function filterMeaningfulStringList(items: unknown[]): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
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
