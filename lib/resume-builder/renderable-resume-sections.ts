/**
 * Rendering whitelist — filters internal Builder metadata from preview/export HTML.
 * Parser and Builder state are unchanged; only the rendering layer uses this.
 */

const RESUME_SECTION_WHITELIST = new Set([
  'contact',
  'summary',
  'objective',
  'profile',
  'experience',
  'education',
  'projects',
  'skills',
  'certifications',
  'languages',
  'achievements',
  'awards',
  'volunteer',
  'publications',
  'patents',
  'memberships',
  'interests',
  'hobbies',
  'references',
  'declaration',
  'training',
  'workshops',
  'professional highlights',
  'professional qualifications',
  'core competencies',
  'technical skills',
  'soft skills',
  'strengths',
  'industry expertise',
  'seminars conferences',
  'seminars & conferences',
  'volunteer experience',
  'training workshops',
  'training & workshops',
  'internships',
  'research',
  'awards honors',
  'awards & honors',
  'personal details',
  'key achievements',
  'work experience',
  'about me',
  'career objective',
  'executive summary',
  'professional summary',
]);

const INTERNAL_KEY_PATTERN =
  /(?:^|[_-])(?:id|uuid|source|metadata|builder|canonical|node|mapping|cache|session|debug|index|path|temp|internal|confidence|quality|score)(?:$|[_-])/i;

const INTERNAL_ID_VALUE_PATTERN =
  /^(?:exp[_-]|edu[_-]|cert[_-]|proj[_-]|node[_-])[a-z0-9_-]+$/i;

function normalizeSectionKey(section: string): string {
  return section
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\[.*?\]/g, '')
    .trim();
}

function isWhitelistedResumeSection(section: string): boolean {
  const normalized = normalizeSectionKey(section);
  if (!normalized) return false;
  if (RESUME_SECTION_WHITELIST.has(normalized)) return true;
  for (const allowed of RESUME_SECTION_WHITELIST) {
    if (normalized === allowed || normalized.includes(allowed) || allowed.includes(normalized)) {
      return true;
    }
  }
  return false;
}

/** Returns true only for headings that may appear as resume sections in preview/export. */
export function isRenderableResumeSection(section: string): boolean {
  if (!section || typeof section !== 'string') return false;
  const trimmed = section.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('_')) return false;
  if (trimmed.includes('[') || trimmed.includes(']')) return false;
  if (trimmed.includes('.')) return false;
  if (trimmed.includes('__')) return false;

  if (INTERNAL_KEY_PATTERN.test(trimmed)) return false;
  if (/^exp[_-]/i.test(trimmed)) return false;
  if (/^(?:preferred|desired)(?:job|role)/i.test(trimmed)) return false;

  return isWhitelistedResumeSection(trimmed);
}

/** Filter personal-details / key-value fields before HTML render. */
export function isRenderableResumeFieldKey(key: string, value: unknown): boolean {
  if (!isRenderableResumeSection(key)) return false;
  if (typeof value === 'string' && INTERNAL_ID_VALUE_PATTERN.test(value.trim())) return false;
  return true;
}
