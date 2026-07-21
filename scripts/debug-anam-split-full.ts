import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import {
  buildExperienceLines,
  truncateExperienceSectionAtEmbeddedHeadings,
  isEmbeddedMajorSectionHeading,
} from '../lib/resume-parser/custom/experience-extraction/lines';
import { parseDateRangeFromText, isTenureOrDateOnlyHeaderLine } from '../lib/resume-parser/custom/experience-extraction/dates';
import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { detectCompanyFromLine, lineImpliesEmployerPresence, looksLikeInstitutionalEmployer, looksLikeSentenceNotCompany } from '../lib/resume-parser/custom/experience-extraction/company';
import { lineLooksLikeTenureExperience, parseTenureExperienceLine } from '../lib/resume-parser/custom/experience-extraction/tenure';
import { detectLocationFromLine } from '../lib/resume-parser/custom/experience-extraction/location';
import { looksLikeCompanyNameLine } from '../lib/resume-parser/import-sanitize';
import { scoreExperienceBoundaries } from '../lib/resume-parser/custom/experience-extraction/boundaries';
import type { ExperienceLine } from '../lib/resume-parser/custom/experience-extraction/types';

const EXPERIENCE_SUBSECTION_RE =
  /^(?:key\s+result\s+areas?|responsibilit(?:y|ies)|achievements?|highlights?|key\s+contributions?|duties|roles?\s*(?:&|and)?\s*responsibilit(?:y|ies)|(?:[\w [&/.+-]{0,40})?roles?\s*(?:&|and)?\s*responsibilit(?:y|ies)|accountabilit(?:y|ies)|internal\s+audit|statutory\s+audit|tax\s*(?:&|and)?\s*compliance|tax\s+compliance(?:\s*&|\s+and)?\s*return\s+preparation|financial\s+projections?|business\s+advisory)(?:\s*:)?$/i;

function isExperienceSubsectionLabel(text: string): boolean {
  const t = text.trim();
  if (EXPERIENCE_SUBSECTION_RE.test(t)) return true;
  if (/\broles?\s*(?:&|and)\s*responsibilit/i.test(t) && t.length <= 80) return true;
  if (/^(?:project|roles?|designations?|positions?|titles?|team\s*size|key\s+responsibilit(?:y|ies)|responsibilit(?:y|ies)|tenure|duration|period)\s*(?:[:\-–—].*)?$/i.test(t)) return true;
  if (isEmbeddedMajorSectionHeading(t)) return false;
  if (/^responsibilit(?:y|ies)\s*[-–—:]/i.test(t)) return true;
  if (isTenureOrDateOnlyHeaderLine(t)) return true;
  if (/^projects?\s*[:\-–—]/i.test(t) && t.length <= 100) return true;
  return false;
}

function blockIdentityState(lines: ExperienceLine[], start: number, end: number) {
  let hasDesignation = false, hasCompany = false, hasDates = false;
  for (let i = start; i < end; i++) {
    const line = lines[i];
    if (line.isBlank || line.isBullet) continue;
    if (parseTenureExperienceLine(line.text)) { hasDesignation = true; hasCompany = true; }
    if (parseDateRangeFromText(line.text)) hasDates = true;
    if (isTenureOrDateOnlyHeaderLine(line.text)) hasDates = true;
    if (lineImpliesEmployerPresence(line.text)) hasCompany = true;
    if (detectDesignationFromLine(line.text).confidence >= 40) hasDesignation = true;
  }
  return { hasDesignation, hasCompany, hasDates };
}

const BOUNDARY_THRESHOLD = 48;
const BOUNDARY_THRESHOLD_AFTER_BLANK = 38;

function shouldStartNewFull(line: ExperienceLine, afterBlank: boolean, blockStart: number, lineIndex: number, scored: ExperienceLine[]): string | null {
  if (line.isBullet) return null;
  if (isExperienceSubsectionLabel(line.text)) {
    const state = blockIdentityState(scored, blockStart, lineIndex);
    if (/\broles?\s*(?:&|and)\s*responsibilit/i.test(line.text.trim()) && state.hasCompany && state.hasDesignation && lineIndex > blockStart) return 'roles-resp subsection';
    return null;
  }
  const state = blockIdentityState(scored, blockStart, lineIndex);
  const isDateLine = parseDateRangeFromText(line.text) !== null || isTenureOrDateOnlyHeaderLine(line.text);
  const isCompanyLine = detectCompanyFromLine(line.text).confidence >= 45;
  const isDesignationLine = detectDesignationFromLine(line.text).confidence >= 40;
  const isTenureLine = lineLooksLikeTenureExperience(line.text);
  if (isTenureOrDateOnlyHeaderLine(line.text)) return null;
  if (isTenureLine && lineIndex > blockStart) return 'tenure line';
  if (isDesignationLine && !isCompanyLine && !isTenureLine && state.hasDesignation && state.hasCompany && state.hasDates) return 'designation after complete';
  if (isCompanyLine && !isDesignationLine && !isDateLine && !isTenureLine && state.hasDesignation && state.hasCompany && state.hasDates) {
    const text = line.text.trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const institutional = looksLikeInstitutionalEmployer(text);
    const looksLikeBodyProse = !institutional && (looksLikeSentenceNotCompany(text) || /^(?:managed|led|oversaw|drove|executed|prepared|supported|coordinated|developed|implemented|worked|responsible|handled|maintained|processed|created|designed|built|delivered)\b/i.test(text) || (wordCount >= 10 && !looksLikeCompanyNameLine(text)));
    const strongEmployerHeader = institutional || (looksLikeCompanyNameLine(text) && wordCount >= 2 && wordCount <= 14 && detectCompanyFromLine(text).confidence >= 50 && !(wordCount <= 3 && /\.\s*$/.test(text) && !/(?:ltd|limited|llc|inc|corp|llp|pvt|gmbh|plc)\.?$/i.test(text)));
    if (!looksLikeBodyProse && strongEmployerHeader) return 'strong company header';
  }
  if (!isDesignationLine && !isDateLine && !isTenureLine && state.hasDesignation && state.hasCompany && state.hasDates && looksLikeInstitutionalEmployer(line.text) && !/^responsibilit/i.test(line.text.trim())) return 'institutional employer';
  const threshold = afterBlank ? BOUNDARY_THRESHOLD_AFTER_BLANK : BOUNDARY_THRESHOLD;
  if (line.boundaryScore < threshold) return null;
  if (isDateLine && (state.hasDesignation || state.hasCompany) && !state.hasDates) return null;
  if (isCompanyLine && state.hasDesignation && !state.hasCompany) return null;
  if (!isDateLine && !isCompanyLine && !isDesignationLine && detectLocationFromLine(line.text).confidence >= 40 && (state.hasDesignation || state.hasCompany) && !state.hasDates) return null;
  if (afterBlank && state.hasDates && (state.hasCompany || state.hasDesignation) && (isCompanyLine || isDesignationLine || isDateLine)) {
    if (line.boundaryScore >= threshold - 6) return 'blank+threshold';
  }
  if (state.hasDates && (state.hasCompany || state.hasDesignation) && !isDesignationLine && !isDateLine && !isTenureLine) {
    const text = line.text.trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words <= 3 && /\.\s*$/.test(text) && !looksLikeInstitutionalEmployer(text) && !looksLikeCompanyNameLine(text.replace(/\.\s*$/, ''))) return null;
    if (words <= 3 && /\.\s*$/.test(text) && !looksLikeInstitutionalEmployer(text)) return null;
  }
  if (state.hasDates && (state.hasCompany || state.hasDesignation) && looksLikeSentenceNotCompany(line.text.trim()) && !looksLikeInstitutionalEmployer(line.text.trim())) return null;
  return 'threshold fallback';
}

async function main() {
  const { text } = await parsePdfBuffer(Buffer.from(readFileSync('C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf')));
  const prep = prepareResumeTextForParsing(text);
  const sections = detectResumeSections(prep.text);
  const trimmed = truncateExperienceSectionAtEmbeddedHeadings(String(sections.experience || ''));
  const lines = buildExperienceLines(trimmed);
  const scored = scoreExperienceBoundaries(lines);

  let currentStart = 0, prevWasBlank = false;
  for (let i = 0; i < scored.length; i++) {
    const line = scored[i];
    if (line.isBlank) { prevWasBlank = true; continue; }
    const reason = shouldStartNewFull(line, prevWasBlank, currentStart, i, scored);
    if (reason && i > currentStart) {
      console.log('SPLIT', i, reason, JSON.stringify(line.text.slice(0, 55)), blockIdentityState(scored, currentStart, i));
      currentStart = i;
    }
    prevWasBlank = false;
  }
}

main().catch(console.error);
