/**
 * Experience boundary detection using weighted confidence signals.
 */

import { detectCompanyFromLine, looksLikeSentenceNotCompany } from './company';
import { parseDateRangeFromText } from './dates';
import { detectDesignationFromLine } from './designation';
import { buildExperienceFromBlock } from './fields';
import { detectEmploymentTypeFromText, detectLocationFromLine } from './location';
import type { ExperienceLine, ExperienceRawBlock } from './types';

const BOUNDARY_THRESHOLD = 48;
const BOUNDARY_THRESHOLD_AFTER_BLANK = 38;

const EXPERIENCE_SUBSECTION_RE =
  /^(?:key\s+result\s+areas?|responsibilit(?:y|ies)|achievements?|highlights?|key\s+contributions?|duties|roles?\s+and\s+responsibilit(?:y|ies)|accountabilit(?:y|ies))(?:\s*:)?$/i;

function blockIdentityState(lines: ExperienceLine[], start: number, end: number) {
  let hasDesignation = false;
  let hasCompany = false;
  let hasDates = false;

  for (let i = start; i < end; i++) {
    const line = lines[i];
    if (line.isBlank || line.isBullet) continue;
    if (parseDateRangeFromText(line.text)) hasDates = true;
    if (detectCompanyFromLine(line.text).confidence >= 42) hasCompany = true;
    if (detectDesignationFromLine(line.text).confidence >= 40) hasDesignation = true;
  }

  return { hasDesignation, hasCompany, hasDates };
}

function isExperienceSubsectionLabel(text: string): boolean {
  return EXPERIENCE_SUBSECTION_RE.test(text.trim());
}

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
  if (looksLikeSentenceNotCompany(text)) score -= 40;
  if (isExperienceSubsectionLabel(text)) score -= 45;
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
  let prevWasBlank = false;

  const shouldStartNew = (
    line: ExperienceLine,
    afterBlank: boolean,
    blockStart: number,
    lineIndex: number
  ): boolean => {
    const threshold = afterBlank ? BOUNDARY_THRESHOLD_AFTER_BLANK : BOUNDARY_THRESHOLD;
    if (line.boundaryScore < threshold || line.isBullet) return false;
    if (isExperienceSubsectionLabel(line.text)) return false;

    const state = blockIdentityState(scored, blockStart, lineIndex);
    const isDateLine = parseDateRangeFromText(line.text) !== null;
    const isCompanyLine = detectCompanyFromLine(line.text).confidence >= 45;
    const isDesignationLine = detectDesignationFromLine(line.text).confidence >= 40;

    // Dates on the line after title/company belong to the same role — never split.
    if (isDateLine && (state.hasDesignation || state.hasCompany) && !state.hasDates) {
      return false;
    }

    // Company on the line after designation belongs to the same role.
    if (isCompanyLine && state.hasDesignation && !state.hasCompany && !isDateLine) {
      return false;
    }

    // Location between company and dates is still the same role header.
    if (
      !isDateLine &&
      !isCompanyLine &&
      !isDesignationLine &&
      detectLocationFromLine(line.text).confidence >= 40 &&
      (state.hasDesignation || state.hasCompany) &&
      !state.hasDates
    ) {
      return false;
    }

    // Completed role block followed by a new title/company after blank line → split.
    if (
      afterBlank &&
      state.hasDates &&
      (state.hasCompany || state.hasDesignation) &&
      (isCompanyLine || isDesignationLine || isDateLine)
    ) {
      return line.boundaryScore >= threshold - 6;
    }

    return true;
  };

  for (let i = 0; i < scored.length; i++) {
    const line = scored[i];
    if (line.isBlank) {
      prevWasBlank = true;
      continue;
    }

    if (shouldStartNew(line, prevWasBlank, currentStart, i) && i > currentStart) {
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

  return coalesceExperienceBlocks(mergeHeaderOnlyBlocks(blocks));
}

function isHeaderOnlyBlock(block: ExperienceRawBlock): boolean {
  return block.bodyLines.every((l) => !l.trim());
}

function isCompleteRoleHeader(block: ExperienceRawBlock): boolean {
  const built = buildExperienceFromBlock(block);
  const hasDates = Boolean(built.startDate || built.endDate || built.current);
  const hasCompany = Boolean(built.company);
  const hasTitle = Boolean(built.designation);
  return (hasCompany && hasTitle) || (hasTitle && hasDates) || (hasCompany && hasDates);
}

function isPartialHeaderBlock(block: ExperienceRawBlock): boolean {
  if (!isHeaderOnlyBlock(block)) return false;
  return !isCompleteRoleHeader(block);
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

    if (isPartialHeaderBlock(block)) {
      carry = block;
      continue;
    }

    merged.push(block);
  }

  if (carry) merged.push(carry);
  return merged;
}

/** Merge date-only or bullet-only orphan tails back into the preceding role block. */
function coalesceExperienceBlocks(blocks: ExperienceRawBlock[]): ExperienceRawBlock[] {
  if (blocks.length <= 1) return blocks;

  const out: ExperienceRawBlock[] = [];

  for (const block of blocks) {
    const prev = out[out.length - 1];
    if (!prev) {
      out.push(block);
      continue;
    }

    const prevBuilt = buildExperienceFromBlock(prev);
    const headerLines = block.headerText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const dateOnlyHeader =
      headerLines.length === 1 && parseDateRangeFromText(headerLines[0]) !== null;
    const orphanBullets =
      headerLines.length === 0 && block.bodyLines.some((l) => l.trim().length > 0);

    const blockBuilt = buildExperienceFromBlock(block);
    const blockIsCompleteRole = isCompleteRoleHeader(block);

    const prevNeedsDates =
      Boolean(prevBuilt.company || prevBuilt.designation) &&
      !prevBuilt.startDate &&
      !prevBuilt.endDate &&
      !prevBuilt.current;

    if (dateOnlyHeader && prevNeedsDates && !blockIsCompleteRole) {
      out[out.length - 1] = mergeBlocks(prev, block);
      continue;
    }

    if (
      orphanBullets &&
      (prevBuilt.company || prevBuilt.designation) &&
      !blockIsCompleteRole &&
      !(blockBuilt.company && blockBuilt.designation)
    ) {
      out[out.length - 1] = mergeBlocks(prev, block);
      continue;
    }

    out.push(block);
  }

  return out;
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
