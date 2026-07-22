import { readFileSync } from 'fs';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { buildExperienceLines } from '../lib/resume-parser/custom/experience-extraction/lines';
import { scoreExperienceBoundaries } from '../lib/resume-parser/custom/experience-extraction/boundaries';
import { detectCompanyFromLine, looksLikeSentenceNotCompany } from '../lib/resume-parser/custom/experience-extraction/company';
import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { parseDateRangeFromText, isTenureOrDateOnlyHeaderLine } from '../lib/resume-parser/custom/experience-extraction/dates';
import { lineLooksLikeTenureExperience, parseTenureExperienceLine } from '../lib/resume-parser/custom/experience-extraction/tenure';
import { lineImpliesEmployerPresence } from '../lib/resume-parser/custom/experience-extraction/company';

const text = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const sections = detectResumeSections(text) as any;
const lines = buildExperienceLines(sections.experience);
const scored = scoreExperienceBoundaries(lines);

function state(start: number, end: number) {
  let hasDesignation = false;
  let hasCompany = false;
  let hasDates = false;
  for (let i = start; i < end; i++) {
    const line = scored[i];
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

for (const i of [1, 6, 7, 13, 16, 28, 29]) {
  const t = scored[i].text;
  const st = state(0, i);
  console.log(
    JSON.stringify({
      i,
      t: t.slice(0, 70),
      st,
      des: detectDesignationFromLine(t).confidence,
      co: detectCompanyFromLine(t).confidence,
      date: !!parseDateRangeFromText(t),
      tenure: !!lineLooksLikeTenureExperience(t),
      tenureParse: parseTenureExperienceLine(t),
      dateOnly: isTenureOrDateOnlyHeaderLine(t),
      prose: looksLikeSentenceNotCompany(t),
      imply: lineImpliesEmployerPresence(t),
    })
  );
}
