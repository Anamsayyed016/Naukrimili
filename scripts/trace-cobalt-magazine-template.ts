import { readFileSync } from 'fs';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const tid = 'cobalt-magazine-executive';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');

function extractColumn(htmlOut: string, tag: 'main' | 'aside'): string {
  const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'i');
  return (htmlOut.match(re) ?? [''])[0];
}

const data = {
  firstName: 'Owen',
  lastName: 'Reed',
  fullName: 'Owen Reed',
  jobTitle: 'Executive Product Director',
  email: 'hello@owenreed.com',
  phone: '+123-456-7890',
  location: '123 Anywhere St., Any City',
  linkedin: 'linkedin.com/in/owenreed',
  portfolio: 'be.net/owenreed_product',
  summary:
    'Strategic product leader with 12+ years driving digital innovation, cross-functional teams, and user-centered product roadmaps across enterprise SaaS.',
  skills: ['Leadership', 'React', 'Python', 'Agile', 'Communication', 'Analytics'],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Spanish', proficiency: 'Fluent' },
  ],
  experience: [
    {
      company: 'Flores & Co.',
      title: 'Product Director',
      startDate: 'May 2023',
      endDate: 'Present',
      location: 'San Francisco, CA',
      achievements: [
        'Led product strategy for a portfolio generating $48M ARR',
        'Shipped three major releases improving NPS by 18 points',
      ],
    },
    {
      company: 'Ingoude Company',
      title: 'Senior Product Manager',
      startDate: '2019',
      endDate: '2023',
      achievements: ['Managed roadmap for B2B analytics platform serving 2,000+ clients'],
    },
  ],
  education: [
    {
      degree: 'MBA, Product Management',
      institution: 'Stanford Graduate School',
      year: '2017-2019',
    },
    {
      degree: 'B.S. Computer Science',
      institution: 'UC Berkeley',
      year: '2011-2015',
    },
  ],
  hobbies: ['Learn', 'Creative Projects', 'Global Travel'],
  certifications: [{ name: 'Certified Scrum Product Owner', issuer: 'Scrum Alliance', date: '2020' }],
  projects: [{ name: 'Mobile Checkout Redesign', description: 'Increased conversion 22%.', technologies: 'React Native' }],
  achievements: ['Product Leader of the Year 2022'],
  references: [{ name: 'Jane Smith', title: 'VP Product', company: 'Flores & Co.', email: 'jane@flores.com', phone: '+1-555-0100' }],
  extendedSections: {
    volunteer: [{ organization: 'Code for Good', role: 'Product Mentor', duration: '2021-Present' }],
    awards: ['Innovation Award 2021'],
  },
};

const out = injectResumeData(html, data, { templateId: tid, mode: 'preview' });
const main = extractColumn(out, 'main');
const aside = extractColumn(out, 'aside');

const checks: Array<[string, boolean]> = [
  ['Has cme resume root', /cme-resume/.test(out)],
  ['Has blue name Owen', out.includes('class="name-first">Owen<')],
  ['Has blue name Reed', out.includes('class="name-last">Reed<')],
  ['Has executive title', /Executive Product Director/.test(out)],
  ['Header contact in header', /<header[\s\S]*hello@owenreed[\s\S]*<\/header>/i.test(out)],
  ['About Me in main', /cme-section--summary/.test(main) && /Strategic product leader/.test(main)],
  ['Experience split layout in main', /cme-experience/.test(main) && /Flores/.test(main)],
  ['Education in main', /cme-education/.test(main) && /Stanford/.test(main)],
  ['Contact in sidebar', /cme-contact-list/.test(aside) && /hello@owenreed/.test(aside)],
  ['Portrait in sidebar', /cme-portrait/.test(aside)],
  ['Activities in sidebar', /cme-activities/.test(aside) && /Creative Projects/.test(aside)],
  ['Skills dots in sidebar', /psp-skill-item/.test(aside) && /Leadership/.test(aside)],
  ['Uses psp-skills-progress', /psp-skills-progress/.test(html)],
  ['Uses psp-languages-progress', /psp-languages-progress/.test(html)],
  ['No QR code', !/qr-code|qr_code|qrcode/i.test(out)],
  ['No RESUME footer watermark', !/>\s*RESUME\s*</i.test(out) && !/cme-footer-watermark|resume-watermark/i.test(out)],
  ['No website strip banner', !/reallygreatsite/i.test(out)],
  ['Blue header rule', /cme-contact-rule/.test(out)],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('\nAll checks passed for cobalt-magazine-executive');
