/**
 * Trace any resume PDF through import → builder → render.
 * Usage: npx tsx scripts/trace-doc-pdf.ts [pdf-path-or-name]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import {
  coalesceBuilderImportPayload,
  backfillImportedExperienceForDisplay,
  hasImportableContent,
} from '../lib/resume-builder/import-transformer';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const arg = process.argv[2] || 'DOC-20260706-WA0002.pdf';
const pdfPath = existsSync(arg)
  ? arg
  : resolve(process.env.USERPROFILE || '', 'Downloads', arg);

async function main() {
  if (!existsSync(pdfPath)) {
    console.error('MISSING:', pdfPath);
    process.exitCode = 1;
    return;
  }

  console.log('PDF:', pdfPath);
  const bytes = readFileSync(pdfPath);
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(bytes));
  const rawText = prepareResumeTextForParsing(rawPdfText).text;

  console.log('\n--- Raw text preview (first 2500 chars) ---');
  console.log(rawText.slice(0, 2500).replace(/\f/g, '\n'));

  const pipeline = runCustomParserPipeline(rawText);
  const uploadRaw = mapExtractedToUploadProfile(pipeline.validation.resume, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  const uploadNorm = normalizeUploadProfile(uploadRaw);

  console.log('\n--- Parser output ---');
  console.log('name:', uploadNorm.fullName || uploadNorm.name);
  console.log('email:', uploadNorm.email);
  console.log('phone:', uploadNorm.phone);
  console.log('jobTitle:', uploadNorm.jobTitle || uploadNorm.title);
  console.log('summary chars:', String(uploadNorm.summary || '').length);
  console.log('experience:', (uploadNorm.experience as unknown[])?.length);
  console.log('education:', (uploadNorm.education as unknown[])?.length);
  console.log('skills:', (uploadNorm.skills as unknown[])?.length);
  console.log('projects:', (uploadNorm.projects as unknown[])?.length);
  console.log('certifications:', (uploadNorm.certifications as unknown[])?.length);
  console.log('languages:', (uploadNorm.languages as unknown[])?.length);

  const profile = {
    ...uploadNorm,
    customParserUsed: true,
    rawText,
    _imported: true,
  };

  const coalesced = backfillImportedExperienceForDisplay(
    coalesceBuilderImportPayload(profile)
  );

  console.log('\n--- Builder coalesced ---');
  console.log('importable:', hasImportableContent(coalesced));
  console.log('firstName:', coalesced.firstName, 'lastName:', coalesced.lastName);
  console.log('email:', coalesced.email, 'phone:', coalesced.phone);
  console.log('jobTitle:', coalesced.jobTitle || coalesced.title);
  console.log('location:', coalesced.location);
  console.log('summary chars:', String(coalesced.summary || '').length);
  console.log('experience:', (coalesced.experience as unknown[])?.length);
  console.log('education:', (coalesced.education as unknown[])?.length);
  console.log('skills:', (coalesced.skills as unknown[])?.length);
  console.log('projects:', (coalesced.projects as unknown[])?.length);
  console.log('certifications:', (coalesced.certifications as unknown[])?.length);
  console.log('languages:', (coalesced.languages as unknown[])?.length);
  console.log('achievements:', (coalesced.achievements as unknown[])?.length);
  console.log('hobbies:', (coalesced.hobbies as unknown[])?.length);

  const exps = Array.isArray(coalesced.experience) ? coalesced.experience : [];
  console.log('\n--- Experience ---');
  for (let i = 0; i < Math.min(exps.length, 8); i++) {
    const e = exps[i] as Record<string, unknown>;
    console.log(
      `  #${i + 1}: ${String(e.title || e.position || '?')} @ ${String(e.company || '?')}`
    );
    const desc = String(e.description || '').slice(0, 80);
    if (desc) console.log('      desc:', desc.replace(/\n/g, ' '));
  }

  const edus = Array.isArray(coalesced.education) ? coalesced.education : [];
  console.log('\n--- Education ---');
  for (const e of edus.slice(0, 6)) {
    const r = e as Record<string, unknown>;
    console.log(`  - ${r.degree || '?'} @ ${r.school || r.institution || '?'}`);
  }

  const skills = Array.isArray(coalesced.skills) ? coalesced.skills : [];
  console.log('\n--- Skills (first 15) ---', skills.slice(0, 15).join(', '));

  const html = injectResumeData(
    '<div>{{FULL_NAME}}|{{JOB_TITLE}}|{{EMAIL}}|{{PHONE}}|{{SUMMARY}}|{{EXPERIENCE}}|{{EDUCATION}}|{{SKILLS}}</div>',
    coalesced,
    { galleryPreview: true, templateId: 'ivory-boardroom-executive' }
  );
  const parts = html.replace(/<\/?div>/g, '').split('|');
  console.log('\n--- Template inject lengths ---');
  console.log('name:', parts[0]?.length, 'title:', parts[1]?.length);
  console.log('email:', parts[2]?.length, 'phone:', parts[3]?.length);
  console.log('summary:', parts[4]?.length, 'experience:', parts[5]?.length);
  console.log('education:', parts[6]?.length, 'skills:', parts[7]?.length);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
