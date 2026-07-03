/**
 * Large-scale synthetic benchmark corpus generator.
 * Produces varied resume fixtures with programmatic ground truth for accuracy measurement.
 */

import type { BenchmarkCase, GroundTruthResume, ResumeFixtureTag } from '../types';

const FIRST_NAMES = ['Anam', 'Priya', 'Rahul', 'Sneha', 'Arjun', 'Kavya', 'Vikram', 'Neha', 'Rohan', 'Aisha'];
const LAST_NAMES = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Nair', 'Reddy', 'Gupta', 'Iyer', 'Das', 'Khan'];
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Bhopal', 'Ahmedabad'];
const COMPANIES = ['Technoart Pvt Ltd', 'Infosys', 'TCS', 'Wipro', 'Accenture', 'Capgemini', 'HCL', 'Cognizant'];
const UNIVERSITIES = ['RGPV Bhopal', 'Pune University', 'Delhi University', 'Anna University', 'VTU Bengaluru'];
const DEGREES = ['B.Tech Computer Science', 'B.E. Information Technology', 'MCA', 'MBA', 'B.Com'];
const DEV_SKILLS = ['Python', 'Java', 'JavaScript', 'React', 'SQL', 'Docker', 'AWS', 'Node.js', 'Django', 'PostgreSQL'];
const FINANCE_SKILLS = ['Excel', 'Tally', 'GST', 'Financial Analysis', 'SAP', 'QuickBooks', 'Auditing'];
const MEDICAL_SKILLS = ['Patient Care', 'Diagnosis', 'EMR', 'Surgery Assistance', 'Pharmacology'];
const TEACHER_SKILLS = ['Curriculum Design', 'Classroom Management', 'Assessment', 'Lesson Planning'];

type ProfileKind =
  | 'developer'
  | 'fresher'
  | 'accountant'
  | 'doctor'
  | 'teacher'
  | 'hr'
  | 'marketing'
  | 'government'
  | 'international';

type CorpusVariant = {
  profile: ProfileKind;
  layout: 'single_column' | 'two_column' | 'sidebar' | 'table';
  tags: ResumeFixtureTag[];
};

const LAYOUT_VARIANTS: CorpusVariant['layout'][] = ['single_column', 'two_column', 'sidebar', 'table'];

function pick<T>(arr: T[], index: number): T {
  return arr[index % arr.length];
}

function buildDeveloperResume(i: number, layout: CorpusVariant['layout']): { raw: string; gt: GroundTruthResume } {
  const name = `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 3)}`;
  const email = `${name.split(' ')[0].toLowerCase()}${i}@example.com`;
  const city = pick(CITIES, i);
  const company = pick(COMPANIES, i);
  const skills = DEV_SKILLS.slice(i % 4, (i % 4) + 6);
  const raw = [
    name,
    `${email} | +91 98${String(10000000 + i).slice(0, 8)} | ${city}, India`,
    '',
    'SUMMARY',
    `Software engineer with experience in ${skills.slice(0, 3).join(', ')}.`,
    '',
    'EXPERIENCE',
    `Software Engineer | ${company} | ${city}`,
    'Jan 2022 - Present',
    `- Built applications using ${skills[0]} and ${skills[1]}`,
    '',
    'EDUCATION',
    `${pick(DEGREES, i)} | ${pick(UNIVERSITIES, i)}`,
    '2016 - 2020',
    '',
    layout === 'table'
      ? ['SKILLS', '| Skill | Level |', ...skills.map((s) => `| ${s} | Proficient |`)].join('\n')
      : ['SKILLS', skills.join(', ')].join('\n'),
    '',
    'PROJECTS',
    'Portfolio App',
    `Built with ${skills[2]} and ${skills[3]}`,
  ].join('\n');

  const gt: GroundTruthResume = {
    fullName: name,
    email,
    phone: `+91 98${String(10000000 + i).slice(0, 8)}`,
    location: `${city}, India`,
    summary: `Software engineer with experience in ${skills.slice(0, 3).join(', ')}.`,
    skills,
    experience: [
      {
        company,
        position: 'Software Engineer',
        location: city,
        startDate: '2022-01',
        current: true,
        description: '',
        achievements: [`Built applications using ${skills[0]} and ${skills[1]}`],
      },
    ],
    education: [
      {
        institution: pick(UNIVERSITIES, i),
        degree: pick(DEGREES, i),
        field: '',
        startDate: '2016',
        endDate: '2020',
      },
    ],
    projects: [{ name: 'Portfolio App', description: `Built with ${skills[2]} and ${skills[3]}`, technologies: [] }],
    certifications: [],
    languages: [],
    confidence: 0,
    rawText: raw,
  };

  return { raw, gt };
}

function buildFresherResume(i: number): { raw: string; gt: GroundTruthResume } {
  const name = `${pick(FIRST_NAMES, i + 1)} ${pick(LAST_NAMES, i)}`;
  const email = `${name.split(' ')[0].toLowerCase()}.fresher${i}@email.com`;
  const city = pick(CITIES, i + 2);
  const skills = ['Java', 'Python', 'SQL', 'HTML', 'CSS'];
  const raw = [
    name,
    `${email} | ${city}, India`,
    '',
    'OBJECTIVE',
    'Motivated graduate seeking a software developer role.',
    '',
    'EDUCATION',
    `B.E. Information Technology | ${pick(UNIVERSITIES, i)}`,
    '2020 - 2024',
    '',
    'SKILLS',
    skills.join(', '),
    '',
    'PROJECTS',
    'Library Management System',
    'Academic project using Java and MySQL',
  ].join('\n');

  return {
    raw,
    gt: {
      fullName: name,
      email,
      phone: '',
      location: `${city}, India`,
      summary: 'Motivated graduate seeking a software developer role.',
      skills,
      experience: [],
      education: [
        {
          institution: pick(UNIVERSITIES, i),
          degree: 'B.E. Information Technology',
          startDate: '2020',
          endDate: '2024',
        },
      ],
      projects: [
        { name: 'Library Management System', description: 'Academic project using Java and MySQL', technologies: ['Java', 'MySQL'] },
      ],
      certifications: [],
      languages: [],
      confidence: 0,
      rawText: raw,
    },
  };
}

function buildSpecializedResume(i: number, profile: ProfileKind): { raw: string; gt: GroundTruthResume } {
  const name = `${pick(FIRST_NAMES, i + 5)} ${pick(LAST_NAMES, i + 7)}`;
  const email = `${profile}${i}@example.com`;
  const skills =
    profile === 'accountant' ? FINANCE_SKILLS.slice(0, 5)
    : profile === 'doctor' ? MEDICAL_SKILLS.slice(0, 5)
    : profile === 'teacher' ? TEACHER_SKILLS.slice(0, 5)
    : ['Communication', 'Leadership', 'MS Office', 'Analytics', 'Reporting'];

  const raw = [
    name,
    email,
    '',
    'SUMMARY',
    `${profile} professional with ${3 + (i % 5)} years of experience.`,
    '',
    'EXPERIENCE',
    `${profile} Specialist | Org ${i % 20}`,
    '2018 - Present',
    `- Delivered ${profile} outcomes`,
    '',
    'SKILLS',
    skills.join(', '),
  ].join('\n');

  return {
    raw,
    gt: {
      fullName: name,
      email,
      skills,
      experience: [
        {
          company: `Org ${i % 20}`,
          position: `${profile} Specialist`,
          startDate: '2018',
          current: true,
          description: '',
        },
      ],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      confidence: 0,
      rawText: raw,
    },
  };
}

function profileTags(profile: ProfileKind): ResumeFixtureTag[] {
  switch (profile) {
    case 'developer':
      return ['developer', 'experienced'];
    case 'fresher':
      return ['fresher', 'academic'];
    case 'doctor':
      return ['healthcare', 'experienced'];
    case 'government':
      return ['government', 'experienced'];
    case 'international':
      return ['international', 'experienced'];
    case 'accountant':
    case 'teacher':
    case 'hr':
    case 'marketing':
      return ['experienced'];
    default:
      return ['experienced'];
  }
}

function variantForIndex(i: number): CorpusVariant {
  const profiles: ProfileKind[] = [
    'developer', 'fresher', 'accountant', 'doctor', 'teacher', 'hr', 'marketing', 'government', 'international',
  ];
  const profile = profiles[i % profiles.length];
  const layout = LAYOUT_VARIANTS[i % LAYOUT_VARIANTS.length];
  const tags: ResumeFixtureTag[] = [...profileTags(profile), layout, 'ats'];
  return { profile, layout, tags };
}

export function generateBenchmarkCorpus(count = 300): BenchmarkCase[] {
  const fixtures: BenchmarkCase[] = [];
  for (let i = 0; i < count; i++) {
    const variant = variantForIndex(i);
    let built: { raw: string; gt: GroundTruthResume };

    if (variant.profile === 'fresher') {
      built = buildFresherResume(i);
    } else if (variant.profile === 'developer') {
      built = buildDeveloperResume(i, variant.layout);
    } else {
      built = buildSpecializedResume(i, variant.profile);
    }

    fixtures.push({
      id: `corpus-${variant.profile}-${variant.layout}-${i}`,
      name: `Corpus ${variant.profile} #${i}`,
      description: `Synthetic ${variant.profile} resume (${variant.layout})`,
      tags: variant.tags,
      format: 'text',
      rawText: built.raw,
      groundTruth: built.gt,
    });
  }
  return fixtures;
}

export const BENCHMARK_CORPUS_SIZE = 300;
