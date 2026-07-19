/** READ-ONLY audit: dump prepared text + detected section list. Usage: npx tsx scripts/audit-dump.ts <pdf> <outdir> */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection/index';

const pdfPath = resolve(process.argv[2]);
const outDir = resolve(process.argv[3] || '.audit2');
mkdirSync(outDir, { recursive: true });

const bytes = readFileSync(pdfPath);
const { text: raw } = await parsePdfBuffer(Buffer.from(bytes));
const prep = prepareResumeTextForParsing(raw);
writeFileSync(join(outDir, 'raw.txt'), raw, 'utf8');
writeFileSync(join(outDir, 'prepared.txt'), prep.text, 'utf8');

const r = detectResumeSections(prep.text) as unknown as {
  sections: Array<{ type: string; confidence: number; lineStart: number; lineEnd: number; rawHeading: string; content?: string }>;
} & Record<string, unknown>;

const lines: string[] = [];
for (const s of r.sections) {
  lines.push(
    `${s.type.padEnd(15)} conf ${String(s.confidence).padEnd(4)} lines ${`${s.lineStart}-${s.lineEnd}`.padEnd(10)} heading ${JSON.stringify(s.rawHeading.slice(0, 60))} chars ${(s.content || '').length}`
  );
}
writeFileSync(join(outDir, 'section-list.txt'), lines.join('\n'), 'utf8');

const fields: string[] = [];
for (const key of ['preamble','summary','experience','education','skills','projects','certifications','languages','achievements','hobbies'] as const) {
  const v = r[key];
  fields.push(`\n===== ${key} (${typeof v === 'string' ? v.length : 0}) =====\n${typeof v === 'string' ? v : ''}`);
}
writeFileSync(join(outDir, 'fields.txt'), fields.join('\n'), 'utf8');
console.log('wrote', outDir);
