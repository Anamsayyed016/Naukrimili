import { coalesceBuilderImportPayload } from '../lib/resume-builder/import-transformer';
import { coalesceFormDataForTemplateRender } from '../lib/resume-builder/section-visibility';

const RAW = [
  'WORK EXPERIENCE',
  'Full Stack Developer                 Digital Solutions Pvt Ltd',
  'Bhopal                               2022-01 - Present',
  '- Designed secure APIs.',
  'PROJECTS',
  'Job Portal Application',
  'Built a full-stack job portal with Next.js',
].join('\n');

const apiPayload = {
  rawText: RAW,
  firstName: 'Anam',
  lastName: 'Sayyed',
  experience: [
    { title: 'Full Stack Developer', location: 'Bhopal', startDate: '2022-01', current: true },
  ],
  projects: [],
  builderFormData: {
    firstName: 'Anam',
    lastName: 'Sayyed',
    experience: [
      {
        title: 'Full Stack Developer',
        company: '',
        location: 'Bhopal',
        startDate: '2022-01',
        current: true,
      },
    ],
    projects: [],
  },
};

const coalesced = coalesceBuilderImportPayload(apiPayload);
console.log('nested coalesce company:', coalesced.experience?.[0]?.company);
console.log('nested coalesce desc:', String(coalesced.experience?.[0]?.description || '').slice(0, 60));
console.log('nested coalesce projects:', coalesced.projects?.length, coalesced.projects?.[0]?.name);

const render = coalesceFormDataForTemplateRender(coalesced);
console.log('render company:', (render.experience as Record<string, unknown>[])?.[0]?.company);
console.log('render projects:', (render.projects as unknown[])?.length);
