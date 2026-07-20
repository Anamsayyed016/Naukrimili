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
  ],
  projects: [
    {
      name: 'Heritage Collection Launch',
      description: 'End-to-end brand campaign for premium product line.',
      technologies: 'Figma, Adobe CC',
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
};

const out = injectResumeData(html, data, { templateId: tid, mode: 'preview' });
const aside = extractColumn(out, 'aside');
const main = extractColumn(out, 'main');

const nameCount = (out.match(/class="name-last">Reed</g) ?? []).length;

const checks: Array<[string, boolean]> = [
  ['Has ivory resume root', /ime-resume/.test(out)],
  ['Has stacked name-first Eliza', out.includes('class="name-first">Eliza<')],
  ['Has name-last Reed', out.includes('class="name-last">Reed<')],
  ['No duplicate script signature', !/ime-signature-script/.test(out)],
  ['No duplicate name footer', !/ime-signature/.test(out)],
  ['Name appears only once in heading', nameCount === 1],
  ['Has rectangular photo frame', /ime-photo-frame/.test(out)],
  ['Profile in sidebar', /<aside[\s\S]*Brand strategist with[\s\S]*<\/aside>/i.test(out)],
  ['Contact card in sidebar', /ime-contact-card/.test(aside)],
  ['Social in sidebar', /ime-section--social/.test(aside) && /linkedin/.test(aside)],
  ['Skills in sidebar', /ime-section--skills/.test(aside) && /Figma/.test(aside)],
  ['Languages in sidebar', /ime-section--languages/.test(aside) && /French/.test(aside)],
  ['Skills not in main', !/ime-section--skills/.test(main)],
  ['Professional Journey panel', /ime-journey-panel/.test(main) && /Professional Journey/.test(main)],
  ['Experience in main', /ime-experience/.test(main) && /Apex Consumer Goods/.test(main)],
  ['Education in main', /ime-education/.test(main) && /Parsons/.test(main)],
  ['Projects in main', /ime-projects/.test(main) && /Heritage Collection/.test(main)],
  ['Certifications in main', /ime-section--certifications/.test(main) && /Brand Management/.test(main)],
  ['Achievements in main', /ime-section--achievements/.test(main)],
  ['Has references extended section', /extended-section--references|References/i.test(out)],
  ['Uses slate accent CSS vars', /--ime-accent:\s*var\(--accent-color,\s*#2F3E56\)/.test(readFileSync(`public/templates/${tid}/style.css`, 'utf8'))],
];

const minimal = injectResumeData(html, {
  firstName: 'Eliza',
  lastName: 'Reed',
  email: 'a@b.com',
  phone: '1',
  experience: [{ company: 'C', title: 'T', startDate: '2020', endDate: '2024', achievements: ['a'] }],
}, { templateId: tid });

checks.push(
  ['Minimal resume: no signature gap', !/ime-signature/.test(minimal)],
  ['Minimal resume: no empty sidebar footer block', !/ime-signature-script/.test(minimal)]
);

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('\nAll checks passed for ivory-monochrome-editorial');
