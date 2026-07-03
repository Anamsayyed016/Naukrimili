/**
 * READ-ONLY end-to-end pipeline audit — every stage, every count.
 */
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

type Snapshot = {
  stage: string;
  expCount: number;
  eduCount: number;
  projCount: number;
  skillCount: number;
  companies: string[];
  projectNames: string[];
  eduInstitutions: string[];
  skills: string[];
  projectDetails: { name: string; desc: string; tech: string }[];
};

function skillsList(data: Record<string, unknown>): string[] {
  const raw = data.skills ?? data.Skills ?? data.technicalSkills;
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => String(s).trim()).filter(Boolean);
}

function snap(stage: string, data: Record<string, unknown>): Snapshot {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  const edus = Array.isArray(data.education) ? data.education : [];
  const projs = Array.isArray(data.projects) ? data.projects : [];
  const skills = skillsList(data);

  return {
    stage,
    expCount: exps.length,
    eduCount: edus.length,
    projCount: projs.length,
    skillCount: skills.length,
    companies: exps.map((e: Record<string, unknown>) =>
      String(e.company ?? e.Company ?? e.organization ?? '').trim()
    ),
    projectNames: projs.map((p: Record<string, unknown>) =>
      String(p.name ?? p.title ?? '').trim()
    ),
    eduInstitutions: edus.map((e: Record<string, unknown>) =>
      String(e.institution ?? e.school ?? '').trim()
    ),
    skills,
    projectDetails: projs.map((p: Record<string, unknown>) => {
      const tech = p.technologies ?? p.Technologies ?? p.tech_stack;
      return {
        name: String(p.name ?? p.title ?? ''),
        desc: String(p.description ?? p.summary ?? '').slice(0, 80),
        tech: Array.isArray(tech) ? tech.join(', ') : String(tech ?? ''),
      };
    }),
  };
}

function printSnap(s: Snapshot) {
  console.log(`\n--- ${s.stage} ---`);
  console.log(
    `exp=${s.expCount} edu=${s.eduCount} proj=${s.projCount} skills=${s.skillCount}`
  );
  console.log('companies:', s.companies.join(' | ') || '(none)');
  console.log('projects:', s.projectNames.join(' | ') || '(none)');
  console.log('education:', s.eduInstitutions.join(' | ') || '(none)');
  s.projectDetails.forEach((p, i) =>
    console.log(`  proj#${i + 1} desc="${p.desc}" tech="${p.tech}"`)
  );
  console.log('skills:', s.skills.join(', '));
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
    if (a && !b) issues.push(`exp#${i + 1} company lost: "${a}"→""`);
    else if (a !== b && b) issues.push(`exp#${i + 1} company changed: "${a}"→"${b}"`);
  }

  for (let i = 0; i < Math.max(prev.projectDetails.length, curr.projectDetails.length); i++) {
    const a = prev.projectDetails[i];
    const b = curr.projectDetails[i];
    if (!a && b) issues.push(`project#${i + 1} added`);
    if (a && !b) issues.push(`project#${i + 1} "${a.name}" DROPPED`);
    if (a && b) {
      if (a.name && !b.name) issues.push(`project#${i + 1} name lost`);
      if (a.desc && !b.desc) issues.push(`project#${i + 1} description lost`);
      if (a.tech && !b.tech) issues.push(`project#${i + 1} technologies lost`);
    }
  }

  const lostSkills = prev.skills.filter((s) => !curr.skills.some((c) => c.toLowerCase() === s.toLowerCase()));
  if (lostSkills.length) issues.push(`skills lost: ${lostSkills.join(', ')}`);

  return issues;
}

// Pipeline
const pipeline = runCustomParserPipeline(prepareResumeTextForParsing(ANAM).text);
const extracted = pipeline.validation.resume as Record<string, unknown>;
const canonical = buildCanonicalResumeFromValidation(pipeline.validation) as Record<string, unknown>;

const uploadRaw = mapExtractedToUploadProfile(extracted, { aiProvider: 'custom-parser' }) as Record<
  string,
  unknown
>;
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
  rawText: ANAM,
};

const builder = transformImportDataToBuilder(profile) as Record<string, unknown>;
const render = optimizeResumeDataForRender(builder) as Record<string, unknown>;

// Upload page path: API returns profile + nested builderFormData
const apiProfile = {
  ...profile,
  experience: uploadNorm.experience,
  education: uploadNorm.education,
  projects: uploadNorm.projects,
  builderFormData: builder,
};
const coalesced = coalesceBuilderImportPayload(apiProfile as Record<string, unknown>) as Record<
  string,
  unknown
>;

const html = injectResumeData(
  '<html><body>{{EXPERIENCE}}{{PROJECTS}}{{EDUCATION}}{{SKILLS}}</body></html>',
  coalesced
);
const templateCompanies = [...html.matchAll(/class="company"[^>]*>([^<]+)/g)].map((m) => m[1].trim());

const stages: Snapshot[] = [
  snap('1 Custom Parser (ExtractedResumeData)', extracted),
  snap('2 Canonical Resume', {
    experience: canonical.experience,
    education: canonical.education,
    projects: canonical.projects,
    skills: canonical.skills,
  }),
  snap('3 mapExtractedToUploadProfile', uploadRaw),
  snap('4 normalizeUploadProfile', uploadNorm as Record<string, unknown>),
  snap('5 validateAndRepairResumeExtraction', repaired as Record<string, unknown>),
  snap('6 transformImportDataToBuilder', builder),
  snap('7 optimizeResumeDataForRender', render),
  snap('8 coalesceBuilderImportPayload (upload→sessionStorage)', coalesced),
];

console.log('='.repeat(72));
console.log('END-TO-END PIPELINE AUDIT');
console.log('='.repeat(72));

for (const s of stages) printSnap(s);

console.log('\n' + '='.repeat(72));
console.log('STAGE-TO-STAGE DIFF (first failure per transition)');
console.log('='.repeat(72));

let firstFailure: { from: string; to: string; issues: string[] } | null = null;

for (let i = 1; i < stages.length; i++) {
  const issues = diffStages(stages[i - 1], stages[i]);
  if (issues.length) {
    console.log(`\n${stages[i - 1].stage} → ${stages[i].stage}:`);
    issues.forEach((x) => console.log(`  ⚠ ${x}`));
    if (!firstFailure) {
      firstFailure = { from: stages[i - 1].stage, to: stages[i].stage, issues };
    }
  } else {
    console.log(`\n✓ ${stages[i - 1].stage} → ${stages[i].stage}: OK`);
  }
}

console.log('\n--- 9 Template rendered company spans ---');
console.log('companies:', templateCompanies.join(' | ') || '(none)');
console.log('experience-item count:', (html.match(/experience-item/g) || []).length);

console.log('\n' + '='.repeat(72));
console.log('SUMMARY TABLE');
console.log('='.repeat(72));
console.log('Stage'.padEnd(45), 'Exp', 'Edu', 'Proj', 'Skills');
for (const s of stages) {
  console.log(
    s.stage.padEnd(45),
    String(s.expCount).padStart(3),
    String(s.eduCount).padStart(3),
    String(s.projCount).padStart(3),
    String(s.skillCount).padStart(3)
  );
}

if (firstFailure) {
  console.log('\n❌ FIRST FAILURE:', firstFailure.from, '→', firstFailure.to);
  firstFailure.issues.forEach((x) => console.log('   ', x));
  process.exit(1);
} else {
  console.log('\n✓ All stages preserve counts and key fields');
  process.exit(0);
}
