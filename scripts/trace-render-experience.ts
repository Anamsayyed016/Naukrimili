/**
 * Trace experience through builder → template render for Naukri PDFs.
 * Usage: npx tsx scripts/trace-render-experience.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { coalesceBuilderImportPayload } from '../lib/resume-builder/import-transformer';
import {
  coalesceFormDataForTemplateRender,
  filterMeaningfulExperiences,
} from '../lib/resume-builder/section-visibility';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { extractResumeFromText } from '../lib/resume-parser/text-recovery';
import { isCustomParserImport } from '../lib/resume-parser/custom-parser-import';

const PDFS = [
  'Naukri_ASHISHGUPTA[21y_0m].pdf',
  'Naukri_NehaSingh[13y_0m].pdf',
];

async function run(pdf: string) {
  const path = resolve(process.env.USERPROFILE || '', 'Downloads', pdf);
  const bytes = readFileSync(path);
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(bytes));
  const rawText = prepareResumeTextForParsing(rawPdfText).text;
  const pipeline = runCustomParserPipeline(rawText);
  const uploadRaw = mapExtractedToUploadProfile(pipeline.validation.resume, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  const profile = {
    ...normalizeUploadProfile(uploadRaw),
    customParserUsed: true,
    rawText,
    _imported: true,
  };
  const coalesced = coalesceBuilderImportPayload(profile) as Record<string, unknown>;
  const render = coalesceFormDataForTemplateRender(coalesced);
  const meaningful = filterMeaningfulExperiences(
    (render.experience || []) as Array<Record<string, unknown>>
  );
  const rec = extractResumeFromText(rawText);
  const html = injectResumeData('<div>{{EXPERIENCE}}</div>', coalesced, {
    galleryPreview: true,
    templateId: 'ivory-boardroom-executive',
  });
  const expHtml = html.replace(/<\/?div>/g, '').trim();

  console.log('\n===', pdf, '===');
  console.log('customParser:', isCustomParserImport(coalesced));
  console.log('parser exp:', (uploadRaw.experience as unknown[])?.length);
  console.log('recovered exp:', (rec.experience || []).length);
  console.log('builder exp:', (coalesced.experience as unknown[])?.length);
  console.log('render exp:', (render.experience as unknown[])?.length);
  console.log('meaningful:', meaningful.length);
  for (const e of meaningful.slice(0, 6)) {
    console.log(' -', e.title || e.position, '@', e.company);
  }
  console.log('expHtml len:', expHtml.length);
  console.log('expHtml preview:', expHtml.slice(0, 240));
}

async function main() {
  for (const pdf of PDFS) {
    await run(pdf);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
