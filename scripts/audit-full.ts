/** READ-ONLY audit: full pipeline dump to JSON. Usage: npx tsx scripts/audit-full.ts <pdf> <outdir> */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import {
  transformImportDataToBuilder,
  coalesceBuilderImportPayload,
} from '../lib/resume-builder/import-transformer';

const pdfPath = resolve(process.argv[2]);
const outDir = resolve(process.argv[3] || '.audit2');
mkdirSync(outDir, { recursive: true });

const bytes = readFileSync(pdfPath);
const { text: raw } = await parsePdfBuffer(Buffer.from(bytes));
const prep = prepareResumeTextForParsing(raw);
const rawText = prep.text;

const pipeline = runCustomParserPipeline(rawText);
const resume = pipeline.validation.resume;
writeFileSync(join(outDir, 'parser-output.json'), JSON.stringify(resume, null, 2), 'utf8');

const upload = normalizeUploadProfile(
  mapExtractedToUploadProfile(resume, { aiProvider: 'custom-parser' }) as Record<string, unknown>
);
writeFileSync(join(outDir, 'upload-profile.json'), JSON.stringify(upload, null, 2), 'utf8');

const builder = transformImportDataToBuilder({
  ...upload,
  rawText,
  _imported: true,
  customParserUsed: true,
}) as Record<string, unknown>;
const coalesced = coalesceBuilderImportPayload({
  ...upload,
  rawText,
  _imported: true,
  customParserUsed: true,
  builderFormData: builder,
}) as Record<string, unknown>;
writeFileSync(join(outDir, 'builder-formdata.json'), JSON.stringify(coalesced, null, 2), 'utf8');
console.log('wrote', outDir);
