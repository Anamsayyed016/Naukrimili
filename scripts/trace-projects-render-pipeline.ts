/**
 * Full projects render pipeline trace — run: npx tsx scripts/trace-projects-render-pipeline.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  coalesceFormDataForTemplateRender,
  filterMeaningfulProjects,
  optimizeResumeDataForRender,
  shouldPreserveFullContentForRender,
} from '../lib/resume-builder/section-visibility';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const FORM = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  _imported: true,
  _userEdited: true,
  projects: [
    {
      name: 'Naukrimili Job Portal',
      description: 'Full-stack hiring platform with Next.js and PostgreSQL.',
      technologies: 'Next.js, PostgreSQL, React',
    },
    {
      name: 'Cafe Zafran Restaurant Website',
      description: 'Restaurant website with menu, reservations, and online ordering.',
      technologies: 'React, Node.js',
    },
  ],
  experience: [{ title: 'Developer', company: 'Acme', description: 'Built APIs' }],
};

const TEMPLATES = [
  'ivory-boardroom-executive',
  'luxe-executive',
  'royal-copper-executive',
  'elegant-ivory',
];

function names(data: Record<string, unknown>): string[] {
  const raw = Array.isArray(data.projects)
    ? data.projects
    : Array.isArray(data.Projects)
      ? data.Projects
      : [];
  return (raw as Record<string, unknown>[])
    .map((p) => String(p.name ?? p.Name ?? '').trim())
    .filter(Boolean);
}

function count(data: Record<string, unknown>): number {
  return names(data).length;
}

function row(
  stage: string,
  data: Record<string, unknown>,
  html: string,
  reason: string,
  prev: number
): void {
  const c = count(data);
  const items = (html.match(/\bproject-item\b/gi) || []).length;
  console.log(
    `${stage} | ${c} | ${names(data).join('; ') || '(none)'} | ${items > 0 ? 'yes' : 'no'} | ${html.includes('project-item') ? 'yes' : 'no'} | ${c < prev ? reason : c > prev ? 'added' : 'ok'}`
  );
}

console.log('Stage | Count | Names | HTML Generated | Section Present | Reason');
console.log('-'.repeat(100));

let prev = count(FORM);
row('1 editor form state', FORM, '', 'input', prev);
prev = count(FORM);

const coalesced = coalesceFormDataForTemplateRender(FORM);
row('3 coalesceFormDataForTemplateRender', coalesced, '', 'coalesce+integrity', prev);
prev = count(coalesced);

const preserve = shouldPreserveFullContentForRender(coalesced, { galleryPreview: false });
const optimizedLive = optimizeResumeDataForRender(coalesced, { preserveFullContent: preserve });
row('6 optimizeResumeDataForRender (live)', optimizedLive, '', `preserve=${preserve}`, prev);
prev = count(optimizedLive);

const filtered = filterMeaningfulProjects(
  (Array.isArray(coalesced.projects) ? coalesced.projects : []) as Array<Record<string, unknown>>
);
row('6b filterMeaningfulProjects', { projects: filtered }, '', 'pre-render gate', prev);

for (const tid of TEMPLATES) {
  const htmlPath = resolve('public/templates', tid, 'index.html');
  const htmlTemplate = readFileSync(htmlPath, 'utf8');
  const hasPlaceholder = /\{\{PROJECTS\}\}|\{\{#if PROJECTS\}\}/.test(htmlTemplate);
  const outGallery = injectResumeData(htmlTemplate, FORM, {
    galleryPreview: true,
    galleryTemplateId: tid,
    templateId: tid,
  });
  const outLive = injectResumeData(htmlTemplate, FORM, {
    templateId: tid,
    mode: 'preview',
  });
  const itemsG = (outGallery.match(/\bproject-item\b/gi) || []).length;
  const itemsL = (outLive.match(/\bproject-item\b/gi) || []).length;
  console.log(
    `TEMPLATE ${tid} | placeholder=${hasPlaceholder} | gallery items=${itemsG} | live items=${itemsL} | ${itemsG >= 2 && itemsL >= 2 ? 'PASS' : 'FAIL'}`
  );
}
