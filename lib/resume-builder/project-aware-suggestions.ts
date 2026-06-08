/**
 * Deterministic, project-aware suggestion helpers (used before generic fallbacks).
 */

export interface ProjectAwareInput {
  userInput: string;
  jobTitle?: string;
  skills?: string[];
  projectName?: string;
  projectDescription?: string;
  technologies?: string[];
  isDescription?: boolean;
  regenerateIndex?: number;
}

const KNOWN_TECHNOLOGIES = [
  'React', 'React.js', 'Next.js', 'Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'MySQL',
  'JWT', 'REST API', 'GraphQL', 'TypeScript', 'JavaScript', 'Python', 'Django', 'FastAPI',
  'Redis', 'AWS', 'Docker', 'Kubernetes', 'Prisma', 'Tailwind CSS', 'Tailwind', 'Vue.js',
  'Angular', 'Java', 'Spring Boot', 'Firebase', 'Supabase', 'OpenAI API', 'TensorFlow',
  'Git', 'CI/CD', 'HTML', 'CSS', 'SASS', 'Webpack', 'Vite', 'Flask', 'Ruby on Rails',
  'Go', 'Golang', 'C#', '.NET', 'PHP', 'Laravel', 'Elasticsearch', 'Kafka', 'RabbitMQ',
];

function extractTechnologiesFromText(text: string): string[] {
  if (!text.trim()) return [];
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const tech of KNOWN_TECHNOLOGIES) {
    if (lower.includes(tech.toLowerCase())) {
      found.push(tech);
    }
  }
  const builtWith = text.match(
    /(?:built\s+with|using|stack|technologies?|tech)\s*:?\s*([^.;\n]+)/i
  );
  if (builtWith?.[1]) {
    for (const part of builtWith[1].split(/[,;|/&]+/)) {
      const token = part.trim();
      if (token.length >= 2 && token.length <= 40) found.push(token);
    }
  }
  const seen = new Set<string>();
  return found.filter((t) => {
    const key = t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeToken(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

type ProjectTheme = {
  id: string;
  keywords: string[];
  titles: string[];
  descriptions: string[];
  tech: string[];
};

const THEMES: ProjectTheme[] = [
  {
    id: 'jobportal',
    keywords: ['jobportal', 'job portal', 'job', 'portal', 'recruit', 'hiring', 'ats', 'resume', 'career', 'naukri'],
    titles: [
      'AI-Powered Job Portal',
      'Recruitment & ATS Platform',
      'Candidate Matching System',
      'Resume Builder & Job Board',
    ],
    descriptions: [
      'Developed a full-stack job portal with resume upload, ATS-friendly resume builder, recruiter dashboards, and AI-assisted candidate matching.',
      'Built an end-to-end hiring platform featuring job search, application tracking, resume parsing, and role-based authentication for job seekers and employers.',
      'Engineered a scalable recruitment system with resume optimization, semantic job recommendations, and secure multi-tenant employer workflows.',
    ],
    tech: ['React', 'Node.js', 'PostgreSQL', 'Next.js', 'Prisma', 'OpenAI API'],
  },
  {
    id: 'ecommerce',
    keywords: ['ecommerce', 'e commerce', 'shop', 'cart', 'store', 'marketplace', 'payment'],
    titles: [
      'E-Commerce Platform',
      'Online Store & Checkout System',
      'Marketplace Application',
    ],
    descriptions: [
      'Built a responsive e-commerce platform with product catalog, cart, checkout, order management, and payment gateway integration.',
      'Developed a marketplace application supporting inventory management, customer accounts, and real-time order status updates.',
    ],
    tech: ['React', 'Node.js', 'Stripe', 'MongoDB', 'Redis'],
  },
  {
    id: 'portfolio',
    keywords: ['portfolio', 'personal site', 'showcase'],
    titles: ['Personal Portfolio Website', 'Developer Portfolio', 'Professional Showcase Site'],
    descriptions: [
      'Designed and developed a responsive portfolio website highlighting projects, skills, and contact integration with optimized performance and SEO.',
    ],
    tech: ['Next.js', 'React', 'Tailwind CSS'],
  },
  {
    id: 'lms',
    keywords: ['learning', 'lms', 'course', 'education platform', 'elearning'],
    titles: ['Learning Management System', 'E-Learning Platform', 'Online Course Portal'],
    descriptions: [
      'Created an e-learning platform with course enrollment, progress tracking, assessments, and instructor dashboards.',
    ],
    tech: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
  },
];

function matchTheme(input: string): ProjectTheme | null {
  const n = normalizeToken(input);
  if (!n) return null;
  for (const theme of THEMES) {
    if (theme.keywords.some((k) => n.includes(k) || n.replace(/\s/g, '').includes(k.replace(/\s/g, '')))) {
      return theme;
    }
  }
  return null;
}

function rotateList<T>(list: T[], index: number, max: number): T[] {
  if (!list.length) return [];
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(list[(index + i) % list.length]);
  return out;
}

function defaultTech(skills: string[]): string {
  const pool = skills.length ? skills : ['React', 'Node.js', 'PostgreSQL', 'REST APIs'];
  return pool.slice(0, 6);
}

export function getProjectNameSuggestions(input: ProjectAwareInput): string[] {
  const raw = input.userInput || input.projectName || '';
  const theme = matchTheme(raw);
  const jobDev =
    normalizeToken(input.jobTitle || '').includes('developer') ||
    normalizeToken(input.jobTitle || '').includes('engineer');

  if (theme) {
    const list = [...theme.titles];
    if (raw.trim().length > 2) {
      const titled = raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
      if (!list.some((l) => l.toLowerCase() === titled.toLowerCase())) {
        list.unshift(titled);
      }
    }
    return rotateList(list, input.regenerateIndex || 0, 6);
  }

  if (jobDev) {
    return rotateList([
      'Full-Stack Web Application',
      'REST API & Dashboard Project',
      'Cloud-Deployed SaaS MVP',
      'Real-Time Collaboration Tool',
    ], input.regenerateIndex || 0, 6);
  }

  return rotateList(
    ['Portfolio Website', 'Business Management System', 'Data Dashboard Application'],
    input.regenerateIndex || 0,
    6
  );
}

export function getProjectDescriptionSuggestions(input: ProjectAwareInput): string[] {
  const name = input.projectName || input.userInput || 'the application';
  const theme = matchTheme(name);
  const tech =
    input.technologies?.length
      ? input.technologies.join(', ')
      : defaultTech(input.skills || []).join(', ');

  if (theme) {
    const mapped = theme.descriptions
      .map((d) => d.replace(/\b(React|Node\.js|PostgreSQL)\b/g, (m) => tech.split(',')[0]?.trim() || m))
      .map((d) => {
        if (!d.toLowerCase().includes(name.toLowerCase()) && name.length > 3) {
          return d.replace(/job portal|platform|application/i, name);
        }
        return d;
      });
    return rotateList(mapped, input.regenerateIndex || 0, 6);
  }

  const portalLike = /portal|job|hire|resume|ats/i.test(name);
  if (portalLike) {
    return getProjectDescriptionSuggestions({
      ...input,
      projectName: 'Job Portal',
      userInput: 'jobportal',
    });
  }

  return rotateList(
    [
      `Developed ${name} using ${tech}, implementing core features, RESTful APIs, authentication, and a responsive user interface.`,
      `Built ${name} with focus on performance, maintainable architecture, and production deployment using ${tech}.`,
      `Designed and implemented ${name}, delivering end-to-end functionality with automated testing and CI/CD practices.`,
    ],
    input.regenerateIndex || 0,
    6
  );
}

export function getProjectTechnologySuggestions(input: ProjectAwareInput): string[] {
  const name = input.projectName || '';
  const description = input.projectDescription || '';
  const combined = `${name} ${description}`.trim();
  const theme = matchTheme(combined || input.userInput || '');
  const fromText = extractTechnologiesFromText(combined);
  const fromInput = extractTechnologiesFromText(input.userInput || '');
  const base = [...fromText, ...fromInput, ...(theme?.tech || []), ...defaultTech(input.skills || [])];
  const alreadyUsed = new Set(
    [
      ...(input.technologies || []),
      ...(input.userInput || '').split(/[,;]/).map((s) => s.trim()),
    ]
      .map((s) => s.toLowerCase())
      .filter(Boolean)
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tech of base) {
    const key = tech.toLowerCase();
    if (!key || seen.has(key) || alreadyUsed.has(key)) continue;
    seen.add(key);
    out.push(tech);
    if (out.length >= 8) break;
  }
  return out;
}
