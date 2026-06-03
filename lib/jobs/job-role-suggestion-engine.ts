/**
 * Sector-aware job posting suggestions (employer create/edit forms).
 * Used by form-suggestions fallbacks and deterministic routing — no API contract changes.
 */

export type JobRoleCategory =
  | 'software_frontend'
  | 'software_backend'
  | 'software_fullstack'
  | 'software_general'
  | 'accounting'
  | 'hr'
  | 'sales'
  | 'digital_marketing'
  | 'teaching'
  | 'nurse'
  | 'medical'
  | 'driver'
  | 'factory'
  | 'civil_engineering'
  | 'bpo'
  | 'beauty'
  | 'general';

export interface JobPostingSuggestionContext {
  jobTitle?: string;
  jobDescription?: string;
  industry?: string;
  experienceLevel?: string;
  jobType?: string;
  skills?: string[];
  companyName?: string;
  companyDescription?: string;
  userInput?: string;
  suggestionDomain?: string;
  isProjectDescription?: boolean;
}

const SUGGESTION_LIMIT = 8;

type RoleTemplate = {
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  titleVariants: string[];
};

const ROLE_TEMPLATES: Record<JobRoleCategory, RoleTemplate> = {
  software_frontend: {
    skills: ['React', 'Redux', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'REST API', 'Git', 'Responsive UI', 'Webpack'],
    requirements: [
      '2+ years of hands-on React development experience',
      'Strong JavaScript/TypeScript fundamentals and component architecture',
      'Experience building responsive, accessible user interfaces',
      'Proficiency integrating REST APIs and handling application state',
      'Familiarity with modern build tools and version control (Git)',
    ],
    responsibilities: [
      'Develop and maintain responsive web applications using React and modern front-end practices',
      'Translate UI/UX designs into reusable components with clean, maintainable code',
      'Integrate REST/GraphQL APIs and optimize client-side performance',
      'Collaborate with backend, QA, and product teams in agile delivery cycles',
      'Participate in code reviews, testing, and continuous improvement of the UI codebase',
    ],
    titleVariants: ['React Developer', 'Frontend Developer', 'UI Developer', 'Senior React Engineer', 'JavaScript Developer', 'Front-End Engineer'],
  },
  software_backend: {
    skills: ['Node.js', 'Express', 'Python', 'Java', 'REST API', 'PostgreSQL', 'MongoDB', 'Docker', 'Git', 'Microservices'],
    requirements: [
      '2+ years of backend development experience with scalable APIs',
      'Strong knowledge of server-side languages and database design',
      'Experience with authentication, caching, and API security best practices',
      'Ability to write clean, testable services and troubleshoot production issues',
      'Comfortable with CI/CD and cloud deployment workflows',
    ],
    responsibilities: [
      'Design, build, and maintain scalable backend services and RESTful APIs',
      'Implement data models, queries, and integrations with third-party systems',
      'Optimize application performance, reliability, and security',
      'Work with front-end and DevOps teams to deliver end-to-end features',
      'Monitor logs, fix defects, and improve system observability',
    ],
    titleVariants: ['Backend Developer', 'Node.js Developer', 'API Developer', 'Senior Backend Engineer', 'Python Developer', 'Java Backend Engineer'],
  },
  software_fullstack: {
    skills: ['React', 'Node.js', 'TypeScript', 'JavaScript', 'PostgreSQL', 'REST API', 'Git', 'AWS', 'Docker', 'CI/CD'],
    requirements: [
      '3+ years of full-stack development across React and Node (or similar stack)',
      'Experience owning features from database schema to UI implementation',
      'Solid understanding of API design, authentication, and deployment',
      'Ability to debug issues across the stack and deliver production-ready code',
    ],
    responsibilities: [
      'Own full-stack feature delivery from database design through user-facing UI',
      'Build and maintain APIs, services, and interactive web applications',
      'Collaborate on architecture decisions, code quality, and release planning',
      'Improve developer experience, testing coverage, and deployment pipelines',
    ],
    titleVariants: ['Full Stack Developer', 'Full-Stack Engineer', 'MERN Stack Developer', 'Software Engineer (Full Stack)', 'Web Application Developer'],
  },
  software_general: {
    skills: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'SQL', 'Git', 'Docker', 'APIs'],
    requirements: [
      '2+ years of software engineering experience in a product or services environment',
      'Proficiency in at least one modern programming language and framework',
      'Experience with databases, APIs, and version control workflows',
      'Strong problem-solving skills and ability to work in agile teams',
    ],
    responsibilities: [
      'Analyze requirements, design solutions, and implement high-quality software features',
      'Write clean, testable code and participate in peer code reviews',
      'Debug production issues and contribute to system reliability improvements',
      'Collaborate with cross-functional stakeholders to deliver on roadmap priorities',
    ],
    titleVariants: ['Software Engineer', 'Software Developer', 'Application Developer', 'Senior Software Engineer', 'Technical Lead', 'Engineering Specialist'],
  },
  accounting: {
    skills: ['GST', 'TDS', 'Tally', 'Excel', 'Bookkeeping', 'Financial Reporting', 'Tax Compliance', 'Auditing', 'MS Excel', 'Bank Reconciliation'],
    requirements: [
      'Degree or professional qualification in Accounting/Commerce (preferred)',
      'Hands-on experience with GST, TDS, and statutory compliance',
      'Proficiency in Tally/ERP and advanced Excel for reporting',
      'Strong attention to detail for month-end close and audit support',
    ],
    responsibilities: [
      'Manage day-to-day bookkeeping, vouchers, and ledger reconciliations',
      'Prepare GST returns, TDS filings, and compliance documentation',
      'Support financial reporting, budgeting, and audit requirements',
      'Coordinate with vendors, banks, and internal teams on payment cycles',
    ],
    titleVariants: ['Accountant', 'Senior Accountant', 'Accounts Executive', 'Finance Executive', 'Tax Accountant', 'Accounts Officer'],
  },
  hr: {
    skills: ['Recruitment', 'Payroll', 'Employee Engagement', 'HRMS', 'Interview Coordination', 'Onboarding', 'HR Policies', 'Talent Acquisition'],
    requirements: [
      '1–3+ years of HR operations or recruitment experience',
      'Experience coordinating interviews and managing candidate pipelines',
      'Knowledge of payroll processing and employee lifecycle workflows',
      'Excellent communication and stakeholder management skills',
    ],
    responsibilities: [
      'Source, screen, and coordinate candidates through the hiring pipeline',
      'Support onboarding, attendance, and employee documentation',
      'Assist with payroll inputs, HRMS updates, and policy communication',
      'Drive employee engagement initiatives and HR reporting',
    ],
    titleVariants: ['HR Executive', 'HR Coordinator', 'Talent Acquisition Executive', 'Recruitment Specialist', 'HR Generalist', 'People Operations Executive'],
  },
  sales: {
    skills: ['Lead Generation', 'CRM', 'Negotiation', 'Client Relationship', 'Pipeline Management', 'Cold Calling', 'B2B Sales', 'Closing Deals'],
    requirements: [
      'Proven sales experience with measurable revenue or conversion targets',
      'Strong negotiation, presentation, and relationship-building skills',
      'Comfort using CRM tools to track leads and follow-ups',
      'Ability to understand customer needs and close deals ethically',
    ],
    responsibilities: [
      'Generate and qualify leads through outbound and inbound channels',
      'Manage the sales pipeline in CRM and forecast monthly targets',
      'Conduct product demos, proposals, and contract negotiations',
      'Build long-term client relationships and upsell where appropriate',
    ],
    titleVariants: ['Sales Executive', 'Business Development Executive', 'Inside Sales Representative', 'Account Executive', 'Sales Consultant', 'Regional Sales Officer'],
  },
  digital_marketing: {
    skills: ['SEO', 'Google Ads', 'Meta Ads', 'Content Marketing', 'Google Analytics', 'Social Media Marketing', 'Campaign Management', 'Copywriting'],
    requirements: [
      'Experience running SEO and paid campaigns (Google/Meta)',
      'Ability to analyze campaign performance and optimize ROAS/CPL',
      'Strong content, landing page, and funnel optimization skills',
      'Familiarity with analytics dashboards and A/B testing',
    ],
    responsibilities: [
      'Plan and execute SEO, SEM, and social paid campaigns across channels',
      'Create performance reports and optimize creatives, audiences, and budgets',
      'Collaborate on content calendars, landing pages, and conversion tracking',
      'Stay updated on platform policies, trends, and competitor activity',
    ],
    titleVariants: ['Digital Marketing Executive', 'Performance Marketing Specialist', 'SEO Specialist', 'Paid Ads Specialist', 'Social Media Manager', 'Growth Marketing Executive'],
  },
  teaching: {
    skills: ['Lesson Planning', 'Classroom Management', 'Student Assessment', 'Curriculum Delivery', 'Parent Communication', 'Educational Technology', 'Subject Expertise'],
    requirements: [
      'Relevant teaching qualification or subject expertise',
      'Experience delivering structured lessons and managing classroom discipline',
      'Ability to assess student progress and provide constructive feedback',
      'Strong communication with students, parents, and school administration',
    ],
    responsibilities: [
      'Deliver engaging lessons aligned with curriculum and learning outcomes',
      'Prepare lesson plans, assignments, and assessment materials',
      'Monitor student progress and maintain academic records',
      'Participate in parent meetings, staff development, and school activities',
    ],
    titleVariants: ['Teacher', 'Subject Teacher', 'Primary Teacher', 'Secondary Teacher', 'Academic Instructor', 'Education Coordinator'],
  },
  nurse: {
    skills: ['Patient Care', 'Clinical Skills', 'Vital Signs Monitoring', 'Medication Administration', 'Infection Control', 'EMR Documentation', 'Bedside Manner', 'Emergency Response'],
    requirements: [
      'Valid nursing registration/license as applicable',
      'Clinical experience in patient care and ward procedures',
      'Knowledge of infection control, documentation, and safety protocols',
      'Ability to work shifts and collaborate with medical teams',
    ],
    responsibilities: [
      'Provide direct patient care, monitoring, and comfort support',
      'Administer medications and treatments per physician orders',
      'Maintain accurate clinical documentation in EMR systems',
      'Coordinate with doctors, labs, and families on care plans',
    ],
    titleVariants: ['Staff Nurse', 'Registered Nurse', 'ICU Nurse', 'Ward Nurse', 'Clinical Nurse', 'Nursing Officer'],
  },
  medical: {
    skills: ['Diagnostics', 'Patient Consultation', 'Treatment Planning', 'Clinical Procedures', 'Medical Records', 'Healthcare Compliance', 'Bedside Manner'],
    requirements: [
      'Medical degree and valid license to practice',
      'Experience in outpatient/inpatient diagnosis and treatment planning',
      'Strong clinical judgment and ethical patient communication',
    ],
    responsibilities: [
      'Conduct patient consultations, examinations, and diagnoses',
      'Prescribe treatment plans and coordinate follow-up care',
      'Maintain medical records and comply with healthcare regulations',
    ],
    titleVariants: ['Medical Officer', 'General Physician', 'Resident Doctor', 'Consultant Physician', 'Clinical Specialist'],
  },
  driver: {
    skills: ['Valid Driving License', 'Route Planning', 'Vehicle Maintenance', 'Road Safety', 'GPS Navigation', 'Time Management', 'Customer Service'],
    requirements: [
      'Valid driving license for required vehicle class with clean record',
      'Knowledge of local routes, traffic rules, and safe driving practices',
      'Punctuality, reliability, and basic vehicle inspection habits',
    ],
    responsibilities: [
      'Transport passengers or goods safely along assigned routes',
      'Follow schedules, maintain logbooks, and report delays or incidents',
      'Perform basic vehicle checks and ensure cleanliness and compliance',
    ],
    titleVariants: ['Driver', 'Company Driver', 'Delivery Driver', 'Personal Driver', 'Fleet Driver', 'Logistics Driver'],
  },
  factory: {
    skills: ['Machine Operations', 'Safety Standards', 'Quality Inspection', 'Production Targets', '5S Practices', 'Equipment Maintenance', 'Shift Handover'],
    requirements: [
      'Experience in manufacturing/production floor operations',
      'Understanding of safety SOPs, PPE, and hazard reporting',
      'Ability to meet daily production and quality targets',
    ],
    responsibilities: [
      'Operate production machinery according to standard work instructions',
      'Conduct quality checks and record output/defect metrics',
      'Follow safety protocols and participate in continuous improvement',
    ],
    titleVariants: ['Factory Worker', 'Production Operator', 'Machine Operator', 'Assembly Line Worker', 'Manufacturing Associate'],
  },
  civil_engineering: {
    skills: ['AutoCAD', 'Site Management', 'Quantity Surveying', 'Structural Drawings', 'Project Scheduling', 'BOQ Preparation', 'Site Safety', 'Contractor Coordination'],
    requirements: [
      'B.Tech/B.E. in Civil Engineering or equivalent',
      'Experience with site execution, drawings, and contractor coordination',
      'Proficiency in AutoCAD and basic project documentation',
    ],
    responsibilities: [
      'Support site planning, execution, and progress reporting',
      'Review drawings, BOQs, and material requirements with site teams',
      'Monitor quality, safety, and timelines for civil works',
    ],
    titleVariants: ['Civil Engineer', 'Site Engineer', 'Junior Civil Engineer', 'Project Engineer (Civil)', 'Structural Site Coordinator'],
  },
  bpo: {
    skills: ['Communication Skills', 'Customer Service', 'CRM', 'Active Listening', 'Problem Solving', 'Conflict Resolution', 'Multi-tasking', 'Quality Metrics'],
    requirements: [
      'Excellent verbal communication in required languages',
      'Ability to handle high-volume customer interactions calmly',
      'Basic computer literacy and CRM/ticketing tool experience',
    ],
    responsibilities: [
      'Handle inbound/outbound customer queries per SOP and quality standards',
      'Document cases accurately and escalate complex issues',
      'Meet SLA, CSAT, and productivity targets consistently',
    ],
    titleVariants: ['BPO Executive', 'Customer Service Representative', 'Call Center Agent', 'Technical Support Associate', 'Customer Success Associate'],
  },
  beauty: {
    skills: ['Bridal Makeup', 'Hair Styling', 'Skin Care', 'Client Consultation', 'Cosmetics', 'HD Makeup', 'Sanitation Standards', 'Retail Sales'],
    requirements: [
      'Certification or proven experience in beauty/cosmetology services',
      'Portfolio of bridal/event makeup work (preferred)',
      'Strong client consultation and hygiene practices',
    ],
    responsibilities: [
      'Deliver makeup and grooming services per client requirements',
      'Consult on products, skin prep, and look selection for events',
      'Maintain workstation hygiene and inventory of cosmetics',
    ],
    titleVariants: ['Makeup Artist', 'Beauty Consultant', 'Bridal Makeup Artist', 'Salon Stylist', 'Cosmetologist'],
  },
  general: {
    skills: ['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'MS Office', 'Customer Focus', 'Attention to Detail'],
    requirements: [
      'Relevant experience in a similar role or industry',
      'Strong communication and ability to work independently and in teams',
      'Willingness to learn tools, processes, and company standards quickly',
    ],
    responsibilities: [
      'Execute day-to-day responsibilities for the role with quality and timeliness',
      'Collaborate with internal teams to meet operational targets',
      'Maintain accurate records and follow company policies and procedures',
    ],
    titleVariants: [],
  },
};

const BENEFITS_BY_CATEGORY: Record<JobRoleCategory, string[]> = {
  software_frontend: [
    'Health Insurance',
    'Flexible Working Hours',
    'Remote Work Options',
    'Learning & Development Budget',
    'Performance Bonus',
    'Paid Time Off',
  ],
  software_backend: [
    'Health Insurance',
    'Flexible Hours',
    'Remote/Hybrid Work',
    'Tech Learning Budget',
    'Performance Bonus',
    'Provident Fund',
  ],
  software_fullstack: [
    'Health Insurance',
    'Flexible Hours',
    'Remote Work',
    'Upskilling Budget',
    'Annual Bonus',
    'Paid Leave',
  ],
  software_general: [
    'Health Insurance',
    'Flexible Hours',
    'Remote Work',
    'Learning Budget',
    'Performance Bonus',
    'Paid Time Off',
  ],
  accounting: [
    'Health Insurance',
    'Paid Leave',
    'Festival Bonus',
    'Professional Certification Support',
    'Provident Fund',
    'Flexible Hours',
  ],
  hr: [
    'Paid Leave',
    'Medical Coverage',
    'Employee Wellness Programs',
    'Festival Bonus',
    'Learning Budget',
    'Flexible Hours',
  ],
  sales: [
    'Sales Incentives',
    'Commission Structure',
    'Travel Allowance',
    'Mobile & Internet Reimbursement',
    'Health Insurance',
    'Performance Bonus',
  ],
  digital_marketing: [
    'Performance Bonus',
    'Tool/Software Budget',
    'Flexible Hours',
    'Remote Work Options',
    'Health Insurance',
    'Paid Leave',
  ],
  teaching: [
    'Paid Holidays',
    'Medical Coverage',
    'Training Workshops',
    'Festival Bonus',
    'Child Education Support',
    'Paid Leave',
  ],
  nurse: [
    'Medical Coverage',
    'Shift Allowance',
    'Paid Leave',
    'Uniform Allowance',
    'Festival Bonus',
    'Employee Wellness',
  ],
  medical: [
    'Medical Coverage',
    'Professional Development',
    'Paid Leave',
    'Malpractice Coverage Support',
    'Festival Bonus',
    'Continuing Education Allowance',
  ],
  driver: [
    'Fuel Allowance',
    'Vehicle Maintenance Support',
    'Health Insurance',
    'Paid Leave',
    'Overtime Pay',
    'Festival Bonus',
  ],
  factory: [
    'Health Insurance',
    'Overtime Pay',
    'Safety Equipment Provided',
    'Canteen/Meal Allowance',
    'Festival Bonus',
    'Paid Leave',
  ],
  civil_engineering: [
    'Site Allowance',
    'Health Insurance',
    'Travel Reimbursement',
    'Project Bonus',
    'Paid Leave',
    'Safety Gear Provided',
  ],
  bpo: [
    'Cab/Transport Facility',
    'Health Insurance',
    'Performance Incentives',
    'Night Shift Allowance',
    'Paid Leave',
    'Referral Bonus',
  ],
  beauty: [
    'Product Discounts',
    'Commission on Services',
    'Health Insurance',
    'Paid Leave',
    'Training on New Techniques',
    'Festival Bonus',
  ],
  general: [
    'Health Insurance',
    'Paid Leave',
    'Festival Bonus',
    'Flexible Hours',
    'Performance Incentives',
    'Employee Wellness',
  ],
};

function formatBenefitLine(benefit: string): string {
  const t = benefit.trim();
  if (!t) return '';
  if (/^[-•*]/.test(t)) return t;
  return `• ${t}`;
}

function getBenefitsForCategory(category: JobRoleCategory): string[] {
  return (BENEFITS_BY_CATEGORY[category] || BENEFITS_BY_CATEGORY.general).map(formatBenefitLine);
}

export function isEmployerJobPostingContext(
  context: Record<string, unknown>,
  field?: string
): boolean {
  if (context.suggestionDomain === 'job-posting') return true;
  if (context.isProjectDescription) return false;
  const f = (field || String(context.currentField || '')).toLowerCase();
  if (!['title', 'description', 'requirements', 'skills', 'benefits', 'jobtitle'].includes(f)) {
    return false;
  }
  return (
    typeof context.jobTitle === 'string' &&
    (typeof context.companyName === 'string' || typeof context.companyDescription === 'string')
  );
}

function buildCorpus(value: string, context: JobPostingSuggestionContext): string {
  const parts = [
    context.jobTitle,
    context.jobDescription,
    context.userInput,
    value,
    context.industry,
    context.experienceLevel,
    context.jobType,
    ...(Array.isArray(context.skills) ? context.skills : []),
  ];
  return parts
    .filter((p) => typeof p === 'string' && p.trim())
    .join(' ')
    .toLowerCase();
}

export function classifyJobRoleCategory(
  value: string,
  context: JobPostingSuggestionContext
): JobRoleCategory {
  const t = buildCorpus(value, context);

  if (/react|frontend|front-end|angular developer|vue developer|ui developer/.test(t)) return 'software_frontend';
  if (/node\.?js|backend developer|back-end|express developer|django developer/.test(t) && !/full.?stack/.test(t)) {
    return 'software_backend';
  }
  if (/full.?stack|mern|mean stack/.test(t)) return 'software_fullstack';
  if (/accountant|accounting|gst|tally|bookkeeping|taxation|audit executive|chartered/.test(t)) return 'accounting';
  if (/\bhr\b|human resource|recruitment|payroll|talent acquisition|people operations/.test(t)) return 'hr';
  if (/digital marketing|seo specialist|google ads|meta ads|performance marketing|social media manager/.test(t)) {
    return 'digital_marketing';
  }
  if (/marketing/.test(t) && !/digital/.test(t)) return 'digital_marketing';
  if (/sales executive|business development|bdm|account manager|inside sales/.test(t)) return 'sales';
  if (/\bnurse\b|staff nurse|icu nurse|ward nurse|nursing/.test(t)) return 'nurse';
  if (/doctor|physician|medical officer|surgeon|clinical/.test(t)) return 'medical';
  if (/teacher|lecturer|tutor|professor|education|classroom/.test(t)) return 'teaching';
  if (/driver|chauffeur|delivery driver|fleet/.test(t)) return 'driver';
  if (/factory|production operator|machine operator|manufacturing|assembly line/.test(t)) return 'factory';
  if (/civil engineer|site engineer|autocad|construction site|quantity survey/.test(t)) return 'civil_engineering';
  if (/bpo|call center|customer service representative|customer support/.test(t)) return 'bpo';
  if (/makeup|beauty|bridal|cosmet|salon/.test(t)) return 'beauty';
  if (/software|developer|programmer|devops|data scientist|data engineer|cloud engineer|\.net|java developer|python developer/.test(t)) {
    return 'software_general';
  }

  return 'general';
}

function parseMinYears(experienceLevel: string): string {
  const m = experienceLevel.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return m[1];
  if (/senior|lead|6|7|8|9|10/i.test(experienceLevel)) return '5';
  if (/entry|fresher|0|1|2/i.test(experienceLevel)) return '0';
  return '2';
}

function personalizeRequirement(req: string, ctx: JobPostingSuggestionContext, jobTitle: string): string {
  const years = parseMinYears(String(ctx.experienceLevel || ''));
  return req
    .replace(/(\d+)\+ years/, `${years}+ years`)
    .replace(/this position/gi, jobTitle || 'this role');
}

function buildJobDescriptions(ctx: JobPostingSuggestionContext, category: JobRoleCategory): string[] {
  const template = ROLE_TEMPLATES[category];
  const jobTitle = (ctx.jobTitle || 'this role').trim() || 'this role';
  const company = (ctx.companyName || 'Our company').trim() || 'Our company';
  const industry = (ctx.industry || 'the industry').trim();
  const jobType = (ctx.jobType || 'Full-time').trim();
  const intro = ctx.companyDescription?.trim();

  return template.responsibilities.map((resp, idx) => {
    const opener =
      idx === 0
        ? intro
          ? `${intro} We are hiring a ${jobTitle} (${jobType}) for our ${industry} team.`
          : `${company} is hiring a ${jobTitle} (${jobType}) to strengthen our ${industry} operations.`
        : `As a ${jobTitle}, you will`;
    const body = resp.charAt(0).toLowerCase() + resp.slice(1);
    return `${opener} ${body}`;
  });
}

function dedupeList(items: string[], max = SUGGESTION_LIMIT): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function titleSuggestionsFromInput(userInput: string, jobTitle: string, category: JobRoleCategory): string[] {
  const variants = ROLE_TEMPLATES[category].titleVariants;
  const base = jobTitle.trim();
  const query = (userInput || base).toLowerCase().trim();

  if (variants.length) {
    const filtered = query
      ? variants.filter((v) => v.toLowerCase().includes(query) || query.includes(v.toLowerCase().split(' ')[0]))
      : variants;
    const pool = filtered.length ? filtered : variants;
    if (base && !pool.some((p) => p.toLowerCase() === base.toLowerCase())) {
      return dedupeList([base, ...pool]);
    }
    return dedupeList(pool);
  }

  if (!query) return dedupeList([base || 'Professional', 'Senior Professional', 'Team Lead']);
  const cap = query.charAt(0).toUpperCase() + query.slice(1);
  return dedupeList([
    base || cap,
    `Senior ${cap}`,
    `${cap} Specialist`,
    `${cap} Executive`,
    `Lead ${cap}`,
    `${cap} — ${cap} Team`,
  ]);
}

export function getJobPostingSuggestions(
  field: string,
  value: string,
  rawContext: Record<string, unknown>
): string[] | null {
  if (!isEmployerJobPostingContext(rawContext, field)) return null;

  const ctx: JobPostingSuggestionContext = {
    jobTitle: String(rawContext.jobTitle || ''),
    jobDescription: String(rawContext.jobDescription || ''),
    industry: String(rawContext.industry || 'General'),
    experienceLevel: String(rawContext.experienceLevel || 'Mid Level'),
    jobType: String(rawContext.jobType || 'Full-time'),
    skills: Array.isArray(rawContext.skills) ? (rawContext.skills as string[]) : [],
    companyName: String(rawContext.companyName || ''),
    companyDescription: String(rawContext.companyDescription || ''),
    userInput: String(rawContext.userInput || value || ''),
  };

  const category = classifyJobRoleCategory(value, ctx);
  const template = ROLE_TEMPLATES[category];
  const jobTitle = ctx.jobTitle?.trim() || value.trim() || 'Professional';

  switch (field) {
    case 'skills': {
      const extra = (ctx.skills || []).filter(Boolean);
      return dedupeList([...template.skills, ...extra]);
    }
    case 'requirements':
      return dedupeList(
        template.requirements.map((r) => personalizeRequirement(r, ctx, jobTitle))
      );
    case 'description':
      return dedupeList(buildJobDescriptions(ctx, category));
    case 'title':
    case 'jobTitle':
      return titleSuggestionsFromInput(value, jobTitle, category);
    case 'benefits':
      return dedupeList(getBenefitsForCategory(category));
    default:
      return null;
  }
}

export function getClassifiedJobRoleLabel(
  value: string,
  context: JobPostingSuggestionContext
): string {
  const category = classifyJobRoleCategory(value, context);
  return category.replace(/_/g, ' ');
}
