/**
 * Parse achievements / awards / recognition section lines.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import {
  isResumeSectionHeadingLine,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';
import { looksLikeSentenceNotCompany } from '../experience-extraction/company';

const SECTION_HEADING_RE =
  /^(?:achievements?|awards?|honors?|honours?|recognition|accomplishments?|highlights?|key\s+achievements?|professional\s+highlights?|distinctions?)(?:\s*[&:–-].*)?$/i;

const SKILL_LIST_RE = /(?:^|[,;|])\s*(?:python|java|react|javascript|sql|aws|docker|excel|html|css)\b/i;

const EXPERIENCE_VERB_RE =
  /\b(responsible for|managed|developed|implemented|designed|delivered|led|built|reported to)\b/i;

export interface ParsedAchievementLine {
  text: string;
  confidence: number;
}

function scoreAchievementLine(text: string): number {
  let score = 55;
  if (text.length >= 20) score += 10;
  if (text.length >= 40) score += 5;
  if (/^\d+%|\$\d|₹\d|\b\d+\s*(?:%|k|lakh|million)\b/i.test(text)) score += 12;
  if (/^(?:won|received|awarded|recognized|achieved|secured|ranked|published)\b/i.test(text)) score += 8;
  if (/\b(?:ieee|conference|journal|patent)\b/i.test(text)) score += 10;
  if (SECTION_HEADING_RE.test(text)) return 0;
  if (isResumeSectionHeadingLine(text)) return 0;
  if (isLikelyEducationLine(text) && !/\b(?:published|award|ieee|conference|employee of the year)\b/i.test(text)) {
    return 0;
  }
  if (looksLikeJobTitleLine(text) && text.split(/\s+/).length <= 5) return 0;
  if (SKILL_LIST_RE.test(text) && (text.match(/,/g) || []).length >= 2) return 0;
  if (EXPERIENCE_VERB_RE.test(text) && text.split(/\s+/).length > 8) score -= 25;
  if (/\b(?:led|managed|worked|joined|headed)\b.+\bat\s+[A-Z]/i.test(text)) return 0;
  if (EXPERIENCE_VERB_RE.test(text) && /\bat\s+[A-Z]/i.test(text) && text.split(/\s+/).length >= 6) {
    return 0;
  }
  if (looksLikeSentenceNotCompany(text) && text.split(/\s+/).length > 14) score -= 20;
  return Math.min(100, Math.max(0, score));
}

export function parseAchievementLine(raw: string): ParsedAchievementLine | null {
  let line = raw.trim().replace(/^[•\-\*\u2022\u2023·]\s+/, '');
  if (!line || line.length < 6 || line.length > 500) return null;

  const inline = line.match(
    /^(?:achievements?|awards?|honors?|recognition|accomplishments?|highlights?)\s*:?\s*(.+)$/i
  );
  if (inline?.[1]) line = inline[1].trim();

  if (SECTION_HEADING_RE.test(line)) return null;

  const confidence = scoreAchievementLine(line);
  if (confidence < 42) return null;

  return { text: line, confidence };
}

export interface AchievementsSectionParseResult {
  achievements: ParsedAchievementLine[];
  rejectedCount: number;
}

export function parseAchievementsFromSectionWithStats(
  sectionText: string
): AchievementsSectionParseResult {
  if (!sectionText?.trim()) {
    return { achievements: [], rejectedCount: 0 };
  }

  const seen = new Set<string>();
  const achievements: ParsedAchievementLine[] = [];
  let rejectedCount = 0;

  for (const rawLine of sectionText.replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const parsed = parseAchievementLine(trimmed);
    if (!parsed) {
      rejectedCount += 1;
      continue;
    }

    const key = parsed.text.toLowerCase();
    if (seen.has(key)) {
      rejectedCount += 1;
      continue;
    }
    seen.add(key);
    achievements.push(parsed);
  }

  return { achievements, rejectedCount };
}

export function parseAchievementsFromSection(sectionText: string): ParsedAchievementLine[] {
  return parseAchievementsFromSectionWithStats(sectionText).achievements;
}
