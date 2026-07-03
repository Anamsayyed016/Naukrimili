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
const HR_SKILLS = ['Recruitment', 'Onboarding', 'Payroll', 'Employee Relations', 'HRIS'];
const MARKETING_SKILLS = ['SEO', 'Content Marketing', 'Google Analytics', 'Brand Management', 'Campaign Planning'];
const LEGAL_SKILLS = ['Legal Research', 'Contract Drafting', 'Litigation', 'Compliance', 'Due Diligence'];
const NURSE_SKILLS = ['Patient Care', 'IV Therapy', 'Vital Signs', 'EMR', 'Infection Control'];
const SALES_SKILLS = ['Lead Generation', 'Negotiation', 'CRM', 'Pipeline Management', 'Client Relations'];
const GOVT_SKILLS = ['Public Administration', 'Policy Analysis', 'Governance', 'Statutory Compliance', 'Reporting'];

const EMPLOYERS: Record<string, string[]> = {
  teacher: ["St. Mary's School", 'Delhi Public School', 'Kendriya Vidyalaya', 'Ryan International'],
  doctor: ['Apollo Hospitals', 'Max Healthcare', 'Fortis Healthcare', 'AIIMS'],
  nurse: ['Apollo Hospitals', 'Manipal Hospitals', 'Columbia Asia'],
  accountant: ['Deloitte', 'EY', 'KPMG', 'PwC'],
  hr: ['Randstad', 'Adecco', 'TeamLease', 'Quess Corp'],
  marketing: ['Ogilvy', 'Hindustan Unilever', 'Dentsu', 'GroupM'],
  government: ['Ministry of Finance', 'Municipal Corporation', 'State Secretariat'],
  international: ['HSBC', 'Standard Chartered', 'Amazon', 'Siemens'],
  lawyer: ['Khaitan & Co', 'AZB Partners', 'Luthra & Luthra'],
  sales: ['Reliance Retail', 'Tata Motors', 'HDFC Bank'],
  researcher: ['IISc Bengaluru', 'TIFR', 'CSIR'],
  designer: ['Landor', 'IDEO', 'Frog Design'],
  architect: ['Hafeez Contractor', 'CP Kukreja', 'Morphogenesis'],
  student: ['University Placement Cell'],
  company_secretary: ['Tata Sons', 'Reliance Industries', 'Infosys'],
};

type ProfileKind =
  | 'developer'
  | 'fresher'
  | 'accountant'
  | 'doctor'
  | 'nurse'
  | 'teacher'
  | 'hr'
  | 'marketing'
  | 'government'
  | 'international'
  | 'lawyer'
  | 'sales'
  | 'researcher'
  | 'designer'
  | 'architect'
  | 'student'
  | 'company_secretary';

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
  const employers = EMPLOYERS[profile] || EMPLOYERS.hr;
  const company = pick(employers, i);
  const title = `${profile.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Specialist`;

  const skills =
    profile === 'accountant' ? FINANCE_SKILLS.slice(0, 5)
    : profile === 'doctor' ? MEDICAL_SKILLS.slice(0, 5)
    : profile === 'nurse' ? NURSE_SKILLS.slice(0, 5)
    : profile === 'teacher' ? TEACHER_SKILLS.slice(0, 5)
    : profile === 'hr' ? HR_SKILLS.slice(0, 5)
    : profile === 'marketing' ? MARKETING_SKILLS.slice(0, 5)
    : profile === 'lawyer' ? LEGAL_SKILLS.slice(0, 5)
    : profile === 'sales' ? SALES_SKILLS.slice(0, 5)
    : profile === 'government' ? GOVT_SKILLS.slice(0, 5)
    : ['Communication', 'Leadership', 'MS Office', 'Analytics', 'Reporting'];

  const raw = [
    name,
    email,
    '',
    'SUMMARY',
    `${title} with ${3 + (i % 5)} years of experience.`,
    '',
    'EXPERIENCE',
    `${title} | ${company}`,
    '2018 - Present',
    `- Delivered ${profile.replace(/_/g, ' ')} outcomes`,
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
          company,
          position: title,
          startDate: '2018',
          current: true,
          description: '',
          achievements: [`Delivered ${profile.replace(/_/g, ' ')} outcomes`],
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
    case 'student':
      return ['fresher', 'academic'];
    case 'doctor':
    case 'nurse':
      return ['healthcare', 'experienced'];
    case 'government':
      return ['government', 'experienced'];
    case 'international':
      return ['international', 'experienced'];
    case 'designer':
      return ['designer', 'experienced'];
    case 'accountant':
    case 'teacher':
    case 'hr':
    case 'marketing':
    case 'lawyer':
    case 'sales':
    case 'researcher':
    case 'architect':
    case 'company_secretary':
      return ['experienced'];
    default:
      return ['experienced'];
  }
}

function variantForIndex(i: number): CorpusVariant {
  const profiles: ProfileKind[] = [
    'developer',
    'fresher',
    'accountant',
    'doctor',
    'nurse',
    'teacher',
    'hr',
    'marketing',
    'government',
    'international',
    'lawyer',
    'sales',
    'researcher',
    'designer',
    'architect',
    'student',
    'company_secretary',
  ];
  const profile = profiles[i % profiles.length];
  const layout = LAYOUT_VARIANTS[i % LAYOUT_VARIANTS.length];
  const tags: ResumeFixtureTag[] = [...profileTags(profile), layout, 'ats'];
  return { profile, layout, tags };
}

export function generateBenchmarkCorpus(count = 500): BenchmarkCase[] {
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

export const BENCHMARK_CORPUS_SIZE = 500;
