import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { collectNameCandidatesFromText } from '../lib/resume-parser/text-recovery';
import {
  parseIntelligentNameFromEmail,
  recoverSummaryFromRawText,
  isInvalidImportSummary,
  enrichPartialNameFromEmail,
} from '../lib/resume-parser/import-sanitize';

const pdfs = ['PROFILE OF CS.pdf', 'Naukrimili_SurbhiGour[10y_0m].pdf'];

for (const f of pdfs) {
  const path = resolve(process.env.USERPROFILE || '', 'Downloads', f);
  const { text } = await parsePdfBuffer(Buffer.from(readFileSync(path)));
  const { text: raw } = prepareResumeTextForParsing(text);
  console.log('\n===', f, '===');
  console.log('lines 0-8:');
  raw.split('\n').slice(0, 8).forEach((l, i) => console.log(i, JSON.stringify(l)));
  const names = collectNameCandidatesFromText(raw);
  console.log('name candidates:', names.slice(0, 8));
  const summary = recoverSummaryFromRawText(raw);
  console.log('summary recovery:', summary.slice(0, 200) || '(empty)');
  const lines2 = raw.split('\n');
  for (let i = 0; i < lines2.length; i++) {
    if (/professional summary/i.test(lines2[i])) {
      const para = lines2.slice(i + 1, i + 4).join(' ');
      console.log('  para invalid?', isInvalidImportSummary(para));
    }
  }
  console.log(
    'enrich Mujahid:',
    enrichPartialNameFromEmail('Mujahid Ali', 'cssyedmujahidali12@gmail.com')
  );
}

console.log('\nemail CS:', parseIntelligentNameFromEmail('cssyedmujahidali12@gmail.com'));
console.log('email SG:', parseIntelligentNameFromEmail('goursurbhi19@gmail.com'));
