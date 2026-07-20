import { readFileSync } from 'fs';
import { balanceTwoColumnLayout } from '../lib/resume-builder/column-balance-engine';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const tid = 'blush-rose-editorial-minimal';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');

function extractColumn(htmlOut: string, tag: 'aside' | 'main'): string {
  const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'i');
  return (htmlOut.match(re) ?? [''])[0];
}

const baseData = {
  firstName: 'Isabella',
  lastName: 'Chen',
  fullName: 'Isabella Chen',
  jobTitle: 'Lead Product Designer',
  email: 'isabella.chen@example.com',
  phone: '+1 555 0100',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/isabellachen',
  portfolio: 'github.com/isabellachen',
  summary: 'Product designer with 8+ years crafting intuitive digital experiences for enterprise and consumer products.',
  skills: ['Figma', 'UX Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Adobe CC'],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Mandarin', proficiency: 'Fluent' },
  ],
  experience: [
    {
      company: 'TechFlow Inc.',
      title: 'Senior Product Designer',
      startDate: '2020-01',
      endDate: '2024-12',
      achievements: ['Led design system adoption across 4 product teams', 'Increased task completion rate by 32%'],
    },
    {
      company: 'Pixel Studio',
      title: 'Product Designer',
      startDate: '2017-06',
      endDate: '2019-12',
      achievements: ['Shipped mobile app redesign used by 2M+ users'],
    },
  ],
  projects: [
    {
      name: 'Design System Library',
      description: 'Built component library adopted across product suite.',
      technologies: 'React, Figma',
      employer: '2023',
      link: 'https://example.com/project',
    },
    {
      name: 'Mobile Checkout Redesign',
      description: 'Reduced cart abandonment with streamlined flows.',
      technologies: 'Swift, Figma',
      employer: '2022',
    },
  ],
  education: [
    { degree: 'MSc, Human-Computer Interaction', institution: 'University of Washington', year: '2018-2020' },
    { degree: 'BFA, Graphic Design', institution: 'RISD', year: '2014-2018' },
  ],
  certifications: [
    { name: 'Google UX Design Certificate', issuer: 'Google', date: '2021' },
    { name: 'Certified Usability Analyst', issuer: 'HFI', date: '2019' },
  ],
  achievements: ['Design Excellence Award — TechFlow Inc. 2023'],
  hobbies: ['Photography', 'Ceramics'],
  references: [
    { name: 'Alex Rivera', title: 'Design Director', company: 'TechFlow', phone: '+1 555 0300', email: 'alex@techflow.com' },
  ],
};

function render(data: Record<string, unknown>) {
  return injectResumeData(html, data, { templateId: tid, mode: 'preview' });
}

const out = render(baseData);
const aside = extractColumn(out, 'aside');
const main = extractColumn(out, 'main');

const checks: Array<[string, boolean]> = [
  ['Has blush sidebar', /brem-sidebar/.test(out)],
  ['Has stacked name-first Isabella', out.includes('class="name-first">Isabella<')],
  ['Has name-last Chen', out.includes('class="name-last">Chen<')],
  ['Profile lives in sidebar', /<aside[\s\S]*Product designer with[\s\S]*<\/aside>/i.test(out)],
  ['Projects live in sidebar', /<aside[\s\S]*brem-section--projects[\s\S]*<\/aside>/i.test(out)],
  ['Projects absent from main', !/brem-section--projects/.test(main)],
  ['Projects use editorial blocks (no timeline rail)', /brem-sidebar[\s\S]*brem-projects(?! brem-timeline)/.test(out)],
  ['Main has timeline education', /brem-education brem-timeline/.test(main) && /University of Washington/.test(main)],
  ['Main has timeline experience', /brem-experience brem-timeline/.test(main) && /TechFlow/.test(main)],
  ['Skills stay in main', /brem-section--skills/.test(main) && !/brem-section--skills/.test(aside)],
  ['Certifications stay in main', /brem-section--certifications/.test(main) && !/brem-section--certifications/.test(aside)],
  ['Languages stay in main', /brem-section--languages/.test(main) && !/brem-section--languages/.test(aside)],
  ['Interests stay in main', /brem-section--interests/.test(main) && !/brem-section--interests/.test(aside)],
  ['Achievements stay in main', /brem-section--achievements/.test(main) && !/brem-section--achievements/.test(aside)],
  ['Has inline skills', /brem-skills/.test(main) && /skill-tag/.test(main)],
  ['Has social linkedin', /brem-social-item--linkedin/.test(aside)],
  ['Has photo ring', /brem-photo-ring/.test(out)],
  ['Projects avoid card padding hack', !/padding-left:\s*calc\(var\(--brem-timeline\)/.test(out)],
];

// Long resume — balance engine must not shuffle fixed sections
const longData = {
  ...baseData,
  experience: Array.from({ length: 6 }, (_, i) => ({
    company: `Company ${i + 1}`,
    title: `Role ${i + 1}`,
    startDate: '2015-01',
    endDate: '2024-12',
    achievements: ['Delivered measurable outcomes across product, design, and engineering.'],
  })),
  projects: Array.from({ length: 4 }, (_, i) => ({
    name: `Project ${i + 1}`,
    description: 'Shipped high-impact initiative with cross-functional stakeholders.',
    technologies: 'React, TypeScript, AWS',
    employer: `${2020 + i}`,
  })),
  skills: [
    'Innovation',
    'Operations',
    'Strategy',
    'Leadership',
    'Analytics',
    'Design Systems',
    'UX Research',
    'Prototyping',
    'Figma',
    'Adobe CC',
    'Wireframing',
    'User Testing',
    'Accessibility',
    'Front-end',
    'React',
    'TypeScript',
    'Collaboration',
    'Stakeholder Mgmt',
    'Agile',
    'Product Discovery',
  ],
};

const longOut = render(longData);
const longAside = extractColumn(longOut, 'aside');
const longMain = extractColumn(longOut, 'main');
const balance = balanceTwoColumnLayout(longOut, { htmlTemplate: html, templateId: tid });

checks.push(
  ['Long resume: projects remain in sidebar', /<aside[\s\S]*brem-section--projects[\s\S]*<\/aside>/i.test(longOut)],
  ['Long resume: skills remain in main', /brem-section--skills/.test(longMain) && !/brem-section--skills/.test(longAside)],
  ['Long resume: certifications not moved to sidebar', !/brem-section--certifications/.test(longAside)],
  ['Long resume: languages not moved to sidebar', !/brem-section--languages/.test(longAside)],
  ['Long resume: interests not moved to sidebar', !/brem-section--interests/.test(longAside)],
  [
    'Long resume: balance engine skips core sections',
    !balance.moved.some((m) =>
      ['projects', 'skills', 'certifications', 'languages', 'interests', 'achievements'].includes(m.kind)
    ),
  ]
);

// Edge cases
const noProjects = render({ ...baseData, projects: [] });
checks.push(['No projects: section omitted', !/brem-section--projects/.test(noProjects)]);

const noOptional = render({
  ...baseData,
  projects: [],
  certifications: [],
  languages: [],
  hobbies: [],
  linkedin: '',
  portfolio: '',
});
checks.push(['No optional sections: layout still valid', /brem-body/.test(noOptional) && /brem-main/.test(noOptional)]);

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('\nAll checks passed for blush-rose-editorial-minimal');
