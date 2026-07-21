import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import {
  buildExperienceLines,
  truncateExperienceSectionAtEmbeddedHeadings,
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
import type { ExperienceLine } from '../lib/resume-parser/custom/experience-extraction/types';

const BOUNDARY_THRESHOLD = 48;
const BOUNDARY_THRESHOLD_AFTER_BLANK = 38;

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

function debugShouldStartNew(
  line: ExperienceLine,
  afterBlank: boolean,
  blockStart: number,
  lineIndex: number,
  scored: ExperienceLine[]
): boolean {
  const reasons: string[] = [];
  if (line.isBullet) return false;

  const state = blockIdentityState(scored, blockStart, lineIndex);
  const isDateLine =
    parseDateRangeFromText(line.text) !== null || isTenureOrDateOnlyHeaderLine(line.text);
  const isCompanyLine = detectCompanyFromLine(line.text).confidence >= 45;
  const isDesignationLine = detectDesignationFromLine(line.text).confidence >= 40;
  const isTenureLine = lineLooksLikeTenureExperience(line.text);

  if (isTenureOrDateOnlyHeaderLine(line.text)) return false;
  if (isTenureLine && lineIndex > blockStart) {
    reasons.push('tenure line');
    console.log(lineIndex, line.text.slice(0, 50), 'SPLIT:', reasons, state);
    return true;
  }
  if (
    isDesignationLine &&
    !isCompanyLine &&
    !isTenureLine &&
    state.hasDesignation &&
    state.hasCompany &&
    state.hasDates
  ) {
    reasons.push('designation after complete role');
    console.log(lineIndex, line.text.slice(0, 50), 'SPLIT:', reasons, state);
    return true;
  }
  if (
    isCompanyLine &&
    !isDesignationLine &&
    !isDateLine &&
    !isTenureLine &&
    state.hasDesignation &&
    state.hasCompany &&
    state.hasDates
  ) {
    reasons.push('company line candidate');
    console.log(lineIndex, line.text.slice(0, 50), 'company check', {
      looksLikeSentence: looksLikeSentenceNotCompany(line.text.trim()),
    });
  }
  if (line.boundaryScore < (afterBlank ? BOUNDARY_THRESHOLD_AFTER_BLANK : BOUNDARY_THRESHOLD)) {
    return false;
  }
  reasons.push('boundary threshold passed');
  console.log(lineIndex, line.text.slice(0, 50), 'SPLIT:', reasons, state, 'score', line.boundaryScore);
  return true;
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

  let currentStart = 0;
  let prevWasBlank = false;
  for (let i = 0; i < scored.length; i++) {
    const line = scored[i];
    if (line.isBlank) {
      prevWasBlank = true;
      continue;
    }
    const split = debugShouldStartNew(line, prevWasBlank, currentStart, i, scored);
    if (split && i > currentStart) {
      console.log('>>> ACTUAL SPLIT at', i);
      currentStart = i;
    }
    prevWasBlank = false;
  }
}

main().catch(console.error);
