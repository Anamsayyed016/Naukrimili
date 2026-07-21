/** Test if overlay before early-return strips startDate from coalesced session */
import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';
import { prepareBuilderSessionPayload } from '../lib/resume-builder/builder-hydration';
import { overlaySparseSectionsFromTextRecovery } from '../lib/resume-parser/prefer-recovered-wording';

async function main() {
  const pdfPath =
    process.argv[2] || 'C:/Users/admin/Downloads/Resume - SSY HRD IR.pdf';
  const { text: rawPdfText } = await parsePdfBuffer(
    Buffer.from(readFileSync(pdfPath))
  );
  const prep = prepareResumeTextForParsing(rawPdfText);
  const pipeline = runCustomParserPipeline(prep.text);
  const extracted = pipeline.validation.resume;
  const uploadRaw = mapExtractedToUploadProfile(extracted, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  uploadRaw.customParserUsed = true;
  uploadRaw.rawText = prep.text;
  const uploadNorm = normalizeUploadProfile(uploadRaw) as Record<string, unknown>;
  const { data: repaired } = validateAndRepairResumeExtraction({
    ...uploadNorm,
    rawText: prep.text,
    customParserUsed: true,
  });

  const serverBuilder = transformImportDataToBuilder({
    ...repaired,
    rawText: prep.text,
    customParserUsed: true,
  }) as Record<string, unknown>;

  const session = prepareBuilderSessionPayload({
    ...serverBuilder,
    _imported: true,
    rawText: prep.text,
    customParserUsed: true,
  }) as Record<string, unknown>;

  const before = (session.experience as Record<string, unknown>[]).map((e) => ({
    company: String(e.company).slice(0, 30),
    startDate: e.startDate,
    duration: e.duration,
    current: e.current,
  }));

  const overlaid = overlaySparseSectionsFromTextRecovery({
    ...session,
    rawText: prep.text,
  }) as Record<string, unknown>;

  const after = (overlaid.experience as Record<string, unknown>[]).map((e) => ({
    company: String(e.company).slice(0, 30),
    startDate: e.startDate,
    duration: e.duration,
    current: e.current,
  }));

  console.log('BEFORE overlay', JSON.stringify(before.slice(0, 4), null, 2));
  console.log('AFTER overlay', JSON.stringify(after.slice(0, 4), null, 2));
  console.log('skills before', (session.skills as string[]).slice(0, 8));
  console.log('skills after', (overlaid.skills as string[]).slice(0, 8));
}

main().catch(console.error);
