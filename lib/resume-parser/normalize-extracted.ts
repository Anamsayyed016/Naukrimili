/**
 * Resume extraction normalizer — dedupe, dates, confident-only fields.
 * Used by Affinda adapter, upload API, and import transformer.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import {
  sanitizeSkillEntry,
  normalizeSkillsList,
  normalizeCustomParserSkillsList,
  isPlausibleProjectName,
  isPlaceholderProjectTitle,
} from '@/lib/resume-parser/import-sanitize';
import { isCustomParserImport } from '@/lib/resume-parser/custom-parser-import';
import {
  isImportFieldTraceEnabled,
  traceImportStageTransform,
} from '@/lib/resume-parser/import-field-trace';

const PLACEHOLDER_PATTERNS = [
  /^n\/a$/i,
  /^not\s+(found|available|provided)/i,
  /^unknown$/i,
  /^tbd$/i,
  /^xxx+$/i,
  /^\[.*\]$/,
  /pdf parsing failed/i,
  /please complete your profile manually/i,
  /^resume:\s*.+\.(pdf|docx?|txt)\b/i,
  /not extracted/i,
];

export function isConfidentValue(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 2) return false;
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed));
}

/**
 * Strip parser-introduced unicode garbage (private-use, control, replacement chars).
 * PDFs and Affinda's OCR can emit \uE000-\uF8FF (private use), zero-width chars,
 * box-drawing, and replacement glyphs that look like "߮ ࡆ" in the UI.
 */
function stripUnicodeArtifacts(input: string): string {
  return input
    // BOM + replacement chars
    .replace(/[\uFEFF\uFFFD]/g, '')
    // Zero-width chars
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '')
    // Private use area (U+E000-U+F8FF) - parser garbage
    .replace(/[\uE000-\uF8FF]/g, '')
    // Myanmar / icon glyphs used as PDF bullet substitutes (e.g. ခ before phone/email)
    .replace(/[\u1000-\u109F]/g, ' ')
    // Supplementary private use (often shown as ߮ ࡆ etc. when embedded in PDF font streams)
    .replace(/[\u0700-\u074F\u0780-\u07BF\u0800-\u085F\u0860-\u086F\u08A0-\u08FF]/g, ' ')
    // Box-drawing / geometric shapes that PDFs use for separators
    .replace(/[\u2500-\u259F\u2630-\u268F]/g, ' ')
    // C1 control characters (U+0080-U+009F) — never valid in text
    .replace(/[\u0080-\u009F]/g, ' ');
}

export function cleanString(value: unknown): string {
  if (value == null) return '';
  const s = stripUnicodeArtifacts(String(value)).replace(/\s+/g, ' ').trim();
  return isConfidentValue(s) ? s : '';
}

/**
 * Like cleanString but PRESERVES newlines and paragraph breaks.
 * Used for summary, experience.description, and other multi-line fields
 * where collapsing \n to space would destroy bullet structure.
 */
export function cleanMultiline(value: unknown): string {
  if (value == null) return '';
  const s = stripUnicodeArtifacts(String(value))
    .replace(/\r\n/g, '\n')
    // collapse runs of spaces/tabs WITHIN a line — preserve \n
    .replace(/[ \t]+/g, ' ')
    // remove zero-width spaces masquerading as breaks
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    // collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return isConfidentValue(s) ? s : '';
}

/** Normalize dates to YYYY-MM or YYYY when possible */
export function isPlausibleResumeYear(year: number, rawHint?: string): boolean {
  if (!Number.isFinite(year) || year < 1000) return false;
  const now = new Date().getFullYear();
  const raw = String(rawHint || '');

  if (raw && new RegExp(`\\b${year}\\b`).test(raw)) {
    return year >= 1950 && year <= now + 1;
  }

  if (year < 1965 || year > now + 1) return false;
  if (year === 1900 || year === 0) return false;
  if (year === 1970 && !/\b1970\b/.test(raw)) return false;

  return true;
}

export function normalizeDate(value: unknown): string {
  const raw = cleanString(value);
  if (!raw) return '';

  const lower = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  if (['present', 'current', 'now', 'ongoing', 'running', 'till date', 'till-date'].includes(lower)) {
    return 'Present';
  }

  const iso = raw.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (iso) {
    const y = parseInt(iso[1], 10);
    if (!isPlausibleResumeYear(y, raw)) return '';
    return `${iso[1]}-${iso[2]}`;
  }

  const slashMonthYear = raw.match(/\b(0?[1-9]|1[0-2])[\/\-]((?:19|20)\d{2})\b/);
  if (slashMonthYear) {
    const y = parseInt(slashMonthYear[2], 10);
    if (!isPlausibleResumeYear(y, raw)) return '';
    const m = String(Math.max(1, Math.min(12, parseInt(slashMonthYear[1], 10)))).padStart(2, '0');
    return `${slashMonthYear[2]}-${m}`;
  }

  const monthYear = raw.match(/([A-Za-z]{3,9})\.?\s+((?:19|20)\d{2})/);
  if (monthYear) {
    const y = parseInt(monthYear[2], 10);
    if (!isPlausibleResumeYear(y, raw)) return '';
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const key = monthYear[1].slice(0, 3).toLowerCase();
    if (months[key]) return `${monthYear[2]}-${months[key]}`;
  }

  const yearOnly = raw.match(/\b((?:19|20)\d{2})\b/);
  if (yearOnly) {
    const y = parseInt(yearOnly[1], 10);
    if (!isPlausibleResumeYear(y, raw)) return '';
    return yearOnly[1];
  }

  return '';
}

export function dedupeStrings(items: string[], caseInsensitive = true): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const cleaned = cleanString(item);
    if (!cleaned) continue;
    const key = caseInsensitive ? cleaned.toLowerCase() : cleaned;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}

/**
 * Split a (possibly raw) multi-line description into bullet strings.
 * IMPORTANT: caller should pass the RAW description (with \n intact),
 * not a `cleanString`'d version — once newlines are collapsed, the split fails.
 */
export function splitBullets(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\n|•|·|▪|‣|\u2023|\u25aa|(?:\s*[-–—]\s+)|(?=\d+[\.\)]\s+)/)
    .map((s) => cleanString(s.replace(/^[\s\-–—*•·]+/, '')))
    // Keep short but meaningful bullets ("Led team", "ATS scoring") — drop
    // single-char fragments (split artifacts). Three chars is the realistic
    // floor for a real bullet.
    .filter((s) => s.length >= 3);
}

/* ------------------------------------------------------------------ */
/*  Language reclassifier — fixes Affinda's #1 mis-categorization      */
/* ------------------------------------------------------------------ */

/**
 * Known spoken / written languages. Used as an allow-list when an entry has
 * NO proficiency — so Affinda's habit of dumping programming languages under
 * its `languages` field (because the resume has a "Languages" sub-header
 * inside "TECHNICAL SKILLS") doesn't pollute the LanguagesStep.
 */
const SPOKEN_LANGUAGE_PATTERN =
  /\b(english|spanish|french|german|italian|portuguese|russian|chinese|mandarin|cantonese|japanese|korean|arabic|hindi|bengali|bangla|punjabi|tamil|telugu|marathi|gujarati|kannada|malayalam|urdu|persian|farsi|turkish|dutch|swedish|norwegian|danish|finnish|polish|czech|greek|hebrew|thai|vietnamese|indonesian|malay|tagalog|filipino|swahili|amharic|sinhala|sinhalese|nepali|burmese|khmer|lao|mongolian|pashto|sanskrit|esperanto|catalan|basque|welsh|irish|scottish|gaelic|romanian|bulgarian|croatian|serbian|slovak|slovene|slovenian|hungarian|lithuanian|latvian|estonian|maltese|albanian|macedonian|bosnian|montenegrin|ukrainian|belarusian|kazakh|uzbek|azerbaijani|armenian|georgian|kurdish|odia|assamese|sindhi|konkani|kashmiri|dogri|maithili|santali|bodo|sign\s+language|asl|bsl)\b/i;

/**
 * Tech-term signals — strong indicator the entry is NOT a spoken language.
 * Programming language names and tech tools that resumes commonly put under
 * a "Languages" sub-header inside their skills section.
 */
const TECH_TERM_PATTERN =
  /\b(python|javascript|typescript|java|kotlin|swift|ruby|php|html5?|css3?|scss|less|stylus|sql|nosql|node\.?js|react(?:\.?js)?|react[\s-]?native|next\.?js|nuxt\.?js?|vue\.?js?|svelte\.?js?|angular(?:js)?|ember\.?js?|django|flask|fastapi|express|spring(?:[\s-]?boot)?|laravel|rails|symfony|c\+\+|c#|c\b|golang|go\b|rust|scala|perl|matlab|dart|assembly|cobol|fortran|haskell|elixir|erlang|clojure|lua|bash|shell|powershell|graphql|rest(?:ful)?|mysql|postgresql|mongodb|redis|sqlite|mssql|mariadb|cassandra|dynamodb|firestore|docker|kubernetes|k8s|aws|azure|gcp|firebase|supabase|tensorflow|pytorch|pandas|numpy|jquery|bootstrap|tailwind(?:css)?|material[\s-]?ui|mui|chakra|sass|webpack|vite|rollup|parcel|babel|eslint|prettier|jest|vitest|cypress|playwright|mocha|chai|git|github|gitlab|bitbucket|jenkins|circleci|github\s*actions|terraform|ansible|chef|puppet|figma|sketch|photoshop|illustrator|adobe|canva|postman|insomnia|jira|trello|asana|confluence|swagger|openapi|json|xml|yaml|toml|markdown|api(?:s)?|sdk|cli|ide|orm|jwt|oauth|saml|websocket|webrtc|pwa|seo|ci\/cd|devops|microservices?|serverless|lambda|s3|ec2|rds|redux|mobx|zustand|recoil|vuex|pinia|prisma|sequelize|mongoose|typeorm|knex|hibernate|rxjs|electron|tauri|expo|flutter|xamarin|cordova|ionic|react[\s-]?router|spa|ssr|ssg|isr|webgl|three\.?js|d3\.?js|chart\.?js|moment|dayjs|lodash|axios|fetch|grpc|kafka|rabbitmq|nginx|apache|haproxy|cloudflare|vercel|netlify|heroku|digitalocean)\b|\.(js|ts|jsx|tsx|py|rb|go|cpp|cs|sh|sql|html|css|scss|less|vue|svelte)$|\+\+|^c#$/i;

/**
 * Section-label / category-header signals. These are RESUME SECTION HEADERS
 * (e.g. "Frameworks", "Databases", "Tools") — they're never spoken languages,
 * never real skills, just labels Affinda accidentally lifted out of the resume.
 * Always reject regardless of any proficiency value.
 */
const SECTION_LABEL_PATTERN =
  /^(?:programming|programming\s+languages?|languages?|frameworks?|libraries|libs|database[s]?|tools?|technologies|tech\s+stack|tech|stack|platforms?|cloud|devops|version\s+control|methodologies|concepts|practices|skills?|technical(?:\s+skills?)?|soft\s+skills?|core\s+competenc(?:y|ies)|expertise|proficienc(?:y|ies)|hard\s+skills?|other|others|miscellaneous|misc|testing|design|design\s+tools?|api[s]?|protocols?|operating\s+systems?|os|ide[s]?|editors?|ci\/?cd|infrastructure|deployment|monitoring|analytics|seo|marketing|ui\/?ux)$/i;

/**
 * Real linguistic proficiency keywords. ANYTHING NOT in here (especially
 * numeric values like "95%") is treated as a synthesized/fake proficiency
 * and must NOT cause the entry to be classified as a language.
 */
const REAL_PROFICIENCY_PATTERN =
  /\b(native|fluent|professional|proficient|advanced|conversational|intermediate|basic|beginner|elementary|limited|working|c[12]|b[12]|a[12]|bilingual|multilingual|mother\s+tongue|first\s+language|second\s+language)\b/i;

export function isLikelySpokenLanguage(name: string): boolean {
  if (!name) return false;
  return SPOKEN_LANGUAGE_PATTERN.test(name);
}

export function isLikelyTechTerm(name: string): boolean {
  if (!name) return false;
  return TECH_TERM_PATTERN.test(name);
}

export function isSectionLabel(name: string): boolean {
  if (!name) return false;
  return SECTION_LABEL_PATTERN.test(name.trim());
}

export function isRealLanguageProficiency(value: string): boolean {
  if (!value) return false;
  const s = String(value).trim();
  if (!s) return false;
  // Numeric / percentage values are NOT real linguistic proficiency
  if (/^\d{1,3}\s*%?$/.test(s)) return false;
  if (/^(?:0|[1-9]\d*)(?:\.\d+)?\s*\/?\s*\d*\s*%?$/.test(s)) return false;
  return REAL_PROFICIENCY_PATTERN.test(s);
}

/**
 * Decide whether a candidate `languages[]` entry is actually a spoken
 * language or a misclassified technical skill / section label.
 *
 * Decision order — STRICT:
 *  1. Empty name → drop (treated as language so caller filters elsewhere)
 *  2. Section label ("Frameworks", "Databases", "Tools", ...) → ALWAYS skill
 *  3. Tech term (Python, React, SCSS, Tailwind, ...) → ALWAYS skill
 *  4. Known spoken language (English, Hindi, Spanish, ...) → language
 *  5. Has REAL linguistic proficiency (Fluent / Native / C1 / ...) → language
 *  6. Anything else → demote to skill (safer default; avoid Affinda noise
 *     polluting the LanguagesStep)
 */
export function classifyLanguageEntry(entry: {
  name: string;
  proficiency?: string;
}): 'language' | 'skill' {
  const name = (entry.name || '').trim();
  const proficiency = (entry.proficiency || '').trim();
  if (!name) return 'language';

  // Hard rejections — these win regardless of any proficiency value
  if (isSectionLabel(name)) return 'skill';
  if (isLikelyTechTerm(name)) return 'skill';

  // Hard acceptances
  if (isLikelySpokenLanguage(name)) return 'language';

  // Soft acceptance — only when the proficiency is a REAL linguistic level.
  // Fake proficiencies like "95%", "80%", "1.0" are ignored.
  if (isRealLanguageProficiency(proficiency)) return 'language';

  // Otherwise: not a spoken language → move to skills.
  return 'skill';
}

/**
 * Reclassify an input languages[] into proper spoken languages vs. items
 * that should be moved to skills. Section labels (like "Frameworks",
 * "Databases", "Tools") are DROPPED entirely — they're noise, not skills.
 */
export function splitLanguagesAndExtraSkills(input: unknown): {
  languages: Array<{ name: string; proficiency: string }>;
  extraSkills: string[];
} {
  const langs = normalizeLanguageList(input);
  const languages: Array<{ name: string; proficiency: string }> = [];
  const extraSkills: string[] = [];
  for (const entry of langs) {
    const verdict = classifyLanguageEntry(entry);
    if (verdict === 'language') {
      languages.push(entry);
    } else if (!isSectionLabel(entry.name)) {
      // Real tech term or unknown skill — promote to skills.
      // Pure section labels are dropped (they're not actual skill names).
      extraSkills.push(entry.name);
    }
  }
  return { languages, extraSkills };
}

/* ------------------------------------------------------------------ */
/*  Certification reclassifier — fixes "Languages: English, Hindi"     */
/*  leaking into certifications when the resume uses the combined      */
/*  "CERTIFICATIONS & LANGUAGES" heading and the parser doesn't split. */
/* ------------------------------------------------------------------ */

/**
 * Detect cert entries that are actually spoken-language declarations.
 * Examples we want to MOVE OUT of certifications:
 *   { name: "Languages: English, Hindi" }
 *   { name: "English (Fluent)" }
 *   { name: "Hindi - Native" }
 *   { name: "Spoken Languages" }
 */
function looksLikeLanguageDeclaration(entry: {
  name?: string;
  issuer?: string;
}): boolean {
  const raw = `${entry.name || ''} ${entry.issuer || ''}`.trim();
  if (!raw) return false;
  // Leading "Languages:" / "Spoken Languages:" — clearly the language section header
  if (/^(spoken\s+)?languages?\s*[:\-]?\s/i.test(raw)) return true;
  if (/^(spoken\s+)?languages?\s*$/i.test(raw)) return true;
  // Parenthetical proficiency form
  if (/^[A-Z][a-z]+\s*\(\s*(?:fluent|native|professional|conversational|intermediate|basic|beginner|advanced|proficient|elementary|limited|working)\s*\)\s*$/i.test(raw)) {
    return true;
  }
  // Name contains a known spoken language AND a proficiency keyword
  const hasSpoken = SPOKEN_LANGUAGE_PATTERN.test(raw);
  const hasProf = /\b(fluent|native|professional|conversational|intermediate|basic|beginner|advanced|proficient|elementary|limited|working)\b/i.test(raw);
  if (hasSpoken && hasProf) return true;
  // CSV of known spoken languages — e.g. "English, Hindi, Spanish"
  if (/[,•·|]/.test(raw)) {
    const parts = raw.split(/[,•·|]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => SPOKEN_LANGUAGE_PATTERN.test(p))) {
      return true;
    }
  }
  return false;
}

/** Extract one or more {name, proficiency} entries from a cert row that's
 *  actually a language declaration. */
function extractLanguagesFromCertEntry(entry: {
  name?: string;
  issuer?: string;
}): Array<{ name: string; proficiency: string }> {
  const raw = `${entry.name || ''}${entry.issuer ? ' ' + entry.issuer : ''}`.trim();
  if (!raw) return [];
  // Strip leading "Languages:" / "Spoken Languages:" prefix
  const body = raw.replace(/^(spoken\s+)?languages?\s*[:\-]?\s*/i, '').trim();
  if (!body) return [];

  const out: Array<{ name: string; proficiency: string }> = [];
  const seen = new Set<string>();
  // Split on commas/bullets/pipes — but NOT commas inside parens.
  const parts: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of body) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (depth === 0 && /[,;|·•]/.test(ch)) {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) parts.push(buf.trim());

  for (const part of parts) {
    let name = '';
    let proficiency = '';
    const paren = part.match(/^([^()]+?)\s*\(([^)]+)\)\s*\.?$/);
    const sep = part.match(/^(.+?)\s*[:\-–—|]\s*(.+?)\s*\.?$/);
    if (paren) {
      name = cleanString(paren[1]);
      proficiency = cleanString(paren[2]);
    } else if (sep) {
      name = cleanString(sep[1]);
      proficiency = cleanString(sep[2]);
    } else {
      name = cleanString(part);
    }
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, proficiency });
  }
  return out;
}

/**
 * Walk a certifications[] array and split it into:
 *  - real certifications (kept)
 *  - language entries that snuck in (moved to languages output)
 */
export function splitCertificationsAndExtraLanguages(input: unknown): {
  certifications: Array<{ name: string; issuer: string; date: string; url: string }>;
  extraLanguages: Array<{ name: string; proficiency: string }>;
} {
  if (!Array.isArray(input)) return { certifications: [], extraLanguages: [] };
  const certs: Array<{ name: string; issuer: string; date: string; url: string }> = [];
  const langs: Array<{ name: string; proficiency: string }> = [];
  for (const raw of input) {
    if (!raw) continue;
    let entry: { name?: string; issuer?: string; date?: string; url?: string };
    if (typeof raw === 'string') {
      entry = { name: raw };
    } else if (typeof raw === 'object') {
      const rec = raw as Record<string, unknown>;
      entry = {
        name: cleanString(rec.name ?? rec.title ?? rec.certification),
        issuer: cleanString(rec.issuer ?? rec.organization ?? rec.issuingOrganization),
        date: cleanString(rec.date ?? rec.year ?? rec.issuedDate),
        url: cleanString(rec.url ?? rec.link ?? rec.credentialUrl),
      };
    } else {
      continue;
    }
    if (looksLikeLanguageDeclaration(entry)) {
      const extracted = extractLanguagesFromCertEntry(entry);
      langs.push(...extracted);
    } else if (entry.name) {
      certs.push({
        name: entry.name,
        issuer: entry.issuer || '',
        date: normalizeDate(entry.date || '') || (entry.date || ''),
        url: entry.url || '',
      });
    }
  }
  return { certifications: certs, extraLanguages: langs };
}

function experienceKey(exp: ExtractedResumeData['experience'][0]): string {
  return [
    (exp.company || '').toLowerCase(),
    (exp.position || '').toLowerCase(),
    normalizeDate(exp.startDate),
  ].join('|');
}

function educationKey(edu: ExtractedResumeData['education'][0]): string {
  return [
    (edu.institution || '').toLowerCase(),
    (edu.degree || '').toLowerCase(),
    normalizeDate(edu.endDate),
  ].join('|');
}

/** Split "Hindi & English" / "English and Hindi" into separate language names. */
function splitCompoundLanguageNames(name: string): string[] {
  const s = cleanString(name);
  if (!s) return [];
  const parts = s
    .split(/\s*(?:&|\/|\||\band\b)\s*/i)
    .map((p) => p.trim().replace(/[.,;]+$/, ''))
    .filter((p) => p.length >= 2 && p.length <= 40);
  if (parts.length > 1 && parts.every((p) => /^[A-Za-z]/.test(p))) {
    return parts;
  }
  return [s];
}

export function normalizeExtractedResumeData(data: ExtractedResumeData): ExtractedResumeData {
  const traceInput = data;
  // STEP 0a: move language declarations OUT of certifications[]
  const { certifications: realCerts, extraLanguages: certLangs } =
    splitCertificationsAndExtraLanguages(data.certifications);

  // STEP 0b: split mis-categorized languages → skills BEFORE dedupe.
  // Feed any rescued cert-row languages into the input.
  const combinedLanguagesInput = [
    ...((data.languages as unknown[]) || []),
    ...certLangs,
  ];
  const { languages: reclassifiedLangs, extraSkills } = splitLanguagesAndExtraSkills(
    combinedLanguagesInput
  );
  const skills = dedupeStrings(
    [...(data.skills || []), ...extraSkills].filter((s) => !isSectionLabel(String(s || '')))
  );

  const experienceMap = new Map<string, ExtractedResumeData['experience'][0]>();
  for (const exp of data.experience || []) {
    const company = cleanString(exp.company);
    const position = cleanString(exp.position);
    if (!company && !position) continue;

    const startDate = normalizeDate(exp.startDate);
    const endDate = normalizeDate(exp.endDate);
    const current =
      exp.current ||
      !endDate ||
      endDate.toLowerCase() === 'present';

    let achievements = Array.isArray(exp.achievements)
      ? exp.achievements.map((a) => cleanString(a)).filter(Boolean)
      : [];
    // Split bullets BEFORE cleanString collapses newlines — otherwise we lose
    // every multi-line description as a single run-on paragraph.
    const rawDesc = String(exp.description ?? '');
    const desc = cleanMultiline(rawDesc);
    if (rawDesc) {
      const bullets = splitBullets(rawDesc);
      if (bullets.length > 1) {
        achievements = dedupeStrings([...achievements, ...bullets]);
      } else if (achievements.length === 0 && bullets.length === 1) {
        achievements = bullets;
      }
    }

    const normalized = {
      company,
      position,
      location: cleanString(exp.location),
      startDate,
      // IMPORTANT: keep endDate EMPTY when current — templates render "Present"
      // from the `current` flag. Duplicating "Present" in endDate causes the
      // observed bug where the preview shows "Present" twice.
      endDate: current ? '' : endDate,
      current,
      description: desc,
      achievements: dedupeStrings(achievements),
    };

    const key = experienceKey(normalized);
    if (!experienceMap.has(key)) {
      experienceMap.set(key, normalized);
    }
  }

  const educationMap = new Map<string, ExtractedResumeData['education'][0]>();
  for (const edu of data.education || []) {
    const institution = cleanString(edu.institution);
    const degree = cleanString(edu.degree);
    if (!institution && !degree) continue;

    const normalized = {
      institution,
      degree,
      field: cleanString(edu.field),
      startDate: normalizeDate(edu.startDate),
      endDate: normalizeDate(edu.endDate),
      gpa: cleanString(edu.gpa),
      description: cleanString(edu.description),
    };
    const key = educationKey(normalized);
    if (!educationMap.has(key)) {
      educationMap.set(key, normalized);
    }
  }

  // Use the certs that survived the language-row reclassification.
  // Polluted entries like "Languages: English, Hindi" were already moved to
  // the languages bucket above.
  const certifications = realCerts.map((c) => ({
    name: cleanString(c.name),
    issuer: cleanString(c.issuer),
    date: normalizeDate(c.date),
    url: cleanString(c.url),
  })).filter((c) => c.name);

  const certNames = new Set<string>();
  const uniqueCerts: typeof certifications = [];
  for (const c of certifications) {
    const k = c.name.toLowerCase();
    if (certNames.has(k)) continue;
    certNames.add(k);
    uniqueCerts.push(c);
  }

  const languages = reclassifiedLangs;

  const summary = cleanMultiline(data.summary);

  const normalized: ExtractedResumeData = {
    ...data,
    fullName: cleanString(data.fullName),
    email: cleanString(data.email),
    phone: cleanString(data.phone),
    location: cleanString(data.location),
    linkedin: cleanString(data.linkedin),
    portfolio: cleanString(data.portfolio),
    summary,
    skills,
    experience: Array.from(experienceMap.values()),
    education: Array.from(educationMap.values()),
    achievements: Array.isArray(data.achievements)
      ? dedupeStrings(data.achievements.map((a) => cleanString(a)).filter(Boolean))
      : [],
    projects: (data.projects || [])
      .map((p: ExtractedResumeData['projects'][0]) => {
        const name =
          cleanString(p.name) ||
          cleanString((p as { title?: string }).title) ||
          cleanString((p as { projectName?: string }).projectName);
        if (name && isPlausibleProjectName(name) && !isPlaceholderProjectTitle(name)) {
          return { ...p, name };
        }
        const description = cleanString(p.description || (p as { summary?: string }).summary);
        const tech = (p as { technologies?: unknown[] }).technologies;
        const hasTech = Array.isArray(tech) ? tech.length > 0 : false;
        if (description || hasTech) {
          // Do not fabricate "Software Project" / "Project N" — drop until a real title exists.
          console.log('REMOVED PROJECT', p, 'reason', 'normalizeExtractedResumeData: no valid title');
          return null;
        }
        console.log('REMOVED PROJECT', p, 'reason', 'normalizeExtractedResumeData: no name and no content');
        return null;
      })
      .filter((p): p is NonNullable<typeof p> => p != null),
    certifications: uniqueCerts,
    languages,
    confidence: data.confidence ?? 0,
    rawText: data.rawText || '',
  };
  if (isImportFieldTraceEnabled()) {
    traceImportStageTransform(
      '6_normalize_extracted_resume_data',
      traceInput,
      normalized,
      'normalize-extracted'
    );
  }
  return normalized;
}

/**
 * Normalize language list: input may be strings (possibly "English (Fluent)"),
 * or { name, proficiency } objects. Output is always [{ name, proficiency }].
 */
export function normalizeLanguageList(
  input: unknown
): Array<{ name: string; proficiency: string }> {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: Array<{ name: string; proficiency: string }> = [];
  for (const raw of input) {
    let name = '';
    let proficiency = '';
    if (typeof raw === 'string') {
      const split = splitLangString(raw);
      name = split.name;
      proficiency = split.proficiency;
    } else if (raw && typeof raw === 'object') {
      const rec = raw as Record<string, unknown>;
      name = cleanString(rec.name ?? rec.language ?? rec.Language ?? rec.title);
      proficiency = cleanString(
        rec.proficiency ?? rec.level ?? rec.fluency ?? rec.Proficiency
      );
      if (!proficiency && name) {
        const split = splitLangString(name);
        name = split.name;
        proficiency = split.proficiency;
      }
    }
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, proficiency: proficiency || '' });
  }
  return out;
}

function splitLangString(raw: string): { name: string; proficiency: string } {
  const s = cleanString(raw);
  if (!s) return { name: '', proficiency: '' };
  // "English (Fluent)" / "Hindi (Native)"
  const paren = s.match(/^([^()]+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    return {
      name: cleanString(paren[1]),
      proficiency: cleanString(paren[2]),
    };
  }
  // "English - Fluent" / "Hindi: Native" / "English | Native"
  const sep = s.match(/^(.+?)\s*[:\-–—|]\s*(.+)$/);
  if (sep) {
    return {
      name: cleanString(sep[1]),
      proficiency: cleanString(sep[2]),
    };
  }
  return { name: s, proficiency: '' };
}

/** Expand compound language strings into individual entries. */
export function expandCompoundLanguages(
  input: unknown
): Array<{ name: string; proficiency: string }> {
  const normalized = normalizeLanguageList(input);
  const seen = new Set<string>();
  const out: Array<{ name: string; proficiency: string }> = [];
  for (const lang of normalized) {
    const parts = splitCompoundLanguageNames(lang.name);
    for (const part of parts) {
      const key = part.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name: part, proficiency: lang.proficiency || '' });
    }
  }
  return out;
}

/** Normalize upload API profile object (post-mapping) */
export function normalizeUploadProfile(profile: Record<string, any>): Record<string, any> {
  const traceInput = { ...profile };
  // STEP 1a: scan certifications[] — if any row is actually a language
  // declaration ("Languages: English, Hindi" / "English (Fluent)"), MOVE it
  // out of certifications and feed it back into the languages input.
  const { certifications: realCerts, extraLanguages: certLangs } =
    splitCertificationsAndExtraLanguages(profile.certifications);

  // STEP 1b: split languages[] into real spoken languages + misclassified
  // tech skills (Affinda often dumps Python/JS/TS into languages when a resume
  // has a "Languages" sub-header inside its "TECHNICAL SKILLS" section).
  const combinedLanguagesInput = [
    ...(Array.isArray(profile.languages) ? profile.languages : []),
    ...certLangs,
  ];
  const { languages: reclassifiedLangs, extraSkills } = splitLanguagesAndExtraSkills(
    combinedLanguagesInput
  );

  const skillsInput = Array.isArray(profile.skills) ? profile.skills : [];
  const skillStrings: string[] = [];
  for (const s of skillsInput) {
    if (typeof s === 'string') {
      skillStrings.push(s);
    } else if (s && typeof s === 'object' && (s as { name?: string }).name) {
      skillStrings.push(String((s as { name?: string }).name));
    }
  }
  // Drop any pure section-label entries that Affinda accidentally lifted
  // out of "TECHNICAL SKILLS" sub-headers ("Frameworks", "Databases", ...).
  const skills = isCustomParserImport(profile)
    ? normalizeCustomParserSkillsList([...skillStrings, ...extraSkills])
    : normalizeSkillsList([...skillStrings, ...extraSkills]);

  const experienceSource = Array.isArray(profile.experience) && profile.experience.length > 0
    ? profile.experience
    : Array.isArray(profile.workExperience)
      ? profile.workExperience
      : [];

  const experience = experienceSource
    .map((exp: any) => {
      const startDate = normalizeDate(exp.startDate || exp.start_date);
      const endDateRaw = normalizeDate(exp.endDate || exp.end_date);
      const isCurrent =
        exp.current === true ||
        !endDateRaw ||
        endDateRaw.toLowerCase() === 'present';
      return {
        ...exp,
        company: cleanString(
          exp.company ||
            exp.Company ||
            exp.organization ||
            exp.Organization ||
            exp.employer ||
            exp.Employer
        ),
        position: cleanString(exp.position || exp.Position || exp.job_title || exp.title || exp.role),
        location: cleanString(exp.location || exp.Location),
        startDate,
        endDate: isCurrent ? '' : endDateRaw,
        current: isCurrent,
        description: cleanMultiline(exp.description || exp.Description),
        achievements: Array.isArray(exp.achievements)
          ? exp.achievements
              .map((a: unknown) =>
                cleanString(
                  typeof a === 'string'
                    ? a
                    : String(
                        (a as Record<string, unknown> | null)?.title ??
                          (a as Record<string, unknown> | null)?.description ??
                          ''
                      )
                )
              )
              .filter(Boolean)
          : [],
      };
    })
    .filter((exp: any) => exp.company || exp.position);

  // Dedupe — must NOT collapse distinct roles when dates are missing.
  // Previous key used only startDate; when startDate is empty for multiple jobs,
  // entries can be incorrectly dropped (appears as merged/flattened experience).
  const seenExp = new Set<string>();
  const uniqueExp = experience.filter((exp: any, idx: number) => {
    const company = String(exp.company || '').trim();
    const position = String(exp.position || '').trim();
    const start = String(exp.startDate || '').trim();
    const end = String(exp.endDate || '').trim();

    // If both dates are missing, treat as unique to preserve boundaries.
    if (!start && !end) return true;

    const key = `${company}|${position}|${start || '?'}|${end || '?'}`.toLowerCase();
    if (seenExp.has(key)) return false;
    seenExp.add(key);
    return true;
  });

  // Ensure only ONE current=true — if multiple are marked current, keep the most recent
  // (first after downstream sorting) and demote others.
  const currentIdxs = uniqueExp
    .map((e: any, i: number) => ({ i, current: e.current === true }))
    .filter((r) => r.current)
    .map((r) => r.i);
  if (currentIdxs.length > 1) {
    for (let j = 1; j < currentIdxs.length; j++) {
      uniqueExp[currentIdxs[j]].current = false;
      // endDate should stay as parsed; do not force "Present".
    }
  }

  const education = (Array.isArray(profile.education) ? profile.education : [])
    .map((edu: any) => ({
      ...edu,
      institution: cleanString(edu.institution || edu.Institution || edu.school),
      degree: cleanString(edu.degree || edu.Degree),
      field: cleanString(edu.field || edu.Field),
      endDate: normalizeDate(edu.endDate || edu.year || edu.end_date),
    }))
    .filter((edu: any) => {
      const inst = edu.institution || '';
      const deg = edu.degree || '';
      return (inst || deg) && !/\.(pdf|docx?)\b/i.test(deg) && !/parsing failed/i.test(deg);
    });

  const normalizedProfile = {
    ...profile,
    fullName: cleanString(profile.fullName || profile.name),
    name: cleanString(profile.fullName || profile.name),
    email: cleanString(profile.email),
    phone: cleanString(profile.phone),
    location: cleanString(profile.location || profile.address),
    linkedin: cleanString(profile.linkedin),
    portfolio: cleanString(profile.portfolio || profile.website),
    summary: cleanMultiline(profile.summary),
    skills,
    experience: uniqueExp,
    education,
    certifications: dedupeCertifications(realCerts),
    languages: expandCompoundLanguages(
      reclassifiedLangs.map((l) => ({
        name: l.name,
        proficiency: l.proficiency || 'Fluent',
      }))
    ),
  };
  if (isImportFieldTraceEnabled()) {
    traceImportStageTransform(
      '8_normalize_upload_profile',
      traceInput,
      normalizedProfile,
      'normalize-upload-profile'
    );
  }
  return normalizedProfile;
}

function dedupeCertifications(
  certs: Array<{ name: string; issuer: string; date: string; url: string }>
): Array<{ name: string; issuer: string; date: string; url: string }> {
  const seen = new Set<string>();
  const out: typeof certs = [];
  for (const c of certs) {
    const key = `${c.name}|${c.issuer}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
