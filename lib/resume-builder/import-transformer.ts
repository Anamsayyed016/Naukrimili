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
  splitFullNameWithRejected,
  pickRicherFullName,
  sanitizePersonName,
  deriveDisplayNameFromEmail,
  sanitizeFieldText,
  isEmailDerivedName,
  parseIntelligentNameFromEmail,
  sanitizeSkillEntry,
  sanitizeExperienceEntry,
  sanitizeEducationEntry,
  sanitizeAchievementEntry,
  sanitizeLanguageEntry,
  sanitizeProjectEntry,
  sanitizeCertificationEntry,
  splitMergedProjectEntries,
  logRawProjects,
  isGarbageResumeText,
  formatDisplayName,
  isExperienceBlurbFragment,
  isPlausiblePersonName,
} from '@/lib/resume-parser/import-sanitize';
import {
  classifyResumeTextFragment,
  emptyAdditionalResumeData,
  stashUnclassifiedFragment,
  type AdditionalResumeData,
} from '@/lib/resume-parser/field-classification';
import { inferProfessionFromResume } from '@/lib/resume-builder/infer-profession';
import {
  recoverFromRawText,
  mergeRecovery,
  extractResumeFromText,
  extractAdditionalResumeDataFromText,
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

function mergeUniqueStrings(existing: unknown[], recovered: string[]): string[] {
  const base = existing.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  if (!recovered.length) return base;
  if (!base.length) return recovered;
  const seen = new Set(base.map((s) => s.toLowerCase()));
  const out = [...base];
  for (const item of recovered) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function mergeAdditionalResumeData(
  base: AdditionalResumeData,
  extra: AdditionalResumeData
): AdditionalResumeData {
  const uniq = (items: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of items) {
      const key = item.toLowerCase();
      if (!item.trim() || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  };

  return {
    sectionHeaders: uniq([...base.sectionHeaders, ...extra.sectionHeaders]),
    unclassifiedFragments: [
      ...base.unclassifiedFragments,
      ...extra.unclassifiedFragments.filter(
        (f) =>
          !base.unclassifiedFragments.some(
            (b) => b.value.toLowerCase() === f.value.toLowerCase()
          )
      ),
    ],
    achievements: uniq([...base.achievements, ...extra.achievements]),
    awards: uniq([...base.awards, ...extra.awards]),
    memberships: uniq([...base.memberships, ...extra.memberships]),
    publications: uniq([...base.publications, ...extra.publications]),
    patents: uniq([...base.patents, ...extra.patents]),
    volunteerWork: uniq([...base.volunteerWork, ...extra.volunteerWork]),
    extraSections: [
      ...base.extraSections,
      ...extra.extraSections.filter(
        (s) => !base.extraSections.some((b) => b.heading.toLowerCase() === s.heading.toLowerCase())
      ),
    ],
  };
}

function mergeUniqueRecords<T extends Record<string, unknown>>(
  existing: unknown[],
  recovered: T[],
  keyFn: (item: T) => string
): T[] {
  const base = existing.filter((e): e is T => !!e && typeof e === 'object');
  if (!recovered.length) return base;
  if (!base.length) return recovered;
  const seen = new Set(base.map(keyFn).filter(Boolean));
  const out = [...base];
  for (const item of recovered) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Backfill sparse parser output from raw resume text (per-field, not all-or-nothing). */
function supplementImportFromRawText(
  importedData: Record<string, unknown>,
  fromText?: ReturnType<typeof extractResumeFromText>
): Record<string, unknown> {
  const rawText = importedData.rawText;
  if (typeof rawText !== 'string' || rawText.length < 80) {
    return importedData;
  }

  const textParsed = fromText ?? extractResumeFromText(rawText);
  const email = String(importedData.email || textParsed.email || '');
  const personal = (importedData.personalInformation || {}) as Record<string, unknown>;

  let fullName = pickRicherFullName(
    sanitizePersonName(importedData.fullName || importedData.name || '', 120),
    sanitizePersonName(textParsed?.fullName || '', 120),
    email
  );
  fullName = pickRicherFullName(
    fullName,
    sanitizePersonName(personal.fullName || '', 120),
    email
  );

  const parserExperience = firstNonEmptyArray(importedData, [
    'experience',
    'workExperience',
    'Work Experience',
    'Experience',
  ]);
  const parserEducation = firstNonEmptyArray(importedData, ['education', 'Education']);
  const parserSkills = firstNonEmptyArray(importedData, ['skills', 'Skills', 'technicalSkills']);
  const parserProjects = firstNonEmptyArray(importedData, ['projects', 'Projects']);
  const parserCerts = firstNonEmptyArray(importedData, ['certifications', 'Certifications']);
  const parserLanguages = firstNonEmptyArray(importedData, ['languages', 'Languages']);
  const parserHobbies = firstNonEmptyArray(importedData, [
    'hobbies',
    'Hobbies',
    'Hobbies & Interests',
    'interests',
    'Interests',
  ]);

  return {
    ...importedData,
    fullName: fullName || textParsed.fullName || '',
    name: fullName || textParsed.fullName || importedData.name || '',
    email: importedData.email || textParsed.email || '',
    phone: importedData.phone || textParsed.phone || '',
    location: importedData.location || importedData.address || textParsed.location || '',
    linkedin: importedData.linkedin || importedData.linkedinUrl || textParsed.linkedin || '',
    portfolio:
      importedData.portfolio ||
      importedData.website ||
      importedData.github ||
      textParsed.portfolio ||
      '',
    summary: importedData.summary || importedData.bio || importedData.objective || textParsed.summary || '',
    skills: mergeUniqueStrings(parserSkills as string[], textParsed.skills || []),
    experience: mergeUniqueRecords(
      parserExperience,
      (textParsed.experience || []) as Array<Record<string, unknown>>,
      (e) =>
        `${String(e.company || '').trim()}|${String(e.position || e.title || '').trim()}`.toLowerCase()
    ),
    education: mergeUniqueRecords(
      parserEducation,
      (textParsed.education || []) as Array<Record<string, unknown>>,
      (e) =>
        `${String(e.institution || e.school || '').trim()}|${String(e.degree || '').trim()}`.toLowerCase()
    ),
    projects: mergeUniqueRecords(
      parserProjects,
      (textParsed.projects || []) as Array<Record<string, unknown>>,
      (p) => String(p.name || p.title || '').trim().toLowerCase()
    ),
    certifications: mergeUniqueRecords(
      parserCerts,
      (textParsed.certifications || []) as Array<Record<string, unknown>>,
      (c) => String(c.name || c.title || '').trim().toLowerCase()
    ),
    languages: mergeUniqueRecords(
      parserLanguages,
      (textParsed.languages || []) as Array<Record<string, unknown>>,
      (l) => String((l as { name?: string }).name || l || '').trim().toLowerCase()
    ),
    hobbies: mergeUniqueStrings(
      parserHobbies
        .map((h) =>
          typeof h === 'string' ? h : String((h as { name?: string }).name || '')
        )
        .filter((h) => h.trim().length > 0),
      (textParsed.hobbies || []).filter((h): h is string => typeof h === 'string')
    ),
    achievements: mergeUniqueStrings(
      firstNonEmptyArray(importedData, ['achievements', 'Achievements']).map((a) =>
        typeof a === 'string' ? a : String((a as { title?: string }).title || '')
      ),
      (textParsed.achievements || []).filter((a): a is string => typeof a === 'string')
    ),
  };
}

export function transformImportDataToBuilder(
  importedData: any
): Record<string, any> {
  if (!importedData) {
    console.error('[import-transformer] No import data provided');
    return {};
  }

  // 1. Identity recovery + section backfill from rawText when parser arrays are sparse
  const recovered = recoverFromRawText(importedData.rawText);
  const mergedBase = mergeRecovery(importedData, recovered) as Record<string, unknown>;
  const textParsed =
    typeof mergedBase.rawText === 'string' && mergedBase.rawText.length >= 80
      ? extractResumeFromText(mergedBase.rawText)
      : undefined;
  const mergedImport = supplementImportFromRawText(mergedBase, textParsed);

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

  // Names — classification layer before any contact field mapping
  const { firstName, lastName, displayName, additionalResumeData } = resolveClassifiedName(
    mergedImport,
    email,
    textParsed?.fullName || ''
  );
  const textAdditional =
    typeof mergedBase.rawText === 'string' && mergedBase.rawText.length >= 80
      ? extractAdditionalResumeDataFromText(mergedBase.rawText)
      : emptyAdditionalResumeData();
  const mergedAdditional = mergeAdditionalResumeData(additionalResumeData, textAdditional);

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
      (() => {
        const raw = firstNonEmptyArray(mergedImport, ['projects', 'Projects']);
        console.log('[import-transformer] mergedImport project keys', {
          projects: Array.isArray(mergedImport.projects) ? mergedImport.projects.length : 0,
          Projects: Array.isArray(mergedImport.Projects) ? mergedImport.Projects.length : 0,
        });
        return raw;
      })()
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
    achievements: (() => {
      const base = transformAchievementsArray(
        firstNonEmptyArray(mergedImport, ['achievements', 'Achievements'])
      );
      const extra = [
        ...(mergedAdditional.achievements || []),
        ...(mergedAdditional.memberships || []),
        ...(mergedAdditional.publications || []),
        ...(mergedAdditional.volunteerWork || []),
        ...mergedAdditional.unclassifiedFragments
          .filter((f) => f.kind === 'ACHIEVEMENT')
          .map((f) => f.value),
        ...(textParsed?.achievements || []),
      ];
      const seen = new Set(base.map((a) => a.toLowerCase()));
      const out = [...base];
      for (const item of extra) {
        const value = sanitizeFieldText(item, 500);
        if (!value) continue;
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(value);
      }
      return out;
    })(),

    // ===== HobbiesStep =====
    hobbies: cleanHobbies(
      firstNonEmptyArray(mergedImport, ['hobbies', 'Hobbies', 'Hobbies & Interests'])
    ),

    additionalResumeData: mergedAdditional,

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

/** True when at least one section has data worth applying to the editor. */
export function hasImportableContent(data: Record<string, any>): boolean {
  if (!data || typeof data !== 'object') return false;

  if (
    sanitizeFieldText(data.firstName) ||
    sanitizeFieldText(data.lastName) ||
    sanitizeFieldText(data.name) ||
    sanitizeFieldText(data.fullName) ||
    sanitizeFieldText(data.email) ||
    sanitizeFieldText(data.phone)
  ) {
    return true;
  }

  if (sanitizeFieldText(data.summary)) return true;

  for (const key of [
    'skills',
    'experience',
    'education',
    'projects',
    'certifications',
    'languages',
    'achievements',
    'hobbies',
  ] as const) {
    if (Array.isArray(data[key]) && data[key].length > 0) return true;
  }

  return false;
}

export function validateTransformedData(data: Record<string, any>): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!data.firstName && !data.name && !data.fullName) {
    warnings.push('Missing name');
  }
  if (!data.email) warnings.push('Missing email address');

  for (const key of ['skills', 'experience', 'education'] as const) {
    if (data[key] && !Array.isArray(data[key])) {
      issues.push(`${key} field is not an array`);
    }
    if (Array.isArray(data[key]) && data[key].length === 0) {
      warnings.push(`No ${key} extracted`);
    }
  }

  if (!hasImportableContent(data)) {
    issues.push('No importable resume content');
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

function resolveClassifiedName(
  importedData: any,
  email: string,
  headerNameFromText = ''
): {
  firstName: string;
  lastName: string;
  displayName: string;
  additionalResumeData: AdditionalResumeData;
} {
  const additionalResumeData = emptyAdditionalResumeData();
  const personal = importedData.personalInformation || {};
  const textHeaderName = sanitizePersonName(headerNameFromText, 120);

  const parserFirst = String(importedData.firstName || personal.firstName || '').trim();
  const parserLast = String(importedData.lastName || personal.lastName || '').trim();

  for (const fragment of [parserFirst, parserLast]) {
    if (!fragment) continue;
    const classified = classifyResumeTextFragment(fragment);
    if (classified.kind !== 'PERSON_NAME') {
      stashUnclassifiedFragment(additionalResumeData, fragment, classified.kind);
    }
  }

  const explicitCombined = [
    sanitizePersonName(parserFirst, 80),
    sanitizePersonName(parserLast, 80),
  ]
    .filter(Boolean)
    .join(' ');

  let rawFullName = '';
  for (const candidate of [
    explicitCombined,
    importedData.fullName,
    importedData.name,
    personal.fullName,
    textHeaderName,
  ]) {
    const cleaned = sanitizePersonName(candidate, 120);
    if (!cleaned) {
      const classified = classifyResumeTextFragment(candidate);
      if (classified.value) {
        stashUnclassifiedFragment(additionalResumeData, classified.value, classified.kind);
      }
      continue;
    }
    rawFullName = pickRicherFullName(rawFullName, cleaned, email);
  }

  const garbage =
    isGarbageResumeText(rawFullName) ||
    rawFullName.toLowerCase().includes('uploaded') ||
    rawFullName === 'User';

  if (garbage) rawFullName = '';

  const rawNameWordCount = rawFullName.split(/\s+/).filter(Boolean).length;
  if (rawFullName && email && rawNameWordCount < 2 && isEmailDerivedName(rawFullName, email)) {
    const richerHeader = textHeaderName && !isEmailDerivedName(textHeaderName, email)
      ? textHeaderName
      : '';
    rawFullName = pickRicherFullName('', richerHeader, email);
  }

  let firstName = '';
  let lastName = '';

  if (rawFullName) {
    const split = splitFullNameWithRejected(rawFullName);
    firstName = split.firstName;
    lastName = split.lastName;
    for (const rejected of split.rejected) {
      stashUnclassifiedFragment(additionalResumeData, rejected.value, rejected.kind);
    }
  }

  const splitCombined = [firstName, lastName].filter(Boolean).join(' ').trim();
  const hasUsableName = !!(splitCombined && isPlausiblePersonName(splitCombined));

  if (!hasUsableName && email) {
    const fromEmail = parseIntelligentNameFromEmail(email);
    if (fromEmail) {
      firstName = fromEmail.firstName;
      lastName = fromEmail.lastName;
    } else {
      const derived = deriveDisplayNameFromEmail(email);
      if (derived) {
        const split = splitFullNameWithRejected(derived);
        firstName = split.firstName;
        lastName = split.lastName;
        rawFullName = derived;
      }
    }
  }

  firstName = formatDisplayName(firstName);
  lastName = formatDisplayName(lastName);

  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = combined || formatDisplayName(textHeaderName);

  const safeFirst = sanitizePersonName(firstName, 80);
  const safeLast = sanitizePersonName(lastName, 80);

  return {
    firstName: safeFirst,
    lastName: safeLast,
    displayName: [safeFirst, safeLast].filter(Boolean).join(' ') || displayName,
    additionalResumeData,
  };
}

function isUsableJobHeadline(value: string): boolean {
  if (!value || isGarbageResumeText(value) || isExperienceBlurbFragment(value)) return false;
  return true;
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
  if (direct && isUsableJobHeadline(direct)) return direct;

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
    if (fromExp && isUsableJobHeadline(fromExp)) return fromExp;
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
  logRawProjects(projects);
  const split = splitMergedProjectEntries(projects);
  if (split.length !== projects.length) {
    console.log('[import-transformer] split merged projects', {
      before: projects.length,
      after: split.length,
    });
    logRawProjects(split, 'RAW PROJECTS AFTER SPLIT');
  }
  const transformed = split
    .map((p, index) => sanitizeProjectEntry(p, index))
    .filter((p): p is Record<string, unknown> => p != null);
  console.log('[import-transformer] final projects.length', transformed.length);
  return transformed;
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
