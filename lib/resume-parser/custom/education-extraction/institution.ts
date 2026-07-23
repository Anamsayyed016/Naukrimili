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
  /\b(university|college|institute|institution|school|academy|polytechnic|campus|vishwavidyalaya|vidyalaya|h\.?\s*sec\.?|iit|nit|iiit|bits|rgpv|vtu|anna\s+university|open\s+university|board)\b/i;

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
  if (!trimmed || trimmed.length < 3 || trimmed.length > 160) return 0;
  // Education table column headers — never institutions.
  if (
    /^(?:degree|board|university|college|school|institute|institution|year|academic\s+year|percentage|percent|cgpa|gpa|marks|score|result|name\s+of\s+(?:school|college|institute)|board\s*\/\s*university|degree\s+board(?:\s*\/\s*university)?)\s*$/i.test(
      trimmed
    ) ||
    /^(?:degree\s+)?board\s*\/\s*university$/i.test(trimmed)
  ) {
    return 0;
  }
  if (lineHasDegreeSignal(trimmed) && !INSTITUTION_MARKERS_RE.test(trimmed)) return 0;
  // Bare university/board acronyms are institutions, not employers — do not let
  // company-name heuristics zero them out before the acronym boost below.
  const compactAcronym =
    /^[A-Z]{3,8}$/.test(trimmed) &&
    !/^(?:AND|THE|FOR|LLC|LTD|INC|PTY|CEO|CTO|CFO|HR|IT|USA|UAE|CSR|IPO|ROC|SEBI)$/.test(trimmed);
  if (
    isPlausibleExperienceCompany(trimmed) &&
    !INSTITUTION_MARKERS_RE.test(trimmed) &&
    !compactAcronym
  ) {
    return 0;
  }

  let score = 0;
  if (INSTITUTION_MARKERS_RE.test(trimmed)) score += 42;
  if (GOVT_INSTITUTION_RE.test(trimmed)) score += 20;
  if (isLikelyEducationLine(trimmed) && INSTITUTION_MARKERS_RE.test(trimmed)) score += 25;
  if (/^[A-Z][A-Za-z0-9&.,'()\- ]{6,}$/.test(trimmed) && /\s/.test(trimmed)) score += 12;
  if (/\([A-Z]{2,12}\)/.test(trimmed) && trimmed.length >= 15) score += 22;
  if (trimmed.length >= 12 && trimmed.length <= 100) score += 8;
  // Compact university / board acronyms (DAVV, RGPV, VTU, CBSE) common on CVs.
  if (compactAcronym) {
    score += 50;
  }

  return Math.min(100, Math.round(score));
}

export function detectInstitutionFromLine(text: string): InstitutionDetection {
  const trimmed = text
    .trim()
    // "from Satyam Convent H.Sec. School…" / "at Delhi University"
    .replace(/^(?:from|at|of)\s+/i, '')
    .replace(/^[\s)\]}>]+/, '')
    .trim();
  if (!trimmed) return { institution: '', confidence: 0 };

  // Strip parenthetical years first — greedy `,?\s*20xx.*$` would leave a bare "("
  // on "College, City (2011)" by matching only "2011)".
  // Also strip ICAI-style "2026 | 54.00%" tails and tab-separated scores.
  // Soft hyphen word breaks inside institute names ("in- stitute").
  const healedInstitute = trimmed.replace(/([A-Za-z])-\s+([a-z])/g, '$1$2');
  const withoutDates = healedInstitute
    .replace(/\s*[\(\[]\s*(?:19|20)\d{2}\s*[\)\]]\s*$/i, '')
    .replace(/\s*[|\t]\s*(?:19|20)\d{2}\s*(?:[|]\s*\d{1,3}(?:\.\d+)?\s*%?)?\s*$/i, '')
    .replace(/\s+(?:19|20)\d{2}\s*[|]\s*\d{1,3}(?:\.\d+)?\s*%?\s*$/i, '')
    .replace(/,?\s*(?:19|20)\d{2}\s*$/i, '')
    .replace(/\t+/g, ' ')
    .replace(/(\d{4})\s*-\s*(\d{4})/g, '$1-$2')
    .replace(/[,;:\s]+$/g, '')
    .trim();

  // "B.Tech. MANIT, BHOPAL 2004-2008" — campus acronym is the institution.
  // Allow OCR line-wrap hyphens inside the year range.
  const degreeCampus = withoutDates
    .replace(/\s+/g, ' ')
    .match(
      /^(?:b\.?\s*tech\.?|b\.?\s*e\.?|m\.?\s*tech\.?|m\.?\s*e\.?|mba|mca|bca|b\.?\s*sc\.?|m\.?\s*sc\.?|b\.?\s*com\.?|m\.?\s*com\.?)\s+([A-Z]{3,8})(?:\s*,\s*[A-Za-z .]+)?(?:\s+(?:19|20)\d{2}\s*[-–—]\s*(?:19|20)\d{2})?$/i
    );
  if (degreeCampus?.[1]) {
    return { institution: degreeCampus[1].trim(), confidence: 72 };
  }

  // "DAVV, Indore" / "RGPV, Bhopal" — score the acronym/name head before city.
  const cityTail = withoutDates.match(
    /^(.+?)\s*,\s*([A-Z][A-Za-z .]{2,40})$/
  );
  if (cityTail) {
    const head = cityTail[1].trim();
    const headConf = scoreInstitutionCandidate(head);
    if (headConf >= 38) {
      return { institution: abbreviateInstitutionName(head), confidence: headConf };
    }
  }

  const conf = scoreInstitutionCandidate(withoutDates);
  if (conf >= 38) {
    return { institution: abbreviateInstitutionName(withoutDates), confidence: conf };
  }

  return { institution: '', confidence: 0 };
}
