import { readFileSync } from 'fs';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const tid = 'olive-ivory-editorial-executive';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');

const data = {
  firstName: 'Isabella',
  lastName: 'Chen',
  fullName: 'Isabella Chen',
  jobTitle: 'Chief Operating Officer',
  email: 'isabella.chen@example.com',
  phone: '+1 555 0100',
  location: 'Miami, FL',
  linkedin: 'linkedin.com/in/isabellachen',
  portfolio: 'isabellachen.com',
  summary: 'Executive leader with 15+ years driving operational excellence and strategic growth across global organizations.',
  skills: ['Leadership', 'Operations Strategy', 'P&L Management', 'Change Management'],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Mandarin', proficiency: 'Fluent' },
  ],
  references: [
    {
      name: 'Estelle Darcy',
      title: 'CEO',
      company: 'Wardiere Inc.',
      phone: '+1 555 0200',
      email: 'estelle@wardiere.com',
    },
    {
      name: 'Harper Russo',
      title: 'CFO',
      company: 'Wardiere Inc.',
      phone: '+1 555 0201',
      email: 'harper@wardiere.com',
    },
  ],
  experience: [
    {
      company: 'Felicitas Solutions',
      title: 'Chief Operating Officer',
      startDate: '2035-01',
      endDate: '',
      current: true,
      achievements: ['Scaled operations across 12 regions', 'Reduced operating costs by 18%'],
      description: 'Led enterprise-wide operational transformation.',
    },
    {
      company: 'Aurum Holdings',
      title: 'VP of Operations',
      startDate: '2028-06',
      endDate: '2034-12',
      achievements: ['Built global supply chain network'],
    },
  ],
  projects: [
    {
      name: 'Enterprise ERP Rollout',
      description: 'Led cross-functional deployment across 8 business units.',
      technologies: 'SAP, Azure',
    },
  ],
  education: [
    { degree: 'Bachelor of Science in Business Administration', institution: 'Florida State University', year: '2027-2031' },
  ],
  certifications: [{ name: 'PMP', issuer: 'PMI', year: '2020' }],
  achievements: ['Named Top 40 Under 40 by Business Journal'],
  hobbies: ['Golf', 'Travel'],
  awards: [{ title: 'Excellence in Leadership Award', year: '2022' }],
  volunteer: [{ organization: 'Junior Achievement', role: 'Board Member' }],
};

const out = injectResumeData(html, data, { templateId: tid, mode: 'preview' });

const checks = [
  ['Has olive sidebar', /oiee-sidebar/.test(out)],
  ['Has name-first Isabella', out.includes('class="name-first">Isabella<')],
  ['Has name-last Chen', out.includes('class="name-last">Chen<')],
  ['Has pipe separator', out.includes('class="name-separator"')],
  ['Has profile image block or initials', /profile-image-wrapper/.test(out)],
  ['Has experience', /experience-item/.test(out)],
  ['Has skills', /Leadership/.test(out)],
  ['Has education in sidebar', /<aside[\s\S]*Florida State University[\s\S]*<\/aside>/i.test(out)],
  ['Has references extended section', /extended-section--references|References/i.test(out)],
  ['Has summary', /Professional Summary|Executive leader/.test(out)],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}

if (failed) {
  process.exit(1);
}

console.log('\nAll checks passed for olive-ivory-editorial-executive');
