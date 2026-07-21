/**
 * Simulate upload → session → editor resolve path (browser parity).
 */
import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import {
  coalesceBuilderImportPayload,
  transformImportDataToBuilder,
} from '../lib/resume-builder/import-transformer';
import {
  prepareBuilderSessionPayload,
  ensureBuilderContactFields,
  normalizeImportedFormForEditor,
} from '../lib/resume-builder/builder-hydration';

function snap(label: string, data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  console.log(`\n=== ${label} ===`);
  console.log('identity:', {
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: data.fullName,
    email: data.email,
  });
  console.log('flags:', {
    _imported: data._imported,
    _builderCoalesced: data._builderCoalesced,
    customParserUsed: data.customParserUsed,
  });
  console.log('skills count:', Array.isArray(data.skills) ? data.skills.length : 0);
  console.log(
    'skills sample:',
    Array.isArray(data.skills) ? (data.skills as string[]).slice(0, 6) : []
  );
  console.log('experience dates (first 3):');
  for (const raw of exps.slice(0, 3)) {
    const e = raw as Record<string, unknown>;
    console.log(
      `  ${String(e.company || '').slice(0, 35)} | start=${e.startDate} end=${e.endDate} current=${e.current} duration=${e.duration}`
    );
  }
}

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

  // Simulate API ultimate-upload: profile + nested builderFormData
  const serverBuilder = transformImportDataToBuilder({
    ...repaired,
    rawText: prep.text,
    customParserUsed: true,
  }) as Record<string, unknown>;
  const apiResponse = {
    ...repaired,
    rawText: prep.text,
    customParserUsed: true,
    builderFormData: serverBuilder,
  };

  snap('API profile (repaired)', repaired as Record<string, unknown>);
  snap('API server builderFormData', serverBuilder);

  // Upload page: coalesceBuilderImportPayload(parsed)
  const builderReady = coalesceBuilderImportPayload(
    apiResponse as Record<string, unknown>
  ) as Record<string, unknown>;
  snap('Upload coalesceBuilderImportPayload', builderReady);

  // writeImportSession → prepareBuilderSessionPayload
  const sessionPayload = prepareBuilderSessionPayload({
    ...builderReady,
    _imported: true,
    rawText: prep.text,
    customParserUsed: true,
  }) as Record<string, unknown>;
  snap('Session after prepareBuilderSessionPayload', sessionPayload);

  // resolveEditorFormFromImport: coalesce again + normalizeImportedFormForEditor
  const coalescedAgain = coalesceBuilderImportPayload(sessionPayload);
  const editorForm = normalizeImportedFormForEditor(coalescedAgain);
  snap('Editor resolveEditorFormFromImport', editorForm);

  // Second resolve (simulates templates page re-write)
  const coalescedTwice = coalesceBuilderImportPayload(sessionPayload);
  const editorTwice = normalizeImportedFormForEditor(coalescedTwice);
  snap('Editor second coalesce (templates click)', editorTwice);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
