import { readFileSync } from 'fs';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const tid = 'ivory-monochrome-editorial';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');

function extractColumn(htmlOut: string, tag: 'aside' | 'main'): string {
  const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'i');
  return (htmlOut.match(re) ?? [''])[0];
}

const data = {
  firstName: 'Eliza',
  lastName: 'Reed',
  fullName: 'Eliza Reed',
  jobTitle: 'Brand Strategist',
  email: 'eliza.reed@example.com',
  phone: '+1 555 0100',
  location: 'Brooklyn, NY',
  linkedin: 'linkedin.com/in/elizareed',
  portfolio: 'elizareed.com',
  summary:
    'Brand strategist with 10+ years shaping premium consumer narratives across fashion, lifestyle, and digital platforms.',
  skills: ['Figma', 'React', 'Python', 'Leadership', 'Adobe CC'],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'French', proficiency: 'Fluent' },
  ],
  experience: [
    {
      company: 'Apex Consumer Goods',
      title: 'Brand Director',
      startDate: '2021-01',
      endDate: '',
      current: true,
      achievements: [
        'Led global rebrand increasing aided awareness by 28%',
        'Directed cross-channel campaigns for three product launches',
      ],
    },
    {
      company: 'Northwind Studio',
      title: 'Senior Brand Strategist',
      startDate: '2017-03',
      endDate: '2020-12',
      achievements: ['Built positioning frameworks for Fortune 500 clients'],
    },
  ],
  projects: [
    {
      name: 'Heritage Collection Launch',
      description: 'End-to-end brand campaign for premium product line.',
      technologies: 'Figma, Adobe CC',
      link: 'https://example.com/project',
    },
  ],
  education: [
    {
      degree: 'BFA, Communication Design',
      institution: 'Parsons School of Design',
      year: '2013-2017',
    },
  ],
  certifications: [{ name: 'Brand Management Certificate', issuer: 'Columbia Business School', date: '2019' }],
  achievements: ['Campaign of the Year — Brand Guild Awards 2023'],
  hobbies: ['Typography', 'Photography'],
  references: [
    {
      name: 'Morgan Blake',
      title: 'CMO',
      company: 'Apex Consumer Goods',
      phone: '+1 555 0300',
      email: 'morgan@apex.com',
    },
  ],
  awards: [{ title: 'Excellence in Brand Leadership', year: '2022' }],
  volunteer: [{ organization: 'AIGA', role: 'Mentor' }],
};

const out = injectResumeData(html, data, { templateId: tid, mode: 'preview' });
const aside = extractColumn(out, 'aside');
const main = extractColumn(out, 'main');

const checks: Array<[string, boolean]> = [
  ['Has ivory resume root', /ime-resume/.test(out)],
  ['Has stacked name-first Eliza', out.includes('class="name-first">Eliza<')],
  ['Has name-last Reed', out.includes('class="name-last">Reed<')],
  ['Has rectangular photo frame', /ime-photo-frame/.test(out)],
  ['Profile in sidebar', /<aside[\s\S]*Brand strategist with[\s\S]*<\/aside>/i.test(out)],
  ['Contact card in sidebar', /ime-contact-card/.test(aside)],
  ['Languages in contact card', /ime-languages--contact/.test(aside) && /French/.test(aside)],
  ['Signature script footer', /ime-signature-script/.test(aside) && /Eliza Reed/.test(aside)],
  ['Professional Journey panel', /ime-journey-panel/.test(main) && /Professional Journey/.test(main)],
  ['Experience in main', /ime-experience/.test(main) && /Apex Consumer Goods/.test(main)],
  ['Education in main', /ime-education/.test(main) && /Parsons/.test(main)],
  ['Projects in main', /ime-projects/.test(main) && /Heritage Collection/.test(main)],
  ['Skills in main', /ime-skills/.test(main) && /Figma/.test(main)],
  ['Certifications in main', /Google|Brand Management Certificate/.test(main)],
  ['Achievements in main', /ime-section--achievements/.test(main)],
  ['No duplicate languages section in main', !/ime-section--languages/.test(main)],
  ['Has references extended section', /extended-section--references|References/i.test(out)],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('\nAll checks passed for ivory-monochrome-editorial');
