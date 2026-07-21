import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import {
  buildExperienceLines,
  truncateExperienceSectionAtEmbeddedHeadings,
} from '../lib/resume-parser/custom/experience-extraction/lines';
import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { isTenureOrDateOnlyHeaderLine } from '../lib/resume-parser/custom/experience-extraction/dates';
import { looksLikeSentenceNotCompany } from '../lib/resume-parser/custom/experience-extraction/company';

async function main() {
  console.log('Full Stack Developer designation:', detectDesignationFromLine('Full Stack Developer'));
  console.log('Mar 2025 tenure header:', isTenureOrDateOnlyHeaderLine('Mar 2025 – Present'));

  const { text } = await parsePdfBuffer(
    Buffer.from(readFileSync('C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf'))
  );
  const prep = prepareResumeTextForParsing(text);
  const sections = detectResumeSections(prep.text);
  const trimmed = truncateExperienceSectionAtEmbeddedHeadings(String(sections.experience || ''));
  const lines = buildExperienceLines(trimmed);
  lines.forEach((l, i) => {
    console.log(i, { bullet: l.isBullet, text: l.text.slice(0, 55) });
  });
}

main().catch(console.error);
