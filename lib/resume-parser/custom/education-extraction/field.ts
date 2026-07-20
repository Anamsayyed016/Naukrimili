/**
 * Field of study and specialization detection.
 */

import { lineHasDegreeSignal } from './degree';

export interface FieldDetection {
  fieldOfStudy: string;
  specialization: string;
  confidence: number;
}

const FIELD_LABEL_RE =
  /(?:field\s+of\s+study|major|specialization|specialisation|concentration|stream)\s*[:–-]\s*(.+)/i;

const COURSEWORK_RE = /(?:coursework|relevant\s+courses?|key\s+courses?)\s*[:–-]\s*(.+)/i;

export function detectFieldFromLine(text: string): FieldDetection {
  const trimmed = text.trim();
  if (!trimmed) return { fieldOfStudy: '', specialization: '', confidence: 0 };

  const labeled = trimmed.match(FIELD_LABEL_RE);
  if (labeled?.[1]) {
    const value = labeled[1].trim();
    return {
      fieldOfStudy: value,
      specialization: value,
      confidence: 85,
    };
  }

  if (
    trimmed.length >= 4 &&
    trimmed.length <= 80 &&
    /^[A-Z][A-Za-z ,&/-]+$/.test(trimmed) &&
    !/\b(university|college|institute|b\.?tech|m\.?tech|mba|ll\.?b)\b/i.test(trimmed) &&
    // School-stage labels are their own education entries, never a degree field.
    !/^(?:higher\s+secondary|high\s+secondary|senior\s+secondary|high\s+school|secondary\s+school|matriculation|intermediate|ssc|hsc)\b/i.test(
      trimmed
    ) &&
    !lineHasDegreeSignal(trimmed)
  ) {
    return { fieldOfStudy: trimmed, specialization: '', confidence: 45 };
  }

  return { fieldOfStudy: '', specialization: '', confidence: 0 };
}

export function parseCourseworkLine(text: string): string[] {
  const trimmed = text.trim();
  const labeled = trimmed.match(COURSEWORK_RE);
  const payload = labeled?.[1] || trimmed;
  if (!/coursework|courses?/i.test(trimmed) && !labeled) return [];

  return payload
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 60);
}
