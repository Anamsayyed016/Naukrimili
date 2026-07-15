/**
 * Experience boundary detection using weighted confidence signals.
 */

import {
  detectCompanyFromLine,
  lineImpliesEmployerPresence,
  looksLikeSentenceNotCompany,
  looksLikeInstitutionalEmployer,
} from './company';
import { parseDateRangeFromText } from './dates';
import { detectDesignationFromLine } from './designation';
import { buildExperienceFromBlock } from './fields';
import { detectEmploymentTypeFromText, detectLocationFromLine } from './location';
import { lineLooksLikeTenureExperience, parseTenureExperienceLine } from './tenure';
import { looksLikeCompanyNameLine } from '@/lib/resume-parser/import-sanitize';
import type { ExperienceLine, ExperienceRawBlock } from './types';

const BOUNDARY_THRESHOLD = 48;
const BOUNDARY_THRESHOLD_AFTER_BLANK = 38;

const EXPERIENCE_SUBSECTION_RE =
  /^(?:key\s+result\s+areas?|responsibilit(?:y|ies)|achievements?|highlights?|key\s+contributions?|duties|roles?\s*(?:&|and)?\s*responsibilit(?:y|ies)|(?:[\w [&/.+-]{0,40})?roles?\s*(?:&|and)?\s*responsibilit(?:y|ies)|accountabilit(?:y|ies))(?:\s*:)?$/i;

function blockIdentityState(lines: ExperienceLine[], start: number, end: number) {
  let hasDesignation = false;
  let hasCompany = false;
  let hasDates = false;

  for (let i = start; i < end; i++) {
    const line = lines[i];
    if (line.isBlank || line.isBullet) continue;
    const tenure = parseTenureExperienceLine(line.text);
    if (tenure) {
      hasDesignation = true;
      hasCompany = true;
      if (tenure.years != null) hasDates = true;
    }
    if (parseDateRangeFromText(line.text)) hasDates = true;
    // Use employer-presence (not whole-line score alone): compressed
    // "Employer Title | Dates" lines often fail detectCompanyFromLine because
    // the full string looks like prose, which would leave hasCompany false and
    // block company-only splits for the next role.
    if (lineImpliesEmployerPresence(line.text)) hasCompany = true;
    if (detectDesignationFromLine(line.text).confidence >= 40) hasDesignation = true;
  }

  return { hasDesignation, hasCompany, hasDates };
}

function isExperienceSubsectionLabel(text: string): boolean {
  const t = text.trim();
  if (EXPERIENCE_SUBSECTION_RE.test(t)) return true;
  // "Quality Manager Roles & Responsibilities" — role label subsections.
  if (/\broles?\s*(?:&|and)\s*responsibilit/i.test(t) && t.length <= 80) return true;
  return false;
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
  // "As {Role} in/at {Employer}" — high-confidence new-job marker.
  if (/^as\s+.+\s+(?:in|at|with|for)\s+.+/i.test(text)) {
    score += 36;
  }
  // "N years experience as {Role} at {Company}" — tenure summary job markers.
  if (lineLooksLikeTenureExperience(text)) {
    score += 52;
  }

  if (text.split(/\s+/).length > 18 && !dateRange && !lineLooksLikeTenureExperience(text)) score -= 25;
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

export interface ExperienceBoundaryOptions {
  threshold?: number;
  thresholdAfterBlank?: number;
}

export function partitionExperienceBlocks(
  lines: ExperienceLine[],
  options?: ExperienceBoundaryOptions
): ExperienceRawBlock[] {
  const scored = scoreExperienceBoundaries(lines);
  const blocks: ExperienceRawBlock[] = [];
  let currentStart = 0;
  let prevWasBlank = false;

  const boundaryThreshold = options?.threshold ?? BOUNDARY_THRESHOLD;
  const boundaryThresholdAfterBlank =
    options?.thresholdAfterBlank ?? BOUNDARY_THRESHOLD_AFTER_BLANK;

  const shouldStartNew = (
    line: ExperienceLine,
    afterBlank: boolean,
    blockStart: number,
    lineIndex: number
  ): boolean => {
    if (line.isBullet || isExperienceSubsectionLabel(line.text)) return false;

    const state = blockIdentityState(scored, blockStart, lineIndex);
    const isDateLine = parseDateRangeFromText(line.text) !== null;
    const isCompanyLine = detectCompanyFromLine(line.text).confidence >= 45;
    const isDesignationLine = detectDesignationFromLine(line.text).confidence >= 40;
    const isTenureLine = lineLooksLikeTenureExperience(line.text);

    // Each "N years experience as Title at Company" starts a new role
    // (including the first tenure line after a section label).
    if (isTenureLine && lineIndex > blockStart) {
      return true;
    }

    // A strong job title after a completed role header starts the next role even when
    // the title-only line scores below the normal boundary threshold (common on
    // ATS resumes with contiguous entries and no blank separator).
    if (
      isDesignationLine &&
      !isCompanyLine &&
      !isDateLine &&
      !isTenureLine &&
      state.hasDesignation &&
      state.hasCompany &&
      state.hasDates
    ) {
      return true;
    }

    // Mirror for company-only headers after a completed role (Company\nTitle | Dates).
    // Guard against body sentences that weakly match company heuristics.
    if (
      isCompanyLine &&
      !isDesignationLine &&
      !isDateLine &&
      !isTenureLine &&
      state.hasDesignation &&
      state.hasCompany &&
      state.hasDates
    ) {
      const text = line.text.trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const looksLikeBodyProse =
        looksLikeSentenceNotCompany(text) ||
        /^(?:managed|led|oversaw|drove|executed|prepared|supported|coordinated|developed|implemented|worked|responsible|handled|maintained|processed|created|designed|built|delivered)\b/i.test(
          text
        ) ||
        (wordCount >= 8 && !looksLikeInstitutionalEmployer(text));
      const strongEmployerHeader =
        looksLikeInstitutionalEmployer(text) ||
        (looksLikeCompanyNameLine(text) &&
          wordCount >= 2 &&
          wordCount <= 7 &&
          detectCompanyFromLine(text).confidence >= 58 &&
          // Reject short body fragments like "Bank Guarantees." that wrap mid-sentence.
          !(wordCount <= 3 && /\.\s*$/.test(text) && !/(?:ltd|limited|llc|inc|corp|llp|pvt|gmbh|plc)\.?$/i.test(text)));
      if (!looksLikeBodyProse && strongEmployerHeader) {
        return true;
      }
    }

    const threshold = afterBlank ? boundaryThresholdAfterBlank : boundaryThreshold;
    if (line.boundaryScore < threshold) return false;

    // Dates on the line after title/company belong to the same role — never split.
    if (isDateLine && (state.hasDesignation || state.hasCompany) && !state.hasDates) {
      return false;
    }

    // Company (± inline dates) on the line after designation belongs to the same role.
    if (isCompanyLine && state.hasDesignation && !state.hasCompany) {
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

    // Do not split on short wrapped mid-sentence fragments ("Bank Guarantees.") once
    // a role is already complete — those are body leftovers, not employers.
    if (
      state.hasDates &&
      (state.hasCompany || state.hasDesignation) &&
      !isDesignationLine &&
      !isDateLine &&
      !isTenureLine
    ) {
      const text = line.text.trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      if (
        words <= 3 &&
        /\.\s*$/.test(text) &&
        !looksLikeInstitutionalEmployer(text) &&
        !looksLikeCompanyNameLine(text.replace(/\.\s*$/, ''))
      ) {
        return false;
      }
      // Even if the bare phrase looks like a company name, trailing-period
      // two/three-word fragments after a completed role are almost always wrap noise.
      if (words <= 3 && /\.\s*$/.test(text) && !looksLikeInstitutionalEmployer(text)) {
        return false;
      }
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
    if (i > 0 && isExperienceSubsectionLabel(l.text)) break;
    if (i > 0 && /^experience\s+summary\s*:?\s*$/i.test(l.text.trim())) break;
    if (i > 0 && l.text.trim().length > 140) break;
    if (i > 0) {
      const text = l.text.trim();
      const looksLikeRoleHeader =
        Boolean(parseDateRangeFromText(text)) ||
        detectDesignationFromLine(text).confidence >= 40 ||
        /\s\|\s/.test(text) ||
        Boolean(parseTenureExperienceLine(text));
      if (
        !looksLikeRoleHeader &&
        looksLikeSentenceNotCompany(text) &&
        !parseTenureExperienceLine(text)
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
