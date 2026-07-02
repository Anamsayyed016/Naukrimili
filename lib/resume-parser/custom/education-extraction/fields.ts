/**
 * Per-block field assembly and confidence aggregation.
 */

import { detectLocationFromLine } from '../experience-extraction/location';
import { parseEducationDates } from './dates';
import { extractDescriptionFromBlock } from './description';
import { detectDegreeFromLine } from './degree';
import { detectFieldFromLine } from './field';
import { detectInstitutionFromLine } from './institution';
import { detectPerformanceFromText } from './performance';
import type {
  CustomExtractedEducation,
  EducationFieldConfidence,
  EducationRawBlock,
} from './types';

interface FieldPick<T> {
  value: T;
  confidence: number;
}

function expandHeaderSegments(lines: string[]): string[] {
  const segments: string[] = [];
  for (const line of lines) {
    const parts = line.split(/\s*[|–—,]\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) {
      segments.push(line);
      continue;
    }
    for (const part of parts) segments.push(part);
  }
  return segments;
}

function pickBestInstitution(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectInstitutionFromLine(line);
    if (det.confidence > best.confidence) {
      best = { value: det.institution, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestDegree(lines: string[]): {
  degree: string;
  fieldFromDegree: string;
  confidence: number;
} {
  let best = { degree: '', fieldFromDegree: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    if (parseEducationDates(line)) continue;
    const det = detectDegreeFromLine(line);
    if (det.confidence > best.confidence) {
      best = {
        degree: det.degree,
        fieldFromDegree: det.fieldOfStudy,
        confidence: det.confidence,
      };
    }
  }
  return best;
}

function pickBestField(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectFieldFromLine(line);
    if (det.confidence > best.confidence) {
      best = { value: det.fieldOfStudy, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestDates(lines: string[]): {
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  confidence: number;
} {
  let best: ReturnType<typeof parseEducationDates> = null;
  for (const line of expandHeaderSegments(lines)) {
    const parsed = parseEducationDates(line);
    if (parsed && (!best || parsed.confidence > best.confidence)) {
      best = parsed;
    }
  }
  if (!best) {
    return { startDate: null, endDate: null, current: false, confidence: 0 };
  }
  return {
    startDate: best.startDate,
    endDate: best.endDate,
    current: best.current,
    confidence: best.confidence,
  };
}

function pickBestPerformance(lines: string[]): ReturnType<typeof detectPerformanceFromText> {
  let best = detectPerformanceFromText('');
  for (const line of [...lines]) {
    const det = detectPerformanceFromText(line);
    if (det.confidence > best.confidence) best = det;
  }
  return best;
}

function pickBestLocation(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectLocationFromLine(line);
    if (det.confidence > best.confidence) {
      best = { value: det.location, confidence: det.confidence };
    }
  }
  return best;
}

function computeOverallConfidence(fc: EducationFieldConfidence): number {
  const weights = {
    institution: 0.22,
    degree: 0.22,
    fieldOfStudy: 0.12,
    startDate: 0.1,
    endDate: 0.1,
    performance: 0.1,
    description: 0.08,
    specialization: 0.03,
    location: 0.03,
  };

  let sum = 0;
  let weightSum = 0;
  for (const [key, w] of Object.entries(weights)) {
    sum += fc[key as keyof EducationFieldConfidence] * w;
    weightSum += w;
  }

  return Math.min(100, Math.round(weightSum > 0 ? sum / weightSum : 0));
}

export function buildEducationFromBlock(block: EducationRawBlock): CustomExtractedEducation {
  const headerLines = block.headerText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const allLines = [...headerLines, ...block.bodyLines.map((l) => l.trim()).filter(Boolean)];

  const institutionPick = pickBestInstitution(headerLines);
  const degreePick = pickBestDegree(headerLines);
  const fieldPick = pickBestField([...headerLines, ...block.bodyLines.slice(0, 2)]);
  const datePick = pickBestDates(allLines);
  const performance = pickBestPerformance(allLines);
  const locationPick = pickBestLocation(headerLines);

  const fieldOfStudy = fieldPick.value || degreePick.fieldFromDegree;
  const { description, achievements, coursework, confidence: descConf } =
    extractDescriptionFromBlock(block.bodyLines);

  const perfConf = performance.confidence;
  const fieldConfidence: EducationFieldConfidence = {
    institution: institutionPick.confidence,
    degree: degreePick.confidence,
    fieldOfStudy: Math.max(fieldPick.confidence, degreePick.fieldFromDegree ? 70 : 0),
    specialization: fieldPick.confidence,
    startDate: datePick.startDate ? datePick.confidence : 0,
    endDate: datePick.endDate || datePick.current ? datePick.confidence : 0,
    performance: perfConf,
    location: locationPick.confidence,
    description: descConf,
  };

  return {
    institution: institutionPick.value,
    degree: degreePick.degree,
    fieldOfStudy,
    specialization: fieldPick.value,
    startDate: datePick.startDate,
    endDate: datePick.endDate,
    current: datePick.current,
    cgpa: performance.cgpa,
    gpa: performance.gpa,
    percentage: performance.percentage,
    grade: performance.grade || performance.honours,
    location: locationPick.value,
    description,
    achievements,
    coursework,
    confidence: computeOverallConfidence(fieldConfidence),
    fieldConfidence,
  };
}
