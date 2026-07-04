import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { extractResumeFromText } from '../lib/resume-parser/text-recovery';
import { countPlausibleExperienceCompanies } from '../lib/resume-parser/import-sanitize';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';

const pdf = readFileSync('C:/Users/anams/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf');
const { text } = await parsePdfBuffer(Buffer.from(pdf));
const { text: prep } = prepareResumeTextForParsing(text);
const recovered = extractResumeFromText(prep);
const pipeline = runCustomParserPipeline(prep);
const parserExp = pipeline.validation.resume.experience || [];

console.log('Parser plausible companies:', countPlausibleExperienceCompanies(parserExp as Record<string, unknown>[]));
console.log('\n=== TEXT RECOVERY EXPERIENCE ===');
console.log(JSON.stringify(recovered.experience, null, 2));
console.log('\n=== TEXT RECOVERY EDUCATION ===');
console.log(JSON.stringify(recovered.education, null, 2));
