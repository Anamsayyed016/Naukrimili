/**
 * Location and work-mode detection — never confuse company with location.
 */

import {
  classifyResumeTextFragment,
  isLikelyLocationFragment,
} from '@/lib/resume-parser/field-classification';
import {
  looksLikeStandaloneLocationLine,
  splitCompanyLocationPipe,
} from '@/lib/resume-parser/import-sanitize';

export interface LocationDetection {
  location: string;
  confidence: number;
}

const WORK_MODE_RE = /\b(remote|hybrid|onsite|on[- ]?site|wfh|work from home)\b/i;

const CITY_STATE_COUNTRY_RE =
  /\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*){0,2}\b/;

export function scoreLocationCandidate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  if (trimmed.length > 80) return 0;

  let score = 0;
  const classified = classifyResumeTextFragment(trimmed);
  if (classified.kind === 'LOCATION') score += classified.confidence * 0.85;
  if (isLikelyLocationFragment(trimmed)) score += 30;
  if (looksLikeStandaloneLocationLine(trimmed)) score += 28;
  if (WORK_MODE_RE.test(trimmed)) score += 35;
  if (CITY_STATE_COUNTRY_RE.test(trimmed) && trimmed.length <= 60) score += 15;
  if (/,\s*[A-Z]{2}\b/.test(trimmed)) score += 12;

  return Math.min(100, Math.round(score));
}

export function detectLocationFromLine(text: string): LocationDetection {
  const trimmed = text.trim();
  if (!trimmed) return { location: '', confidence: 0 };

  const pipeSplit = splitCompanyLocationPipe(trimmed);
  if (pipeSplit?.location) {
    const conf = scoreLocationCandidate(pipeSplit.location);
    if (conf >= 35) {
      return { location: pipeSplit.location, confidence: conf };
    }
  }

  const conf = scoreLocationCandidate(trimmed);
  if (conf >= 40) {
    return { location: trimmed, confidence: conf };
  }

  return { location: '', confidence: 0 };
}

export function detectEmploymentTypeFromText(text: string): { type: string; confidence: number } {
  const lower = text.toLowerCase();
  const patterns: Array<{ re: RegExp; type: string; confidence: number }> = [
    { re: /\b(internship|intern)\b/i, type: 'Internship', confidence: 88 },
    { re: /\b(freelance|self[- ]?employed)\b/i, type: 'Freelance', confidence: 85 },
    { re: /\b(contract|contractor)\b/i, type: 'Contract', confidence: 82 },
    { re: /\b(part[- ]?time)\b/i, type: 'Part-time', confidence: 80 },
    { re: /\b(full[- ]?time)\b/i, type: 'Full-time', confidence: 78 },
    { re: /\b(remote)\b/i, type: 'Remote', confidence: 70 },
  ];

  for (const { re, type, confidence } of patterns) {
    if (re.test(lower)) return { type, confidence };
  }
  return { type: '', confidence: 0 };
}
