import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  extractTextFromDocxBuffer,
  extractTextFromOoxmlXml,
  softSplitContactLabels,
} from '@/lib/docx-text-extraction';
import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '@/lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '@/lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '@/lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '@/lib/resume-parser/extraction-repair';
import {
  coalesceBuilderImportPayload,
  transformImportDataToBuilder,
} from '@/lib/resume-builder/import-transformer';
import { prepareGalleryPreviewFormData } from '@/lib/resume-builder/builder-hydration';

describe('docx header/footer text extraction', () => {
  it('extracts paragraph text from OOXML and soft-splits contact labels', () => {
    const xml = `
      <w:p><w:r><w:t>Alex</w:t></w:r><w:r><w:t> Rivera</w:t></w:r></w:p>
      <w:p><w:r><w:t>Email Id: alex.rivera@example.com                                                        Mobile +91 9876543210</w:t></w:r></w:p>
    `;
    const text = softSplitContactLabels(extractTextFromOoxmlXml(xml));
    expect(text).toMatch(/Alex Rivera/);
    expect(text).toMatch(/alex\.rivera@example\.com/i);
    expect(text).toMatch(/9876543210/);
    expect(text).toMatch(/Email Id:/i);
  });

  it('recovers header name and footer email/phone dropped by mammoth (Jyotsana fixture)', async () => {
    const fixture = resolve('.audit-jyo/Resume_Jyotsana_Jha_2026.docx');
    let buf: Buffer;
    try {
      buf = readFileSync(fixture);
    } catch {
      // Fixture optional in CI — skip rather than fail the suite.
      return;
    }

    const extracted = await extractTextFromDocxBuffer(buf);
    expect(extracted.headerText).toMatch(/Jyotsana\s+Jha/i);
    expect(extracted.footerText).toMatch(/jyotsana@gmail\.com/i);
    expect(extracted.footerText).toMatch(/8320087124/);
    expect(extracted.text).toMatch(/Jyotsana\s+Jha/i);
    expect(extracted.source).toMatch(/ooxml|mammoth\+ooxml/);

    // Full production identity path must surface name + contact in gallery form.
    const prep = prepareResumeTextForParsing(extracted.text);
    const pipeline = await runCustomParserPipeline(prep.text, {
      sourceFileName: 'Resume_Jyotsana_Jha_2026.docx',
    });
    const parserResume =
      (pipeline as any).validation?.resume || (pipeline as any).extracted || pipeline;
    const upload = normalizeUploadProfile(
      mapExtractedToUploadProfile(parserResume, { aiProvider: 'custom-parser' }) as any
    ) as Record<string, unknown>;
    const { data: repaired } = validateAndRepairResumeExtraction({
      ...upload,
      rawText: prep.text,
      _imported: true,
      customParserUsed: true,
    });
    const coalesced = coalesceBuilderImportPayload({
      ...repaired,
      rawText: prep.text,
      _imported: true,
      customParserUsed: true,
    }) as Record<string, unknown>;
    const gallery = prepareGalleryPreviewFormData(coalesced) as Record<string, unknown>;
    const builder = transformImportDataToBuilder({
      ...coalesced,
      rawText: prep.text,
      _imported: true,
      customParserUsed: true,
    }) as Record<string, unknown>;

    const name =
      String(gallery.fullName || gallery.name || builder.fullName || builder.name || '').trim();
    const email = String(gallery.email || builder.email || '').trim();
    const phone = String(gallery.phone || builder.phone || '').trim();

    expect(name).toMatch(/Jyotsana/i);
    expect(name).toMatch(/Jha/i);
    expect(email).toMatch(/jyotsana@gmail\.com/i);
    expect(phone.replace(/\D/g, '')).toMatch(/8320087124/);
  }, 60000);
});
