/**
 * Forensic trace: projects through gallery render pipeline for premium templates.
 * Run: npx tsx scripts/trace-gallery-projects-forensic.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { coalesceFormDataForTemplateRender, filterMeaningfulProjects } from '../lib/resume-builder/section-visibility';
import { injectResumeData } from '../lib/resume-builder/template-loader';

type Row = {
  stage: string;
  count: number;
  names: string[];
  htmlLen: number;
  present: boolean;
  changed: boolean;
  reason: string;
};

const SAMPLE_IMPORT = {
  firstName: 'Anam',
  lastName: 'Sayyed',
  email: 'anamsayyed58@gmail.com',
  _imported: true,
  customParserUsed: true,
  projects: [
    {
      name: 'Job Portal Application',
      description: 'Built a full-stack job portal with Next.js and PostgreSQL.',
      technologies: 'Next.js, PostgreSQL, React',
    },
    {
      name: 'Mobile App for Inventory Tracking',
      description: 'Flask API and React dashboard for warehouse stock levels.',
    },
  ],
  experience: [
    {
      title: 'Python Developer',
      company: 'Digital Solutions Pvt Ltd',
      description: 'Designed secure RESTful APIs using Django and Flask.',
    },
  ],
};

const TEMPLATES = [
  'ivory-boardroom-executive',
  'luxe-executive',
  'royal-copper-executive',
];

function projectNames(data: Record<string, unknown>): string[] {
  const raw = Array.isArray(data.projects)
    ? data.projects
    : Array.isArray(data.Projects)
      ? data.Projects
      : [];
  return (raw as Record<string, unknown>[])
    .map((p) => String(p.name ?? p.Name ?? p.title ?? '').trim())
    .filter(Boolean);
}

function traceTemplate(templateId: string, formData: Record<string, unknown>): Row[] {
  const htmlPath = resolve('public/templates', templateId, 'index.html');
  const htmlTemplate = readFileSync(htmlPath, 'utf8');
  const rows: Row[] = [];
  let prevCount = projectNames(formData).length;

  const push = (
    stage: string,
    data: Record<string, unknown>,
    html: string,
    reason: string
  ) => {
    const count = projectNames(data).length;
    const names = projectNames(data);
    const present = /\bproject-item\b/i.test(html);
    rows.push({
      stage,
      count,
      names,
      htmlLen: (html.match(/\bproject-item\b/gi) || []).length,
      present,
      changed: count !== prevCount,
      reason,
    });
    prevCount = count;
  };

  push('0 formData (builder)', formData, '', 'input');

  const coalesced = coalesceFormDataForTemplateRender(formData);
  push('6 coalesceFormDataForTemplateRender', coalesced, '', 'recover + integrity');

  const filtered = filterMeaningfulProjects(
    (Array.isArray(coalesced.projects) ? coalesced.projects : []) as Array<Record<string, unknown>>
  );
  push(
    '6b filterMeaningfulProjects',
    { ...coalesced, projects: filtered, Projects: filtered },
    '',
    'render gate'
  );

  const out = injectResumeData(htmlTemplate, formData, {
    galleryPreview: true,
    galleryTemplateId: templateId,
    templateId,
  });
  push('15 injectResumeData (gallery)', coalesced, out, 'full pipeline');

  return rows;
}

function printMatrix(templateId: string, rows: Row[]) {
  console.log(`\n${'='.repeat(72)}\nTEMPLATE: ${templateId}\n${'='.repeat(72)}`);
  console.log('Stage | Count | Names | Present? | Changed? | Reason');
  console.log('-'.repeat(72));
  for (const r of rows) {
    console.log(
      `${r.stage} | ${r.count} | ${r.names.join('; ') || '(none)'} | ${r.present ? 'yes' : 'no'} | ${r.changed ? 'YES' : 'no'} | ${r.reason} | items:${r.htmlLen}`
    );
  }
}

function main() {
  for (const tid of TEMPLATES) {
    printMatrix(tid, traceTemplate(tid, SAMPLE_IMPORT));
  }
}

main();
