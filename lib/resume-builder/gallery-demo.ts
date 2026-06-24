/**
 * Gallery-only demo data for template thumbnails.
 * Never written to form state, export, or live preview defaults.
 */

import { resolveProfileImageForRender } from '@/lib/resume-builder/section-visibility';

/** Shared demo portrait for gallery cards, sample resumes, and template previews only. */
export const DEFAULT_DEMO_PROFILE_IMAGE =
  'https://res.cloudinary.com/drot7xb9m/image/upload/v1782134751/naulogoimg_j5uodj.png';

/** @deprecated Use DEFAULT_DEMO_PROFILE_IMAGE */
export const GALLERY_DEMO_PROFILE_IMAGE = DEFAULT_DEMO_PROFILE_IMAGE;

export interface GalleryCardAccent {
  /** Decorative glow behind card (top-right) */
  glow: string;
  /** Secondary glow (bottom-left) */
  glowSecondary: string;
  /** Outer card border tint on hover */
  borderTint: string;
  /** Hover overlay gradient on card */
  hoverOverlay: string;
}

export const GALLERY_CARD_ACCENT_BY_TEMPLATE: Record<string, GalleryCardAccent> = {
  'teal-modern': {
    glow: 'radial-gradient(circle, rgba(15,118,110,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(94,234,212,0.22) 0%, transparent 70%)',
    borderTint: 'hover:border-teal-400/70',
    hoverOverlay: 'from-teal-800/16',
  },
  'charcoal-premium': {
    glow: 'radial-gradient(circle, rgba(196,165,116,0.4) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(154,123,79,0.22) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-400/50',
    hoverOverlay: 'from-amber-900/20',
  },
  'editorial-elegant': {
    glow: 'radial-gradient(circle, rgba(92,103,120,0.25) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(120,113,108,0.15) 0%, transparent 70%)',
    borderTint: 'hover:border-stone-400/70',
    hoverOverlay: 'from-stone-600/12',
  },
  'editorial-mauve': {
    glow: 'radial-gradient(circle, rgba(142,115,115,0.35) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(117,96,96,0.2) 0%, transparent 70%)',
    borderTint: 'hover:border-rose-300/70',
    hoverOverlay: 'from-rose-900/15',
  },
  'executive-corporate': {
    glow: 'radial-gradient(circle, rgba(74,124,175,0.35) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(30,50,68,0.2) 0%, transparent 70%)',
    borderTint: 'hover:border-blue-400/70',
    hoverOverlay: 'from-blue-800/18',
  },
  'executive-modern': {
    glow: 'radial-gradient(circle, rgba(44,62,80,0.45) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(21,32,43,0.3) 0%, transparent 70%)',
    borderTint: 'hover:border-slate-500/70',
    hoverOverlay: 'from-slate-900/25',
  },
  'luxury-corporate': {
    glow: 'radial-gradient(circle, rgba(201,162,39,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(26,39,68,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-400/60',
    hoverOverlay: 'from-amber-900/18',
  },
  'elegant-ivory': {
    glow: 'radial-gradient(circle, rgba(184,149,107,0.35) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(232,212,240,0.35) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-200/80',
    hoverOverlay: 'from-amber-100/30',
  },
  'luxe-executive': {
    glow: 'radial-gradient(circle, rgba(197,165,116,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(61,53,48,0.15) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-300/70',
    hoverOverlay: 'from-amber-100/28',
  },
  'executive-graphite': {
    glow: 'radial-gradient(circle, rgba(184,135,74,0.45) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(44,50,56,0.22) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-500/50',
    hoverOverlay: 'from-slate-800/20',
  },
  'royal-copper-executive': {
    glow: 'radial-gradient(circle, rgba(200,120,64,0.48) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(42,46,50,0.2) 0%, transparent 70%)',
    borderTint: 'hover:border-orange-400/55',
    hoverOverlay: 'from-orange-900/18',
  },
  'royal-edge': {
    glow: 'radial-gradient(circle, rgba(168,85,247,0.55) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(12,13,18,0.45) 0%, transparent 70%)',
    borderTint: 'hover:border-purple-400/60',
    hoverOverlay: 'from-purple-900/25',
  },
  'maroon-gold-executive': {
    glow: 'radial-gradient(circle, rgba(107,15,26,0.45) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(201,162,39,0.35) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-500/60',
    hoverOverlay: 'from-red-950/20',
  },
  'ivory-boardroom-executive': {
    glow: 'radial-gradient(circle, rgba(15,35,65,0.35) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(196,184,150,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-slate-400/65',
    hoverOverlay: 'from-slate-100/28',
  },
  'executive-slate-luxe': {
    glow: 'radial-gradient(circle, rgba(82,101,128,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(184,165,116,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-slate-400/70',
    hoverOverlay: 'from-slate-200/25',
  },
  'emerald-executive-luxe': {
    glow: 'radial-gradient(circle, rgba(20,107,98,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(196,168,98,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-emerald-400/65',
    hoverOverlay: 'from-emerald-900/18',
  },
  'velvet-ribbon-executive': {
    glow: 'radial-gradient(circle, rgba(122,52,86,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(212,188,142,0.32) 0%, transparent 70%)',
    borderTint: 'hover:border-rose-400/60',
    hoverOverlay: 'from-purple-900/20',
  },
  'organic-luxe-editorial': {
    glow: 'radial-gradient(circle, rgba(193,106,75,0.30) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(111,138,105,0.22) 0%, transparent 70%)',
    borderTint: 'hover:border-emerald-300/55',
    hoverOverlay: 'from-amber-700/12',
  },
  'organic-luxe-executive': {
    glow: 'radial-gradient(circle, rgba(107,70,193,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(11,16,32,0.35) 0%, transparent 70%)',
    borderTint: 'hover:border-violet-400/60',
    hoverOverlay: 'from-indigo-900/22',
  },
  'velvet-horizon-executive': {
    glow: 'radial-gradient(circle, rgba(20,107,98,0.45) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(200,120,64,0.35) 0%, transparent 70%)',
    borderTint: 'hover:border-emerald-400/60',
    hoverOverlay: 'from-emerald-900/20',
  },
  'midnight-prestige-executive': {
    glow: 'radial-gradient(circle, rgba(201,169,98,0.48) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(17,17,20,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-400/65',
    hoverOverlay: 'from-amber-950/28',
  },
  'frosted-glass-executive': {
    glow: 'radial-gradient(circle, rgba(106,167,232,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(238,244,250,0.65) 0%, transparent 70%)',
    borderTint: 'hover:border-sky-300/75',
    hoverOverlay: 'from-sky-100/35',
  },
  'platinum-executive-edge': {
    glow: 'radial-gradient(circle, rgba(201,205,211,0.55) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(216,162,143,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-slate-400/70',
    hoverOverlay: 'from-slate-200/30',
  },
  'slate-executive-pro': {
    glow: 'radial-gradient(circle, rgba(95,105,115,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(30,35,40,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-slate-500/65',
    hoverOverlay: 'from-slate-300/25',
  },
  'executive-minimal-pro': {
    glow: 'radial-gradient(circle, rgba(181,154,122,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(34,34,34,0.18) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-700/50',
    hoverOverlay: 'from-stone-200/28',
  },
  'executive-sidebar-elite': {
    glow: 'radial-gradient(circle, rgba(156,107,79,0.4) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(244,239,232,0.65) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-700/50',
    hoverOverlay: 'from-amber-100/28',
  },
  'aether-professional': {
    glow: 'radial-gradient(circle, rgba(217,178,178,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(244,241,236,0.7) 0%, transparent 70%)',
    borderTint: 'hover:border-rose-300/70',
    hoverOverlay: 'from-rose-100/30',
  },
  'nordic-creative-executive': {
    glow: 'radial-gradient(circle, rgba(200,207,178,0.45) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(220,207,196,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-stone-400/70',
    hoverOverlay: 'from-stone-200/28',
  },
  'executive-redline-elite': {
    glow: 'radial-gradient(circle, rgba(201,31,46,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(236,236,236,0.65) 0%, transparent 70%)',
    borderTint: 'hover:border-red-400/60',
    hoverOverlay: 'from-red-50/30',
  },
  'aurora-executive-glass': {
    glow: 'radial-gradient(circle, rgba(94,234,212,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(45,212,191,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-teal-300/70',
    hoverOverlay: 'from-teal-50/35',
  },
  'blush-executive-watercolor': {
    glow: 'radial-gradient(circle, rgba(214,167,155,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(243,227,222,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-rose-300/60',
    hoverOverlay: 'from-rose-50/35',
  },
  'graphite-orange-executive': {
    glow: 'radial-gradient(circle, rgba(201,111,53,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(47,59,67,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-orange-400/55',
    hoverOverlay: 'from-orange-50/30',
  },
  'executive-coral-elite': {
    glow: 'radial-gradient(circle, rgba(243,166,147,0.45) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(255,230,222,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-orange-300/60',
    hoverOverlay: 'from-orange-50/35',
  },
  'fashion-editorial-premium': {
    glow: 'radial-gradient(circle, rgba(155,126,135,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(243,217,210,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-rose-300/55',
    hoverOverlay: 'from-rose-50/35',
  },
  'executive-navy-copper': {
    glow: 'radial-gradient(circle, rgba(196,139,99,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(22,37,52,0.35) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-400/55',
    hoverOverlay: 'from-amber-50/30',
  },
  'soft-coral-executive': {
    glow: 'radial-gradient(circle, rgba(255,90,61,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(248,198,180,0.45) 0%, transparent 70%)',
    borderTint: 'hover:border-orange-300/55',
    hoverOverlay: 'from-orange-50/35',
  },
};

const GALLERY_PERSONA_BY_TEMPLATE: Record<
  string,
  { firstName: string; lastName: string; jobTitle: string }
> = {
  'teal-modern': { firstName: 'Brian', lastName: 'Baxter', jobTitle: 'Graphic & Web Designer' },
  'charcoal-premium': { firstName: 'Marcus', lastName: 'Chen', jobTitle: 'Executive Director' },
  'editorial-elegant': { firstName: 'Elena', lastName: 'Wright', jobTitle: 'Creative Director' },
  'editorial-mauve': { firstName: 'Sofia', lastName: 'Marin', jobTitle: 'Brand Strategist' },
  'executive-corporate': { firstName: 'James', lastName: 'Mitchell', jobTitle: 'VP of Operations' },
  'executive-modern': { firstName: 'Alexandra', lastName: 'Reed', jobTitle: 'Senior Product Leader' },
  'luxury-corporate': { firstName: 'Michael', lastName: 'Reed', jobTitle: 'Senior Marketing Manager' },
  'elegant-ivory': { firstName: 'Elizabeth', lastName: 'Reed', jobTitle: 'Senior Marketing Director' },
  'luxe-executive': { firstName: 'David', lastName: 'Chen', jobTitle: 'Senior Executive Leadership' },
  'executive-graphite': { firstName: 'Adrienne', lastName: 'Moreau', jobTitle: 'Chief Strategy Officer' },
  'royal-copper-executive': { firstName: 'Isabella', lastName: 'Chen', jobTitle: 'Chief Operating Officer' },
  'royal-edge': { firstName: 'Victoria', lastName: 'Ashford', jobTitle: 'Chief Executive Officer' },
  'maroon-gold-executive': { firstName: 'Arthur', lastName: 'Vance', jobTitle: 'Senior Executive Strategist' },
  'ivory-boardroom-executive': { firstName: 'Arthur', lastName: 'Vance', jobTitle: 'Senior Executive Strategist' },
  'executive-slate-luxe': { firstName: 'Alexander', lastName: 'Chen', jobTitle: 'Senior Operations Executive' },
  'emerald-executive-luxe': { firstName: 'Eliza', lastName: 'Reed', jobTitle: 'Senior Executive Leader' },
  'velvet-ribbon-executive': { firstName: 'Isabelle', lastName: 'Dupont', jobTitle: 'Senior Marketing Executive & Brand Strategist' },
  'organic-luxe-editorial': { firstName: 'Nasara', lastName: 'Handson', jobTitle: 'Professional Strategist' },
  'organic-luxe-executive': { firstName: 'Isaiah J.', lastName: 'Montgomery', jobTitle: 'Executive Strategist & Creative Director' },
  'velvet-horizon-executive': { firstName: 'Oliver', lastName: 'Hayes', jobTitle: 'Chief Marketing Officer' },
  'midnight-prestige-executive': { firstName: 'Alexander', lastName: 'Vance', jobTitle: 'Chief Executive Officer | Global Operations' },
  'frosted-glass-executive': { firstName: 'Julian', lastName: 'Pierce', jobTitle: 'Senior Product Strategist | Digital Innovation Leader' },
  'platinum-executive-edge': { firstName: 'Marcus', lastName: 'Sterling', jobTitle: 'Senior Technology Innovator & Product Strategist' },
  'slate-executive-pro': { firstName: 'Ethan', lastName: 'Clark', jobTitle: 'Senior Product Manager' },
  'executive-minimal-pro': { firstName: 'Jonathan', lastName: 'Reed', jobTitle: 'Senior Product Manager & Innovation Leader' },
  'executive-burgundy-diamond': { firstName: 'Victoria', lastName: 'Ashford', jobTitle: 'Chief Executive Officer | Global Operations' },
  'executive-sidebar-elite': { firstName: 'Eliza', lastName: 'Blythe', jobTitle: 'Chief Strategy Officer | Global Operations Leader' },
  'aether-professional': { firstName: 'Jordan', lastName: 'Hayes', jobTitle: 'Senior Product Manager' },
  'nordic-creative-executive': { firstName: 'Lena', lastName: 'Holmquist', jobTitle: 'Creative Director & Brand Strategist' },
  'executive-redline-elite': { firstName: 'Jonathan', lastName: 'Reed', jobTitle: 'Chief Operations Officer | Global Logistics Lead' },
  'aurora-executive-glass': { firstName: 'Anya', lastName: 'Petrova', jobTitle: 'Lead Software Architect | AI & Distributed Systems' },
  'blush-executive-watercolor': { firstName: 'Alexander', lastName: 'Reed', jobTitle: 'Senior Operations Director' },
  'graphite-orange-executive': { firstName: 'Eliza', lastName: 'Vance', jobTitle: 'Senior Operations Director | Strategic Growth' },
  'executive-coral-elite': { firstName: 'Arianna', lastName: 'Lynch', jobTitle: 'Senior Operations Manager | Growth Strategist' },
  'fashion-editorial-premium': { firstName: 'Alexander', lastName: 'Reed', jobTitle: 'Creative Director | Fashion & Retail Innovator' },
  'executive-navy-copper': { firstName: 'Jonathan', lastName: 'Clark', jobTitle: 'Senior Data Strategist' },
  'soft-coral-executive': { firstName: 'Alexander', lastName: 'Reed', jobTitle: 'Senior Operations Director & Strategist' },
};

export function getGalleryDemoProfileImage(_templateId?: string): string {
  return DEFAULT_DEMO_PROFILE_IMAGE;
}

export function getGalleryCardAccent(templateId: string): GalleryCardAccent {
  return (
    GALLERY_CARD_ACCENT_BY_TEMPLATE[templateId] ?? {
      glow: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
      glowSecondary: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
      borderTint: 'hover:border-gray-300',
      hoverOverlay: 'from-blue-600/10',
    }
  );
}

/**
 * Gallery preview profile resolution:
 * user upload → DEFAULT_DEMO_PROFILE_IMAGE → (empty; template initials placeholder)
 */
export function resolveGalleryProfileImage(
  formData: Record<string, unknown>,
  _getString: (keys: string[]) => string,
  templateId?: string
): string {
  const userImage = resolveProfileImageForRender(formData);
  if (userImage) {
    return userImage;
  }
  return getGalleryDemoProfileImage(templateId);
}

/** Shared rich resume sections for gallery previews (never persisted to user data) */
const GALLERY_RICH_RESUME_SECTIONS = {
  summary:
    'Visionary executive leader with 18+ years driving enterprise-scale product strategy, digital transformation, and operational excellence across global technology organizations. Proven record of building high-performing teams, launching market-defining platforms, and delivering sustained revenue growth in complex B2B and SaaS environments. Expert at translating board-level objectives into actionable roadmaps that balance innovation, profitability, and customer impact. Recognized for stakeholder leadership, P&L ownership, and building cultures of accountability and continuous improvement.',
  skills: [
    'Leadership',
    'Strategy',
    'Product Development',
    'Communication',
    'Project Management',
    'Innovation',
    'Operations',
    'Artificial Intelligence',
    'Technology',
    'Stakeholder Management',
    'P&L Management',
    'Digital Transformation',
    'Agile Methodologies',
    'Data Analytics',
    'Change Management',
  ],
  experience: [
    {
      title: 'Chief Innovation Officer',
      company: 'Global Innovations Tech',
      location: 'San Francisco, CA',
      startDate: 'Jan 2018',
      endDate: 'Present',
      current: true,
      achievements: [
        'Directed enterprise product portfolio generating $120M+ in annual recurring revenue across 28 international markets.',
        'Led cross-functional organization of 45+ engineers, designers, and analysts through three major platform releases.',
        'Reduced time-to-market by 38% by implementing agile portfolio governance and executive steering cadences.',
        'Partnered with C-suite and board directors to align innovation investments with five-year strategic growth plan.',
      ],
    },
    {
      title: 'VP of Product Management',
      company: 'Meridian Digital Solutions',
      location: 'New York, NY',
      startDate: 'Mar 2014',
      endDate: 'Dec 2017',
      achievements: [
        'Scaled product organization from 12 to 34 FTEs while improving NPS by 22 points over two years.',
        'Launched AI-powered analytics suite adopted by 180+ enterprise clients within the first 18 months.',
        'Negotiated strategic partnerships contributing $18M in incremental pipeline and expanded market reach.',
        'Established product ops function standardizing OKRs, roadmap reviews, and executive reporting.',
      ],
    },
    {
      title: 'Director of Product Strategy',
      company: 'Northbridge Capital Systems',
      location: 'Chicago, IL',
      startDate: 'Jun 2010',
      endDate: 'Feb 2014',
      achievements: [
        'Owned roadmap for compliance and risk platform serving top-tier financial institutions.',
        'Delivered regulatory-ready features ahead of deadline, preserving $12M in at-risk renewal revenue.',
        'Mentored six product managers promoted to senior leadership roles within 24 months.',
      ],
    },
    {
      title: 'Senior Product Manager',
      company: 'Atlas Enterprise Software',
      location: 'Boston, MA',
      startDate: 'Aug 2006',
      endDate: 'May 2010',
      achievements: [
        'Introduced customer discovery program influencing 70% of quarterly roadmap priorities.',
        'Increased activation rates by 29% through onboarding redesign and behavioral analytics integration.',
        'Collaborated with sales and customer success to reduce churn in mid-market segment by 15%.',
      ],
    },
    {
      title: 'Product Manager',
      company: 'Summit Logic Group',
      location: 'Austin, TX',
      startDate: 'Jul 2004',
      endDate: 'Jul 2006',
      achievements: [
        'Managed end-to-end delivery of workflow automation module used by 50,000+ daily active users.',
        'Coordinated beta program with 12 lighthouse accounts, achieving 92% satisfaction at general availability.',
      ],
    },
  ],
  projects: [
    {
      name: 'Enterprise AI Platform Launch',
      description:
        'Led cross-functional initiative to deploy machine-learning infrastructure enabling predictive insights, automated workflows, and real-time decision support for enterprise clients.',
      technologies: 'Python, TensorFlow, AWS, Kubernetes, React',
    },
    {
      name: 'Global SaaS Platform Modernization',
      description:
        'Orchestrated multi-year cloud migration and microservices refactor that improved system reliability to 99.97% uptime and cut infrastructure costs by 24%.',
      technologies: 'Node.js, PostgreSQL, Docker, Azure, GraphQL',
    },
    {
      name: 'Customer 360 Analytics Dashboard',
      description:
        'Designed executive reporting suite consolidating product, sales, and support metrics into a single board-ready view adopted by leadership worldwide.',
      technologies: 'Tableau, Snowflake, SQL, Figma',
    },
    {
      name: 'Mobile-First Field Operations App',
      description:
        'Delivered offline-capable mobile application for distributed teams, reducing field reporting time by 41% and improving data accuracy across regions.',
      technologies: 'React Native, Firebase, REST APIs',
    },
  ],
  education: [
    {
      degree: 'Master of Business Administration',
      school: 'Stanford Graduate School of Business',
      field: 'Strategy & Leadership',
      year: '2010',
      graduationDate: '2010',
    },
    {
      degree: 'Bachelor of Science in Computer Science',
      school: 'University of Michigan',
      field: 'Computer Science',
      year: '2004',
      graduationDate: '2004',
    },
  ],
  certifications: [
    { name: 'Certified Scrum Product Owner (CSPO)', issuer: 'Scrum Alliance', date: '2019' },
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2021' },
    { name: 'Project Management Professional (PMP)', issuer: 'PMI', date: '2016' },
    { name: 'Leading Digital Transformation', issuer: 'MIT Sloan Executive Education', date: '2022' },
  ],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Spanish', proficiency: 'Fluent' },
    { language: 'French', proficiency: 'Professional Working Proficiency' },
  ],
  achievements: [
    'Named Top 40 Under 40 in Product Leadership by Industry Executive Council, 2023',
    'Led team awarded Corporate Innovation Excellence Award for AI platform launch, 2022',
    'Recognized as Executive of the Year by Global Technology Forum, 2020',
    'Drove $45M in net-new ARR through strategic product expansion initiative, 2019',
    'Selected for Fortune 500 High-Potential Leadership Program, 2017',
    'Published thought leadership on digital transformation in Harvard Business Review, 2018',
    'Keynote speaker at International Product Leadership Summit, 2021',
    'Championed diversity hiring initiative increasing leadership pipeline diversity by 35%',
  ],
  hobbies: ['Executive Mentorship', 'Marathon Running', 'Classical Piano', 'Global Travel', 'Strategic Reading'],
};

/** Rich sample resume used only when gallery has no user form data */
export function buildGallerySampleFormData(templateId?: string): Record<string, unknown> {
  const persona =
    (templateId && GALLERY_PERSONA_BY_TEMPLATE[templateId]) ||
    GALLERY_PERSONA_BY_TEMPLATE['teal-modern'];
  const profileImage = DEFAULT_DEMO_PROFILE_IMAGE;
  const sections = GALLERY_RICH_RESUME_SECTIONS;

  return {
    firstName: persona.firstName,
    lastName: persona.lastName,
    name: `${persona.firstName} ${persona.lastName}`,
    email: `${persona.firstName.toLowerCase()}.${persona.lastName.toLowerCase()}@email.com`,
    phone: '+1 (415) 555-0142',
    jobTitle: persona.jobTitle,
    location: 'San Francisco, CA',
    linkedin: `linkedin.com/in/${persona.firstName.toLowerCase()}-${persona.lastName.toLowerCase()}`,
    portfolio: 'www.executiveportfolio.com',
    profileImage,
    summary: sections.summary,
    skills: sections.skills,
    experience: sections.experience,
    education: sections.education,
    projects: sections.projects,
    certifications: sections.certifications,
    languages: sections.languages,
    achievements: sections.achievements,
    hobbies: sections.hobbies,
  };
}

export function isGalleryEmptyFormData(formData: Record<string, unknown>): boolean {
  return Object.keys(formData).length === 0;
}
