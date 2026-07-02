/**
 * Experience boundary detection using weighted confidence signals.
 */

import { detectCompanyFromLine } from './company';
import { parseDateRangeFromText } from './dates';
import { detectDesignationFromLine } from './designation';
import { detectEmploymentTypeFromText, detectLocationFromLine } from './location';
import type { ExperienceLine, ExperienceRawBlock } from './types';

const BOUNDARY_THRESHOLD = 48;
const BOUNDARY_THRESHOLD_AFTER_BLANK = 38;

function scoreBoundaryLine(line: ExperienceLine, prevBlank: boolean): number {
  if (line.isBlank || line.isBullet) return 0;

  const text = line.text.trim();
  if (!text) return 0;

  let score = 0;

  const dateRange = parseDateRangeFromText(text);
  if (dateRange && dateRange.confidence >= 55) score += 38;

  const company = detectCompanyFromLine(text);
  if (company.confidence >= 45) score += company.confidence * 0.35;

  const designation = detectDesignationFromLine(text);
  if (designation.confidence >= 40) score += designation.confidence * 0.32;

  const location = detectLocationFromLine(text);
  if (location.confidence >= 40) score += location.confidence * 0.15;

  const employment = detectEmploymentTypeFromText(text);
  if (employment.confidence >= 70) score += 12;

  if (prevBlank) score += 14;
  if (text.length <= 80 && text === text.toUpperCase() && /\s/.test(text)) score += 10;
  if (/[|–—]/.test(text) && (company.confidence >= 40 || designation.confidence >= 40)) {
    score += 12;
  }

  if (text.split(/\s+/).length > 18 && !dateRange) score -= 25;
  if (/^(responsibilities|achievements|key contributions)/i.test(text)) score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreExperienceBoundaries(lines: ExperienceLine[]): ExperienceLine[] {
  return lines.map((line, i) => {
    const prevBlank = i > 0 && lines[i - 1].isBlank;
    const boundaryScore = scoreBoundaryLine(line, prevBlank);
    return { ...line, boundaryScore };
  });
}

export function partitionExperienceBlocks(lines: ExperienceLine[]): ExperienceRawBlock[] {
  const scored = scoreExperienceBoundaries(lines);
  const blocks: ExperienceRawBlock[] = [];
  let currentStart = 0;

  const shouldStartNew = (line: ExperienceLine, idx: number): boolean => {
    if (idx === 0) return true;
    const prevBlank = idx > 0 && scored[idx - 1].isBlank;
    const threshold = prevBlank ? BOUNDARY_THRESHOLD_AFTER_BLANK : BOUNDARY_THRESHOLD;
    return line.boundaryScore >= threshold && !line.isBullet;
  };

  for (let i = 0; i < scored.length; i++) {
    const line = scored[i];
    if (line.isBlank) continue;

    if (shouldStartNew(line, i) && i > currentStart) {
      const slice = scored.slice(currentStart, i).filter((l) => !l.isBlank);
      if (slice.length > 0) blocks.push(buildRawBlock(slice, currentStart, i - 1));
      currentStart = i;
    } else if (i === 0) {
      currentStart = 0;
    }
  }

  const tail = scored.slice(currentStart).filter((l) => !l.isBlank);
  if (tail.length > 0) {
    blocks.push(buildRawBlock(tail, currentStart, scored.length - 1));
  }

  if (blocks.length === 0 && scored.some((l) => !l.isBlank)) {
    const nonBlank = scored.filter((l) => !l.isBlank);
    blocks.push(buildRawBlock(nonBlank, nonBlank[0].index, nonBlank[nonBlank.length - 1].index));
  }

  return mergeHeaderOnlyBlocks(blocks);
}

function isHeaderOnlyBlock(block: ExperienceRawBlock): boolean {
  return block.bodyLines.every((l) => !l.trim());
}

function mergeBlocks(a: ExperienceRawBlock, b: ExperienceRawBlock): ExperienceRawBlock {
  const lines = [...a.lines, ...b.lines];
  return buildRawBlock(lines, a.startLine, b.endLine);
}

/** Attach orphan company/location header lines to the next experience block. */
function mergeHeaderOnlyBlocks(blocks: ExperienceRawBlock[]): ExperienceRawBlock[] {
  if (blocks.length <= 1) return blocks;

  const merged: ExperienceRawBlock[] = [];
  let carry: ExperienceRawBlock | null = null;

  for (const block of blocks) {
    if (carry) {
      merged.push(mergeBlocks(carry, block));
      carry = null;
      continue;
    }

    if (isHeaderOnlyBlock(block)) {
      carry = block;
      continue;
    }

    merged.push(block);
  }

  if (carry) merged.push(carry);
  return merged;
}

function buildRawBlock(lines: ExperienceLine[], startLine: number, endLine: number): ExperienceRawBlock {
  const headerLimit = Math.min(5, lines.length);
  let headerEnd = 0;
  for (let i = 0; i < headerLimit; i++) {
    const l = lines[i];
    if (l.isBullet) break;
    if (i > 0 && l.text.trim().length > 140) break;
    headerEnd = i + 1;
  }

  const headerLines = lines.slice(0, headerEnd);
  const bodyLines = lines.slice(headerEnd).map((l) => l.text);

  return {
    startLine,
    endLine,
    lines,
    headerText: headerLines.map((l) => l.text).join('\n'),
    bodyLines,
  };
}
