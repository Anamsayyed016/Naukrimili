/**
 * Production pipeline instrumentation — validation case only. Do not commit.
 * Usage: npx tsx scripts/ssy-production-pipeline-audit.ts [pdf-path]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { buildCanonicalResumeFromValidation } from '../lib/resume-parser/custom/canonical-resume/build';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import {
  coalesceBuilderImportPayload,
  transformImportDataToBuilder,
} from '../lib/resume-builder/import-transformer';
import {
  prepareBuilderSessionPayload,
  normalizeImportedFormForEditor,
} from '../lib/resume-builder/builder-hydration';
import {
  coalesceFormDataForTemplateRender,
  applyRenderSectionIntegrity,
  optimizeResumeDataForRender,
} from '../lib/resume-builder/section-visibility';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const pdfPath = resolve(
  process.argv[2] || 'C:/Users/admin/Downloads/Resume - SSY HRD IR.pdf'
);
const outDir = resolve('.audit-ssy');

type ExpRow = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  duration: string;
  descLen: number;
};

type StageReport = {
  stage: string;
  counts: Record<string, number>;
  identity: Record<string, string>;
  experience: ExpRow[];
  skills: string[];
  languages: unknown[];
  certifications: unknown[];
  achievements: number;
  warnings: string[];
  transitions?: string[];
};

function skillsOf(d: Record<string, unknown>): string[] {
  const raw = d.skills ?? d.Skills;
  return Array.isArray(raw) ? raw.map((s) => String(s).trim()).filter(Boolean) : [];
}

function expRows(d: Record<string, unknown>): ExpRow[] {
  const exps = Array.isArray(d.experience) ? d.experience : [];
  return exps.map((row) => {
    const e = row as Record<string, unknown>;
    return {
      company: String(e.company ?? e.Company ?? '').trim(),
      title: String(e.title ?? e.position ?? e.designation ?? '').trim(),
      startDate: String(e.startDate ?? '').trim(),
      endDate: String(e.endDate ?? '').trim(),
      current: e.current === true || e.isCurrent === true,
      duration: String(e.Duration ?? e.duration ?? '').trim(),
      descLen: String(e.description ?? e.Description ?? '').length,
    };
  });
}

function identityOf(d: Record<string, unknown>): Record<string, string> {
  return {
    firstName: String(d.firstName ?? ''),
    lastName: String(d.lastName ?? ''),
    fullName: String(d.fullName ?? d.name ?? ''),
    email: String(d.email ?? ''),
    phone: String(d.phone ?? ''),
    location: String(d.location ?? ''),
    jobTitle: String(d.jobTitle ?? d.title ?? ''),
  };
}

function stage(
  name: string,
  d: Record<string, unknown>,
  warnings: string[] = []
): StageReport {
  const exps = expRows(d);
  return {
    stage: name,
    counts: {
      experience: exps.length,
      education: Array.isArray(d.education) ? d.education.length : 0,
      projects: Array.isArray(d.projects) ? d.projects.length : 0,
      skills: skillsOf(d).length,
      certifications: Array.isArray(d.certifications) ? d.certifications.length : 0,
      languages: Array.isArray(d.languages) ? d.languages.length : 0,
      achievements: Array.isArray(d.achievements) ? d.achievements.length : 0,
      summaryChars: String(d.summary ?? d.bio ?? '').length,
    },
    identity: identityOf(d),
    experience: exps,
    skills: skillsOf(d),
    languages: Array.isArray(d.languages) ? d.languages : [],
    certifications: Array.isArray(d.certifications) ? d.certifications.slice(0, 5) : [],
    achievements: Array.isArray(d.achievements) ? d.achievements.length : 0,
    warnings,
  };
}

function diffExp(prev: ExpRow[], curr: ExpRow[]): string[] {
  const issues: string[] = [];
  if (prev.length !== curr.length) {
    issues.push(`experience count ${prev.length} → ${curr.length}`);
  }
  const n = Math.max(prev.length, curr.length);
  for (let i = 0; i < n; i++) {
    const a = prev[i];
    const b = curr[i];
    if (!a && b) issues.push(`exp#${i + 1} added: ${b.company}`);
    if (a && !b) issues.push(`exp#${i + 1} LOST: ${a.company}`);
    if (a && b) {
      if (a.company && !b.company) issues.push(`exp#${i + 1} company cleared`);
      if (a.startDate && !b.startDate) issues.push(`exp#${i + 1} startDate lost (${a.company})`);
      if (a.duration && !b.duration && b.current === a.current)
        issues.push(`exp#${i + 1} duration lost (${a.company})`);
      if (!a.current && b.current && a.startDate === b.startDate)
        issues.push(`exp#${i + 1} incorrectly marked current (${b.company})`);
    }
  }
  return issues;
}

function attachTransitions(stages: StageReport[]): void {
  for (let i = 1; i < stages.length; i++) {
    const issues = [
      ...diffExp(stages[i - 1].experience, stages[i].experience),
      ...(stages[i - 1].counts.skills !== stages[i].counts.skills
        ? [`skills ${stages[i - 1].counts.skills} → ${stages[i].counts.skills}`]
        : []),
      ...(stages[i - 1].counts.achievements !== stages[i].counts.achievements
        ? [
            `achievements ${stages[i - 1].counts.achievements} → ${stages[i].counts.achievements}`,
          ]
        : []),
    ];
    stages[i].transitions = issues.length ? issues : ['OK'];
  }
}

async function main() {
  mkdirSync(outDir, { recursive: true });

  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(readFileSync(pdfPath)));
  const prep = prepareResumeTextForParsing(rawPdfText);
  writeFileSync(resolve(outDir, '01-raw-text.txt'), prep.text, 'utf8');

  const sections = detectResumeSections(prep.text);
  writeFileSync(
    resolve(outDir, '02-sections.json'),
    JSON.stringify(
      {
        keys: Object.keys(sections),
        coverage: sections.coverage,
        profile: sections.documentProfile,
        sectionLengths: Object.fromEntries(
          Object.entries(sections).map(([k, v]) => [
            k,
            typeof v === 'string' ? v.length : Array.isArray(v) ? v.length : typeof v,
          ])
        ),
      },
      null,
      2
    ),
    'utf8'
  );

  const pipeline = runCustomParserPipeline(prep.text);
  const extracted = pipeline.validation.resume as Record<string, unknown>;
  const pi = (extracted.personalInfo || {}) as Record<string, unknown>;
  writeFileSync(resolve(outDir, '03-custom-parser.json'), JSON.stringify(extracted, null, 2), 'utf8');

  const canonical = buildCanonicalResumeFromValidation(pipeline.validation) as Record<
    string,
    unknown
  >;

  const uploadRaw = mapExtractedToUploadProfile(extracted, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  uploadRaw.customParserUsed = true;
  uploadRaw.rawText = prep.text;

  const uploadNorm = normalizeUploadProfile(uploadRaw) as Record<string, unknown>;
  const { data: repaired, warnings: repairWarnings } = validateAndRepairResumeExtraction({
    ...uploadNorm,
    rawText: prep.text,
    customParserUsed: true,
  });

  const builder = transformImportDataToBuilder({
    ...repaired,
    rawText: prep.text,
    customParserUsed: true,
    _imported: true,
  }) as Record<string, unknown>;

  const session = prepareBuilderSessionPayload({
    ...coalesceBuilderImportPayload({ ...repaired, builderFormData: builder }),
    _imported: true,
    rawText: prep.text,
    customParserUsed: true,
  });

  const editor = normalizeImportedFormForEditor(
    coalesceBuilderImportPayload(session as Record<string, unknown>)
  );

  const renderCoalesced = coalesceFormDataForTemplateRender(editor);
  const renderOptimized = optimizeResumeDataForRender(renderCoalesced, {
    mode: 'preview',
    templateId: 'charcoal-orange-executive',
  });

  const html = readFileSync(
    resolve('public/templates/charcoal-orange-executive/index.html'),
    'utf8'
  );
  const injected = injectResumeData(html, editor, {
    templateId: 'charcoal-orange-executive',
    mode: 'preview',
  });
  const durations = [...injected.matchAll(/class="duration">([^<]+)/g)].map((m) => m[1]);
  const expItemCount = (injected.match(/class="experience-item"/g) || []).length;

  const stages: StageReport[] = [
    stage('01 Raw PDF text', { rawText: prep.text }),
    stage('02 Section detection', {
      experience: [],
      summary: sections.summary || sections.preamble,
      skills: sections.skills,
    }),
    stage('03 Custom parser', { ...extracted, ...pi, experience: extracted.experience }),
    stage('04 Canonical resume', {
      experience: canonical.experience,
      education: canonical.education,
      skills: canonical.skills,
      projects: canonical.projects,
      certifications: canonical.certifications,
      languages: canonical.languages,
      achievements: canonical.achievements,
      fullName: canonical.identity?.fullName,
    }),
    stage('05 Upload profile (mapped)', uploadRaw),
    stage('06 Upload profile (normalized)', uploadNorm),
    stage('07 Extraction repair', repaired as Record<string, unknown>, repairWarnings),
    stage('08 Builder FormData', builder),
    stage('09 Session payload', session as Record<string, unknown>),
    stage('10 Editor normalized', editor),
    stage('11 Render coalesced', renderCoalesced),
    stage('12 Render optimized', renderOptimized as Record<string, unknown>),
    stage('13 Live preview HTML', {
      experience: durations.map((d, i) => ({
        company: `item-${i + 1}`,
        Duration: d,
        duration: d,
      })),
    }),
  ];

  attachTransitions(stages);

  const integrityAlone = applyRenderSectionIntegrity({
    experience: (editor.experience as Record<string, unknown>[]) || [],
    projects: [],
    achievements: Array.isArray(editor.achievements) ? editor.achievements : [],
  });

  const report = {
    pdfPath,
    generatedAt: new Date().toISOString(),
    ocrUsed: prep.usedOcr ?? false,
    readingOrder: prep.documentProfile,
    stages,
    renderMetrics: {
      experienceItemsInHtml: expItemCount,
      durationsInHtml: durations,
      integrityExpCount: integrityAlone.experience.length,
      editorExpCount: (editor.experience as unknown[])?.length ?? 0,
    },
    openAiPath: 'skipped — custom-parser-only production path for this upload',
  };

  writeFileSync(resolve(outDir, 'pipeline-report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('='.repeat(72));
  console.log('SSY PRODUCTION PIPELINE AUDIT');
  console.log('='.repeat(72));
  console.log('PDF:', pdfPath);
  console.log('OCR:', prep.usedOcr ?? false);
  console.log('Raw text chars:', prep.text.length);
  console.log('\nSTAGE SUMMARY');
  console.log(
    'Stage'.padEnd(28),
    'Exp'.padStart(4),
    'Edu'.padStart(4),
    'Skills'.padStart(6),
    'Certs'.padStart(6),
    'Lang'.padStart(5),
    'Ach'.padStart(4)
  );
  for (const s of stages) {
    console.log(
      s.stage.padEnd(28),
      String(s.counts.experience ?? 0).padStart(4),
      String(s.counts.education ?? 0).padStart(4),
      String(s.counts.skills ?? 0).padStart(6),
      String(s.counts.certifications ?? 0).padStart(6),
      String(s.counts.languages ?? 0).padStart(5),
      String(s.counts.achievements ?? 0).padStart(4)
    );
  }

  console.log('\nTRANSITIONS (non-OK only)');
  for (const s of stages) {
    if (!s.transitions || s.transitions.every((t) => t === 'OK')) continue;
    console.log(`\n→ ${s.stage}`);
    s.transitions.filter((t) => t !== 'OK').forEach((t) => console.log('  ⚠', t));
  }

  console.log('\nIDENTITY (builder vs render)');
  console.log('Builder:', identityOf(builder));
  console.log('Editor:', identityOf(editor));

  console.log('\nRENDER');
  console.log('Editor experience:', (editor.experience as unknown[])?.length);
  console.log('Integrity filter:', integrityAlone.experience.length);
  console.log('HTML experience-item:', expItemCount);
  console.log('HTML durations:', durations.join(' | '));

  console.log('\nSKILLS (builder):', skillsOf(builder).join(', '));
  console.log('\nReport written to', resolve(outDir, 'pipeline-report.json'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
