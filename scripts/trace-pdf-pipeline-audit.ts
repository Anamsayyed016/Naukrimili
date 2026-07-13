/**
 * READ-ONLY full pipeline audit for any resume PDF.
 * Usage: npx tsx scripts/trace-pdf-pipeline-audit.ts [path-to.pdf]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
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
import { injectResumeData, loadTemplate } from '../lib/resume-builder/template-loader';
import { resolveGalleryInjectOptions } from '../lib/resume-builder/gallery-preview-render';
import { recoverStructuredExperienceFromRawText } from '../lib/resume-parser/import-sanitize';
import { readFileSync as readFs } from 'node:fs';

const pdfPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(process.env.USERPROFILE || '', 'Downloads', 'Naukri_QamarAli[12y_0m].pdf');

type Counts = {
  experience: number;
  experienceCompanies: number;
  projects: number;
  education: number;
  certifications: number;
  skills: number;
  languages: number;
  achievements: number;
  hobbies: number;
  summaryChars: number;
};

function countRow(data: Record<string, unknown>): Counts {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  const companies = exps.filter((e) => {
    const c = String((e as Record<string, unknown>).company || '').trim();
    return c.length >= 2;
  });
  const summary = String(data.summary || data.bio || data.objective || '');
  return {
    experience: exps.length,
    experienceCompanies: companies.length,
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
    education: Array.isArray(data.education) ? data.education.length : 0,
    certifications: Array.isArray(data.certifications) ? data.certifications.length : 0,
    skills: Array.isArray(data.skills) ? data.skills.length : 0,
    languages: Array.isArray(data.languages) ? data.languages.length : 0,
    achievements: Array.isArray(data.achievements) ? data.achievements.length : 0,
    hobbies: Array.isArray(data.hobbies) ? data.hobbies.length : 0,
    summaryChars: summary.length,
  };
}

function countHtmlSections(html: string) {
  const expItems = (html.match(/experience-item|exp-entry|timeline-item|job-entry/gi) || []).length;
  const certItems = (html.match(/certification-item|cert-item|certification-entry/gi) || []).length;
  const eduItems = (html.match(/education-item|edu-entry|education-entry/gi) || []).length;
  const projectItems = (html.match(/project-item|projects-item/gi) || []).length;
  return { expItems, certItems, eduItems, projectItems, htmlLen: html.length };
}

function printCounts(label: string, c: Counts) {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(c, null, 2));
}

function printExpDetail(label: string, data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  console.log(`\n--- ${label} experience detail (${exps.length}) ---`);
  for (let i = 0; i < exps.length; i++) {
    const e = exps[i] as Record<string, unknown>;
    const desc = String(e.description || e.Description || '');
    const bullets = Array.isArray(e.achievements) ? e.achievements.length : 0;
    console.log(
      `#${i + 1}`,
      String(e.title || e.position || '?'),
      '@',
      String(e.company || '?'),
      `| desc=${desc.length}ch bullets=${bullets}`
    );
  }
}

async function main() {
  if (!existsSync(pdfPath)) {
    console.error('PDF not found:', pdfPath);
    process.exit(1);
  }

  console.log('PDF:', pdfPath);
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(readFileSync(pdfPath)));
  const prep = prepareResumeTextForParsing(rawPdfText);
  const rawText = prep.text;

  console.log('\n=== TEXT EXTRACTION ===');
  console.log('raw chars:', rawPdfText.length);
  console.log('prepared chars:', rawText.length);
  console.log('document type:', prep.profile.primaryType);

  const sections = detectResumeSections(rawText);
  console.log('\n=== SECTION LENGTHS ===');
  for (const key of [
    'preamble',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'achievements',
    'hobbies',
  ] as const) {
    const v = sections[key];
    console.log(`  ${key}:`, typeof v === 'string' ? v.length : 0);
  }

  const structuredRecovery = recoverStructuredExperienceFromRawText(rawText);
  console.log('\n=== STRUCTURED EXPERIENCE RECOVERY ===', structuredRecovery.length);
  structuredRecovery.forEach((e, i) => {
    console.log(i + 1, e.company, '|', e.title);
  });

  const pipeline = runCustomParserPipeline(rawText);
  const parserResume = pipeline.validation.resume;
  printCounts('CUSTOM PARSER OUTPUT', {
    experience: parserResume.experiences?.length ?? 0,
    experienceCompanies: (parserResume.experiences || []).filter((e) => e.company).length,
    projects: parserResume.projects?.length ?? 0,
    education: parserResume.education?.length ?? 0,
    certifications: parserResume.certifications?.length ?? 0,
    skills: parserResume.skills?.length ?? 0,
    languages: parserResume.languages?.length ?? 0,
    achievements: parserResume.achievements?.length ?? 0,
    hobbies: parserResume.hobbies?.length ?? 0,
    summaryChars: String(parserResume.summary || '').length,
  });

  const uploadRaw = mapExtractedToUploadProfile(parserResume, { aiProvider: 'custom-parser' });
  const upload = normalizeUploadProfile(uploadRaw as Record<string, unknown>) as Record<string, unknown>;
  printCounts('UPLOAD PROFILE', countRow(upload));

  const { data: repaired } = validateAndRepairResumeExtraction({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
  });
  printCounts('AFTER VALIDATION/REPAIR', countRow(repaired));

  const coalesced = coalesceBuilderImportPayload({
    ...repaired,
    rawText,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  printCounts('COALESCED BUILDER PAYLOAD', countRow(coalesced));
  printExpDetail('COALESCED', coalesced);

  const galleryForm = prepareGalleryPreviewFormData(coalesced);
  printCounts('GALLERY PREVIEW FORMDATA', countRow(galleryForm));
  printExpDetail('GALLERY FORMDATA', galleryForm);

  const builder = transformImportDataToBuilder({
    ...coalesced,
    rawText,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  printCounts('BUILDER OUTPUT', countRow(builder));
  printExpDetail('BUILDER', builder);

  const templateId = 'soft-coral-executive';
  const loaded = await loadTemplate(templateId);
  if (!loaded) {
    console.error('Template not found');
    process.exit(1);
  }

  const liveHtml = injectResumeData(loaded.html, galleryForm, {
    templateId,
    mode: 'preview',
  });
  const galleryHtml = injectResumeData(
    loaded.html,
    galleryForm,
    resolveGalleryInjectOptions(templateId, galleryForm)
  );

  console.log('\n=== HTML RENDER COMPARISON (soft-coral-executive) ===');
  console.log('live:', countHtmlSections(liveHtml));
  console.log('gallery:', countHtmlSections(galleryHtml));
  console.log('inject options:', resolveGalleryInjectOptions(templateId, galleryForm));
  console.log('names:', galleryForm.fullName || galleryForm.firstName, galleryForm.lastName);

  const certs = Array.isArray(galleryForm.certifications) ? galleryForm.certifications : [];
  console.log('\n=== CERTIFICATIONS IN FORMDATA ===', certs.length);
  certs.slice(0, 12).forEach((c, i) => {
    const row = c as Record<string, unknown>;
    console.log(i + 1, String(row.name || row.title || row).slice(0, 80));
  });

  const edu = Array.isArray(galleryForm.education) ? galleryForm.education : [];
  console.log('\n=== EDUCATION IN FORMDATA ===', edu.length);
  edu.forEach((e, i) => {
    const row = e as Record<string, unknown>;
    console.log(i + 1, row.degree, '|', row.school || row.institution);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
