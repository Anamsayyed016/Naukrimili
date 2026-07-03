/**
 * READ-ONLY template binding audit — all premium templates vs Builder fixture.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { coalesceFormDataForTemplateRender } from '../lib/resume-builder/section-visibility';

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

const parser = runCustomParserPipeline(prepareResumeTextForParsing(ANAM).text).validation.resume;
const upload = normalizeUploadProfile(
  mapExtractedToUploadProfile(parser, { aiProvider: 'custom-parser' })
);
const builder = transformImportDataToBuilder({
  ...upload,
  customParserUsed: true,
  selectedParser: 'custom',
  _aiProvider: 'custom-parser',
  rawText: ANAM,
}) as Record<string, unknown>;

const coalesced = coalesceFormDataForTemplateRender(builder);

type Counts = {
  exp: number;
  companies: number;
  descriptions: number;
  edu: number;
  proj: number;
  projDesc: number;
  projTech: number;
  skills: number;
};

function countHtml(html: string): Counts {
  const companies = [...html.matchAll(/class="company"[^>]*>([^<]+)/g)].map((m) => m[1].trim());
  const projDesc = (html.match(/class="description"/g) || []).length;
  const projTech = (html.match(/class="technologies"/g) || []).length;
  const skillTags = (html.match(/class="skill-tag"/g) || []).length;
  return {
    exp: (html.match(/class="experience-item"/g) || []).length,
    companies: companies.filter(Boolean).length,
    descriptions: (html.match(/experience-item[\s\S]*?class="description"/g) || []).length,
    edu: (html.match(/class="education-item"/g) || []).length,
    proj: (html.match(/class="project-item"/g) || []).length,
    projDesc,
    projTech,
    skills: skillTags,
  };
}

const builderCounts = {
  exp: (builder.experience as unknown[])?.length ?? 0,
  edu: (builder.education as unknown[])?.length ?? 0,
  proj: (builder.projects as unknown[])?.length ?? 0,
  skills: (builder.skills as unknown[])?.length ?? 0,
  companies: (builder.experience as Record<string, unknown>[])?.filter((e) =>
    String(e.company || '').trim()
  ).length,
};

console.log('BUILDER:', builderCounts);
console.log(
  'COALESCED companies:',
  (coalesced.experience as Record<string, unknown>[])?.map((e) => e.company)
);
console.log(
  'COALESCED project tech:',
  (coalesced.projects as Record<string, unknown>[])?.map((p) => p.technologies)
);

const templatesJson = JSON.parse(
  readFileSync(join(process.cwd(), 'lib/resume-builder/templates.json'), 'utf8')
);
const templates = templatesJson.templates as { id: string; html: string }[];

const mini = '<html><body>{{EXPERIENCE}}{{PROJECTS}}{{EDUCATION}}{{SKILLS}}</body></html>';
const miniHtml = injectResumeData(mini, builder, { templateId: 'platinum-executive-edge' });
console.log('\nMINI TEMPLATE COUNTS:', countHtml(miniHtml));

const failures: string[] = [];

for (const t of templates) {
  const htmlPath = join(process.cwd(), 'public', t.html.replace(/^\//, ''));
  let body: string;
  try {
    const full = readFileSync(htmlPath, 'utf8');
    const m = full.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    body = m ? m[1] : full;
  } catch {
    failures.push(`${t.id}: cannot read HTML`);
    continue;
  }

  const rendered = injectResumeData(body, builder, { templateId: t.id });
  const c = countHtml(rendered);

  const issues: string[] = [];
  if (c.exp < builderCounts.exp) issues.push(`exp ${c.exp}<${builderCounts.exp}`);
  if (c.companies < builderCounts.companies)
    issues.push(`companies ${c.companies}<${builderCounts.companies}`);
  if (c.edu < builderCounts.edu) issues.push(`edu ${c.edu}<${builderCounts.edu}`);
  if (c.proj < builderCounts.proj) issues.push(`proj ${c.proj}<${builderCounts.proj}`);
  if (builderCounts.proj > 0 && c.projDesc === 0) issues.push('projDesc missing');
  if (builderCounts.proj > 0 && c.projTech === 0) issues.push('projTech missing');

  const status = issues.length ? `FAIL: ${issues.join(', ')}` : 'OK';
  if (issues.length) failures.push(`${t.id}: ${issues.join(', ')}`);
  console.log(`${t.id.padEnd(35)} exp=${c.exp} co=${c.companies} edu=${c.edu} proj=${c.proj} tech=${c.projTech} | ${status}`);
}

console.log('\n--- SYNC AFTER COALESCE (pre-inject) ---');
const syncedExp = coalesced.experience as Record<string, unknown>[];
syncedExp?.forEach((e, i) => {
  console.log(`exp#${i + 1} company="${e.company}" title="${e.title || e.position}" desc="${String(e.description || '').slice(0, 40)}" bullets=${Array.isArray(e.achievements) ? e.achievements.length : 0}`);
});

if (failures.length) {
  console.log('\n❌ FAILURES:', failures.length);
  failures.forEach((f) => console.log(' ', f));
  process.exit(1);
}
console.log('\n✓ All templates pass binding audit');
