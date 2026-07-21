import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { detectCompanyFromLine, looksLikeSentenceNotCompany } from '../lib/resume-parser/custom/experience-extraction/company';
import { scoreExperienceBoundaries } from '../lib/resume-parser/custom/experience-extraction/boundaries';
import { buildExperienceLines, truncateExperienceSectionAtEmbeddedHeadings } from '../lib/resume-parser/custom/experience-extraction/lines';
import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';

async function main() {
  const line = 'Optimized SQL queries and backend systems improving performance by 40%';
  console.log('des', detectDesignationFromLine(line));
  console.log('company', detectCompanyFromLine(line));
  console.log('sentence', looksLikeSentenceNotCompany(line));

  const { text } = await parsePdfBuffer(
    Buffer.from(readFileSync('C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf'))
  );
  const prep = prepareResumeTextForParsing(text);
  const sections = detectResumeSections(prep.text);
  const trimmed = truncateExperienceSectionAtEmbeddedHeadings(String(sections.experience || ''));
  const lines = buildExperienceLines(trimmed);
  const scored = scoreExperienceBoundaries(lines);
  for (const l of scored) {
    if (/optimized|full stack developer|2020|techroot/i.test(l.text)) {
      console.log(l.text.slice(0, 60), 'boundaryScore', l.boundaryScore);
    }
  }
}

main().catch(console.error);
