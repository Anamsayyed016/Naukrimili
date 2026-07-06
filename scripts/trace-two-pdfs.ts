/**
 * Trace two resumes for summary/project/experience mapping issues.
 * Usage: npx tsx scripts/trace-two-pdfs.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import {
  transformImportDataToBuilder,
  coalesceBuilderImportPayload,
} from '../lib/resume-builder/import-transformer';

const PDFS = [
  resolve(process.env.USERPROFILE || '', 'Downloads', 'PROFILE OF CS.pdf'),
  resolve(process.env.USERPROFILE || '', 'Downloads', 'Naukrimili_SurbhiGour[10y_0m].pdf'),
];

async function tracePdf(pdfPath: string) {
  console.log('\n' + '='.repeat(72));
  console.log('PDF:', pdfPath.split(/[/\\]/).pop());
  console.log('='.repeat(72));

  const bytes = readFileSync(pdfPath);
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(bytes));
  const rawText = prepareResumeTextForParsing(rawPdfText).text;

  const pipeline = runCustomParserPipeline(rawText);
  const uploadRaw = mapExtractedToUploadProfile(pipeline.validation.resume, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  const uploadNorm = normalizeUploadProfile(uploadRaw);
  const profile = {
    ...uploadNorm,
    customParserUsed: true,
    rawText,
    _imported: true,
  };

  const builder = transformImportDataToBuilder(profile) as Record<string, unknown>;
  const coalesced = coalesceBuilderImportPayload({
    ...profile,
    builderFormData: builder,
  }) as Record<string, unknown>;

  const name = [coalesced.firstName, coalesced.lastName].filter(Boolean).join(' ') || coalesced.fullName;
  console.log('\n--- Identity ---');
  console.log('name:', name);
  console.log('email:', coalesced.email);
  console.log('jobTitle:', coalesced.jobTitle || coalesced.title);

  const summary = String(coalesced.summary || '').trim();
  console.log('\n--- Summary ---');
  console.log('chars:', summary.length);
  console.log('preview:', summary.slice(0, 280).replace(/\n/g, ' | '));

  const exps = Array.isArray(coalesced.experience) ? coalesced.experience : [];
  console.log('\n--- Experience ---', exps.length);
  for (let i = 0; i < Math.min(exps.length, 6); i++) {
    const e = exps[i] as Record<string, unknown>;
    console.log(
      `  #${i + 1}: ${String(e.title || e.position || '?')} @ ${String(e.company || '?')}`
    );
    const desc = String(e.description || '').slice(0, 120);
    if (desc) console.log('      desc:', desc.replace(/\n/g, ' '));
  }

  const projs = Array.isArray(coalesced.projects) ? coalesced.projects : [];
  console.log('\n--- Projects ---', projs.length);
  for (const p of projs.slice(0, 8)) {
    const r = p as Record<string, unknown>;
    console.log('  -', String(r.name || r.title || '?'));
  }

  const edus = Array.isArray(coalesced.education) ? coalesced.education : [];
  console.log('\n--- Education ---', edus.length);
  for (const e of edus.slice(0, 6)) {
    const r = e as Record<string, unknown>;
    console.log('  -', String(r.degree || '?'), '@', String(r.institution || r.school || ''));
  }

  const skills = Array.isArray(coalesced.skills) ? coalesced.skills : [];
  console.log('\n--- Skills ---', skills.length);
  console.log(' ', (skills as string[]).slice(0, 18).join(', '));

  const hobbies = Array.isArray(coalesced.hobbies) ? coalesced.hobbies : [];
  const achievements = Array.isArray(coalesced.achievements) ? coalesced.achievements : [];
  if (hobbies.length) console.log('\n--- Hobbies ---', hobbies);
  if (achievements.length) console.log('\n--- Achievements ---', (achievements as string[]).slice(0, 5));
}

for (const pdf of PDFS) {
  await tracePdf(pdf);
}
