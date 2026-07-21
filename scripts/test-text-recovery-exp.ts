import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { recoverStructuredExperienceFromRawText } from '../lib/resume-parser/import-sanitize';
import { extractResumeFromText } from '../lib/resume-parser/text-recovery';

async function main() {
  const pdfPath =
    process.argv[2] || 'C:/Users/admin/Downloads/Resume - SSY HRD IR.pdf';
  const { text: rawPdfText } = await parsePdfBuffer(
    Buffer.from(readFileSync(pdfPath))
  );
  const prep = prepareResumeTextForParsing(rawPdfText);
  const structured = recoverStructuredExperienceFromRawText(prep.text);
  const extracted = extractResumeFromText(prep.text);
  console.log('structured (first 4):');
  for (const e of structured.slice(0, 4)) {
    console.log({
      company: String(e.company || '').slice(0, 40),
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      duration: e.duration,
    });
  }
  console.log('\nextractResumeFromText exp (first 4):');
  for (const e of (extracted.experience || []).slice(0, 4)) {
    console.log({
      company: String((e as any).company || '').slice(0, 40),
      startDate: (e as any).startDate,
      endDate: (e as any).endDate,
      current: (e as any).current,
    });
  }
}

main().catch(console.error);
