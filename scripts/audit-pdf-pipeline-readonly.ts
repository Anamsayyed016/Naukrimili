/**
 * Full read-only pipeline audit (stops before template HTTP load).
 * Usage: npx tsx scripts/audit-pdf-pipeline-readonly.ts path.pdf
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import {
  coalesceBuilderImportPayload,
  transformImportDataToBuilder,
} from '../lib/resume-builder/import-transformer';
import { prepareGalleryPreviewFormData } from '../lib/resume-builder/builder-hydration';
import { recoverStructuredExperienceFromRawText } from '../lib/resume-parser/import-sanitize';

type Counts = Record<string, number>;

function counts(data: Record<string, unknown>): Counts {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  const summary = String(data.summary || data.bio || data.objective || '');
  return {
    experience: exps.length,
    experienceWithCompany: exps.filter((e) => String((e as any).company || '').trim().length >= 2).length,
    experienceWithTitle: exps.filter((e) => String((e as any).title || (e as any).position || '').trim().length >= 2).length,
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
    education: Array.isArray(data.education) ? data.education.length : 0,
    certifications: Array.isArray(data.certifications) ? data.certifications.length : 0,
    skills: Array.isArray(data.skills) ? data.skills.length : 0,
    languages: Array.isArray(data.languages) ? data.languages.length : 0,
    achievements: Array.isArray(data.achievements) ? data.achievements.length : 0,
    hobbies: Array.isArray(data.hobbies) ? data.hobbies.length : 0,
    summaryChars: summary.length,
    name: String(data.fullName || data.name || '').trim() ? 1 : 0,
    email: String(data.email || '').trim() ? 1 : 0,
    phone: String(data.phone || data.mobile || '').trim() ? 1 : 0,
  };
}

function slimExp(data: Record<string, unknown>) {
  return (Array.isArray(data.experience) ? data.experience : []).map((e: any, i) => ({
    i,
    title: e.title || e.position || null,
    company: e.company || null,
    startDate: e.startDate || e.start || null,
    endDate: e.endDate || e.end || null,
    descLen: String(e.description || '').length,
    bullets: Array.isArray(e.achievements) ? e.achievements.length : 0,
  }));
}

function slimList(arr: unknown, keys: string[] = ['name', 'title', 'degree', 'institution', 'skill']) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 30).map((item, i) => {
    if (typeof item === 'string') return { i, value: item.slice(0, 120) };
    const o = item as Record<string, unknown>;
    const out: Record<string, unknown> = { i };
    for (const k of keys) {
      if (o[k] != null) out[k] = String(o[k]).slice(0, 120);
    }
    if (Object.keys(out).length === 1) out.raw = JSON.stringify(item).slice(0, 160);
    return out;
  });
}

async function main() {
  const pdfPath = resolve(process.argv[2] || '');
  if (!existsSync(pdfPath)) {
    console.error('PDF not found', pdfPath);
    process.exit(1);
  }

  const outDir = resolve('.audit-trilok');
  mkdirSync(outDir, { recursive: true });

  const buf = readFileSync(pdfPath);
  const parsed = await parsePdfBuffer(buf);
  const prep = prepareResumeTextForParsing(String(parsed.text || ''));
  const rawText = prep.text;

  writeFileSync(resolve(outDir, '01-raw.txt'), String(parsed.text || ''), 'utf8');
  writeFileSync(resolve(outDir, '02-prepared.txt'), rawText, 'utf8');

  const sections = detectResumeSections(rawText) as Record<string, string>;
  const sectionLens: Record<string, number> = {};
  const sectionBodies: Record<string, string> = {};
  for (const [k, v] of Object.entries(sections)) {
    if (typeof v === 'string') {
      sectionLens[k] = v.length;
      sectionBodies[k] = v;
    }
  }
  writeFileSync(resolve(outDir, '03-sections.json'), JSON.stringify({ lens: sectionLens, bodies: sectionBodies }, null, 2), 'utf8');

  const structuredRecovery = recoverStructuredExperienceFromRawText(rawText);
  writeFileSync(
    resolve(outDir, '03b-structured-exp.json'),
    JSON.stringify(
      structuredRecovery.map((e) => ({
        company: e.company,
        title: e.title,
        startDate: (e as any).startDate,
        endDate: (e as any).endDate,
        descLen: String((e as any).description || '').length,
      })),
      null,
      2
    ),
    'utf8'
  );

  const pipeline = await runCustomParserPipeline(rawText, { sourceFileName: basename(pdfPath) });
  const parserResume = (pipeline as any).validation?.resume || (pipeline as any).extracted || pipeline;
  writeFileSync(resolve(outDir, '04-custom-parser.json'), JSON.stringify(parserResume, null, 2), 'utf8');

  const uploadRaw = mapExtractedToUploadProfile(parserResume, { aiProvider: 'custom-parser' });
  const upload = normalizeUploadProfile(uploadRaw as Record<string, unknown>) as Record<string, unknown>;
  writeFileSync(resolve(outDir, '05-upload-normalized.json'), JSON.stringify(upload, null, 2), 'utf8');

  const { data: repaired } = validateAndRepairResumeExtraction({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
  });
  writeFileSync(resolve(outDir, '06-repaired.json'), JSON.stringify(repaired, null, 2), 'utf8');

  const coalesced = coalesceBuilderImportPayload({
    ...repaired,
    rawText,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  writeFileSync(resolve(outDir, '07-coalesced.json'), JSON.stringify(coalesced, null, 2), 'utf8');

  const galleryForm = prepareGalleryPreviewFormData(coalesced);
  writeFileSync(resolve(outDir, '08-gallery-form.json'), JSON.stringify(galleryForm, null, 2), 'utf8');

  const builder = transformImportDataToBuilder({
    ...coalesced,
    rawText,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  writeFileSync(resolve(outDir, '09-builder.json'), JSON.stringify(builder, null, 2), 'utf8');

  const report = {
    pdf: pdfPath,
    extraction: {
      rawChars: String(parsed.text || '').length,
      preparedChars: rawText.length,
      pages: parsed.numpages,
      recoveredFromStreams: !!parsed.recoveredFromStreams,
      documentType: (prep as any).profile?.primaryType || (prep as any).documentType || null,
    },
    sectionLens,
    structuredExperienceRecovery: structuredRecovery.length,
    stages: {
      customParser: { counts: counts(parserResume), experience: slimExp(parserResume), education: slimList(parserResume.education), projects: slimList(parserResume.projects), skills: slimList(parserResume.skills), certifications: slimList(parserResume.certifications), languages: slimList(parserResume.languages), achievements: slimList(parserResume.achievements), summary: String(parserResume.summary || '').slice(0, 300), personal: { name: parserResume.fullName || parserResume.name, email: parserResume.email, phone: parserResume.phone } },
      uploadNormalized: { counts: counts(upload), experience: slimExp(upload), education: slimList(upload.education), projects: slimList(upload.projects), skills: slimList(upload.skills) },
      repaired: { counts: counts(repaired), experience: slimExp(repaired), education: slimList(repaired.education), projects: slimList(repaired.projects), skills: slimList(repaired.skills), achievements: slimList(repaired.achievements), hobbies: slimList(repaired.hobbies) },
      coalesced: { counts: counts(coalesced), experience: slimExp(coalesced), education: slimList(coalesced.education), projects: slimList(coalesced.projects), skills: slimList(coalesced.skills), hobbies: slimList(coalesced.hobbies), summary: String(coalesced.summary || '').slice(0, 200) },
      gallery: { counts: counts(galleryForm as any), experience: slimExp(galleryForm as any), projects: slimList((galleryForm as any).projects), skills: slimList((galleryForm as any).skills), hobbies: slimList((galleryForm as any).hobbies), summary: String((galleryForm as any).summary || '').slice(0, 200) },
      builder: { counts: counts(builder), experience: slimExp(builder), education: slimList(builder.education), projects: slimList(builder.projects), skills: slimList(builder.skills), hobbies: slimList(builder.hobbies), summary: String(builder.summary || '').slice(0, 200) },
    },
  };

  writeFileSync(resolve(outDir, '10-comparison-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
