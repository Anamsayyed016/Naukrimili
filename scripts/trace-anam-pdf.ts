/**
 * Dynamic end-to-end pipeline trace for a real PDF resume.
 * Usage: npx tsx scripts/trace-anam-pdf.ts [path-to.pdf]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { buildCanonicalResumeFromValidation } from '../lib/resume-parser/custom/canonical-resume/build';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import {
  transformImportDataToBuilder,
  coalesceBuilderImportPayload,
} from '../lib/resume-builder/import-transformer';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import { optimizeResumeDataForRender } from '../lib/resume-builder/section-visibility';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { validateImportPipelineAlignment } from '../lib/resume-builder/import-pipeline-validation';
import { builderFormChecksum } from '../lib/resume-builder/builder-hydration';

const DEFAULT_PDF = resolve(
  process.env.USERPROFILE || '',
  'Downloads',
  'Anam_Sayyed_Full_Stack_Python_Resume.pdf'
);

type Snapshot = {
  stage: string;
  expCount: number;
  eduCount: number;
  projCount: number;
  skillCount: number;
  certCount: number;
  langCount: number;
  companies: string[];
  titles: string[];
  projectNames: string[];
  eduInstitutions: string[];
  skills: string[];
  extendedKeys: string[];
};

function skillsList(data: Record<string, unknown>): string[] {
  const raw = data.skills ?? data.Skills ?? data.technicalSkills;
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => String(s).trim()).filter(Boolean);
}

function extendedKeys(data: Record<string, unknown>): string[] {
  const ext = data.extendedSections;
  if (!ext || typeof ext !== 'object') return [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(ext as Record<string, unknown>)) {
    if (Array.isArray(v) && v.length > 0) keys.push(`${k}(${v.length})`);
    else if (typeof v === 'string' && v.trim()) keys.push(k);
    else if (v && typeof v === 'object' && Object.keys(v as object).length > 0) keys.push(k);
  }
  return keys;
}

function snap(stage: string, data: Record<string, unknown>): Snapshot {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  const edus = Array.isArray(data.education) ? data.education : [];
  const projs = Array.isArray(data.projects) ? data.projects : [];
  const certs = Array.isArray(data.certifications) ? data.certifications : [];
  const langs = Array.isArray(data.languages) ? data.languages : [];
  const skills = skillsList(data);

  return {
    stage,
    expCount: exps.length,
    eduCount: edus.length,
    projCount: projs.length,
    skillCount: skills.length,
    certCount: certs.length,
    langCount: langs.length,
    companies: exps.map((e: Record<string, unknown>) =>
      String(e.company ?? e.Company ?? e.organization ?? '').trim()
    ),
    titles: exps.map((e: Record<string, unknown>) =>
      String(e.title ?? e.position ?? e.jobTitle ?? '').trim()
    ),
    projectNames: projs.map((p: Record<string, unknown>) =>
      String(p.name ?? p.title ?? '').trim()
    ),
    eduInstitutions: edus.map((e: Record<string, unknown>) =>
      String(e.institution ?? e.school ?? e.degree ?? '').trim()
    ),
    skills,
    extendedKeys: extendedKeys(data),
  };
}

function printSnap(s: Snapshot) {
  console.log(`\n--- ${s.stage} ---`);
  console.log(
    `exp=${s.expCount} edu=${s.eduCount} proj=${s.projCount} skills=${s.skillCount} certs=${s.certCount} langs=${s.langCount}`
  );
  for (let i = 0; i < s.expCount; i++) {
    console.log(`  exp#${i + 1}: ${s.titles[i] || '?'} @ ${s.companies[i] || '?'}`);
  }
  console.log('projects:', s.projectNames.join(' | ') || '(none)');
  console.log('education:', s.eduInstitutions.join(' | ') || '(none)');
  if (s.extendedKeys.length) console.log('extended:', s.extendedKeys.join(', '));
  console.log('skills:', s.skills.slice(0, 20).join(', ') + (s.skills.length > 20 ? '…' : ''));
}

function diffStages(prev: Snapshot, curr: Snapshot): string[] {
  const issues: string[] = [];
  if (prev.expCount !== curr.expCount)
    issues.push(`experience count ${prev.expCount}→${curr.expCount}`);
  if (prev.eduCount !== curr.eduCount)
    issues.push(`education count ${prev.eduCount}→${curr.eduCount}`);
  if (prev.projCount !== curr.projCount)
    issues.push(`project count ${prev.projCount}→${curr.projCount}`);
  if (prev.skillCount !== curr.skillCount)
    issues.push(`skill count ${prev.skillCount}→${curr.skillCount}`);

  for (let i = 0; i < Math.max(prev.companies.length, curr.companies.length); i++) {
    const a = prev.companies[i] ?? '';
    const b = curr.companies[i] ?? '';
    if (a && !b) issues.push(`exp#${i + 1} company lost: "${a}"`);
    else if (a && b && a !== b) issues.push(`exp#${i + 1} company changed: "${a}"→"${b}"`);
  }

  const lostSkills = prev.skills.filter(
    (s) => !curr.skills.some((c) => c.toLowerCase() === s.toLowerCase())
  );
  if (lostSkills.length) issues.push(`skills lost: ${lostSkills.join(', ')}`);

  return issues;
}

async function main() {
  const pdfPath = resolve(process.argv[2] || DEFAULT_PDF);
  console.log('PDF:', pdfPath);

  const bytes = readFileSync(pdfPath);
  const { text: rawPdfText, numpages } = await parsePdfBuffer(Buffer.from(bytes));
  console.log(`Pages: ${numpages}, raw text length: ${rawPdfText.length}`);
  console.log('Text preview:\n', rawPdfText.slice(0, 500).replace(/\n/g, '\n  '));

  const prepared = prepareResumeTextForParsing(rawPdfText);
  const rawText = prepared.text;
  console.log(`\nPrepared text length: ${rawText.length}`);

  const pipeline = runCustomParserPipeline(rawText);
  const extracted = pipeline.validation.resume as Record<string, unknown>;
  const canonical = buildCanonicalResumeFromValidation(pipeline.validation) as Record<
    string,
    unknown
  >;

  const uploadRaw = mapExtractedToUploadProfile(extracted, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  uploadRaw.customParserUsed = true;
  uploadRaw.selectedParser = 'custom';
  uploadRaw._aiProvider = 'custom-parser';

  const uploadNorm = normalizeUploadProfile(uploadRaw);
  const { data: repaired } = validateAndRepairResumeExtraction({ ...uploadNorm });

  const profile = {
    ...uploadNorm,
    customParserUsed: true,
    selectedParser: 'custom',
    _aiProvider: 'custom-parser',
    rawText,
    _imported: true,
  };

  const builder = transformImportDataToBuilder(profile) as Record<string, unknown>;
  const render = optimizeResumeDataForRender(builder) as Record<string, unknown>;

  const apiProfile = {
    ...profile,
    builderFormData: builder,
  };
  const coalesced = coalesceBuilderImportPayload(apiProfile as Record<string, unknown>) as Record<
    string,
    unknown
  >;

  const pipelineCheck = validateImportPipelineAlignment(profile, coalesced);
  const galleryChecksum = builderFormChecksum(coalesced);
  const editorChecksum = builderFormChecksum(coalesced);
  const renderChecksum = builderFormChecksum(render);

  const html = injectResumeData(
    '<html><body>{{EXPERIENCE}}{{PROJECTS}}{{EDUCATION}}{{SKILLS}}{{SUMMARY}}</body></html>',
    coalesced
  );

  const stages: Snapshot[] = [
    snap('1 PDF → Custom Parser', extracted),
    snap('2 Canonical Resume', {
      experience: canonical.experience,
      education: canonical.education,
      projects: canonical.projects,
      skills: canonical.skills,
    }),
    snap('3 Upload Profile', uploadRaw),
    snap('4 Normalized Profile', uploadNorm as Record<string, unknown>),
    snap('5 Repaired Profile', repaired as Record<string, unknown>),
    snap('6 Builder FormData', builder),
    snap('7 Render Optimized', render),
    snap('8 Coalesced (Gallery/Editor)', coalesced),
  ];

  console.log('\n' + '='.repeat(72));
  console.log('ANAM PDF — END-TO-END PIPELINE TRACE');
  console.log('='.repeat(72));

  for (const s of stages) printSnap(s);

  console.log('\n' + '='.repeat(72));
  console.log('STAGE-TO-STAGE DIFF');
  console.log('='.repeat(72));

  let firstFailure: { from: string; to: string; issues: string[] } | null = null;
  for (let i = 1; i < stages.length; i++) {
    const issues = diffStages(stages[i - 1], stages[i]);
    if (issues.length) {
      console.log(`\n${stages[i - 1].stage} → ${stages[i].stage}:`);
      issues.forEach((x) => console.log(`  ⚠ ${x}`));
      if (!firstFailure) firstFailure = { from: stages[i - 1].stage, to: stages[i].stage, issues };
    } else {
      console.log(`\n✓ ${stages[i - 1].stage} → ${stages[i].stage}: OK`);
    }
  }

  console.log('\n--- Identity ---');
  console.log('name:', coalesced.firstName, coalesced.lastName, '|', coalesced.fullName ?? coalesced.name);
  console.log('email:', coalesced.email);
  console.log('phone:', coalesced.phone);
  console.log('summary chars:', String(coalesced.summary || '').length);

  console.log('\n--- Checksums (Gallery = Editor = Preview target) ---');
  console.log('Gallery/Editor:', galleryChecksum);
  console.log('Render:', renderChecksum);
  console.log('Match:', galleryChecksum === renderChecksum ? 'YES ✓' : 'NO ✗');

  console.log('\n--- Pipeline validation ---');
  console.log('ok:', pipelineCheck.ok);
  if (!pipelineCheck.ok) {
    console.log('issues:', JSON.stringify(pipelineCheck, null, 2));
  }

  console.log('\n--- Template HTML signals ---');
  console.log('experience-item count:', (html.match(/experience-item/g) || []).length);
  console.log('project count in HTML:', (html.match(/project-item|class="project/gi) || []).length);

  if (firstFailure) {
    console.log('\n❌ FIRST DATA LOSS:', firstFailure.from, '→', firstFailure.to);
    firstFailure.issues.forEach((i) => console.log('  ', i));
    process.exitCode = 1;
  } else {
    console.log('\n✅ No stage-to-stage count/field loss detected');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
