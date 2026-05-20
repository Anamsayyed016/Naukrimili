/**
 * Layer 1–2: Role + experience intelligence (cached, no API).
 * JD (Layer 3) enhances via orchestrator when available.
 */

import type { ExperienceLevel, OptimizationReport, ProjectSuggestion } from './types';

export interface RoleFirstProfile {
  skills: string[];
  atsKeywords: string[];
  summaryStarter: string;
  projects: ProjectSuggestion[];
  certifications: string[];
  recruiterTips: string[];
  industryTools: string[];
  recruiterExpectations: string[];
  fresherGuidance: string[];
}

type RoleKey =
  | 'software'
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'data'
  | 'hr'
  | 'recruiter'
  | 'design'
  | 'marketing'
  | 'product'
  | 'business'
  | 'devops'
  | 'qa'
  | 'general';

function normalizeRoleKey(targetRole: string): RoleKey {
  const r = targetRole.toLowerCase();
  if (r.includes('frontend')) return 'frontend';
  if (r.includes('backend')) return 'backend';
  if (r.includes('full stack') || r.includes('fullstack')) return 'fullstack';
  if (r.includes('devops') || r.includes('sre')) return 'devops';
  if (r.includes('qa') || r.includes('quality') || r.includes('test')) return 'qa';
  if (r.includes('data')) return 'data';
  if (r.includes('hr') || r.includes('human resource')) return 'hr';
  if (r.includes('recruit')) return 'recruiter';
  if (r.includes('ui') || r.includes('ux') || r.includes('design')) return 'design';
  if (r.includes('marketing') || r.includes('digital')) return 'marketing';
  if (r.includes('product')) return 'product';
  if (r.includes('business analyst')) return 'business';
  if (
    r.includes('software') ||
    r.includes('developer') ||
    r.includes('engineer') ||
    r.includes('programmer')
  ) {
    return 'software';
  }
  return 'general';
}

function isEntryLevel(level: string): boolean {
  return level === 'fresher' || level === 'student';
}

const BASE_PROFILES: Record<RoleKey, Omit<RoleFirstProfile, 'fresherGuidance'>> = {
  software: {
    skills: [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'REST APIs',
      'Git',
      'SQL',
      'Problem Solving',
      'Data Structures',
      'Agile',
    ],
    atsKeywords: [
      'software development',
      'full lifecycle',
      'code review',
      'debugging',
      'API integration',
      'scalable',
      'collaboration',
    ],
    summaryStarter:
      'Motivated software developer with hands-on experience building web applications, writing clean code, and collaborating in agile teams. Strong foundation in JavaScript, APIs, and problem-solving with a focus on reliable, user-focused delivery.',
    projects: [
      {
        title: 'Task Management Web App',
        description:
          'Built a full-stack app with authentication, CRUD workflows, and REST APIs. Deployed with CI/CD and documented API endpoints.',
        forFresher: true,
      },
      {
        title: 'Open Source Contribution',
        description:
          'Fixed bugs and added features in a public GitHub repo; included tests and clear commit history recruiters can verify.',
        forFresher: true,
      },
    ],
    certifications: ['AWS Cloud Practitioner', 'Meta Front-End Developer', 'Google IT Support'],
    recruiterTips: [
      'Link a GitHub profile with 2–3 polished repos—not homework dumps.',
      'Quantify impact where honest: users served, latency improved, bugs reduced.',
      'List tools you can explain in an interview, not buzzwords only.',
    ],
    industryTools: ['GitHub', 'VS Code', 'Postman', 'Docker', 'Jira', 'PostgreSQL'],
    recruiterExpectations: [
      'Can explain a project end-to-end (problem, stack, your role, outcome).',
      'Comfortable with Git workflows and basic system design vocabulary.',
      'Shows learning velocity through projects, internships, or certifications.',
    ],
  },
  frontend: {
    skills: [
      'React',
      'TypeScript',
      'HTML5',
      'CSS3',
      'Tailwind CSS',
      'Responsive Design',
      'Git',
      'REST APIs',
      'Web Accessibility',
      'Performance Optimization',
    ],
    atsKeywords: [
      'responsive UI',
      'component-driven',
      'cross-browser',
      'Core Web Vitals',
      'design systems',
      'frontend architecture',
    ],
    summaryStarter:
      'Frontend developer focused on accessible, responsive interfaces and component-driven architecture. Experienced with React, modern CSS, and performance-minded UI delivery.',
    projects: [
      {
        title: 'Portfolio Website',
        description:
          'Responsive personal site with optimized assets, semantic HTML, and Lighthouse-friendly performance scores.',
        forFresher: true,
      },
    ],
    certifications: ['Meta Front-End Developer', 'Google UX Design Certificate'],
    recruiterTips: [
      'Include a live demo link or deployed portfolio—not screenshots only.',
      'Mention accessibility (WCAG) and mobile-first patterns when true.',
    ],
    industryTools: ['Figma', 'Storybook', 'Vite', 'Chrome DevTools', 'npm'],
    recruiterExpectations: [
      'Strong HTML/CSS fundamentals beyond framework usage.',
      'Can discuss state management and component reuse patterns.',
    ],
  },
  backend: {
    skills: [
      'Node.js',
      'Python',
      'REST APIs',
      'PostgreSQL',
      'Authentication',
      'Microservices',
      'Git',
      'Docker',
      'Caching',
      'System Design Basics',
    ],
    atsKeywords: [
      'API design',
      'database modeling',
      'security',
      'scalability',
      'logging',
      'monitoring',
    ],
    summaryStarter:
      'Backend developer building secure, scalable APIs and data models. Experienced with server-side logic, database design, and production-ready error handling.',
    projects: [
      {
        title: 'REST API Service',
        description:
          'Designed authenticated REST endpoints with validation, pagination, and PostgreSQL persistence; included API docs.',
        forFresher: true,
      },
    ],
    certifications: ['AWS Cloud Practitioner', 'MongoDB Developer'],
    recruiterTips: [
      'Highlight auth, validation, and error handling—not only CRUD.',
      'Show schema design or indexing decisions when applicable.',
    ],
    industryTools: ['Postman', 'Redis', 'Docker', 'GitHub Actions', 'Swagger'],
    recruiterExpectations: [
      'Understands HTTP, auth flows, and basic SQL optimization.',
      'Can articulate trade-offs in API and data modeling choices.',
    ],
  },
  fullstack: {
    skills: [
      'React',
      'Node.js',
      'TypeScript',
      'PostgreSQL',
      'REST APIs',
      'Git',
      'Docker',
      'CI/CD',
      'Tailwind CSS',
      'Cloud Deployment',
    ],
    atsKeywords: [
      'full stack',
      'end-to-end delivery',
      'MERN',
      'deployment',
      'integration',
    ],
    summaryStarter:
      'Full stack developer delivering end-to-end features from UI to database. Comfortable owning implementation, integration, and deployment of production web applications.',
    projects: [
      {
        title: 'SaaS MVP',
        description:
          'Built and deployed a full-stack MVP with auth, dashboard, and billing-ready architecture; documented setup for reviewers.',
        forFresher: true,
      },
    ],
    certifications: ['AWS Cloud Practitioner', 'Meta Full-Stack Engineer'],
    recruiterTips: [
      'Show one project where you touched both UI and API layers.',
      'Mention deployment platform (Vercel, AWS, Railway) if used.',
    ],
    industryTools: ['Next.js', 'Prisma', 'Vercel', 'GitHub', 'Postman'],
    recruiterExpectations: [
      'Can demo a working product, not isolated code snippets.',
      'Balances frontend polish with backend reliability.',
    ],
  },
  data: {
    skills: [
      'SQL',
      'Excel',
      'Python',
      'Data Visualization',
      'Power BI',
      'Statistics',
      'ETL',
      'Reporting',
      'Critical Thinking',
    ],
    atsKeywords: [
      'data analysis',
      'dashboards',
      'KPIs',
      'insights',
      'data cleaning',
      'stakeholder reporting',
    ],
    summaryStarter:
      'Data analyst translating business questions into SQL queries, dashboards, and actionable insights. Strong in data cleaning, visualization, and stakeholder-ready reporting.',
    projects: [
      {
        title: 'Sales Analytics Dashboard',
        description:
          'Analyzed sample sales data, built KPI dashboards, and documented findings with recommendations for leadership.',
        forFresher: true,
      },
    ],
    certifications: ['Google Data Analytics', 'Microsoft Power BI Data Analyst'],
    recruiterTips: [
      'Attach a portfolio link with 1–2 dashboard screenshots and methodology notes.',
      'Use metric-driven bullet points when data is available.',
    ],
    industryTools: ['Power BI', 'Tableau', 'Python', 'Jupyter', 'Google Sheets'],
    recruiterExpectations: [
      'Can explain how you validated data quality before reporting.',
      'Connects analysis to business decisions, not only charts.',
    ],
  },
  hr: {
    skills: [
      'Recruitment',
      'Employee Engagement',
      'HRIS',
      'Onboarding',
      'Payroll Coordination',
      'Policy Administration',
      'Communication',
      'Conflict Resolution',
    ],
    atsKeywords: [
      'talent acquisition',
      'HR operations',
      'compliance',
      'employee lifecycle',
      'ATS',
      'stakeholder management',
    ],
    summaryStarter:
      'HR professional supporting recruitment, employee engagement, and HR operations. Skilled at onboarding, policy coordination, and building positive employee experiences.',
    projects: [
      {
        title: 'Campus Hiring Drive',
        description:
          'Coordinated end-to-end campus recruitment including screening rubrics, interview scheduling, and offer tracking.',
        forFresher: true,
      },
    ],
    certifications: ['SHRM-CP (pathway)', 'LinkedIn Recruiter Fundamentals'],
    recruiterTips: [
      'Highlight volume metrics: roles filled, time-to-hire, offer acceptance.',
      'Mention ATS tools you have actually used (Greenhouse, Lever, etc.).',
    ],
    industryTools: ['Workday', 'BambooHR', 'LinkedIn Recruiter', 'Greenhouse'],
    recruiterExpectations: [
      'Strong written communication and confidentiality awareness.',
      'Experience with structured interview and onboarding processes.',
    ],
  },
  recruiter: {
    skills: [
      'Sourcing',
      'Boolean Search',
      'LinkedIn Recruiting',
      'Interview Coordination',
      'Candidate Screening',
      'ATS',
      'Employer Branding',
      'Stakeholder Management',
    ],
    atsKeywords: [
      'full-cycle recruiting',
      'pipeline',
      'sourcing',
      'screening',
      'offer negotiation',
      'time-to-fill',
    ],
    summaryStarter:
      'Recruiter experienced in full-cycle hiring, proactive sourcing, and candidate experience. Proficient with ATS workflows and hiring manager partnership.',
    projects: [],
    certifications: ['AIRS Certified Internet Recruiter', 'LinkedIn Recruiter'],
    recruiterTips: [
      'Quantify placements, niche roles filled, or pipeline conversion rates.',
      'Show familiarity with both inbound and outbound sourcing channels.',
    ],
    industryTools: ['LinkedIn Recruiter', 'Greenhouse', 'Lever', 'Indeed'],
    recruiterExpectations: [
      'Can run a structured intake and screening process.',
      'Balances speed with quality-of-hire signals.',
    ],
  },
  design: {
    skills: [
      'Figma',
      'UI Design',
      'UX Research',
      'Wireframing',
      'Prototyping',
      'Design Systems',
      'User Flows',
      'Visual Design',
    ],
    atsKeywords: [
      'user-centered design',
      'usability',
      'design systems',
      'prototyping',
      'accessibility',
    ],
    summaryStarter:
      'UI/UX designer creating user-centered flows, prototypes, and visual systems. Experienced in research-informed design and cross-functional collaboration with engineering.',
    projects: [
      {
        title: 'Mobile App Redesign Case Study',
        description:
          'Documented problem, user flows, wireframes, and high-fidelity prototype with usability rationale.',
        forFresher: true,
      },
    ],
    certifications: ['Google UX Design', 'Nielsen Norman Group UX Certificate'],
    recruiterTips: [
      'Link a portfolio with case studies—not only final screens.',
      'Explain your design decisions and user impact.',
    ],
    industryTools: ['Figma', 'Adobe XD', 'Miro', 'FigJam'],
    recruiterExpectations: [
      'Portfolio demonstrates process, not just aesthetics.',
      'Can articulate handoff to developers clearly.',
    ],
  },
  marketing: {
    skills: [
      'SEO',
      'Google Analytics',
      'Content Marketing',
      'Social Media',
      'Campaign Management',
      'Copywriting',
      'Email Marketing',
      'A/B Testing',
    ],
    atsKeywords: [
      'digital marketing',
      'conversion',
      'ROI',
      'lead generation',
      'brand awareness',
      'analytics',
    ],
    summaryStarter:
      'Digital marketing specialist driving awareness and conversions through SEO, content, and paid/organic campaigns. Data-informed approach to audience growth and engagement.',
    projects: [
      {
        title: 'Growth Campaign Case Study',
        description:
          'Planned and executed a multi-channel campaign; tracked KPIs and iterated based on analytics.',
        forFresher: true,
      },
    ],
    certifications: ['Google Analytics', 'HubSpot Inbound', 'Meta Blueprint'],
    recruiterTips: [
      'Include campaign metrics: CTR, CPL, ROAS when available.',
      'Show channel mix and tools used authentically.',
    ],
    industryTools: ['Google Analytics', 'HubSpot', 'Canva', 'Meta Ads Manager'],
    recruiterExpectations: [
      'Connect tactics to measurable outcomes.',
      'Understands funnel basics and audience segmentation.',
    ],
  },
  product: {
    skills: [
      'Product Discovery',
      'Roadmapping',
      'User Stories',
      'Agile',
      'Stakeholder Management',
      'Analytics',
      'Prioritization',
      'PRD Writing',
    ],
    atsKeywords: [
      'product lifecycle',
      'KPIs',
      'cross-functional',
      'customer discovery',
      'backlog',
    ],
    summaryStarter:
      'Product manager partnering with engineering and design to ship user-valued features. Skilled in discovery, prioritization, and outcome-driven roadmaps.',
    projects: [
      {
        title: 'Feature Launch Case Study',
        description:
          'Defined problem statement, success metrics, and rollout plan for a user-facing feature with post-launch learnings.',
        forFresher: true,
      },
    ],
    certifications: ['Product School PM Certificate', 'CSPO'],
    recruiterTips: [
      'Frame impact as outcomes (retention, adoption), not activity lists.',
      'Show how you validated assumptions before building.',
    ],
    industryTools: ['Jira', 'Amplitude', 'Figma', 'Notion', 'Miro'],
    recruiterExpectations: [
      'Clear narrative from problem → solution → result.',
      'Comfort with ambiguity and cross-team communication.',
    ],
  },
  business: {
    skills: [
      'Requirements Gathering',
      'Process Mapping',
      'SQL',
      'Excel',
      'Stakeholder Interviews',
      'Documentation',
      'UAT',
      'Agile',
    ],
    atsKeywords: [
      'business analysis',
      'BRD',
      'workflows',
      'requirements',
      'gap analysis',
    ],
    summaryStarter:
      'Business analyst bridging stakeholders and delivery teams through clear requirements, process analysis, and actionable documentation.',
    projects: [],
    certifications: ['IIBA ECBA', 'CBAP pathway'],
    recruiterTips: [
      'Use examples of requirements you translated into shipped features.',
      'Highlight workshops or UAT sessions you led.',
    ],
    industryTools: ['Jira', 'Confluence', 'Visio', 'Lucidchart'],
    recruiterExpectations: [
      'Structured thinking and strong written specs.',
      'Can trace requirements to business value.',
    ],
  },
  devops: {
    skills: [
      'Linux',
      'Docker',
      'Kubernetes',
      'CI/CD',
      'AWS',
      'Terraform',
      'Monitoring',
      'Scripting',
      'Git',
    ],
    atsKeywords: [
      'infrastructure as code',
      'deployment automation',
      'reliability',
      'SRE',
      'pipelines',
    ],
    summaryStarter:
      'DevOps engineer automating deployments, improving reliability, and supporting scalable infrastructure with CI/CD and cloud tooling.',
    projects: [
      {
        title: 'CI/CD Pipeline Setup',
        description:
          'Configured automated build/test/deploy pipeline with containerized services and environment promotion.',
        forFresher: true,
      },
    ],
    certifications: ['AWS Solutions Architect Associate', 'CKA'],
    recruiterTips: [
      'Mention incident response or uptime improvements when true.',
      'Show IaC samples or pipeline diagrams in portfolio.',
    ],
    industryTools: ['GitHub Actions', 'Terraform', 'Prometheus', 'Grafana'],
    recruiterExpectations: [
      'Understands containers, networking basics, and observability.',
      'Can explain a deployment you improved end-to-end.',
    ],
  },
  qa: {
    skills: [
      'Manual Testing',
      'Test Cases',
      'Selenium',
      'API Testing',
      'Bug Tracking',
      'Regression Testing',
      'Jira',
      'Agile',
    ],
    atsKeywords: [
      'quality assurance',
      'test planning',
      'defect management',
      'automation',
      'UAT',
    ],
    summaryStarter:
      'QA engineer ensuring product quality through structured test planning, automation, and clear defect reporting across agile releases.',
    projects: [],
    certifications: ['ISTQB Foundation Level'],
    recruiterTips: [
      'Quantify defects caught pre-release or test coverage improvements.',
      'List automation frameworks you can demo.',
    ],
    industryTools: ['Jira', 'Postman', 'Selenium', 'TestRail'],
    recruiterExpectations: [
      'Methodical test design and reproducible bug reports.',
      'Partners effectively with developers on quality gates.',
    ],
  },
  general: {
    skills: [
      'Communication',
      'Problem Solving',
      'Team Collaboration',
      'Microsoft Office',
      'Time Management',
      'Adaptability',
    ],
    atsKeywords: [
      'results-driven',
      'cross-functional',
      'stakeholder',
      'initiative',
      'detail-oriented',
    ],
    summaryStarter:
      'Motivated professional with strong communication and problem-solving skills, eager to contribute to team goals and grow in a {role} capacity.',
    projects: [],
    certifications: [],
    recruiterTips: [
      'Tailor skills and projects to the specific role title.',
      'Use action verbs and measurable outcomes where possible.',
    ],
    industryTools: ['Microsoft 365', 'Google Workspace', 'Slack'],
    recruiterExpectations: [
      'Clear, honest representation of skills and experience level.',
      'Evidence of learning through projects, internships, or coursework.',
    ],
  },
};

const FRESHER_GUIDANCE_COMMON = [
  'Lead with projects and internships if full-time experience is limited.',
  'Keep resume to one page; prioritize relevance over length.',
  'Add GitHub, portfolio, or LinkedIn links recruiters can verify quickly.',
  'Use ATS-friendly section headings: Experience, Education, Skills, Projects.',
];

export function getRoleFirstProfile(
  targetRole: string,
  experienceLevel: ExperienceLevel | string
): RoleFirstProfile {
  const key = normalizeRoleKey(targetRole);
  const base = BASE_PROFILES[key] || BASE_PROFILES.general;
  const entry = isEntryLevel(String(experienceLevel));

  let summaryStarter = base.summaryStarter;
  if (key === 'general' && targetRole.trim()) {
    summaryStarter = summaryStarter.replace('{role}', targetRole.trim());
  }

  const fresherGuidance = entry
    ? [
        ...FRESHER_GUIDANCE_COMMON,
        ...(key === 'software' || key === 'frontend' || key === 'fullstack'
          ? [
              'Build 2–3 portfolio projects with README files explaining your role and stack.',
              'Practice explaining one project in under 90 seconds for interviews.',
            ]
          : []),
        ...(key === 'hr' || key === 'recruiter'
          ? [
              'Highlight any campus drives, volunteer coordination, or admin experience.',
              'Show comfort with ATS and structured screening workflows.',
            ]
          : []),
      ]
    : [
        'Lead with recent, relevant achievements in the last 5–7 years.',
        'Align bullet points to the target role keywords naturally—not stuffed.',
      ];

  const projects = base.projects.map((p) => ({
    ...p,
    forFresher: entry,
  }));

  return {
    ...base,
    summaryStarter,
    projects,
    fresherGuidance,
  };
}

export function estimateRoleSkillMatch(
  formData: Record<string, unknown>,
  profile: RoleFirstProfile
): number {
  const existing = Array.isArray(formData.skills)
    ? (formData.skills as string[]).map((s) => s.toLowerCase().trim())
    : [];
  if (profile.skills.length === 0) return 50;
  const matched = profile.skills.filter((skill) => {
    const s = skill.toLowerCase();
    return existing.some((e) => e.includes(s) || s.includes(e));
  });
  return Math.min(100, Math.round((matched.length / profile.skills.length) * 100));
}

/** Build a role-first OptimizationReport shell (Layer 1–2, no JD). */
export function buildRoleFirstReportBase(
  targetRole: string,
  experienceLevel: string,
  formData: Record<string, unknown>,
  profile: RoleFirstProfile,
  structureScore: number
): OptimizationReport {
  const roleMatch = estimateRoleSkillMatch(formData, profile);
  const combinedAts = Math.round(structureScore * 0.45 + roleMatch * 0.55);

  return {
    success: true,
    atsScore: Math.min(100, combinedAts),
    roleMatchPercent: roleMatch,
    targetRole,
    experienceLevel,
    matchedKeywords: [],
    missingKeywords: profile.atsKeywords.slice(0, 8),
    missingSkills: profile.skills.slice(0, 8),
    skillGaps: profile.skills.slice(0, 6).map((skill) => ({
      skill,
      priority: 'medium' as const,
      reason: 'Commonly expected for this role—add if you have exposure.',
    })),
    qualityIssues: [],
    summary: {
      current: String(formData.summary || ''),
      suggested: profile.summaryStarter,
      rationale: 'Role-based starter summary—paste a JD to personalize further.',
    },
    experienceBullets: [],
    suggestedProjects: profile.projects,
    suggestedCertifications: profile.certifications,
    suggestedSkills: profile.skills,
    atsKeywords: profile.atsKeywords,
    roleSpecificRecommendations: profile.recruiterExpectations,
    fresherGuidance: profile.fresherGuidance,
    recruiterNotes: profile.recruiterTips,
    provider: 'role-first',
    cached: false,
  };
}

export function mergeAtsIntoRoleFirstReport(
  base: OptimizationReport,
  ats: {
    summary?: string;
    skills?: string[];
    ats_keywords?: string[];
    experience_bullets?: string[];
    projects?: Array<{ title: string; description: string }>;
  },
  experienceLevel: string
): OptimizationReport {
  const entry = isEntryLevel(experienceLevel);
  return {
    ...base,
    summary: {
      ...base.summary,
      suggested: ats.summary?.trim() || base.summary.suggested,
      rationale: base.summary.rationale,
    },
    suggestedSkills: [...new Set([...(ats.skills || []), ...base.suggestedSkills])].slice(0, 16),
    atsKeywords: [...new Set([...(ats.ats_keywords || []), ...base.atsKeywords])].slice(0, 25),
    suggestedProjects:
      (ats.projects?.length ?? 0) > 0
        ? ats.projects!.map((p) => ({ ...p, forFresher: entry }))
        : base.suggestedProjects,
    experienceBullets:
      (ats.experience_bullets?.length ?? 0) > 0
        ? ats.experience_bullets!.slice(0, 4).map((improved, i) => ({
            experienceIndex: i,
            original: '',
            improved,
            rationale: 'Role-aligned achievement bullet',
          }))
        : base.experienceBullets,
    provider: 'role-first+ats',
  };
}
