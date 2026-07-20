import { readFileSync } from 'fs';
import { injectResumeData } from '../lib/resume-builder/template-loader';

const tid = 'plum-lavender-pill-executive';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');

const data = {
  firstName: 'Alexander',
  lastName: 'Harrison',
  fullName: 'Alexander Harrison',
  jobTitle: 'Marketing Manager',
  email: 'alex@example.com',
  phone: '+1 555 0100',
  location: 'New York, NY',
  linkedin: 'linkedin.com/in/alex',
  portfolio: 'alexh.design',
  summary: 'Executive marketing leader with 10+ years driving growth.',
  skills: ['Brand Strategy', 'Team Leadership', 'Go-to-Market', 'Analytics'],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Spanish', proficiency: 'Fluent' },
  ],
  references: [
    {
      name: 'Jordan Lee',
      title: 'CEO',
      company: 'Acme Corp',
      phone: '+1 555 0200',
      email: 'jordan@acme.com',
      relationship: 'Former Manager',
    },
  ],
  experience: Array.from({ length: 6 }, (_, i) => ({
    company: `Really Great Industries ${i + 1}`,
    title: 'Marketing Manager',
    position: 'Marketing Manager',
    startDate: '2016-01',
    endDate: '2023-12',
    achievements: [`Led campaign ${i + 1} results`],
    description: 'Built marketing systems and growth initiatives.',
  })),
  projects: [
    {
      name: 'New Landing Page System',
      description: 'Designed and shipped landing page experiments.',
      technologies: 'React, TypeScript',
    },
  ],
  education: [{ degree: 'MBA', institution: 'Business School', year: '2014' }],
  hobbies: ['Reading', 'Travel'],
};

const out = injectResumeData(html, data, { templateId: tid, mode: 'preview' });

const asideInner = out.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i)?.[1] ?? '';
const mainInner = out.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';

const projectsInAside = /plpe-section--projects|project-item/.test(asideInner);
const projectsInMain = /plpe-section--projects|project-item/.test(mainInner);

const hasSplitFirst = out.includes('class="name-first">Alexander<') || out.includes('class="name-first">{{');
const hasSplitLast = out.includes('class="name-last">Harrison<') || out.includes('class="name-last">{{');

console.log('Projects in aside:', projectsInAside);
console.log('Projects in main:', projectsInMain);
console.log('Has name-first Alexander:', out.includes('class="name-first">Alexander<'));
console.log('Has name-last Harrison:', out.includes('class="name-last">Harrison<'));

