/**
 * Degree detection — semantic matching for domestic and international degrees.
 */

import { isLikelyEducationLine } from '@/lib/resume-parser/field-classification';
import { looksLikeJobTitleLine } from '@/lib/resume-parser/import-sanitize';

export interface DegreeDetection {
  degree: string;
  fieldOfStudy: string;
  confidence: number;
}

const DEGREE_PATTERNS: Array<{ re: RegExp; confidence: number }> = [
  { re: /\bb\.?\s*tech\.?\b/i, confidence: 92 },
  { re: /\bb\.?\s*e\.?\b/i, confidence: 90 },
  { re: /\bb\.?\s*ca\b/i, confidence: 88 },
  { re: /\bm\.?\s*ca\b/i, confidence: 88 },
  { re: /\bbca\b/i, confidence: 88 },
  { re: /\bmca\b/i, confidence: 88 },
  { re: /\bmba\b/i, confidence: 90 },
  { re: /\bbba\b/i, confidence: 86 },
  { re: /\bb\.?\s*sc\.?\b/i, confidence: 88 },
  { re: /\bm\.?\s*sc\.?\b/i, confidence: 88 },
  { re: /\bb\.?\s*com\.?\b/i, confidence: 86 },
  { re: /\bm\.?\s*com\.?\b/i, confidence: 86 },
  { re: /\bb\.?\s*a\.?\b/i, confidence: 84 },
  { re: /\bm\.?\s*a\.?\b/i, confidence: 84 },
  { re: /\bph\.?\s*d\.?\b/i, confidence: 92 },
  { re: /\bdoctor(?:ate)?\s+of\b/i, confidence: 90 },
  { re: /\bbachelor(?:'s)?(?:\s+of\s+\w+)?/i, confidence: 88 },
  { re: /\bmaster(?:'s)?(?:\s+of\s+\w+)?/i, confidence: 88 },
  { re: /\bassociate(?:'s)?\s+degree\b/i, confidence: 82 },
  { re: /\bdiploma\b/i, confidence: 80 },
  { re: /\bcertificate\b/i, confidence: 75 },
  { re: /\bhigh\s+school\b/i, confidence: 78 },
  { re: /\bintermediate\b/i, confidence: 76 },
  { re: /\b(?:10th|12th|x{1,2}(?:th)?|xii|ssc|hsc)\b/i, confidence: 78 },
  { re: /\bpost\s+graduation\b/i, confidence: 82 },
  { re: /\bunder\s+graduation\b/i, confidence: 80 },
];

export function scoreDegreeCandidate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2 || trimmed.length > 140) return 0;
  if (looksLikeJobTitleLine(trimmed) && !DEGREE_PATTERNS.some(({ re }) => re.test(trimmed))) {
    return 0;
  }

  let score = 0;
  for (const { re, confidence } of DEGREE_PATTERNS) {
    if (re.test(trimmed)) score = Math.max(score, confidence);
  }
  if (isLikelyEducationLine(trimmed) && score < 50) score = Math.max(score, 55);
  if (/\bin\s+[A-Za-z]/.test(trimmed)) score += 6;

  return Math.min(100, Math.round(score));
}

export function detectDegreeFromLine(text: string): DegreeDetection {
  const trimmed = text.trim();
  if (!trimmed) return { degree: '', fieldOfStudy: '', confidence: 0 };

  const fieldMatch = trimmed.match(/\bin\s+([A-Za-z][A-Za-z ,&/-]+)$/i);
  const fieldOfStudy = fieldMatch?.[1]?.trim() || '';
  const degreeText = trimmed.replace(/\s+in\s+[A-Za-z][A-Za-z ,&/-]+$/i, '').trim();

  const conf = scoreDegreeCandidate(degreeText || trimmed);
  if (conf >= 35) {
    return {
      degree: degreeText || trimmed,
      fieldOfStudy,
      confidence: conf,
    };
  }

  return { degree: '', fieldOfStudy: '', confidence: 0 };
}

export function lineHasDegreeSignal(text: string): boolean {
  return scoreDegreeCandidate(text) >= 40;
}
