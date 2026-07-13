/**
 * READ-ONLY Anuj / arbitrary PDF pipeline audit (no writes).
 * Usage: npx tsx scripts/audit-anuj-pipeline.ts [path-to.pdf]
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
import { recoverStructuredExperienceFromRawText } from '../lib/resume-parser/import-sanitize';

const pdfPath = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(process.env.USERPROFILE || '', 'Downloads', 'Anuj update-CS & Legal-1.pdf');

function count(data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  return {
    experience: exps.length,
    companies: exps.filter((e) => String((e as Record<string, unknown>).company || '').trim().length >= 2).length,
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
    education: Array.isArray(data.education) ? data.education.length : 0,
    certifications: Array.isArray(data.certifications) ? data.certifications.length : 0,
    skills: Array.isArray(data.skills) ? data.skills.length : 0,
    languages: Array.isArray(data.languages) ? data.languages.length : 0,
    achievements: Array.isArray(data.achievements) ? data.achievements.length : 0,
    hobbies: Array.isArray(data.hobbies) ? data.hobbies.length : 0,
    summaryChars: String(data.summary || data.bio || '').length,
    name: String(data.fullName || data.firstName || data.name || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
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
      `| ${e.startDate || '?'} - ${e.endDate || (e.current ? 'Present' : '?')} | desc=${desc.length}ch bullets=${bullets}`
    );
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
  console.log({ rawChars: rawPdfText.length, preparedChars: rawText.length, type: prep.profile.primaryType });
  console.log('\n--- RAW first 900 ---\n', rawText.slice(0, 900));
  console.log('\n--- RAW mid snippet ---\n', rawText.slice(900, 1800));

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
  console.log('\n--- PREAMBLE ---\n', sections.preamble);
  console.log('\n--- SUMMARY (600) ---\n', String(sections.summary || '').slice(0, 600));
  console.log('\n--- EXPERIENCE (1000) ---\n', String(sections.experience || '').slice(0, 1000));
  console.log('\n--- EDUCATION ---\n', sections.education);
  console.log('\n--- SKILLS ---\n', sections.skills);
  console.log('\n--- PROJECTS ---\n', String(sections.projects || '').slice(0, 400));
  console.log('\n--- CERTIFICATIONS (500) ---\n', String(sections.certifications || '').slice(0, 500));
  console.log('\n--- LANGUAGES ---\n', sections.languages);
  console.log('\n--- ACHIEVEMENTS ---\n', String(sections.achievements || '').slice(0, 400));

  const fromSection = sections.experience
    ? extractExperiencesFromSection(sections.experience, sections.parseStrategy
        ? {
            threshold: sections.parseStrategy.experienceBoundaryThreshold,
            thresholdAfterBlank: sections.parseStrategy.experienceBoundaryThresholdAfterBlank,
          }
        : undefined)
    : [];
  console.log('\n=== extractExperiencesFromSection ===', fromSection.length);
  fromSection.forEach((e, i) =>
    console.log(i + 1, e.company, '|', e.designation, '| conf', e.confidence)
  );

  const recovered = recoverStructuredExperienceFromRawText(rawText);
  console.log('\n=== recoverStructuredExperienceFromRawText ===', recovered.length);
  recovered.forEach((e, i) => console.log(i + 1, e.company, '|', e.title));

  const pipeline = runCustomParserPipeline(rawText);
  const parserResume = pipeline.validation.resume as Record<string, unknown>;
  console.log('\n=== CUSTOM PARSER ===', count({
    ...parserResume,
    experience: parserResume.experience as unknown[],
  }));
  printExp('CUSTOM PARSER', { experience: parserResume.experience as unknown[] });

  const uploadRaw = mapExtractedToUploadProfile(pipeline.validation.resume, {
    aiProvider: 'custom-parser',
  });
  const upload = normalizeUploadProfile(uploadRaw as Record<string, unknown>) as Record<string, unknown>;
  console.log('\n=== UPLOAD ===', count(upload));

  const { data: repaired } = validateAndRepairResumeExtraction({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
  });
  console.log('\n=== REPAIRED ===', count(repaired as Record<string, unknown>));

  const coalesced = coalesceBuilderImportPayload({
    ...repaired,
    rawText,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  console.log('\n=== COALESCED ===', count(coalesced));
  printExp('COALESCED', coalesced);

  const edu = Array.isArray(coalesced.education) ? coalesced.education : [];
  console.log('\n=== EDUCATION DETAIL ===', edu.length);
  edu.forEach((e, i) => {
    const row = e as Record<string, unknown>;
    console.log(i + 1, row.degree, '|', row.school || row.institution, '|', row.year || row.endDate);
  });

  const certs = Array.isArray(coalesced.certifications) ? coalesced.certifications : [];
  console.log('\n=== CERTIFICATIONS DETAIL ===', certs.length);
  certs.slice(0, 15).forEach((c, i) => {
    const row = c as Record<string, unknown>;
    console.log(i + 1, String(row.name || row.title || c).slice(0, 100));
  });

  const skills = Array.isArray(coalesced.skills) ? coalesced.skills : [];
  console.log('\n=== SKILLS ===', skills.length, skills.slice(0, 20).join(' | '));

  const langs = Array.isArray(coalesced.languages) ? coalesced.languages : [];
  console.log('\n=== LANGUAGES ===', langs.length, JSON.stringify(langs).slice(0, 300));

  console.log('\n=== SUMMARY TEXT ===\n', String(coalesced.summary || '').slice(0, 500));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
