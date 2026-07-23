/**
 * Designation / job title detection with dynamic support for unknown titles.
 */

import {
  classifyResumeTextFragment,
  isLikelyJobTitleFragment,
} from '@/lib/resume-parser/field-classification';
import { splitOnFieldSeparatorDash } from '@/lib/resume-parser/field-separator-dash';
import { looksLikeJobTitleLine } from '@/lib/resume-parser/import-sanitize';

export interface DesignationDetection {
  designation: string;
  confidence: number;
}

const TITLE_KEYWORDS_RE =
  /\b(?:software|senior|junior|lead|principal|staff|full[- ]?stack|front[- ]?end|back[- ]?end|python|java|devops|data|machine learning|ml|cloud|mobile|web|product|project|engineering|engg\.?|developer|engineer|manager|consultant|intern|founder|ceo|cto|cfo|director|architect|analyst|specialist|associate|coordinator|administrator|executive|officer|head|vp|vice president|asst\.?|astt\.?|assistant|teacher|nurse|doctor|physician|accountant|lawyer|attorney|paralegal|secretary|marketer|designer|researcher|scientist|professor|lecturer|pharmacist|therapist|counselor|auditor|recruiter|hr|government|marketing|finance|sales|legal|medical|nursing|healthcare|microbiologist|biologist|chemist|electrician|pathologist)\b|[A-Za-z][A-Za-z'-]{3,24}(?:ologist|ician|ographer|otherapist|urgeon|entist)\b/i;

const SENIORITY_RE =
  /\b(?:senior|sr\.?|junior|jr\.?|lead|principal|staff|associate|entry[- ]?level)\b/i;

/** Remove trailing "Mon YYYY – Mon YYYY / Present" employment ranges from a title line. */
export function stripTrailingEmploymentDates(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const stripped = trimmed
    // Parenthetical tenures: "(2023–Present)", "(Jan 2021 - Mar 2023)"
    .replace(
      /\s*[\(\[]\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?(?:['’])?(?:19|20)\d{2}\s*[-–—to/]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?(?:['’])?(?:(?:19|20)\d{2}|present|current|ongoing|till\s*date)\s*[\)\]]\s*$/i,
      ''
    )
    // "Since Sep2011 to OCT 2017" / "since Oct'2017 to April 2022" (glued month+year OK)
    .replace(
      /\s+(?:since|from)\s+(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?(?:['’])?(?:19|20)\d{2}\b.*$/i,
      ''
    )
    .replace(
      /\s+(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?(?:['’])?(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*)?(?:['’])?(?:(?:19|20)\d{2}|present|current|ongoing|till\s*date|to\s*date)\s*$/i,
      ''
    )
    .replace(
      /\s+(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*(?:['’])?(?:19|20)\d{2})\s*$/i,
      ''
    )
    .trim();
  return stripped.length >= 3 ? stripped : trimmed;
}

export function scoreDesignationCandidate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) return 0;
  if (trimmed.length > 120) return 0;
  if (/[.!?]$/.test(trimmed) && trimmed.split(/\s+/).length > 6) return 0;

  let score = 0;
  const classified = classifyResumeTextFragment(trimmed);
  if (classified.kind === 'DESIGNATION') score += classified.confidence * 0.9;
  if (isLikelyJobTitleFragment(trimmed)) score += 30;
  if (looksLikeJobTitleLine(trimmed)) score += 28;
  if (TITLE_KEYWORDS_RE.test(trimmed)) score += 24;
  if (SENIORITY_RE.test(trimmed)) score += 10;
  if (trimmed.split(/\s+/).length <= 8) score += 8;
  if (/^[A-Z]/.test(trimmed)) score += 5;

  return Math.min(100, Math.round(score));
}

export function detectDesignationFromLine(text: string): DesignationDetection {
  const trimmed = text.trim();
  if (!trimmed) return { designation: '', confidence: 0 };

  // Strip trailing employment date ranges so "Title Apr 2025 – Jan 2026" scores as a title.
  const withoutDates = stripTrailingEmploymentDates(trimmed);
  const working = withoutDates || trimmed;

  // "As {Role} in/at {Employer}" — score the role fragment only.
  const asInMatch = working.match(/^As\s+(.+?)\s+(?:in|at|with|for)\s+(.+)$/i);
  if (asInMatch) {
    const titlePart = asInMatch[1].replace(/^working\s+/i, '').trim();
    const conf = scoreDesignationCandidate(titlePart);
    if (conf >= 32) {
      return { designation: titlePart, confidence: Math.max(conf, 55) };
    }
  }

  // Explicit role labels: "Role: Credit Controller", "Designation: Site Engineer"
  const roleLabel = working.match(
    /^(?:role|designation|position|title|post)\s*[:\-–—]\s*(.+)$/i
  );
  if (roleLabel) {
    const titlePart = roleLabel[1].replace(/\s*[\(\[].*$/, '').trim();
    const conf = scoreDesignationCandidate(titlePart);
    if (titlePart.length >= 2) {
      return {
        designation: titlePart,
        confidence: Math.max(conf, 62),
      };
    }
  }

  const asPrefix = working.match(/^As\s+(.+)$/i);
  if (asPrefix) {
    const titlePart = asPrefix[1].trim();
    const conf = scoreDesignationCandidate(titlePart);
    if (conf >= 38) {
      return { designation: titlePart, confidence: conf };
    }
  }

  const atMatch = working.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    const titlePart = atMatch[1].trim();
    const conf = scoreDesignationCandidate(titlePart);
    if (conf >= 38) {
      return { designation: titlePart, confidence: conf };
    }
  }

  const dashSplit = splitOnFieldSeparatorDash(working);
  if (dashSplit) {
    const left = dashSplit.left;
    const right = dashSplit.right;
    const leftConf = scoreDesignationCandidate(left);
    const rightConf = scoreDesignationCandidate(right);
    if (leftConf >= 40 && leftConf >= rightConf + 8) {
      return { designation: left, confidence: leftConf };
    }
    if (rightConf >= 40 && rightConf >= leftConf + 8) {
      return { designation: right, confidence: rightConf };
    }
  }

  const conf = scoreDesignationCandidate(working);
  if (conf >= 38) {
    return { designation: working, confidence: conf };
  }
  return { designation: '', confidence: 0 };
}
