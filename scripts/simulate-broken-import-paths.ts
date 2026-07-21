/** Test broken paths: missing customParserUsed, missing _builderCoalesced, overlay before early return */
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
  normalizeImportedFormForEditor,
} from '../lib/resume-builder/builder-hydration';

function snap(label: string, data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  console.log(`\n=== ${label} ===`);
  console.log({
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: data.fullName,
    customParserUsed: data.customParserUsed,
    _builderCoalesced: data._builderCoalesced,
    skillsSample: Array.isArray(data.skills) ? (data.skills as string[]).slice(0, 8) : [],
    exp0: exps[0]
      ? {
          company: (exps[0] as Record<string, unknown>).company,
          startDate: (exps[0] as Record<string, unknown>).startDate,
          duration: (exps[0] as Record<string, unknown>).duration,
        }
      : null,
  });
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

  // Scenario A: re-coalesce without _builderCoalesced (stripped flag)
  const noCoalesceFlag = { ...session, _builderCoalesced: undefined };
  snap(
    'A: re-coalesce without _builderCoalesced',
    normalizeImportedFormForEditor(coalesceBuilderImportPayload(noCoalesceFlag))
  );

  // Scenario B: missing customParserUsed
  const noCustomFlag = {
    ...session,
    customParserUsed: undefined,
    selectedParser: undefined,
    _aiProvider: undefined,
  };
  snap(
    'B: re-coalesce without customParserUsed',
    normalizeImportedFormForEditor(coalesceBuilderImportPayload(noCustomFlag))
  );

  // Scenario C: both missing
  const broken = {
    ...session,
    _builderCoalesced: undefined,
    customParserUsed: undefined,
    firstName: '',
    lastName: '',
    fullName: '',
  };
  snap(
    'C: broken session (no flags, no name)',
    normalizeImportedFormForEditor(coalesceBuilderImportPayload(broken))
  );

  // Scenario D: flat API without nested builderFormData, no flags
  snap(
    'D: flat repaired profile first coalesce',
    normalizeImportedFormForEditor(
      coalesceBuilderImportPayload({
        ...(repaired as Record<string, unknown>),
        rawText: prep.text,
        _imported: true,
      })
    )
  );
}

main().catch(console.error);
