/**
 * Extract PDF text for audit. Usage: npx tsx scripts/extract-pdf-text.ts path.pdf [outDir]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, basename } from 'path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { classifyResumeTextSignals } from '../lib/resume-parser/text-recovery';
import { isPdfTextTooThinForParsing } from '../lib/pdf-parse-safe';

async function main() {
  const pdfPath = resolve(process.argv[2] || '');
  const outDir = resolve(process.argv[3] || '.audit-hrishi');
  mkdirSync(outDir, { recursive: true });
  const buf = readFileSync(pdfPath);
  const parsed = await parsePdfBuffer(buf);
  const prep = prepareResumeTextForParsing(String(parsed.text || ''));
  const words = (parsed.text || '').match(/[a-zA-Z]{3,}/g) || [];
  const report = {
    pdf: pdfPath,
    rawChars: String(parsed.text || '').length,
    preparedChars: prep.text.length,
    pages: parsed.numpages,
    recoveredFromStreams: !!parsed.recoveredFromStreams,
    wordCount: words.length,
    thin: isPdfTextTooThinForParsing(String(parsed.text || '')),
    signals: classifyResumeTextSignals(String(parsed.text || '')),
    documentType: (prep as any).profile?.primaryType ?? null,
    preview: String(parsed.text || '').slice(0, 800),
  };
  writeFileSync(resolve(outDir, '00-extraction-report.json'), JSON.stringify(report, null, 2));
  writeFileSync(resolve(outDir, '01-raw.txt'), String(parsed.text || ''), 'utf8');
  writeFileSync(resolve(outDir, '02-prepared.txt'), prep.text, 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
