/**
 * Simulates gallery → template select → editor hydration path.
 * Usage: npx tsx scripts/simulate-gallery-editor-hydration.ts [pdf-path]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import {
  coalesceBuilderImportPayload,
  hasImportableContent,
} from '../lib/resume-builder/import-transformer';
import { builderFormChecksum } from '../lib/resume-builder/builder-hydration';

const DEFAULT_PDF = resolve(
  process.env.USERPROFILE || '',
  'Downloads',
  'Anam_Sayyed_Full_Stack_Python_Resume.pdf'
);

function simulateWriteImportSession(payload: Record<string, unknown>) {
  const importId = `import-${Date.now()}`;
  const importedAt = Date.now();
  return {
    ...payload,
    _imported: true,
    _importedAt: importedAt,
    _importSessionId: importId,
  };
}

async function main() {
  const pdfPath = resolve(process.argv[2] || DEFAULT_PDF);
  const bytes = readFileSync(pdfPath);
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(bytes));
  const prepared = prepareResumeTextForParsing(rawPdfText);
  const pipeline = runCustomParserPipeline(prepared.text);
  const extracted = pipeline.validation.resume as Record<string, unknown>;
  const uploadRaw = mapExtractedToUploadProfile(extracted, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  uploadRaw.customParserUsed = true;
  uploadRaw.rawText = prepared.text;

  const uploadNorm = normalizeUploadProfile(uploadRaw);
  const profile = {
    ...uploadNorm,
    customParserUsed: true,
    rawText: prepared.text,
    _imported: true,
  };

  const builder = coalesceBuilderImportPayload(profile);
  const uploadSession = simulateWriteImportSession({
    ...builder,
    rawText: prepared.text,
  });

  console.log('1) Upload session stored');
  console.log('   importable:', hasImportableContent(uploadSession));
  console.log('   firstName:', uploadSession.firstName, 'lastName:', uploadSession.lastName);
  console.log('   checksum:', builderFormChecksum(uploadSession));

  const galleryCoalesced = coalesceBuilderImportPayload(uploadSession);
  console.log('\n2) Gallery previewFormData (coalesce from session)');
  console.log('   importable:', hasImportableContent(galleryCoalesced));
  console.log('   firstName:', galleryCoalesced.firstName, 'lastName:', galleryCoalesced.lastName);
  console.log('   exp:', (galleryCoalesced.experience as unknown[])?.length);

  const afterTemplateClick = simulateWriteImportSession(galleryCoalesced);
  console.log('\n3) After template click writeImportSession(previewFormData)');
  console.log('   has rawText:', Boolean(afterTemplateClick.rawText));
  console.log('   importable:', hasImportableContent(afterTemplateClick));

  const editorCoalesced = coalesceBuilderImportPayload(afterTemplateClick);
  console.log('\n4) Editor coalesceBuilderImportPayload(pendingImport)');
  console.log('   importable:', hasImportableContent(editorCoalesced));
  console.log('   firstName:', editorCoalesced.firstName, 'lastName:', editorCoalesced.lastName);
  console.log('   email:', editorCoalesced.email);
  console.log('   exp:', (editorCoalesced.experience as unknown[])?.length);
  console.log('   skills:', (editorCoalesced.skills as unknown[])?.length);
  console.log('   checksum:', builderFormChecksum(editorCoalesced));

  const withoutRawText = { ...galleryCoalesced };
  delete withoutRawText.rawText;
  const sessionNoRaw = simulateWriteImportSession(withoutRawText);
  const editorNoRaw = coalesceBuilderImportPayload(sessionNoRaw);
  console.log('\n5) Editor path WITHOUT rawText in session (regression check)');
  console.log('   importable:', hasImportableContent(editorNoRaw));
  console.log('   firstName:', editorNoRaw.firstName);
  console.log('   exp:', (editorNoRaw.experience as unknown[])?.length);

  if (!hasImportableContent(editorCoalesced)) {
    console.error('\n❌ Editor would show EMPTY form — hasImportableContent false');
    process.exitCode = 1;
  } else {
    console.log('\n✅ Editor hydration simulation OK');
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
