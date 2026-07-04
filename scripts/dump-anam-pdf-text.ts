import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';

const pdf = readFileSync(
  process.argv[2] || 'C:/Users/anams/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf'
);
const { text } = await parsePdfBuffer(Buffer.from(pdf));
const { text: prep } = prepareResumeTextForParsing(text);
console.log('=== FULL TEXT ===\n' + prep);
const r = runCustomParserPipeline(prep);
console.log('\n=== EXPERIENCE ===\n' + JSON.stringify(r.validation.resume.experience, null, 2));
console.log('\n=== EDUCATION ===\n' + JSON.stringify(r.validation.resume.education, null, 2));
