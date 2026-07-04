/**
 * Parse hobbies / interests section lines — never classify as skills.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import {
  isResumeSectionHeadingLine,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';
import { isValidSkillCandidate } from '../skills-intelligence/validate';

const SECTION_HEADING_RE =
  /^(?:hobbies?|interests?|personal\s+interests?|extracurricular(?:\s+activities)?|activities|leisure)(?:\s*[&:–-].*)?$/i;

const HOBBY_ALLOW_RE =
  /^(?:reading|travel(?:ing)?|photography|cooking|music|dancing|painting|drawing|gardening|cycling|swimming|hiking|cricket|football|chess|blogging|volunteering|yoga|meditation|writing|gaming|movies|films|sports|art|crafts|trekking|running|fitness)$/i;

export interface ParsedHobbyLine {
  name: string;
  confidence: number;
}

function scoreHobbyToken(name: string): number {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2 || trimmed.length > 50) return 0;
  if (SECTION_HEADING_RE.test(trimmed)) return 0;
  if (isResumeSectionHeadingLine(trimmed)) return 0;
  if (isLikelyEducationLine(trimmed)) return 0;
  if (looksLikeJobTitleLine(trimmed) && trimmed.split(/\s+/).length >= 2) return 0;
  if (isValidSkillCandidate(trimmed) && !HOBBY_ALLOW_RE.test(trimmed)) return 0;

  let score = 58;
  if (HOBBY_ALLOW_RE.test(trimmed)) score += 22;
  if (trimmed.split(/\s+/).length <= 3) score += 8;
  return Math.min(100, score);
}

function tokenizeHobbyLine(raw: string): string[] {
  const line = raw.trim().replace(/^[•\-\*\u2022\u2023·]\s+/, '');
  if (!line) return [];

  const inline = line.match(
    /^(?:hobbies?|interests?|personal\s+interests?|extracurricular|activities)\s*:?\s*(.+)$/i
  );
  const body = inline?.[1]?.trim() || line;
  if (SECTION_HEADING_RE.test(body)) return [];

  return body
    .split(/[,•|·\u2022\-–—]/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2);
}

export function parseHobbyLine(raw: string): ParsedHobbyLine[] {
  const tokens = tokenizeHobbyLine(raw);
  const out: ParsedHobbyLine[] = [];

  for (const token of tokens) {
    const confidence = scoreHobbyToken(token);
    if (confidence >= 50) out.push({ name: token, confidence });
  }

  return out;
}

export interface HobbiesSectionParseResult {
  hobbies: ParsedHobbyLine[];
  rejectedCount: number;
}

export function parseHobbiesFromSectionWithStats(sectionText: string): HobbiesSectionParseResult {
  if (!sectionText?.trim()) {
    return { hobbies: [], rejectedCount: 0 };
  }

  const seen = new Set<string>();
  const hobbies: ParsedHobbyLine[] = [];
  let rejectedCount = 0;

  for (const rawLine of sectionText.replace(/\r\n/g, '\n').split('\n')) {
    if (!rawLine.trim()) continue;
    const parsed = parseHobbyLine(rawLine);
    if (!parsed.length) {
      rejectedCount += 1;
      continue;
    }
    for (const item of parsed) {
      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        rejectedCount += 1;
        continue;
      }
      seen.add(key);
      hobbies.push(item);
    }
  }

  return { hobbies, rejectedCount };
}

export function parseHobbiesFromSection(sectionText: string): ParsedHobbyLine[] {
  return parseHobbiesFromSectionWithStats(sectionText).hobbies;
}
