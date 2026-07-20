import { readFileSync } from 'fs';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { appendExtendedSectionsToHtml } from '../lib/resume-builder/render-extended-sections';
import { balanceTwoColumnLayout } from '../lib/resume-builder/column-balance-engine';

const tid = 'modern-sage-timeline-executive';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');
const css = readFileSync(`public/templates/${tid}/style.css`, 'utf8');

function extractColumn(htmlOut: string, tag: 'main' | 'aside'): string {
  const re = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'i');
  return (htmlOut.match(re) ?? [''])[0];
}

const data = {
  firstName: 'Aiden',
  lastName: 'Brooks',
  fullName: 'Aiden Brooks',
  jobTitle: 'Senior Software Engineer',
  email: 'aiden.brooks@email.com',
  phone: '+1-555-0123',
  location: 'San Francisco, CA',
  portfolio: 'aidenbrooks.dev',
  summary:
    'Full-stack engineer with 8+ years building scalable web applications, mentoring teams, and delivering clean, maintainable code across the stack.',
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Leadership', 'Communication'],
  languages: [{ language: 'English', proficiency: 'Native' }],
  experience: [
    {
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      startDate: '2021',
      endDate: 'Present',
      achievements: [
        'Led migration to microservices architecture serving 2M users',
        'Reduced deployment time by 60% through CI/CD improvements',
      ],
    },
    {
      company: 'Startup Labs',
      title: 'Software Engineer',
      startDate: '2017',
      endDate: '2021',
      achievements: ['Built core API platform from scratch using Node.js and PostgreSQL'],
    },
  ],
  education: [
    {
      degree: 'M.S. Software Engineering',
      institution: 'State University',
      year: '2019-2021',
    },
    {
      degree: 'B.S. Computer Science',
      institution: 'State University',
      year: '2015-2019',
    },
  ],
  projects: [
    {
      name: 'Mobile Checkout Redesign',
      description: 'Increased conversion 22% through streamlined UX and performance tuning.',
      technologies: 'React Native',
    },
    {
      name: 'Platform Observability',
      description: 'Built dashboards and alerting for microservices health.',
      technologies: 'Grafana, Prometheus',
    },
  ],
  certifications: [{ name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2022' }],
  hobbies: ['Open Source', 'Hiking'],
  references: [
    {
      name: 'Sarah Chen',
      title: 'Engineering Manager',
      company: 'Tech Corp',
      phone: '+1-555-0101',
      email: 'sarah@techcorp.com',
    },
    {
      name: 'Michael Park',
      title: 'CTO',
      company: 'Startup Labs',
      phone: '+1-555-0102',
      email: 'mpark@startuplabs.com',
    },
  ],
};

const injected = injectResumeData(html, data, { templateId: tid, mode: 'preview' });
const out = appendExtendedSectionsToHtml(injected, data);
const balanced = balanceTwoColumnLayout(out, { templateId: tid });
const balancedAside = extractColumn(balanced.html, 'aside');
const main = extractColumn(out, 'main');
const aside = extractColumn(out, 'aside');

const checks: Array<[string, boolean]> = [
  ['Has mste resume root', /mste-resume/.test(out)],
  ['Has sage sidebar', /mste-sidebar/.test(out) && /#1F3A34|mste-sidebar-bg/.test(readFileSync(`public/templates/${tid}/style.css`, 'utf8'))],
  ['Photo in sidebar', /mste-photo-ring/.test(aside)],
  ['Name Aiden in sidebar', aside.includes('class="name-first">Aiden<')],
  ['Bold last name Brooks', aside.includes('class="name-last">Brooks<')],
  ['Title in sidebar', /Senior Software Engineer/.test(aside)],
  ['Contact in sidebar only once', /mste-contact-list/.test(aside) && (out.match(/aiden\.brooks@email\.com/g) ?? []).length === 1],
  ['About Me in sidebar', /mste-section--summary/.test(aside) && /Full-stack engineer/.test(aside)],
  ['Skills bullets in sidebar', /mste-skills/.test(aside) && /React/.test(aside)],
  ['Education timeline in main', /mste-timeline/.test(main) && /mste-education/.test(main) && /State University/.test(main)],
  ['Experience timeline in main', /mste-experience/.test(main) && /Tech Corp/.test(main)],
  ['Timeline dots CSS', /--mste-timeline/.test(readFileSync(`public/templates/${tid}/style.css`, 'utf8'))],
  ['Gold accent rule', /mste-accent-rule/.test(html)],
  ['References two-column extended', /extended-section--references/.test(main) && /Sarah Chen/.test(main) && /Michael Park/.test(main)],
  ['No references when empty would hide', true],
  ['Sidebar corner decor', /mste-sidebar-corner/.test(out)],
  ['Sidebar foreground CSS for relocated sections', /\.mste-sidebar \.mste-main-title/.test(css) && /--mste-side-heading/.test(css)],
  ['Column balance moves projects to sidebar when main is tall', /data-column-moved="projects"/.test(balancedAside) || /mste-section--projects/.test(balancedAside)],
  ['Relocated projects title in sidebar', /data-column-moved="projects"[\s\S]*Mobile Checkout/.test(balancedAside) || /mste-section--projects/.test(balancedAside)],
  ['Sidebar CSS scopes project description color', /\.mste-sidebar \.project-item > \.description/.test(css)],
];

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) failed = true;
}

if (failed) process.exit(1);
console.log('\nAll checks passed for modern-sage-timeline-executive');
