/**
 * Dynamic parser → Builder field alias normalization and section recovery.
 * Mapping layer only — does not alter extraction algorithms.
 */

import {
  readExperienceCompanySlot,
  readExperiencePositionSlot,
  sanitizeFieldText,
  splitMultiColumnExperienceHeader,
  sanitizeExperienceCompanyValue,
  isExperienceDateOrDurationToken,
  stripRedundantCompanyFromPosition,
} from '@/lib/resume-parser/import-sanitize';

export const EXPERIENCE_SECTION_KEYS = [
  'experience',
  'workExperience',
  'Work Experience',
  'Experience',
  'employment',
  'workHistory',
  'employmentHistory',
  'professionalExperience',
  'Professional Experience',
  'careerHistory',
  'legalWork',
  'legalExperience',
  'positions',
  'appointments',
];

export const EDUCATION_SECTION_KEYS = [
  'education',
  'Education',
  'academic',
  'qualifications',
];

export const PROJECT_SECTION_KEYS = ['projects', 'Projects'];

export const SKILL_SECTION_KEYS = [
  'skills',
  'Skills',
  'technicalSkills',
  'technical_skills',
  'expertise',
  'competencies',
  'coreSkills',
  'coreCompetencies',
  'core_competencies',
  'softSkills',
  'soft_skills',
];

export const LANGUAGE_SECTION_KEYS = [
  'languages',
  'Languages',
  'languageKnown',
  'spokenLanguages',
];

export const CERT_SECTION_KEYS = [
  'certifications',
  'Certifications',
  'licenses',
  'credentials',
  'professionalCertifications',
];

export const AWARD_SECTION_KEYS = ['awards', 'Awards', 'honours', 'recognitions'];

export const ACHIEVEMENT_SECTION_KEYS = ['achievements', 'Achievements'];

export const HOBBY_SECTION_KEYS = [
  'hobbies',
  'Hobbies',
  'interests',
  'personalInterests',
  'activities',
  'Hobbies & Interests',
];

export const COMPANY_ALIASES = [
  'company',
  'Company',
  'organization',
  'organisation',
  'Organization',
  'Organisation',
  'employer',
  'Employer',
  'companyName',
  'CompanyName',
  'firm',
  'Firm',
  'office',
  'Office',
  'workedAt',
  'organizationName',
];

export const DESIGNATION_ALIASES = [
  'designation',
  'Designation',
  'position',
  'Position',
  'role',
  'Role',
  'jobTitle',
  'JobTitle',
  'title',
  'Title',
  'job_title',
];

export function readFirstString(
  obj: Record<string, unknown>,
  keys: string[],
  maxLen = 200
): string {
  for (const key of keys) {
    const v = sanitizeFieldText(obj[key], maxLen);
    if (v) return v;
  }
  return '';
}

export function readFirstArray(obj: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const v = obj[key];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return [];
}

export function normalizeTechnologiesField(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((t) =>
        sanitizeFieldText(typeof t === 'string' ? t : String((t as { name?: string })?.name ?? t), 80)
      )
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,;|•/]+/)
      .map((t) => sanitizeFieldText(t, 80))
      .filter(Boolean);
  }
  return [];
}

export function normalizeExperienceEntryAliases(exp: Record<string, unknown>): Record<string, unknown> {
  const split = splitMultiColumnExperienceHeader(exp);
  const out = { ...split };
  const company =
    readExperienceCompanySlot(split) ||
    readFirstString(split, ['firm', 'Firm', 'office', 'Office'], 160);
  const position = readExperiencePositionSlot(split);
  if (company) {
    out.company = company;
    out.Company = company;
    out.organization = company;
  } else {
    for (const key of ['company', 'Company', 'organization', 'employer', 'firm', 'office'] as const) {
      delete out[key];
    }
  }
  if (position) {
    const cleanedPosition = company
      ? stripRedundantCompanyFromPosition(position, company)
      : position;
    out.position = cleanedPosition;
    out.title = cleanedPosition;
    out.designation = cleanedPosition;
    out.job_title = cleanedPosition;
  }
  const loc = readFirstString(exp, ['location', 'Location', 'city', 'City', 'workLocation'], 120);
  if (loc) {
    out.location = loc;
    out.Location = loc;
  }
  if (!Array.isArray(out.achievements) || (out.achievements as unknown[]).length === 0) {
    const bullets = out.bulletPoints ?? out.bullets ?? out.highlights;
    if (Array.isArray(bullets)) out.achievements = bullets;
  }
  return out;
}

export function normalizeEducationEntryAliases(edu: Record<string, unknown>): Record<string, unknown> {
  const out = { ...edu };
  const institution = readFirstString(edu, [
    'institution',
    'Institution',
    'school',
    'School',
    'college',
    'College',
    'academy',
    'Academy',
    'university',
    'University',
  ]);
  const degree = readFirstString(edu, ['degree', 'Degree', 'qualification', 'Qualification']);
  const field = readFirstString(edu, ['field', 'Field', 'major', 'Major', 'specialization']);
  const gpa = readFirstString(edu, ['gpa', 'GPA', 'cgpa', 'CGPA', 'percentage', 'Percentage', 'grade'], 20);
  if (institution) {
    out.institution = institution;
    out.school = institution;
  }
  if (degree) out.degree = degree;
  if (field) out.field = field;
  if (gpa) {
    out.gpa = gpa;
    if (gpa.includes('%')) out.percentage = gpa;
    else out.cgpa = gpa;
  }
  return out;
}

export function normalizeProjectEntryAliases(proj: Record<string, unknown>): Record<string, unknown> {
  const out = { ...proj };
  const name = readFirstString(proj, [
    'name',
    'title',
    'projectName',
    'project',
    'Name',
    'Title',
    'ProjectName',
  ]);
  if (name) {
    out.name = name;
    out.title = name;
  }
  const tech = normalizeTechnologiesField(
    proj.technologies ??
      proj.Technologies ??
      proj.tech ??
      proj.techStack ??
      proj.stack ??
      proj.tools ??
      proj.languagesUsed
  );
  if (tech.length) out.technologies = tech;
  const role = readFirstString(proj, ['role', 'Role', 'position', 'myRole']);
  if (role) out.role = role;
  const github = readFirstString(proj, ['github', 'Github', 'repo', 'repository'], 300);
  const url = readFirstString(proj, ['url', 'link', 'liveUrl', 'liveURL', 'live_url', 'website'], 300);
  if (github) out.github = github;
  if (url) {
    out.url = url;
    out.link = url;
  }
  const duration = readFirstString(proj, ['duration', 'Duration', 'period'], 80);
  if (duration) out.duration = duration;
  return out;
}

export function normalizeCertificationEntryAliases(cert: Record<string, unknown>): Record<string, unknown> {
  const out = { ...cert };
  const name = readFirstString(cert, ['name', 'title', 'certification', 'certificateName', 'Name']);
  const issuer = readFirstString(cert, [
    'issuer',
    'organization',
    'issuingOrganization',
    'Issuer',
    'issuedBy',
  ]);
  const date = readFirstString(cert, ['date', 'issueDate', 'issued_date', 'issuedDate', 'year'], 40);
  const expiry = readFirstString(cert, ['expiryDate', 'expiry_date', 'expiry', 'expirationDate'], 40);
  const credentialId = readFirstString(cert, ['credentialId', 'credential_id', 'id', 'licenseNumber'], 80);
  const url = readFirstString(cert, ['url', 'link', 'credentialUrl', 'credentialURL'], 300);
  if (name) out.name = name;
  if (issuer) out.issuer = issuer;
  if (date) out.date = date;
  if (expiry) out.expiryDate = expiry;
  if (credentialId) out.credentialId = credentialId;
  if (url) {
    out.url = url;
    out.link = url;
  }
  return out;
}

export function splitFullNameForBuilder(fullName: string): { firstName: string; lastName: string } {
  const cleaned = sanitizeFieldText(fullName, 120);
  if (!cleaned) return { firstName: '', lastName: '' };
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function normalizeListSection(
  out: Record<string, unknown>,
  keys: string[],
  normalizer: (row: Record<string, unknown>) => Record<string, unknown>
): void {
  const list = readFirstArray(out, keys);
  if (list.length === 0) return;
  const normalized = list.map((row) =>
    row && typeof row === 'object' ? normalizer(row as Record<string, unknown>) : row
  );
  for (const key of keys) {
    if (Array.isArray(out[key]) && (out[key] as unknown[]).length > 0) {
      out[key] = normalized;
    }
  }
  if (!Array.isArray(out[keys[0]]) || (out[keys[0]] as unknown[]).length === 0) {
    out[keys[0]] = normalized;
  }
}

/** Expand parser/import aliases on an upload profile before Builder transform. */
const HYDRATION_SKIP_KEYS = new Set([
  'builderFormData',
  'additionalResumeData',
  'extendedSections',
  'rawText',
  'customParserUsed',
  'selectedParser',
  '_aiProvider',
  '_imported',
  '_importedAt',
  '_userEdited',
  'personalInformation',
  'professionalInformation',
]);

const EXPERIENCE_ARRAY_KEY_RE =
  /(?:experience|employment|work[\s_-]?history|career|positions?|legal|professional[\s_-]?(?:experience|background|history)|appointments?|responsibilit)/i;

const SKILL_ARRAY_KEY_RE =
  /(?:skills?|competenc|expertise|technical|proficienc)/i;

function looksLikeExperienceArray(arr: unknown[]): boolean {
  let hits = 0;
  for (const item of arr) {
    if (typeof item === 'string' && sanitizeFieldText(item, 200).length >= 8) {
      hits++;
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (
      readExperienceCompanySlot(row) ||
      readExperiencePositionSlot(row) ||
      sanitizeFieldText(row.description ?? row.Description, 40)
    ) {
      hits++;
    }
  }
  return hits > 0;
}

/** Discover parser output stored under non-canonical section keys (mapping layer only). */
export function discoverImportSectionArrays(profile: Record<string, unknown>): Record<string, unknown> {
  const out = { ...profile };

  if (readFirstArray(out, EXPERIENCE_SECTION_KEYS).length === 0) {
    const discovered: unknown[] = [];
    for (const [key, value] of Object.entries(out)) {
      if (HYDRATION_SKIP_KEYS.has(key)) continue;
      if (EDUCATION_SECTION_KEYS.includes(key)) continue;
      if (!Array.isArray(value) || value.length === 0) continue;
      if (!EXPERIENCE_ARRAY_KEY_RE.test(key)) continue;
      if (!looksLikeExperienceArray(value)) continue;
      discovered.push(...value);
    }
    if (discovered.length > 0) {
      out.experience = discovered;
    }
  }

  if (readFirstArray(out, SKILL_SECTION_KEYS).length === 0) {
    for (const [key, value] of Object.entries(out)) {
      if (HYDRATION_SKIP_KEYS.has(key)) continue;
      if (!Array.isArray(value) || value.length === 0) continue;
      if (SKILL_SECTION_KEYS.includes(key)) continue;
      if (!SKILL_ARRAY_KEY_RE.test(key)) continue;
      const strings = value
        .map((v) =>
          typeof v === 'string'
            ? v
            : v && typeof v === 'object'
              ? String((v as { name?: string }).name || '')
              : ''
        )
        .filter((s) => s.trim().length > 0);
      if (strings.length > 0) {
        out.skills = strings;
        break;
      }
    }
  }

  return out;
}

export function normalizeImportProfileAliases(profile: Record<string, unknown>): Record<string, unknown> {
  const out = discoverImportSectionArrays({ ...profile });

  const github = readFirstString(out, ['github', 'Github', 'githubUrl'], 300);
  const headline = readFirstString(
    out,
    ['headline', 'professionalHeadline', 'ProfessionalHeadline', 'professionalTitle'],
    120
  );
  const designation = readFirstString(out, ['designation', 'jobTitle', 'currentRole', 'profession'], 120);
  if (github) out.github = github;
  if (headline) out.headline = headline;
  if (designation) out.designation = designation;

  const fullName = readFirstString(out, ['fullName', 'name', 'full_name']);
  if (fullName) {
    out.fullName = fullName;
    out.name = fullName;
    const { firstName, lastName } = splitFullNameForBuilder(fullName);
    if (!out.firstName && firstName) out.firstName = firstName;
    if (!out.lastName && lastName) out.lastName = lastName;
  }

  const portfolio = readFirstString(out, ['portfolio', 'website', 'personalWebsite', 'Portfolio']);
  if (portfolio && !out.portfolio) out.portfolio = portfolio;

  normalizeListSection(out, EXPERIENCE_SECTION_KEYS, normalizeExperienceEntryAliases);
  normalizeListSection(out, EDUCATION_SECTION_KEYS, normalizeEducationEntryAliases);
  normalizeListSection(out, PROJECT_SECTION_KEYS, normalizeProjectEntryAliases);
  normalizeListSection(out, CERT_SECTION_KEYS, normalizeCertificationEntryAliases);

  const hobbies = readFirstArray(out, HOBBY_SECTION_KEYS);
  if (hobbies.length > 0 && (!Array.isArray(out.hobbies) || (out.hobbies as unknown[]).length === 0)) {
    out.hobbies = hobbies;
  }

  const achievements = readFirstArray(out, ACHIEVEMENT_SECTION_KEYS);
  const awards = readFirstArray(out, AWARD_SECTION_KEYS);
  if (achievements.length > 0) {
    out.achievements = achievements;
  } else if (awards.length > 0) {
    out.achievements = awards.map((a) =>
      typeof a === 'string'
        ? a
        : readFirstString(a as Record<string, unknown>, ['name', 'title', 'description'])
    );
  }

  const skills = readFirstArray(out, SKILL_SECTION_KEYS);
  if (skills.length > 0 && (!Array.isArray(out.skills) || (out.skills as unknown[]).length === 0)) {
    out.skills = skills;
  }

  const languages = readFirstArray(out, LANGUAGE_SECTION_KEYS);
  if (languages.length > 0 && (!Array.isArray(out.languages) || (out.languages as unknown[]).length === 0)) {
    out.languages = languages;
  }

  return out;
}

/** When structured experience lacks company, recover from multi-column raw text lines. */
export function backfillExperienceColumnsFromRawText(
  experiences: unknown[],
  rawText: string
): Record<string, unknown>[] {
  if (!Array.isArray(experiences) || !rawText || rawText.length < 40) {
    return (experiences || []).filter(
      (e): e is Record<string, unknown> => !!e && typeof e === 'object'
    );
  }
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return experiences.map((exp) => {
    if (!exp || typeof exp !== 'object') return exp as Record<string, unknown>;
    const row = { ...(exp as Record<string, unknown>) };
    if (sanitizeExperienceCompanyValue(readExperienceCompanySlot(row))) {
      const co = readExperienceCompanySlot(row);
      const title = readExperiencePositionSlot(row);
      if (co && title) {
        const cleaned = stripRedundantCompanyFromPosition(title, co);
        row.position = cleaned;
        row.title = cleaned;
        row.designation = cleaned;
      }
      return row;
    }
    const titleKey = readExperiencePositionSlot(row).toLowerCase();
    for (const line of lines) {
      if (!/\s{2,}|\t/.test(line)) continue;
      const split = splitMultiColumnExperienceHeader({ position: line, title: line });
      const splitTitle = readExperiencePositionSlot(split).toLowerCase();
      const splitCo = readExperienceCompanySlot(split);
      if (!splitCo || !splitTitle) continue;
      if (
        splitTitle === titleKey ||
        titleKey.startsWith(`${splitTitle} `) ||
        splitTitle.startsWith(`${titleKey} `)
      ) {
        return {
          ...row,
          ...split,
          company: splitCo,
          title: readExperiencePositionSlot(split),
          position: readExperiencePositionSlot(split),
          designation: readExperiencePositionSlot(split),
        };
      }
    }
    return row;
  });
}

export interface BuilderMappingSources {
  mergedImport: Record<string, unknown>;
  rawImport?: Record<string, unknown>;
}

export interface BuilderFieldMappingReport {
  matched: string[];
  recovered: string[];
  missing: string[];
  overwritten: string[];
  duplicates: string[];
}

function isNonemptyString(v: unknown): boolean {
  return sanitizeFieldText(v, 4000).length > 0;
}

function recoverScalarField(
  builder: Record<string, unknown>,
  key: string,
  sources: BuilderMappingSources,
  aliases: string[],
  report: BuilderFieldMappingReport
): void {
  if (isNonemptyString(builder[key])) {
    report.matched.push(`identity:${key}`);
    return;
  }
  const chain = [sources.mergedImport, sources.rawImport].filter(Boolean) as Record<string, unknown>[];
  for (const src of chain) {
    const value = readFirstString(src, aliases);
    if (value) {
      builder[key] = value;
      report.recovered.push(`identity:${key}`);
      return;
    }
  }
  report.missing.push(`identity:${key}`);
}

function normalizeLanguageEntryAliases(lang: Record<string, unknown>): Record<string, unknown> {
  const name = readFirstString(lang, ['language', 'Language', 'name', 'Name', 'title', 'Title']);
  const proficiency = readFirstString(lang, [
    'proficiency',
    'Proficiency',
    'level',
    'Level',
    'fluency',
    'Fluency',
  ]);
  const out = { ...lang };
  if (name) {
    out.name = name;
    out.language = name;
  }
  if (proficiency) out.proficiency = proficiency;
  return out;
}

function mergeRecordEntryFromSource(
  row: Record<string, unknown>,
  src: Record<string, unknown>,
  fields: Array<{ key: string; aliases: string[]; maxLen?: number }>
): Record<string, unknown> {
  const next = { ...row };
  for (const field of fields) {
    if (readFirstString(next, [field.key, ...field.aliases], field.maxLen ?? 200)) continue;
    const recovered = readFirstString(src, [field.key, ...field.aliases], field.maxLen ?? 200);
    if (recovered) next[field.key] = recovered;
  }
  return next;
}

function recoverRecordListSection(
  builderRows: Record<string, unknown>[],
  sourceRows: Record<string, unknown>[],
  sectionKey: string,
  normalize: (row: Record<string, unknown>) => Record<string, unknown>,
  fieldSpecs: Array<{ key: string; aliases: string[]; maxLen?: number }>,
  report: BuilderFieldMappingReport
): Record<string, unknown>[] {
  if (sourceRows.length === 0) return builderRows;

  const out = [...builderRows];
  if (out.length < sourceRows.length) {
    report.missing.push(`${sectionKey}:count-loss:${out.length}/${sourceRows.length}`);
  }

  for (let i = 0; i < sourceRows.length; i++) {
    const src = normalize(sourceRows[i] || {});
    if (!out[i] || typeof out[i] !== 'object') {
      out[i] = src;
      report.recovered.push(`${sectionKey}[${i}]:full-entry`);
      continue;
    }
    const merged = mergeRecordEntryFromSource(out[i] as Record<string, unknown>, src, fieldSpecs);
    const changed = fieldSpecs.some(
      (field) =>
        readFirstString(out[i] as Record<string, unknown>, [field.key], field.maxLen ?? 200) !==
        readFirstString(merged, [field.key], field.maxLen ?? 200)
    );
    if (changed) report.recovered.push(`${sectionKey}[${i}]:fields`);
    out[i] = merged;
  }

  return out;
}

function recoverExperienceFields(
  builderExps: Record<string, unknown>[],
  sourceExps: Record<string, unknown>[],
  report: BuilderFieldMappingReport
): Record<string, unknown>[] {
  if (sourceExps.length === 0) return builderExps;

  const out = [...builderExps];
  if (out.length < sourceExps.length) {
    report.duplicates.push(`experience:count-gap:${out.length}/${sourceExps.length}`);
  }

  for (let i = 0; i < sourceExps.length; i++) {
    const src = normalizeExperienceEntryAliases(sourceExps[i] || {});
    if (!out[i] || typeof out[i] !== 'object') {
      const company =
        sanitizeExperienceCompanyValue(
          readExperienceCompanySlot(src) || readFirstString(src, COMPANY_ALIASES, 160)
        );
      out[i] = {
        company,
        title: readExperiencePositionSlot(src),
        designation: readExperiencePositionSlot(src),
        location: readFirstString(src, ['location', 'Location'], 120),
        startDate: readFirstString(src, ['startDate', 'start_date'], 40),
        endDate: readFirstString(src, ['endDate', 'end_date'], 40),
        description: readFirstString(src, ['description', 'Description'], 8000),
        achievements: Array.isArray(src.achievements) ? src.achievements : [],
        current: src.current === true,
      };
      report.recovered.push(`experience[${i}]:full-entry`);
      continue;
    }
    const row = { ...(out[i] as Record<string, unknown>) };
    const companyExisting = sanitizeExperienceCompanyValue(row.company ?? row.Company);
    if (!companyExisting) {
      const recovered =
        readExperienceCompanySlot(src) || readFirstString(src, COMPANY_ALIASES, 160);
      if (recovered && !isExperienceDateOrDurationToken(recovered)) {
        row.company = recovered;
        row.Company = recovered;
        report.recovered.push(`experience[${i}]:company`);
      } else {
        report.missing.push(`experience[${i}]:company`);
      }
    }
    const titleExisting = sanitizeFieldText(
      row.title ?? row.position ?? row.designation,
      120
    );
    if (!titleExisting) {
      const recovered = readExperiencePositionSlot(src);
      if (recovered) {
        row.title = recovered;
        row.designation = recovered;
        row.position = recovered;
        report.recovered.push(`experience[${i}]:designation`);
      } else {
        report.missing.push(`experience[${i}]:designation`);
      }
    }
    if (!sanitizeFieldText(row.location, 120)) {
      const loc = readFirstString(src, ['location', 'Location'], 120);
      if (loc) {
        row.location = loc;
        report.recovered.push(`experience[${i}]:location`);
      }
    }
    if (!sanitizeFieldText(row.description, 8000)) {
      const desc = readFirstString(
        src,
        ['description', 'Description', 'summary', 'responsibilities'],
        8000
      );
      if (desc) {
        row.description = desc;
        report.recovered.push(`experience[${i}]:description`);
      }
    }
    out[i] = row;
  }
  return out;
}

/** Fill empty Builder sections from import profile without overwriting populated values. */
export function recoverBuilderFormSections(
  builder: Record<string, unknown>,
  sources: BuilderMappingSources
): { builder: Record<string, unknown>; report: BuilderFieldMappingReport } {
  const report: BuilderFieldMappingReport = {
    matched: [],
    recovered: [],
    missing: [],
    overwritten: [],
    duplicates: [],
  };
  const out = { ...builder };

  recoverScalarField(out, 'fullName', sources, ['fullName', 'name'], report);
  recoverScalarField(out, 'email', sources, ['email', 'Email'], report);
  recoverScalarField(out, 'phone', sources, ['phone', 'Phone', 'mobile'], report);
  recoverScalarField(out, 'location', sources, ['location', 'address', 'Address'], report);
  recoverScalarField(out, 'linkedin', sources, ['linkedin', 'linkedinUrl'], report);
  recoverScalarField(out, 'github', sources, ['github', 'Github'], report);
  recoverScalarField(out, 'portfolio', sources, ['portfolio', 'website', 'personalWebsite'], report);
  recoverScalarField(
    out,
    'summary',
    sources,
    [
      'summary',
      'bio',
      'objective',
      'professionalSummary',
      'professionalProfile',
      'Professional Profile',
      'careerObjective',
      'executiveSummary',
      'profile',
      'aboutMe',
    ],
    report
  );

  if (!isNonemptyString(out.firstName) && isNonemptyString(out.fullName)) {
    const split = splitFullNameForBuilder(String(out.fullName));
    if (split.firstName) {
      out.firstName = split.firstName;
      out.lastName = split.lastName;
      report.recovered.push('identity:firstName-from-fullName');
    }
  }

  const sourceExps = readFirstArray(sources.mergedImport, EXPERIENCE_SECTION_KEYS)
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map(normalizeExperienceEntryAliases);

  const builderExps = Array.isArray(out.experience)
    ? (out.experience as Record<string, unknown>[])
    : [];
  out.experience = recoverExperienceFields(builderExps, sourceExps, report);

  const sourceEducation = readFirstArray(sources.mergedImport, EDUCATION_SECTION_KEYS)
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map(normalizeEducationEntryAliases);
  const educationRecovered = recoverRecordListSection(
    Array.isArray(out.education) ? (out.education as Record<string, unknown>[]) : [],
    sourceEducation,
    'education',
    normalizeEducationEntryAliases,
    [
      { key: 'institution', aliases: ['school', 'college', 'university', 'academy', 'Institution'] },
      { key: 'degree', aliases: ['Degree', 'qualification', 'Qualification'] },
      { key: 'field', aliases: ['Field', 'major', 'Major', 'specialization'] },
      { key: 'startDate', aliases: ['start_date', 'StartDate'], maxLen: 40 },
      { key: 'endDate', aliases: ['end_date', 'EndDate', 'year', 'graduationDate'], maxLen: 40 },
      { key: 'gpa', aliases: ['cgpa', 'CGPA', 'percentage', 'Percentage', 'grade'], maxLen: 20 },
    ],
    report
  );
  out.education = educationRecovered;
  if (educationRecovered.length > 0) {
    out.Education = educationRecovered;
    report.matched.push(`education:${educationRecovered.length}`);
  }

  const sourceProjects = readFirstArray(sources.mergedImport, PROJECT_SECTION_KEYS)
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map(normalizeProjectEntryAliases);
  const projectsRecovered = recoverRecordListSection(
    Array.isArray(out.projects) ? (out.projects as Record<string, unknown>[]) : [],
    sourceProjects,
    'projects',
    normalizeProjectEntryAliases,
    [
      { key: 'name', aliases: ['title', 'projectName', 'Name', 'Title'] },
      { key: 'description', aliases: ['Description', 'summary', 'Summary', 'details'], maxLen: 8000 },
      { key: 'role', aliases: ['Role', 'position', 'myRole'] },
      { key: 'url', aliases: ['link', 'liveUrl', 'website'], maxLen: 300 },
    ],
    report
  );
  out.projects = projectsRecovered;
  if (projectsRecovered.length > 0) {
    out.Projects = projectsRecovered;
    report.matched.push(`projects:${projectsRecovered.length}`);
  }

  const sourceCerts = readFirstArray(sources.mergedImport, CERT_SECTION_KEYS)
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map(normalizeCertificationEntryAliases);
  const certificationsRecovered = recoverRecordListSection(
    Array.isArray(out.certifications) ? (out.certifications as Record<string, unknown>[]) : [],
    sourceCerts,
    'certifications',
    normalizeCertificationEntryAliases,
    [
      { key: 'name', aliases: ['title', 'certification', 'certificateName', 'Name'] },
      { key: 'issuer', aliases: ['organization', 'issuingOrganization', 'Issuer', 'issuedBy'] },
      { key: 'date', aliases: ['issueDate', 'issued_date', 'issuedDate', 'year'], maxLen: 40 },
      { key: 'url', aliases: ['link', 'credentialUrl'], maxLen: 300 },
    ],
    report
  );
  out.certifications = certificationsRecovered;
  if (certificationsRecovered.length > 0) {
    out.Certifications = certificationsRecovered;
    report.matched.push(`certifications:${certificationsRecovered.length}`);
  }

  const sourceLanguages = readFirstArray(sources.mergedImport, LANGUAGE_SECTION_KEYS)
    .filter((l): l is Record<string, unknown> => !!l && typeof l === 'object')
    .map(normalizeLanguageEntryAliases);
  const languagesRecovered = recoverRecordListSection(
    Array.isArray(out.languages) ? (out.languages as Record<string, unknown>[]) : [],
    sourceLanguages,
    'languages',
    normalizeLanguageEntryAliases,
    [
      { key: 'language', aliases: ['name', 'Name', 'title'] },
      { key: 'proficiency', aliases: ['level', 'Level', 'fluency', 'Fluency'] },
    ],
    report
  );
  out.languages = languagesRecovered;
  if (languagesRecovered.length > 0) {
    out.Languages = languagesRecovered;
    report.matched.push(`languages:${languagesRecovered.length}`);
  }

  const stringListPairs: Array<[string, string[]]> = [
    ['achievements', ACHIEVEMENT_SECTION_KEYS],
    ['hobbies', HOBBY_SECTION_KEYS],
    ['skills', SKILL_SECTION_KEYS],
  ];

  for (const [builderKey, importKeys] of stringListPairs) {
    const built = Array.isArray(out[builderKey]) ? (out[builderKey] as unknown[]) : [];
    const src = readFirstArray(sources.mergedImport, importKeys);
    if (built.length > 0) report.matched.push(`${builderKey}:${built.length}`);
    if (src.length > built.length) {
      report.missing.push(`${builderKey}:count-loss:${built.length}/${src.length}`);
      const merged = [...built];
      const seen = new Set(built.map((x) => String(x).toLowerCase()));
      for (const item of src) {
        const v =
          typeof item === 'string'
            ? item
            : readFirstString(item as Record<string, unknown>, ['name', 'title', 'description']);
        if (v && !seen.has(String(v).toLowerCase())) {
          merged.push(v);
          seen.add(String(v).toLowerCase());
          report.recovered.push(`${builderKey}:appended`);
        }
      }
      out[builderKey] = merged;
    } else if (built.length === 0 && src.length > 0) {
      const restored = src
        .map((item) =>
          typeof item === 'string'
            ? item
            : readFirstString(item as Record<string, unknown>, ['name', 'title', 'description', 'language'])
        )
        .filter(Boolean);
      if (restored.length > 0) {
        out[builderKey] = restored;
        report.recovered.push(`${builderKey}:restored-from-import:${restored.length}`);
      } else {
        report.missing.push(`${builderKey}:empty-with-source:${src.length}`);
      }
    }
  }

  return { builder: out, report };
}

export function logBuilderFieldMappingReport(report: BuilderFieldMappingReport): void {
  if (
    report.missing.length === 0 &&
    report.overwritten.length === 0 &&
    report.recovered.length === 0 &&
    report.duplicates.length === 0
  ) {
    return;
  }
  console.log('[builder-field-mapper] mapping report', report);
}
