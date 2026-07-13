/**
 * READ-ONLY pipeline audit for arbitrary PDF (no writes).
 * Usage: npx tsx scripts/audit-pdf-pipeline.ts [path-to.pdf]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import {
  coalesceBuilderImportPayload,
  transformImportDataToBuilder,
} from '../lib/resume-builder/import-transformer';
import {
  recoverStructuredExperienceFromRawText,
  recoverCompetencyBulletsFromRawText,
  recoverExperienceBodiesFromRawText,
} from '../lib/resume-parser/import-sanitize';

const pdfPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(process.env.USERPROFILE || '', 'Downloads', 'Naukri_ASHISHGUPTA[21y_0m].pdf');

function count(data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  return {
    experience: exps.length,
    companies: exps.filter(
      (e) => String((e as Record<string, unknown>).company || '').trim().length >= 2
    ).length,
    titled: exps.filter(
      (e) =>
        String(
          (e as Record<string, unknown>).title ||
            (e as Record<string, unknown>).position ||
            ''
        ).trim().length >= 2
    ).length,
    withDesc: exps.filter((e) => {
      const row = e as Record<string, unknown>;
      const desc = String(row.description || '').trim();
      const bullets = Array.isArray(row.achievements) ? row.achievements.length : 0;
      return desc.length >= 40 || bullets >= 1;
    }).length,
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
    education: Array.isArray(data.education) ? data.education.length : 0,
    certifications: Array.isArray(data.certifications) ? data.certifications.length : 0,
    skills: Array.isArray(data.skills) ? data.skills.length : 0,
    languages: Array.isArray(data.languages) ? data.languages.length : 0,
    achievements: Array.isArray(data.achievements) ? data.achievements.length : 0,
    hobbies: Array.isArray(data.hobbies) ? data.hobbies.length : 0,
    summaryChars: String(data.summary || data.bio || '').length,
    name: String(data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    location: String(data.location || ''),
  };
}

function printExp(label: string, data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  console.log(`\n--- ${label} experience (${exps.length}) ---`);
  exps.forEach((row, i) => {
    const e = row as Record<string, unknown>;
    const desc = String(e.description || '');
    const bullets = Array.isArray(e.achievements) ? e.achievements.length : 0;
    console.log(
      `#${i + 1}`,
      String(e.title || e.position || '?'),
      '@',
      String(e.company || '?'),
      `| ${e.startDate || '?'} → ${e.endDate || (e.current ? 'Present' : '?')} | desc=${desc.length}ch bullets=${bullets}`
    );
    if (desc) console.log('   desc:', desc.slice(0, 140).replace(/\s+/g, ' '));
  });
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
  console.log({
    rawChars: rawPdfText.length,
    preparedChars: rawText.length,
    type: prep.profile.primaryType,
  });
  console.log('\n--- RAW head 1200 ---\n', rawText.slice(0, 1200));
  console.log('\n--- RAW mid 1200 ---\n', rawText.slice(1200, 2400));
  console.log('\n--- RAW mid2 1200 ---\n', rawText.slice(2400, 3600));

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
  console.log('\n--- SUMMARY (500) ---\n', String(sections.summary || '').slice(0, 500));
  console.log('\n--- EXPERIENCE (1200) ---\n', String(sections.experience || '').slice(0, 1200));
  console.log('\n--- EDUCATION ---\n', String(sections.education || '').slice(0, 600));
  console.log('\n--- SKILLS ---\n', String(sections.skills || '').slice(0, 500));
  console.log('\n--- PROJECTS ---\n', String(sections.projects || '').slice(0, 400));
  console.log('\n--- CERTIFICATIONS ---\n', String(sections.certifications || '').slice(0, 400));
  console.log('\n--- LANGUAGES ---\n', sections.languages);
  console.log('\n--- ACHIEVEMENTS ---\n', String(sections.achievements || '').slice(0, 400));

  const fromSection = sections.experience
    ? extractExperiencesFromSection(
        sections.experience,
        sections.parseStrategy
          ? {
              threshold: sections.parseStrategy.experienceBoundaryThreshold,
              thresholdAfterBlank: sections.parseStrategy.experienceBoundaryThresholdAfterBlank,
            }
          : undefined
      )
    : [];
  console.log('\n=== extractExperiencesFromSection ===', fromSection.length);
  fromSection.forEach((e, i) =>
    console.log(
      i + 1,
      e.company,
      '|',
      e.designation,
      '| conf',
      e.confidence,
      '| desc',
      String(e.description || '').length
    )
  );

  const recovered = recoverStructuredExperienceFromRawText(rawText);
  console.log('\n=== recoverStructuredExperienceFromRawText ===', recovered.length);
  recovered.forEach((e, i) =>
    console.log(i + 1, e.company, '|', e.title, '|', e.startDate, '→', e.endDate)
  );

  const competency = recoverCompetencyBulletsFromRawText(rawText);
  console.log('\n=== recoverCompetencyBullets ===', competency.length);
  competency.slice(0, 5).forEach((b, i) => console.log(i + 1, b.slice(0, 100)));

  const pipeline = runCustomParserPipeline(rawText);
  const resume = pipeline.validation.resume as Record<string, unknown>;
  console.log('\n=== CUSTOM PARSER ===', count({ ...resume, experience: resume.experience as unknown[] }));
  printExp('CUSTOM', { experience: resume.experience as unknown[] });

  const upload = normalizeUploadProfile(
    mapExtractedToUploadProfile(pipeline.validation.resume, {
      aiProvider: 'custom-parser',
    }) as Record<string, unknown>
  ) as Record<string, unknown>;

  const { data: repaired } = validateAndRepairResumeExtraction({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
  });

  const builder = transformImportDataToBuilder({
    ...repaired,
    rawText,
    _imported: true,
    customParserUsed: true,
  });

  const coalesced = coalesceBuilderImportPayload({
    ...repaired,
    rawText,
    _imported: true,
    customParserUsed: true,
    builderFormData: builder,
  }) as Record<string, unknown>;

  console.log('\n=== COALESCED ===', count(coalesced));
  printExp('COALESCED', coalesced);

  if (Array.isArray(coalesced.experience) && coalesced.experience.length) {
    const bodyCheck = recoverExperienceBodiesFromRawText(
      rawText,
      coalesced.experience as Record<string, unknown>[]
    );
    console.log('\n=== body recovery check ===');
    bodyCheck.forEach((e, i) =>
      console.log(`#${i + 1} desc=${String(e.description || '').length}`)
    );
  }

  console.log('\n=== EDUCATION DETAIL ===', Array.isArray(coalesced.education) ? coalesced.education.length : 0);
  (Array.isArray(coalesced.education) ? coalesced.education : []).forEach((row, i) => {
    const e = row as Record<string, unknown>;
    console.log(i + 1, e.degree || e.Degree, '|', e.school || e.institution || e.Institution);
  });

  console.log('\n=== PROJECTS DETAIL ===', Array.isArray(coalesced.projects) ? coalesced.projects.length : 0);
  (Array.isArray(coalesced.projects) ? coalesced.projects : []).slice(0, 8).forEach((row, i) => {
    const e = row as Record<string, unknown>;
    console.log(i + 1, e.name || e.title || e.Name);
  });

  console.log('\n=== CERTIFICATIONS ===', Array.isArray(coalesced.certifications) ? coalesced.certifications.length : 0);
  console.log('\n=== SKILLS ===', Array.isArray(coalesced.skills) ? coalesced.skills.slice(0, 25).join(' | ') : '');
  console.log('\n=== SUMMARY ===\n', String(coalesced.summary || '').slice(0, 400));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
