/**
 * Human language line parsing — proficiency detection and name validation.
 */

import { KNOWN_TECH_ACRONYMS_RE } from '../skills-intelligence/validate';

export interface ParsedLanguageLine {
  name: string;
  proficiency: string;
  confidence: number;
}

/** Common human languages (ISO-style names) — not resume-specific. */
const HUMAN_LANGUAGE_NAMES = new Set([
  'english', 'hindi', 'spanish', 'french', 'german', 'italian', 'portuguese', 'russian',
  'arabic', 'chinese', 'mandarin', 'cantonese', 'japanese', 'korean', 'bengali', 'punjabi',
  'tamil', 'telugu', 'marathi', 'gujarati', 'kannada', 'malayalam', 'urdu', 'nepali',
  'dutch', 'swedish', 'norwegian', 'danish', 'finnish', 'polish', 'czech', 'hungarian',
  'romanian', 'greek', 'turkish', 'hebrew', 'thai', 'vietnamese', 'indonesian', 'malay',
  'filipino', 'tagalog', 'swahili', 'afrikaans', 'ukrainian', 'persian', 'farsi',
  'latin', 'sanskrit', 'assamese', 'odia', 'oriya', 'bhojpuri', 'konkani', 'kashmiri',
  'sinhala', 'burmese', 'khmer', 'lao', 'amharic', 'yoruba', 'igbo', 'hausa', 'zulu',
  'welsh', 'irish', 'scottish gaelic', 'catalan', 'basque', 'galician', 'serbian',
  'croatian', 'bosnian', 'bulgarian', 'slovak', 'slovenian', 'lithuanian', 'latvian',
  'estonian', 'albanian', 'macedonian', 'georgian', 'armenian', 'azerbaijani',
]);

const PROFICIENCY_PATTERNS: Array<{ re: RegExp; label: string; weight: number }> = [
  { re: /\b(?:native|mother\s*tongue|mothertongue|first\s*language)\b/i, label: 'Native', weight: 95 },
  { re: /\b(?:fluent|fluency|full\s*professional)\b/i, label: 'Fluent', weight: 90 },
  { re: /\b(?:excellent)\b/i, label: 'Fluent', weight: 85 },
  { re: /\b(?:professional(?:\s+working)?|proficient|advanced|expert)\b/i, label: 'Professional', weight: 85 },
  { re: /\b(?:very\s+good|good)\b/i, label: 'Professional', weight: 70 },
  { re: /\b(?:intermediate|conversational|working|fair|average|moderate)\b/i, label: 'Intermediate', weight: 75 },
  { re: /\b(?:basic|elementary|beginner|limited)\b/i, label: 'Basic', weight: 65 },
  { re: /\b(?:reading|write|writing|speak|speaking|listen|listening)\b/i, label: 'Partial', weight: 55 },
  { re: /\b(?:c1|c2|b1|b2|a1|a2)\b/i, label: 'CEFR', weight: 80 },
];

/** Skill-mode column words from proficiency grids — never language names. */
const LANGUAGE_MODE_WORD_RE = /\b(?:speaking|reading|writing|listening|understanding|spoken|written)\b/i;

/** Grid header row like "Speaking Reading Writing" — only mode words. */
function isProficiencyGridHeader(text: string): boolean {
  const words = text.trim().split(/[\s,|/]+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;
  return words.every((w) => LANGUAGE_MODE_WORD_RE.test(w));
}

/** Line made only of proficiency adjectives — a grid row like "Excellent Excellent Excellent". */
function isProficiencyOnlyLine(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 80) return false;
  const leftover = t
    .replace(/\b(?:native|fluent|excellent|very\s+good|good|professional|proficient|advanced|expert|intermediate|conversational|working|fair|average|moderate|basic|elementary|beginner|limited|c1|c2|b1|b2|a1|a2)\b/gi, ' ')
    .replace(/[\s,;|/·•-]+/g, ' ')
    .trim();
  return leftover.length === 0 && t.length >= 4;
}

const PROGRAMMING_LANGUAGE_RE =
  /\b(?:javascript|typescript|python|java|c\+\+|c#|ruby|php|go|rust|kotlin|swift|scala|perl|r\b|matlab|sql|html|css)\b/i;

function normalizeLanguageName(raw: string): string {
  return raw
    .trim()
    .replace(/^[\s\-–—•*]+/, '')
    .replace(/[\s\-–—•*]+$/, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ');
}

function isHumanLanguageName(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (!lower || lower.length < 2 || lower.length > 40) return false;
  if (LANGUAGE_MODE_WORD_RE.test(lower)) return false;
  if (
    /^(?:native|fluent|professional|intermediate|basic|beginner|conversational|advanced|elementary|mother\s*tongue|proficient)$/i.test(
      lower
    )
  ) {
    return false;
  }
  if (KNOWN_TECH_ACRONYMS_RE.test(lower)) return false;
  if (PROGRAMMING_LANGUAGE_RE.test(lower) && !HUMAN_LANGUAGE_NAMES.has(lower)) return false;
  if (HUMAN_LANGUAGE_NAMES.has(lower)) return true;
  // Unknown single-token names are too ambiguous ("Full", "Stack", company stubs).
  // Require the allow-list unless the candidate is a multi-word language name.
  if (/^[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)+$/.test(name) && !PROGRAMMING_LANGUAGE_RE.test(lower)) {
    return true;
  }
  return false;
}

function extractProficiency(text: string): { proficiency: string; remainder: string; confidence: number } {
  for (const { re, label, weight } of PROFICIENCY_PATTERNS) {
    const match = text.match(re);
    if (match) {
      const remainder = text.replace(match[0], ' ').replace(/[()[\],;]/g, ' ').replace(/\s+/g, ' ').trim();
      return { proficiency: label === 'CEFR' ? match[0].toUpperCase() : label, remainder, confidence: weight };
    }
  }
  return { proficiency: '', remainder: text, confidence: 0 };
}

function parseLanguageToken(token: string): ParsedLanguageLine | null {
  const cleaned = token.replace(/^[\s\-–—•*]+/, '').replace(/[()[\]]/g, ' ').trim();
  if (!cleaned || cleaned.length < 2) return null;

  const separators = [
    /^(.+?)\s*[-–—:]\s*(.+)$/,
    /^(.+?)\s*\(([^)]+)\)\s*$/,
    /^(.+?)\s*,\s*(.+)$/,
  ];

  for (const re of separators) {
    const match = cleaned.match(re);
    if (!match) continue;

    const partA = match[1].trim();
    const partB = match[2].trim();

    const profFromB = extractProficiency(partB);
    if (isHumanLanguageName(partA) && profFromB.proficiency) {
      return {
        name: normalizeLanguageName(partA),
        proficiency: profFromB.proficiency,
        confidence: Math.min(95, 70 + profFromB.confidence * 0.2),
      };
    }

    const profFromA = extractProficiency(partA);
    if (isHumanLanguageName(partB) && profFromA.proficiency) {
      return {
        name: normalizeLanguageName(partB),
        proficiency: profFromA.proficiency,
        confidence: Math.min(95, 70 + profFromA.confidence * 0.2),
      };
    }

    if (isHumanLanguageName(partA) && isHumanLanguageName(partB)) continue;

    if (isHumanLanguageName(partA)) {
      const prof = extractProficiency(partB);
      return {
        name: normalizeLanguageName(partA),
        proficiency: prof.proficiency || partB,
        confidence: prof.proficiency ? 78 : 62,
      };
    }
  }

  const prof = extractProficiency(cleaned);
  const nameCandidate = prof.remainder || cleaned;
  if (!isHumanLanguageName(nameCandidate)) return null;

  return {
    name: normalizeLanguageName(nameCandidate),
    proficiency: prof.proficiency,
    confidence: prof.proficiency ? 80 : 68,
  };
}

export interface LanguageSectionParseResult {
  languages: ParsedLanguageLine[];
  rejectedCount: number;
  attemptCount: number;
}

export function parseLanguageLinesFromLine(line: string): ParsedLanguageLine[] {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return [];
  if (/^(?:languages?|language\s+proficiency|spoken\s+languages?)\s*:?\s*$/i.test(trimmed)) {
    return [];
  }

  const inline = trimmed.match(/^(?:languages?)\s*:\s*(.+)$/i);
  if (inline) {
    const tokens = inline[1].split(/[,;|·•]/).map((t) => t.trim()).filter(Boolean);
    const parsed: ParsedLanguageLine[] = [];
    for (const token of tokens) {
      const lang = parseLanguageToken(token);
      if (lang) parsed.push(lang);
    }
    return parsed;
  }

  if (/^\|/.test(trimmed)) {
    const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2 && !/^language/i.test(cells[0])) {
      const lang = parseLanguageToken(`${cells[0]} - ${cells[1]}`);
      return lang ? [lang] : [];
    }
  }

  if (/^[-•*·]\s*/.test(trimmed)) {
    const lang = parseLanguageToken(trimmed.replace(/^[-•*·]\s*/, ''));
    return lang ? [lang] : [];
  }

  if (trimmed.includes(',') && !/[-–—:]/.test(trimmed)) {
    const tokens = trimmed.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    if (tokens.length >= 2 && tokens.every((t) => isHumanLanguageName(t.split(/\s+/)[0]))) {
      const parsed: ParsedLanguageLine[] = [];
      for (const token of tokens) {
        const lang = parseLanguageToken(token);
        if (lang) parsed.push(lang);
      }
      if (parsed.length > 0) return parsed;
    }
  }

  const single = parseLanguageToken(trimmed);
  return single ? [single] : [];
}

export function parseLanguageLine(line: string): ParsedLanguageLine | null {
  const parsed = parseLanguageLinesFromLine(line);
  return parsed.length > 0 ? parsed[0] : null;
}

export function parseLanguagesFromSection(sectionText: string): ParsedLanguageLine[] {
  return parseLanguagesFromSectionWithStats(sectionText).languages;
}

export function parseLanguagesFromSectionWithStats(sectionText: string): LanguageSectionParseResult {
  if (!sectionText?.trim()) {
    return { languages: [], rejectedCount: 0, attemptCount: 0 };
  }

  const lines = sectionText.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedLanguageLine[] = [];
  const seen = new Set<string>();
  let rejectedCount = 0;
  let attemptCount = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/^(?:languages?|language\s+proficiency|spoken\s+languages?)\s*:?\s*$/i.test(line)) {
      continue;
    }
    // Reject personal-detail / passport lines inside language sections.
    if (
      /^(?:date\s+of\s+(?:expiry|issue|birth)|passport|father|mother|gender|nationality|marital|personal\s+details?|declaration|language\s+passport)\b/i.test(
        line
      )
    ) {
      rejectedCount += 1;
      continue;
    }

    // Proficiency-grid header row ("Speaking Reading Writing") — skip it.
    if (LANGUAGE_MODE_WORD_RE.test(line) && isProficiencyGridHeader(line)) {
      continue;
    }

    // Split proficiency onto the next line: "English" / "(Fluent)"
    const next = lines[i + 1];
    if (
      next &&
      /^\([^)]+\)$/.test(next) &&
      extractProficiency(next).proficiency &&
      isHumanLanguageName(line.replace(/[()[\]]/g, '').trim())
    ) {
      line = `${line} ${next}`;
      i += 1;
    }

    // Proficiency-grid row pair: "English" / "Excellent Excellent Excellent".
    if (next && isHumanLanguageName(line) && isProficiencyOnlyLine(next)) {
      const prof = extractProficiency(next);
      const key = normalizeLanguageName(line).toLowerCase();
      attemptCount += 1;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          name: normalizeLanguageName(line),
          proficiency: prof.proficiency || 'Professional',
          confidence: 85,
        });
      }
      i += 1;
      continue;
    }

    const fromLine = parseLanguageLinesFromLine(line);
    if (fromLine.length > 0) {
      const tokens =
        line.match(/^(?:languages?)\s*:\s*(.+)$/i)?.[1]?.split(/[,;|·•]/).map((t) => t.trim()).filter(Boolean) ||
        (line.includes(',') && !/[-–—:]/.test(line)
          ? line.split(/[,;]/).map((t) => t.trim()).filter(Boolean)
          : [line]);
      attemptCount += tokens.length;

      for (const lang of fromLine) {
        const key = lang.name.toLowerCase();
        if (seen.has(key)) {
          rejectedCount += 1;
          continue;
        }
        seen.add(key);
        results.push(lang);
      }
      rejectedCount += Math.max(0, tokens.length - fromLine.length);
      continue;
    }

    attemptCount += 1;
    rejectedCount += 1;
  }

  return { languages: results, rejectedCount, attemptCount };
}
