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

/** Normalize display names (e.g. KMARIYAM → Kmariyam). */
export function formatDisplayName(value: unknown): string {
  const raw = sanitizeFieldText(value, 120);
  if (!raw) return '';
  if (raw.length > 1 && raw === raw.toUpperCase() && /[A-Z]/.test(raw)) {
    return raw.charAt(0) + raw.slice(1).toLowerCase();
  }
  return raw
    .split(/\s+/)
    .map((part) => {
      if (!part) return '';
      if (part.length > 1 && part === part.toUpperCase()) {
        return part.charAt(0) + part.slice(1).toLowerCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

const HONORIFICS = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'madam']);

/**
 * Split full name → firstName + lastName (handles middle names, single names).
 */
/**
 * True when `name` is almost certainly the email local-part (e.g. kmariyam@gmail.com → "Kmariyam").
 */
export function isEmailDerivedName(name: string, email: string): boolean {
  const n = String(name || '').trim().toLowerCase();
  const e = String(email || '').trim().toLowerCase();
  if (!n || !e.includes('@')) return false;

  const wordCount = n.split(/\s+/).filter(Boolean).length;
  // Multi-word names (e.g. "Maryam Khan") are never email slugs.
  if (wordCount >= 2) return false;

  const local = e.split('@')[0].replace(/\d/g, '');
  if (!local) return false;

  const localNorm = local.replace(/[._-]/g, '');
  const nameNorm = n.replace(/[\s._-]/g, '');
  if (!nameNorm) return false;

  if (nameNorm === localNorm) return true;

  // Single-token blob local part with no separators (e.g. kmariyam@… → "Kmariyam").
  if (!/[._-]/.test(local) && wordCount === 1 && localNorm.startsWith(nameNorm) && nameNorm.length >= 4) {
    return true;
  }

  return false;
}

/**
 * Parse email local-part into first/last only when separators imply real name parts.
 * Returns null for opaque blobs like "kmariyam" (low confidence).
 */
export function parseIntelligentNameFromEmail(
  email: string
): { firstName: string; lastName: string } | null {
  const local = String(email.split('@')[0] || '')
    .replace(/\d/g, '')
    .trim();
  if (!local || local.length < 3) return null;

  if (/[._-]/.test(local)) {
    const parts = local
      .split(/[._-]+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 2);
    if (parts.length >= 2) {
      return {
        firstName: formatDisplayName(parts[0]),
        lastName: parts
          .slice(1)
          .map((p) => formatDisplayName(p))
          .filter(Boolean)
          .join(' '),
      };
    }
  }

  return null;
}

function nameWordCount(name: string): number {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Choose the more complete personal name when parser and text recovery disagree.
 * Prefers non-email-derived names and names with more tokens (e.g. "Maryam Khan" over "Maryam").
 */
export function pickRicherFullName(primary: string, secondary: string, email = ''): string {
  const a = sanitizeFieldText(primary, 120);
  const b = sanitizeFieldText(secondary, 120);

  if (!a && !b) return '';
  if (!a) return isEmailDerivedName(b, email) ? '' : b;
  if (!b) return isEmailDerivedName(a, email) ? '' : a;

  const aDerived = isEmailDerivedName(a, email);
  const bDerived = isEmailDerivedName(b, email);
  if (aDerived && !bDerived) return b;
  if (!aDerived && bDerived) return a;

  const aWords = nameWordCount(a);
  const bWords = nameWordCount(b);
  if (bWords > aWords) return b;
  if (aWords > bWords) return a;

  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (bl.startsWith(al) && b.length > a.length) return b;
  if (al.startsWith(bl) && a.length > b.length) return a;

  return a;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const raw = sanitizeFieldText(fullName, 120);
  if (!raw) return { firstName: '', lastName: '' };

  let parts = raw.split(/\s+/).filter(Boolean);

  // CamelCase un-glue: PDF text-layer extraction sometimes drops the space
  // between first and last name (e.g. "AnamSayyed" or "JaneDoeSmith"). When we
  // receive a single token that has internal capitals, split on the boundaries.
  // Only applied to single-token input to avoid breaking real surnames like
  // "McDonald" or "DeLaCruz".
  if (parts.length === 1) {
    const camelSplit = parts[0].match(/[A-Z][a-z'-]+/g);
    if (camelSplit && camelSplit.length >= 2 && camelSplit.join('') === parts[0]) {
      parts = camelSplit;
    }
  }

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

const SKILL_NOISE_TOKENS = new Set([
  'skill', 'skills', 'level', 'rating', 'proficiency', 'expert', 'advanced',
  'intermediate', 'beginner', 'novice', 'basic', 'fluent', 'native', 'competent',
]);

export function sanitizeSkillEntry(skill: unknown): string {
  if (skill == null) return '';

  // Object form — pull name, drop level/rating/score (those produce the "percentage garbage")
  if (typeof skill !== 'string') {
    if (typeof skill === 'object') {
      const rec = skill as Record<string, unknown>;
      const name = rec.name ?? rec.Name ?? rec.skill ?? rec.label ?? rec.title;
      if (name != null) return sanitizeSkillEntry(String(name));
    }
    return '';
  }

  // Strip trailing percentage / rating / score regardless of whitespace
  let s = skill
    .replace(/[\u2022\u00b7\u25aa\u2023]/g, ' ')           // bullets → space
    .replace(/\s+\d{1,3}\s*%/g, '')                          // " 80 %" / " 80%"
    .replace(/[:\-–—]\s*\d{1,3}\s*%?\s*$/i, '')              // ": 80%" / "- 80"
    .replace(/\(\s*(?:[a-z]+\s*)?\d{1,3}\s*%?\s*\)/gi, '')   // "(80%)" / "(advanced 90)"
    .replace(/\s{2,}/g, ' ')
    .trim();

  s = sanitizeFieldText(s, 80);
  if (!s) return '';

  // Reject pure-numeric, percentage-only, or noise tokens
  if (/^\d+\.?\d*\s*%?$/.test(s)) return '';
  if (SKILL_NOISE_TOKENS.has(s.toLowerCase())) return '';

  // Reject CSV/sentence blobs (multiple commas or newlines)
  if (s.includes('\n')) return '';
  if ((s.match(/,/g) || []).length > 2) return '';
  if (s.length > 60 && /\s\w+\s\w+\s\w+/.test(s)) return ''; // a sentence

  return s;
}

/**
 * Achievement: returns a clean string (form step expects string[]).
 * Accepts strings or objects { title, description, name, achievement }.
 */
export function sanitizeAchievementEntry(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') {
    return sanitizeFieldText(value.replace(/^[\s\u2022\u25aa\u2023*\-]+/, ''), 280);
  }
  if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    const candidate =
      rec.title ?? rec.Title ?? rec.name ?? rec.achievement ?? rec.description ?? rec.text;
    if (candidate != null) {
      return sanitizeAchievementEntry(String(candidate));
    }
  }
  return '';
}

/**
 * Language → { name, language, proficiency } so LanguagesStep (reads `language`)
 * and templates (read `name`) both work.
 */
export function sanitizeLanguageEntry(
  value: unknown
): { name: string; language: string; proficiency: string } | null {
  if (value == null) return null;

  let name = '';
  let proficiency = '';

  const splitLangText = (raw: string): { name: string; proficiency: string } => {
    const s = raw.trim();
    if (!s) return { name: '', proficiency: '' };
    // "English (Fluent)" — parenthetical proficiency
    const paren = s.match(/^([^()]+?)\s*\(([^)]+)\)\s*\.?$/);
    if (paren) {
      return { name: paren[1].trim(), proficiency: paren[2].trim() };
    }
    // "English - Fluent" / "English: Fluent" / "English | Fluent"
    const sep = s.match(/^(.+?)\s*[:\-–—|]\s*(.+?)\s*\.?$/);
    if (sep) {
      return { name: sep[1].trim(), proficiency: sep[2].trim() };
    }
    return { name: s, proficiency: '' };
  };

  if (typeof value === 'string') {
    const parsed = splitLangText(value);
    name = sanitizeFieldText(parsed.name, 60);
    proficiency = sanitizeFieldText(parsed.proficiency, 40);
  } else if (typeof value === 'object') {
    const rec = value as Record<string, unknown>;
    name = sanitizeFieldText(
      (rec.name ?? rec.language ?? rec.Language ?? rec.title ?? '') as string,
      60
    );
    proficiency = sanitizeFieldText(
      (rec.proficiency ?? rec.level ?? rec.fluency ?? rec.Proficiency ?? '') as string,
      40
    );
    // If the name still contains parenthetical/separator proficiency, split it
    if (name && !proficiency) {
      const parsed = splitLangText(name);
      name = parsed.name;
      proficiency = parsed.proficiency;
    }
  }

  if (!name) return null;
  return {
    name,
    language: name,
    proficiency: proficiency || 'Fluent',
  };
}

/** Resolve a display name from any common project field alias; infer when content exists. */
export function resolveProjectName(
  rec: Record<string, unknown>,
  index: number
): string {
  const name = sanitizeFieldText(
    String(
      rec.name ??
        rec.title ??
        rec.projectName ??
        rec.project_title ??
        rec.ProjectName ??
        rec.ProjectTitle ??
        rec.Title ??
        ''
    ),
    120
  );
  if (name) return name;

  const description = sanitizeFieldText(
    String(rec.description ?? rec.summary ?? rec.Description ?? ''),
    1500
  );
  const techRaw = rec.technologies ?? rec.tech_stack ?? rec.techStack ?? rec.tech ?? rec.Technologies;
  const hasTech = Array.isArray(techRaw)
    ? techRaw.length > 0
    : sanitizeFieldText(String(techRaw ?? ''), 300).length > 0;

  if (description || hasTech) {
    return index === 0 ? 'Software Project' : `Project ${index + 1}`;
  }

  return '';
}

/**
 * Project — normalizes technologies to a comma-separated string (matches form input).
 * Emits both `url` and `link` for back-compat with ProjectsStep (writes `link`).
 */
export function sanitizeProjectEntry(
  value: unknown,
  index = 0
): Record<string, unknown> | null {
  if (value == null) return null;

  if (typeof value === 'string') {
    const name = sanitizeFieldText(value, 120);
    if (!name) return null;
    return { name, title: name, description: '', technologies: '', url: '', link: '' };
  }
  if (typeof value !== 'object') return null;

  const rec = value as Record<string, unknown>;
  const name = resolveProjectName(rec, index);
  if (!name) {
    console.log('REMOVED PROJECT', value, 'reason', 'no name/title and no description or technologies');
    return null;
  }

  const description = sanitizeFieldText(
    (rec.description ?? rec.summary ?? rec.Description ?? '') as string,
    1500
  );

  const techRaw = rec.technologies ?? rec.tech_stack ?? rec.techStack ?? rec.tech ?? rec.Technologies;
  let technologies = '';
  if (Array.isArray(techRaw)) {
    technologies = techRaw
      .map((t) => sanitizeFieldText(String(t ?? ''), 60))
      .filter(Boolean)
      .join(', ');
  } else if (typeof techRaw === 'string') {
    technologies = sanitizeFieldText(techRaw, 300);
  }

  const url = sanitizeFieldText(
    (rec.url ?? rec.link ?? rec.projectUrl ?? rec.Link ?? '') as string,
    300
  );

  return {
    name,
    title: name,
    description,
    Description: description,
    technologies,
    Technologies: technologies,
    url,
    link: url,
    startDate: (rec.startDate ?? rec.start_date ?? '') as string,
    endDate: (rec.endDate ?? rec.end_date ?? '') as string,
  };
}

/**
 * Certification — emits both `url` and `link`.
 */
export function sanitizeCertificationEntry(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;

  if (typeof value === 'string') {
    const name = sanitizeFieldText(value, 200);
    if (!name) return null;
    return { name, Name: name, issuer: '', date: '', url: '', link: '' };
  }
  if (typeof value !== 'object') return null;

  const rec = value as Record<string, unknown>;
  const name = sanitizeFieldText(
    (rec.name ?? rec.title ?? rec.certification ?? rec.Name ?? '') as string,
    200
  );
  if (!name) return null;

  const issuer = sanitizeFieldText(
    (rec.issuer ?? rec.organization ?? rec.issuingOrganization ?? rec.Issuer ?? '') as string,
    160
  );
  const date = sanitizeFieldText(
    (rec.date ?? rec.issued_date ?? rec.issuedDate ?? rec.year ?? rec.Date ?? '') as string,
    40
  );
  const url = sanitizeFieldText(
    (rec.url ?? rec.link ?? rec.credentialUrl ?? rec.Link ?? '') as string,
    300
  );

  return {
    name,
    Name: name,
    issuer,
    Issuer: issuer,
    date,
    Date: date,
    url,
    link: url,
    expiryDate: sanitizeFieldText((rec.expiryDate ?? rec.expiry_date ?? '') as string, 40),
  };
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
