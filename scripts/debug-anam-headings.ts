import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';

async function main() {
  const pdfPath =
    process.argv[2] || 'C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf';
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(readFileSync(pdfPath)));
  const prep = prepareResumeTextForParsing(rawPdfText);
  const sections = detectResumeSections(prep.text);
  console.log('Detected section blocks:');
  for (const s of sections.sections || []) {
    console.log({
      type: s.type,
      heading: s.rawHeading,
      conf: s.confidence,
      contentLen: s.content?.length,
      start: s.startLine,
    });
  }
}

main().catch(console.error);
