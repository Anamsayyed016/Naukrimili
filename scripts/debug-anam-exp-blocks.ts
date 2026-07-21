import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { scoreExperienceBoundaries, partitionExperienceBlocks } from '../lib/resume-parser/custom/experience-extraction/boundaries';
import { buildExperienceLines } from '../lib/resume-parser/custom/experience-extraction/lines';
import { buildExperienceFromBlock } from '../lib/resume-parser/custom/experience-extraction/fields';
import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { parseDateRangeFromText } from '../lib/resume-parser/custom/experience-extraction/dates';

async function main() {
  const pdfPath =
    process.argv[2] || 'C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf';
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(readFileSync(pdfPath)));
  const prep = prepareResumeTextForParsing(rawPdfText);
  const sections = detectResumeSections(prep.text);
  const expText = String(sections.experience || '');
  const lines = buildExperienceLines(expText);
  const scored = scoreExperienceBoundaries(lines);
  const blocks = partitionExperienceBlocks(scored);

  console.log('Blocks:', blocks.length);
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    console.log(`\n--- Block ${i + 1} header ---`);
    console.log(b.headerText);
    console.log('Body lines:', b.bodyLines.length);
    const built = buildExperienceFromBlock(b);
    console.log('Built:', {
      company: built.company,
      designation: built.designation,
      startDate: built.startDate,
      endDate: built.endDate,
    });
  }

  console.log('\n--- Line analysis around Techroot ---');
  for (const line of scored) {
    if (/techroot|full stack developer|2020|projects/i.test(line.text)) {
      console.log({
        text: line.text,
        boundaryScore: line.boundaryScore,
        des: detectDesignationFromLine(line.text).confidence,
        date: parseDateRangeFromText(line.text)?.startDate,
      });
    }
  }
}

main().catch(console.error);
