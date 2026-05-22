/**
 * Deterministic, project-aware suggestion helpers (used before generic fallbacks).
 */

export interface ProjectAwareInput {
  userInput: string;
  jobTitle?: string;
  skills?: string[];
  projectName?: string;
  technologies?: string[];
  isDescription?: boolean;
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
    keywords: ['job', 'portal', 'recruit', 'hiring', 'ats', 'resume', 'career', 'naukri'],
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
    return list.slice(0, 6);
  }

  if (jobDev) {
    return [
      'Full-Stack Web Application',
      'REST API & Dashboard Project',
      'Cloud-Deployed SaaS MVP',
      'Real-Time Collaboration Tool',
    ].slice(0, 6);
  }

  return [
    'Portfolio Website',
    'Business Management System',
    'Data Dashboard Application',
  ].slice(0, 6);
}

export function getProjectDescriptionSuggestions(input: ProjectAwareInput): string[] {
  const name = input.projectName || input.userInput || 'the application';
  const theme = matchTheme(name);
  const tech =
    input.technologies?.length
      ? input.technologies.join(', ')
      : defaultTech(input.skills || []).join(', ');

  if (theme) {
    return theme.descriptions
      .map((d) => d.replace(/\b(React|Node\.js|PostgreSQL)\b/g, (m) => tech.split(',')[0]?.trim() || m))
      .map((d) => {
        if (!d.toLowerCase().includes(name.toLowerCase()) && name.length > 3) {
          return d.replace(/job portal|platform|application/i, name);
        }
        return d;
      })
      .slice(0, 6);
  }

  const portalLike = /portal|job|hire|resume|ats/i.test(name);
  if (portalLike) {
    return getProjectDescriptionSuggestions({
      ...input,
      projectName: 'Job Portal',
      userInput: 'jobportal',
    });
  }

  return [
    `Developed ${name} using ${tech}, implementing core features, RESTful APIs, authentication, and a responsive user interface.`,
    `Built ${name} with focus on performance, maintainable architecture, and production deployment using ${tech}.`,
    `Designed and implemented ${name}, delivering end-to-end functionality with automated testing and CI/CD practices.`,
  ].slice(0, 6);
}

export function getProjectTechnologySuggestions(input: ProjectAwareInput): string[] {
  const name = input.projectName || input.userInput || '';
  const theme = matchTheme(name);
  const base = theme?.tech || defaultTech(input.skills || []);
  const existing = new Set((input.skills || []).map((s) => s.toLowerCase()));
  return base.filter((t) => !existing.has(t.toLowerCase())).slice(0, 8);
}
