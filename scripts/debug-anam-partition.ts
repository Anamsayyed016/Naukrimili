import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import {
  buildExperienceLines,
  truncateExperienceSectionAtEmbeddedHeadings,
} from '../lib/resume-parser/custom/experience-extraction/lines';
import {
  partitionExperienceBlocks,
  scoreExperienceBoundaries,
} from '../lib/resume-parser/custom/experience-extraction/boundaries';
import { buildExperienceFromBlock } from '../lib/resume-parser/custom/experience-extraction/fields';

async function main() {
  const { text } = await parsePdfBuffer(
    Buffer.from(readFileSync('C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf'))
  );
  const prep = prepareResumeTextForParsing(text);
  const sections = detectResumeSections(prep.text);
  const trimmed = truncateExperienceSectionAtEmbeddedHeadings(String(sections.experience || ''));
  const lines = buildExperienceLines(trimmed);
  const scored = scoreExperienceBoundaries(lines);

  console.log('=== LINES ===');
  scored.forEach((l, i) => {
    console.log(i, `[${l.boundaryScore}]`, l.text.slice(0, 70));
  });

  const blocks = partitionExperienceBlocks(scored);
  console.log('\n=== BLOCKS', blocks.length, '===');
  blocks.forEach((b, bi) => {
    const built = buildExperienceFromBlock(b);
    console.log(`\nBlock ${bi + 1} header:\n`, b.headerText);
    console.log('built:', {
      designation: built.designation,
      company: built.company,
      start: built.startDate,
      end: built.endDate,
    });
    console.log('body lines:', b.bodyLines.length);
  });
}

main().catch(console.error);
