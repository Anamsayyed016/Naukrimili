import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';

const pdfs = ['PROFILE OF CS.pdf', 'Naukrimili_SurbhiGour[10y_0m].pdf'];

for (const f of pdfs) {
  const path = resolve(process.env.USERPROFILE || '', 'Downloads', f);
  const { text } = await parsePdfBuffer(Buffer.from(readFileSync(path)));
  const { text: raw } = prepareResumeTextForParsing(text);
  console.log('\n===', f, 'len', raw.length, '===');
  const lower = raw.toLowerCase();
  for (const needle of ['dear', 'i am', 'syed', 'mujahid', 'professional summary', 'objective', 'profile']) {
    const idx = lower.indexOf(needle);
    if (idx >= 0) console.log(`  "${needle}" at ${idx}:`, JSON.stringify(raw.slice(idx, idx + 120)));
  }
  const lines = raw.split('\n');
  console.log('  total lines:', lines.length);
  for (let i = 0; i < lines.length; i++) {
    if (/syed|mujahid|dear|professional summary|i am writing/i.test(lines[i])) {
      console.log(`  L${i}:`, JSON.stringify(lines[i]));
      if (lines[i + 1]) console.log(`  L${i + 1}:`, JSON.stringify(lines[i + 1]));
    }
  }
}
