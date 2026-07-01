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
  expandCompoundLanguages,
} from '@/lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '@/lib/resume-parser/extraction-repair';
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
  isValidatedContactName,
  collectExperienceBodyFields,
  unionExperienceBodyFields,
  mergeOrphanEducationEntries,
  reconcileExperienceHeaderFields,
  finalizeExperienceListForBuilder,
  finalizeEducationListForBuilder,
  dedupeExperienceBodyLines,
  dedupeAdjacentExperienceEntries,
} from '@/lib/resume-parser/import-sanitize';
import { filterMeaningfulExperiences } from './section-visibility';
import {
  classifyResumeTextFragment,
  emptyAdditionalResumeData,
  isFirmOrLocationNamePhrase,
  nameOverlapsLocation,
  shouldKeepAsGlobalAchievement,
  stashUnclassifiedFragment,
  type AdditionalResumeData,
} from '@/lib/resume-parser/field-classification';
import { inferProfessionFromResume } from '@/lib/resume-builder/infer-profession';
import {
  recoverFromRawText,
  mergeRecovery,
  extractResumeFromText,
  extractAdditionalResumeDataFromText,
  truncateSummaryAtSectionBoundary,
} from '@/lib/resume-parser/text-recovery';
import { applyRecoveredWordingToProfile } from '@/lib/resume-parser/prefer-recovered-wording';

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Strip section bleed from summary when structured arrays are populated (builder mapping only). */
function trimSummaryForStructuredSections(
  summary: string,
  sections: {
    experience: unknown[];
    education: unknown[];
    skills: unknown[];
  }
): string {
  const text = cleanMultiline(summary || '');
  if (!text) return '';

  const hasStructured =
    sections.experience.length > 0 ||
    sections.education.length > 0 ||
    sections.skills.length > 0;
  if (!hasStructured) return text.slice(0, 4000);

  return truncateSummaryAtSectionBoundary(text).slice(0, 4000);
}

/** When API nests builderFormData, parent profile arrays may still hold parser output. */
function mergeBuilderFormWithParent(
  parent: Record<string, unknown>,
  builderFormData: Record<string, any>
): Record<string, any> {
  const out: Record<string, any> = { ...builderFormData };

  const pick = (canonical: string, aliases: string[]): unknown[] => {
    const fromBuilder = out[canonical];
    if (Array.isArray(fromBuilder) && fromBuilder.length > 0) {
      if (canonical === 'experience') {
        const meaningful = filterMeaningfulExperiences(
          fromBuilder as Array<Record<string, unknown>>
        );
        if (meaningful.length > 0) return fromBuilder;
      } else {
        return fromBuilder;
      }
    }
    return firstNonEmptyArray(parent, [canonical, ...aliases]);
  };

  out.experience = pick('experience', ['Work Experience', 'Experience', 'workExperience']);
  out.education = pick('education', ['Education']);
  out.skills = firstNonEmptyArray({ ...parent, ...out }, ['skills', 'Skills', 'technicalSkills']);
  out.projects = pick('projects', ['Projects', 'Projects(optional)', 'Academic Projects']);
  out.certifications = pick('certifications', ['Certifications']);
  out.languages = pick('languages', ['Languages']);
  out.achievements = pick('achievements', ['Achievements', 'Key Achievements']);
  out.hobbies = pick('hobbies', ['Hobbies', 'Hobbies & Interests']);

  out['Work Experience'] = out.experience;
  out.Experience = out.experience;
  out.Education = out.education;
  out.Skills = out.skills;
  out.Projects = out.projects;
  out.Certifications = out.certifications;
  out.Achievements = out.achievements;
  out.Languages = out.languages;
  out.Hobbies = out.hobbies;
  out['Hobbies & Interests'] = out.hobbies;

  return out;
}

function applySummaryHygieneToBuilderForm(formData: Record<string, any>): Record<string, any> {
  const experience = Array.isArray(formData.experience)
    ? formData.experience
    : Array.isArray(formData['Work Experience'])
      ? formData['Work Experience']
      : Array.isArray(formData.Experience)
        ? formData.Experience
        : [];
  const education = Array.isArray(formData.education)
    ? formData.education
    : Array.isArray(formData.Education)
      ? formData.Education
      : [];
  const skills = Array.isArray(formData.skills)
    ? formData.skills
    : Array.isArray(formData.Skills)
      ? formData.Skills
      : [];

  const trimmed = trimSummaryForStructuredSections(String(formData.summary || formData.bio || ''), {
    experience,
    education,
    skills,
  });

  return {
    ...formData,
    summary: trimmed,
    bio: trimmed,
    objective: trimmed,
  };
}

/**
 * Resolve API/upload payload into builder form state.
 * When the API nests `builderFormData` with empty section arrays, parent profile
 * arrays (e.g. `experience` from ultimate-upload) are preserved via merge.
 */
export function coalesceBuilderImportPayload(
  parsed: Record<string, unknown>
): Record<string, any> {
  const nested = parsed.builderFormData;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const { builderFormData: _nested, ...parent } = parsed;
    const merged = mergeBuilderFormWithParent(parent, nested as Record<string, any>);
    if (Array.isArray(merged.experience) && merged.experience.length > 0) {
      merged.experience = finalizeExperienceListForBuilder(
        merged.experience as Record<string, unknown>[]
      );
    }
    return applySummaryHygieneToBuilderForm({
      ...merged,
      _imported: merged._imported ?? parent._imported ?? true,
      rawText: merged.rawText ?? parent.rawText ?? parsed.rawText,
    });
  }

  // Upload / editor already coalesced this payload — do not re-run full sanitize (drops experience).
  if (parsed._imported === true) {
    const out = { ...(parsed as Record<string, any>) };
    delete out.builderFormData;
    if (Array.isArray(out.experience) && out.experience.length > 0) {
      out.experience = finalizeExperienceListForBuilder(
        out.experience as Record<string, unknown>[]
      );
    }
    return applySummaryHygieneToBuilderForm(out);
  }

  return transformImportDataToBuilder(parsed);
}

function firstNonEmptyArray(data: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value) && value.length > 0) {
      return value;
    }
  }
  return [];
}

/** Section headers / degrees / firm lines that must not land in achievements. */
const ACHIEVEMENT_SECTION_HEADER_RE =
  /^(?:\d+[\.\):\-]\s*)?(?:education|experience|employment|work history|skills|certifications|projects|languages|achievements|professional profile|contact|summary|objective|messenger)\b/i;
const ACHIEVEMENT_DEGREE_LINE_RE =
  /\b(b\.?\s*a\.?|b\.?\s*com|b\.?\s*tech|m\.?\s*a\.?|m\.?\s*com|mba|mca|company secretary|\bcs\b|llb|llm|ph\.?\s*d|bachelor|master|doctorate|intermediate|graduation)\b/i;
const ACHIEVEMENT_FIRM_LINE_RE =
  /\b(m\/s\.?|pcs\s+firm|associates|chartered|consultancy|pvt\.?\s*ltd|limited)\b/i;

function isMisplacedAchievementLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 280) return true;
  if (ACHIEVEMENT_SECTION_HEADER_RE.test(t)) return true;
  if (/^\d+[\.\):\-]\s+\S/.test(t) && t.length < 100) return true;
  if (ACHIEVEMENT_DEGREE_LINE_RE.test(t) && !/\b(achieved|award|won|recognized|completed project)\b/i.test(t)) {
    return true;
  }
  if (ACHIEVEMENT_FIRM_LINE_RE.test(t) && t.length < 160) return true;
  return false;
}

function spilloverEducationFromLine(line: string): Record<string, unknown> | null {
  const t = line.trim();
  if (!t || !ACHIEVEMENT_DEGREE_LINE_RE.test(t)) return null;
  return { degree: t, school: '', institution: '', field: '', year: '' };
}

function spilloverExperienceFromLine(line: string): Record<string, unknown> | null {
  const t = line.trim();
  if (!t || !ACHIEVEMENT_FIRM_LINE_RE.test(t)) return null;
  return { company: t, title: '', position: '' };
}

function spilloverSkillFromLine(line: string): string | null {
  const t = line.trim();
  if (!t || t.length > 60 || t.length < 2) return null;
  if (isMisplacedAchievementLine(t)) return null;
  if (/^[A-Z0-9][A-Za-z0-9/.\-\s]{1,58}$/.test(t) && !/\s{3,}/.test(t)) return t;
  return null;
}

function partitionSpilloverLines(lines: string[]): {
  achievements: string[];
  education: Array<Record<string, unknown>>;
  experience: Array<Record<string, unknown>>;
  skills: string[];
} {
  const achievements: string[] = [];
  const education: Array<Record<string, unknown>> = [];
  const experience: Array<Record<string, unknown>> = [];
  const skills: string[] = [];
  const seen = new Set<string>();

  for (const raw of lines) {
    const value = sanitizeFieldText(raw, 500);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    if (isMisplacedAchievementLine(value)) {
      seen.add(key);
      const edu = spilloverEducationFromLine(value);
      if (edu) {
        education.push(edu);
        continue;
      }
      const exp = spilloverExperienceFromLine(value);
      if (exp) {
        experience.push(exp);
        continue;
      }
      const skill = spilloverSkillFromLine(value);
      if (skill) {
        skills.push(skill);
      }
      continue;
    }

    seen.add(key);
    achievements.push(value);
  }

  return { achievements, education, experience, skills };
}

function enrichIdentityFromText(
  data: Record<string, unknown>,
  textParsed?: ReturnType<typeof extractResumeFromText>,
  recovered?: Partial<ReturnType<typeof recoverFromRawText>>
): Record<string, unknown> {
  const personal = (data.personalInformation || {}) as Record<string, unknown>;
  return {
    ...data,
    fullName: String(data.fullName || data.name || textParsed?.fullName || personal.fullName || '').trim(),
    name: String(data.name || data.fullName || textParsed?.fullName || personal.fullName || '').trim(),
    email: String(data.email || personal.email || textParsed?.email || recovered?.email || '').trim(),
    phone: String(data.phone || personal.phone || textParsed?.phone || recovered?.phone || '').trim(),
    location: String(data.location || data.address || textParsed?.location || '').trim(),
    linkedin: String(
      data.linkedin || data.linkedinUrl || textParsed?.linkedin || recovered?.linkedin || ''
    ).trim(),
    portfolio: String(
      data.portfolio || data.website || data.github || textParsed?.portfolio || recovered?.portfolio || ''
    ).trim(),
  };
}

function relocateMisplacedEducationEntries(data: Record<string, unknown>): Record<string, unknown> {
  const education = firstNonEmptyArray(data, ['education', 'Education']);
  const experience = firstNonEmptyArray(data, [
    'experience',
    'workExperience',
    'Work Experience',
    'Experience',
  ]);
  const keptEdu: unknown[] = [];
  const extraExp: Array<Record<string, unknown>> = [];

  for (const item of education) {
    if (!item || typeof item !== 'object') {
      keptEdu.push(item);
      continue;
    }
    const rec = item as Record<string, unknown>;
    const inst = String(rec.institution || rec.school || '');
    const degree = String(rec.degree || '');
    if (ACHIEVEMENT_FIRM_LINE_RE.test(inst) && !ACHIEVEMENT_DEGREE_LINE_RE.test(degree)) {
      extraExp.push({ company: inst, title: degree || '', position: degree || '' });
      continue;
    }
    keptEdu.push(item);
  }

  if (!extraExp.length) return data;

  return {
    ...data,
    education: keptEdu,
    experience: mergeUniqueRecords(
      experience,
      extraExp,
      (e) => `${String(e.company || '').trim()}|${String(e.position || e.title || '').trim()}`.toLowerCase()
    ),
  };
}

function applySpilloverToImport(
  data: Record<string, unknown>,
  spillover: ReturnType<typeof partitionSpilloverLines>
): Record<string, unknown> {
  return {
    ...data,
    education: mergeUniqueRecords(
      firstNonEmptyArray(data, ['education', 'Education']),
      spillover.education,
      (e) =>
        `${String(e.institution || e.school || '').trim()}|${String(e.degree || '').trim()}`.toLowerCase()
    ),
    experience: mergeUniqueRecords(
      firstNonEmptyArray(data, ['experience', 'workExperience', 'Work Experience', 'Experience']),
      spillover.experience,
      (e) =>
        `${String(e.company || '').trim()}|${String(e.position || e.title || '').trim()}`.toLowerCase()
    ),
    skills: mergeUniqueStrings(
      firstNonEmptyArray(data, ['skills', 'Skills', 'technicalSkills']) as string[],
      spillover.skills
    ),
  };
}

/** True when any major structured section is missing (parser dumped prose into summary). */
function isSparseSectionImport(data: Record<string, unknown>): boolean {
  const experience = firstNonEmptyArray(data, [
    'experience',
    'workExperience',
    'Work Experience',
    'Experience',
  ]);
  const education = firstNonEmptyArray(data, ['education', 'Education']);
  const skills = firstNonEmptyArray(data, ['skills', 'Skills', 'technicalSkills']);
  return experience.length === 0 || education.length === 0 || skills.length === 0;
}

/**
 * Prefer full PDF/text extraction; when AI leaves only a bloated summary, parse that instead.
 */
function resolveEffectiveRawText(data: Record<string, unknown>): string {
  const raw = typeof data.rawText === 'string' ? data.rawText.trim() : '';
  if (raw.length >= 80) return raw;

  const summary = String(data.summary || data.bio || data.objective || '').trim();
  if (summary.length < 120) return raw;

  const looksLikeFullResume =
    /(experience|employment|work history|education|academic|skills|technical skills|projects|certifications)/i.test(
      summary
    );
  if (looksLikeFullResume) return summary;

  return raw;
}

/** Backfill sparse parser arrays from rawText or summary bleed (builder mapping only). */
function applyTextRecoveryWhenSparse(data: Record<string, unknown>): Record<string, unknown> {
  if (!isSparseSectionImport(data)) return data;

  const effectiveRaw = resolveEffectiveRawText(data);
  if (effectiveRaw.length < 80) return data;

  return supplementImportFromRawText({ ...data, rawText: effectiveRaw });
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
  const locationHint = String(importedData.location || importedData.address || textParsed?.location || '');

  const apiName = sanitizePersonName(importedData.fullName || importedData.name || '', 120);
  let fullName = apiName;

  if (!isValidatedContactName(apiName, locationHint)) {
    fullName = pickRicherFullName(
      apiName,
      sanitizePersonName(textParsed?.fullName || '', 120),
      email
    );
    fullName = pickRicherFullName(
      fullName,
      sanitizePersonName(personal.fullName || '', 120),
      email
    );
  }

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
    fullName: fullName || apiName || '',
    name: fullName || apiName || importedData.name || '',
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
      (textParsed.achievements || []).filter(
        (a): a is string => typeof a === 'string' && !isMisplacedAchievementLine(a)
      )
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

  if (importedData.builderFormData && typeof importedData.builderFormData === 'object') {
    const { builderFormData, ...parent } = importedData;
    const merged = mergeBuilderFormWithParent(
      parent as Record<string, unknown>,
      builderFormData as Record<string, any>
    );
    // Run full transform so text recovery + sanitize pipelines apply to merged data.
    return transformImportDataToBuilder({ ...parent, ...merged, builderFormData: undefined });
  }

  const effectiveRawText = resolveEffectiveRawText(importedData as Record<string, unknown>);

  // 1. Identity recovery + section backfill from rawText when parser arrays are sparse
  const recovered = recoverFromRawText(effectiveRawText || importedData.rawText);
  const mergedBase = mergeRecovery(importedData, recovered) as Record<string, unknown>;
  const textParsed =
    effectiveRawText.length >= 80 ? extractResumeFromText(effectiveRawText) : undefined;
  let mergedImport = isSparseSectionImport(mergedBase)
    ? supplementImportFromRawText(
        { ...mergedBase, rawText: effectiveRawText || mergedBase.rawText },
        textParsed
      )
    : enrichIdentityFromText(mergedBase, textParsed, recovered);
  mergedImport = applyTextRecoveryWhenSparse(mergedImport);
  mergedImport = relocateMisplacedEducationEntries(mergedImport);
  if (textParsed && effectiveRawText.length >= 80) {
    mergedImport = applyRecoveredWordingToProfile(mergedImport, textParsed);
  }
  const { data: repairedImport } = validateAndRepairResumeExtraction(mergedImport);
  mergedImport = repairedImport;
  if (Array.isArray(mergedImport.experience)) {
    mergedImport.experience = finalizeExperienceListForBuilder(
      mergedImport.experience as Record<string, unknown>[]
    );
  }
  if (Array.isArray(mergedImport.education)) {
    mergedImport.education = finalizeEducationListForBuilder(
      mergedImport.education as Record<string, unknown>[]
    );
  }

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

  const summaryRaw = mergeSummarySections(mergedImport, textParsed, recovered.summary);
  const summary = summaryRaw || cleanMultiline(mergedImport.summary || mergedImport.bio || mergedImport.objective || recovered.summary || '').slice(0, 4000);

  // Names — classification layer before any contact field mapping
  const locationHint = String(
    mergedImport.location || mergedImport.address || textParsed?.location || ''
  );
  const { firstName, lastName, displayName, additionalResumeData } = resolveClassifiedName(
    mergedImport,
    email,
    textParsed?.fullName || '',
    locationHint
  );
  const textAdditional =
    effectiveRawText.length >= 80
      ? extractAdditionalResumeDataFromText(effectiveRawText)
      : emptyAdditionalResumeData();
  const mergedAdditional = mergeAdditionalResumeData(additionalResumeData, textAdditional);

  const achievementCandidateLines = [
    ...firstNonEmptyArray(mergedImport, ['achievements', 'Achievements']).map((a) =>
      typeof a === 'string' ? a : String((a as { title?: string }).title || '')
    ),
    ...(mergedAdditional.achievements || []),
    ...(mergedAdditional.memberships || []),
    ...(mergedAdditional.publications || []),
    ...(mergedAdditional.volunteerWork || []),
    ...mergedAdditional.unclassifiedFragments
      .filter((f) => f.kind === 'ACHIEVEMENT')
      .map((f) => f.value),
    ...(textParsed?.achievements || []),
  ];
  const partitionedAchievements = partitionSpilloverLines(achievementCandidateLines);
  mergedImport = applySpilloverToImport(mergedImport, partitionedAchievements);
  const { data: postSpillover } = validateAndRepairResumeExtraction(mergedImport);
  mergedImport = postSpillover;

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
    achievements: transformAchievementsArray([
      ...partitionedAchievements.achievements,
      ...(Array.isArray(mergedImport.achievements) ? mergedImport.achievements : []),
    ]),

    // ===== HobbiesStep =====
    hobbies: cleanHobbies(
      firstNonEmptyArray(mergedImport, ['hobbies', 'Hobbies', 'Hobbies & Interests'])
    ),

    additionalResumeData: mergedAdditional,

    rawText: effectiveRawText || mergedImport.rawText || importedData.rawText,

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

  const trimmedSummary = trimSummaryForStructuredSections(transformed.summary, {
    experience: transformed.experience,
    education: transformed.education,
    skills: transformed.skills,
  });
  transformed.summary = trimmedSummary;
  transformed.bio = trimmedSummary;
  transformed.objective = trimmedSummary;

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
  headerNameFromText = '',
  locationHint = ''
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
  const hasUsableName = !!(
    splitCombined &&
    isPlausiblePersonName(splitCombined) &&
    !isFirmOrLocationNamePhrase(splitCombined, locationHint) &&
    !nameOverlapsLocation(splitCombined, locationHint)
  );

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
    .map((exp) => reconcileExperienceHeaderFields(exp))
    .map((exp) => {
      const position = String(exp.position || exp.title || '');
      const company = String(exp.company || '');
      const location = String(exp.location || exp.Location || '');

      const startMonth = toMonthInput(exp.startDate);
      const endRaw = exp.endDate || '';
      const isCurrent =
        exp.current === true ||
        !endRaw ||
        /^(present|current|now|ongoing)$/i.test(String(endRaw));
      const endMonth = isCurrent ? '' : toMonthInput(endRaw);

      const body = collectExperienceBodyFields(exp);
      const united = unionExperienceBodyFields(
        { description: body.description, achievements: [] },
        { description: '', achievements: body.achievements }
      );
      let rawDesc = united.description;
      const parserBullets: string[] = united.achievements.map((s) => cleanString(s)).filter(Boolean);
      if (!rawDesc && parserBullets.length) {
        rawDesc = parserBullets.join('\n');
      }
      const descBullets = splitBullets(rawDesc);
      const bullets = dedupeStrings([...parserBullets, ...descBullets]);
      const dedupedBody = dedupeExperienceBodyLines(cleanMultiline(rawDesc), bullets);
      const description = dedupedBody.description;
      const finalBullets = dedupedBody.achievements;

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
        achievements: finalBullets,
        bullets: finalBullets,
        // Template aliases (capitalized)
        Position: position,
        Company: company,
        Location: location,
        Description: description,
        Duration: duration,
      };
    });

  // Dedupe by company|title|startDate|endDate, and identical rows when dates are missing.
  const seen = new Set<string>();
  const seenHeaderBody = new Set<string>();
  const unique = mapped.filter((e) => {
    const company = String(e.company || '').trim();
    const title = String(e.title || '').trim();
    const start = String(e.startDate || '').trim();
    const end = String(e.endDate || '').trim();
    const bodyKey = String(e.description || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .slice(0, 120);
    const headerBodyKey = `${company}|${title}|${bodyKey}`.toLowerCase();

    if (bodyKey && seenHeaderBody.has(headerBodyKey)) return false;

    if (!start && !end) {
      if (bodyKey) seenHeaderBody.add(headerBodyKey);
      return true;
    }

    const key = `${company}|${title}|${start || '?'}|${end || '?'}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    if (bodyKey) seenHeaderBody.add(headerBodyKey);
    return true;
  });

  const deduped = dedupeAdjacentExperienceEntries(
    unique.map((e) => ({
      company: e.company,
      position: e.title,
      title: e.title,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.description,
      achievements: e.achievements,
    }))
  ).map((exp) => ({
    title: String(exp.position || exp.title || ''),
    company: String(exp.company || ''),
    location: String(exp.location || ''),
    startDate: String(exp.startDate || ''),
    endDate: String(exp.endDate || ''),
    description: String(exp.description || ''),
    current: exp.current === true,
    achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
    bullets: Array.isArray(exp.achievements) ? exp.achievements : [],
    Position: String(exp.position || exp.title || ''),
    Company: String(exp.company || ''),
    Location: String(exp.location || ''),
    Description: String(exp.description || ''),
    Duration: (() => {
      const isCurrent =
        exp.current === true ||
        !exp.endDate ||
        /^(present|current|now|ongoing)$/i.test(String(exp.endDate || ''));
      const startMonth = String(exp.startDate || '');
      const endMonth = isCurrent ? '' : String(exp.endDate || '');
      return isCurrent
        ? startMonth
          ? `${startMonth} - Present`
          : 'Present'
        : computeDuration(startMonth, endMonth);
    })(),
  }));

  // Most recent first (by startDate desc, then current first)
  const sorted = deduped.sort(compareByRecent);

  return sorted;
}

function transformEducationArray(education: unknown): any[] {
  if (!Array.isArray(education)) return [];

  const merged = mergeOrphanEducationEntries(
    education.filter((e) => e != null) as Record<string, unknown>[]
  );

  const mapped = merged
    .map((edu) => sanitizeEducationEntry((edu ?? {}) as Record<string, unknown>))
    .filter((edu): edu is Record<string, unknown> => edu != null)
    .map((edu) => {
      const institution = String(edu.institution || '');
      const degree = String(edu.degree || '');
      const field = String(edu.field || '');
      const gpa = String(edu.gpa || '');

      // Year MUST be a bare 4-digit string — EducationStep uses <input type="number">
      const year = extractYear(edu.year || edu.Year || edu.endDate || edu.end_date || edu.startDate);
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
  const expanded = expandCompoundLanguages(languages);
  const out: Array<{ name: string; language: string; proficiency: string }> = [];
  const seen = new Set<string>();
  for (const l of expanded) {
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
function mergeSummarySections(
  mergedImport: Record<string, unknown>,
  textParsed?: ReturnType<typeof extractResumeFromText>,
  recoveredSummary?: string
): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  const add = (raw: unknown) => {
    const t = cleanMultiline(String(raw || '')).trim();
    if (!t || t.length < 12) return;
    const key = t.toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(t);
  };

  add(mergedImport.summary);
  add(mergedImport.professionalSummary);
  add(mergedImport.objective);
  add(mergedImport.bio);
  add(textParsed?.summary);
  add(recoveredSummary);

  return parts.join('\n\n').slice(0, 4000);
}

function transformAchievementsArray(achievements: unknown): string[] {
  if (!Array.isArray(achievements)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of achievements) {
    const value = sanitizeAchievementEntry(a);
    if (!value || isMisplacedAchievementLine(value)) continue;
    if (!shouldKeepAsGlobalAchievement(value)) continue;
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
