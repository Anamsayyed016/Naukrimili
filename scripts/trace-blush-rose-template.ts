import { readFileSync } from 'fs';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const tid = 'blush-rose-editorial-minimal';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');

const data = {
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
      technologies: '2023',
      link: 'https://example.com/project',
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

const out = injectResumeData(html, data, { templateId: tid, mode: 'preview' });

const checks = [
  ['Has blush sidebar', /brem-sidebar/.test(out)],
  ['Has stacked name-first Isabella', out.includes('class="name-first">Isabella<')],
  ['Has name-last Chen', out.includes('class="name-last">Chen<')],
  ['Has profile in sidebar', /<aside[\s\S]*Product designer with[\s\S]*<\/aside>/i.test(out)],
  ['Has timeline education', /brem-education brem-timeline/.test(out) && /University of Washington/.test(out)],
  ['Has timeline experience', /brem-experience brem-timeline/.test(out) && /TechFlow/.test(out)],
  ['Has inline skills', /brem-skills/.test(out) && /skill-tag/.test(out)],
  ['Has certifications', /Google UX Design Certificate/.test(out)],
  ['Has social linkedin', /brem-social-item--linkedin/.test(out)],
  ['Has photo ring', /brem-photo-ring/.test(out)],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('\nAll checks passed for blush-rose-editorial-minimal');
