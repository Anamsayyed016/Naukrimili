/**
 * Gallery-only demo data for template thumbnails.
 * Never written to form state, export, or live preview defaults.
 */

import { isValidProfileImage } from '@/lib/resume-builder/section-visibility';

const DEMO_PROFILES_BASE = '/resume-builder/demo-profiles';

/** Per-template demo portrait assets (gallery / change-template modal only) */
export const GALLERY_DEMO_PROFILE_BY_TEMPLATE: Record<string, string> = {
  'teal-modern': `${DEMO_PROFILES_BASE}/teal-modern.svg`,
  'charcoal-premium': `${DEMO_PROFILES_BASE}/charcoal-premium.svg`,
  'editorial-elegant': `${DEMO_PROFILES_BASE}/editorial-elegant.svg`,
  'editorial-mauve': `${DEMO_PROFILES_BASE}/editorial-mauve.svg`,
  'executive-corporate': `${DEMO_PROFILES_BASE}/executive-corporate.svg`,
  'executive-modern': `${DEMO_PROFILES_BASE}/executive-modern.svg`,
  'luxury-corporate': `${DEMO_PROFILES_BASE}/luxury-corporate.svg`,
  'elegant-ivory': `${DEMO_PROFILES_BASE}/elegant-ivory.svg`,
  'luxe-executive': `${DEMO_PROFILES_BASE}/luxe-executive.svg`,
  'executive-graphite': `${DEMO_PROFILES_BASE}/executive-graphite.svg`,
  'royal-copper-executive': `${DEMO_PROFILES_BASE}/royal-copper-executive.svg`,
  'royal-edge': `${DEMO_PROFILES_BASE}/royal-edge.svg`,
  'maroon-gold-executive': `${DEMO_PROFILES_BASE}/luxury-corporate.svg`,
  'ivory-boardroom-executive': `${DEMO_PROFILES_BASE}/elegant-ivory.svg`,
  'executive-slate-luxe': `${DEMO_PROFILES_BASE}/executive-corporate.svg`,
  'emerald-executive-luxe': `${DEMO_PROFILES_BASE}/teal-modern.svg`,
  'velvet-ribbon-executive': `${DEMO_PROFILES_BASE}/editorial-mauve.svg`,
  'organic-luxe-editorial': `${DEMO_PROFILES_BASE}/editorial-elegant.svg`,
  'organic-luxe-executive': `${DEMO_PROFILES_BASE}/royal-edge.svg`,
  'velvet-horizon-executive': `${DEMO_PROFILES_BASE}/royal-copper-executive.svg`,
  'midnight-prestige-executive': `${DEMO_PROFILES_BASE}/charcoal-premium.svg`,
  'frosted-glass-executive': `${DEMO_PROFILES_BASE}/teal-modern.svg`,
};

export const GALLERY_DEMO_PROFILE_IMAGE =
  GALLERY_DEMO_PROFILE_BY_TEMPLATE['teal-modern'];

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
};

export function getGalleryDemoProfileImage(templateId?: string): string {
  if (templateId && GALLERY_DEMO_PROFILE_BY_TEMPLATE[templateId]) {
    return GALLERY_DEMO_PROFILE_BY_TEMPLATE[templateId];
  }
  return GALLERY_DEMO_PROFILE_IMAGE;
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

export function resolveGalleryProfileImage(
  formData: Record<string, unknown>,
  getString: (keys: string[]) => string,
  templateId?: string
): string {
  const profileImage = getString([
    'Profile Image',
    'Photo',
    'profileImage',
    'photo',
    'profilePhoto',
  ]);
  if (isValidProfileImage(profileImage)) {
    return profileImage;
  }
  return getGalleryDemoProfileImage(templateId);
}

/** Rich sample resume used only when gallery has no user form data */
export function buildGallerySampleFormData(templateId?: string): Record<string, unknown> {
  const persona =
    (templateId && GALLERY_PERSONA_BY_TEMPLATE[templateId]) ||
    GALLERY_PERSONA_BY_TEMPLATE['teal-modern'];
  const profileImage = getGalleryDemoProfileImage(templateId);

  return {
    firstName: persona.firstName,
    lastName: persona.lastName,
    name: `${persona.firstName} ${persona.lastName.charAt(0)}. ${persona.lastName}`,
    email: `${persona.firstName.toLowerCase()}.${persona.lastName.toLowerCase()}@email.com`,
    phone: '+1 234 567 8900',
    jobTitle: persona.jobTitle,
    location: 'Chicago, IL',
    linkedin: `linkedin.com/in/${persona.firstName.toLowerCase()}${persona.lastName.toLowerCase()}`,
    portfolio: 'www.yourwebsite.com',
    profileImage,
    summary:
      'Creative and experienced professional with a proven track record of delivering high-quality results. Skilled at leading cross-functional teams and translating strategy into polished, impactful work.',
    skills: [
      'Leadership',
      'Strategy',
      'Communication',
      'Project Management',
      'Design Systems',
      'Stakeholder Management',
    ],
    experience: [
      {
        title: 'Senior ' + persona.jobTitle,
        company: 'Creative Agency',
        location: 'Chicago',
        startDate: '2020',
        endDate: 'Present',
        description:
          'Lead initiatives for major client projects, creating innovative solutions and measurable business outcomes.',
      },
      {
        title: persona.jobTitle,
        company: 'Growth Partners',
        location: 'Chicago',
        startDate: '2015',
        endDate: '2020',
        description:
          'Delivered marketing materials, brand identities, and digital assets for diverse clients.',
      },
    ],
    education: [
      {
        degree: 'Master Degree',
        school: 'Stanford University',
        field: 'Business & Design',
        year: '2011-2013',
        graduationDate: '2013',
      },
    ],
    projects: [
      {
        name: 'Platform Redesign',
        description: 'End-to-end redesign resulting in 40% increase in conversions.',
        technologies: 'React, Node.js, Figma',
      },
    ],
    certifications: [
      { name: 'Professional Certification', issuer: 'Industry Board', date: '2020' },
    ],
    languages: [
      { language: 'English', proficiency: 'Native' },
      { language: 'Spanish', proficiency: 'Fluent' },
    ],
    achievements: ['Employee of the Year 2023', 'Excellence Award 2022'],
    hobbies: ['Photography', 'Reading', 'Traveling'],
  };
}

export function isGalleryEmptyFormData(formData: Record<string, unknown>): boolean {
  return Object.keys(formData).length === 0;
}
