/**
 * READ-ONLY pipeline audit for Anam Sayyed HR Resume (validation case only).
 * Usage: npx tsx scripts/audit-anam-hr-readonly.ts
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
import { injectResumeData } from '../lib/resume-builder/template-loader';

const pdfPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(process.env.USERPROFILE || '', 'Downloads', 'Anam_Sayyed_HR_Resume.pdf');

function count(data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  return {
    experience: exps.length,
    companies: exps.map((e) => String((e as any).company || '')).filter(Boolean),
    titles: exps.map((e) => String((e as any).title || (e as any).position || '')).filter(Boolean),
    withDesc: exps.filter((e) => {
      const row = e as Record<string, unknown>;
      const desc = String(row.description || '').trim();
      const bullets = Array.isArray(row.achievements) ? row.achievements.length : 0;
      return desc.length >= 40 || bullets >= 1;
    }).length,
    projects: Array.isArray(data.projects)
      ? (data.projects as any[]).map((p) => p.name || p.title || '?')
      : [],
    education: Array.isArray(data.education)
      ? (data.education as any[]).map(
          (e) => `${e.degree || e.Degree || '?'} @ ${e.institution || e.school || e.Institution || '?'}`
        )
      : [],
    certifications: Array.isArray(data.certifications) ? data.certifications.length : 0,
    skills: Array.isArray(data.skills) ? data.skills.slice(0, 20) : [],
    skillsCount: Array.isArray(data.skills) ? data.skills.length : 0,
    languages: Array.isArray(data.languages) ? data.languages : [],
    achievements: Array.isArray(data.achievements) ? data.achievements.length : 0,
    hobbies: Array.isArray(data.hobbies) ? data.hobbies.length : 0,
    summaryChars: String(data.summary || data.bio || '').length,
    name: String(
      data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || ''
    ),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    location: String(data.location || ''),
  };
}

function printExp(label: string, data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  console.log(`\n=== ${label} experience (${exps.length}) ===`);
  exps.forEach((row, i) => {
    const e = row as Record<string, unknown>;
    const desc = String(e.description || '');
    const bullets = Array.isArray(e.achievements) ? e.achievements.length : 0;
    console.log(
      `#${i + 1}`,
      String(e.title || e.position || '?'),
      '@',
      String(e.company || '?'),
      `| ${e.startDate || '?'} → ${e.endDate || (e.current ? 'Present' : '?')} | desc=${desc.length} bullets=${bullets}`
    );
    if (desc) console.log('   desc:', desc.slice(0, 160).replace(/\s+/g, ' '));
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

  console.log('\n=== 1. TEXT EXTRACTION ===');
  console.log({
    rawChars: rawPdfText.length,
    preparedChars: rawText.length,
    type: prep.profile.primaryType,
  });
  console.log('\n--- RAW head 1500 ---\n', rawText.slice(0, 1500));
  console.log('\n--- RAW mid 1500 ---\n', rawText.slice(1500, 3000));
  console.log('\n--- RAW tail 1200 ---\n', rawText.slice(-1200));

  const sections = detectResumeSections(rawText);
  console.log('\n=== 2. SECTION LENGTHS ===');
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
  console.log('\n--- SUMMARY ---\n', String(sections.summary || '').slice(0, 500));
  console.log('\n--- EXPERIENCE ---\n', String(sections.experience || '').slice(0, 1500));
  console.log('\n--- EDUCATION ---\n', String(sections.education || '').slice(0, 700));
  console.log('\n--- SKILLS ---\n', String(sections.skills || '').slice(0, 600));
  console.log('\n--- PROJECTS ---\n', String(sections.projects || '').slice(0, 600));
  console.log('\n--- CERTS ---\n', String(sections.certifications || '').slice(0, 400));
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
  console.log('\n=== 3. extractExperiencesFromSection ===', fromSection.length);
  fromSection.forEach((e, i) =>
    console.log(
      i + 1,
      '| company:',
      e.company,
      '| title:',
      e.designation,
      '| conf',
      e.confidence,
      '| desc',
      String(e.description || '').length
    )
  );

  const pipeline = runCustomParserPipeline(rawText);
  const resume = pipeline.validation.resume as Record<string, unknown>;
  console.log('\n=== 4. CUSTOM PARSER ===', count({ ...resume, experience: resume.experience as unknown[] }));
  printExp('CUSTOM', { experience: resume.experience as unknown[] });

  const upload = normalizeUploadProfile(
    mapExtractedToUploadProfile(pipeline.validation.resume, {
      aiProvider: 'custom-parser',
    }) as Record<string, unknown>
  ) as Record<string, unknown>;
  console.log('\n=== 5. UPLOAD/NORMALIZE ===', count(upload));
  printExp('UPLOAD', upload);

  const { data: repaired } = validateAndRepairResumeExtraction({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
  });
  console.log('\n=== 6. REPAIRED ===', count(repaired as Record<string, unknown>));
  printExp('REPAIRED', repaired as Record<string, unknown>);

  const builder = transformImportDataToBuilder({
    ...repaired,
    rawText,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  console.log('\n=== 7. BUILDER ===', count(builder));
  printExp('BUILDER', builder);

  const coalesced = coalesceBuilderImportPayload({
    ...repaired,
    rawText,
    _imported: true,
    customParserUsed: true,
    builderFormData: builder,
  }) as Record<string, unknown>;
  console.log('\n=== 8. COALESCED ===', count(coalesced));
  printExp('COALESCED', coalesced);

  // Soft Coral render probe
  try {
    const tpl = readFileSync('./public/templates/soft-coral-executive/index.html', 'utf8');
    const html = injectResumeData(tpl, coalesced, {
      templateId: 'soft-coral-executive',
      htmlTemplate: tpl,
    });
    const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] || '';
    const aside = html.match(/<aside[\s\S]*?<\/aside>/i)?.[0] || '';
    console.log('\n=== 9. SOFT CORAL RENDER ===', {
      mainLen: main.length,
      asideLen: aside.length,
      mainHasExperience: /experience-item/i.test(main),
      mainHasProject: /project-item/i.test(main),
      asideHasSummary: /summary/i.test(aside),
      asideHasSkill: /skill-tag/i.test(aside),
      asideHasEdu: /education-item/i.test(aside),
      nameSnippet: (html.match(/>([A-Za-z][^<]{2,60})</) || [])[1] || '',
    });
  } catch (err) {
    console.log('render probe failed', err);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
