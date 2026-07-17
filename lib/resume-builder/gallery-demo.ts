/**
 * Gallery demo data and profile portrait helpers.
 * Demo portrait is render-time only — never persisted as user upload data.
 */

import { resolveProfileImageForRender } from '@/lib/resume-builder/section-visibility';
export {
  DEFAULT_DEMO_PROFILE_IMAGE,
  isDemoProfileImageUrl,
} from '@/lib/resume-builder/demo-profile-image';
import { DEFAULT_DEMO_PROFILE_IMAGE } from '@/lib/resume-builder/demo-profile-image';

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
  'soft-coral-executive': {
    glow: 'radial-gradient(circle, rgba(255,90,61,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(248,198,180,0.45) 0%, transparent 70%)',
    borderTint: 'hover:border-orange-300/55',
    hoverOverlay: 'from-orange-50/35',
  },
  'navy-gold-executive': {
    glow: 'radial-gradient(circle, rgba(196,163,90,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(27,42,74,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-300/55',
    hoverOverlay: 'from-amber-50/30',
  },
  'charcoal-orange-executive': {
    glow: 'radial-gradient(circle, rgba(245,158,11,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(31,35,43,0.35) 0%, transparent 70%)',
    borderTint: 'hover:border-amber-400/55',
    hoverOverlay: 'from-amber-50/30',
  },
  'emerald-glass-executive': {
    glow: 'radial-gradient(circle, rgba(75,199,181,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(14,91,87,0.35) 0%, transparent 70%)',
    borderTint: 'hover:border-teal-300/55',
    hoverOverlay: 'from-teal-50/30',
  },
  'onyx-modern-executive': {
    glow: 'radial-gradient(circle, rgba(182,106,61,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(35,39,47,0.38) 0%, transparent 70%)',
    borderTint: 'hover:border-orange-300/55',
    hoverOverlay: 'from-stone-50/35',
  },
  'minimal-typewriter-executive': {
    glow: 'radial-gradient(circle, rgba(139,126,200,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(17,17,17,0.12) 0%, transparent 70%)',
    borderTint: 'hover:border-violet-300/55',
    hoverOverlay: 'from-violet-50/30',
  },
  'slate-elite-professional': {
    glow: 'radial-gradient(circle, rgba(176,141,87,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(30,41,59,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-slate-300/55',
    hoverOverlay: 'from-slate-50/30',
  },
  'neo-lime-executive': {
    glow: 'radial-gradient(circle, rgba(132,204,22,0.38) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(15,118,110,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-lime-300/55',
    hoverOverlay: 'from-lime-50/30',
  },
  'royal-plum-executive': {
    glow: 'radial-gradient(circle, rgba(201,217,168,0.42) 0%, transparent 70%)',
    glowSecondary: 'radial-gradient(circle, rgba(61,38,69,0.28) 0%, transparent 70%)',
    borderTint: 'hover:border-violet-300/55',
    hoverOverlay: 'from-stone-50/35',
  },
};

const GALLERY_PERSONA_BY_TEMPLATE: Record<
  string,
  { firstName: string; lastName: string; jobTitle: string }
> = {
  'soft-coral-executive': { firstName: 'Alexander', lastName: 'Reed', jobTitle: 'Senior Operations Director & Strategist' },
  'navy-gold-executive': { firstName: 'Isabella', lastName: 'Morgan', jobTitle: 'Brand Strategist & Creative Director' },
  'charcoal-orange-executive': { firstName: 'Clara', lastName: 'Smith', jobTitle: 'Senior Product Designer' },
  'emerald-glass-executive': { firstName: 'Maya', lastName: 'Chen', jobTitle: 'Chief Strategy Officer' },
  'onyx-modern-executive': { firstName: 'Jonathan', lastName: 'Doe', jobTitle: 'Product Lead & Innovator' },
  'minimal-typewriter-executive': { firstName: 'Chris', lastName: 'Johnson', jobTitle: 'Executive Director & Operations Lead' },
  'slate-elite-professional': { firstName: 'Jeremy', lastName: 'Torres', jobTitle: 'Graphic Designer' },
  'neo-lime-executive': { firstName: 'Sarah', lastName: 'Chen', jobTitle: 'UX Research Lead' },
  'royal-plum-executive': { firstName: 'Alexandra', lastName: 'Kemp', jobTitle: 'Product Design Strategist | Design Collective' },
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
    GALLERY_PERSONA_BY_TEMPLATE['soft-coral-executive'];
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
