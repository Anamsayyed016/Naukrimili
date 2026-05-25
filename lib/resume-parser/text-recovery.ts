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

  out.summary = extractSection(text, ['summary', 'professional summary', 'objective', 'career objective', 'profile', 'about me', 'about'])?.body.trim() || '';
  if (out.summary.length > 1500) out.summary = out.summary.slice(0, 1500);

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

const SECTION_ALIASES = {
  summary: ['summary', 'professional summary', 'objective', 'career objective', 'profile', 'about me', 'about'],
  experience: ['experience', 'work experience', 'professional experience', 'work history', 'employment', 'employment history', 'career history', 'professional background'],
  education: ['education', 'academic background', 'qualifications', 'academic qualifications', 'educational background', 'degrees', 'schooling'],
  skills: ['skills', 'technical skills', 'core skills', 'key skills', 'competencies', 'technical competencies', 'technologies', 'tools'],
  projects: ['projects', 'personal projects', 'key projects', 'notable projects', 'portfolio projects'],
  certifications: ['certifications', 'certificates', 'licenses', 'licenses and certifications'],
  languages: ['languages', 'language skills', 'spoken languages'],
  achievements: ['achievements', 'accomplishments', 'awards', 'honors', 'recognition', 'awards and honors'],
  interests: ['interests', 'hobbies', 'personal interests', 'extracurricular'],
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

const COMPANY_MARKERS = /\b(?:inc\.?|ltd\.?|llc|corp(?:oration)?|gmbh|co\.?|company|technologies|solutions|systems|labs|studios|consulting|consultancy|industries|group|enterprises|services|associates|partners|llp)\b/i;
const ROLE_MARKERS = /\b(?:engineer|developer|architect|manager|director|lead|head|consultant|analyst|designer|administrator|administrator|specialist|coordinator|associate|executive|officer|programmer|intern|trainee|founder|owner|ceo|cto|cfo|coo|vp|president|principal|scientist|researcher)\b/i;

const DATE_RANGE_REGEX = /((?:[A-Za-z]{3,9}\.?\s+)?(?:19|20)\d{2})\s*[-–—to]+\s*((?:[A-Za-z]{3,9}\.?\s+)?(?:19|20)\d{2}|present|current|now|ongoing)/i;
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
    // Collapse runs of spaces/tabs WITHIN a line, but preserve \n
    .replace(/[ \t]+/g, ' ')
    // Collapse 3+ blank lines to 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Top-level: parse a resume's raw text into the same shape Affinda/AI returns.
 * Designed to be permissive — emits empty arrays when uncertain, never fabricates.
 */
export function extractResumeFromText(rawText: string): ExtractedResumeData {
  const text = cleanResumeTextPreservingLines(rawText || '');

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
  result.fullName = extractName(text);
  result.location = extractLocation(text);

  // 2. Section-driven extraction
  result.summary = extractSection(text, SECTION_ALIASES.summary)?.body?.trim().slice(0, 1500) || '';

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
    result.education = parseEducation(eduBlock.body);
  }

  const projBlock = extractSection(text, SECTION_ALIASES.projects);
  if (projBlock) {
    result.projects = parseProjects(projBlock.body);
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

  return result;
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

function isHeadingLineFor(line: string, aliases: readonly string[]): boolean {
  const stripped = line.replace(/[\s\W]+$/, '').trim();
  if (!stripped) return false;
  // Combined headings can be a bit longer: "Certifications & Languages"
  if (stripped.length > 80) return false;
  const normalized = stripped
    .toLowerCase()
    .replace(/[:|\-_=]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Exact alias match
  if (aliases.some((alias) => alias === normalized)) return true;

  // Combined heading: split on "&", "/", " and ", "+" — match if ANY part matches.
  if (/(\s(?:&|and|\/|\+)\s)/.test(` ${normalized} `)) {
    const parts = normalized
      .split(/\s(?:&|and|\/|\+)\s/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.some((p) => aliases.some((alias) => alias === p))) return true;
  }
  return false;
}

function isAnyHeadingLine(line: string): boolean {
  return isHeadingLineFor(line, ALL_HEADINGS);
}

/* ------------------------------------------------------------------ */
/*  Field extractors                                                   */
/* ------------------------------------------------------------------ */

function extractName(text: string): string {
  const lines = text.split('\n').map((l) => l.trim());
  const trySegment = (raw: string): string | null => {
    const seg = raw.trim();
    if (!seg) return null;
    if (seg.length < 3 || seg.length > 60) return null;
    if (/[@+]/.test(seg)) return null;
    if (/^https?:|\bwww\./i.test(seg)) return null;
    if (/\d/.test(seg)) return null;
    if (/^%PDF|\bresume\b|\bcv\b|\bcurriculum\b/i.test(seg)) return null;

    // "First Last" / "First Middle Last" — Title case
    if (/^[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+){1,3}$/.test(seg)) return seg;

    // ALL CAPS short multi-word name
    if (/^[A-Z][A-Z\s'-]{2,}$/.test(seg) && seg.split(/\s+/).length >= 2 && seg.length < 50) {
      return seg
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }

    // Single-word names — accept only if it's clearly a personal name token
    if (/^[A-Z][a-z'-]{2,}$/.test(seg)) return seg;

    return null;
  };

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (!line) continue;
    if (isAnyHeadingLine(line)) continue;

    // Direct line match
    const direct = trySegment(line);
    if (direct) return direct;

    // Header with separators: "Anam Sayyed | Software Engineer | New York"
    if (/[|·•\u2022]|\s-\s|\s\u2013\s|\s\u2014\s/.test(line)) {
      const segments = line.split(/\s*[|·•\u2022]\s*|\s+-\s+|\s+[\u2013\u2014]\s+/);
      for (const seg of segments) {
        const found = trySegment(seg);
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
      out.push(cleaned);
    }
  }
  return out;
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
    if (DATE_RANGE_REGEX.test(line) || (ROLE_MARKERS.test(line) && line.length < 100)) {
      if (lastStart >= 0) entries.push({ start: lastStart, end: i });
      lastStart = i;
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
    if (exp.position || exp.company) out.push(exp);
  }
  return out;
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
    if (DATE_RANGE_REGEX.test(chunkLines[i])) {
      dateLineIdx = i;
      const m = chunkLines[i].match(DATE_RANGE_REGEX)!;
      startDate = m[1].trim();
      const endRaw = m[2].trim();
      if (/^(present|current|now|ongoing)$/i.test(endRaw)) {
        current = true;
        endDate = '';
      } else {
        endDate = endRaw;
      }
      break;
    }
  }

  // Title/company are usually in the first 1-2 lines (above or at the date line)
  const headerEnd = dateLineIdx >= 0 ? Math.min(dateLineIdx + 1, chunkLines.length) : Math.min(2, chunkLines.length);
  const headerLines: string[] = [];
  for (let i = 0; i < headerEnd; i++) {
    if (i === dateLineIdx) {
      // strip date span from the header line for parsing the role/company
      const noDates = chunkLines[i].replace(DATE_RANGE_REGEX, '').replace(/[|·•@\-–—]+\s*$/g, '').trim();
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

    // "Role @ Company" or "Role, Company"
    const split = cleaned.match(/^(.+?)\s*(?:@|,|\u2013|\u2014| - )\s*(.+)$/);
    if (split) {
      const left = split[1].trim();
      const right = split[2].trim();
      if (!position && (ROLE_MARKERS.test(left) || !COMPANY_MARKERS.test(left))) position = left;
      else if (!position) position = right;
      if (!company && (COMPANY_MARKERS.test(right) || !ROLE_MARKERS.test(right))) company = right;
      else if (!company) company = left;
      continue;
    }

    if (!position && ROLE_MARKERS.test(cleaned)) position = cleaned;
    else if (!company && COMPANY_MARKERS.test(cleaned)) company = cleaned;
    else if (!position) position = cleaned;
    else if (!company) company = cleaned;
  }

  // Location: look for "City, ST/Country" in first 3 lines
  for (const h of headerLines) {
    const loc = h.match(/\b([A-Z][A-Za-z]+(?:[\s'\-][A-Z][A-Za-z]+)*),\s*([A-Z]{2}|[A-Z][A-Za-z]+)\b/);
    if (loc) {
      location = loc[0];
      break;
    }
  }

  // Description / bullets — everything after the header/date
  const descStart = (dateLineIdx >= 0 ? dateLineIdx + 1 : headerEnd);
  for (let i = descStart; i < chunkLines.length; i++) {
    const l = chunkLines[i].trim();
    if (!l) continue;
    if (/^[•\-\*\u2022\u2023\u25aa]\s+/.test(l) || /^o\s+/i.test(l)) {
      bullets.push(l.replace(/^[•\-\*\u2022\u2023\u25aa]\s+|^o\s+/i, '').trim());
    } else {
      descLines.push(l);
    }
  }

  const description = [...descLines, ...bullets].join('\n').trim();

  return {
    company,
    position,
    location,
    startDate,
    endDate,
    current,
    description,
    achievements: bullets,
  };
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
    const hasInstitution = /\b(university|college|institute|school|academy)\b/i.test(line);
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
      // GPA / CGPA
      const gpaMatch = line.match(/(?:gpa|cgpa)[:\s]*([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
      if (gpaMatch) current.gpa = gpaMatch[1].trim();
      else if (yearMatch && !current.year) current.year = yearMatch[yearMatch.length - 1];
      else if (!current.field && /\b(major|field|specialization)\b/i.test(line)) {
        current.field = line.replace(/^.*?(major|field|specialization)[:\s]*/i, '').trim();
      }
    }
  }
  flush();

  return entries.map((e) => ({
    institution: e.institution,
    degree: e.degree,
    field: e.field,
    startDate: e.startDate,
    endDate: e.year ? e.year : e.endDate,
    gpa: e.gpa,
    description: '',
  }));
}

function parseProjects(block: string): NonNullable<ExtractedResumeData['projects']> {
  if (!block) return [];
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: NonNullable<ExtractedResumeData['projects']> = [];
  let current: { name: string; description: string; technologies: string[]; url?: string } | null = null;

  const flush = () => {
    if (current && current.name) out.push(current);
    current = null;
  };

  for (const line of lines) {
    // A project header is typically a short, title-cased line, possibly with a colon.
    const isHeader =
      line.length < 100 &&
      (/^[A-Z][A-Za-z0-9 &/\-_'.]{2,}(?::|$)/.test(line) || /^[•\-\*]\s+[A-Z]/.test(line));

    if (isHeader && (!current || current.description.length > 30)) {
      flush();
      const name = line
        .replace(/^[•\-\*\u2022]\s+/, '')
        .replace(/:.*$/, '')
        .trim();
      current = { name, description: '', technologies: [] };
      const inlineDesc = line.includes(':') ? line.split(':').slice(1).join(':').trim() : '';
      if (inlineDesc) current.description = inlineDesc;
      continue;
    }

    if (!current) continue;
    const techMatch = line.match(/^(?:tech(?:nologies)?|stack|built\s+with|tools)\s*:\s*(.+)$/i);
    if (techMatch) {
      current.technologies = techMatch[1].split(/[,;|/]/).map((t) => t.trim()).filter(Boolean);
      continue;
    }
    const urlMatch = line.match(/(https?:\/\/[^\s)]+)/);
    if (urlMatch) current.url = urlMatch[1];

    current.description = current.description
      ? `${current.description}\n${line}`
      : line;
  }
  flush();
  return out;
}

function parseCertifications(block: string): NonNullable<ExtractedResumeData['certifications']> {
  if (!block) return [];
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: NonNullable<ExtractedResumeData['certifications']> = [];

  for (const raw of lines) {
    const line = raw.replace(/^[•\-\*\u2022]\s+/, '').trim();
    if (!line) continue;
    if (line.length > 250) continue;
    // Skip standalone year lines
    if (/^(?:19|20)\d{2}(?:\s*[-–—]\s*(?:19|20)\d{2})?$/.test(line)) continue;

    // Capture parenthetical year range "(2024-2025)" / "(2024 – 2025)" / "(2024)"
    const yearRangeParen = line.match(
      /\(\s*((?:19|20)\d{2})(?:\s*[-–—to]+\s*((?:19|20)\d{2}|present|current))?\s*\)/i
    );
    const yearMatch = line.match(/(19|20)\d{2}(?:\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current))?/i);
    const urlMatch = line.match(/(https?:\/\/[^\s)]+)/);

    let date = '';
    if (yearRangeParen) {
      date = yearRangeParen[2]
        ? `${yearRangeParen[1]}-${yearRangeParen[2]}`
        : yearRangeParen[1];
    } else if (yearMatch) {
      date = yearMatch[0].replace(/\s*[-–—]\s*/, '-');
    }

    // Strip the parenthetical date + url so they don't leak into name/issuer
    const stripped = line
      .replace(/\([^)]*(?:19|20)\d{2}[^)]*\)/g, '')
      .replace(/https?:\/\/[^\s)]+/g, '')
      .trim();

    // Split on em/en-dash / pipe / colon / comma — prefer em-dash split
    let name = stripped;
    let issuer = '';

    // "Full-Stack Python Developer — Cybrom Technology" (em or en dash with spaces)
    const dashSplit = stripped.match(/^(.+?)\s+[–—]\s+(.+)$/);
    if (dashSplit) {
      name = dashSplit[1].trim();
      issuer = dashSplit[2].trim();
    } else {
      const pipeSplit = stripped.split(/\s*\|\s*/);
      if (pipeSplit.length >= 2) {
        name = pipeSplit[0].trim();
        issuer = pipeSplit
          .slice(1)
          .filter((s) => !/^(19|20)\d{2}$/.test(s.trim()))
          .join(' ')
          .trim();
      } else {
        const commaSplit = stripped.split(/\s*,\s*/);
        if (commaSplit.length >= 2) {
          name = commaSplit[0].trim();
          issuer = commaSplit
            .slice(1)
            .filter((s) => !/^(19|20)\d{2}$/.test(s.trim()))
            .join(', ')
            .trim();
        }
      }
    }

    name = name.replace(/[(\[].*?[)\]]/g, '').replace(/[-–—,]+$/, '').trim();
    issuer = issuer.replace(/[(\[].*?[)\]]/g, '').trim();

    if (!name || name.length < 3) continue;

    out.push({
      name,
      issuer,
      date,
      url: urlMatch ? urlMatch[1] : '',
    });
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
      if (depth === 0 && /[,;|·•\u2022]/.test(ch)) {
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
    // stray skill entries; we never want those leaking into the LanguagesStep.
    if (looksLikeTechLanguageToken(name) && !proficiency) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, proficiency });
  }
  return out;
}

const TECH_LANG_TOKEN_RE =
  /^(python|javascript|typescript|java|kotlin|swift|ruby|php|html|css|sql|nosql|node\.?js|react(?:\.?js)?|vue\.?js?|angular(?:js)?|django|flask|express|spring|laravel|rails|c\+\+|c#|golang|rust|scala|perl|matlab|dart|shell|bash|powershell|graphql|mysql|postgresql|mongodb|redis|sqlite|docker|kubernetes|aws|azure|gcp|firebase|tensorflow|pytorch)$/i;

function looksLikeTechLanguageToken(name: string): boolean {
  const s = name.trim();
  if (!s) return false;
  if (TECH_LANG_TOKEN_RE.test(s)) return true;
  if (/\.(js|ts|py|rb|go|cpp|cs|sh|sql|html|css)$/i.test(s)) return true;
  if (/\+\+|#$/.test(s)) return true;
  return false;
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
