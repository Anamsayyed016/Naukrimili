import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractExperiencesWithMeta } from '../lib/resume-parser/custom/experience-extraction/engine';

async function main() {
  const { text } = await parsePdfBuffer(
    Buffer.from(readFileSync('C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf'))
  );
  const prep = prepareResumeTextForParsing(text);
  const sections = detectResumeSections(prep.text);
  const r = extractExperiencesWithMeta(String(sections.experience || ''));
  console.log('blocks', r.blockCount, 'exp', r.experiences.length, 'rejected', r.rejectedCount);
  for (const e of r.experiences) {
    console.log({
      company: e.company,
      designation: e.designation,
      start: e.startDate,
      end: e.endDate,
      current: e.current,
    });
  }
}

main().catch(console.error);
