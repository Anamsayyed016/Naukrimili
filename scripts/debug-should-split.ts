import { readFileSync } from 'fs';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { buildExperienceLines } from '../lib/resume-parser/custom/experience-extraction/lines';
import { scoreExperienceBoundaries } from '../lib/resume-parser/custom/experience-extraction/boundaries';
import { detectCompanyFromLine, looksLikeSentenceNotCompany, looksLikeInstitutionalEmployer } from '../lib/resume-parser/custom/experience-extraction/company';
import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { parseDateRangeFromText, isTenureOrDateOnlyHeaderLine } from '../lib/resume-parser/custom/experience-extraction/dates';
import { lineLooksLikeTenureExperience } from '../lib/resume-parser/custom/experience-extraction/tenure';
import { lineImpliesEmployerPresence } from '../lib/resume-parser/custom/experience-extraction/company';

const text = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const sections = detectResumeSections(text) as any;
const lines = buildExperienceLines(sections.experience);
const scored = scoreExperienceBoundaries(lines);

function blockIdentityState(start: number, end: number) {
  let hasDesignation = false;
  let hasCompany = false;
  let hasDates = false;
  for (let i = start; i < end; i++) {
    const line = scored[i];
    if (line.isBlank || line.isBullet) continue;
    if (parseDateRangeFromText(line.text)) hasDates = true;
    if (isTenureOrDateOnlyHeaderLine(line.text)) hasDates = true;
    if (lineImpliesEmployerPresence(line.text)) hasCompany = true;
    if (detectDesignationFromLine(line.text).confidence >= 40) hasDesignation = true;
  }
  return { hasDesignation, hasCompany, hasDates };
}

const i = 7;
const line = scored[i];
const state = blockIdentityState(0, i);
const isDesignationLine = detectDesignationFromLine(line.text).confidence >= 40;
const isCompanyLine = detectCompanyFromLine(line.text).confidence >= 45;
const isDateLine = parseDateRangeFromText(line.text) !== null || isTenureOrDateOnlyHeaderLine(line.text);
const isTenureLine = lineLooksLikeTenureExperience(line.text);
console.log({
  text: line.text,
  isBlank: line.isBlank,
  isBullet: line.isBullet,
  state,
  isDesignationLine,
  isCompanyLine,
  isDateLine,
  isTenureLine,
  path1: isDesignationLine && !isCompanyLine && !isTenureLine && state.hasDesignation && state.hasCompany && state.hasDates,
  path2: isDesignationLine && isDateLine && !isCompanyLine && !isTenureLine && state.hasCompany && i > 0,
  companyDetect: detectCompanyFromLine('Raj Security Force: A Security and allied service Provider company (ISO 9001:2015)'),
  rajLeft: detectCompanyFromLine('Raj Security Force'),
  rajScoreNeed: '>=42 for colon path',
});
