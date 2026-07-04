import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';

const pdf = readFileSync('C:/Users/anams/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf');
const { text } = await parsePdfBuffer(Buffer.from(pdf));
const { text: prep } = prepareResumeTextForParsing(text);
const start = prep.indexOf('WORK EXPERIENCE');
const end = prep.indexOf('PROJECTS');
const block = prep.slice(start, end);
console.log('BLOCK LINES:');
block.split('\n').forEach((l, i) => console.log(i, JSON.stringify(l)));
