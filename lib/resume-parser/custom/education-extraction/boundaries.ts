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

  // Bullet education rows ("● M.Com – BU Bhopal (2025)") are entry headers, not body.
  const text = line.text.trim().replace(/^[\s•●\-–—*·▪○]+\s*/, '');
  if (!text) return 0;
  if (line.isBullet && !lineHasDegreeSignal(text) && detectInstitutionFromLine(text).confidence < 38) {
    return 0;
  }

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
  if (line.isBullet && (degree.confidence >= 38 || institution.confidence >= 40)) score += 18;
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

  const shouldStartNew = (line: EducationLine, afterBlank: boolean, idx: number): boolean => {
    const threshold = afterBlank ? BOUNDARY_THRESHOLD_AFTER_BLANK : BOUNDARY_THRESHOLD;
    const text = line.text.trim().replace(/^[\s•●\-–—*·▪○]+\s*/, '');
    const deg = detectDegreeFromLine(text);
    const inst = detectInstitutionFromLine(text);
    const looksPrimarilyInstitution =
      inst.confidence >= 40 &&
      inst.confidence >= deg.confidence &&
      /\b(university|college|institute|institution|school|academy|polytechnic)\b/i.test(text);
    const isStrongDegreeHeading =
      deg.confidence >= 70 && !looksPrimarilyInstitution && !parseEducationDates(text);
    const isBulletDegreeEntry =
      line.isBullet &&
      (deg.confidence >= 38 || lineHasDegreeSignal(text)) &&
      idx > currentStart;

    // Each bullet degree line is its own entry on ATS resumes.
    if (isBulletDegreeEntry) {
      const openSlice = scored.slice(currentStart, idx).filter((l) => !l.isBlank);
      const openHasDegree = openSlice.some((l) => {
        const t = l.text.trim().replace(/^[\s•●\-–—*·▪○]+\s*/, '');
        return detectDegreeFromLine(t).confidence >= 38 || lineHasDegreeSignal(t);
      });
      if (openHasDegree) return true;
    }

    // Dedicated degree headings start the next entry even when their weighted
    // boundary score is below the normal threshold (common for "MBA" / "BCA" lines).
    if (isStrongDegreeHeading && idx > currentStart) {
      const openSlice = scored.slice(currentStart, idx).filter((l) => !l.isBlank);
      const openHasDegree = openSlice.some((l) => detectDegreeFromLine(l.text).confidence >= 70);
      if (openHasDegree) return true;
    }

    if (line.boundaryScore < threshold) return false;

    // Affiliating university / college lines must not split an open degree entry.
    if (looksPrimarilyInstitution && idx > currentStart) {
      const openSlice = scored.slice(currentStart, idx).filter((l) => !l.isBlank);
      const openHasDegree = openSlice.some((l) => detectDegreeFromLine(l.text).confidence >= 38);
      const openHasInstitution = openSlice.some(
        (l) => detectInstitutionFromLine(l.text).confidence >= 40
      );
      const openHasDates = openSlice.some((l) => parseEducationDates(l.text));
      if (openHasDegree && !openHasDates) return false;
      if (openHasDegree && !openHasInstitution) return false;
    }
    return true;
  };

  for (let i = 0; i < scored.length; i++) {
    const line = scored[i];
    if (line.isBlank) {
      prevWasBlank = true;
      continue;
    }

    if (shouldStartNew(line, prevWasBlank, i) && i > currentStart) {
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
    const stripped = l.text.trim().replace(/^[\s•●\-–—*·▪○]+\s*/, '');
    // Bullet degree/institution rows ARE the header on compact ATS educations.
    if (
      l.isBullet &&
      !(
        lineHasDegreeSignal(stripped) ||
        detectDegreeFromLine(stripped).confidence >= 38 ||
        detectInstitutionFromLine(stripped).confidence >= 38
      )
    ) {
      break;
    }
    if (i > 0 && l.text.trim().length > 150) break;
    if (i > 0) {
      const t = stripped;
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

  const headerLines = lines.slice(0, headerEnd).map((l) => ({
    ...l,
    text: l.text.trim().replace(/^[\s•●\-–—*·▪○]+\s*/, ''),
    isBullet: false,
  }));
  const bodyLines = lines.slice(headerEnd).map((l) => l.text);

  return {
    startLine,
    endLine,
    lines,
    headerText: headerLines.map((l) => l.text).join('\n'),
    bodyLines,
  };
}

function isCompactDegreeDashEntry(text: string): boolean {
  const cleaned = text.trim().replace(/^[\s•●\-–—*·▪○]+\s*/, '');
  if (!cleaned) return false;
  if (!lineHasDegreeSignal(cleaned) && detectDegreeFromLine(cleaned).confidence < 38) {
    return false;
  }
  const dash = cleaned.match(/^(.+?)\s*[–—\-]\s*(.+)$/);
  if (!dash) return false;
  const lhs = dash[1].trim();
  const rhs = dash[2]
    .trim()
    .replace(/\s*[\(\[]\s*(?:19|20)\d{2}.*$/i, '')
    .trim();
  // "CA - Final" / "CA - Intermediate" are degree stages, not Degree – Institution.
  if (
    /^(?:final|intermediate|foundation|ipcc|cpt|executive|professional|foundation\s+course)$/i.test(
      rhs
    )
  ) {
    return false;
  }
  if (/^ca\b/i.test(lhs) && rhs.split(/\s+/).length <= 2 && !/\b(university|college|institute|school|academy)\b/i.test(rhs)) {
    return false;
  }
  // "Degree – Institution …" (including abbreviated schools without
  // university/college tokens) is already a complete ATS education row.
  return rhs.length >= 2;
}

function isHeaderOnlyBlock(block: EducationRawBlock): boolean {
  if (!block.bodyLines.every((l) => !l.trim())) return false;
  const headerLines = block.headerText.split('\n').map((l) => l.trim()).filter(Boolean);
  const hasDates = headerLines.some((l) => parseEducationDates(l));
  const hasDegree = headerLines.some((l) => lineHasDegreeSignal(l));
  const hasInstitution = headerLines.some(
    (l) => detectInstitutionFromLine(l).confidence >= 40
  );
  // Complete education entry fits in header — keep as standalone block.
  // Compact "Degree – School (year)" rows often lack a separate date line.
  if (hasInstitution && hasDegree) return false;
  if (hasDegree && hasDates) return false;
  if (headerLines.some(isCompactDegreeDashEntry)) return false;
  return headerLines.length <= 2;
}

function blockHasDegreeSignal(block: EducationRawBlock): boolean {
  const headerLines = block.headerText.split('\n').map((l) => l.trim()).filter(Boolean);
  return headerLines.some((l) => {
    const deg = detectDegreeFromLine(l);
    const hasDeg = deg.confidence >= 38 || lineHasDegreeSignal(l);
    if (!hasDeg) return false;
    const inst = detectInstitutionFromLine(l);
    // Institute / school lines that only weakly match as education text are not degree headers.
    if (inst.confidence >= 48 && inst.confidence >= deg.confidence) return false;
    return true;
  });
}

function mergeHeaderOnlyBlocks(blocks: EducationRawBlock[]): EducationRawBlock[] {
  if (blocks.length <= 1) return blocks;

  const merged: EducationRawBlock[] = [];
  let carry: EducationRawBlock | null = null;

  for (const block of blocks) {
    if (carry) {
      // Never glue two degree-bearing entries (common ATS bullet lists).
      if (blockHasDegreeSignal(carry) && blockHasDegreeSignal(block)) {
        merged.push(carry);
        carry = null;
        if (isHeaderOnlyBlock(block)) {
          carry = block;
          continue;
        }
        merged.push(block);
        continue;
      }
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
