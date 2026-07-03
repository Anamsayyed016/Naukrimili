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
  { re: /\b(?:professional(?:\s+working)?|proficient|advanced|expert)\b/i, label: 'Professional', weight: 85 },
  { re: /\b(?:intermediate|conversational|working)\b/i, label: 'Intermediate', weight: 75 },
  { re: /\b(?:basic|elementary|beginner|limited)\b/i, label: 'Basic', weight: 65 },
  { re: /\b(?:reading|write|writing|speak|speaking|listen|listening)\b/i, label: 'Partial', weight: 55 },
  { re: /\b(?:c1|c2|b1|b2|a1|a2)\b/i, label: 'CEFR', weight: 80 },
];

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
  if (KNOWN_TECH_ACRONYMS_RE.test(lower)) return false;
  if (PROGRAMMING_LANGUAGE_RE.test(lower) && !HUMAN_LANGUAGE_NAMES.has(lower)) return false;
  if (HUMAN_LANGUAGE_NAMES.has(lower)) return true;
  // Accept capitalized single-word or two-word names that aren't tech
  if (/^[A-Za-z][a-z]+(?:\s+[A-Za-z][a-z]+)?$/.test(name) && !PROGRAMMING_LANGUAGE_RE.test(lower)) {
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

export function parseLanguageLine(line: string): ParsedLanguageLine | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;
  if (/^(?:languages?|language\s+proficiency|spoken\s+languages?)\s*:?\s*$/i.test(trimmed)) return null;

  const inline = trimmed.match(/^(?:languages?)\s*:\s*(.+)$/i);
  if (inline) {
    const tokens = inline[1].split(/[,;|·•]/).map((t) => t.trim()).filter(Boolean);
    if (tokens.length === 1) return parseLanguageToken(tokens[0]);
  }

  if (/^\|/.test(trimmed)) {
    const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2 && !/^language/i.test(cells[0])) {
      return parseLanguageToken(`${cells[0]} - ${cells[1]}`);
    }
  }

  if (/^[-•*·]\s*/.test(trimmed)) {
    return parseLanguageToken(trimmed.replace(/^[-•*·]\s*/, ''));
  }

  return parseLanguageToken(trimmed);
}

export function parseLanguagesFromSection(sectionText: string): ParsedLanguageLine[] {
  if (!sectionText?.trim()) return [];

  const lines = sectionText.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  const results: ParsedLanguageLine[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const commaList = line.match(/^(?:languages?)\s*:\s*(.+)$/i);
    if (commaList) {
      for (const token of commaList[1].split(/[,;|]/).map((t) => t.trim()).filter(Boolean)) {
        const parsed = parseLanguageToken(token);
        if (parsed && !seen.has(parsed.name.toLowerCase())) {
          seen.add(parsed.name.toLowerCase());
          results.push(parsed);
        }
      }
      continue;
    }

    if (line.includes(',') && !/[-–—:]/.test(line)) {
      const tokens = line.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
      if (tokens.length >= 2 && tokens.every((t) => isHumanLanguageName(t.split(/\s+/)[0]))) {
        for (const token of tokens) {
          const parsed = parseLanguageToken(token);
          if (parsed && !seen.has(parsed.name.toLowerCase())) {
            seen.add(parsed.name.toLowerCase());
            results.push(parsed);
          }
        }
        continue;
      }
    }

    const parsed = parseLanguageLine(line);
    if (parsed && !seen.has(parsed.name.toLowerCase())) {
      seen.add(parsed.name.toLowerCase());
      results.push(parsed);
    }
  }

  return results;
}
