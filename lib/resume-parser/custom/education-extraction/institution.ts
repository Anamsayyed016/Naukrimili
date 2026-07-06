/**
 * Institution detection — universities, colleges, schools, institutes.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import { isPlausibleExperienceCompany } from '@/lib/resume-parser/import-sanitize';

import { lineHasDegreeSignal } from './degree';

export interface InstitutionDetection {
  institution: string;
  confidence: number;
}

const INSTITUTION_MARKERS_RE =
  /\b(university|college|institute|institution|school|academy|polytechnic|campus|vishwavidyalaya|vidyalaya|iit|nit|iiit|bits|rgpv|vtu|anna\s+university|open\s+university|board)\b/i;

const GOVT_INSTITUTION_RE =
  /\b(government|public|state|central|national)\s+(?:university|college|institute|school)\b/i;

const IIT_ABBREV_RE =
  /^indian institute of technology\s+(.+)$/i;

export function abbreviateInstitutionName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  const iit = trimmed.match(IIT_ABBREV_RE);
  if (iit?.[1]) return `IIT ${iit[1].trim()}`;
  return trimmed;
}

export function scoreInstitutionCandidate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 4 || trimmed.length > 160) return 0;
  if (lineHasDegreeSignal(trimmed) && !INSTITUTION_MARKERS_RE.test(trimmed)) return 0;
  if (isPlausibleExperienceCompany(trimmed) && !INSTITUTION_MARKERS_RE.test(trimmed)) {
    return 0;
  }

  let score = 0;
  if (INSTITUTION_MARKERS_RE.test(trimmed)) score += 42;
  if (GOVT_INSTITUTION_RE.test(trimmed)) score += 20;
  if (isLikelyEducationLine(trimmed) && INSTITUTION_MARKERS_RE.test(trimmed)) score += 25;
  if (/^[A-Z][A-Za-z0-9&.,'()\- ]{6,}$/.test(trimmed) && /\s/.test(trimmed)) score += 12;
  if (/\([A-Z]{2,12}\)/.test(trimmed) && trimmed.length >= 15) score += 22;
  if (trimmed.length >= 12 && trimmed.length <= 100) score += 8;

  return Math.min(100, Math.round(score));
}

export function detectInstitutionFromLine(text: string): InstitutionDetection {
  const trimmed = text.trim();
  if (!trimmed) return { institution: '', confidence: 0 };

  const withoutDates = trimmed.replace(/,?\s*(?:19|20)\d{2}.*$/, '').trim();
  const conf = scoreInstitutionCandidate(withoutDates);
  if (conf >= 38) {
    return { institution: abbreviateInstitutionName(withoutDates), confidence: conf };
  }

  return { institution: '', confidence: 0 };
}
