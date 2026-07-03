/**
 * READ-ONLY trace: company, education, projects at every pipeline stage.
 */
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import { finalizeExperienceListForCustomParserImport } from '../lib/resume-parser/import-sanitize';
import { optimizeResumeDataForRender } from '../lib/resume-builder/section-visibility';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { coalesceBuilderImportPayload } from '../lib/resume-builder/import-transformer';

const ANAM = [
  'ANAM SAYYED                          SKILLS',
  'Python Developer                     Python, Django, ReactJS, HTML, CSS',
  'anamsayyed58@gmail.com | 7415566841  JavaScript, Node.js, MySQL, Git',
  'Bhopal, Madhya Pradesh               REST API, MongoDB, Firebase, AWS',
  'linkedin.com/in/anam-sayyed',
  '',
  'PROFESSIONAL SUMMARY',
  'Highly motivated Full-Stack Python Developer with expertise in Python, Django, and ReactJS.',
  '',
  'WORK EXPERIENCE',
  'Python Developer                     Digital Solutions Pvt Ltd',
  'Bhopal, Madhya Pradesh               2022-01 - Present',
  '- Designed secure, scalable RESTful APIs using Django and Flask.',
  '',
  'Full Stack Developer                 Digital',
  'Bhopal, Madhya Pradesh               2020-02 - 2022-01',
  '- Led design and development of full-stack web applications.',
  '',
  'Full Stack Python Developer          Cybrom Technology',
  'Bhopal                               2019 - 2020',
  '- Wrote clean, secure code with excellent UI design.',
  '',
  'PROJECTS',
  'Job Portal Application',
  'Built a full-stack job portal with Next.js and PostgreSQL',
  '',
  'EDUCATION',
  "All Saints' College of Technology",
  'B.Tech Computer Science',
  '2016 - 2020',
  '',
  'Barkatullah University',
  'Master of Business Administration (MBA)',
  '2020 - 2022',
].join('\n');

type Stage = { name: string; experience: unknown[]; education: unknown[]; projects: unknown[] };

function snap(data: Record<string, unknown>, name: string): Stage {
  return {
    name,
    experience: Array.isArray(data.experience) ? data.experience : [],
    education: Array.isArray(data.education) ? data.education : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
  };
}

function expRow(e: Record<string, unknown>, i: number) {
  return {
    i,
    company: String(e.company ?? e.Company ?? ''),
    position: String(e.position ?? e.title ?? ''),
    location: String(e.location ?? ''),
    startDate: String(e.startDate ?? ''),
    endDate: String(e.endDate ?? ''),
    desc: String(e.description ?? '').slice(0, 60),
    bullets: Array.isArray(e.achievements) ? e.achievements.length : 0,
  };
}

function eduRow(e: Record<string, unknown>, i: number) {
  return {
    i,
    institution: String(e.institution ?? e.school ?? ''),
    degree: String(e.degree ?? ''),
    field: String(e.field ?? ''),
    year: String(e.year ?? e.endDate ?? ''),
    gpa: String(e.gpa ?? ''),
  };
}

function projRow(p: Record<string, unknown>, i: number) {
  const tech = p.technologies ?? p.Technologies;
  return {
    i,
    name: String(p.name ?? p.title ?? ''),
    desc: String(p.description ?? '').slice(0, 60),
    tech: Array.isArray(tech) ? tech.join(',') : String(tech ?? ''),
    url: String(p.url ?? p.link ?? ''),
  };
}

function compareStages(prev: Stage, curr: Stage) {
  console.log(`\n${'='.repeat(70)}\nSTAGE: ${curr.name}\n${'='.repeat(70)}`);
  console.log(`Counts: exp ${prev.experience.length}→${curr.experience.length}, edu ${prev.education.length}→${curr.education.length}, proj ${prev.projects.length}→${curr.projects.length}`);

  const maxE = Math.max(prev.experience.length, curr.experience.length);
  for (let i = 0; i < maxE; i++) {
    const a = prev.experience[i] as Record<string, unknown> | undefined;
    const b = curr.experience[i] as Record<string, unknown> | undefined;
    if (!a || !b) {
      console.log(`  EXP #${i + 1}: ${a ? 'DROPPED' : 'ADDED'}`);
      continue;
    }
    const pa = expRow(a, i);
    const pb = expRow(b, i);
    for (const k of Object.keys(pa) as (keyof typeof pa)[]) {
      if (k === 'i') continue;
      if (pa[k] !== pb[k]) {
        console.log(`  ⚠ EXP #${i + 1} ${k} @ ${curr.name}: "${pa[k]}" → "${pb[k]}"`);
      }
    }
  }

  const maxEd = Math.max(prev.education.length, curr.education.length);
  for (let i = 0; i < maxEd; i++) {
    const a = prev.education[i] as Record<string, unknown> | undefined;
    const b = curr.education[i] as Record<string, unknown> | undefined;
    if (!a || !b) {
      console.log(`  EDU #${i + 1}: ${a ? 'DROPPED' : 'ADDED'} at ${curr.name}`);
      if (a) console.log('    was:', JSON.stringify(eduRow(a, i)));
      if (b) console.log('    now:', JSON.stringify(eduRow(b, i)));
      continue;
    }
    const pa = eduRow(a, i);
    const pb = eduRow(b, i);
    for (const k of Object.keys(pa) as (keyof typeof pa)[]) {
      if (k === 'i') continue;
      if (pa[k] !== pb[k]) {
        console.log(`  ⚠ EDU #${i + 1} ${k} @ ${curr.name}: "${pa[k]}" → "${pb[k]}"`);
      }
    }
  }

  const maxP = Math.max(prev.projects.length, curr.projects.length);
  for (let i = 0; i < maxP; i++) {
    const a = prev.projects[i] as Record<string, unknown> | undefined;
    const b = curr.projects[i] as Record<string, unknown> | undefined;
    if (!a || !b) {
      console.log(`  PROJ #${i + 1}: ${a ? 'DROPPED' : 'ADDED'} at ${curr.name}`);
      continue;
    }
    const pa = projRow(a, i);
    const pb = projRow(b, i);
    for (const k of Object.keys(pa) as (keyof typeof pa)[]) {
      if (k === 'i') continue;
      if (pa[k] !== pb[k]) {
        console.log(`  ⚠ PROJ #${i + 1} ${k} @ ${curr.name}: "${pa[k]}" → "${pb[k]}"`);
      }
    }
  }
}

const parser = runCustomParserPipeline(prepareResumeTextForParsing(ANAM).text).validation.resume;
const stages: Stage[] = [snap(parser as Record<string, unknown>, '1 Parser')];

const upload = mapExtractedToUploadProfile(parser, { aiProvider: 'custom-parser' });
(upload as Record<string, unknown>).customParserUsed = true;
(upload as Record<string, unknown>).selectedParser = 'custom';
stages.push(snap(upload, '2 Upload Profile'));

const norm = normalizeUploadProfile(upload);
stages.push(snap(norm, '3 normalizeUploadProfile'));

const { data: repaired } = validateAndRepairResumeExtraction({ ...norm });
stages.push(snap(repaired as Record<string, unknown>, '4 validateAndRepair'));

const profile = {
  ...norm,
  customParserUsed: true,
  selectedParser: 'custom',
  _aiProvider: 'custom-parser',
  rawText: ANAM,
};
const builder = transformImportDataToBuilder(profile);
stages.push(snap(builder as Record<string, unknown>, '5 Builder'));

const render = optimizeResumeDataForRender(builder);
stages.push(snap(render as Record<string, unknown>, '6 Render optimize'));

for (let i = 1; i < stages.length; i++) {
  compareStages(stages[i - 1], stages[i]);
}

console.log('\n=== BUILDER EXPERIENCE FULL ===');
(builder.experience || []).forEach((e: Record<string, unknown>, i: number) =>
  console.log(JSON.stringify(expRow(e, i)))
);
console.log('\n=== BUILDER EDUCATION FULL ===');
(builder.education || []).forEach((e: Record<string, unknown>, i: number) =>
  console.log(JSON.stringify(eduRow(e, i)))
);
console.log('\n=== BUILDER PROJECTS FULL ===');
(builder.projects || []).forEach((p: Record<string, unknown>, i: number) =>
  console.log(JSON.stringify(projRow(p, i)))
);

const html = injectResumeData('<html><body>{{EXPERIENCE}}{{PROJECTS}}{{EDUCATION}}</body></html>', builder);
const companies = [...html.matchAll(/class="company"[^>]*>([^<]+)/g)].map((m) => m[1]);
console.log('\n=== TEMPLATE company spans ===', companies);

// Simulate upload page: API returns profile + nested builderFormData
const apiProfile = {
  ...profile,
  experience: norm.experience,
  education: norm.education,
  projects: norm.projects,
  builderFormData: builder,
};
const coalesced = coalesceBuilderImportPayload(apiProfile as Record<string, unknown>);
console.log('\n=== COALESCE (upload page path) ===');
console.log('exp:', (coalesced.experience as unknown[])?.length, 'edu:', (coalesced.education as unknown[])?.length, 'proj:', (coalesced.projects as unknown[])?.length);
(coalesced.experience as Record<string, unknown>[])?.forEach((e, i) =>
  console.log(`  coalesce exp #${i + 1}: company="${e.company}" title="${e.title || e.position}"`)
);
(coalesced.education as Record<string, unknown>[])?.forEach((e, i) =>
  console.log(`  coalesce edu #${i + 1}: ${e.institution || e.school} | ${e.degree}`)
);
(coalesced.projects as Record<string, unknown>[])?.forEach((p, i) =>
  console.log(`  coalesce proj #${i + 1}: ${p.name}`)
);
