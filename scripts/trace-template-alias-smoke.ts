import { injectResumeData } from '../lib/resume-builder/template-loader';

const html = '<body>{{PROJECTS}}{{EXPERIENCE}}</body>';
const out = injectResumeData(html, {
  customParserUsed: true,
  projects: [
    {
      name: 'Job Portal',
      description: 'Full-stack portal',
      Technologies: ['Next.js', 'PostgreSQL'],
    },
  ],
  experience: [
    {
      title: 'Python Developer',
      organization: 'Digital Solutions Pvt Ltd',
      description: 'Built APIs',
      achievements: ['Scaled REST APIs'],
      bulletPoints: ['Scaled REST APIs'],
    },
  ],
});

console.log('has project name', out.includes('Job Portal'));
console.log('has tech', out.includes('Next.js'));
console.log('has company', out.includes('Digital Solutions'));
console.log('has bullet', out.includes('Scaled REST'));
