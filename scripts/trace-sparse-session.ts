/**
 * Simulate sparse session: summary/skills present but experience empty.
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
  backfillImportedExperienceForDisplay,
} from '../lib/resume-builder/import-transformer';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { readFileSync as readFs } from 'node:fs';

const pdf = resolve(process.env.USERPROFILE || '', 'Downloads', 'Naukri_ASHISHGUPTA[21y_0m].pdf');
const bytes = readFileSync(pdf);
const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(bytes));
const rawText = prepareResumeTextForParsing(rawPdfText).text;
const pipeline = runCustomParserPipeline(rawText);
const uploadRaw = mapExtractedToUploadProfile(pipeline.validation.resume, {
  aiProvider: 'custom-parser',
}) as Record<string, unknown>;
const parsed = { ...normalizeUploadProfile(uploadRaw), customParserUsed: true, rawText, _imported: true };
const full = coalesceBuilderImportPayload(parsed);

// Simulate broken session: other sections kept, experience wiped
const sparseSession = {
  ...full,
  experience: [],
  Experience: [],
  'Work Experience': [],
  rawText,
  _imported: true,
  customParserUsed: true,
};

const recovered = backfillImportedExperienceForDisplay(sparseSession);
const exp = Array.isArray(recovered.experience) ? recovered.experience.length : 0;
const html = injectResumeData(
  readFs(resolve('public/templates/luxury-corporate/index.html'), 'utf8'),
  recovered,
  { galleryPreview: true, templateId: 'luxury-corporate' }
);
const hasSection = html.includes('experience-item');
console.log('sparse session exp after backfill:', exp);
console.log('template has experience-item:', hasSection);
process.exitCode = exp >= 2 && hasSection ? 0 : 1;
