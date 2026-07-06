import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import {
  recoverSummaryFromRawText,
  isInvalidImportSummary,
  sanitizeImportSummary,
} from '../lib/resume-parser/import-sanitize';

const path = resolve(process.env.USERPROFILE || '', 'Downloads', 'PROFILE OF CS.pdf');
const { text } = await parsePdfBuffer(Buffer.from(readFileSync(path)));
const { text: raw } = prepareResumeTextForParsing(text);
const recovered = recoverSummaryFromRawText(raw);
console.log('recovered len', recovered.length);
console.log('preview', recovered.slice(0, 250));
const idx = raw.toLowerCase().indexOf('in my current role');
if (idx >= 0) {
  const chunk = raw.slice(idx, idx + 400).replace(/\n/g, ' ');
  console.log('chunk invalid?', isInvalidImportSummary(chunk), chunk.slice(0, 200));
}
console.log('sanitize', sanitizeImportSummary('', raw).slice(0, 200));
