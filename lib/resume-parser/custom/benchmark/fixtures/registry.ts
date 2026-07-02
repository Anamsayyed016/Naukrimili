/**
 * Sample benchmark fixtures — ground truth + metadata tags.
 * Supports all resume categories via tags; extend with real PDF/DOCX paths later.
 */

import type { BenchmarkCase } from '../types';

const DEVELOPER_RAW = [
  'Anam Sayyed',
  'anam@example.com | +91 98765 43210 | Bhopal, India',
  'linkedin.com/in/anamsayyed',
  '',
  'SUMMARY',
  'Full-stack developer with 3+ years building scalable web applications.',
  '',
  'EXPERIENCE',
  'Software Engineer | Technoart Pvt Ltd | Bhopal',
  'Jan 2022 - Present',
  '- Developed REST APIs at Technoart using Python and Django',
  '- Built React dashboards for internal analytics',
  '',
  'Junior Developer | Infosys',
  'Jun 2020 - Dec 2021',
  '- Maintained enterprise Java applications',
  '',
  'EDUCATION',
  'B.Tech Computer Science | RGPV Bhopal',
  '2016 - 2020 | CGPA: 8.2',
  '',
  'SKILLS',
  'Python, Django, React, JavaScript, PostgreSQL, Docker',
  '',
  'PROJECTS',
  'Job Portal App',
  'Built a full-stack job portal with Next.js and PostgreSQL',
  'Technologies: Next.js, React, PostgreSQL',
  'github.com/anam/jobportal',
].join('\n');

const DEVELOPER_GROUND_TRUTH = {
  fullName: 'Anam Sayyed',
  email: 'anam@example.com',
  phone: '+91 98765 43210',
  location: 'Bhopal, India',
  linkedin: 'linkedin.com/in/anamsayyed',
  summary:
    'Full-stack developer with 3+ years building scalable web applications.',
  skills: ['Python', 'Django', 'React', 'JavaScript', 'PostgreSQL', 'Docker'],
  experience: [
    {
      company: 'Technoart Pvt Ltd',
      position: 'Software Engineer',
      location: 'Bhopal',
      startDate: '2022-01',
      current: true,
      description: '',
      achievements: [
        'Developed REST APIs at Technoart using Python and Django',
        'Built React dashboards for internal analytics',
      ],
    },
    {
      company: 'Infosys',
      position: 'Junior Developer',
      startDate: '2020-06',
      endDate: '2021-12',
      current: false,
      description: '',
      achievements: ['Maintained enterprise Java applications'],
    },
  ],
  education: [
    {
      institution: 'RGPV Bhopal',
      degree: 'B.Tech Computer Science',
      field: '',
      startDate: '2016',
      endDate: '2020',
      gpa: '8.2',
    },
  ],
  projects: [
    {
      name: 'Job Portal App',
      description: 'Built a full-stack job portal with Next.js and PostgreSQL',
      technologies: ['Next.js', 'React', 'PostgreSQL'],
      url: 'github.com/anam/jobportal',
    },
  ],
  certifications: [],
  languages: [],
  confidence: 0,
  rawText: DEVELOPER_RAW,
};

const FRESHER_RAW = [
  'Priya Sharma',
  'priya.sharma@email.com | Pune, India',
  '',
  'OBJECTIVE',
  'Motivated computer science graduate seeking a software developer role.',
  '',
  'EDUCATION',
  'B.E. Information Technology | Pune University',
  '2020 - 2024',
  '',
  'SKILLS',
  'Java, Python, SQL, HTML, CSS',
  '',
  'PROJECTS',
  'Library Management System',
  'Academic project using Java and MySQL',
  'Technologies: Java, MySQL',
].join('\n');

const FRESHER_GROUND_TRUTH = {
  fullName: 'Priya Sharma',
  email: 'priya.sharma@email.com',
  location: 'Pune, India',
  phone: '',
  summary: 'Motivated computer science graduate seeking a software developer role.',
  skills: ['Java', 'Python', 'SQL', 'HTML', 'CSS'],
  experience: [],
  education: [
    {
      institution: 'Pune University',
      degree: 'B.E. Information Technology',
      field: '',
      startDate: '2020',
      endDate: '2024',
    },
  ],
  projects: [
    {
      name: 'Library Management System',
      description: 'Academic project using Java and MySQL',
      technologies: ['Java', 'MySQL'],
    },
  ],
  certifications: [],
  languages: [],
  confidence: 0,
  rawText: FRESHER_RAW,
};

export const BENCHMARK_FIXTURES: BenchmarkCase[] = [
  {
    id: 'developer-single-column',
    name: 'Developer Resume (Single Column)',
    description: 'Standard developer resume with experience, education, skills, and projects.',
    tags: ['developer', 'experienced', 'single_column', 'ats'],
    format: 'text',
    rawText: DEVELOPER_RAW,
    groundTruth: DEVELOPER_GROUND_TRUTH,
    skillExpectations: [
      { name: 'Python', category: 'Programming Languages' },
      { name: 'React', category: 'Frameworks' },
    ],
    validationExpectation: {
      maxErrors: 2,
      maxWarnings: 8,
      maxRepairs: 10,
    },
  },
  {
    id: 'fresher-academic',
    name: 'Fresher Academic CV',
    description: 'Entry-level resume with education and academic project focus.',
    tags: ['fresher', 'academic', 'single_column', 'ats'],
    format: 'text',
    rawText: FRESHER_RAW,
    groundTruth: FRESHER_GROUND_TRUTH,
    validationExpectation: {
      maxErrors: 3,
      maxWarnings: 10,
    },
  },
];

export function getBenchmarkFixture(id: string): BenchmarkCase | undefined {
  return BENCHMARK_FIXTURES.find((f) => f.id === id);
}

export function listBenchmarkFixtures(tags?: string[]): BenchmarkCase[] {
  if (!tags?.length) return [...BENCHMARK_FIXTURES];
  return BENCHMARK_FIXTURES.filter((f) => tags.some((t) => f.tags.includes(t as never)));
}
