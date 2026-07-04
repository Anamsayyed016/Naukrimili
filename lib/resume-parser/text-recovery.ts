/**
 * Single-source text-based resume extractor.
 *
 * Two public roles:
 *  1. `recoverFromRawText`  — fill gaps in fields the AI/Affinda missed (identity-only).
 *  2. `extractResumeFromText` — full section-aware extraction when no AI parser is available.
 *
 * NO hardcoded skill keyword lists, NO fake summaries. We only emit what we can defensibly
 * read from the resume text. Empty arrays mean "didn't find any" — that is the truth and the
 * downstream transformer + form know how to handle it.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { isImportFieldTraceEnabled, traceImportStageOutput } from '@/lib/resume-parser/import-field-trace';
import {
  emptyAdditionalResumeData,
  isFirmOrLocationNamePhrase,
  type AdditionalResumeData,
} from '@/lib/resume-parser/field-classification';
import {
  isPlausiblePersonName,
  isLikelyJobTitle,
  isLikelyCompanyName,
  isValidExperienceEntry,
  mergeOrphanExperienceEntries,
  mergeOrphanEducationEntries,
  looksLikeCompanyNameLine,
  looksLikeStandaloneLocationLine,
  pickBestNameFromCandidates,
  isResumeSectionHeadingLine,
  sanitizeSkillEntry,
  looksLikeJobTitleLine,
  normalizeSkillsList,
  sanitizeExperienceDateValue,
  reconcileExperienceHeaderFields,
  isPlausibleCertificationEntry,
  isExperienceDateOrDurationToken,
  type NameCandidate,
} from '@/lib/resume-parser/import-sanitize';

/* ------------------------------------------------------------------ */
/*  Recovery layer — only fills missing identity/links                */
/* ------------------------------------------------------------------ */

interface RecoveredText {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
}

const EMPTY_RECOVERY: RecoveredText = {
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
};

export function recoverFromRawText(rawText: unknown): RecoveredText {
  if (typeof rawText !== 'string' || rawText.length < 20) return { ...EMPTY_RECOVERY };

  const text = rawText;
  const out: RecoveredText = { ...EMPTY_RECOVERY };

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) out.email = emailMatch[0].trim();

  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/
  );
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      out.phone = phoneMatch[0].trim();
    }
  }

  const linkedinMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([A-Za-z0-9_-]+)/i
  );
  if (linkedinMatch) {
    out.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
  }

  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_-]+)/i);
  if (githubMatch) {
    out.github = `https://github.com/${githubMatch[1]}`;
  }

  const urlMatches = text.match(/https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/[^\s)]*)?/g);
  if (urlMatches) {
    const portfolio = urlMatches.find(
      (u) => !/linkedin\.com|github\.com/i.test(u) && u.length < 200
    );
    if (portfolio) out.portfolio = portfolio.trim();
  }

  const summaryBlock = extractSection(text, SECTION_ALIASES.summary);
  out.summary = summaryBlock
    ? truncateSummaryAtSectionBoundary(summaryBlock.body).trim()
    : '';
  // Match the downstream import-transformer cap so we don't truncate twice.
  if (out.summary.length > 4000) out.summary = out.summary.slice(0, 4000);

  return out;
}

export function mergeRecovery<T extends Record<string, unknown>>(
  base: T,
  recovered: Partial<RecoveredText>
): T {
  const merged: Record<string, unknown> = { ...base };
  for (const key of Object.keys(recovered) as Array<keyof RecoveredText>) {
    const current = merged[key];
    const next = recovered[key];
    if (next && (!current || (typeof current === 'string' && current.trim() === ''))) {
      merged[key] = next;
    }
  }
  return merged as T;
}

/* ------------------------------------------------------------------ */
/*  Full text-based extractor (replaces hardcoded fallbacks)           */
/* ------------------------------------------------------------------ */

/**
 * Section aliases — universal coverage across resume styles.
 *
 * Designed to match the LARGEST realistic alias set per section without
 * accidentally swallowing other sections. Every alias is matched
 * case-insensitively and with trailing punctuation/separator chars stripped
 * (see `isHeadingLineFor`). Combined headings like "Education & Certifications"
 * also work because of the `& / and / / / +` split in that function.
 */
const SECTION_ALIASES = {
  summary: [
    'summary', 'professional summary', 'executive summary', 'career summary',
    'career synopsis', 'executive synopsis',
    'objective', 'career objective', 'professional objective',
    'profile', 'professional profile', 'career profile',
    'professional highlights', 'career highlights', 'highlights', 'key highlights',
    'about', 'about me', 'introduction', 'overview', 'bio', 'biography',
  ],
  experience: [
    'experience', 'work experience', 'professional experience', 'work history',
    'employment', 'employment history', 'career history', 'professional history',
    'professional background',
    'professional journey', 'board experience', 'legal experience',
    'job experience', 'career experience', 'relevant experience', 'industry experience',
    'positions held', 'employment record',
    'internship', 'internships', 'internship experience', 'training experience',
    'consulting experience', 'leadership experience', 'management experience',
    'corporate experience', 'industrial experience', 'organizational experience',
  ],
  education: [
    'education', 'educations', 'academic background', 'academic history', 'academic record',
    'academic qualifications', 'educational qualifications', 'qualifications',
    'academic qualification', 'educational qualification',
    'cs articleship', 'articleship',
    'educational background', 'degrees', 'schooling', 'studies', 'academics',
  ],
  skills: [
    'skills', 'technical skills', 'core skills', 'key skills',
    'competencies', 'technical competencies', 'core competencies', 'key competencies',
    'technologies', 'tech stack', 'tools', 'toolkit',
    'expertise', 'areas of expertise', 'specialties', 'specializations',
    'proficiencies', 'capabilities', 'strengths',
    'soft skills', 'hard skills', 'professional skills',
  ],
  projects: [
    'projects', 'project', 'personal projects', 'key projects', 'major projects',
    'professional projects', 'academic projects', 'notable projects', 'portfolio projects', 'portfolio',
    'featured projects', 'software projects', 'applications developed',
    'selected work', 'work samples', 'samples of work',
    'case studies', 'case study', 'select projects',
    'assignments', 'key engagements', 'major work', 'handled projects',
    'side projects', 'open source projects', 'open source contributions',
  ],
  certifications: [
    'certifications', 'certificates', 'licenses', 'licences',
    'licenses and certifications', 'licences and certifications',
    'certifications and licenses',
    'professional certifications', 'professional development',
    'professional qualification', 'professional qualifications',
    'accreditation', 'accreditations',
    'training', 'trainings', 'courses', 'online courses',
    'workshops', 'continuing education',
  ],
  languages: [
    'languages', 'language skills', 'spoken languages',
    'language proficiency', 'language proficiencies', 'languages known',
  ],
  achievements: [
    'achievements', 'key achievements', 'notable achievements', 'professional achievements',
    'key accomplishments', 'notable accomplishments', 'major accomplishments',
    'accomplishments', 'awards', 'awards and honors', 'awards & honors',
    'honors', 'honours', 'honors and awards', 'honours and awards',
    'recognition', 'recognitions', 'awards and recognition',
  ],
  memberships: [
    'memberships', 'professional memberships', 'professional bodies',
    'membership', 'affiliations', 'professional affiliations',
  ],
  publications: [
    'publications', 'research publications', 'papers', 'patents',
  ],
  volunteer: [
    'volunteer', 'volunteer work', 'volunteer experience', 'community service',
  ],
  interests: [
    'interests', 'personal interests', 'hobbies', 'hobbies and interests',
    'interests and hobbies', 'extracurricular', 'extracurricular activities',
    'activities', 'passions',
  ],
} as const;

const ALL_HEADINGS = Object.values(SECTION_ALIASES).flat();

const DEGREE_PATTERNS = [
  /bachelor(?:'s)?(?:\s+of\s+\w+)?/i,
  /master(?:'s)?(?:\s+of\s+\w+)?/i,
  /\bph\.?d\.?\b/i,
  /\bdoctor(?:ate)?\b/i,
  /\bb\.?(?:s|a|tech|e|com|sc|ba|ed)\.?\b/i,
  /\bm\.?(?:s|a|tech|e|com|sc|ba|ed|ba)\.?\b/i,
  /\bmba\b/i,
  /\bbba\b/i,
  /diploma/i,
  /associate(?:'s)?(?:\s+degree)?/i,
  /\bhigh\s+school\b/i,
  /\bhsc\b/i,
  /\bssc\b/i,
];

const COMPANY_MARKERS =
  /\b(?:inc\.?|ltd\.?|llc|corp(?:oration)?|pvt\.?\s*ltd\.?|private\s+limited|gmbh|llp|group|enterprises|solutions|technologies|systems|consulting|services|company|co\.?)\b/i;
const ROLE_MARKERS = /\b(?:engineer|developer|architect|manager|director|lead|head|consultant|analyst|designer|administrator|administrator|specialist|coordinator|associate|executive|officer|programmer|intern|trainee|founder|owner|ceo|cto|cfo|coo|vp|president|principal|scientist|researcher)\b/i;

const MONTH_YEAR_DATE_RANGE_RE =
  /((?:[A-Za-z]{3,9}\.?\s+)?(?:19|20)\d{2})\s*[-–—~]\s*(?:to\s+)?((?:[A-Za-z]{3,9}\.?\s+)?(?:19|20)\d{2}|present|current|now|ongoing|running|till\s*date)/i;

const YEAR_DATE_RANGE_RE =
  /\b((?:19|20)\d{2})\s*[-–—~]\s*(?:to\s+)?((?:19|20)\d{2}|present|current|now|ongoing|running|till\s*date)\b/i;

function parseDateRangeFromLine(line: string): { start: string; end: string; current: boolean } | null {
  const l = line.trim();
  if (!l) return null;

  let m = l.match(MONTH_YEAR_DATE_RANGE_RE);
  if (!m) m = l.match(YEAR_DATE_RANGE_RE);
  if (!m) return null;

  const start = sanitizeExperienceDateValue(m[1]?.trim() || '');
  const endRaw = (m[2] || '').trim();
  if (/^(present|current|now|ongoing|running|till\s*date)$/i.test(endRaw)) {
    return { start, end: '', current: true };
  }
  const normalizedEnd = sanitizeExperienceDateValue(endRaw);
  if (/^present$/i.test(normalizedEnd)) {
    return { start, end: '', current: true };
  }
  return { start, end: normalizedEnd, current: false };
}

function lineHasDateRange(line: string): boolean {
  return MONTH_YEAR_DATE_RANGE_RE.test(line) || YEAR_DATE_RANGE_RE.test(line);
}

/** Backward-compatible alias used by boundary checks (month+year ranges). */
const DATE_RANGE_REGEX = MONTH_YEAR_DATE_RANGE_RE;

function isExperienceBulletLine(line: string): boolean {
  const t = line.trim();
  return /^[•\-\*\u2022\u2023\u25aa\u25cf\u2013\u2014]\s+/.test(t) || /^[oO]\s+/.test(t) || /^\d+[\.\)]\s+/.test(t);
}

/** True when a line inside an experience body marks the start of the next job block. */
function isNextJobBoundaryLine(line: string, nextLine?: string): boolean {
  const l = line.trim();
  const n = (nextLine || '').trim();
  if (!l || isExperienceBulletLine(l)) return false;
  if (lineHasDateRange(l)) return true;
  if (looksLikeCompanyNameLine(l) && n && lineHasDateRange(n)) return true;
  if (looksLikeJobTitleLine(l) && n && lineHasDateRange(n)) return true;
  if (
    looksLikeJobTitleLine(l) &&
    l.length < 90 &&
    (/\s@\s/.test(l) || /\s[-–—]\s+/.test(l))
  ) {
    return true;
  }
  if (/^(self[- ]?employed|freelance|confidential|independent contractor)$/i.test(l)) return true;
  return false;
}
const SINGLE_DATE_REGEX = /((?:[A-Za-z]{3,9}\.?\s+)?(?:19|20)\d{2})/;

/**
 * Gentle PDF cleanup that PRESERVES newlines.
 * Section detection requires line boundaries — never collapse \n to space here.
 *
 * Important: we preserve common typographic chars (em/en dashes, bullets, smart quotes,
 * accented Latin) so resumes from non-English speakers keep their content intact.
 * We only strip the genuinely-broken parser artefacts (private-use codepoints, BOM,
 * zero-width chars, box-drawing chars, C1 controls).
 */
export function cleanResumeTextPreservingLines(input: string): string {
  return (input || '')
    .replace(/\r\n/g, '\n')
    // Page break (formfeed) — PDF parsers often inject this between pages.
    // Treat it as a newline so headings at the top of page 2/3/4 are
    // detectable by the heading-line scanner. Without this, "EXPERIENCE\fJohn"
    // would never match the EXPERIENCE alias.
    .replace(/\u000C/g, '\n')
    // Vertical tab — same idea, occasional layout artifact.
    .replace(/\u000B/g, '\n')
    .replace(/^%PDF.*$/gm, '')
    .replace(/^%[0-9]+.*$/gm, '')
    .replace(/^<<.*$/gm, '')
    .replace(/^>>.*$/gm, '')
    .replace(/^[0-9]+\s+[0-9]+\s+obj.*$/gm, '')
    .replace(/^endobj.*$/gm, '')
    .replace(/^stream.*$/gm, '')
    .replace(/^endstream.*$/gm, '')
    .replace(/^xref.*$/gm, '')
    .replace(/^trailer.*$/gm, '')
    .replace(/^startxref.*$/gm, '')
    .replace(/^%%EOF.*$/gm, '')
    // BOM + replacement char + zero-width + bidi controls
    .replace(/[\uFEFF\uFFFD\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '')
    // Private use area (parser garbage that renders as ߮ ࡆ etc.)
    .replace(/[\uE000-\uF8FF]/g, '')
    // PDF-parser garbage in seldom-used scripts that mis-render as ߮ ࡆ.
    // Nko / Samaritan / Mandaic / Thaana / Syriac Supplement / Arabic Ext-A
    .replace(/[\u0700-\u074F\u0780-\u07BF\u0800-\u085F\u0860-\u086F\u08A0-\u08FF]/g, ' ')
    // Box-drawing / geometric shapes (PDF separator artefacts)
    .replace(/[\u2500-\u259F\u2630-\u268F]/g, ' ')
    // C1 control characters
    .replace(/[\u0080-\u009F]/g, ' ')
    // Collapse runs of spaces/tabs WITHIN a line, but preserve \n and column tabs
    .replace(/\t/g, '\u0001')
    .replace(/[ ]+/g, ' ')
    .replace(/\u0001/g, '\t')
    // Collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Top-level: parse a resume's raw text into the same shape Affinda/AI returns.
 * Designed to be permissive — emits empty arrays when uncertain, never fabricates.
 */
export function extractResumeFromText(rawText: string): ExtractedResumeData {
  const { text } = prepareResumeTextInline(rawText || '');

  const result: ExtractedResumeData = {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    hobbies: [],
    achievements: [],
    confidence: 0,
    rawText: text,
  };

  if (text.length < 30) return result;

  // 1. Identity recovery
  const id = recoverFromRawText(text);
  result.email = id.email;
  result.phone = id.phone;
  result.linkedin = id.linkedin;
  result.portfolio = id.github || id.portfolio;
  result.fullName = extractNameWithConfidence(text);
  result.location = extractLocation(text);

  // 2. Section-driven extraction
  const summaryBlock = extractSection(text, SECTION_ALIASES.summary);
  result.summary = summaryBlock
    ? truncateSummaryAtSectionBoundary(summaryBlock.body).trim().slice(0, 4000)
    : '';

  const skillsBlock = extractSection(text, SECTION_ALIASES.skills);
  if (skillsBlock) {
    result.skills = parseSkills(skillsBlock.body);
  }

  const expBlock = extractSection(text, SECTION_ALIASES.experience);
  if (expBlock) {
    result.experience = parseExperience(expBlock.body);
  }

  const eduBlock = extractSection(text, SECTION_ALIASES.education);
  if (eduBlock) {
    const { eduText, certText: eduCertText } = splitEducationAndCertificationBody(eduBlock);
    if (eduText) result.education = parseEducation(eduText);
    if (eduCertText) {
      result.certifications = mergeCertificationLists(
        result.certifications,
        parseCertifications(eduCertText)
      );
    }
  }

  const projBlock = extractSection(text, SECTION_ALIASES.projects);
  if (projBlock) {
    result.projects = parseProjects(projBlock.body);
  }

  const interestsBlock = extractSection(text, SECTION_ALIASES.interests);
  if (interestsBlock) {
    result.hobbies = parseHobbiesList(interestsBlock.body);
  }

  const achievementsBlock = extractSection(text, SECTION_ALIASES.achievements);
  if (achievementsBlock) {
    result.achievements = parseAchievementsList(achievementsBlock.body);
  }

  const unmapped = extractAdditionalResumeDataFromText(text);
  if (unmapped.achievements.length > 0) {
    const seen = new Set((result.achievements || []).map((a) => a.toLowerCase()));
    for (const item of unmapped.achievements) {
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.achievements = [...(result.achievements || []), item];
    }
  }

  // Certifications + Languages — supports combined heading
  // "CERTIFICATIONS & LANGUAGES" by splitting body around inline subheaders.
  const certBlock = extractSection(text, SECTION_ALIASES.certifications);
  const langBlock = extractSection(text, SECTION_ALIASES.languages);
  const { certText, langText } = splitCombinedCertLangBlock(certBlock, langBlock);
  if (certText) result.certifications = parseCertifications(certText);
  if (langText) result.languages = parseLanguages(langText);

  // 3. Confidence
  result.confidence = scoreConfidence(result);

  if (isImportFieldTraceEnabled()) {
    traceImportStageOutput('4_text_recovery_output', result, 'text-recovery');
  }

  return result;
}

const PROFESSIONAL_QUAL_SUBHEADER_RE =
  /^\s*(?:professional\s+qualifications?|certifications?|licenses?|licences?|training|accreditations?)\s*:?\s*$/i;

const EDUCATION_SUBHEADER_RE =
  /^\s*(?:education|academic\s+qualifications?|educational\s+qualifications?|degrees?)\s*:?\s*$/i;

const CERT_LINE_HEURISTIC_RE =
  /\b(?:IATA|UFTAA|PMP|AWS|Google|Microsoft|certified|certification|license|licence|accredit|diploma\s+course|training\s+course|chartered|CPA|CFA)\b/i;

/**
 * When an Education section also contains Professional Qualifications / certs,
 * split the body so degrees stay in education and certs go to certifications.
 */
function splitEducationAndCertificationBody(block: SectionMatch): {
  eduText: string;
  certText: string;
} {
  const lines = block.body.split('\n');
  const isCombined =
    /(?:education|academic)\s*(?:&|and|\/)\s*(?:professional\s+qualification|certification)/i.test(
      block.heading
    ) || /professional\s+qualification/i.test(block.heading);

  const profStart = lines.findIndex((l) => PROFESSIONAL_QUAL_SUBHEADER_RE.test(l.trim()));
  const eduStart = lines.findIndex((l) => EDUCATION_SUBHEADER_RE.test(l.trim()));

  if (profStart >= 0 || eduStart >= 0 || isCombined) {
    const markers = [
      { kind: 'edu' as const, idx: eduStart },
      { kind: 'cert' as const, idx: profStart },
    ]
      .filter((m) => m.idx >= 0)
      .sort((a, b) => a.idx - b.idx);

    if (markers.length >= 1) {
      const result = { eduText: '', certText: '' };
      for (let i = 0; i < markers.length; i++) {
        const start = markers[i].idx + 1;
        const end = i + 1 < markers.length ? markers[i + 1].idx : lines.length;
        const body = lines.slice(start, end).join('\n').trim();
        if (markers[i].kind === 'edu') result.eduText = body;
        else result.certText = body;
      }
      if (!result.eduText && profStart > 0) {
        result.eduText = lines.slice(0, profStart).join('\n').trim();
      }
      if (!result.certText && profStart >= 0) {
        result.certText = lines.slice(profStart + 1).join('\n').trim();
      }
      if (result.eduText || result.certText) return result;
    }
  }

  const eduLines: string[] = [];
  const certLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (PROFESSIONAL_QUAL_SUBHEADER_RE.test(trimmed) || EDUCATION_SUBHEADER_RE.test(trimmed)) {
      continue;
    }
    if (CERT_LINE_HEURISTIC_RE.test(trimmed) && !DEGREE_PATTERNS.some((p) => p.test(trimmed))) {
      certLines.push(trimmed);
    } else {
      eduLines.push(trimmed);
    }
  }

  if (certLines.length && eduLines.length) {
    return { eduText: eduLines.join('\n').trim(), certText: certLines.join('\n').trim() };
  }

  return { eduText: block.body, certText: '' };
}

function mergeCertificationLists(
  existing: NonNullable<ExtractedResumeData['certifications']>,
  incoming: NonNullable<ExtractedResumeData['certifications']>
): NonNullable<ExtractedResumeData['certifications']> {
  const seen = new Set(existing.map((c) => c.name.toLowerCase()));
  const out = [...existing];
  for (const c of incoming) {
    if (!isPlausibleCertificationEntry(c.name, c.issuer || '')) continue;
    const key = c.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/**
 * Resumes commonly use "CERTIFICATIONS & LANGUAGES" as a single heading.
 * When the combined heading is detected, both `certBlock` and `langBlock` will
 * point to the SAME section text. We split the body by any inline subheader
 * (e.g. "Languages" / "Certifications") so we don't double-parse the same items.
 */
function splitCombinedCertLangBlock(
  certBlock: SectionMatch | null,
  langBlock: SectionMatch | null
): { certText: string; langText: string } {
  // Distinct sections — use each as-is
  if (certBlock && langBlock && certBlock.start !== langBlock.start) {
    return { certText: certBlock.body, langText: langBlock.body };
  }
  // Combined: same section captured under both heading lookups
  const block = certBlock || langBlock;
  if (!block) return { certText: '', langText: '' };

  const isCombined = /(certificat\w*\s*(?:&|and|\/)\s*languag\w*|languag\w*\s*(?:&|and|\/)\s*certificat\w*)/i.test(
    block.heading
  );
  if (!isCombined && certBlock && !langBlock) return { certText: block.body, langText: '' };
  if (!isCombined && langBlock && !certBlock) return { certText: '', langText: block.body };

  // Split body by subheader lines or by language pattern
  const lines = block.body.split('\n');
  const langStart = lines.findIndex((l) => /^\s*languag\w*\s*:?\s*$/i.test(l.trim()));
  const certStart = lines.findIndex((l) => /^\s*certificat\w*\s*:?\s*$/i.test(l.trim()));

  if (langStart >= 0 || certStart >= 0) {
    const order = [
      { name: 'cert', idx: certStart },
      { name: 'lang', idx: langStart },
    ]
      .filter((p) => p.idx >= 0)
      .sort((a, b) => a.idx - b.idx);
    const result = { certText: '', langText: '' };
    for (let i = 0; i < order.length; i++) {
      const start = order[i].idx + 1;
      const end = i + 1 < order.length ? order[i + 1].idx : lines.length;
      const body = lines.slice(start, end).join('\n').trim();
      if (order[i].name === 'cert') result.certText = body;
      else result.langText = body;
    }
    // Anything BEFORE the first subheader belongs to the section that wasn't named first.
    // Already covered by the slicing above.
    return result;
  }

  // Heuristic split: lines that match a language pattern (e.g. "English (Fluent)")
  // belong to languages; everything else is certifications.
  // Standalone subheader lines ("Languages", "Certifications", etc.) are dropped.
  const langLines: string[] = [];
  const certLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\s*(languag\w*|certificat\w*)\s*:?\s*$/i.test(trimmed)) continue;
    if (isLikelyLanguageLine(trimmed)) langLines.push(trimmed);
    else certLines.push(trimmed);
  }
  return {
    certText: certLines.join('\n').trim(),
    langText: langLines.join('\n').trim(),
  };
}

const LIKELY_LANGUAGE_RE = /^(?:[A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)?)\s*(?:\(([^)]{3,30})\)|[-–—:|]\s*(native|fluent|professional|conversational|intermediate|basic|beginner|advanced|proficient)\b)\s*\.?$/i;
function isLikelyLanguageLine(line: string): boolean {
  return LIKELY_LANGUAGE_RE.test(line);
}

/* ------------------------------------------------------------------ */
/*  Section detection                                                  */
/* ------------------------------------------------------------------ */

interface SectionMatch {
  heading: string;
  start: number;
  end: number;
  body: string;
}

/**
 * Find the body of the first section that matches any of the alias headings.
 * Body ends at the next recognized section heading or end of text.
 */
function extractSection(text: string, aliases: readonly string[]): SectionMatch | null {
  const lines = text.split('\n');
  const headingIndex = findHeadingLineIndex(lines, aliases);
  if (headingIndex < 0) return null;

  // Find next heading from ANY alias group below this one
  let endLine = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    if (isAnyHeadingLine(lines[i])) {
      endLine = i;
      break;
    }
  }

  const headingLine = lines[headingIndex];
  const bodyLines = lines.slice(headingIndex + 1, endLine);

  // Remove leading separator chars (e.g. underline rows of "===")
  while (
    bodyLines.length > 0 &&
    /^[\s=_\-\u2014\u2013]+$/.test(bodyLines[0])
  ) {
    bodyLines.shift();
  }

  // Also strip inline trailing colon body on heading line — sometimes the
  // first content is on the heading line itself: "Skills: Python, JS, ..."
  let inlineRemainder = '';
  const inlineMatch = headingLine.match(/^[\s\W]*(?:[A-Za-z][A-Za-z ]+?)\s*:\s*(.+)$/);
  if (inlineMatch) inlineRemainder = inlineMatch[1].trim();

  const body = [inlineRemainder, ...bodyLines].filter(Boolean).join('\n').trim();

  return {
    heading: headingLine.trim(),
    start: headingIndex,
    end: endLine,
    body,
  };
}

function findHeadingLineIndex(lines: string[], aliases: readonly string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (isHeadingLineFor(lines[i], aliases)) return i;
  }
  return -1;
}

function normalizeHeadingLine(line: string): string {
  return line
    .replace(/[\s\W]+$/, '')
    .trim()
    .toLowerCase()
    .replace(/^\s*(?:\d+[\.\)]\s*|[ivxlcdm]+[\.\)]\s*|[a-z][\.\)]\s*)/i, '')
    .replace(/[:|\-_=]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingMatchesAlias(normalized: string, alias: string): boolean {
  if (alias === normalized) return true;
  // Semantic containment for multi-word aliases (avoids short false positives like "work").
  if (alias.length >= 8 && normalized.includes(alias)) return true;
  if (normalized.length >= 8 && alias.includes(normalized)) return true;
  return false;
}

function isHeadingLineFor(line: string, aliases: readonly string[]): boolean {
  const stripped = line.replace(/[\s\W]+$/, '').trim();
  if (!stripped) return false;
  // Combined headings can be a bit longer: "Certifications & Languages"
  if (stripped.length > 80) return false;
  const normalized = normalizeHeadingLine(line);
  if (!normalized) return false;

  // Exact or semantic alias match
  if (aliases.some((alias) => headingMatchesAlias(normalized, alias))) return true;

  // Combined heading: split on "&", "/", " and ", "+" — match if ANY part matches.
  if (/(\s(?:&|and|\/|\+)\s)/.test(` ${normalized} `)) {
    const parts = normalized
      .split(/\s(?:&|and|\/|\+)\s/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.some((p) => aliases.some((alias) => headingMatchesAlias(p, alias)))) return true;
  }
  return false;
}

function isAnyHeadingLine(line: string): boolean {
  return isHeadingLineFor(line, ALL_HEADINGS);
}

/** Cut summary when another major section heading appears inside the body (multi-column PDFs). */
export function truncateSummaryAtSectionBoundary(body: string): string {
  const lines = body.split('\n');
  const STOP_HEADING =
    /^(?:(?:(?:work|professional)\s+)?experience|employment(?:\s+history)?|education|academic(?:\s+background|\s+history)?|skills?|technical\s+skills|key\s+skills|core\s+competenc(?:y|ies)|projects?|certifications?|achievements?|languages?|employment\s+record|professional\s+journey)\s*:?\s*$/i;
  const out: string[] = [];
  for (const line of lines) {
    const norm = line
      .trim()
      .replace(/[:|\-_=]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (norm.length > 0 && norm.length <= 72 && STOP_HEADING.test(norm)) break;
    out.push(line);
  }
  return out.join('\n').trim();
}

/** Executive / corporate intro pages (not cover letters) that pollute summary and name. */
const EXECUTIVE_INTRO_MARKERS = [
  /\bboard\s+of\s+directors\b/i,
  /\bcorporate\s+profile\b/i,
  /\bcompany\s+profile\b/i,
  /\babout\s+(?:the\s+)?company\b/i,
  /\bgroup\s+overview\b/i,
  /\bexecutive\s+biography\b/i,
  /\borganisation\s+profile\b/i,
  /\borganization\s+profile\b/i,
  /\bprofile\s+of\s+the\s+company\b/i,
];

const COVER_LETTER_MARKERS = [
  /\bdear\s+(sir|madam|hiring\s+manager|hr\s+manager|recruiter|team)\b/i,
  /\bdear\s+sir\b/i,
  /\bto\s+whom\s+it\s+may\s+concern\b/i,
  /\bto\s*,\s*$/im,
  /\bsubject\s*:/i,
  /\bre\s*:\s*(application|position|role|job)\b/i,
  /\bapplication\s+for\b/i,
  /\bcover\s+letter\b/i,
  /\bapplication\s+letter\b/i,
  /\brecommendation\s+letter\b/i,
  /\bletter\s+of\s+recommendation\b/i,
  /\breference\s+letter\b/i,
  /\bintroductory\s+(letter|page)\b/i,
  /\byours\s+(faithfully|sincerely|truly|regards)\b/i,
  /\bi\s+am\s+writing\s+to\s+(apply|express|inquire|recommend)\b/i,
  /\bwith\s+reference\s+to\s+your\b/i,
  /\bkindly\s+find\s+(attached|enclosed)\b/i,
  /\bplease\s+find\s+(attached|enclosed)\b/i,
];

export interface ResumeTextSignals {
  coverLetterDetected: boolean;
  executiveLayout: boolean;
  multiColumnLikely: boolean;
  sidebarLikely: boolean;
  imageHeavyLikely: boolean;
  scannedLikely: boolean;
}

export function classifyResumeTextSignals(rawText: string): ResumeTextSignals {
  const text = rawText || '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const opener = lines.slice(0, 35).join('\n');
  const words = text.match(/[a-zA-Z]{3,}/g) || [];
  const textDensity = words.length / Math.max(text.length, 1);

  const shortLines = lines.filter((l) => l.length > 0 && l.length <= 48);
  const longLines = lines.filter((l) => l.length >= 72);
  const shortRatio = shortLines.length / Math.max(lines.length, 1);

  const alternatingPairs = lines.slice(0, 80).filter((l, i) => {
    if (i === 0) return false;
    const prev = lines[i - 1];
    return (prev.length <= 45 && l.length >= 70) || (prev.length >= 70 && l.length <= 45);
  }).length;

  const sidebarBlock = lines.slice(0, 22);
  const sidebarShort = sidebarBlock.filter((l) => l.length <= 52).length;
  const sidebarContact = sidebarBlock.filter((l) => /@|linkedin|github|\+?\d{7,}/i.test(l)).length;

  return {
    coverLetterDetected: COVER_LETTER_MARKERS.some((re) => re.test(opener)),
    executiveLayout: /\b(board|chairman|chairperson|cfo|ceo|coo|cto|managing director|executive summary|board member|independent director)\b/i.test(
      text.slice(0, 2500)
    ),
    multiColumnLikely: alternatingPairs >= 6 || (shortRatio > 0.42 && longLines.length >= 8),
    sidebarLikely: sidebarContact >= 2 && sidebarShort >= 6 && sidebarShort / Math.max(sidebarBlock.length, 1) >= 0.55,
    imageHeavyLikely:
      text.length < 400 && words.length < 25 && /\[image|figure|photo|graphic/i.test(text),
    scannedLikely: text.startsWith('%PDF') && textDensity < 0.0015 && words.length < 20,
  };
}

/** Preserve wide horizontal gaps as tab column separators before space collapse. */
function preserveColumnGaps(text: string): string {
  return text.replace(/ {3,}/g, '\t');
}

/** Split a line that contains two columns separated by tab or wide whitespace. */
function splitDualColumnLine(line: string): { left: string; right: string } | null {
  if (line.includes('\t')) {
    const parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return { left: parts[0], right: parts.slice(1).join(' ') };
    }
  }
  const match = line.match(/^(.+?)\s{3,}(.+)$/);
  if (!match) return null;
  const left = match[1].trim();
  const right = match[2].trim();
  if (!left || !right || left.length < 2 || right.length < 2) return null;
  return { left, right };
}

/** Strip sidebar label bleed from identity lines only (e.g. "ANAM SAYYED SKILLS"). */
function stripSidebarNameBleed(text: string): string {
  const trimmed = text.trim();
  const m = trimmed.match(/^(.{2,60}?)\s+(SKILLS?|CONTACT)\s*$/i);
  if (m && isPlausiblePersonName(m[1].trim())) {
    return m[1].trim();
  }
  return trimmed;
}

function isStandaloneSectionLabel(text: string): boolean {
  return /^(skills?|contact|languages?|certifications?|experience|education|projects?|summary)$/i.test(
    text.trim()
  );
}

function isSidebarColumnContent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || isStandaloneSectionLabel(trimmed)) return false;
  if (looksLikeStandaloneLocationLine(trimmed)) return false;
  if (
    /@|linkedin\.com|github\.com|phone|mobile|tel\b/i.test(trimmed) ||
    /\+?\d[\d\s().-]{7,}\d/.test(trimmed)
  ) {
    return true;
  }
  if (
    trimmed.length <= 90 &&
    /,/.test(trimmed) &&
    trimmed.split(',').filter((p) => p.trim().length >= 2).length >= 2 &&
    !lineHasDateRange(trimmed) &&
    !isLikelyJobTitle(trimmed) &&
    !isLikelyCompanyName(trimmed)
  ) {
    return true;
  }
  if (/^(skills?|languages?|certifications?|contact|expertise)$/i.test(trimmed)) return true;
  return false;
}

function isMainColumnContent(text: string): boolean {
  const trimmed = stripSidebarNameBleed(text);
  if (!trimmed) return false;
  if (isAnyHeadingLine(trimmed)) return true;
  if (lineHasDateRange(trimmed)) return true;
  if (looksLikeStandaloneLocationLine(trimmed)) return true;
  if (isLikelyJobTitle(trimmed)) return true;
  if (isLikelyCompanyName(trimmed)) return true;
  if (isPlausiblePersonName(trimmed)) return true;
  if (/^[-•*]\s/.test(trimmed)) return true;
  return false;
}

/**
 * Sidebar / two-column PDFs often interleave contact lines with body paragraphs.
 * Pull contact/identity lines to the top so header + section parsers see a linear resume.
 */
export function reconstructColumnLayout(text: string): string {
  if (!text || text.length < 120) return text;

  const lines = text.split('\n');
  const sidebar: string[] = [];
  const main: string[] = [];
  let hitMajorSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (hitMajorSection) main.push('');
      continue;
    }

    const dual = splitDualColumnLine(trimmed);
    if (dual) {
      const left = stripSidebarNameBleed(dual.left);
      const right = stripSidebarNameBleed(dual.right);

      if (isPlausiblePersonName(left) || isLikelyJobTitle(left)) {
        main.push(left);
      } else if (isMainColumnContent(left) || hitMajorSection) {
        main.push(left);
      } else if (isSidebarColumnContent(left) && !hitMajorSection) {
        sidebar.push(left);
      } else {
        main.push(left);
      }

      if (isStandaloneSectionLabel(right)) {
        // drop bare section labels from sidebar bleed
      } else if (isSidebarColumnContent(right) && !hitMajorSection) {
        sidebar.push(right);
      } else if (isMainColumnContent(right) || hitMajorSection) {
        main.push(right);
      } else if (!hitMajorSection) {
        sidebar.push(right);
      } else {
        main.push(right);
      }
      continue;
    }

    const cleaned = stripSidebarNameBleed(trimmed);

    if (isAnyHeadingLine(cleaned) && i > 4) {
      hitMajorSection = true;
      main.push(cleaned);
      continue;
    }

    const isContactish =
      /@|linkedin\.com|github\.com|phone|mobile|tel\b/i.test(cleaned) ||
      /\+?\d[\d\s().-]{7,}\d/.test(cleaned);
    const isSkillish =
      !hitMajorSection &&
      cleaned.length <= 90 &&
      /,/.test(cleaned) &&
      cleaned.split(',').filter((p) => p.trim().length >= 2).length >= 2 &&
      !lineHasDateRange(cleaned) &&
      !isLikelyJobTitle(cleaned) &&
      !isLikelyCompanyName(cleaned);
    const isShortIdentity =
      cleaned.length <= 55 &&
      !isLikelyJobTitle(cleaned) &&
      !isLikelyCompanyName(cleaned) &&
      (isPlausiblePersonName(cleaned) || isContactish);

    if (
      !hitMajorSection &&
      (isContactish || isSkillish || (isShortIdentity && cleaned.length <= 40)) &&
      !isMainColumnContent(cleaned)
    ) {
      sidebar.push(cleaned);
      continue;
    }

    main.push(cleaned);
  }

  if (sidebar.length >= 2 && main.length >= sidebar.length) {
    return [...partitionSidebarForOutput(sidebar), '', ...main].join('\n').trim();
  }
  return text;
}

function splitCompositeContactSkillLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const segments: string[] = [];
  for (const part of trimmed.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean)) {
    const phoneSkill = part.match(/^(\+?\d[\d\s().-]{7,}\d)\s+(.+)$/);
    if (phoneSkill?.[2]?.includes(',')) {
      segments.push(phoneSkill[1].trim(), phoneSkill[2].trim());
      continue;
    }
    segments.push(part);
  }
  return segments.length > 0 ? segments : [trimmed];
}

function partitionSidebarForOutput(sidebar: string[]): string[] {
  const skillLines: string[] = [];
  const otherLines: string[] = [];

  for (const line of sidebar) {
    for (const segment of splitCompositeContactSkillLine(line)) {
      const cleaned = segment.trim();
      if (!cleaned) continue;
      const isContact =
        /@|linkedin|github|\+?\d{7,}/i.test(cleaned) ||
        /\+?\d[\d\s().-]{7,}\d/.test(cleaned);
      const isLocation = looksLikeStandaloneLocationLine(cleaned);
      const isSkillish =
        /,/.test(cleaned) &&
        cleaned.split(/[,;|]/).filter((p) => p.trim().length >= 2).length >= 2 &&
        !isContact &&
        !isLocation &&
        !isLikelyJobTitle(cleaned) &&
        !isLikelyCompanyName(cleaned);
      if (isContact || isLocation) {
        otherLines.push(cleaned);
      } else if (isSkillish) {
        skillLines.push(cleaned);
      } else {
        otherLines.push(cleaned);
      }
    }
  }

  const out: string[] = [];
  if (skillLines.length >= 1) {
    out.push('SKILLS', ...skillLines);
  }
  out.push(...otherLines);
  return out;
}

export function prepareResumeTextForParsing(rawText: string): { text: string; signals: ResumeTextSignals } {
  const withColumnGaps = preserveColumnGaps(rawText || '');
  let text = cleanResumeTextPreservingLines(withColumnGaps);
  const signals = classifyResumeTextSignals(text);

  if (signals.coverLetterDetected || signals.executiveLayout) {
    const trimmed = stripLeadingNonResumeContent(text);
    if (trimmed.length >= 50 && trimmed.length < text.length) text = trimmed;
  }

  if (signals.multiColumnLikely || signals.sidebarLikely || signals.executiveLayout) {
    text = reconstructColumnLayout(text);
  }

  return { text, signals };
}

function prepareResumeTextInline(rawText: string): { text: string } {
  return { text: prepareResumeTextForParsing(rawText).text };
}

const RESUME_ANCHOR_RE =
  /\b((work\s+)?experience|professional\s+(experience|journey|background)|employment(\s+history)?|education|skills|technical\s+skills|core\s+competencies|curriculum\s+vitae|resume|cv)\b/i;

/**
 * When page 1 is a cover letter, parsers often extract the letter body as
 * summary and miss experience on page 2+. Trim leading non-resume pages when
 * cover-letter markers are present and a resume section anchor appears later.
 */
export function stripLeadingNonResumeContent(rawText: string): string {
  if (!rawText || rawText.length < 80) return rawText;

  const lines = rawText.split('\n');
  const opener = lines.slice(0, 30).join('\n');
  const looksLikeNonResumeLead =
    COVER_LETTER_MARKERS.some((re) => re.test(opener)) ||
    EXECUTIVE_INTRO_MARKERS.some((re) => re.test(opener));
  if (!looksLikeNonResumeLead) return rawText;

  for (let i = 4; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (isAnyHeadingLine(line)) {
      const start = Math.max(0, i - 3);
      return lines.slice(start).join('\n').trim();
    }

    if (line.length <= 80 && RESUME_ANCHOR_RE.test(line)) {
      const start = Math.max(0, i - 3);
      return lines.slice(start).join('\n').trim();
    }

    // Name line followed soon by a resume section (common after a page break)
    if (/^[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){1,3}$/.test(line)) {
      const aheadLines = lines.slice(i + 1, Math.min(lines.length, i + 18));
      const hasResumeSection = aheadLines.some(
        (l) => {
          const t = l.trim();
          return t && (isAnyHeadingLine(t) || (t.length <= 80 && RESUME_ANCHOR_RE.test(t)));
        }
      );
      if (hasResumeSection) {
        return lines.slice(i).join('\n').trim();
      }
    }
  }

  return rawText;
}

/* ------------------------------------------------------------------ */
/*  Field extractors                                                   */
/* ------------------------------------------------------------------ */

export function collectNameCandidatesFromText(text: string): NameCandidate[] {
  const candidates: NameCandidate[] = [];
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0] || '';

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const labeledNameRe =
    /(?:^|\n)\s*(?:name|candidate\s*name|full\s*name|applicant\s*name)\s*[:：]\s*([A-Za-z][A-Za-z\s'.-]{2,50})/gi;
  let labeledMatch: RegExpExecArray | null;
  while ((labeledMatch = labeledNameRe.exec(text)) !== null) {
    const labeled = labeledMatch[1].trim();
    if (isPlausiblePersonName(labeled) && !isFirmOrLocationNamePhrase(labeled)) {
      candidates.push({ value: labeled, confidence: 87, source: 'labeled_name' });
    }
  }

  for (let i = Math.max(0, lines.length - 45); i < lines.length; i++) {
    const line = lines[i];
    const inline = line.match(
      /^(?:name|candidate\s*name|full\s*name|applicant\s*name)\s*[:：]\s*(.+)$/i
    );
    if (!inline) continue;
    const labeled = inline[1].trim();
    if (isPlausiblePersonName(labeled) && !isFirmOrLocationNamePhrase(labeled)) {
      candidates.push({ value: labeled, confidence: 86, source: 'labeled_name' });
    }
  }

  if (email) {
    const emailIdx = lines.findIndex((l) => l.includes(email));
    if (emailIdx >= 0) {
      for (let offset = 1; offset <= 5; offset++) {
        const above = lines[emailIdx - offset];
        if (!above || isAnyHeadingLine(above)) break;
        if (isPlausiblePersonName(above) && !isFirmOrLocationNamePhrase(above)) {
          candidates.push({ value: above, confidence: 88 - offset * 2, source: 'near_contact' });
        }
      }
      for (let offset = 1; offset <= 2; offset++) {
        const below = lines[emailIdx + offset];
        if (!below || isAnyHeadingLine(below)) break;
        if (isPlausiblePersonName(below) && !isFirmOrLocationNamePhrase(below)) {
          candidates.push({ value: below, confidence: 82 - offset * 3, source: 'near_contact' });
        }
      }
    }
  }

  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    if (!line || isAnyHeadingLine(line)) continue;
    if (/^[A-Z][A-Z\s'-]{3,}$/.test(line) && line.split(/\s+/).length >= 2 && line.length < 50) {
      candidates.push({ value: line, confidence: 90 - i * 2, source: 'header_centered' });
    }
  }

  const headerName = extractNameHeuristic(text);
  if (headerName) {
    candidates.push({ value: headerName, confidence: 55, source: 'text_recovery' });
  }

  if (lines[0] && isPlausiblePersonName(lines[0]) && !isFirmOrLocationNamePhrase(lines[0])) {
    candidates.push({ value: lines[0], confidence: 30, source: 'first_line' });
  }

  return candidates;
}

export function extractNameWithConfidence(text: string): string {
  return pickBestNameFromCandidates(collectNameCandidatesFromText(text));
}

function extractNameHeuristic(text: string): string {
  const lines = text.split('\n').map((l) => l.trim());

  const SECTION_WORD_RE =
    /\b(?:contact|info|information|personal|details|profile|professional|technical|career|objective|summary|education|experience|skills|projects|certifications|languages|references|hobbies|interests|achievements|awards|honors|recognition|portfolio|expertise|competencies|background|qualifications|introduction|overview|biography|bio|about|me|page|of|continued|section|sections)\b/i;

  const titleCaseWords = (value: string): string =>
    value
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const isNameToken = (token: string): boolean =>
    /^[A-Za-z'-]{2,20}$/.test(token) && !SECTION_WORD_RE.test(token);

  const trySegment = (raw: string): string | null => {
    const seg = raw.trim();
    if (!seg) return null;
    if (seg.length < 3 || seg.length > 60) return null;
    if (/[@+]/.test(seg)) return null;
    if (/^https?:|\bwww\./i.test(seg)) return null;
    if (/\d/.test(seg)) return null;
    if (/^%PDF|\bresume\b|\bcv\b|\bcurriculum\b|\bvitae\b/i.test(seg)) return null;
    if (SECTION_WORD_RE.test(seg)) return null;

    // "First Last" / "First Middle Last" — Title case
    if (/^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,3}$/.test(seg)) return seg;

    // ALL CAPS short multi-word name
    if (/^[A-Z][A-Z\s'-]{2,}$/.test(seg) && seg.split(/\s+/).length >= 2 && seg.length < 50) {
      return titleCaseWords(seg);
    }

    // Mixed / lowercase multi-word: "maryam khan", "MOHAMMAD arif"
    const words = seg.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4 && words.every(isNameToken)) {
      return titleCaseWords(seg);
    }

    // CamelCase un-glue: PDF extractors sometimes drop the space between
    // first and last name ("AnamSayyed").
    const camelMatch = seg.match(/^([A-Z][a-z'-]{1,15})([A-Z][a-z'-]{1,20})$/);
    if (camelMatch) {
      const reconstructed = `${camelMatch[1]} ${camelMatch[2]}`;
      if (!SECTION_WORD_RE.test(reconstructed)) return reconstructed;
    }

    // ALL CAPS single token (common when PDF splits names across lines)
    if (/^[A-Z]{3,15}$/.test(seg)) return titleCaseWords(seg);

    // Single-word names — accept only if it's clearly a personal name token
    if (/^[A-Z][a-z'-]{2,}$/.test(seg)) return seg;

    return null;
  };

  const tryMergeHeaderLines = (start: number): string | null => {
    let merged = '';
    for (let i = start; i < Math.min(lines.length, start + 4, 10); i++) {
      const line = lines[i];
      if (!line || isAnyHeadingLine(line)) break;
      if (/[|·•\u2022@+]/.test(line)) break;

      const tokens = line.split(/\s+/).filter(Boolean);
      if (!tokens.length || tokens.length > 3 || !tokens.every(isNameToken)) break;

      merged = merged ? `${merged} ${line}` : line;
      const candidate = trySegment(merged);
      if (candidate && candidate.split(/\s+/).length >= 2) return candidate;
      if (merged.split(/\s+/).length >= 4) break;
    }
    return merged ? trySegment(merged) : null;
  };

  const acceptName = (candidate: string | null): string | null =>
    candidate && isPlausiblePersonName(candidate) ? candidate : null;

  // Multi-line headers: "Maryam" on line 1 + "Khan" on line 2, or "MOHAMMAD" + "ARIF KHAN"
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const merged = acceptName(tryMergeHeaderLines(i));
    if (merged && merged.split(/\s+/).length >= 2) return merged;
  }

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (!line) continue;
    if (isAnyHeadingLine(line)) continue;

    const direct = acceptName(trySegment(line));
    if (direct) {
      // Single-token hit: peek at following lines before accepting a partial name
      if (direct.split(/\s+/).length === 1) {
        const merged = acceptName(tryMergeHeaderLines(i));
        if (merged && merged.split(/\s+/).length >= 2) return merged;
      }
      return direct;
    }

    // Header with separators: "Anam Sayyed | Software Engineer | New York"
    if (/[|·•\u2022]|\s-\s|\s\u2013\s|\s\u2014\s/.test(line)) {
      const segments = line.split(/\s*[|·•\u2022]\s*|\s+-\s+|\s+[\u2013\u2014]\s+/);
      for (const seg of segments) {
        const found = acceptName(trySegment(seg));
        if (found) return found;
      }
    }
  }
  return '';
}

function extractLocation(text: string): string {
  // "City, ST" or "City, Country" within first 20 lines
  const lines = text.split('\n').slice(0, 20);
  for (const line of lines) {
    const m = line.match(/\b([A-Z][A-Za-z]+(?:[\s'\-][A-Z][A-Za-z]+)*),\s*([A-Z]{2}|[A-Z][A-Za-z]+)\b/);
    if (m && m[0].length < 60) return m[0];
  }
  return '';
}

/**
 * Skill subheaders that resumes commonly use to group items (we treat them as
 * NOISE — the items underneath are what we want, all flattened into one list).
 */
const SKILL_SUBHEADERS = new Set([
  'languages', 'language', 'programming languages', 'programming',
  'frameworks', 'framework', 'libraries', 'library', 'frameworks & libraries',
  'databases', 'database', 'storage', 'data stores',
  'tools', 'tool', 'tools & platforms', 'platforms', 'devops',
  'cloud', 'cloud platforms', 'infrastructure',
  'concepts', 'methodologies', 'practices',
  'soft skills', 'softskills', 'interpersonal', 'core competencies',
  'technical skills', 'technical', 'other', 'others',
  'testing', 'design', 'design tools', 'apis', 'api', 'protocols',
]);

function parseSkills(block: string): string[] {
  if (!block) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  // Walk line-by-line so we can pick up grouped "Frameworks: A, B, C" lines AND
  // bullet lists under a subheader line "Frameworks\n - A\n - B".
  const lines = block.split('\n').map((l) => l.trim());

  // Step 1: expand any "Header: items, items..." inline lines AND strip subheader
  // labels so the splitter never sees them as candidates.
  const candidates: string[] = [];
  for (const raw of lines) {
    if (!raw) continue;

    // "Languages: Python, JS, TypeScript" → take everything after the colon
    const inline = raw.match(/^([A-Za-z][A-Za-z &/]+?)\s*:\s*(.+)$/);
    if (inline) {
      const header = inline[1].toLowerCase().replace(/\s+/g, ' ').trim();
      if (SKILL_SUBHEADERS.has(header) || /skill/i.test(header)) {
        candidates.push(inline[2]);
        continue;
      }
      // unknown header — still useful as a list seed
      candidates.push(inline[2]);
      continue;
    }

    // Standalone subheader line ("Frameworks", "Tools") → drop
    const normalized = raw.toLowerCase().replace(/[:\-]+$/, '').replace(/\s+/g, ' ').trim();
    if (SKILL_SUBHEADERS.has(normalized)) continue;

    candidates.push(raw);
  }

  // Step 2: split each candidate line into individual skill tokens
  for (const cand of candidates) {
    const tokens = cand
      .split(/[,;|·•\u2022\u2023\u25aa\/]+|\s{2,}\u2022\s+/)
      .map((s) => s.replace(/^[\s\-–—*•]+/, '').replace(/[\s.]+$/, '').trim())
      .filter(Boolean);

    for (const raw of tokens) {
      if (!raw) continue;
      if (raw.length < 2 || raw.length > 60) continue;
      if ((raw.match(/\s/g) || []).length > 4) continue;
      if (/[.!?]$/.test(raw) && raw.length > 30) continue;

      const cleaned = raw
        .replace(/[:\-–—]\s*\d{1,3}\s*%?\s*$/, '')
        .replace(/\s*\(\s*[^)]*\)\s*$/, '')
        .replace(/\s+\d{1,3}\s*%?\s*$/, '')
        .trim();
      if (!cleaned) continue;
      if (/^\d+$/.test(cleaned)) continue;

      // Re-check it's not a subheader leaking through
      const k = cleaned.toLowerCase();
      if (SKILL_SUBHEADERS.has(k)) continue;
      if (seen.has(k)) continue;
      seen.add(k);
      const cleanedSkill = sanitizeSkillEntry(cleaned);
      if (cleanedSkill) out.push(cleanedSkill);
    }
  }
  return normalizeSkillsList(out);
}

function parseExperience(block: string): ExtractedResumeData['experience'] {
  if (!block) return [];

  const lines = block.split('\n').map((l) => l.trimEnd());
  const entries: Array<{ start: number; end: number }> = [];

  // An entry starts on a line that contains a date range OR a role+company combination.
  let lastStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (isResumeSectionHeadingLine(line.trim())) {
      if (lastStart >= 0) entries.push({ start: lastStart, end: i });
      lastStart = -1;
      continue;
    }
    const hasDateRange = lineHasDateRange(line);
    const hasRoleMarker =
      ROLE_MARKERS.test(line) &&
      line.length < 100 &&
      !isExperienceBulletLine(line) &&
      looksLikeJobTitleLine(line);

    if (hasDateRange || hasRoleMarker) {
      // CRITICAL: many resumes place "Company" / "Role" on the lines ABOVE the date range.
      // If we start the chunk at the date line, we lose the header and can accidentally
      // merge multiple jobs into one block (next company/title lines get treated as
      // description of the first chunk). When we see a date-range anchor, pull in up to
      // two preceding non-empty lines if they look like header lines for this same entry.
      let start = i;
      if (hasDateRange) {
        const isGoodHeaderLine = (s: string): boolean => {
          const t = (s || '').trim();
          if (!t) return false;
          if (t.length > 120) return false;
          if (lineHasDateRange(t)) return false;
          if (isAnyHeadingLine(t)) return false;
          if (/^[•\-\*\u2022\u2023\u25aa]\s+/.test(t) || /^o\s+/i.test(t)) return false;
          return (
            looksLikeJobTitleLine(t) ||
            looksLikeCompanyNameLine(t) ||
            looksLikeStandaloneLocationLine(t) ||
            ROLE_MARKERS.test(t) ||
            COMPANY_MARKERS.test(t)
          );
        };

        const prev1 = i - 1 >= 0 ? lines[i - 1] : '';
        const prev2 = i - 2 >= 0 ? lines[i - 2] : '';
        const prev3 = i - 3 >= 0 ? lines[i - 3] : '';

        if (isGoodHeaderLine(prev1)) start = i - 1;
        if (
          isGoodHeaderLine(prev2) &&
          (looksLikeJobTitleLine(prev2) ||
            looksLikeCompanyNameLine(prev2) ||
            ROLE_MARKERS.test(prev2) ||
            COMPANY_MARKERS.test(prev2))
        ) {
          start = i - 2;
        }
        if (
          isGoodHeaderLine(prev3) &&
          isGoodHeaderLine(prev2) &&
          isGoodHeaderLine(prev1) &&
          (looksLikeCompanyNameLine(prev2) || looksLikeCompanyNameLine(prev1)) &&
          (looksLikeJobTitleLine(prev3) || looksLikeJobTitleLine(prev2) || ROLE_MARKERS.test(prev3))
        ) {
          // Title / Company / Location / Date layouts (e.g. Food Processor / Pranav... / Bhopal / Jan 2023)
          start = i - 3;
        }

        // Don't cross a blank line boundary.
        if (start < i) {
          for (let j = start; j < i; j++) {
            if (!lines[j].trim()) {
              start = j + 1;
            }
          }
        }
      }

      if (lastStart >= 0) entries.push({ start: lastStart, end: start });
      lastStart = start;
    }
  }
  if (lastStart >= 0) entries.push({ start: lastStart, end: lines.length });

  // If we couldn't detect anything by anchors, treat blank-line-separated blocks as entries
  if (entries.length === 0) {
    let cur = 0;
    for (let i = 0; i <= lines.length; i++) {
      const blank = i === lines.length || lines[i].trim() === '';
      if (blank) {
        if (i > cur) entries.push({ start: cur, end: i });
        cur = i + 1;
      }
    }
  }

  const out: ExtractedResumeData['experience'] = [];
  for (const { start, end } of entries) {
    const chunk = lines.slice(start, end).filter((l) => l.trim());
    if (chunk.length === 0) continue;

    const exp = parseExperienceChunk(chunk);
    if ((exp.position || exp.company) && isValidExperienceEntry(exp)) out.push(exp);
  }
  return mergeOrphanExperienceEntries(out);
}

function parseExperienceChunk(chunkLines: string[]): ExtractedResumeData['experience'][0] {
  let position = '';
  let company = '';
  let location = '';
  let startDate = '';
  let endDate = '';
  let current = false;
  const bullets: string[] = [];
  const descLines: string[] = [];

  // Find date line first — anchors everything else
  let dateLineIdx = -1;
  for (let i = 0; i < chunkLines.length; i++) {
    const parsedRange = parseDateRangeFromLine(chunkLines[i]);
    if (parsedRange) {
      dateLineIdx = i;
      startDate = parsedRange.start;
      endDate = parsedRange.end;
      current = parsedRange.current;
      break;
    }
  }

  // Title/company are usually in the first 1-2 lines (above or at the date line)
  const headerEnd = dateLineIdx >= 0 ? Math.min(dateLineIdx + 1, chunkLines.length) : Math.min(2, chunkLines.length);
  const headerLines: string[] = [];
  for (let i = 0; i < headerEnd; i++) {
    if (i === dateLineIdx) {
      // strip date span from the header line for parsing the role/company
      const noDates = chunkLines[i]
        .replace(MONTH_YEAR_DATE_RANGE_RE, '')
        .replace(YEAR_DATE_RANGE_RE, '')
        .replace(/[|·•@\-–—]+\s*$/g, '')
        .trim();
      if (noDates) headerLines.push(noDates);
    } else {
      headerLines.push(chunkLines[i]);
    }
  }

  for (const h of headerLines) {
    const cleaned = h
      .replace(/[|·•]+/g, ' ')
      .replace(/\s+at\s+/i, ' @ ')
      .trim();
    if (!cleaned || lineHasDateRange(cleaned)) continue;

    const locOnLine = cleaned.match(
      /\b([A-Z][A-Za-z]+(?:[\s'\-][A-Z][A-Za-z]+)*),\s*([A-Z]{2}|[A-Z][A-Za-z]+)\b/
    );
    if (locOnLine) {
      if (!location) location = locOnLine[0];
      continue;
    }
    if (looksLikeJobTitleLine(cleaned)) {
      if (!position) position = cleaned;
      continue;
    }
    if (looksLikeStandaloneLocationLine(cleaned)) {
      if (!location) location = cleaned;
      continue;
    }
    if (looksLikeCompanyNameLine(cleaned)) {
      if (!company) company = cleaned;
      continue;
    }

    // "Role @ Company" or "Role, Company"
    const split = cleaned.match(/^(.+?)\s*(?:@|,|\u2013|\u2014| - )\s*(.+)$/);
    if (split) {
      const left = split[1].trim();
      const right = split[2].trim();
      if (!position && (ROLE_MARKERS.test(left) || !looksLikeCompanyNameLine(left))) {
        position = left;
      } else if (!position) position = right;
      if (
        !company &&
        !isExperienceDateOrDurationToken(right) &&
        (looksLikeCompanyNameLine(right) || !ROLE_MARKERS.test(right))
      ) {
        company = right;
      } else if (!company && !isExperienceDateOrDurationToken(left)) company = left;
      continue;
    }

    if (!position && ROLE_MARKERS.test(cleaned)) position = cleaned;
    else if (!company && looksLikeCompanyNameLine(cleaned)) company = cleaned;
    else if (!position && looksLikeJobTitleLine(cleaned)) position = cleaned;
    else if (!company && cleaned.length <= 120 && !isExperienceDateOrDurationToken(cleaned)) {
      company = cleaned;
    }
  }

  // Location: look for "City, ST/Country" in header lines
  for (const h of headerLines) {
    const loc = h.match(/\b([A-Z][A-Za-z]+(?:[\s'\-][A-Z][A-Za-z]+)*),\s*([A-Z]{2}|[A-Z][A-Za-z]+)\b/);
    if (loc) {
      location = loc[0];
      break;
    }
  }

  // Lines immediately after the date line are often location (before bullets/description).
  const bodyStart = dateLineIdx >= 0 ? dateLineIdx + 1 : headerEnd;
  let descStart = bodyStart;
  for (let i = bodyStart; i < chunkLines.length; i++) {
    const l = chunkLines[i].trim();
    if (!l) continue;
    const locOnLine = l.match(
      /\b([A-Z][A-Za-z]+(?:[\s'\-][A-Z][A-Za-z]+)*),\s*([A-Z]{2}|[A-Z][A-Za-z]+)\b/
    );
    if (locOnLine && !location) {
      location = locOnLine[0];
      descStart = i + 1;
      continue;
    }
    if (!location && l.length <= 40 && /^(remote|hybrid|on-?site|work from home|wfh)$/i.test(l)) {
      location = l;
      descStart = i + 1;
      continue;
    }
    break;
  }

  // Lines after header/date/location — stop if the next job block begins inside this chunk.
  for (let i = descStart; i < chunkLines.length; i++) {
    const l = chunkLines[i].trim();
    if (!l) continue;
    if (isResumeSectionHeadingLine(l)) break;
    if (i > descStart && isNextJobBoundaryLine(l, chunkLines[i + 1])) break;
    if (
      i > descStart &&
      lineHasDateRange(l) &&
      !isExperienceBulletLine(l)
    ) {
      break;
    }
    if (
      i > descStart &&
      looksLikeCompanyNameLine(l) &&
      i + 1 < chunkLines.length &&
      lineHasDateRange(chunkLines[i + 1])
    ) {
      break;
    }
    if (/^[•\-\*\u2022\u2023\u25aa]\s+/.test(l) || /^o\s+/i.test(l) || /^\d+[\.\)]\s+/.test(l)) {
      bullets.push(l.replace(/^[•\-\*\u2022\u2023\u25aa]\s+|^o\s+/i, '').replace(/^\d+[\.\)]\s+/, '').trim());
    } else {
      descLines.push(l);
    }
  }

  const description =
    descLines.length > 0 ? descLines.join('\n').trim() : bullets.join('\n').trim();

  return reconcileExperienceHeaderFields({
    company,
    position,
    location,
    startDate,
    endDate,
    current,
    description,
    achievements: bullets,
  }) as ExtractedResumeData['experience'][0];
}

function parseEducation(block: string): ExtractedResumeData['education'] {
  if (!block) return [];

  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const entries: Array<{ degree: string; institution: string; field: string; year: string; gpa: string; startDate: string; endDate: string }> = [];

  let current: typeof entries[0] | null = null;

  const flush = () => {
    if (current && (current.degree || current.institution)) entries.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasDegree = DEGREE_PATTERNS.some((p) => p.test(line));
    const hasInstitution =
      /\b(university|college|institute|school|academy|iim|iit|nit)\b/i.test(line) ||
      (line.length >= 10 && /[A-Z]/.test(line) && /\s/.test(line) && !DEGREE_PATTERNS.some((p) => p.test(line)));
    const yearMatch = line.match(/(19|20)\d{2}/g);

    if (hasDegree) {
      flush();
      current = {
        degree: line,
        institution: '',
        field: '',
        year: yearMatch ? yearMatch[yearMatch.length - 1] : '',
        gpa: '',
        startDate: '',
        endDate: '',
      };

      // Try to pull field-of-study: "Bachelor of Science in Computer Science"
      const fieldMatch = line.match(/\bin\s+([A-Z][A-Za-z ,&]+)$/);
      if (fieldMatch) current.field = fieldMatch[1].trim();

      // Try to grab degree-only by stripping "in field" portion
      current.degree = line.replace(/\bin\s+[A-Z][A-Za-z ,&]+$/, '').trim();
      continue;
    }

    if (hasInstitution && current) {
      current.institution = line.replace(/,?\s*(?:19|20)\d{2}.*$/, '').trim();
      if (yearMatch && !current.year) current.year = yearMatch[yearMatch.length - 1];
      continue;
    }

    if (hasInstitution && !current) {
      // Some resumes put institution first
      current = {
        degree: '',
        institution: line.replace(/,?\s*(?:19|20)\d{2}.*$/, '').trim(),
        field: '',
        year: yearMatch ? yearMatch[yearMatch.length - 1] : '',
        gpa: '',
        startDate: '',
        endDate: '',
      };
      continue;
    }

    if (current) {
      // Standalone passing year on its own line (e.g. MBA / University / 2008)
      if (/^(19|20)\d{2}$/.test(line.trim())) {
        if (!current.year) current.year = line.trim();
        continue;
      }
      // GPA / CGPA
      const gpaMatch = line.match(/(?:gpa|cgpa)[:\s]*([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
      if (gpaMatch) current.gpa = gpaMatch[1].trim();
      else if (yearMatch && !current.year) current.year = yearMatch[yearMatch.length - 1];
      else if (!current.field && line.length >= 3 && line.length <= 100 && !gpaMatch) {
        if (!current.institution && line.length >= 12) {
          current.institution = line.replace(/,?\s*(?:19|20)\d{2}.*$/, '').trim();
        } else if (!current.field) {
          current.field = line.replace(/^.*?(major|field|specialization)[:\s]*/i, '').trim();
        }
      }
    }
  }
  flush();

  return mergeOrphanEducationEntries(
    entries.map((e) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      startDate: e.startDate,
      endDate: e.year ? e.year : e.endDate,
      gpa: e.gpa,
      description: '',
    }))
  );
}

/**
 * Sections without a dedicated form step (memberships, publications, volunteer, etc.)
 * are stored in additionalResumeData and folded into the achievements pipeline.
 */
export function extractAdditionalResumeDataFromText(rawText: string): AdditionalResumeData {
  const { text } = prepareResumeTextInline(rawText || '');
  const store = emptyAdditionalResumeData();
  if (text.length < 30) return store;

  const absorb = (
    aliases: readonly string[],
    bucket: 'memberships' | 'publications' | 'volunteerWork' | 'awards'
  ) => {
    const block = extractSection(text, aliases);
    if (!block) return;
    const items = parseAchievementsList(block.body);
    if (items.length > 0) {
      for (const item of items) {
        if (!store[bucket].includes(item)) store[bucket].push(item);
        if (!store.achievements.includes(item)) store.achievements.push(item);
      }
      return;
    }
    const body = block.body.trim();
    if (body.length >= 12) {
      store.extraSections.push({ heading: block.heading, body: body.slice(0, 2000) });
      for (const line of parseAchievementsList(body)) {
        if (!store.achievements.includes(line)) store.achievements.push(line);
      }
    }
  };

  absorb(SECTION_ALIASES.memberships, 'memberships');
  absorb(SECTION_ALIASES.publications, 'publications');
  absorb(SECTION_ALIASES.volunteer, 'volunteerWork');

  return store;
}

function parseAchievementsList(block: string): string[] {
  if (!block) return [];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const rawLine of block.split('\n')) {
    let lineText = rawLine.trim().replace(/^[•\-\*\u2022\u2023]\s+/, '');
    if (!lineText || lineText.length < 4) continue;
    if (/^[A-Z][A-Za-z\s/&]+:?\s*$/.test(lineText) && lineText.length < 40) continue;

    if ((lineText.startsWith('•') || lineText.startsWith('-')) && lineText.length > 10) {
      lineText = lineText.replace(/^[•\-]\s+/, '').trim();
    }

    if (lineText.length < 6 || lineText.length > 500) continue;
    const key = lineText.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(lineText);
  }

  return out;
}

function parseHobbiesList(block: string): string[] {
  if (!block) return [];
  const seen = new Set<string>();
  const out: string[] = [];

  for (const rawLine of block.split('\n')) {
    const lineText = rawLine.trim().replace(/^[•\-\*\u2022]\s+/, '');
    if (!lineText || lineText.length < 2) continue;
    if (/^[A-Z][A-Za-z\s]+:?\s*$/.test(lineText) && lineText.length < 30) continue;

    const parts = lineText
      .split(/[,•|·\u2022\-–—]/)
      .map((h) => h.trim())
      .filter((h) => h.length >= 2 && h.length < 50);

    for (const hobby of parts) {
      const key = hobby.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(hobby);
    }
  }

  return out;
}

function looksLikeProjectTitle(line: string): boolean {
  const cleaned = line
    .replace(/^[•\-\*\u2022]\s+/, '')
    .split('|')[0]
    .replace(/:.*$/, '')
    .trim();
  if (!cleaned || cleaned.length > 80 || cleaned.length < 2) return false;
  if (
    /^(built|developed|implemented|created|designed|managed|led|worked|used|utilized|responsible|spearheaded|maintained|collaborated|optimized|integrated|improved|delivered|automated)\b/i.test(
      cleaned
    )
  ) {
    return false;
  }
  if (/^[^|]{2,60}\s*\|\s*\S/.test(line)) return true;
  if (
    /\b(Website|Web\s*Site|Portal|System|Systems|Application|Applications|App|Platform|Dashboard|API|Tool|Suite|Software)\b/i.test(
      cleaned
    )
  ) {
    return true;
  }
  if (/^[A-Z][A-Za-z0-9 &/\-_'".]{2,}$/.test(cleaned)) return true;
  if (/^[A-Z][A-Z0-9 &/\-_'.]{2,}$/.test(cleaned)) return true;
  return false;
}

function parseProjects(block: string): NonNullable<ExtractedResumeData['projects']> {
  if (!block) return [];
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: NonNullable<ExtractedResumeData['projects']> = [];
  let current: { name: string; description: string; technologies: string[]; url?: string } | null = null;

  const flush = () => {
    if (!current) return;
    if (!current.name.trim()) {
      if (current.description.trim() || current.technologies.length > 0) {
        current.name = out.length === 0 ? 'Software Project' : `Project ${out.length + 1}`;
      } else {
        current = null;
        return;
      }
    }
    out.push(current);
    current = null;
  };

  for (const line of lines) {
    if (looksLikeProjectTitle(line)) {
      flush();
      let name = line
        .replace(/^[•\-\*\u2022]\s+/, '')
        .replace(/:.*$/, '')
        .trim();
      current = { name: '', description: '', technologies: [] };
      if (name.includes('|')) {
        const [titlePart, techPart] = name.split('|').map((s) => s.trim());
        current.name = titlePart;
        if (techPart) {
          current.technologies = techPart.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
        }
      } else {
        current.name = name;
      }
      const inlineDesc = line.includes(':') ? line.split(':').slice(1).join(':').trim() : '';
      if (inlineDesc) current.description = inlineDesc;
      continue;
    }

    if (!current) {
      const bulletText = line.replace(/^[•\-\*\u2022]\s+/, '').trim();
      if (bulletText.length >= 8 && bulletText.length < 200) {
        flush();
        const dashSplit = bulletText.split(/\s+[-–—]\s+/);
        const titleGuess = (dashSplit[0] || bulletText).trim();
        current = {
          name: titleGuess.length <= 80 ? titleGuess : `Project ${out.length + 1}`,
          description: dashSplit.length > 1 ? dashSplit.slice(1).join(' - ').trim() : '',
          technologies: [],
        };
        continue;
      }
      continue;
    }
    const techMatch = line.match(/^(?:tech(?:nologies)?|stack|built\s+with|tools)\s*:\s*(.+)$/i);
    if (techMatch) {
      current.technologies = techMatch[1].split(/[,;|/]/).map((t) => t.trim()).filter(Boolean);
      continue;
    }
    const urlMatch = line.match(/(https?:\/\/[^\s)]+)/);
    if (urlMatch) current.url = urlMatch[1];

    if (looksLikeProjectTitle(line)) {
      flush();
      let name = line
        .replace(/^[•\-\*\u2022]\s+/, '')
        .replace(/:.*$/, '')
        .trim();
      current = { name: '', description: '', technologies: [] };
      if (name.includes('|')) {
        const [titlePart, techPart] = name.split('|').map((s) => s.trim());
        current.name = titlePart;
        if (techPart) {
          current.technologies = techPart.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
        }
      } else {
        current.name = name;
      }
      const inlineDesc = line.includes(':') ? line.split(':').slice(1).join(':').trim() : '';
      if (inlineDesc) current.description = inlineDesc;
      continue;
    }

    current.description = current.description
      ? `${current.description}\n${line}`
      : line;
  }
  flush();
  return out;
}

/**
 * Parse a certifications block. Supports BOTH styles:
 *
 *   Single-line:
 *     • AWS Certified Solutions Architect | Amazon Web Services | 2023
 *     • Full-Stack Python Developer — Cybrom Technology (2024)
 *
 *   Multi-line block (one cert spread across 2-4 lines):
 *     AWS Certified Solutions Architect
 *     Amazon Web Services
 *     Mar 2023
 *     https://credly.com/badge/abc
 *
 * Strategy: pre-group lines into cert "chunks" separated by blank lines or
 * bullet markers. Each chunk is parsed as either one single-line cert or as
 * a multi-line entry. A pure date-only line continues the previous chunk.
 */
function parseCertifications(block: string): NonNullable<ExtractedResumeData['certifications']> {
  if (!block) return [];

  // Step 1: chunk the block. A new chunk starts on:
  //   - bullet line ("• ...", "- ...", "* ...")
  //   - blank-line separator
  //   - a line that already looks like a "complete" single-line cert
  //     (has both a separator AND a date) following a non-empty previous line
  const rawLines = block.split('\n');
  const chunks: string[][] = [];
  let current: string[] = [];

  const isBlank = (s: string) => s.trim() === '';
  const stripBullet = (s: string) => s.replace(/^[•\-\*\u2022\u2023\u25aa\u00b7]\s+/, '').trim();
  const hasBullet = (s: string) => /^[•\-\*\u2022\u2023\u25aa\u00b7]\s/.test(s);

  const flush = () => {
    if (current.length) chunks.push(current);
    current = [];
  };

  for (const raw of rawLines) {
    if (isBlank(raw)) { flush(); continue; }
    if (hasBullet(raw)) { flush(); current = [stripBullet(raw)]; continue; }
    current.push(raw.trim());
  }
  flush();

  const out: NonNullable<ExtractedResumeData['certifications']> = [];

  // Step 2: parse each chunk.
  const yearLineOnly = (s: string) =>
    /^(?:19|20)\d{2}(?:\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|current))?$/i.test(s);
  const isUrlLine = (s: string) => /^https?:\/\//i.test(s);
  const extractDate = (s: string): string => {
    const yearRangeParen = s.match(
      /\(\s*((?:19|20)\d{2})(?:\s*[-–—to]+\s*((?:19|20)\d{2}|present|current))?\s*\)/i
    );
    if (yearRangeParen) {
      return yearRangeParen[2] ? `${yearRangeParen[1]}-${yearRangeParen[2]}` : yearRangeParen[1];
    }
    const monthYear = s.match(
      /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z.]*\s+(?:19|20)\d{2})\b/i
    );
    if (monthYear) return monthYear[1];
    const m = s.match(/(19|20)\d{2}(?:\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current))?/i);
    return m ? m[0].replace(/\s*[-–—]\s*/, '-') : '';
  };
  const stripDateAndUrl = (s: string) =>
    s
      .replace(/\([^)]*(?:19|20)\d{2}[^)]*\)/g, '')
      .replace(/\bissued\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z.]*\s+(?:19|20)\d{2}\b/gi, '')
      .replace(/https?:\/\/[^\s)]+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

  for (const chunkLines of chunks) {
    if (!chunkLines.length) continue;
    const joined = chunkLines.join(' ').trim();
    if (joined.length > 400) continue;
    if (joined.length < 3) continue;

    // URLs across all lines
    const url = chunkLines.map((l) => l.match(/(https?:\/\/[^\s)]+)/)?.[1] || '').find(Boolean) || '';
    // Date across all lines
    const dateLine = chunkLines.find((l) => extractDate(l));
    const date = dateLine ? extractDate(dateLine) : '';

    let name = '';
    let issuer = '';

    if (chunkLines.length === 1) {
      // Single-line cert — separator-based split
      const stripped = stripDateAndUrl(chunkLines[0]);
      const dashSplit = stripped.match(/^(.+?)\s+[–—]\s+(.+)$/);
      if (dashSplit) {
        name = dashSplit[1].trim();
        issuer = dashSplit[2].trim();
      } else {
        const pipeSplit = stripped.split(/\s*\|\s*/);
        if (pipeSplit.length >= 2) {
          name = pipeSplit[0].trim();
          issuer = pipeSplit.slice(1).filter((s) => !yearLineOnly(s.trim())).join(' ').trim();
        } else {
          const commaSplit = stripped.split(/\s*,\s*/);
          if (commaSplit.length >= 2) {
            name = commaSplit[0].trim();
            issuer = commaSplit.slice(1).filter((s) => !yearLineOnly(s.trim())).join(', ').trim();
          } else {
            name = stripped;
          }
        }
      }
    } else {
      // Multi-line cert — line 1 = name; remaining lines (minus date-only, url-only)
      // contribute to issuer. Inline date inside line 1 (e.g. "Cert Name 2024")
      // is stripped from the name and saved as date if not already captured.
      const meaningful = chunkLines.filter((l) => !yearLineOnly(l) && !isUrlLine(l));
      if (!meaningful.length) continue;
      name = stripDateAndUrl(meaningful[0]);
      const remaining = meaningful.slice(1).map((l) => stripDateAndUrl(l)).filter(Boolean);
      issuer = remaining.join(' · ');
      // If line 1 itself contained "Name — Issuer", split it
      const inlineDash = name.match(/^(.+?)\s+[–—]\s+(.+)$/);
      if (inlineDash && !issuer) {
        name = inlineDash[1].trim();
        issuer = inlineDash[2].trim();
      }
    }

    name = name.replace(/[(\[].*?[)\]]/g, '').replace(/[-–—,]+$/, '').trim();
    issuer = issuer.replace(/[(\[].*?[)\]]/g, '').trim();
    if (!name || name.length < 3) continue;
    if (DEGREE_PATTERNS.some((p) => p.test(name)) && !CERT_LINE_HEURISTIC_RE.test(name)) continue;
    if (!isPlausibleCertificationEntry(name, issuer)) continue;

    out.push({ name, issuer, date, url });
  }

  return out;
}

/**
 * Parse a languages block into structured `{name, proficiency}` entries.
 * Handles common formats:
 *   English (Fluent)
 *   Hindi - Native
 *   French: Conversational
 *   Spanish | Professional
 *   English (Fluent), Hindi (Native)        // comma-joined
 */
function parseLanguages(block: string): Array<{ name: string; proficiency: string }> {
  if (!block) return [];
  const seen = new Set<string>();
  const out: Array<{ name: string; proficiency: string }> = [];

  // Split first on newlines, then on commas/semicolons — but ONLY commas that are
  // OUTSIDE parens (so we don't split "English (Fluent, written)").
  const splitTopLevel = (s: string): string[] => {
    const parts: string[] = [];
    let depth = 0;
    let buf = '';
    for (const ch of s) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
      if (depth === 0 && /[,;|·•\u2022&]/.test(ch)) {
        if (buf.trim()) parts.push(buf.trim());
        buf = '';
      } else {
        buf += ch;
      }
    }
    if (buf.trim()) parts.push(buf.trim());
    return parts;
  };

  const tokens: string[] = [];
  for (const line of block.split('\n')) {
    const trimmed = line.trim().replace(/^[\-*•\u2022]\s*/, '');
    if (!trimmed) continue;
    tokens.push(...splitTopLevel(trimmed));
  }

  for (const tok of tokens) {
    let name = '';
    let proficiency = '';

    const paren = tok.match(/^([^()]+?)\s*\(([^)]+)\)\s*\.?$/);
    const sep = tok.match(/^(.+?)\s*[:\-–—|]\s*(.+?)\s*\.?$/);
    if (paren) {
      name = paren[1].trim();
      proficiency = paren[2].trim();
    } else if (sep) {
      name = sep[1].trim();
      proficiency = sep[2].trim();
    } else {
      // "Hindi & English" — split on & / and when no proficiency delimiter present
      const ampParts = tok
        .split(/\s*(?:&|\/|\||\band\b)\s*/i)
        .map((p) => p.trim().replace(/[.,;]+$/, ''))
        .filter(Boolean);
      if (ampParts.length > 1 && ampParts.every((p) => p.length >= 2 && p.length <= 40)) {
        for (const part of ampParts) {
          const key = part.toLowerCase();
          if (seen.has(key)) continue;
          if (looksLikeTechLanguageToken(part)) continue;
          if (looksLikeSectionLabel(part)) continue;
          seen.add(key);
          out.push({ name: part, proficiency: '' });
        }
        continue;
      }
      name = tok.trim();
    }

    name = name.replace(/[.,;]+$/, '').trim();
    proficiency = proficiency.replace(/[.,;]+$/, '').trim();
    if (!name) continue;
    if (name.length < 2 || name.length > 40) continue;
    // Reject anything obviously not a language label
    if (/\d/.test(name) && !/sign/i.test(name)) continue;
    // Defensive: don't emit programming-language tokens as spoken languages.
    // The combined "CERTIFICATIONS & LANGUAGES" body can sometimes contain
    // stray skill entries or sub-section labels; never let those leak into
    // the LanguagesStep regardless of whether a proficiency was supplied.
    if (looksLikeTechLanguageToken(name)) continue;
    if (looksLikeSectionLabel(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, proficiency });
  }
  return out;
}

const TECH_LANG_TOKEN_RE =
  /^(python|javascript|typescript|java|kotlin|swift|ruby|php|html5?|css3?|scss|less|sql|nosql|node\.?js|react(?:\.?js)?|react[\s-]?native|next\.?js|nuxt\.?js?|vue\.?js?|svelte|angular(?:js)?|django|flask|fastapi|express|spring(?:[\s-]?boot)?|laravel|rails|c\+\+|c#|golang|rust|scala|perl|matlab|dart|shell|bash|powershell|graphql|rest(?:ful)?\s*api[s]?|mysql|postgresql|mongodb|redis|sqlite|docker|kubernetes|k8s|aws|azure|gcp|firebase|supabase|tensorflow|pytorch|tailwind(?:css)?|bootstrap|jquery|redux|prisma|graphql)$/i;

const SECTION_LABEL_RE =
  /^(?:programming|programming\s+languages?|languages?|frameworks?|libraries|libs|database[s]?|tools?|technologies|tech\s+stack|tech|stack|platforms?|cloud|devops|version\s+control|methodologies|concepts|practices|skills?|technical(?:\s+skills?)?|soft\s+skills?|core\s+competenc(?:y|ies)|expertise|proficienc(?:y|ies)|hard\s+skills?|other|others|miscellaneous|misc|testing|design|design\s+tools?|api[s]?|protocols?|operating\s+systems?|os|ide[s]?|editors?|ci\/?cd|infrastructure|deployment|monitoring|analytics|seo|marketing|ui\/?ux)$/i;

function looksLikeTechLanguageToken(name: string): boolean {
  const s = name.trim();
  if (!s) return false;
  if (TECH_LANG_TOKEN_RE.test(s)) return true;
  if (/\.(js|ts|py|rb|go|cpp|cs|sh|sql|html|css|scss|less|vue|svelte)$/i.test(s)) return true;
  if (/\+\+|#$/.test(s)) return true;
  return false;
}

function looksLikeSectionLabel(name: string): boolean {
  const s = name.trim();
  if (!s) return false;
  return SECTION_LABEL_RE.test(s);
}

function scoreConfidence(r: ExtractedResumeData): number {
  let score = 0;
  if (r.fullName) score += 12;
  if (r.email) score += 12;
  if (r.phone) score += 8;
  if (r.location) score += 6;
  if (r.summary) score += 8;
  if (r.skills.length >= 3) score += 14;
  if (r.experience.length > 0) score += 20;
  if (r.education.length > 0) score += 12;
  if (r.projects && r.projects.length > 0) score += 4;
  if (r.certifications && r.certifications.length > 0) score += 2;
  if (r.languages && r.languages.length > 0) score += 2;
  return Math.min(100, score);
}
