/**
 * Education boundary detection using weighted confidence signals.
 */

import { parseEducationDates } from './dates';
import { detectDegreeFromLine, lineHasDegreeSignal } from './degree';
import { detectInstitutionFromLine } from './institution';
import { buildEducationFromBlock } from './fields';
import { buildTypedEducationLines } from './lines';
import type { EducationLine, EducationRawBlock } from './types';

const BOUNDARY_THRESHOLD = 44;
const BOUNDARY_THRESHOLD_AFTER_BLANK = 36;

function scoreBoundaryLine(line: EducationLine, prevBlank: boolean): number {
  if (line.isBlank) return 0;
  if (line.isBullet) return 0;

  const text = line.text.trim();
  if (!text) return 0;

  let score = 0;

  const institution = detectInstitutionFromLine(text);
  if (institution.confidence >= 40) score += institution.confidence * 0.38;

  const degree = detectDegreeFromLine(text);
  if (degree.confidence >= 38) score += degree.confidence * 0.36;

  const dates = parseEducationDates(text);
  if (dates && dates.confidence >= 55) {
    score += dates.startDate && dates.endDate ? 28 : 18;
  }

  if (prevBlank) score += 14;
  if (text.length <= 80 && text === text.toUpperCase() && /\s/.test(text)) score += 10;
  if (/[|–—,]/.test(text) && (institution.confidence >= 40 || degree.confidence >= 38)) {
    score += 10;
  }

  if (text.split(/\s+/).length > 20 && !dates && degree.confidence < 30) score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreEducationBoundaries(lines: EducationLine[]): EducationLine[] {
  return lines.map((line, i) => {
    const prevBlank = i > 0 && lines[i - 1].isBlank;
    return { ...line, boundaryScore: scoreBoundaryLine(line, prevBlank) };
  });
}

export function partitionEducationBlocks(sectionText: string): EducationRawBlock[] {
  const lines = buildTypedEducationLines(sectionText);
  const scored = scoreEducationBoundaries(lines);
  const blocks: EducationRawBlock[] = [];
  let currentStart = 0;
  let prevWasBlank = false;

  const shouldStartNew = (line: EducationLine, afterBlank: boolean): boolean => {
    const threshold = afterBlank ? BOUNDARY_THRESHOLD_AFTER_BLANK : BOUNDARY_THRESHOLD;
    return line.boundaryScore >= threshold;
  };

  for (let i = 0; i < scored.length; i++) {
    const line = scored[i];
    if (line.isBlank) {
      prevWasBlank = true;
      continue;
    }

    if (shouldStartNew(line, prevWasBlank) && i > currentStart) {
      const slice = scored.slice(currentStart, i).filter((l) => !l.isBlank);
      if (slice.length > 0) blocks.push(buildRawBlock(slice, currentStart, i - 1));
      currentStart = i;
    }
    prevWasBlank = false;
  }

  const tail = scored.slice(currentStart).filter((l) => !l.isBlank);
  if (tail.length > 0) {
    blocks.push(buildRawBlock(tail, currentStart, scored.length - 1));
  }

  if (blocks.length === 0 && scored.some((l) => !l.isBlank)) {
    const nonBlank = scored.filter((l) => !l.isBlank);
    blocks.push(buildRawBlock(nonBlank, nonBlank[0].index, nonBlank[nonBlank.length - 1].index));
  }

  return coalesceEducationBlocks(mergeHeaderOnlyBlocks(blocks));
}

function mergeBlocks(a: EducationRawBlock, b: EducationRawBlock): EducationRawBlock {
  return buildRawBlock([...a.lines, ...b.lines], a.startLine, b.endLine);
}

/** Merge date-only orphan tails back into the preceding education block. */
function coalesceEducationBlocks(blocks: EducationRawBlock[]): EducationRawBlock[] {
  if (blocks.length <= 1) return blocks;

  const out: EducationRawBlock[] = [];

  for (const block of blocks) {
    const prev = out[out.length - 1];
    if (!prev) {
      out.push(block);
      continue;
    }

    const prevBuilt = buildEducationFromBlock(prev);
    const headerLines = block.headerText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const dateOnlyHeader =
      headerLines.length === 1 && parseEducationDates(headerLines[0]) !== null;
    const prevNeedsDates =
      Boolean(prevBuilt.institution || prevBuilt.degree) &&
      !prevBuilt.startDate &&
      !prevBuilt.endDate;

    if (dateOnlyHeader && prevNeedsDates) {
      out[out.length - 1] = mergeBlocks(prev, block);
      continue;
    }

    out.push(block);
  }

  return out;
}

function buildRawBlock(lines: EducationLine[], startLine: number, endLine: number): EducationRawBlock {
  const headerLimit = Math.min(5, lines.length);
  let headerEnd = 0;

  for (let i = 0; i < headerLimit; i++) {
    const l = lines[i];
    if (l.isBullet) break;
    if (i > 0 && l.text.trim().length > 150) break;
    if (i > 0) {
      const t = l.text.trim();
      const inst = detectInstitutionFromLine(t).confidence;
      const deg = detectDegreeFromLine(t).confidence;
      const dates = parseEducationDates(t);
      if (
        !dates &&
        inst < 38 &&
        deg < 38 &&
        t.length >= 30 &&
        (/\b(?:research|focused|thesis|dissertation|project)\b/i.test(t) || /[.!?]$/.test(t))
      ) {
        break;
      }
    }
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

function isHeaderOnlyBlock(block: EducationRawBlock): boolean {
  if (!block.bodyLines.every((l) => !l.trim())) return false;
  const headerLines = block.headerText.split('\n').map((l) => l.trim()).filter(Boolean);
  const hasDates = headerLines.some((l) => parseEducationDates(l));
  const hasDegree = headerLines.some((l) => lineHasDegreeSignal(l));
  const hasInstitution = headerLines.some(
    (l) => detectInstitutionFromLine(l).confidence >= 40
  );
  // Complete education entry fits in header — keep as standalone block
  if (hasInstitution && hasDegree && hasDates) return false;
  return headerLines.length <= 2;
}

function mergeHeaderOnlyBlocks(blocks: EducationRawBlock[]): EducationRawBlock[] {
  if (blocks.length <= 1) return blocks;

  const merged: EducationRawBlock[] = [];
  let carry: EducationRawBlock | null = null;

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

export function lineHasEducationBoundarySignal(text: string): boolean {
  return (
    detectInstitutionFromLine(text).confidence >= 40 ||
    lineHasDegreeSignal(text) ||
    parseEducationDates(text) !== null
  );
}
