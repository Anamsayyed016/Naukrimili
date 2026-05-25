/**
 * Resume extraction normalizer — dedupe, dates, confident-only fields.
 * Used by Affinda adapter, upload API, and import transformer.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

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
export function normalizeDate(value: unknown): string {
  const raw = cleanString(value);
  if (!raw) return '';

  const lower = raw.toLowerCase();
  if (['present', 'current', 'now', 'ongoing'].includes(lower)) {
    return 'Present';
  }

  const iso = raw.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (iso) return `${iso[1]}-${iso[2]}`;

  const monthYear = raw.match(/([A-Za-z]{3,9})\s+(\d{4})/);
  if (monthYear) {
    const months: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const key = monthYear[1].slice(0, 3).toLowerCase();
    if (months[key]) return `${monthYear[2]}-${months[key]}`;
  }

  const yearOnly = raw.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) return yearOnly[0];

  return raw;
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
    .split(/\n|•|·|▪|‣|\u2023|\u25aa|(?:\s*[-–—]\s+)/)
    .map((s) => cleanString(s.replace(/^[\s\-–—*•·]+/, '')))
    .filter((s) => s.length > 6);
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
  /\b(python|javascript|typescript|java|kotlin|swift|ruby|php|html|css|sql|nosql|node\.?js|react(?:\.?js)?|vue\.?js?|angular(?:js)?|django|flask|express|spring|laravel|rails|c\+\+|c#|c\b|golang|go\b|rust|scala|perl|matlab|dart|assembly|cobol|fortran|haskell|elixir|erlang|clojure|lua|bash|shell|powershell|graphql|rest(?:ful)?|mysql|postgresql|mongodb|redis|sqlite|docker|kubernetes|aws|azure|gcp|firebase|tensorflow|pytorch|pandas|numpy|jquery|bootstrap|tailwind|sass|webpack|babel|eslint|jest|cypress|git|github|gitlab|jenkins|terraform|ansible|figma|postman|jira|swagger|json|xml|yaml|markdown|api(?:s)?|sdk)\b|\.(js|ts|jsx|tsx|py|rb|go|cpp|cs|sh|sql|html|css)$|\+\+/i;

export function isLikelySpokenLanguage(name: string): boolean {
  if (!name) return false;
  return SPOKEN_LANGUAGE_PATTERN.test(name);
}

export function isLikelyTechTerm(name: string): boolean {
  if (!name) return false;
  return TECH_TERM_PATTERN.test(name);
}

/**
 * Decide whether a candidate `languages[]` entry is actually a spoken
 * language or a misclassified technical skill.
 *
 *   - Has proficiency (Fluent/Native/Conversational/...) → trust as language.
 *   - Name matches a known spoken-language pattern → language.
 *   - Otherwise, if name matches a known tech-term pattern → demote to skill.
 *   - Anything else with no proficiency and no signal → also demoted (safer).
 */
export function classifyLanguageEntry(entry: {
  name: string;
  proficiency?: string;
}): 'language' | 'skill' {
  const name = (entry.name || '').trim();
  const proficiency = (entry.proficiency || '').trim();
  if (!name) return 'language';
  if (proficiency && !isLikelyTechTerm(name)) return 'language';
  if (isLikelySpokenLanguage(name)) return 'language';
  if (isLikelyTechTerm(name)) return 'skill';
  // Unknown — if has proficiency, keep as language; else demote
  return proficiency ? 'language' : 'skill';
}

/**
 * Reclassify an input languages[] into proper spoken languages vs. items
 * that should be moved to skills. Returns both arrays.
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
    } else {
      extraSkills.push(entry.name);
    }
  }
  return { languages, extraSkills };
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

export function normalizeExtractedResumeData(data: ExtractedResumeData): ExtractedResumeData {
  // STEP 0: split mis-categorized languages → skills BEFORE dedupe
  const { languages: reclassifiedLangs, extraSkills } = splitLanguagesAndExtraSkills(
    data.languages
  );
  const skills = dedupeStrings([...(data.skills || []), ...extraSkills]);

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

  const certifications = (data.certifications || [])
    .map((c) => ({
      name: cleanString(c.name),
      issuer: cleanString(c.issuer),
      date: normalizeDate(c.date),
      url: cleanString(c.url),
    }))
    .filter((c) => c.name);

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

  return {
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
    projects: (data.projects || []).filter((p) => cleanString(p.name)),
    certifications: uniqueCerts,
    languages,
    confidence: data.confidence ?? 0,
    rawText: data.rawText || '',
  };
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

/** Normalize upload API profile object (post-mapping) */
export function normalizeUploadProfile(profile: Record<string, any>): Record<string, any> {
  // STEP 1: split languages[] into real spoken languages + misclassified
  // tech skills (Affinda often dumps Python/JS/TS into languages when a resume
  // has a "Languages" sub-header inside its "TECHNICAL SKILLS" section).
  const { languages: reclassifiedLangs, extraSkills } = splitLanguagesAndExtraSkills(
    profile.languages
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
  const skills = dedupeStrings([...skillStrings, ...extraSkills]);

  const experience = (Array.isArray(profile.experience) ? profile.experience : [])
    .map((exp: any) => {
      const startDate = normalizeDate(exp.startDate || exp.start_date);
      const endDateRaw = normalizeDate(exp.endDate || exp.end_date);
      const isCurrent =
        exp.current === true ||
        !endDateRaw ||
        endDateRaw.toLowerCase() === 'present';
      return {
        ...exp,
        company: cleanString(exp.company || exp.Company || exp.organization),
        position: cleanString(exp.position || exp.Position || exp.job_title || exp.title || exp.role),
        startDate,
        // SINGLE source of truth for "Present" — empty endDate + current=true.
        endDate: isCurrent ? '' : endDateRaw,
        current: isCurrent,
        description: cleanMultiline(exp.description || exp.Description),
        achievements: Array.isArray(exp.achievements)
          ? exp.achievements
              .map((a: unknown) =>
                cleanString(
                  typeof a === 'string'
                    ? a
                    : String((a as Record<string, unknown> | null)?.title ?? (a as Record<string, unknown> | null)?.description ?? '')
                )
              )
              .filter(Boolean)
          : [],
      };
    })
    .filter((exp: any) => exp.company || exp.position);

  const seenExp = new Set<string>();
  const uniqueExp = experience.filter((exp: any) => {
    const key = `${exp.company}|${exp.position}|${exp.startDate}`.toLowerCase();
    if (seenExp.has(key)) return false;
    seenExp.add(key);
    return true;
  });

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

  return {
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
    languages: reclassifiedLangs.map((l) => ({
      name: l.name,
      proficiency: l.proficiency || 'Fluent',
    })),
  };
}
