/**
 * Project title detection — personal, academic, professional, open source, capstone, etc.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import {
  isEmbeddedProjectTitleLine,
  isPlausibleProjectName,
  looksLikeCompanyNameLine,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';

import { parseDateRangeFromText } from '../experience-extraction/dates';

import { parseExplicitTechLine } from './technologies';

export interface TitleDetection {
  title: string;
  confidence: number;
}

const PROJECT_TITLE_SUFFIX_RE =
  /\b(Website|Web\s*Site|Portal|System|Systems|Application|Applications|App|Platform|Dashboard|API|Tool|Suite|Software|Project|Tracker|Manager|Bot|Chatbot|Analyzer|Engine|Framework|Library|Extension|Plugin|Microservice|Microservices|Capstone|Thesis|Research)\b/i;

const ACADEMIC_PROJECT_RE =
  /\b(capstone|thesis|dissertation|final\s+year|academic|research|semester)\b/i;

const OPEN_SOURCE_RE = /\b(open\s*source|oss|contribution)\b/i;

export function scoreProjectTitleCandidate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return 0;
  if (trimmed.length > 100) return 0;
  if (/https?:\/\//i.test(trimmed)) return 0;
  if (/(?:github|gitlab|bitbucket)\.com/i.test(trimmed)) return 0;
  if (parseDateRangeFromText(trimmed)) return 0;
  if (parseExplicitTechLine(trimmed).length >= 2) return 0;
  if (/\s+with\s+/i.test(trimmed) && trimmed.split(/\s+/).length >= 4) return 0;
  if (/^(built|developed|implemented|designed|created|led)\b/i.test(trimmed)) return 0;
  if (isLikelyEducationLine(trimmed) && !PROJECT_TITLE_SUFFIX_RE.test(trimmed)) return 0;

  if (looksLikeCompanyNameLine(trimmed) && !PROJECT_TITLE_SUFFIX_RE.test(trimmed)) return 0;
  if (looksLikeJobTitleLine(trimmed) && !PROJECT_TITLE_SUFFIX_RE.test(trimmed)) return 0;
  if (
    looksLikeJobTitleLine(trimmed) &&
    /\b(developer|engineer|architect|analyst|consultant|designer|programmer)\b/i.test(trimmed) &&
    !PROJECT_TITLE_SUFFIX_RE.test(trimmed)
  ) {
    return 0;
  }
  if (!isPlausibleProjectName(trimmed) && !isEmbeddedProjectTitleLine(trimmed)) return 0;

  let score = 0;
  if (isEmbeddedProjectTitleLine(trimmed)) score += 45;
  if (isPlausibleProjectName(trimmed)) score += 40;
  if (PROJECT_TITLE_SUFFIX_RE.test(trimmed)) score += 28;
  if (ACADEMIC_PROJECT_RE.test(trimmed)) score += 15;
  if (OPEN_SOURCE_RE.test(trimmed)) score += 12;
  if (trimmed.split(/\s+/).length <= 8) score += 10;
  if (/^[A-Z]/.test(trimmed) && !/[.!?]$/.test(trimmed)) score += 8;

  return Math.min(100, Math.round(score));
}

export function detectTitleFromLine(text: string): TitleDetection {
  const raw = text.trim();
  if (!raw) return { title: '', confidence: 0 };

  const dashSplit = raw.split(/\s+[-–—:]\s+/);
  if (dashSplit.length >= 2) {
    const head = dashSplit[0].replace(/^[•\-\*\u2022]\s+/, '').trim();
    const conf = scoreProjectTitleCandidate(head);
    if (conf >= 38) return { title: head, confidence: conf };
  }

  const cleaned = raw.replace(/^[•\-\*\u2022]\s+/, '').trim();
  const conf = scoreProjectTitleCandidate(cleaned);
  if (conf >= 35) return { title: cleaned, confidence: conf };

  return { title: '', confidence: 0 };
}
