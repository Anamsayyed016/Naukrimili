/**
 * Resume Import Data Transformer
 *
 * Maps the AI/Affinda extraction payload onto the Resume Builder's form schema.
 * Each form step has its own field names — this is the single place where we
 * adapt them, so we can keep the parsers untouched.
 *
 * Field-shape contract per step (authoritative):
 *   ContactsStep        firstName, lastName, email, phone, location, linkedin, portfolio
 *   SummaryStep         summary
 *   ExperienceStep      experience[]  { title, company, location, startDate, endDate, description, current }
 *                       — startDate/endDate MUST be YYYY-MM (or "" / "Present") for <input type="month">
 *   EducationStep       education[]   { degree, school, field, year, cgpa }
 *                       — year MUST be a bare 4-digit string for <input type="number">
 *   SkillsStep          skills: string[]   (clean names, no percentages, no objects)
 *   ProjectsStep        projects[]    { name, description, technologies (string), link }
 *   CertificationsStep  certifications[] { name, issuer, date, link }
 *   LanguagesStep       languages[]   { language, proficiency }
 *   AchievementsStep    achievements: string[]
 *   HobbiesStep         hobbies: string[]
 *
 * We also write capitalized aliases (Position, Company, Description, Institution, Year, etc.)
 * so the existing template-loader keeps rendering preview without changes.
 */

import {
  cleanString,
  cleanMultiline,
  dedupeStrings,
  normalizeDate,
  splitBullets,
} from '@/lib/resume-parser/normalize-extracted';
import {
  splitFullName,
  sanitizeFieldText,
  sanitizeSkillEntry,
  sanitizeExperienceEntry,
  sanitizeEducationEntry,
  sanitizeAchievementEntry,
  sanitizeLanguageEntry,
  sanitizeProjectEntry,
  sanitizeCertificationEntry,
  isGarbageResumeText,
  formatDisplayName,
} from '@/lib/resume-parser/import-sanitize';
import { inferProfessionFromResume } from '@/lib/resume-builder/infer-profession';
import {
  recoverFromRawText,
  mergeRecovery,
  extractResumeFromText,
} from '@/lib/resume-parser/text-recovery';

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

function firstNonEmptyArray(data: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }
  return [];
}

/** Fill sparse parser arrays from raw resume text when sections were missed upstream. */
function supplementImportFromRawText(importedData: Record<string, unknown>): Record<string, unknown> {
  const rawText = importedData.rawText;
  if (typeof rawText !== 'string' || rawText.length < 80) {
    return importedData;
  }

  const needsSections =
    firstNonEmptyArray(importedData, ['experience', 'workExperience', 'Work Experience', 'Experience'])
      .length === 0 ||
    firstNonEmptyArray(importedData, ['education', 'Education']).length === 0 ||
    firstNonEmptyArray(importedData, ['skills', 'Skills']).length === 0;

  if (!needsSections) {
    return importedData;
  }

  const fromText = extractResumeFromText(rawText);
  return {
    ...importedData,
    summary: importedData.summary || fromText.summary || '',
    skills: firstNonEmptyArray(importedData, ['skills', 'Skills']).length
      ? importedData.skills
      : fromText.skills,
    experience: firstNonEmptyArray(importedData, [
      'experience',
      'workExperience',
      'Work Experience',
      'Experience',
    ]).length
      ? firstNonEmptyArray(importedData, [
          'experience',
          'workExperience',
          'Work Experience',
          'Experience',
        ])
      : fromText.experience,
    education: firstNonEmptyArray(importedData, ['education', 'Education']).length
      ? importedData.education
      : fromText.education,
    projects: firstNonEmptyArray(importedData, ['projects', 'Projects']).length
      ? importedData.projects
      : fromText.projects,
    certifications: firstNonEmptyArray(importedData, ['certifications', 'Certifications'])
      .length
      ? importedData.certifications
      : fromText.certifications,
    languages: firstNonEmptyArray(importedData, ['languages', 'Languages']).length
      ? importedData.languages
      : fromText.languages,
  };
}

export function transformImportDataToBuilder(
  importedData: any
): Record<string, any> {
  if (!importedData) {
    console.error('[import-transformer] No import data provided');
    return {};
  }

  // 1. Identity recovery + section backfill from rawText when parser arrays are empty
  const recovered = recoverFromRawText(importedData.rawText);
  const mergedImport = supplementImportFromRawText(
    mergeRecovery(importedData, recovered) as Record<string, unknown>
  );

  // 2. Identity & contact
  const personal = mergedImport.personalInformation || importedData.personalInformation || {};
  const professional = mergedImport.professionalInformation || importedData.professionalInformation || {};

  const email = sanitizeFieldText(mergedImport.email || personal.email || recovered.email);
  const phone = sanitizeFieldText(mergedImport.phone || personal.phone || recovered.phone);
  const location = sanitizeFieldText(
    mergedImport.location || mergedImport.address || personal.location || ''
  );
  const linkedin = sanitizeFieldText(
    mergedImport.linkedin ||
      mergedImport.linkedinUrl ||
      personal.linkedin ||
      recovered.linkedin
  );
  const portfolio = sanitizeFieldText(
    mergedImport.portfolio ||
      mergedImport.website ||
      mergedImport.github ||
      recovered.github ||
      recovered.portfolio
  );

  // Summary — fall back to recovered text from rawText if parser missed it.
  // Use cleanMultiline so paragraph breaks survive into the textarea field.
  const summaryRaw = mergedImport.summary || mergedImport.bio || mergedImport.objective;
  const summary = cleanMultiline(summaryRaw || recovered.summary || '').slice(0, 4000);

  // Names — try explicit fields, then split fullName, then derive from email
  const { firstName, lastName, displayName } = resolveName(mergedImport, email);

  const experience = transformExperienceArray(
    firstNonEmptyArray(mergedImport, [
      'experience',
      'workExperience',
      'Work Experience',
      'Experience',
    ])
  );

  const skills = cleanSkills(
    firstNonEmptyArray(mergedImport, ['skills', 'Skills', 'technicalSkills'])
  );

  let jobTitle = extractJobTitleFromImport(mergedImport, professional, experience);
  if (!jobTitle) {
    jobTitle = inferProfessionFromResume({
      summary,
      skills,
      experience,
      headline: sanitizeFieldText(
        mergedImport.headline || mergedImport.designation || professional.headline || '',
        120
      ),
    });
  }

  // 3. Build form data shaped exactly for each step
  const transformed: Record<string, any> = {
    // ===== ContactsStep =====
    firstName,
    lastName,
    name: displayName,
    fullName: displayName,
    email,
    phone,
    location,
    linkedin,
    portfolio,

    // ===== SummaryStep =====
    summary,
    bio: summary,
    objective: summary,

    jobTitle,
    title: jobTitle,

    // ===== SkillsStep =====
    skills,

    // ===== ExperienceStep =====
    experience,

    // ===== EducationStep =====
    education: transformEducationArray(
      firstNonEmptyArray(mergedImport, ['education', 'Education'])
    ),

    // ===== ProjectsStep =====
    projects: transformProjectsArray(
      firstNonEmptyArray(mergedImport, ['projects', 'Projects'])
    ),

    // ===== CertificationsStep =====
    certifications: transformCertificationsArray(
      firstNonEmptyArray(mergedImport, ['certifications', 'Certifications'])
    ),

    // ===== LanguagesStep =====
    languages: transformLanguagesArray(
      firstNonEmptyArray(mergedImport, ['languages', 'Languages'])
    ),

    // ===== AchievementsStep =====
    achievements: transformAchievementsArray(
      firstNonEmptyArray(mergedImport, ['achievements', 'Achievements'])
    ),

    // ===== HobbiesStep =====
    hobbies: cleanHobbies(
      firstNonEmptyArray(mergedImport, ['hobbies', 'Hobbies', 'Hobbies & Interests'])
    ),

    rawText: mergedImport.rawText || importedData.rawText,

    // Metadata
    _imported: true,
    _importedAt: Date.now(),
    _importSource: 'ai-extraction',
    _resumeId: mergedImport.resumeId || importedData.resumeId || null,
    _confidence: mergedImport.confidence || importedData.confidence || 85,
    _atsScore: mergedImport.atsScore || importedData.atsScore || 90,
  };

  // Template-loader legacy keys (preview + PDF coalesce reads these too)
  transformed['Work Experience'] = transformed.experience;
  transformed.Experience = transformed.experience;
  transformed.Education = transformed.education;
  transformed.Skills = transformed.skills;
  transformed.Projects = transformed.projects;
  transformed.Certifications = transformed.certifications;
  transformed.Achievements = transformed.achievements;
  transformed.Languages = transformed.languages;
  transformed.Hobbies = transformed.hobbies;

  logSummary(transformed);
  return transformed;
}

/* ------------------------------------------------------------------ */
/*  Validation / preview helpers (unchanged public surface)           */
/* ------------------------------------------------------------------ */

export function validateTransformedData(data: Record<string, any>): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!data.firstName && !data.name) issues.push('Missing first name');
  if (!data.email) warnings.push('Missing email address');

  for (const key of ['skills', 'experience', 'education'] as const) {
    if (data[key] && !Array.isArray(data[key])) {
      issues.push(`${key} field is not an array`);
    }
    if (Array.isArray(data[key]) && data[key].length === 0) {
      warnings.push(`No ${key} extracted`);
    }
  }

  return { valid: issues.length === 0, issues, warnings };
}

export function previewTransformation(importedData: any): {
  fieldsCount: number;
  contactsReady: boolean;
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  optionalFields: string[];
} {
  const transformed = transformImportDataToBuilder(importedData);
  return {
    fieldsCount: Object.keys(transformed).filter((k) => !k.startsWith('_')).length,
    contactsReady: !!(transformed.firstName && transformed.email),
    experienceCount: Array.isArray(transformed.experience) ? transformed.experience.length : 0,
    educationCount: Array.isArray(transformed.education) ? transformed.education.length : 0,
    skillsCount: Array.isArray(transformed.skills) ? transformed.skills.length : 0,
    optionalFields: (
      [
        transformed.projects?.length > 0 ? 'projects' : null,
        transformed.certifications?.length > 0 ? 'certifications' : null,
        transformed.languages?.length > 0 ? 'languages' : null,
        transformed.achievements?.length > 0 ? 'achievements' : null,
        transformed.hobbies?.length > 0 ? 'hobbies' : null,
      ].filter(Boolean) as string[]
    ),
  };
}

/* ------------------------------------------------------------------ */
/*  Section transformers                                              */
/* ------------------------------------------------------------------ */

function resolveName(
  importedData: any,
  email: string
): { firstName: string; lastName: string; displayName: string } {
  const personal = importedData.personalInformation || {};

  let firstName = sanitizeFieldText(importedData.firstName || personal.firstName || '', 80);
  let lastName = sanitizeFieldText(importedData.lastName || personal.lastName || '', 80);

  const rawFullName = sanitizeFieldText(
    importedData.fullName ||
      importedData.name ||
      personal.fullName ||
      `${firstName} ${lastName}`.trim(),
    120
  );

  if (!firstName && !lastName && rawFullName) {
    const split = splitFullName(rawFullName);
    firstName = split.firstName;
    lastName = split.lastName;
  } else if (firstName && !lastName && rawFullName.includes(' ')) {
    const split = splitFullName(rawFullName);
    if (!lastName) lastName = split.lastName;
  }

  // Only fall back to email-derived name if NOTHING usable came from the parser.
  // A real single-word first name (e.g. "Anam") from the resume is preferred over
  // an email-derived guess.
  const garbage =
    isGarbageResumeText(rawFullName) ||
    rawFullName.toLowerCase().includes('uploaded') ||
    rawFullName === 'User';

  const hasAnyParsedName = !!(firstName || lastName);

  if (!hasAnyParsedName && garbage && email) {
    const slug = email.split('@')[0].replace(/\d+/g, '').replace(/[._-]/g, ' ');
    const { firstName: ef, lastName: el } = splitFullName(slug);
    if (ef) firstName = titleCase(ef);
    if (el) lastName = el.split(' ').map(titleCase).join(' ');
  } else if (!hasAnyParsedName && email) {
    // Parser returned absolutely nothing — derive from email as last resort.
    const slug = email.split('@')[0].replace(/\d+/g, '').replace(/[._-]/g, ' ');
    const { firstName: ef, lastName: el } = splitFullName(slug);
    if (ef) firstName = titleCase(ef);
    if (el) lastName = el.split(' ').map(titleCase).join(' ');
  }

  firstName = formatDisplayName(firstName);
  lastName = formatDisplayName(lastName);

  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  const fromRaw = formatDisplayName(rawFullName);
  const displayName =
    fromRaw && (!lastName || fromRaw.replace(/\s+/g, '').length >= combined.replace(/\s+/g, '').length)
      ? fromRaw
      : combined || fromRaw;

  return {
    firstName: firstName || (displayName ? displayName.split(/\s+/)[0] : ''),
    lastName,
    displayName,
  };
}

function extractJobTitleFromImport(
  mergedImport: Record<string, unknown>,
  professional: Record<string, unknown>,
  experience: Record<string, unknown>[]
): string {
  const headline = sanitizeFieldText(
    mergedImport.headline ||
      mergedImport.designation ||
      professional.headline ||
      professional.designation ||
      '',
    120
  );

  const direct = sanitizeFieldText(
    mergedImport.jobTitle ||
      mergedImport.currentTitle ||
      mergedImport.desiredJobTitle ||
      professional.jobTitle ||
      mergedImport.currentRole ||
      mergedImport.profession ||
      headline ||
      '',
    120
  );
  if (direct) return direct;

  const firstExp = experience[0];
  if (firstExp) {
    const fromExp = sanitizeFieldText(
      String(
        firstExp.title ||
          firstExp.position ||
          firstExp.Position ||
          firstExp.role ||
          firstExp.jobTitle ||
          ''
      ),
      120
    );
    if (fromExp) return fromExp;
  }

  return '';
}

function cleanSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  const cleaned = skills.map((s) => sanitizeSkillEntry(s)).filter(Boolean);
  return dedupeStrings(cleaned);
}

function cleanHobbies(hobbies: unknown): string[] {
  if (!Array.isArray(hobbies)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of hobbies) {
    let value = '';
    if (typeof h === 'string') value = sanitizeFieldText(h, 80);
    else if (h && typeof h === 'object') {
      const rec = h as Record<string, unknown>;
      value = sanitizeFieldText(String(rec.name ?? rec.title ?? ''), 80);
    }
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function transformExperienceArray(experiences: unknown): any[] {
  if (!Array.isArray(experiences)) return [];

  const mapped = experiences
    .map((exp) => sanitizeExperienceEntry((exp ?? {}) as Record<string, unknown>))
    .filter((exp): exp is Record<string, unknown> => exp != null)
    .map((exp) => {
      const position = String(exp.position || exp.title || '');
      const company = String(exp.company || '');
      const location = String(exp.location || '');

      const startMonth = toMonthInput(exp.startDate);
      const endRaw = exp.endDate || '';
      const isCurrent =
        exp.current === true ||
        !endRaw ||
        /^(present|current|now|ongoing)$/i.test(String(endRaw));
      // For <input type="month"> we cannot use "Present" — leave blank when current,
      // the checkbox conveys the state. Templates read `current` and render "Present".
      const endMonth = isCurrent ? '' : toMonthInput(endRaw);

      // Build the canonical bullet list. Priority:
      //   1. parser-provided achievements[]
      //   2. bullets split from the raw description
      const rawDesc = String(exp.description ?? '');
      const parserBullets: string[] = Array.isArray(exp.achievements)
        ? (exp.achievements as unknown[])
            .map((a) => {
              if (typeof a === 'string') return a;
              const rec = a as Record<string, unknown>;
              return String(rec?.title ?? rec?.description ?? rec?.text ?? '');
            })
            .map((s) => cleanString(s))
            .filter(Boolean)
        : [];
      const descBullets = splitBullets(rawDesc);
      const bullets = dedupeStrings(
        parserBullets.length > 0 ? parserBullets : descBullets
      );

      // Description field for templates that don't render bullets: full
      // multi-line cleaned text. Templates that DO render bullets read
      // `achievements[]` / `bullets[]` instead.
      const description =
        cleanMultiline(rawDesc) ||
        (bullets.length ? bullets.map((b) => `• ${b}`).join('\n') : '');

      // SINGLE source of truth for the "Present" indicator: the `current` flag.
      // Duration is a presentation string; endDate stays empty when current so
      // no template path renders "Present" twice.
      const duration = isCurrent
        ? (startMonth ? `${startMonth} - Present` : 'Present')
        : computeDuration(startMonth, endMonth);

      return {
        // ExperienceStep canonical
        title: position,
        company,
        location,
        startDate: startMonth,
        endDate: endMonth, // '' when current
        description,
        current: isCurrent,
        achievements: bullets,
        bullets,
        // Template aliases (capitalized)
        Position: position,
        Company: company,
        Location: location,
        Description: description,
        Duration: duration,
      };
    });

  // Dedupe by company|title|startDate
  const seen = new Set<string>();
  const unique = mapped.filter((e) => {
    const company = String(e.company || '').trim();
    const title = String(e.title || '').trim();
    const start = String(e.startDate || '').trim();
    const end = String(e.endDate || '').trim();

    // If dates are missing, do NOT dedupe — preserve separate entries.
    if (!start && !end) return true;

    const key = `${company}|${title}|${start || '?'}|${end || '?'}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Most recent first (by startDate desc, then current first)
  const sorted = unique.sort(compareByRecent);

  // Temporary deep-debug logging for experience boundary integrity.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('[exp-pipe][transformImportDataToBuilder][experience]', {
      inputCount: experiences.length,
      mappedCount: mapped.length,
      dedupedCount: unique.length,
      sortedCount: sorted.length,
      currentCount: sorted.filter((x) => x.current === true).length,
      sample: sorted.slice(0, 3).map((x) => ({
        company: x.company,
        title: x.title,
        startDate: x.startDate,
        endDate: x.endDate,
        current: x.current,
      })),
    });
  }

  return sorted;
}

function transformEducationArray(education: unknown): any[] {
  if (!Array.isArray(education)) return [];

  const mapped = education
    .map((edu) => sanitizeEducationEntry((edu ?? {}) as Record<string, unknown>))
    .filter((edu): edu is Record<string, unknown> => edu != null)
    .map((edu) => {
      const institution = String(edu.institution || '');
      const degree = String(edu.degree || '');
      const field = String(edu.field || '');
      const gpa = String(edu.gpa || '');

      // Year MUST be a bare 4-digit string — EducationStep uses <input type="number">
      const year = extractYear(edu.year || edu.endDate);
      const startDate = toMonthInput(edu.startDate);
      const endDate = toMonthInput(edu.endDate || edu.year);

      return {
        // EducationStep canonical
        degree,
        school: institution,
        field,
        year,
        cgpa: gpa,
        // Compat aliases
        institution,
        Institution: institution,
        Degree: degree,
        Field: field,
        Year: year,
        gpa,
        GPA: gpa,
        startDate,
        endDate,
        description: String(edu.description || ''),
        location: String(edu.location || ''),
      };
    });

  const seen = new Set<string>();
  return mapped.filter((edu) => {
    const key = `${edu.institution}|${edu.degree}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function transformProjectsArray(projects: unknown): any[] {
  if (!Array.isArray(projects)) return [];
  return projects
    .map((p) => sanitizeProjectEntry(p))
    .filter((p): p is Record<string, unknown> => p != null);
}

function transformCertificationsArray(certifications: unknown): any[] {
  if (!Array.isArray(certifications)) return [];
  return certifications
    .map((c) => sanitizeCertificationEntry(c))
    .filter((c): c is Record<string, unknown> => c != null);
}

function transformLanguagesArray(languages: unknown): any[] {
  if (!Array.isArray(languages)) return [];
  const out: Array<{ name: string; language: string; proficiency: string }> = [];
  const seen = new Set<string>();
  for (const l of languages) {
    const item = sanitizeLanguageEntry(l);
    if (!item) continue;
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * AchievementsStep expects `string[]`. Templates also support string arrays.
 * We coerce whatever the parser gave us into a clean list of one-line strings.
 */
function transformAchievementsArray(achievements: unknown): string[] {
  if (!Array.isArray(achievements)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of achievements) {
    const value = sanitizeAchievementEntry(a);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Field helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Coerce a date value (anything) to "YYYY-MM" suitable for <input type="month">.
 * Returns "" if unparseable, "Present" if current, "YYYY-01" when only year known.
 */
function toMonthInput(value: unknown): string {
  const norm = normalizeDate(value);
  if (!norm) return '';
  if (/^present$/i.test(norm)) return 'Present';
  // already YYYY-MM
  if (/^\d{4}-\d{2}$/.test(norm)) return norm;
  // bare YYYY → pad to YYYY-01 so the month input accepts it
  const year = norm.match(/^(\d{4})$/);
  if (year) return `${year[1]}-01`;
  // try to grab YYYY-MM anywhere in the string
  const ym = norm.match(/(\d{4})-(\d{1,2})/);
  if (ym) {
    const m = String(Math.max(1, Math.min(12, parseInt(ym[2], 10)))).padStart(2, '0');
    return `${ym[1]}-${m}`;
  }
  return '';
}

/** Extract bare 4-digit year for EducationStep <input type="number">. */
function extractYear(value: unknown): string {
  const norm = normalizeDate(value);
  if (!norm) return '';
  const m = norm.match(/(19|20)\d{2}/);
  return m ? m[0] : '';
}

function computeDuration(startDate: string, endDate: string): string {
  if (!startDate) return '';
  const end = endDate || 'Present';
  return `${startDate} - ${end}`;
}

function compareByRecent(a: { startDate?: string; current?: boolean }, b: { startDate?: string; current?: boolean }): number {
  if (a.current && !b.current) return -1;
  if (b.current && !a.current) return 1;
  const sa = String(a.startDate || '');
  const sb = String(b.startDate || '');
  return sb.localeCompare(sa);
}

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

function logSummary(t: Record<string, any>): void {
  const counts = {
    firstName: !!t.firstName,
    lastName: !!t.lastName,
    email: !!t.email,
    phone: !!t.phone,
    location: !!t.location,
    linkedin: !!t.linkedin,
    portfolio: !!t.portfolio,
    summary: !!t.summary,
    skills: t.skills?.length || 0,
    experience: t.experience?.length || 0,
    education: t.education?.length || 0,
    projects: t.projects?.length || 0,
    certifications: t.certifications?.length || 0,
    languages: t.languages?.length || 0,
    achievements: t.achievements?.length || 0,
    hobbies: t.hobbies?.length || 0,
  };
  console.log('[import-transformer] mapped →', counts);
}
