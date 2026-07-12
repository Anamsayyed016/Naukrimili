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
  'slate-executive-pro': {
    glow: 'radial-gradient(circle, rgba(95,105,115,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(30,35,40,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-slate-500/65',
    hoverOverlay: 'from-slate-300/25',
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
  'rosewood-modern': {
    glow: 'radial-gradient(circle, rgba(142,94,86,0.44) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(228,214,200,0.5) 0%, transparent 70%)',
    borderTint: 'hover:border-rose-300/55',
    hoverOverlay: 'from-rose-50/35',
  },
  'cascade-flow': {
    glow: 'radial-gradient(circle, rgba(232,160,144,0.44) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(246,235,227,0.5) 0%, transparent 70%)',
    borderTint: 'hover:border-orange-200/55',
    hoverOverlay: 'from-orange-50/35',
  },
  'horizon-canvas': {
    glow: 'radial-gradient(circle, rgba(165,162,125,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(232,179,149,0.45) 0%, transparent 70%)',
    borderTint: 'hover:border-stone-300/55',
    hoverOverlay: 'from-amber-50/35',
  },
  'lumen-studio': {
    glow: 'radial-gradient(circle, rgba(138,165,155,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(216,226,223,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-emerald-200/55',
    hoverOverlay: 'from-emerald-50/35',
  },
  'soft-sage-professional': {
    glow: 'radial-gradient(circle, rgba(111,175,157,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(205,230,223,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-teal-200/55',
    hoverOverlay: 'from-teal-50/35',
  },
  'executive-mosaic': {
    glow: 'radial-gradient(circle, rgba(201,107,124,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(232,225,216,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-rose-200/55',
    hoverOverlay: 'from-rose-50/35',
  },
  'executive-timeline': {
    glow: 'radial-gradient(circle, rgba(74,98,130,0.44) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(107,128,153,0.4) 0%, transparent 70%)',
    borderTint: 'hover:border-blue-200/55',
    hoverOverlay: 'from-slate-50/35',
  },
  'nordic-fusion': {
    glow: 'radial-gradient(circle, rgba(143,163,134,0.44) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(212,218,208,0.5) 0%, transparent 70%)',
    borderTint: 'hover:border-green-200/55',
    hoverOverlay: 'from-green-50/35',
  },
  'modern-edge': {
    glow: 'radial-gradient(circle, rgba(143,108,134,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(199,212,190,0.45) 0%, transparent 70%)',
    borderTint: 'hover:border-purple-200/55',
    hoverOverlay: 'from-purple-50/35',
  },
  'prism-edition': {
    glow: 'radial-gradient(circle, rgba(184,122,98,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(152,168,146,0.42) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-200/55',
    hoverOverlay: 'from-stone-50/35',
  },
  'monarch-edge': {
    glow: 'radial-gradient(circle, rgba(160,88,64,0.44) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(111,116,88,0.42) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-300/55',
    hoverOverlay: 'from-amber-50/35',
  },
  'sterling-executive': {
    glow: 'radial-gradient(circle, rgba(181,107,69,0.44) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(237,227,208,0.55) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-300/55',
    hoverOverlay: 'from-amber-50/40',
  },
  'executive-slate': {
    glow: 'radial-gradient(circle, rgba(47,69,88,0.48) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(91,117,148,0.38) 0%, transparent 70%)',
    borderTint: 'hover:border-blue-300/55',
    hoverOverlay: 'from-blue-50/40',
  },
  'verdant-scandi-executive': {
    glow: 'radial-gradient(circle, rgba(53,92,77,0.46) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(216,177,90,0.32) 0%, transparent 70%)',
    borderTint: 'hover:border-emerald-300/55',
    hoverOverlay: 'from-emerald-50/40',
  },
};

const GALLERY_PERSONA_BY_TEMPLATE: Record<
  string,
  { firstName: string; lastName: string; jobTitle: string }
> = {
  'luxury-corporate': { firstName: 'Michael', lastName: 'Reed', jobTitle: 'Senior Marketing Manager' },
  'elegant-ivory': { firstName: 'Elizabeth', lastName: 'Reed', jobTitle: 'Senior Marketing Director' },
  'luxe-executive': { firstName: 'David', lastName: 'Chen', jobTitle: 'Senior Executive Leadership' },
  'royal-copper-executive': { firstName: 'Isabella', lastName: 'Chen', jobTitle: 'Chief Operating Officer' },
  'royal-edge': { firstName: 'Victoria', lastName: 'Ashford', jobTitle: 'Chief Executive Officer' },
  'ivory-boardroom-executive': { firstName: 'Arthur', lastName: 'Vance', jobTitle: 'Senior Executive Strategist' },
  'executive-slate-luxe': { firstName: 'Alexander', lastName: 'Chen', jobTitle: 'Senior Operations Executive' },
  'velvet-ribbon-executive': { firstName: 'Isabelle', lastName: 'Dupont', jobTitle: 'Senior Marketing Executive & Brand Strategist' },
  'organic-luxe-editorial': { firstName: 'Nasara', lastName: 'Handson', jobTitle: 'Professional Strategist' },
  'organic-luxe-executive': { firstName: 'Isaiah J.', lastName: 'Montgomery', jobTitle: 'Executive Strategist & Creative Director' },
  'velvet-horizon-executive': { firstName: 'Oliver', lastName: 'Hayes', jobTitle: 'Chief Marketing Officer' },
  'midnight-prestige-executive': { firstName: 'Alexander', lastName: 'Vance', jobTitle: 'Chief Executive Officer | Global Operations' },
  'frosted-glass-executive': { firstName: 'Julian', lastName: 'Pierce', jobTitle: 'Senior Product Strategist | Digital Innovation Leader' },
  'slate-executive-pro': { firstName: 'Ethan', lastName: 'Clark', jobTitle: 'Senior Product Manager' },
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
  'rosewood-modern': { firstName: 'Elias', lastName: 'Vance', jobTitle: 'Global Brand Strategist & Marketing Director' },
  'cascade-flow': { firstName: 'Eliza', lastName: 'Chen', jobTitle: 'Senior Product Designer | AI Innovation' },
  'horizon-canvas': { firstName: 'Horizon', lastName: 'Canvas', jobTitle: 'Creative Director | Editorial Design & Brand Strategy' },
  'lumen-studio': { firstName: 'Lumen', lastName: 'Studio', jobTitle: 'Creative Director | Scandinavian Editorial Design & Brand Strategy' },
  'soft-sage-professional': { firstName: 'Eliza', lastName: 'Chen', jobTitle: 'Global Operations Strategist | Enterprise Leadership & Digital Transformation' },
  'executive-mosaic': { firstName: 'Alexander', lastName: 'Reed', jobTitle: 'Global Product Strategist | Enterprise Leadership & Digital Transformation' },
  'executive-timeline': { firstName: 'Katherine', lastName: 'Reed', jobTitle: 'Chief Strategy Officer | Fashion Retail Innovator' },
  'nordic-fusion': { firstName: 'Alexander', lastName: 'Chen', jobTitle: 'Senior Product Designer | Scandinavian Design & UX Leadership' },
  'modern-edge': { firstName: 'Liam', lastName: 'Nguyen', jobTitle: 'Senior Product Designer | Product Strategy & UX Leadership' },
  'prism-edition': { firstName: 'Canela', lastName: 'Name', jobTitle: 'Senior Product Designer | Scandinavian Editorial Design' },
  'monarch-edge': { firstName: 'Arthur', lastName: 'Sterling', jobTitle: 'Chief Product Strategist | Design Leader' },
  'sterling-executive': { firstName: 'Arthur', lastName: 'Sterling', jobTitle: 'Chief Product Strategist | Design Leader' },
  'executive-slate': { firstName: 'Alexander', lastName: 'Chen', jobTitle: 'Principal Product Designer | Creative Director' },
  'verdant-scandi-executive': { firstName: 'Elena', lastName: 'Nordstrom', jobTitle: 'Executive Director | Scandinavian Strategy & Innovation' },
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

/** Compact showcase sections for gallery cards (never persisted to user data). */
const GALLERY_DEMO_RESUME_SECTIONS = {
  summary:
    'Executive leader with 15+ years driving product strategy, digital transformation, and operational excellence. Proven record building high-performing teams and delivering sustained revenue growth across global markets.',
  skills: [
    'Leadership',
    'Strategy',
    'Product Development',
    'Communication',
    'Project Management',
    'Innovation',
    'Operations',
    'Artificial Intelligence',
    'Stakeholder Management',
    'Agile Methodologies',
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
        'Directed enterprise product portfolio generating $120M+ in annual recurring revenue.',
        'Led cross-functional organization of 45+ through three major platform releases.',
        'Reduced time-to-market by 38% through agile portfolio governance.',
      ],
    },
    {
      title: 'VP of Product Management',
      company: 'Meridian Digital Solutions',
      location: 'New York, NY',
      startDate: 'Mar 2014',
      endDate: 'Dec 2017',
      achievements: [
        'Scaled product organization from 12 to 34 FTEs while improving NPS by 22 points.',
        'Launched AI-powered analytics suite adopted by 180+ enterprise clients.',
        'Established product ops function standardizing OKRs and executive reporting.',
      ],
    },
  ],
  projects: [
    {
      name: 'Enterprise AI Platform Launch',
      description:
        'Led cross-functional initiative deploying machine-learning infrastructure for predictive insights and automated workflows.',
      technologies: 'Python, TensorFlow, AWS, React',
    },
    {
      name: 'Global SaaS Modernization',
      description:
        'Orchestrated cloud migration improving reliability to 99.97% uptime and cutting infrastructure costs by 24%.',
      technologies: 'Node.js, PostgreSQL, Docker, Azure',
    },
  ],
  education: [
    {
      degree: 'Master of Business Administration',
      school: 'Stanford Graduate School of Business',
      year: '2010',
      graduationDate: '2010',
    },
    {
      degree: 'Bachelor of Science in Computer Science',
      school: 'University of Michigan',
      year: '2004',
      graduationDate: '2004',
    },
  ],
  certifications: [
    { name: 'Certified Scrum Product Owner (CSPO)', issuer: 'Scrum Alliance', date: '2019' },
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2021' },
  ],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Spanish', proficiency: 'Fluent' },
  ],
  achievements: [
    'Named Top 40 Under 40 in Product Leadership, 2023',
    'Led team awarded Corporate Innovation Excellence Award, 2022',
  ],
  hobbies: ['Executive Mentorship', 'Marathon Running', 'Strategic Reading'],
};

/** Rich sample resume used only when gallery has no user form data */
export function buildGallerySampleFormData(templateId?: string): Record<string, unknown> {
  const persona =
    (templateId && GALLERY_PERSONA_BY_TEMPLATE[templateId]) ||
    GALLERY_PERSONA_BY_TEMPLATE['slate-executive-pro'];
  const profileImage = DEFAULT_DEMO_PROFILE_IMAGE;
  const sections = GALLERY_DEMO_RESUME_SECTIONS;

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
  if (!formData || typeof formData !== 'object') return true;

  const hasContact = Boolean(
    readImportTextField(formData.firstName) ||
      readImportTextField(formData.lastName) ||
      readImportTextField(formData.fullName) ||
      readImportTextField(formData.name) ||
      readImportTextField(formData.email) ||
      readImportTextField(formData.phone)
  );
  const hasSummary = readImportTextField(formData.summary || formData.bio).length > 0;
  const hasSections = [
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'achievements',
  ].some((key) => Array.isArray(formData[key]) && (formData[key] as unknown[]).length > 0);

  if (formData._imported === true && (hasContact || hasSummary || hasSections)) {
    return false;
  }

  return !hasContact && !hasSummary && !hasSections;
}

function readImportTextField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
