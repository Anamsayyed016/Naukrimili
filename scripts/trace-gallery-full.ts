/**
 * Full gallery simulation: upload → session → resolve → template inject per template.
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
import { prepareBuilderSessionPayload } from '../lib/resume-builder/builder-hydration';
import { resolveEditorFormFromImport } from '../lib/resume-builder/builder-hydration';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { readFileSync as readFs } from 'node:fs';

// Node shim for sessionStorage path
const sessionStore = new Map<string, string>();
(globalThis as unknown as { sessionStorage?: Storage }).sessionStorage = {
  getItem: (k: string) => sessionStore.get(k) ?? null,
  setItem: (k: string, v: string) => { sessionStore.set(k, v); },
  removeItem: (k: string) => { sessionStore.delete(k); },
  clear: () => { sessionStore.clear(); },
  key: () => null,
  length: 0,
};

async function simulatePdf(pdfName: string) {
  const pdfPath = resolve(process.env.USERPROFILE || '', 'Downloads', pdfName);
  const bytes = readFileSync(pdfPath);
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(bytes));
  const rawText = prepareResumeTextForParsing(rawPdfText).text;
  const pipeline = runCustomParserPipeline(rawText);
  const uploadRaw = mapExtractedToUploadProfile(pipeline.validation.resume, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  const parsed = {
    ...normalizeUploadProfile(uploadRaw),
    customParserUsed: true,
    rawText,
    _imported: true,
  };

  const builderReady = coalesceBuilderImportPayload(parsed);
  const dataToStore = prepareBuilderSessionPayload({
    ...builderReady,
    _imported: true,
    rawText,
    customParserUsed: true,
  });

  sessionStore.set('resume-import-data', JSON.stringify(dataToStore));

  // Simulate quota strip
  const { rawText: _rt, ...noRaw } = dataToStore;
  const sessionNoRaw = prepareBuilderSessionPayload({ ...noRaw, _imported: true });

  for (const label of ['with-rawText', 'no-rawText'] as const) {
    const session = label === 'with-rawText' ? dataToStore : sessionNoRaw;
    sessionStore.set('resume-import-data', JSON.stringify(session));

    const resolved = coalesceBuilderImportPayload(session);
    const exp = Array.isArray(resolved.experience) ? resolved.experience.length : 0;

    for (const tid of ['luxury-corporate', 'elegant-ivory', 'luxe-executive']) {
      const htmlPath = resolve('public/templates', tid, 'index.html');
      const html = readFs(htmlPath, 'utf8');
      const out = injectResumeData(html, resolved, {
        galleryPreview: true,
        galleryTemplateId: tid,
        templateId: tid,
      });
      const hasExpSection = /Work Experience|Experience/i.test(out) &&
        out.includes('experience-item');
      const hasIfBlock = out.includes('{{#if EXPERIENCE}}');
      console.log(
        `${pdfName} | ${label} | ${tid} | exp:${exp} | section:${hasExpSection} | unprocessed-if:${hasIfBlock}`
      );
    }
  }
}

async function main() {
  for (const pdf of ['Naukri_NehaSingh[13y_0m].pdf', 'Naukri_ASHISHGUPTA[21y_0m].pdf']) {
    await simulatePdf(pdf);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
