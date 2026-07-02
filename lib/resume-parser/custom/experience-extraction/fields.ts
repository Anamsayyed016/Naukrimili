/**
 * Per-block field assembly and confidence aggregation.
 */

import { detectCompanyFromLine } from './company';
import { parseDateRangeFromText } from './dates';
import { detectDesignationFromLine } from './designation';
import { extractDescriptionFromBlock } from './description';
import { detectEmploymentTypeFromText, detectLocationFromLine } from './location';
import { extractTechnologiesFromBlock } from './technologies';
import {
  looksLikeCompanyNameLine,
  looksLikeStandaloneLocationLine,
} from '@/lib/resume-parser/import-sanitize';
import type {
  CustomExtractedExperience,
  ExperienceFieldConfidence,
  ExperienceRawBlock,
} from './types';

interface FieldPick<T> {
  value: T;
  confidence: number;
}

/** Split composite header lines ("Title | Dates | Location") into classifiable segments. */
function expandHeaderSegments(lines: string[]): string[] {
  const segments: string[] = [];
  for (const line of lines) {
    const parts = line.split(/\s*[|–—]\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 1) {
      segments.push(line);
      continue;
    }
    for (const part of parts) segments.push(part);
  }
  return segments;
}

function pickBestCompany(lines: string[], excludeDesignation = ''): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  const exclude = excludeDesignation.toLowerCase().trim();

  for (const line of expandHeaderSegments(lines)) {
    if (parseDateRangeFromText(line)) continue;
    const det = detectCompanyFromLine(line);
    if (!det.company) continue;
    if (exclude && det.company.toLowerCase().trim() === exclude) continue;
    if (det.confidence > best.confidence) {
      best = { value: det.company, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestDesignation(lines: string[], exclude: string): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    if (parseDateRangeFromText(line)) continue;
    const det = detectDesignationFromLine(line);
    if (det.designation === exclude) continue;
    if (det.confidence > best.confidence) {
      best = { value: det.designation, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestLocation(lines: string[], excludeCompany = ''): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  const exclude = excludeCompany.toLowerCase().trim();

  for (const line of expandHeaderSegments(lines)) {
    if (parseDateRangeFromText(line)) continue;
    if (exclude && line.toLowerCase().trim() === exclude) continue;
    if (looksLikeCompanyNameLine(line) && !looksLikeStandaloneLocationLine(line)) continue;

    const companyDet = detectCompanyFromLine(line);
    const det = detectLocationFromLine(line);
    if (companyDet.confidence >= 45 && companyDet.confidence > det.confidence) continue;
    if (det.confidence > best.confidence) {
      best = { value: det.location, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestDateRange(lines: string[], bodyLines: string[] = []): {
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  startConf: number;
  endConf: number;
} {
  let best: ReturnType<typeof parseDateRangeFromText> = null;
  const scanLines = [...expandHeaderSegments(lines), ...bodyLines.slice(0, 2).map((l) => l.trim()).filter(Boolean)];
  for (const line of scanLines) {
    const parsed = parseDateRangeFromText(line);
    if (parsed && (!best || parsed.confidence > best.confidence)) {
      best = parsed;
    }
  }
  if (!best) {
    return { startDate: null, endDate: null, current: false, startConf: 0, endConf: 0 };
  }
  return {
    startDate: best.startDate,
    endDate: best.endDate,
    current: best.current,
    startConf: best.startDate ? best.confidence : 0,
    endConf: best.current || best.endDate ? best.confidence : 0,
  };
}

function pickEmploymentType(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectEmploymentTypeFromText(line);
    if (det.confidence > best.confidence) {
      best = { value: det.type, confidence: det.confidence };
    }
  }
  return best;
}

function computeOverallConfidence(fc: ExperienceFieldConfidence, hasBullets: boolean): number {
  const weights = {
    company: 0.18,
    designation: 0.18,
    location: 0.08,
    employmentType: 0.04,
    startDate: 0.14,
    endDate: 0.1,
    description: 0.28,
  };

  let sum = 0;
  let weightSum = 0;
  for (const [key, w] of Object.entries(weights)) {
    const val = fc[key as keyof ExperienceFieldConfidence];
    sum += val * w;
    weightSum += w;
  }

  let overall = weightSum > 0 ? sum / weightSum : 0;
  if (hasBullets && fc.description < 40) overall = Math.max(overall, fc.description + 15);
  return Math.min(100, Math.round(overall));
}

export function buildExperienceFromBlock(block: ExperienceRawBlock): CustomExtractedExperience {
  const headerLines = block.headerText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const designationPick = pickBestDesignation(headerLines, '');
  const companyPick = pickBestCompany(headerLines, designationPick.value);
  const locationPick = pickBestLocation(headerLines, companyPick.value);
  const datePick = pickBestDateRange(headerLines, block.bodyLines);
  const employmentPick = pickEmploymentType(headerLines);

  let { description, bulletPoints, confidence: descConf } = extractDescriptionFromBlock(
    block.bodyLines
  );
  if (!description && bulletPoints.length > 0) {
    description = bulletPoints.join('\n');
    descConf = Math.max(descConf, Math.min(90, 40 + bulletPoints.length * 8));
  }
  const technologies = extractTechnologiesFromBlock(description, bulletPoints);

  const fieldConfidence: ExperienceFieldConfidence = {
    company: companyPick.confidence,
    designation: designationPick.confidence,
    location: locationPick.confidence,
    employmentType: employmentPick.confidence,
    startDate: datePick.startConf,
    endDate: datePick.endConf,
    description: descConf,
  };

  const confidence = computeOverallConfidence(fieldConfidence, bulletPoints.length > 0);

  return {
    company: companyPick.value,
    designation: designationPick.value,
    location: locationPick.value,
    employmentType: employmentPick.value,
    startDate: datePick.startDate,
    endDate: datePick.endDate,
    current: datePick.current,
    description,
    bulletPoints,
    technologies,
    confidence,
    fieldConfidence,
  };
}
