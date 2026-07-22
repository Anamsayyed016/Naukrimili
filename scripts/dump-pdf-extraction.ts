import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import {
  recoverTextFromPdfContentStreams,
  isUsableRecoveredPdfText,
} from '../lib/pdf-stream-text-recovery';
import { classifyResumeTextSignals } from '../lib/resume-parser/text-recovery';

async function main() {
  const buf = readFileSync('C:/Users/admin/Downloads/Trilokinath_Upadhyaya_Resume.pdf');
  const parsed = await parsePdfBuffer(buf);
  const stream = recoverTextFromPdfContentStreams(buf);
  const text = parsed.text || '';
  const words = text.match(/[a-zA-Z]{3,}/g) || [];
  const density = words.length / Math.max(text.length, 1);
  const signals = classifyResumeTextSignals(text);

  const startsWithPDFHeader = text.startsWith('%PDF');
  const hasPDFStructureOnly = text.includes('endobj') && text.includes('/Type/Page');
  const hasVeryLowDensity = density < 0.001;
  const hasAlmostNoWords = words.length < 15;
  const isPDFBinary =
    startsWithPDFHeader && hasPDFStructureOnly && hasVeryLowDensity && hasAlmostNoWords;
  const shouldAttemptOcr =
    isPDFBinary ||
    (signals.scannedLikely && (hasVeryLowDensity || words.length < 40)) ||
    (startsWithPDFHeader &&
      hasPDFStructureOnly &&
      words.length < 50 &&
      density < 0.0025);

  const report = {
    parsedChars: text.length,
    parsedPages: parsed.numpages,
    recoveredFromStreamsFlag: !!parsed.recoveredFromStreams,
    streamChars: stream.length,
    streamUsable: isUsableRecoveredPdfText(stream),
    wordCount: words.length,
    textDensity: Number(density.toFixed(4)),
    signals,
    ocrGate: {
      startsWithPDFHeader,
      hasPDFStructureOnly,
      hasVeryLowDensity,
      hasAlmostNoWords,
      isPDFBinary,
      shouldAttemptOcr,
    },
    preview: text.slice(0, 600),
    streamPreview: stream.slice(0, 1200),
  };

  mkdirSync('.audit-trilok', { recursive: true });
  writeFileSync('.audit-trilok/01-raw.txt', text, 'utf8');
  writeFileSync('.audit-trilok/01b-stream.txt', stream, 'utf8');
  writeFileSync('.audit-trilok/00-extraction-report.json', JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
