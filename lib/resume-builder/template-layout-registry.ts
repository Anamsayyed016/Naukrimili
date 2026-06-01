/**
 * Data-only layout contract per template (no HTML/CSS edits).
 * Drives column balance, empty-sidebar collapse, and safe section relocation.
 */

export type LayoutSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'languages'
  | 'hobbies'
  | 'contact'
  | 'profileImage';

export type LayoutFamily =
  | 'sidebar-main'
  | 'three-column'
  | 'header-sidebar-main';

export interface TemplateLayoutProfile {
  id: string;
  family: LayoutFamily;
  columnCount: 2 | 3;
  /** CSS selectors for column roots */
  sidebarSelectors: string[];
  mainSelectors: string[];
  /** Sections the template HTML places in sidebar (fixed slots) */
  sidebarSections: LayoutSectionKey[];
  mainSections: LayoutSectionKey[];
  /** When sidebar has no rendered content, hide column and expand main */
  collapseEmptySidebar: boolean;
  /**
   * When sidebar is empty but main holds these sections, move them into sidebar
   * using existing list markup (no duplicate sections).
   */
  relocateToSidebarWhenEmpty: LayoutSectionKey[];
}

const SECTION_LIST_CLASS: Record<LayoutSectionKey, string> = {
  summary: 'summary-content',
  experience: 'experience-list',
  education: 'education-list',
  skills: 'skills-list',
  projects: 'projects-list',
  certifications: 'certifications-list',
  achievements: 'achievements-list',
  languages: 'languages-list',
  hobbies: 'hobbies-list',
  contact: 'contact-list',
  profileImage: 'profile-image',
};

const SECTION_HEADING: Record<LayoutSectionKey, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  achievements: 'Achievements',
  languages: 'Languages',
  hobbies: 'Interests',
  contact: 'Contact',
  profileImage: 'Profile',
};

export function getSectionListClass(key: LayoutSectionKey): string {
  return SECTION_LIST_CLASS[key];
}

export function getSectionHeading(key: LayoutSectionKey): string {
  return SECTION_HEADING[key];
}

/** Registry from template HTML scan (18 templates). */
export const TEMPLATE_LAYOUT_REGISTRY: Record<string, TemplateLayoutProfile> = {
  'teal-modern': {
    id: 'teal-modern',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar', 'aside.sidebar'],
    mainSelectors: ['.main-content', 'main.main-content'],
    sidebarSections: ['languages', 'skills'],
    mainSections: [
      'profileImage',
      'contact',
      'summary',
      'experience',
      'projects',
      'education',
      'certifications',
      'achievements',
      'hobbies',
    ],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: ['education', 'certifications', 'languages'],
  },
  'charcoal-premium': {
    id: 'charcoal-premium',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['profileImage', 'education', 'certifications', 'skills', 'languages'],
    mainSections: ['contact', 'summary', 'experience', 'projects', 'achievements', 'hobbies'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'editorial-elegant': {
    id: 'editorial-elegant',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['profileImage', 'contact'],
    mainSections: [
      'summary',
      'skills',
      'experience',
      'education',
      'certifications',
      'projects',
      'achievements',
      'languages',
      'hobbies',
    ],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: ['skills', 'languages', 'education', 'certifications'],
  },
  'editorial-mauve': {
    id: 'editorial-mauve',
    family: 'three-column',
    columnCount: 3,
    sidebarSelectors: ['.col-left', '.col-center'],
    mainSelectors: ['.col-right'],
    sidebarSections: ['contact', 'summary', 'hobbies', 'skills', 'education', 'languages', 'certifications'],
    mainSections: ['experience', 'projects', 'achievements'],
    collapseEmptySidebar: false,
    relocateToSidebarWhenEmpty: [],
  },
  'executive-corporate': {
    id: 'executive-corporate',
    family: 'header-sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar', 'aside.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['education', 'skills', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'projects', 'achievements'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'executive-modern': {
    id: 'executive-modern',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['profileImage', 'skills', 'certifications', 'languages', 'education'],
    mainSections: ['summary', 'experience', 'projects', 'achievements'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'luxury-corporate': {
    id: 'luxury-corporate',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar', 'aside.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['education', 'skills', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'projects', 'achievements', 'hobbies'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'elegant-ivory': {
    id: 'elegant-ivory',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['summary', 'skills', 'languages'],
    mainSections: ['experience', 'education', 'certifications', 'projects', 'achievements'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: ['education', 'certifications'],
  },
  'luxe-executive': {
    id: 'luxe-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['skills', 'education', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'projects'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'executive-graphite': {
    id: 'executive-graphite',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['summary', 'skills', 'education', 'certifications', 'languages'],
    mainSections: ['experience', 'projects', 'achievements'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'royal-copper-executive': {
    id: 'royal-copper-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['skills', 'education', 'certifications', 'languages', 'achievements'],
    mainSections: ['summary', 'experience', 'projects'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'royal-edge': {
    id: 'royal-edge',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.re-sidebar', '.sidebar'],
    mainSelectors: ['.re-main', '.main-content'],
    sidebarSections: ['profileImage', 'education', 'certifications', 'languages', 'achievements'],
    mainSections: ['summary', 'experience', 'skills', 'projects'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: ['skills'],
  },
  'maroon-gold-executive': {
    id: 'maroon-gold-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['summary', 'experience', 'projects'],
    mainSections: ['skills', 'education', 'certifications', 'achievements', 'languages'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: ['skills', 'education', 'certifications', 'languages'],
  },
  'ivory-boardroom-executive': {
    id: 'ivory-boardroom-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['skills', 'education', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'projects', 'achievements'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'executive-slate-luxe': {
    id: 'executive-slate-luxe',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['skills', 'projects', 'achievements', 'languages'],
    mainSections: ['summary', 'experience', 'education', 'certifications'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: ['education', 'certifications'],
  },
  'emerald-executive-luxe': {
    id: 'emerald-executive-luxe',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['skills', 'education', 'certifications', 'achievements', 'languages'],
    mainSections: ['summary', 'experience', 'projects'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: [],
  },
  'velvet-ribbon-executive': {
    id: 'velvet-ribbon-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['education', 'certifications', 'projects', 'achievements', 'languages'],
    mainSections: ['summary', 'experience', 'skills'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: ['skills'],
  },
  'organic-luxe-editorial': {
    id: 'organic-luxe-editorial',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['experience', 'certifications'],
    mainSections: ['summary', 'skills', 'projects', 'education', 'achievements', 'languages'],
    collapseEmptySidebar: true,
    relocateToSidebarWhenEmpty: ['skills', 'education', 'languages'],
  },
};

const DEFAULT_PROFILE: TemplateLayoutProfile = {
  id: 'default',
  family: 'sidebar-main',
  columnCount: 2,
  sidebarSelectors: ['.sidebar', 'aside.sidebar', '.re-sidebar'],
  mainSelectors: ['.main-content', 'main.main-content', '.re-main'],
  sidebarSections: ['skills', 'languages', 'education', 'certifications'],
  mainSections: ['summary', 'experience', 'projects', 'achievements'],
  collapseEmptySidebar: true,
  relocateToSidebarWhenEmpty: ['education', 'certifications'],
};

export function getTemplateLayoutProfile(templateId?: string): TemplateLayoutProfile {
  if (templateId && TEMPLATE_LAYOUT_REGISTRY[templateId]) {
    return TEMPLATE_LAYOUT_REGISTRY[templateId];
  }
  return DEFAULT_PROFILE;
}

/** Infer template id from loaded HTML path comment or class hints when id omitted. */
export function detectTemplateIdFromHtml(html: string): string | undefined {
  for (const id of Object.keys(TEMPLATE_LAYOUT_REGISTRY)) {
    if (html.includes(`/${id}/`) || html.includes(`data-template="${id}"`)) {
      return id;
    }
  }
  if (html.includes('psp-skills-progress') && html.includes('teal')) return 'teal-modern';
  if (html.includes('re-sidebar')) return 'royal-edge';
  if (html.includes('col-left') && html.includes('col-center')) return 'editorial-mauve';
  if (html.includes('executive-header')) return 'executive-corporate';
  return undefined;
}
