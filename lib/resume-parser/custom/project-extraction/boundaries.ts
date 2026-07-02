/**
 * Project boundary detection using weighted confidence signals.
 */

import { parseDateRangeFromText } from '../experience-extraction/dates';
import { extractLinksFromText, lineHasLinkSignal } from './links';
import { buildTypedProjectLines } from './lines';
import { detectTitleFromLine, scoreProjectTitleCandidate } from './title';
import { lineHasTechStackSignal } from './technologies';
import type { ProjectLine, ProjectRawBlock } from './types';

const BOUNDARY_THRESHOLD = 42;
const BOUNDARY_THRESHOLD_AFTER_BLANK = 34;

function scoreBoundaryLine(line: ProjectLine, prevBlank: boolean): number {
  if (line.isBlank) return 0;
  if (line.isBullet) {
    if (prevBlank) {
      const text = line.text.trim();
      const bulletTitle = scoreProjectTitleCandidate(stripBulletTitle(text));
      if (bulletTitle >= 45) return Math.min(55, Math.round(bulletTitle * 0.45 + 14));
    }
    return 0;
  }

  const text = line.text.trim();
  if (!text) return 0;

  let score = 0;

  const title = detectTitleFromLine(text);
  if (title.confidence >= 38) score += title.confidence * 0.4;

  if (lineHasLinkSignal(text)) {
    score += title.confidence >= 38 ? 36 : 8;
  }
  if (lineHasTechStackSignal(text)) {
    score += title.confidence >= 35 ? 22 : 10;
  }

  const dateRange = parseDateRangeFromText(text);
  if (dateRange && dateRange.confidence >= 55) {
    const withoutDate = text.replace(dateRange.raw, '').trim();
    score += withoutDate.length >= 4 ? 24 : 6;
  }

  if (prevBlank) score += 14;

  if (text.split(/\s+/).length > 22 && !dateRange && title.confidence < 30) score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function stripBulletTitle(text: string): string {
  return text.replace(/^[\s]*(?:[-–—•·▪‣●○◦]|\d+[\.\)])\s+/, '').split(/\s+[-–—:]\s+/)[0]?.trim() || text;
}

export function scoreProjectBoundaries(lines: ProjectLine[]): ProjectLine[] {
  return lines.map((line, i) => {
    const prevBlank = i > 0 && lines[i - 1].isBlank;
    return { ...line, boundaryScore: scoreBoundaryLine(line, prevBlank) };
  });
}

export function partitionProjectBlocks(sectionText: string): ProjectRawBlock[] {
  const lines = buildTypedProjectLines(sectionText);
  const scored = scoreProjectBoundaries(lines);
  const blocks: ProjectRawBlock[] = [];
  let currentStart = 0;

  const shouldStartNew = (line: ProjectLine, idx: number): boolean => {
    if (idx === 0) return true;
    if (line.isBullet) return false;
    const prevBlank = idx > 0 && scored[idx - 1].isBlank;
    const threshold = prevBlank ? BOUNDARY_THRESHOLD_AFTER_BLANK : BOUNDARY_THRESHOLD;
    return line.boundaryScore >= threshold;
  };

  for (let i = 0; i < scored.length; i++) {
    const line = scored[i];
    if (line.isBlank) continue;

    if (shouldStartNew(line, i) && i > currentStart) {
      const slice = scored.slice(currentStart, i).filter((l) => !l.isBlank);
      if (slice.length > 0) blocks.push(buildRawBlock(slice, currentStart, i - 1));
      currentStart = i;
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

  return mergeMetaOnlyBlocks(mergeHeaderOnlyBlocks(blocks));
}

function isMetaOnlyHeader(block: ProjectRawBlock): boolean {
  const headerLines = block.headerText.split('\n').map((l) => l.trim()).filter(Boolean);
  if (headerLines.length !== 1) return false;
  const line = headerLines[0];
  if (parseDateRangeFromText(line)) return true;
  if (lineHasLinkSignal(line) && detectTitleFromLine(line).confidence < 35) return true;
  return false;
}

function mergeMetaOnlyBlocks(blocks: ProjectRawBlock[]): ProjectRawBlock[] {
  if (blocks.length <= 1) return blocks;
  const merged: ProjectRawBlock[] = [];
  for (const block of blocks) {
    if (merged.length > 0 && isMetaOnlyHeader(block)) {
      const prev = merged[merged.length - 1];
      merged[merged.length - 1] = mergeBlocks(prev, block);
    } else {
      merged.push(block);
    }
  }
  return merged;
}

function isMetaHeaderLine(text: string): boolean {
  return (
    lineHasLinkSignal(text) ||
    parseDateRangeFromText(text) !== null ||
    lineHasTechStackSignal(text)
  );
}

function buildRawBlock(lines: ProjectLine[], startLine: number, endLine: number): ProjectRawBlock {
  const headerLimit = Math.min(6, lines.length);
  let headerEnd = 0;

  for (let i = 0; i < headerLimit; i++) {
    const l = lines[i];
    if (l.isBullet && i > 0) break;
    if (i > 0 && l.text.trim().length > 160 && !isMetaHeaderLine(l.text)) break;
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

function isHeaderOnlyBlock(block: ProjectRawBlock): boolean {
  return block.bodyLines.every((l) => !l.trim());
}

function mergeBlocks(a: ProjectRawBlock, b: ProjectRawBlock): ProjectRawBlock {
  return buildRawBlock([...a.lines, ...b.lines], a.startLine, b.endLine);
}

function mergeHeaderOnlyBlocks(blocks: ProjectRawBlock[]): ProjectRawBlock[] {
  if (blocks.length <= 1) return blocks;

  const merged: ProjectRawBlock[] = [];
  let carry: ProjectRawBlock | null = null;

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
