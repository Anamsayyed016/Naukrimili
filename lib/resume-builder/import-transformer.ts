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
  normalizeSkillsList,
  normalizeCustomParserSkillsList,
  scoreSkillConfidence,
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
  finalizeExperienceListForCustomParserImport,
  finalizeEducationListForBuilder,
  finalizeEducationListForCustomParserImport,
  recoverStructuredExperienceFromRawText,
  recoverExperienceBodiesFromRawText,
  repairStuckContactNameParts,
  dedupeExperienceBodyLines,
  dedupeAdjacentExperienceEntries,
  stripRedundantExperienceDateBodyLines,
  looksLikeCompanyNameLine,
  looksLikeJobTitleLine,
  countPlausibleExperienceCompanies,
  countPlausibleProjects,
  isPlausibleExperienceCompany,
  sanitizeExperienceCompanyValue,
  isCorporateStructurePhrase,
  isMisclassifiedExperienceProject,
  isAcceptedEmailDerivedName,
  sanitizeImportSummary,
  sanitizeImportJobTitle,
  recoverLocationFromImportText,
  recoverSkillsFromTechnicalSkillsSection,
  skillsLookLikeAddressContamination,
  normalizePdfLigatureText,
  enrichPartialNameFromEmail,
  isGarbageEducationDegree,
  isSpacedLetterFragment,
  isResumeCompetencySectionEntry,
  isResumeSectionHeadingLine,
} from '@/lib/resume-parser/import-sanitize';
import { extractNameWithConfidence } from '@/lib/resume-parser/text-recovery';
import { filterMeaningfulExperiences, hasMeaningfulText } from './section-visibility';
import {
  classifyResumeTextFragment,
  emptyAdditionalResumeData,
  isFirmOrLocationNamePhrase,
  isLikelyCompanyNameFragment,
  isLikelyEducationLine,
  isExperienceResponsibility,
  nameOverlapsLocation,
  shouldKeepAsGlobalAchievement,
  stashUnclassifiedFragment,
  type AdditionalResumeData,
} from '@/lib/resume-parser/field-classification';
import { inferProfessionFromResume } from '@/lib/resume-builder/infer-profession';
import {
  isImportFieldTraceEnabled,
  traceImportStageTransform,
} from '@/lib/resume-parser/import-field-trace';
import {
  recoverFromRawText,
  mergeRecovery,
  extractResumeFromText,
  extractAdditionalResumeDataFromText,
  truncateSummaryAtSectionBoundary,
} from '@/lib/resume-parser/text-recovery';
import { applyRecoveredWordingToProfile, overlaySparseSectionsFromTextRecovery } from '@/lib/resume-parser/prefer-recovered-wording';
import { isCustomParserImport } from '@/lib/resume-parser/custom-parser-import';
import {
  ACHIEVEMENT_SECTION_KEYS,
  CERT_SECTION_KEYS,
  COMPANY_ALIASES,
  DESIGNATION_ALIASES,
  EDUCATION_SECTION_KEYS,
  EXPERIENCE_SECTION_KEYS,
  HOBBY_SECTION_KEYS,
  LANGUAGE_SECTION_KEYS,
  PROJECT_SECTION_KEYS,
  SKILL_SECTION_KEYS,
  logBuilderFieldMappingReport,
  normalizeImportProfileAliases,
  readFirstArray,
  recoverBuilderFormSections,
  backfillExperienceColumnsFromRawText,
} from '@/lib/resume-parser/builder-field-mapper';
import { runCanonicalBuilderMapping } from '@/lib/resume-builder/canonical-mapping';
import { DYNAMIC_SECTION_REGISTRY } from '@/lib/resume-builder/dynamic-section-registry';
import { pruneAndMergeDynamicSections } from '@/lib/resume-builder/dynamic-section-visibility';

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/** Strip section bleed from summary only when another section heading appears inside the text. */
function summaryContainsSectionBleed(summary: string): boolean {
  const STOP_HEADING =
    /^(?:(?:(?:work|professional)\s+)?experience|employment(?:\s+history)?|education|academic(?:\s+background|\s+history)?|skills?|technical\s+skills|key\s+skills|core\s+competenc(?:y|ies)|projects?|certifications?|achievements?|languages?|employment\s+record|professional\s+journey|professional\s+history)\s*:?\s*$/i;
  return summary.split('\n').some((line) => {
    const norm = line
      .trim()
      .replace(/[:|\-_=]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    return norm.length > 0 && norm.length <= 72 && STOP_HEADING.test(norm);
  });
}

/** Strip section bleed from summary only when the matching structured array is already populated. */
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
  if (!summaryContainsSectionBleed(text)) return text.slice(0, 4000);

  const hasExperience = sections.experience.length > 0;
  const hasEducation = sections.education.length > 0;
  const hasSkills = sections.skills.length > 0;

  // Education alone must not strip work-experience prose still needed for hydration.
  if (!hasExperience && !hasEducation && !hasSkills) return text.slice(0, 4000);
  if (!hasExperience) return text.slice(0, 4000);

  return truncateSummaryAtSectionBoundary(text).slice(0, 4000);
}

/** Count experiences that have a plausible company/employer field populated. */
function countExperiencesWithCompany(list: unknown[]): number {
  return countPlausibleExperienceCompanies(list);
}

function shouldUseCustomParserExperienceFinalize(
  importMeta: Record<string, unknown> | undefined,
  list: Record<string, unknown>[]
): boolean {
  if (isCustomParserImport(importMeta ?? {})) return true;
  if (importMeta?._imported === true) return true;
  if (list.length > 0 && countPlausibleExperienceCompanies(list) < list.length) return true;
  return false;
}

function normalizeMergedExperienceList(
  list: unknown[],
  importMeta?: Record<string, unknown>
): Record<string, unknown>[] {
  if (!Array.isArray(list) || list.length === 0) return [];
  const objects = list.filter(
    (entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object'
  );
  if (shouldUseCustomParserExperienceFinalize(importMeta, objects)) {
    return finalizeExperienceListForCustomParserImport(objects);
  }
  const reconciled = objects.map((entry) => reconcileExperienceHeaderFields(entry));
  return finalizeExperienceListForBuilder(reconciled);
}

function pickSkillsList(parent: Record<string, unknown>, out: Record<string, any>): string[] {
  const parentRaw = firstNonEmptyArray(parent, ['skills', 'Skills', 'technicalSkills']);
  const builderRaw = out.skills ?? out.Skills ?? out.technicalSkills;
  const importMeta = { ...parent, ...out };
  if (isCustomParserImport(importMeta)) {
    const combined = [
      ...(Array.isArray(builderRaw) ? builderRaw : []),
      ...(Array.isArray(parentRaw) ? parentRaw : []),
    ];
    return normalizeCustomParserSkillsList(combined);
  }
  const parentSkills = normalizeSkillsList(Array.isArray(parentRaw) ? parentRaw : []);
  const builderSkills = normalizeSkillsList(Array.isArray(builderRaw) ? builderRaw : []);
  return builderSkills.length >= parentSkills.length ? builderSkills : parentSkills;
}

function enrichExperienceFromParserAliases(
  experiences: unknown[],
  rawImport: Record<string, unknown>
): unknown[] {
  if (!Array.isArray(experiences) || experiences.length === 0) return experiences;
  const rawList = readFirstArray(rawImport, EXPERIENCE_SECTION_KEYS);
  return experiences.map((exp, index) => {
    if (!exp || typeof exp !== 'object') return exp;
    const row = { ...(exp as Record<string, unknown>) };
    const companyRaw =
      row.company || row.Company || row.organization || row.employer || row.firm || row.office;
    const hasCompany =
      hasMeaningfulText(companyRaw) && isPlausibleExperienceCompany(companyRaw);
    const hasLocation = hasMeaningfulText(row.location || row.Location);
    const hasDescription = hasMeaningfulText(row.description || row.Description);
    const hasPosition = hasMeaningfulText(
      row.position || row.title || row.designation || row.role || row.jobTitle
    );

    const fillFromSource = (source: Record<string, unknown>): boolean => {
      let changed = false;
      if (!hasCompany) {
        for (const key of COMPANY_ALIASES) {
          const candidate = sanitizeFieldText(source[key], 160);
          if (candidate && isPlausibleExperienceCompany(candidate)) {
            row.company = candidate;
            row.Company = candidate;
            changed = true;
            break;
          }
        }
      }
      if (!hasPosition) {
        for (const key of DESIGNATION_ALIASES) {
          const candidate = sanitizeFieldText(source[key], 120);
          if (candidate) {
            row.position = candidate;
            row.title = candidate;
            row.designation = candidate;
            changed = true;
            break;
          }
        }
      }
      if (!hasLocation) {
        const loc = sanitizeFieldText(
          source.location ?? source.Location ?? source.city ?? source.City ?? '',
          120
        );
        if (loc) {
          row.location = loc;
          row.Location = loc;
          changed = true;
        }
      }
      if (!hasDescription) {
        const desc = cleanMultiline(
          String(
            source.description ??
              source.Description ??
              source.summary ??
              source.Summary ??
              source.responsibilities ??
              source.achievements ??
              ''
          )
        ).trim();
        if (desc.length >= 12) {
          row.description = desc;
          row.Description = desc;
          changed = true;
        }
      }
      return changed;
    };

    if (hasCompany && hasLocation && hasDescription && hasPosition) return row;

    const raw = rawList[index];
    if (raw && typeof raw === 'object' && fillFromSource(raw as Record<string, unknown>)) {
      return row;
    }

    const startKey = sanitizeFieldText(row.startDate || row.start_date, 40);
    const titleKey = sanitizeFieldText(row.title || row.position || row.designation, 120)
      .toLowerCase()
      .trim();
    for (const candidate of rawList) {
      if (!candidate || typeof candidate !== 'object') continue;
      const rec = candidate as Record<string, unknown>;
      const candStart = sanitizeFieldText(rec.startDate || rec.start_date, 40);
      const candTitle = sanitizeFieldText(rec.title || rec.position || rec.designation, 120)
        .toLowerCase()
        .trim();
      if (startKey && candStart && startKey === candStart && (!titleKey || !candTitle || titleKey === candTitle)) {
        if (fillFromSource(rec)) return row;
      }
    }

    return row;
  });
}

function projectNameKey(value: unknown): string {
  return sanitizeFieldText(value, 120).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function enrichProjectsFromParserAliases(
  projects: unknown[],
  rawImport: Record<string, unknown>
): unknown[] {
  const rawList = firstNonEmptyArray(rawImport, ['projects', 'Projects']);
  if (!Array.isArray(rawList) || rawList.length === 0) return projects;

  const built = Array.isArray(projects)
    ? projects.filter((p) => p && typeof p === 'object')
    : [];
  if (built.length === 0) return rawList;

  const fillFromSource = (row: Record<string, unknown>, source: Record<string, unknown>): void => {
    if (!hasMeaningfulText(row.name || row.title)) {
      for (const key of [
        'name',
        'title',
        'projectName',
        'ProjectName',
        'ProjectTitle',
      ] as const) {
        const candidate = sanitizeFieldText(source[key], 120);
        if (candidate) {
          row.name = candidate;
          row.title = candidate;
          break;
        }
      }
    }
    if (!hasMeaningfulText(row.description || row.Description)) {
      const desc = cleanMultiline(
        String(
          source.description ??
            source.summary ??
            source.Description ??
            source.details ??
            source.responsibilities ??
            ''
        )
      ).trim();
      if (desc.length >= 12) {
        row.description = desc;
        row.Description = desc;
      }
    }
    if (!hasMeaningfulText(row.technologies || row.Technologies)) {
      const tech =
        source.technologies ??
        source.tech_stack ??
        source.techStack ??
        source.tech ??
        source.stack ??
        source.tools ??
        source.languagesUsed;
      if (tech) {
        row.technologies = tech;
        row.Technologies = tech;
      }
    }
  };

  const enriched = built.map((project, index) => {
    const row = { ...(project as Record<string, unknown>) };
    const raw = rawList[index];
    if (raw && typeof raw === 'object') {
      fillFromSource(row, raw as Record<string, unknown>);
      return row;
    }
    const nameKey = projectNameKey(row.name || row.title);
    for (const candidate of rawList) {
      if (!candidate || typeof candidate !== 'object') continue;
      const rec = candidate as Record<string, unknown>;
      if (nameKey && projectNameKey(rec.name || rec.title) === nameKey) {
        fillFromSource(row, rec);
        break;
      }
    }
    return row;
  });

  const seen = new Set(
    enriched.map((p) => projectNameKey((p as Record<string, unknown>).name || (p as Record<string, unknown>).title))
  );
  for (const raw of rawList) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;
    const name = sanitizeFieldText(rec.name || rec.title, 120);
    const desc = sanitizeFieldText(rec.description || rec.summary || rec.Description, 500);
    const key = projectNameKey(name || desc.slice(0, 40));
    if (!key || seen.has(key)) continue;
    if (name || desc.length >= 20) {
      enriched.push(rec);
      seen.add(key);
    }
  }
  return enriched;
}

function isJobTitleMisclassifiedAsProject(
  name: string,
  jobTitle: string,
  experienceTitles: string[]
): boolean {
  const n = name.toLowerCase().trim();
  if (!n) return true;
  if (
    looksLikeJobTitleLine(name) &&
    !/\b(website|web\s*site|portal|system|application|app|platform|dashboard|api|tool|suite|software|e-?commerce)\b/i.test(
      name
    )
  ) {
    return true;
  }
  const jt = jobTitle.toLowerCase().trim();
  if (jt && n === jt) return true;
  for (const title of experienceTitles) {
    const tl = String(title || '').toLowerCase().trim();
    if (tl && n === tl) return true;
  }
  return false;
}

function countExperienceWithPlausibleCompany(list: unknown[]): number {
  if (!Array.isArray(list)) return 0;
  return list.filter((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const exp = entry as Record<string, unknown>;
    return isPlausibleExperienceCompany(
      exp.company || exp.Company || exp.organization || exp.employer
    );
  }).length;
}

function logBuilderImportPipelineTrace(input: {
  raw: Record<string, unknown>;
  merged: Record<string, unknown>;
  builder: Record<string, unknown>;
}): void {
  const snapshot = (data: Record<string, unknown>) => ({
    summaryChars: String(data.summary || data.bio || '').length,
    experience: Array.isArray(data.experience) ? data.experience.length : 0,
    experienceCompanies: countExperienceWithPlausibleCompany(
      Array.isArray(data.experience) ? data.experience : []
    ),
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
    skills: Array.isArray(data.skills) ? data.skills.length : 0,
    education: Array.isArray(data.education) ? data.education.length : 0,
    certifications: Array.isArray(data.certifications) ? data.certifications.length : 0,
    languages: Array.isArray(data.languages) ? data.languages.length : 0,
  });

  console.log('[import-pipeline-trace]', {
    raw: snapshot(input.raw),
    merged: snapshot(input.merged),
    builder: snapshot(input.builder),
  });
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
        if (meaningful.length > 0) {
          const parentList = firstNonEmptyArray(parent, [canonical, ...aliases]);
          const builderCompanies = countExperiencesWithCompany(fromBuilder as unknown[]);
          const parentCompanies = countExperiencesWithCompany(parentList);
          const builderPlausible = countPlausibleExperienceCompanies(fromBuilder as unknown[]);
          const parentPlausible = countPlausibleExperienceCompanies(parentList);
          const builderMissingCompany = builderCompanies < meaningful.length;
          if (
            parentPlausible > builderPlausible ||
            (builderPlausible < meaningful.length &&
              parentPlausible > 0 &&
              parentList.length >= meaningful.length) ||
            parentList.length > (fromBuilder as unknown[]).length ||
            parentCompanies > builderCompanies ||
            (builderMissingCompany &&
              parentCompanies > 0 &&
              parentList.length >= meaningful.length)
          ) {
            return parentList;
          }
          return fromBuilder;
        }
        const parentList = firstNonEmptyArray(parent, [canonical, ...aliases]);
        if (parentList.length > 0) return parentList;
        return fromBuilder;
      } else if (canonical === 'projects') {
        const parentList = firstNonEmptyArray(parent, [canonical, ...aliases]);
        const builderPlausible = countPlausibleProjects(fromBuilder as unknown[]);
        const parentPlausible = countPlausibleProjects(parentList);
        if (
          parentPlausible > builderPlausible ||
          (builderPlausible === 0 && parentPlausible > 0) ||
          parentList.length > (fromBuilder as unknown[]).length
        ) {
          return parentList;
        }
        return fromBuilder;
      } else if (canonical === 'education') {
        const parentList = firstNonEmptyArray(parent, [canonical, ...aliases]);
        if (parentList.length > (fromBuilder as unknown[]).length) {
          return parentList;
        }
        return fromBuilder;
      } else {
        return fromBuilder;
      }
    }
    return firstNonEmptyArray(parent, [canonical, ...aliases]);
  };

  out.experience = pick('experience', ['Work Experience', 'Experience', 'workExperience']);
  out.education = pick('education', ['Education']);
  out.skills = pickSkillsList(parent, out);
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

  out.customParserUsed = parent.customParserUsed ?? builderFormData.customParserUsed;
  out.selectedParser = parent.selectedParser ?? builderFormData.selectedParser;
  out._aiProvider = parent._aiProvider ?? builderFormData._aiProvider;
  out.rawText = parent.rawText ?? builderFormData.rawText ?? out.rawText;

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
    return transformImportDataToBuilder({
      ...parent,
      ...merged,
      builderFormData: undefined,
    });
  }

  // Upload / editor already coalesced — re-apply section recovery + import guards.
  if (parsed._imported === true) {
    const email = String(parsed.email || '');
    const locationHint = String(parsed.location || parsed.address || '');

    if (parsed._userEdited === true) {
      return applySummaryHygieneToBuilderForm(
        applyBuilderImportGuards(parsed as Record<string, any>, parsed, email, locationHint)
      );
    }

    const rawText = String(parsed.rawText ?? '').trim();
    if (isSparseSectionImport(parsed) && rawText.length >= 80) {
      const { builderFormData: _drop, ...profile } = parsed;
      return transformImportDataToBuilder({ ...profile, _imported: true });
    }

    let out = { ...(parsed as Record<string, any>) };
    if (Array.isArray(out.experience) && out.experience.length > 0) {
      out.experience = enrichExperienceFromParserAliases(out.experience, out);
    }
    out = overlaySparseSectionsFromTextRecovery({
      ...out,
      rawText: out.rawText ?? parsed.rawText,
    }) as Record<string, any>;
    delete out.builderFormData;
    if (Array.isArray(out.experience) && out.experience.length > 0) {
      out.experience = normalizeMergedExperienceList(out.experience, out);
    }

    // Re-coalesce of gallery/editor session — skip field-mapper re-recovery (inflates achievements).
    if (isAlreadyBuilderCoalescedImport(out) && hasImportableContent(out)) {
      return applySummaryHygieneToBuilderForm(
        applyBuilderImportGuards(
          out,
          { ...out, rawText: out.rawText ?? parsed.rawText },
          email,
          locationHint
        )
      );
    }

    const { builder: recoveredOut, report: rehydrateReport } = recoverBuilderFormSections(out, {
      mergedImport: out,
      rawImport: parsed,
    });
    logBuilderFieldMappingReport(rehydrateReport);
    return applySummaryHygieneToBuilderForm(
      applyBuilderImportGuards(recoveredOut, out, email, locationHint)
    );
  }

  return transformImportDataToBuilder(parsed);
}

function isAlreadyBuilderCoalescedImport(parsed: Record<string, unknown>): boolean {
  if (parsed._builderCoalesced === true) return true;
  const experience = parsed.experience;
  if (!Array.isArray(experience) || experience.length === 0) return false;
  return experience.some(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      (Object.prototype.hasOwnProperty.call(entry, 'title') ||
        Object.prototype.hasOwnProperty.call(entry, 'designation')) &&
      (Object.prototype.hasOwnProperty.call(entry, 'company') ||
        Object.prototype.hasOwnProperty.call(entry, 'organization'))
  );
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
  /\b(b\.?\s*a\.?|b\.?\s*com|b\.?\s*tech|m\.?\s*a\.?|m\.?\s*com|mba|mca|company secretary|\bcs\b|llb|llm|ph\.?\s*d|bachelors?|masters?|doctorate|intermediate|graduation)\b/i;
const ACHIEVEMENT_FIRM_LINE_RE =
  /\b(m\/s\.?|pcs\s+firm|associates|chartered|consultancy|pvt\.?\s*ltd|limited)\b/i;

function isMisplacedAchievementLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 280) return true;
  if (isCorporateStructurePhrase(t)) return true;
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

function readImportTextField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function textParsedNameFromImport(data: Record<string, unknown>): string {
  return readImportTextField(data.fullName || data.name || data.FullName || '');
}

function enrichIdentityFromText(
  data: Record<string, unknown>,
  textParsed?: ReturnType<typeof extractResumeFromText>,
  recovered?: Partial<ReturnType<typeof recoverFromRawText>>
): Record<string, unknown> {
  const personal = (data.personalInformation || {}) as Record<string, unknown>;
  const rawFull = readImportTextField(
    data.fullName || data.name || textParsed?.fullName || personal.fullName || ''
  );
  const safeFull = sanitizePersonName(rawFull, 120) || '';
  return {
    ...data,
    fullName: safeFull,
    name: safeFull,
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
    const inst = String(rec.institution || rec.school || rec.college || rec.university || '');
    const degree = String(rec.degree || rec.qualification || '');
    const instClass = inst ? classifyResumeTextFragment(inst) : null;
    const firmLike =
      !!inst &&
      !ACHIEVEMENT_DEGREE_LINE_RE.test(degree) &&
      (ACHIEVEMENT_FIRM_LINE_RE.test(inst) ||
        isLikelyCompanyNameFragment(inst) ||
        looksLikeCompanyNameLine(inst) ||
        instClass?.kind === 'COMPANY_NAME');
    if (firmLike) {
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

const EXPERIENCE_SECTION_HEADING_RE =
  /^(?:(?:work|professional)\s+experience|employment(?:\s+history)?|career\s+history|professional\s+journey|legal\s+work)\s*:?\s*$/i;

const SKILLS_SECTION_HEADING_RE =
  /^(?:skills?|technical\s+skills?|key\s+skills?|core\s+competenc(?:y|ies))\s*:?\s*$/i;

const NEXT_MAJOR_SECTION_HEADING_RE =
  /^(?:education|qualifications?|academic(?:\s+background)?|skills?|technical\s+skills?|certifications?|languages?|projects?|achievements?|awards?|references?|personal\s+(?:information|details)|declaration|hobbies?|interests?)\s*:?\s*$/i;

function normalizeSectionHeadingLine(line: string): string {
  return line
    .trim()
    .replace(/[:|\-_=]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Slice prose from a major section heading until the next major heading (mapping layer only). */
function sliceTextFromSectionHeading(
  text: string,
  headingRe: RegExp
): string | null {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => headingRe.test(normalizeSectionHeadingLine(line)));
  if (start < 0) return null;
  const out: string[] = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    const norm = normalizeSectionHeadingLine(lines[i]);
    if (norm && NEXT_MAJOR_SECTION_HEADING_RE.test(norm) && !headingRe.test(norm)) break;
    out.push(lines[i]);
  }
  const slice = out.join('\n').trim();
  return slice.length >= 30 ? slice : null;
}

function parseTextWithSectionFallback(
  rawText: string,
  summaryText: string,
  fromText?: ReturnType<typeof extractResumeFromText>
): ReturnType<typeof extractResumeFromText> {
  let textParsed = fromText ?? extractResumeFromText(rawText);

  if ((textParsed.experience || []).length === 0) {
    const expSlice =
      sliceTextFromSectionHeading(rawText, EXPERIENCE_SECTION_HEADING_RE) ||
      sliceTextFromSectionHeading(summaryText, EXPERIENCE_SECTION_HEADING_RE);
    if (expSlice) {
      const sliceParsed = extractResumeFromText(expSlice);
      if ((sliceParsed.experience || []).length > 0) {
        textParsed = { ...textParsed, experience: sliceParsed.experience };
      }
    }
  }

  if ((textParsed.skills || []).length === 0) {
    const skillSlice =
      sliceTextFromSectionHeading(rawText, SKILLS_SECTION_HEADING_RE) ||
      sliceTextFromSectionHeading(summaryText, SKILLS_SECTION_HEADING_RE);
    if (skillSlice) {
      const sliceParsed = extractResumeFromText(skillSlice);
      if ((sliceParsed.skills || []).length > 0) {
        textParsed = { ...textParsed, skills: sliceParsed.skills };
      }
    }
  }

  return textParsed;
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
      if (typeof item !== 'string') continue;
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

  const textParsed = parseTextWithSectionFallback(
    rawText,
    String(importedData.summary || importedData.bio || importedData.objective || ''),
    fromText
  );
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
    name: fullName || apiName || '',
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
  const traceInput = importedData;
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

  const isCustomParser = isCustomParserImport(importedData as Record<string, unknown>);
  const effectiveRawText = resolveEffectiveRawText(importedData as Record<string, unknown>);

  // 1. Custom parser: trust structured output — skip legacy text-recovery merges.
  const recovered = isCustomParser
    ? {
        email: '',
        phone: '',
        linkedin: '',
        portfolio: '',
        github: '',
        summary: '',
        fullName: '',
      }
    : recoverFromRawText(effectiveRawText || importedData.rawText);
  const mergedBase = isCustomParser
    ? ({ ...importedData } as Record<string, unknown>)
    : (mergeRecovery(importedData, recovered) as Record<string, unknown>);
  const textParsed =
    !isCustomParser && effectiveRawText.length >= 80
      ? extractResumeFromText(effectiveRawText)
      : undefined;
  let mergedImport: Record<string, unknown>;
  if (isCustomParser) {
    mergedImport = relocateMisplacedEducationEntries(mergedBase);
    const { data: repairedImport } = validateAndRepairResumeExtraction(mergedImport);
    mergedImport = repairedImport;
    if (Array.isArray(mergedImport.experience)) {
      mergedImport.experience = finalizeExperienceListForCustomParserImport(
        mergedImport.experience as Record<string, unknown>[]
      );
    }
    if (Array.isArray(mergedImport.education)) {
      mergedImport.education = finalizeEducationListForCustomParserImport(
        mergedImport.education as Record<string, unknown>[]
      );
    }
    mergedImport = overlaySparseSectionsFromTextRecovery({
      ...mergedImport,
      rawText: effectiveRawText || mergedImport.rawText,
    });
    mergedImport = applyTextRecoveryWhenSparse(mergedImport);
  } else {
    mergedImport = isSparseSectionImport(mergedBase)
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
  }

  mergedImport = normalizeImportProfileAliases(mergedImport);

  if (Array.isArray(mergedImport.experience) && effectiveRawText.length >= 40) {
    mergedImport.experience = backfillExperienceColumnsFromRawText(
      mergedImport.experience as unknown[],
      effectiveRawText
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
      personal.portfolio ||
      personal.website ||
      ''
  );
  const github = sanitizeFieldText(
    mergedImport.github ||
      personal.github ||
      recovered.github ||
      (String(mergedImport.portfolio || '').includes('github.com') ? mergedImport.portfolio : '')
  );

  const summaryRaw = mergeSummarySections(mergedImport, textParsed, recovered.summary);
  const summary = sanitizeImportSummary(
    summaryRaw ||
      cleanMultiline(
        mergedImport.summary || mergedImport.bio || mergedImport.objective || recovered.summary || ''
      ),
    effectiveRawText
  ).slice(0, 4000);

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
  let resolvedFirstName = firstName;
  let resolvedLastName = lastName;
  let resolvedDisplayName = displayName;
  if (email && displayName) {
    resolvedDisplayName = enrichPartialNameFromEmail(displayName, email);
    if (resolvedDisplayName !== displayName) {
      const split = splitFullNameWithRejected(resolvedDisplayName);
      resolvedFirstName = split.firstName || firstName;
      resolvedLastName = split.lastName || lastName;
    }
  }
  const textAdditional = isCustomParser
    ? emptyAdditionalResumeData()
    : effectiveRawText.length >= 80
      ? extractAdditionalResumeDataFromText(effectiveRawText)
      : emptyAdditionalResumeData();
  const mergedAdditional = mergeAdditionalResumeData(additionalResumeData, textAdditional);

  const achievementCandidateLines = isCustomParser
    ? []
    : [
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
  const partitionedAchievements = isCustomParser
    ? { achievements: [], education: [], experience: [], skills: [] }
    : partitionSpilloverLines(achievementCandidateLines);
  if (!isCustomParser) {
    mergedImport = applySpilloverToImport(mergedImport, partitionedAchievements);
    const { data: postSpillover } = validateAndRepairResumeExtraction(mergedImport);
    mergedImport = postSpillover;
  }

  const experience = transformExperienceArray(
    enrichExperienceFromParserAliases(
      readFirstArray(mergedImport, EXPERIENCE_SECTION_KEYS),
      mergedImport
    )
  );

  const skills = isCustomParser
    ? normalizeCustomParserSkillsList(readFirstArray(mergedImport, SKILL_SECTION_KEYS))
    : cleanSkills(readFirstArray(mergedImport, SKILL_SECTION_KEYS));

  let jobTitle = extractJobTitleFromImport(mergedImport, professional, experience);
  if (!jobTitle) {
    const inferred = inferProfessionFromResume({
      summary,
      skills,
      experience,
      headline: sanitizeFieldText(
        mergedImport.headline || mergedImport.designation || professional.headline || '',
        120
      ),
    });
    if (isUsableJobHeadline(inferred)) {
      jobTitle = inferred;
    }
  }
  jobTitle = sanitizeImportJobTitle(jobTitle);

  // 3. Build form data shaped exactly for each step
  const transformed: Record<string, any> = {
    // ===== ContactsStep =====
    firstName: resolvedFirstName,
    lastName: resolvedLastName,
    name: resolvedDisplayName,
    fullName: resolvedDisplayName,
    email,
    phone,
    location,
    linkedin,
    portfolio: portfolio || github,
    github,

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
      readFirstArray(mergedImport, EDUCATION_SECTION_KEYS),
      isCustomParser
    ),

    // ===== ProjectsStep =====
    projects: transformProjectsArray(
      enrichProjectsFromParserAliases(
        (() => {
          const raw = readFirstArray(mergedImport, PROJECT_SECTION_KEYS);
          console.log('[import-transformer] mergedImport project keys', {
            projects: Array.isArray(mergedImport.projects) ? mergedImport.projects.length : 0,
            Projects: Array.isArray(mergedImport.Projects) ? mergedImport.Projects.length : 0,
          });
          return raw;
        })(),
        mergedImport
      ),
      jobTitle,
      experience.map((e: Record<string, unknown>) =>
        String(e.title || e.position || e.designation || '')
      )
    ),

    // ===== CertificationsStep =====
    certifications: transformCertificationsArray(
      readFirstArray(mergedImport, CERT_SECTION_KEYS),
      readFirstArray(mergedImport, EDUCATION_SECTION_KEYS)
    ),

    // ===== LanguagesStep =====
    languages: transformLanguagesArray(readFirstArray(mergedImport, LANGUAGE_SECTION_KEYS)),

    // ===== AchievementsStep =====
    achievements: transformAchievementsArray(
      [
        ...partitionedAchievements.achievements,
        ...(Array.isArray(mergedImport.achievements) ? mergedImport.achievements : []),
      ],
      isCustomParser
    ),

    // ===== HobbiesStep =====
    hobbies: cleanHobbies(readFirstArray(mergedImport, HOBBY_SECTION_KEYS)),

    additionalResumeData: mergedAdditional,

    rawText: effectiveRawText || mergedImport.rawText || importedData.rawText,

    // Metadata
    _imported: true,
    _importedAt: Date.now(),
    _importSource: 'ai-extraction',
    _resumeId: mergedImport.resumeId || importedData.resumeId || null,
    _confidence: mergedImport.confidence || importedData.confidence || 85,
    _atsScore: mergedImport.atsScore || importedData.atsScore || 90,
    _builderCoalesced: true,
    customParserUsed: isCustomParser ? true : importedData.customParserUsed,
    selectedParser: importedData.selectedParser ?? (isCustomParser ? 'custom' : undefined),
    _aiProvider:
      importedData._aiProvider ??
      importedData.aiProvider ??
      (isCustomParser ? 'custom-parser' : undefined),
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

  const trimmedSummary = sanitizeImportSummary(
    trimSummaryForStructuredSections(transformed.summary, {
      experience: transformed.experience,
      education: transformed.education,
      skills: transformed.skills,
    }),
    effectiveRawText
  );
  transformed.summary = trimmedSummary;
  transformed.bio = trimmedSummary;
  transformed.objective = trimmedSummary;

  const { builder: recoveredBuilder, report: mappingReport } = recoverBuilderFormSections(
    transformed,
    {
      mergedImport,
      rawImport: importedData as Record<string, unknown>,
    }
  );
  Object.assign(transformed, recoveredBuilder);
  logBuilderFieldMappingReport(mappingReport);

  const canonical = runCanonicalBuilderMapping({
    importProfile: mergedImport,
    builderDraft: transformed,
  });
  Object.assign(transformed, canonical.builder);
  if (canonical.report.rejected.length || canonical.report.recovered.length) {
    console.log('[import-transformer] canonical mapping', {
      nodes: canonical.nodes.length,
      matched: canonical.report.matched.length,
      recovered: canonical.report.recovered.length,
      rejected: canonical.report.rejected.length,
      repaired: canonical.report.repaired.length,
      dynamicSections: canonical.report.dynamicSections.length,
    });
  }

  const pruned = pruneAndMergeDynamicSections(transformed, DYNAMIC_SECTION_REGISTRY);
  Object.assign(transformed, pruned);

  const { builder: postCanonicalBuilder, report: postCanonicalReport } = recoverBuilderFormSections(
    transformed,
    {
      mergedImport,
      rawImport: importedData as Record<string, unknown>,
    }
  );
  Object.assign(transformed, postCanonicalBuilder);
  logBuilderFieldMappingReport(postCanonicalReport);

  // Re-sync template alias keys after final recovery pass.
  transformed['Work Experience'] = transformed.experience;
  transformed.Experience = transformed.experience;
  transformed.Education = transformed.education;
  transformed.Skills = transformed.skills;
  transformed.Projects = transformed.projects;
  transformed.Certifications = transformed.certifications;
  transformed.Achievements = transformed.achievements;
  transformed.Languages = transformed.languages;
  transformed.Hobbies = transformed.hobbies;

  Object.assign(
    transformed,
    applyBuilderImportGuards(transformed, mergedImport, email, locationHint)
  );

  logBuilderImportPipelineTrace({
    raw: importedData as Record<string, unknown>,
    merged: mergedImport,
    builder: transformed,
  });
  logImportMappingValidation(transformed, mergedImport);
  logSummary(transformed);
  if (isImportFieldTraceEnabled()) {
    traceImportStageTransform('14_transform_import_data_to_builder', traceInput, transformed, 'import-transformer');
  }
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

/** Generic section / industry tokens that must never bind as contact name fields. */
const GENERIC_BUILDER_JOB_TITLES = new Set([
  'professional',
  'manufacturing',
  'executive',
  'consultant',
  'employee',
  'officer',
  'manager',
  'specialist',
  'associate',
  'director',
]);

function stashRejectedNameFragments(
  additionalResumeData: AdditionalResumeData,
  fragments: string[]
): void {
  for (const fragment of fragments) {
    if (!fragment) continue;
    const classified = classifyResumeTextFragment(fragment);
    stashUnclassifiedFragment(
      additionalResumeData,
      fragment,
      classified.kind === 'PERSON_NAME' ? 'UNKNOWN' : classified.kind
    );
  }
}

function acceptProfileNameParts(
  profileFirst: string,
  profileLast: string,
  email: string,
  locationHint: string,
  additionalResumeData: AdditionalResumeData
): { firstName: string; lastName: string; displayName: string } | null {
  const first = sanitizePersonName(sanitizeFieldText(profileFirst, 80), 80);
  const last = sanitizePersonName(sanitizeFieldText(profileLast, 80), 80);
  const combined = [first, last].filter(Boolean).join(' ').trim();
  if (!combined) return null;

  for (const fragment of [first, last, combined]) {
    if (!fragment) continue;
    const classified = classifyResumeTextFragment(fragment);
    if (classified.kind !== 'PERSON_NAME') {
      stashRejectedNameFragments(additionalResumeData, [first, last]);
      return null;
    }
  }

  if (
    !isPlausiblePersonName(combined) ||
    !isValidatedContactName(combined) ||
    isFirmOrLocationNamePhrase(combined, locationHint) ||
    nameOverlapsLocation(combined, locationHint) ||
    isGarbageResumeText(combined)
  ) {
    stashRejectedNameFragments(additionalResumeData, [first, last]);
    return null;
  }

  const safeFirst = formatDisplayName(first);
  const safeLast = formatDisplayName(last);
  const displayName = [safeFirst, safeLast].filter(Boolean).join(' ').trim();
  if (!displayName) return null;

  return { firstName: safeFirst, lastName: safeLast, displayName };
}

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

  const profileFirst = readImportTextField(importedData.firstName || personal.firstName);
  const profileLast = readImportTextField(importedData.lastName || personal.lastName);
  const acceptedProfile = acceptProfileNameParts(
    profileFirst,
    profileLast,
    email,
    locationHint,
    additionalResumeData
  );
  if (acceptedProfile) {
    const displayName = email
      ? enrichPartialNameFromEmail(acceptedProfile.displayName, email)
      : acceptedProfile.displayName;
    if (displayName !== acceptedProfile.displayName) {
      const split = splitFullNameWithRejected(displayName);
      return {
        firstName: split.firstName || acceptedProfile.firstName,
        lastName: split.lastName || acceptedProfile.lastName,
        displayName,
        additionalResumeData,
      };
    }
    return {
      ...acceptedProfile,
      additionalResumeData,
    };
  }

  const textHeaderName = sanitizePersonName(headerNameFromText, 120);

  const parserFirst = readImportTextField(importedData.firstName || personal.firstName);
  const parserLast = readImportTextField(importedData.lastName || personal.lastName);

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

  if (rawFullName && email) {
    rawFullName = enrichPartialNameFromEmail(rawFullName, email);
  } else if (!rawFullName && textHeaderName && email) {
    rawFullName = enrichPartialNameFromEmail(textHeaderName, email);
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

  if (email) {
    const fromEmail = parseIntelligentNameFromEmail(email);
    const emailCombined = fromEmail
      ? [fromEmail.firstName, fromEmail.lastName].filter(Boolean).join(' ').trim()
      : deriveDisplayNameFromEmail(email);
    const currentCombined = splitCombined;
    const richer = emailCombined
      ? pickRicherFullName(currentCombined, emailCombined, email)
      : currentCombined;
    if (richer && richer !== currentCombined) {
      const headerValidated = isValidatedContactName(currentCombined, locationHint);
      const richerValidated = isValidatedContactName(richer, locationHint);
      const headerWords = currentCombined.toLowerCase().split(/\s+/).filter(Boolean);
      const richerContainsHeader =
        headerWords.length >= 2 &&
        headerWords.every((w) => richer.toLowerCase().includes(w));
      if (
        richerValidated &&
        (!headerValidated || richerContainsHeader || richer.split(/\s+/).length > headerWords.length)
      ) {
        const split = splitFullNameWithRejected(richer);
        firstName = split.firstName;
        lastName = split.lastName;
        for (const rejected of split.rejected) {
          stashUnclassifiedFragment(additionalResumeData, rejected.value, rejected.kind);
        }
      }
    } else if (!hasUsableName && fromEmail) {
      firstName = fromEmail.firstName;
      lastName = fromEmail.lastName;
    } else if (!hasUsableName && emailCombined) {
      const split = splitFullNameWithRejected(emailCombined);
      firstName = split.firstName;
      lastName = split.lastName;
      for (const rejected of split.rejected) {
        stashUnclassifiedFragment(additionalResumeData, rejected.value, rejected.kind);
      }
    }
  }

  firstName = formatDisplayName(firstName);
  lastName = formatDisplayName(lastName);

  const combined = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = combined || formatDisplayName(textHeaderName);

  let safeFirst = sanitizePersonName(firstName, 80);
  let safeLast = sanitizePersonName(lastName, 80);
  let finalDisplay = [safeFirst, safeLast].filter(Boolean).join(' ').trim();
  if (email && finalDisplay) {
    finalDisplay = enrichPartialNameFromEmail(finalDisplay, email);
    const enrichedSplit = splitFullNameWithRejected(finalDisplay);
    safeFirst = enrichedSplit.firstName || safeFirst;
    safeLast = enrichedSplit.lastName || safeLast;
  }
  if (!finalDisplay && combined && isValidatedContactName(combined, locationHint)) {
    finalDisplay = combined;
  }
  if (!finalDisplay && textHeaderName && isValidatedContactName(textHeaderName, locationHint)) {
    finalDisplay = formatDisplayName(textHeaderName);
  }

  const repaired = repairStuckContactNameParts(safeFirst, safeLast, finalDisplay || combined);
  safeFirst = repaired.firstName || safeFirst;
  safeLast = repaired.lastName || safeLast;
  finalDisplay = [safeFirst, safeLast].filter(Boolean).join(' ').trim() || finalDisplay;

  return {
    firstName: safeFirst,
    lastName: safeLast,
    displayName: finalDisplay,
    additionalResumeData,
  };
}

/**
 * Last-resort experience backfill for imports when parser/competency filtering
 * left the section empty or with a single stub row.
 */
function ensureImportedExperiencePopulated(
  builder: Record<string, unknown>,
  rawText: string
): Record<string, unknown> {
  if (builder._userEdited === true) return builder;

  const expRows = Array.isArray(builder.experience) ? (builder.experience as unknown[]) : [];
  const meaningful = filterMeaningfulExperiences(
    expRows.filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
  );
  const plausible = countExperienceWithPlausibleCompany(expRows);
  const text = String(rawText || builder.rawText || '').trim();
  const isImport =
    builder._imported === true ||
    isCustomParserImport(builder) ||
    builder._builderCoalesced === true;

  if (!isImport || text.length < 80) return builder;
  if (meaningful.length >= 2 && plausible >= 2) return builder;

  const structured = recoverStructuredExperienceFromRawText(text);
  if (structured.length > 0) {
    const finalized = finalizeExperienceListForCustomParserImport(structured);
    const structuredMeaningful = filterMeaningfulExperiences(finalized);
    if (
      structuredMeaningful.length > meaningful.length ||
      (meaningful.length === 0 && structuredMeaningful.length > 0)
    ) {
      const experience = transformExperienceArray(finalized);
      return {
        ...builder,
        experience,
        Experience: experience,
        'Work Experience': experience,
        customParserUsed:
          builder.customParserUsed === true || isCustomParserImport(builder) || undefined,
        _builderCoalesced: true,
      };
    }
  }

  if (meaningful.length > 0 && plausible >= 1) return builder;

  const overlaid = overlaySparseSectionsFromTextRecovery({
    ...builder,
    rawText: text,
    experience: expRows,
  }) as Record<string, unknown>;
  const overlayExp = Array.isArray(overlaid.experience) ? overlaid.experience : [];
  const overlayMeaningful = filterMeaningfulExperiences(
    overlayExp.filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
  );
  if (overlayMeaningful.length > meaningful.length) {
    const experience = transformExperienceArray(overlayExp);
    return {
      ...builder,
      ...overlaid,
      experience,
      Experience: experience,
      'Work Experience': experience,
      _builderCoalesced: true,
    };
  }

  return builder;
}

function countExperienceBodyBullets(experiences: unknown[]): number {
  if (!Array.isArray(experiences)) return 0;
  return experiences.reduce((total, row) => {
    if (!row || typeof row !== 'object') return total;
    const body = collectExperienceBodyFields(row as Record<string, unknown>);
    const descLines = body.description.split(/\n/).filter((l) => l.trim().length >= 12).length;
    return total + body.achievements.length + descLines;
  }, 0);
}

function enrichExperienceBodiesForImport(
  builder: Record<string, unknown>,
  rawText: string
): Record<string, unknown> {
  if (builder._userEdited === true) return builder;
  if (!rawText || rawText.length < 80 || !Array.isArray(builder.experience)) return builder;

  const rows = (builder.experience as unknown[]).filter(
    (e): e is Record<string, unknown> => !!e && typeof e === 'object'
  );
  if (rows.length === 0) return builder;

  const before = countExperienceBodyBullets(rows);
  const enriched = recoverExperienceBodiesFromRawText(rawText, rows);
  const after = countExperienceBodyBullets(enriched);
  if (after <= before) return builder;

  const experience = transformExperienceArray(enriched);
  return {
    ...builder,
    experience,
    Experience: experience,
    'Work Experience': experience,
    _builderCoalesced: true,
  };
}

function applyBuilderImportGuards(
  builder: Record<string, unknown>,
  mergedImport: Record<string, unknown>,
  email: string,
  locationHint: string
): Record<string, unknown> {
  const rawText = String(mergedImport.rawText || builder.rawText || '').trim();
  let out = finalizeBuilderContactIdentity(builder, mergedImport, email, locationHint, rawText);

  if (rawText.length >= 80) {
    const sparseCompanies =
      countExperienceWithPlausibleCompany(
        Array.isArray(out.experience) ? (out.experience as unknown[]) : []
      ) <
      (Array.isArray(out.experience) ? out.experience.length : 0) * 0.5;
    const eduRows = Array.isArray(out.education) ? (out.education as Record<string, unknown>[]) : [];
    const eduWithDegree = eduRows.filter((e) =>
      String(e.degree || e.Degree || '').trim()
    ).length;
    const skills = Array.isArray(out.skills) ? (out.skills as string[]) : [];
    const noisySkills = skills.some((s) =>
      /^(and|company|rtas?|due)$/i.test(String(s).trim())
    );

    const expRows = Array.isArray(out.experience) ? (out.experience as unknown[]) : [];
    const plausibleExp = countExperienceWithPlausibleCompany(expRows);
    const experienceUnderRepresented =
      expRows.length <= 1 && plausibleExp <= 1 && /\b(?:experience|employment)\b/i.test(rawText);

    if (sparseCompanies || eduWithDegree < 2 || noisySkills || experienceUnderRepresented) {
      const overlaid = overlaySparseSectionsFromTextRecovery({ ...out, rawText }) as Record<
        string,
        unknown
      >;
      if (Array.isArray(overlaid.experience) && overlaid.experience.length > 0) {
        out.experience = transformExperienceArray(overlaid.experience);
        out['Work Experience'] = out.experience;
        out.Experience = out.experience;
      }
      if (Array.isArray(overlaid.education) && overlaid.education.length > 0) {
        out.education = transformEducationArray(overlaid.education, isCustomParserImport(out));
        out.Education = out.education;
      }
      if (Array.isArray(overlaid.skills) && overlaid.skills.length > 0) {
        out.skills = overlaid.skills;
      }
    }
  }

  out = mergeExtendedSkillBuckets(out);
  const existingSkills = cleanSkills(out.skills) as string[];
  if (skillsLookLikeAddressContamination(existingSkills) && rawText.length >= 80) {
    const fromSection = recoverSkillsFromTechnicalSkillsSection(rawText);
    if (fromSection.length >= 2) {
      out.skills = fromSection;
    } else {
      out.skills = recoverSkillsFromRawText(rawText, []);
    }
  } else {
    out.skills = recoverSkillsFromRawText(rawText, existingSkills);
  }
  out.Skills = out.skills;
  if (!String(out.location || out.address || '').trim() && rawText.length >= 40) {
    const recoveredLocation = recoverLocationFromImportText(rawText);
    if (recoveredLocation) {
      out.location = recoveredLocation;
      out.Location = recoveredLocation;
      out.address = recoveredLocation;
    }
  }
  out.education = recoverEducationDegreesFromImport(out, rawText);
  out.Education = out.education;
  const relocated = relocateMisplacedEducationEntries(out);
  if (Array.isArray(relocated.education)) {
    out.education = transformEducationArray(relocated.education, true);
    out.Education = out.education;
  }
  if (Array.isArray(relocated.experience) && relocated.experience.length > 0) {
    out.experience = transformExperienceArray(relocated.experience);
    out['Work Experience'] = out.experience;
    out.Experience = out.experience;
  }
  out = rehomeMisclassifiedProjects(out);
  out.achievements = transformAchievementsArray(out.achievements, false);
  out.Achievements = out.achievements;
  const cleanSummary = sanitizeImportSummary(String(out.summary || out.bio || ''), rawText);
  out.summary = cleanSummary;
  out.bio = cleanSummary;
  out.objective = cleanSummary;
  const cleanTitle = sanitizeImportJobTitle(String(out.jobTitle || out.title || ''));
  let resolvedTitle = cleanTitle;
  if (!resolvedTitle && rawText.length >= 80) {
    resolvedTitle = recoverJobTitleFromRawText(rawText);
  }
  if (!resolvedTitle && String(out.summary || '').length >= 60) {
    const summaryText = normalizePdfLigatureText(String(out.summary));
    const supervisorMatch = summaryText.match(
      /\b((?:senior\s+|assistant\s+)?(?:production|operations|dispatch|warehouse|logistics|maintenance|quality)\s+supervisor)\b/i
    );
    if (supervisorMatch) {
      resolvedTitle = sanitizeImportJobTitle(supervisorMatch[1]);
    }
    if (!resolvedTitle) {
      const m = summaryText.match(
        /\b(corporate\s+legal\s*(?:,|&|\band\b)\s*secretarial[^,.]{0,40})/i
      );
      if (m) resolvedTitle = sanitizeImportJobTitle(m[1]);
    }
    if (
      !resolvedTitle &&
      /\bcorporate\s+legal\b/i.test(summaryText) &&
      /\b(?:secretarial|governance|compliance)\b/i.test(summaryText)
    ) {
      resolvedTitle = sanitizeImportJobTitle('Corporate Legal & Secretarial');
    }
  }
  out.jobTitle = resolvedTitle;
  out.title = resolvedTitle;
  out.projects = transformProjectsArray(
    out.projects,
    cleanTitle,
    Array.isArray(out.experience)
      ? (out.experience as Record<string, unknown>[]).map((e) =>
          String(e.title || e.position || '').trim()
        )
      : []
  );
  out.Projects = out.projects;
  if (Array.isArray(out.languages)) {
    out.languages = transformLanguagesArray(out.languages).slice(0, 12);
    out.Languages = out.languages;
  }
  if (Array.isArray(out.hobbies)) {
    out.hobbies = cleanHobbies(out.hobbies)
      .filter((h) => !isSpacedLetterFragment(h) && !isResumeSectionHeadingLine(h))
      .slice(0, 12);
    out.Hobbies = out.hobbies;
  }
  if (Array.isArray(out.experience) && out.experience.length > 0) {
    const headline = String(out.jobTitle || out.title || '').trim();
    if (headline) {
      out.experience = (out.experience as Record<string, unknown>[]).map((row) => {
        const exp = { ...row };
        const title = sanitizeFieldText(exp.title || exp.position || exp.designation, 120);
        if (!title && headline) {
          exp.title = headline;
          exp.position = headline;
          exp.designation = headline;
        }
        return exp;
      });
    }
    if (rawText.length >= 80) {
      out = enrichExperienceBodiesForImport(out, rawText);
    }
    out.experience = transformExperienceArray(out.experience);
    out['Work Experience'] = out.experience;
    out.Experience = out.experience;
  }
  return ensureImportedExperiencePopulated(out, rawText);
}

/** Gallery/editor display — backfill experience when import session is sparse. */
export function backfillImportedExperienceForDisplay(
  data: Record<string, unknown>
): Record<string, unknown> {
  const rawText = String(data.rawText ?? '').trim();
  let out = ensureImportedExperiencePopulated(data, rawText);
  if (rawText.length >= 80) {
    out = enrichExperienceBodiesForImport(out, rawText);
  }
  return out;
}

function mergeExtendedSkillBuckets(builder: Record<string, unknown>): Record<string, unknown> {
  const extended =
    builder.extendedSections && typeof builder.extendedSections === 'object'
      ? (builder.extendedSections as Record<string, unknown>)
      : {};
  const buckets: unknown[] = [
    builder.skills,
    builder.Skills,
    builder.technicalSkills,
    builder.coreCompetencies,
    builder.softSkills,
    builder.industryExpertise,
    extended.technicalSkills,
    extended.coreCompetencies,
    extended.softSkills,
    extended.industryExpertise,
  ];
  const flat: unknown[] = [];
  for (const bucket of buckets) {
    if (Array.isArray(bucket)) flat.push(...bucket);
    else if (typeof bucket === 'string' && bucket.trim()) flat.push(bucket);
  }
  if (!flat.length) return builder;
  const merged = cleanSkills([...(Array.isArray(builder.skills) ? builder.skills : []), ...flat]);
  return { ...builder, skills: merged, Skills: merged };
}

function isRecoverableEducationDegreeLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > 120 || t.includes('|')) return false;
  if (isGarbageEducationDegree(t) || isSpacedLetterFragment(t)) return false;
  if (
    /^\s*(?:masters?|bachelors?|b\.?\s*com|m\.?\s*a\.?|mba|b\.?\s*tech|ph\.?\s*d|llb|pgdca|company secretary\s*\(|pursuing\s+llb)/i.test(
      t
    ) &&
    t.length <= 90
  ) {
    return !/\b(with extensive|in my current role)\b/i.test(t);
  }
  if (/\bpost\s+graduate\s+diploma\b/i.test(t) && t.length <= 120) return true;
  if (!isLikelyEducationLine(t)) return false;
  if (/\b(with extensive|in my current role|managed and|advising|conducting|experience|filings?|portal)\b/i.test(t)) {
    return false;
  }
  if (looksLikeCompanyNameLine(t) && !/\b(bachelor|master|mba|b\.?\s*com|m\.?\s*a|b\.?\s*tech|ph\.?\s*d|llb)\b/i.test(t)) {
    return false;
  }
  if (isCorporateStructurePhrase(t) && !/\b(bachelor|master|mba|b\.?\s*com|m\.?\s*a)\b/i.test(t)) {
    return false;
  }
  if (
    ACHIEVEMENT_FIRM_LINE_RE.test(t) &&
    !/\b(bachelor|master|mba|b\.?\s*com|m\.?\s*a|institute of|articleship|company secretary\s*\()\b/i.test(t)
  ) {
    return false;
  }
  const kind = classifyResumeTextFragment(t).kind;
  if (kind === 'DESIGNATION' || kind === 'COMPANY_NAME') {
    if (!/\b(bachelor|master|mba|b\.?\s*com|m\.?\s*a|b\.?\s*tech|ph\.?\s*d|llb|institute of|articleship)\b/i.test(t)) {
      return false;
    }
  }
  if (/^from\s+/i.test(t) && !/\b(university|college|institute|school)\b/i.test(t)) return false;
  if (t.split(/\s+/).length > 12 || /\.\s/.test(t)) return false;
  if (/^(managed|successfully|matters|including|appointment|manufacturing|management)\b/i.test(t)) {
    return false;
  }
  return true;
}

function extractEducationSectionLines(rawText: string): string[] {
  const lines = rawText.split('\n');
  const out: string[] = [];
  let inEducation = false;

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;
    if (
      /^(?:\d+\s*[\.\):\-]\s*)?education\s*$/i.test(t) ||
      /^(?:\d+[\.\):\-]\s*)?education\b/i.test(t)
    ) {
      inEducation = true;
      continue;
    }
    if (
      inEducation &&
      /^(?:\d+[\.\):\-]\s*)?(?:professional\s+)?(?:experience|employment|work history|skills|projects|certifications|achievements)\b/i.test(
        t
      )
    ) {
      break;
    }
    if (inEducation) out.push(t);
  }

  return out;
}

function parseEducationSectionEntry(line: string): Record<string, unknown> | null {
  const t = line.trim();
  if (!t) return null;

  const fromInstitute = t.match(/^from\s+(.+)$/i);
  if (fromInstitute) {
    const institution = sanitizeFieldText(fromInstitute[1], 160);
    return institution ? { degree: '', institution, school: institution, field: '', year: '' } : null;
  }

  if (!isRecoverableEducationDegreeLine(t)) return null;

  if (/^company secretary\s*\(/i.test(t)) {
    return { degree: sanitizeFieldText(t, 160), institution: '', school: '', field: '', year: '' };
  }

  const degree = sanitizeFieldText(t, 160);
  if (!degree) return null;
  return { degree, institution: '', school: '', field: '', year: '' };
}

function recoverEducationDegreesFromImport(
  builder: Record<string, unknown>,
  rawText: string
): unknown[] {
  const existing = Array.isArray(builder.education)
    ? (builder.education as Record<string, unknown>[])
    : [];
  // Keep recovered degree rows separate — never merge orphan stubs here.
  const sanitized = transformEducationArray(existing, true);
  const seen = new Set(
    sanitized.map((e) => `${e.degree}|${e.institution}`.toLowerCase())
  );
  const recovered: Record<string, unknown>[] = [...sanitized];

  const sources = [
    ...existing,
    ...(Array.isArray(builder.certifications) ? builder.certifications : []),
  ];
  for (const item of sources) {
    const text =
      typeof item === 'string'
        ? item
        : String(
            (item as Record<string, unknown>).degree ||
              (item as Record<string, unknown>).name ||
              (item as Record<string, unknown>).title ||
              ''
          );
    if (!text || !isRecoverableEducationDegreeLine(text)) continue;
    const degree = sanitizeFieldText(text, 160);
    const key = `${degree}|`.toLowerCase();
    if (!degree || seen.has(key)) continue;
    recovered.push({ degree, institution: '', school: '', field: '', year: '' });
    seen.add(key);
  }

  if (rawText.length >= 80) {
    let sectionLines = extractEducationSectionLines(rawText);
    if (sectionLines.length === 0) {
      sectionLines = rawText
        .split('\n')
        .map((l) => l.trim())
        .filter((t) => t && isRecoverableEducationDegreeLine(t));
    }
    for (const t of sectionLines) {
      const entry = parseEducationSectionEntry(t);
      if (!entry) continue;
      const degree = String(entry.degree || '').trim();
      const institution = String(entry.institution || '').trim();
      const key = `${degree}|${institution}`.toLowerCase();
      if (!degree && !institution) continue;
      if (seen.has(key)) continue;
      recovered.push(entry);
      seen.add(key);
    }
  }

  return transformEducationArray(recovered, true);
}

function recoverJobTitleFromRawText(rawText: string): string {
  if (!rawText || rawText.length < 40) return '';
  const normalized = normalizePdfLigatureText(rawText);
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (line.length < 4 || line.length > 140) continue;
    if (/^(address|mobile|email|phone|professional\s+summary|summary|objective)\b/i.test(line)) {
      continue;
    }
    if (line.includes('|')) {
      const title = sanitizeImportJobTitle(line);
      if (title) return title;
    }
    if (looksLikeJobTitleLine(line) && !isPlausiblePersonName(line)) {
      const title = sanitizeImportJobTitle(line);
      if (title) return title;
    }
  }

  const flat = normalized.replace(/\s+/g, ' ').slice(0, 1200);
  const patterns = [
    /\bin\s+(corporate\s+legal\s*,\s*secretarial\s*,\s*compliance)\b/i,
    /\b(corporate\s+legal\s*,\s*secretarial\s*,?\s*compliance[^,.]{0,40})/i,
    /\b((?:senior\s+)?(?:corporate\s+)?(?:legal|company secretary|compliance)\s*(?:&|and)\s*[^,.]{3,50})/i,
    /\b((?:group\s+)?company\s+secretary(?:\s*&\s*compliance\s+officer)?)\b/i,
    /\b((?:senior\s+)?hr\s+generalist)\b/i,
    /\bassignments?\s+in\s+((?:corporate\s+)?legal[^,.]{3,60})/i,
  ];
  for (const re of patterns) {
    const m = flat.match(re);
    if (!m) continue;
    const title = sanitizeImportJobTitle(m[1] || m[0]);
    if (title) return title;
  }
  return '';
}

function recoverSkillsFromRawText(rawText: string, existing: string[]): string[] {
  const seen = new Set(existing.map((s) => s.toLowerCase()));
  const out = [...existing];
  if (!rawText || rawText.length < 80) return out;

  const addSkill = (part: string) => {
    const skill = sanitizeSkillEntry(part);
    if (!skill) return;
    const key = skill.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(skill);
  };

  for (const line of rawText.split('\n')) {
    const t = line.trim();
    if (t.length < 6 || t.length > 90) continue;
    if (!/[|,]/.test(t)) continue;
    if (
      !/compliance|governance|sebi|ipo|fema|fdi|irda|amfi|mca|roc|rbi|secretarial|capital market|due diligence|drhp|regulatory/i.test(
        t
      ) &&
      !/recruitment|payroll|hris|hrms|onboarding|attendance|employee relations|performance management|naukri|linkedin|hr generalist|human resources/i.test(
        t
      )
    ) {
      continue;
    }
    const parts = t
      .split(/[|,]+/)
      .map((p) => p.trim().replace(/[*.]+$/g, ''))
      .filter(Boolean);
    if (parts.length < 2 || parts.length > 10) continue;
    for (const part of parts) {
      if (part.length > 28 || part.split(/\s+/).length > 3) continue;
      if (/^(on|and|in|the|with|my|a|an|of|for|to|officer|legal|head|corporate|board|finance|managed|handling)\b/i.test(part)) {
        continue;
      }
      addSkill(part);
    }
  }

  const hrSkillRe =
    /\b(recruitment|talent acquisition|payroll|hris|hrms|onboarding|offboarding|employee relations|performance management|compensation|benefits|hr operations|hr generalist|human resources|naukri|linkedin hiring|attendance management|leave management|statutory compliance)\b/gi;
  for (const match of rawText.matchAll(hrSkillRe)) {
    addSkill(match[0]);
  }

  return cleanSkills(out).slice(0, 24) as string[];
}

function rehomeMisclassifiedProjects(
  builder: Record<string, unknown>
): Record<string, unknown> {
  const projects = Array.isArray(builder.projects)
    ? ([...builder.projects] as Record<string, unknown>[])
    : [];
  const experience = Array.isArray(builder.experience)
    ? ([...builder.experience] as Record<string, unknown>[])
    : [];
  const kept: Record<string, unknown>[] = [];
  const bullets: string[] = [];

  for (const project of projects) {
    const name = String(project.name || project.title || '').trim();
    const desc = String(project.description || project.Description || '').trim();
    if (!name || isMisclassifiedExperienceProject(name, desc)) {
      const bullet = [name, desc].filter(Boolean).join(' — ').trim();
      if (bullet.length >= 12) bullets.push(bullet);
      continue;
    }
    kept.push(project);
  }

  if (bullets.length && experience.length > 0) {
    const first = { ...experience[0] };
    const existing = String(first.description || first.Description || '').trim();
    first.description = [existing, ...bullets].filter(Boolean).join('\n');
    first.Description = first.description;
    experience[0] = first;
  }

  return {
    ...builder,
    projects: kept,
    Projects: kept,
    experience,
    Experience: experience,
    'Work Experience': experience,
  };
}

function finalizeBuilderContactIdentity(
  builder: Record<string, unknown>,
  mergedImport: Record<string, unknown>,
  email: string,
  locationHint: string,
  rawText = ''
): Record<string, unknown> {
  const out = { ...builder };
  const current =
    [out.firstName, out.lastName]
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .join(' ')
      .trim() || String(out.fullName || out.name || '').trim();

  if (current && isValidatedContactName(current, locationHint)) {
    let first = sanitizePersonName(out.firstName, 80);
    let last = sanitizePersonName(out.lastName, 80);
    let display = [first, last].filter(Boolean).join(' ').trim() || current;
    if (email) {
      display = enrichPartialNameFromEmail(display, email);
      const fromEmail = parseIntelligentNameFromEmail(email);
      const emailCombined = fromEmail
        ? [fromEmail.firstName, fromEmail.lastName].filter(Boolean).join(' ')
        : deriveDisplayNameFromEmail(email);
      const richer = emailCombined
        ? pickRicherFullName(display, emailCombined, email)
        : display;
      if (
        richer &&
        richer !== display &&
        isValidatedContactName(richer, locationHint) &&
        (!isValidatedContactName(display, locationHint) ||
          (richer.split(/\s+/).filter(Boolean).length >
            display.split(/\s+/).filter(Boolean).length &&
            !isEmailDerivedName(display, email)))
      ) {
        const split = splitFullNameWithRejected(richer);
        display = richer;
        first = split.firstName || first;
        last = split.lastName || last;
      }
    }
    if (display) {
      const split = splitFullNameWithRejected(formatDisplayName(display));
      first = split.firstName || first;
      last = split.lastName || last;
      display = [first, last].filter(Boolean).join(' ').trim() || display;
    }
    out.firstName = first;
    out.lastName = last;
    out.fullName = display;
    out.name = display;
    out['Full Name'] = display;
    return out;
  }

  if (current) {
    const additional =
      (out.additionalResumeData as AdditionalResumeData) || emptyAdditionalResumeData();
    const classified = classifyResumeTextFragment(current);
    stashUnclassifiedFragment(
      additional,
      current,
      classified.kind === 'PERSON_NAME' ? 'UNKNOWN' : classified.kind
    );
    out.additionalResumeData = additional;
  }

  const personal = (mergedImport.personalInformation || {}) as Record<string, unknown>;
  const headerName =
    sanitizePersonName(extractNameWithConfidence(rawText), 120) ||
    sanitizePersonName(textParsedNameFromImport(mergedImport), 120);
  const strippedProfile = {
    ...mergedImport,
    firstName: '',
    lastName: '',
    fullName: '',
    name: '',
    personalInformation: { ...personal, firstName: '', lastName: '', fullName: '' },
  };

  const resolved = resolveClassifiedName(strippedProfile, email, headerName, locationHint);
  out.firstName = resolved.firstName;
  out.lastName = resolved.lastName;
  out.fullName = resolved.displayName;
  out.name = resolved.displayName;
  out['Full Name'] = resolved.displayName;
  if (resolved.additionalResumeData) {
    out.additionalResumeData = mergeAdditionalResumeData(
      (out.additionalResumeData as AdditionalResumeData) || emptyAdditionalResumeData(),
      resolved.additionalResumeData
    );
  }
  return out;
}

function isUsableJobHeadline(value: string): boolean {
  if (!value || isGarbageResumeText(value) || isExperienceBlurbFragment(value)) return false;
  if (!sanitizeImportJobTitle(value)) return false;
  const norm = value.trim();
  const lower = norm.toLowerCase();
  if (GENERIC_BUILDER_JOB_TITLES.has(lower)) return false;
  const classified = classifyResumeTextFragment(norm);
  if (classified.kind === 'SECTION_HEADER') return false;
  if (
    /^(?:profile|summary|experience|education|skills?|projects?|certifications?|achievements?|languages?|qualifications?)$/i.test(
      lower
    )
  ) {
    return false;
  }
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
  if (direct && isUsableJobHeadline(direct)) return sanitizeImportJobTitle(direct);

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
    if (fromExp && isUsableJobHeadline(fromExp)) return sanitizeImportJobTitle(fromExp);
  }

  return '';
}

function cleanSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  return normalizeSkillsList(skills);
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

function inferEmploymentType(position: string, company: string): string {
  const p = position.toLowerCase();
  const c = company.toLowerCase();
  if (/intern(ship)?/.test(p)) return 'Internship';
  if (/freelance|contractor|contract/.test(p) || /freelance|contractor/.test(c)) return 'Freelance';
  if (/self[- ]?employed/.test(c) || /self[- ]?employed/.test(p)) return 'Self-employed';
  if (/confidential/.test(c)) return 'Confidential';
  if (/^government\b/.test(c)) return 'Government';
  return '';
}

function transformExperienceArray(experiences: unknown): any[] {
  if (!Array.isArray(experiences)) return [];

  const mapped = experiences
    .map((exp) => sanitizeExperienceEntry((exp ?? {}) as Record<string, unknown>))
    .filter((exp): exp is Record<string, unknown> => exp != null)
    .map((exp, index) => {
      const position = String(
        exp.position || exp.title || exp.designation || exp.role || exp.jobTitle || ''
      );
      const company = String(
        sanitizeExperienceCompanyValue(
          exp.company || exp.Company || exp.organization || exp.employer
        )
      );
      const location = String(exp.location || exp.Location || '');

      const startMonth = toMonthInput(exp.startDate);
      const endRawStr = String(exp.endDate || '').trim();
      const isCurrent =
        exp.current === true ||
        /^(present|current|now|ongoing|running|till date)$/i.test(endRawStr);
      const endMonth = isCurrent ? '' : toMonthInput(endRawStr);

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
      const strippedBody = stripRedundantExperienceDateBodyLines(
        dedupedBody.description,
        dedupedBody.achievements,
        { startDate: startMonth, endDate: endMonth, current: isCurrent }
      );
      const description = strippedBody.description;
      const finalBullets = strippedBody.achievements;

      const duration = isCurrent
        ? (startMonth ? `${startMonth} - Present` : 'Present')
        : computeDuration(startMonth, endMonth);

      const employmentType = inferEmploymentType(position, company);
      const stableId = `exp-${index}-${company.slice(0, 12)}-${position.slice(0, 12)}-${startMonth}`.replace(/\s+/g, '-').toLowerCase();

      return {
        id: stableId,
        title: position,
        designation: position,
        company,
        location,
        startDate: startMonth,
        endDate: endMonth,
        description,
        current: isCurrent,
        isCurrent,
        employmentType,
        achievements: finalBullets,
        bullets: finalBullets,
        bulletPoints: finalBullets,
        Position: position,
        Company: company,
        Location: location,
        Description: description,
        Duration: duration,
      };
    })
    .filter((e) => String(e.company || '').trim() || String(e.title || '').trim());

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
      const headerOnlyKey = `${company}|${title}`.toLowerCase();
      if (headerOnlyKey.replace(/\|/g, '').length > 0 && seen.has(headerOnlyKey)) return false;
      if (headerOnlyKey.replace(/\|/g, '').length > 0) seen.add(headerOnlyKey);
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
  ).map((exp) => {
    const endRawStr = String(exp.endDate || '').trim();
    const isCurrent =
      exp.current === true ||
      /^(present|current|now|ongoing|running|till date)$/i.test(endRawStr);
    const title = String(exp.position || exp.title || '');
    const company = String(exp.company || '');
    const startMonth = String(exp.startDate || '');
    const endMonth = isCurrent ? '' : String(exp.endDate || '');
    const achievements = Array.isArray(exp.achievements) ? exp.achievements : [];
    return {
      id: `exp-${company.slice(0, 12)}-${title.slice(0, 12)}-${startMonth}`.replace(/\s+/g, '-').toLowerCase(),
      title,
      designation: title,
      company,
      location: String(exp.location || ''),
      startDate: startMonth,
      endDate: endMonth,
      description: String(exp.description || ''),
      current: isCurrent,
      isCurrent,
      employmentType: inferEmploymentType(title, company),
      achievements,
      bullets: achievements,
      bulletPoints: achievements,
      Position: title,
      Company: company,
      Location: String(exp.location || ''),
      Description: String(exp.description || ''),
      Duration: isCurrent
        ? startMonth
          ? `${startMonth} - Present`
          : 'Present'
        : computeDuration(startMonth, endMonth),
    };
  });

  // Preserve parser/upload order — do not re-sort imported experiences.
  return deduped;
}

function transformEducationArray(education: unknown, isCustomParser = false): any[] {
  if (!Array.isArray(education)) return [];

  const merged = isCustomParser
    ? (education.filter((e) => e != null) as Record<string, unknown>[])
    : mergeOrphanEducationEntries(
        education.filter((e) => e != null) as Record<string, unknown>[]
      );

  const mapped = merged
    .map((edu) => sanitizeEducationEntry((edu ?? {}) as Record<string, unknown>))
    .filter((edu): edu is Record<string, unknown> => edu != null)
    .map((edu) => {
      const institution = String(
        edu.institution || edu.school || edu.college || edu.university || edu.academy || ''
      );
      const degree = String(edu.degree || edu.Degree || edu.qualification || '');
      const field = String(edu.field || edu.Field || edu.major || '');
      const gpa = String(edu.gpa || edu.cgpa || edu.GPA || edu.CGPA || edu.percentage || '');

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
    const key = isCustomParser
      ? `${edu.institution}|${edu.degree}|${edu.year}|${edu.field}`.toLowerCase()
      : `${edu.institution}|${edu.degree}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function transformProjectsArray(
  projects: unknown,
  jobTitle = '',
  experienceTitles: string[] = []
): any[] {
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
    .filter((p): p is Record<string, unknown> => p != null)
    .filter((p) => {
      const name = String(p.name || p.title || '').trim();
      const desc = String(p.description || p.Description || '').trim();
      const techRaw = p.technologies ?? p.Technologies ?? p.tech_stack;
      const techEmpty =
        techRaw == null ||
        techRaw === '' ||
        (Array.isArray(techRaw) ? techRaw.length === 0 : !String(techRaw).trim());
      const url = String(p.url || p.link || p.Link || '').trim();
      const startDate = String(p.startDate || p.start_date || '').trim();
      const endDate = String(p.endDate || p.end_date || '').trim();
      const datesEmpty = !startDate && !endDate;

      const n = name.toLowerCase();
      const equalsJobTitle =
        (!!jobTitle && n === jobTitle.toLowerCase().trim()) ||
        experienceTitles.some((title) => n === String(title || '').toLowerCase().trim());

      if (equalsJobTitle && !desc && techEmpty && !url && datesEmpty) {
        return false;
      }
      if (
        name &&
        isJobTitleMisclassifiedAsProject(name, jobTitle, experienceTitles) &&
        !desc &&
        techEmpty &&
        !url &&
        datesEmpty
      ) {
        return false;
      }
      if (name && isMisclassifiedExperienceProject(name, desc)) {
        return false;
      }
      return true;
    });
  console.log('[import-transformer] final projects.length', transformed.length);
  return transformed;
}

function transformCertificationsArray(
  certifications: unknown,
  education: unknown = []
): any[] {
  if (!Array.isArray(certifications)) return [];

  const eduFingerprints = new Set<string>();
  if (Array.isArray(education)) {
    for (const e of education) {
      if (!e || typeof e !== 'object') continue;
      const rec = e as Record<string, unknown>;
      const degree = String(rec.degree || rec.Degree || rec.title || '').trim().toLowerCase();
      const institution = String(
        rec.institution || rec.school || rec.university || rec.Institution || ''
      )
        .trim()
        .toLowerCase();
      if (degree) eduFingerprints.add(degree);
      if (institution) eduFingerprints.add(institution);
      if (degree && institution) eduFingerprints.add(`${degree}|${institution}`);
    }
  }

  const certMatchesEducation = (name: string, issuer: string): boolean => {
    const n = name.trim().toLowerCase();
    const i = issuer.trim().toLowerCase();
    if (eduFingerprints.has(n) || (i && eduFingerprints.has(i))) return true;
    if (i && eduFingerprints.has(`${n}|${i}`)) return true;
    for (const fp of eduFingerprints) {
      if (fp.length >= 8 && (n.includes(fp) || fp.includes(n))) return true;
    }
    return false;
  };

  return certifications
    .map((c) => sanitizeCertificationEntry(c))
    .filter((c): c is Record<string, unknown> => {
      if (!c) return false;
      const name = String(c.name || '');
      const issuer = String(c.issuer || '');
      return !certMatchesEducation(name, issuer);
    })
    .map((c) => ({
      name: String(c.name || ''),
      issuer: String(c.issuer || ''),
      date: String(c.date || ''),
      link: String(c.url || c.link || ''),
      url: String(c.url || c.link || ''),
      credentialId: String(c.credentialId || ''),
      expiryDate: String(c.expiryDate || ''),
    }));
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
    if (!t || t.length < 8) return;
    const key = t.toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
    if (seen.has(key)) return;
    seen.add(key);
    parts.push(t);
  };

  add(mergedImport.summary);
  add(mergedImport.professionalSummary);
  add(mergedImport['Professional Summary']);
  add(mergedImport.executiveSummary);
  add(mergedImport.careerSummary);
  add(mergedImport.professionalProfile);
  add(mergedImport['Professional Profile']);
  add(mergedImport.careerProfile);
  add(mergedImport.profile);
  add(mergedImport.aboutMe);
  add(mergedImport.objective);
  add(mergedImport.bio);
  add(textParsed?.summary);
  add(recoveredSummary);

  return parts.join('\n\n').slice(0, 4000);
}

function transformAchievementsArray(achievements: unknown, trustParserList = false): string[] {
  if (!Array.isArray(achievements)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of achievements) {
    const value = sanitizeAchievementEntry(a);
    if (!value || isMisplacedAchievementLine(value)) continue;
    if (!trustParserList && !shouldKeepAsGlobalAchievement(value)) continue;
    if (isExperienceResponsibility(value) && !shouldKeepAsGlobalAchievement(value)) continue;
    if (isMisclassifiedExperienceProject(value)) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out.slice(0, 12);
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


function logImportMappingValidation(
  t: Record<string, any>,
  source?: Record<string, unknown>
): void {
  const issues: string[] = [];
  const recoveries: string[] = [];

  if (!sanitizeFieldText(t.summary)) {
    issues.push('summary:missing');
  } else if (source) {
    const rawSummaryLen = String(
      source.summary || source.professionalSummary || source.bio || ''
    ).length;
    const builtSummaryLen = String(t.summary || '').length;
    if (rawSummaryLen > builtSummaryLen + 80) {
      issues.push(`summary:truncated:${builtSummaryLen}/${rawSummaryLen}`);
    }
  }

  const experience = Array.isArray(t.experience) ? t.experience : [];
  const rawExperience = source
    ? firstNonEmptyArray(source, ['experience', 'workExperience', 'Work Experience', 'Experience'])
    : [];
  const rawCompanyCount = countExperienceWithPlausibleCompany(rawExperience);

  experience.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return;
    const exp = entry as Record<string, unknown>;
    const company = String(exp.company || exp.Company || '').trim();
    const title = String(exp.title || exp.position || exp.designation || '').trim();
    const description = String(exp.description || exp.Description || '').trim();
    const bullets = Array.isArray(exp.achievements) ? exp.achievements.length : 0;

    if (!company) issues.push(`experience[${index}]:missing-company`);
    else if (
      rawExperience[index] &&
      typeof rawExperience[index] === 'object' &&
      !isPlausibleExperienceCompany(
        String(
          (rawExperience[index] as Record<string, unknown>).company ||
            (rawExperience[index] as Record<string, unknown>).organization ||
            ''
        )
      )
    ) {
      recoveries.push(`experience[${index}]:company-recovered-from-mapping`);
    }
    if (!title) issues.push(`experience[${index}]:missing-designation`);
    const rawLoc =
      rawExperience[index] && typeof rawExperience[index] === 'object'
        ? String((rawExperience[index] as Record<string, unknown>).location || '').trim()
        : '';
    const builtLoc = String(exp.location || exp.Location || '').trim();
    if (rawLoc && !builtLoc) {
      issues.push(`experience[${index}]:location-lost`);
    }
    if (!description && bullets === 0) {
      issues.push(`experience[${index}]:missing-description`);
    }
    if (company && title && company.toLowerCase() === title.toLowerCase()) {
      issues.push(`experience[${index}]:company-equals-title`);
    }
    if (company && looksLikeJobTitleLine(company) && !looksLikeCompanyNameLine(company)) {
      issues.push(`experience[${index}]:company-looks-like-title:${company.slice(0, 40)}`);
    }
    if (title && looksLikeCompanyNameLine(title) && !looksLikeJobTitleLine(title)) {
      issues.push(`experience[${index}]:title-looks-like-company:${title.slice(0, 40)}`);
    }
  });

  if (!Array.isArray(t.skills) || t.skills.length === 0) {
    issues.push('skills:empty');
  } else if (source) {
    const rawSkills = firstNonEmptyArray(source, ['skills', 'Skills', 'technicalSkills']);
    const rawCount = Array.isArray(rawSkills) ? rawSkills.length : 0;
    if (rawCount > t.skills.length + 3) {
      issues.push(`skills:loss:${t.skills.length}/${rawCount}`);
    }
  }
  if (!Array.isArray(t.education) || t.education.length === 0) {
    issues.push('education:empty');
  }

  const projects = Array.isArray(t.projects) ? t.projects : [];
  if (projects.length === 0) {
    issues.push('projects:empty');
  } else {
    projects.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') return;
      const rec = entry as Record<string, unknown>;
      const name = String(rec.name || rec.title || '').trim();
      if (!name) issues.push(`projects[${index}]:missing-name`);
      else if (looksLikeJobTitleLine(name)) {
        issues.push(`projects[${index}]:name-looks-like-title:${name.slice(0, 40)}`);
      }
    });
  }

  if (issues.length > 0) {
    console.warn('[import-transformer] mapping validation', {
      issues,
      recoveries,
      experienceCount: experience.length,
      rawCompanyCount,
      builtCompanyCount: countExperienceWithPlausibleCompany(experience),
    });
  }
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
