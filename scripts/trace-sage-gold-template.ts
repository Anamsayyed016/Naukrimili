import { readFileSync } from 'fs';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const tid = 'sage-gold-editorial-executive';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');

function extractColumn(htmlOut: string, tag: 'main' | 'aside'): string {
  const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'i');
  return (htmlOut.match(re) ?? [''])[0];
}

const data = {
  firstName: 'Shawn',
  lastName: 'Garcia',
  fullName: 'Shawn Garcia',
  jobTitle: 'Psychologist',
  email: 'hello@reallygreatsite.com',
  phone: '+123-456-7890',
  location: '123 Anywhere St., Any City',
  linkedin: 'linkedin.com/in/shawn',
  summary:
    'Compassionate clinical psychologist with 8+ years supporting patients through evidence-based therapy, assessment, and multidisciplinary care planning.',
  skills: ['Leadership', 'Teamwork', 'Problem Solving', 'Communication', 'Research', 'Python'],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'French', proficiency: 'Fluent' },
    { language: 'Spanish', proficiency: 'Intermediate' },
  ],
  experience: [
    {
      company: 'Spies Hospital',
      title: 'Head Clinical Psychologist',
      startDate: '2017',
      endDate: '2021',
      achievements: [
        'Led inpatient psychology unit serving 120+ patients annually',
        'Implemented cognitive behavioral therapy protocols across departments',
      ],
    },
    {
      company: 'Wardiere Clinic',
      title: 'Clinical Psychologist',
      startDate: '2014',
      endDate: '2017',
      achievements: ['Conducted psychological assessments and treatment planning'],
    },
  ],
  education: [
    {
      degree: 'Master of Clinical Psychology',
      institution: 'Psychology University',
      year: '2015-2017',
    },
    {
      degree: 'Bachelor of Psychology',
      institution: 'Psychology University',
      year: '2011-2015',
    },
  ],
  hobbies: ['Photography', 'Videography', 'Reading'],
  certifications: [{ name: 'Licensed Clinical Psychologist', issuer: 'State Board', date: '2018' }],
  projects: [{ name: 'Mindfulness Program', description: 'Hospital-wide wellness initiative.', technologies: 'Group Therapy' }],
  references: [{ name: 'Dr. Lee', title: 'Director', company: 'Spies Hospital', email: 'lee@hospital.com' }],
};

const out = injectResumeData(html, data, { templateId: tid, mode: 'preview' });
const main = extractColumn(out, 'main');
const aside = extractColumn(out, 'aside');

const checks: Array<[string, boolean]> = [
  ['Has sgge resume root', /sgge-resume/.test(out)],
  ['Has greeting text', /Hello\.\. I'm/.test(out)],
  ['Has name-first Shawn', out.includes('class="name-first">Shawn<')],
  ['Has gold name-last GARCIA', out.includes('class="name-last">Garcia<') || out.includes('class="name-last">GARCIA<')],
  ['Has circular photo', /sgge-photo-ring/.test(out)],
  ['Has green header frame', /sgge-header-frame/.test(out)],
  ['Header contact in header', /<header[\s\S]*hello@reallygreatsite[\s\S]*<\/header>/i.test(out)],
  ['About Me in main', /sgge-section--about/.test(main) && /Compassionate clinical/.test(main)],
  ['Experience in main', /sgge-experience/.test(main) && /Spies Hospital/.test(main)],
  ['Skills two-column in main', /sgge-skills/.test(main) && /Leadership/.test(main)],
  ['Education in sidebar', /sgge-education/.test(aside) && /Psychology University/.test(aside)],
  ['Language progress bars', /psp-language-bar-fill/.test(out) && /psp-languages-progress/.test(out)],
  ['Interests in sidebar', /sgge-interests/.test(aside) && /Photography/.test(aside)],
  ['No website footer strip', !/reallygreatsite\.com/i.test(out.replace(/hello@reallygreatsite\.com/i, ''))],
  ['No footer banner class', !/sgge-footer|website-banner|portfolio-strip/.test(out)],
  ['Sidebar has sage background class', /sgge-sidebar/.test(out)],
  ['Uses psp-languages-progress', /psp-languages-progress/.test(html)],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('\nAll checks passed for sage-gold-editorial-executive');
