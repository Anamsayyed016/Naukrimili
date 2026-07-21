/**
 * Trace partition splits using production shouldStartNew logic (mirrored from boundaries.ts).
 */
import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import {
  buildExperienceLines,
  truncateExperienceSectionAtEmbeddedHeadings,
  isEmbeddedMajorSectionHeading,
} from '../lib/resume-parser/custom/experience-extraction/lines';
import { scoreExperienceBoundaries } from '../lib/resume-parser/custom/experience-extraction/boundaries';
import {
  detectCompanyFromLine,
  lineImpliesEmployerPresence,
  looksLikeInstitutionalEmployer,
  looksLikeSentenceNotCompany,
} from '../lib/resume-parser/custom/experience-extraction/company';
import { parseDateRangeFromText, isTenureOrDateOnlyHeaderLine } from '../lib/resume-parser/custom/experience-extraction/dates';
import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { detectLocationFromLine } from '../lib/resume-parser/custom/experience-extraction/location';
import { lineLooksLikeTenureExperience, parseTenureExperienceLine } from '../lib/resume-parser/custom/experience-extraction/tenure';
import { looksLikeCompanyNameLine } from '../lib/resume-parser/import-sanitize';
import type { ExperienceLine } from '../lib/resume-parser/custom/experience-extraction/types';

const BOUNDARY_THRESHOLD = 48;
const BOUNDARY_THRESHOLD_AFTER_BLANK = 38;

const EXPERIENCE_SUBSECTION_RE =
  /^(?:key\s+result\s+areas?|responsibilit(?:y|ies)|achievements?|highlights?|key\s+contributions?|duties|roles?\s*(?:&|and)?\s*responsibilit(?:y|ies)|(?:[\w [&/.+-]{0,40})?roles?\s*(?:&|and)?\s*responsibilit(?:y|ies)|accountabilit(?:y|ies)|internal\s+audit|statutory\s+audit|tax\s*(?:&|and)?\s*compliance|tax\s+compliance(?:\s*&|\s+and)?\s*return\s+preparation|financial\s+projections?|business\s+advisory)(?:\s*:)?$/i;

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
    if (isTenureOrDateOnlyHeaderLine(line.text)) hasDates = true;
    if (lineImpliesEmployerPresence(line.text)) hasCompany = true;
    if (detectDesignationFromLine(line.text).confidence >= 40) hasDesignation = true;
  }
  return { hasDesignation, hasCompany, hasDates };
}

function isExperienceSubsectionLabel(text: string): boolean {
  const t = text.trim();
  if (EXPERIENCE_SUBSECTION_RE.test(t)) return true;
  if (/\broles?\s*(?:&|and)\s*responsibilit/i.test(t) && t.length <= 80) return true;
  if (
    /^(?:project|roles?|designations?|positions?|titles?|team\s*size|key\s+responsibilit(?:y|ies)|responsibilit(?:y|ies)|tenure|duration|period)\s*(?:[:\-–—].*)?$/i.test(
      t
    )
  ) {
    return true;
  }
  if (isEmbeddedMajorSectionHeading(t)) return false;
  if (/^responsibilit(?:y|ies)\s*[-–—:]/i.test(t)) return true;
  if (isTenureOrDateOnlyHeaderLine(t)) return true;
  if (/^projects?\s*[:\-–—]/i.test(t) && t.length <= 100) return true;
  return false;
}

function shouldStartNew(
  line: ExperienceLine,
  afterBlank: boolean,
  blockStart: number,
  lineIndex: number,
  scored: ExperienceLine[]
): { split: boolean; reason: string } {
  if (line.isBullet) return { split: false, reason: 'bullet' };

  if (isExperienceSubsectionLabel(line.text)) {
    const state = blockIdentityState(scored, blockStart, lineIndex);
    if (
      /\broles?\s*(?:&|and)\s*responsibilit/i.test(line.text.trim()) &&
      state.hasCompany &&
      state.hasDesignation &&
      lineIndex > blockStart
    ) {
      return { split: true, reason: 'roles-responsibilities subsection' };
    }
    return { split: false, reason: 'subsection label' };
  }

  const state = blockIdentityState(scored, blockStart, lineIndex);
  const isDateLine =
    parseDateRangeFromText(line.text) !== null || isTenureOrDateOnlyHeaderLine(line.text);
  const isCompanyLine = detectCompanyFromLine(line.text).confidence >= 45;
  const isDesignationLine = detectDesignationFromLine(line.text).confidence >= 40;
  const isTenureLine = lineLooksLikeTenureExperience(line.text);

  if (isTenureOrDateOnlyHeaderLine(line.text)) return { split: false, reason: 'tenure/date header' };
  if (isTenureLine && lineIndex > blockStart) return { split: true, reason: 'tenure experience line' };
  if (
    isDesignationLine &&
    !isCompanyLine &&
    !isTenureLine &&
    state.hasDesignation &&
    state.hasCompany &&
    state.hasDates
  ) {
    return { split: true, reason: 'designation after complete role' };
  }

  const threshold = afterBlank ? BOUNDARY_THRESHOLD_AFTER_BLANK : BOUNDARY_THRESHOLD;
  if (line.boundaryScore < threshold) return { split: false, reason: `score ${line.boundaryScore} < ${threshold}` };

  if (
    state.hasDates &&
    (state.hasCompany || state.hasDesignation) &&
    looksLikeSentenceNotCompany(line.text.trim()) &&
    !looksLikeInstitutionalEmployer(line.text.trim())
  ) {
    return { split: false, reason: 'body prose guard' };
  }

  return { split: true, reason: 'threshold passed' };
}

async function main() {
  const { text } = await parsePdfBuffer(
    Buffer.from(readFileSync('C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf'))
  );
  const prep = prepareResumeTextForParsing(text);
  const sections = detectResumeSections(prep.text);
  const trimmed = truncateExperienceSectionAtEmbeddedHeadings(String(sections.experience || ''));
  const lines = buildExperienceLines(trimmed);
  const scored = scoreExperienceBoundaries(lines);

  console.log('=== subsection labels ===');
  scored.forEach((l, i) => {
    if (isExperienceSubsectionLabel(l.text)) console.log(i, l.text.slice(0, 60), 'SUBSECTION');
  });

  let currentStart = 0;
  let prevWasBlank = false;
  for (let i = 0; i < scored.length; i++) {
    const line = scored[i];
    if (line.isBlank) {
      prevWasBlank = true;
      continue;
    }
    const { split, reason } = shouldStartNew(line, prevWasBlank, currentStart, i, scored);
    if (split && i > currentStart) {
      console.log('SPLIT at', i, reason, ':', line.text.slice(0, 55));
      currentStart = i;
    }
    prevWasBlank = false;
  }
}

main().catch(console.error);
