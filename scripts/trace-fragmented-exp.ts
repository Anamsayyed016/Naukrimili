/**
 * Trace fragmented experience rows (production-like) through coalesce + render.
 */
import { coalesceBuilderImportPayload } from '../lib/resume-builder/import-transformer';
import { coalesceFormDataForTemplateRender } from '../lib/resume-builder/section-visibility';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const RAW_TEXT = [
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
].join('\n');

/** Simulates parser output that lands company=Python/Bhopal in wrong slots */
const FRAGMENTED = {
  _imported: true,
  firstName: 'Anam',
  lastName: 'Sayyed',
  jobTitle: 'Python Developer',
  summary: 'Highly motivated Full-Stack Python Developer.',
  rawText: RAW_TEXT,
  experience: [
    { company: 'Python', position: 'Full stack developer', startDate: '2022-01', endDate: 'Present' },
    { company: 'Bhopal', position: 'Full stack developer', startDate: '2020-02', endDate: '2022-01' },
    { company: 'Bhopal', position: 'Python Developer' },
    {
      company: 'Bhopal, Madhya',
      position: 'Full Stack Python Developer',
      startDate: '2022',
      endDate: '2024',
      description: 'Wrote clean, secure code with excellent UI design.',
      achievements: ['Wrote clean, secure code with excellent UI design.'],
    },
    {
      position: 'Full stack developer',
      startDate: '2020',
      endDate: '2022',
      description: 'Led design and development of full-stack web applications.',
      achievements: ['Led design and development of full-stack web applications.'],
    },
  ],
  education: [
    { institution: 'Barkatullah University', degree: 'MBA', year: '2022' },
  ],
  skills: ['Python', 'Django', 'React'],
};

function show(label: string, data: Record<string, unknown>) {
  const exp = Array.isArray(data.experience) ? data.experience : [];
  console.log(`\n=== ${label} (${exp.length} rows) ===`);
  exp.forEach((e: Record<string, unknown>, i: number) => {
    console.log({
      i,
      company: e.company,
      position: e.position || e.title,
      desc: String(e.description || '').slice(0, 50),
      bullets: Array.isArray(e.achievements) ? e.achievements.length : 0,
    });
  });
  const html = injectResumeData('<body>{{EXPERIENCE}}</body>', data, {
    templateId: 'slate-executive-pro',
  });
  const companies = [...html.matchAll(/class="company"[^>]*>([^<]+)/g)].map((m) => m[1]);
  console.log('template companies:', companies);
}

const coalesced = coalesceBuilderImportPayload(FRAGMENTED);
show('coalesceBuilderImportPayload', coalesced);

const renderReady = coalesceFormDataForTemplateRender(coalesced);
show('coalesceFormDataForTemplateRender', renderReady);

// Without customParserUsed flag
const noFlag = { ...FRAGMENTED };
delete (noFlag as Record<string, unknown>).customParserUsed;
show('no customParserUsed (coalesce only)', coalesceBuilderImportPayload(noFlag));
