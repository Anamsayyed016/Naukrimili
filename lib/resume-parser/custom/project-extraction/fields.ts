/**
 * Per-block field assembly and confidence aggregation.
 */

import { parseDateRangeFromText } from '../experience-extraction/dates';
import { isPlausibleExperienceCompany } from '@/lib/resume-parser/import-sanitize';

import { extractDescriptionFromBlock } from './description';
import { extractLinksFromText } from './links';
import { detectRoleFromLine } from './role';
import { detectTitleFromLine } from './title';
import { extractTechnologiesFromBlock } from './technologies';
import type {
  CustomExtractedProject,
  ProjectFieldConfidence,
  ProjectRawBlock,
} from './types';

interface FieldPick<T> {
  value: T;
  confidence: number;
}

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

function pickBestTitle(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectTitleFromLine(line);
    if (det.confidence > best.confidence) {
      best = { value: det.title, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestRole(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const det = detectRoleFromLine(line);
    if (det.confidence > best.confidence) {
      best = { value: det.role, confidence: det.confidence };
    }
  }
  return best;
}

function pickBestLinks(lines: string[]): { github: string; liveUrl: string; confidence: number } {
  let best = { github: '', liveUrl: '', confidence: 0 };
  const combined = lines.join('\n');
  const fromAll = extractLinksFromText(combined);
  if (fromAll.confidence > best.confidence) best = fromAll;

  for (const line of lines) {
    const det = extractLinksFromText(line);
    if (det.confidence > best.confidence) best = det;
  }
  return best;
}

function pickDuration(lines: string[]): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of expandHeaderSegments(lines)) {
    const parsed = parseDateRangeFromText(line);
    if (parsed && parsed.confidence > best.confidence) {
      best = { value: parsed.raw, confidence: parsed.confidence };
    }
  }
  return best;
}

function pickCompany(lines: string[], excludeTitle: string): FieldPick<string> {
  let best: FieldPick<string> = { value: '', confidence: 0 };
  for (const line of lines) {
    const clientMatch = line.match(/(?:client|company|organization|employer)\s*[:–-]\s*(.+)/i);
    const candidate = clientMatch?.[1]?.trim() || '';
    if (!candidate || candidate === excludeTitle) continue;
    if (isPlausibleExperienceCompany(candidate)) {
      best = { value: candidate, confidence: 75 };
    }
  }
  return best;
}

function computeOverallConfidence(fc: ProjectFieldConfidence): number {
  const weights: Record<keyof ProjectFieldConfidence, number> = {
    title: 0.28,
    description: 0.3,
    technologies: 0.14,
    links: 0.1,
    role: 0.06,
    company: 0.04,
    duration: 0.08,
  };

  let sum = 0;
  let weightSum = 0;
  for (const [key, w] of Object.entries(weights) as Array<[keyof ProjectFieldConfidence, number]>) {
    const val = fc[key];
    if (key === 'title' || key === 'description' || key === 'technologies' || val > 0) {
      sum += val * w;
      weightSum += w;
    }
  }
  return Math.min(100, Math.round(weightSum > 0 ? sum / weightSum : 0));
}

export function buildProjectFromBlock(block: ProjectRawBlock): CustomExtractedProject {
  const headerLines = block.headerText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const titlePick = pickBestTitle(headerLines);
  const rolePick = pickBestRole([...headerLines, ...block.bodyLines.slice(0, 2)]);
  const linksPick = pickBestLinks([...headerLines, ...block.bodyLines]);
  const durationPick = pickDuration(headerLines);
  const companyPick = pickCompany(headerLines, titlePick.value);

  const headerRemainder = headerLines.filter(
    (line) => line.trim().toLowerCase() !== titlePick.value.toLowerCase()
  );
  const { description, achievements, peeledTechnologies, confidence: descConf } =
    extractDescriptionFromBlock([...headerRemainder, ...block.bodyLines]);

  const technologies = [
    ...new Set([
      ...extractTechnologiesFromBlock(block.headerText, description, achievements),
      ...peeledTechnologies,
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const techConf =
    technologies.length > 0
      ? Math.min(95, 45 + technologies.length * 8)
      : peeledTechnologies.length > 0
        ? 55
        : 0;

  const fieldConfidence: ProjectFieldConfidence = {
    title: titlePick.confidence,
    role: rolePick.confidence,
    description: descConf,
    technologies: techConf,
    links: linksPick.confidence,
    company: companyPick.confidence,
    duration: durationPick.confidence,
  };

  return {
    title: titlePick.value,
    role: rolePick.value,
    description,
    technologies,
    github: linksPick.github,
    liveUrl: linksPick.liveUrl,
    duration: durationPick.value,
    company: companyPick.value,
    achievements,
    confidence: computeOverallConfidence(fieldConfidence),
    fieldConfidence,
  };
}
