/**
 * Data-only layout contract per template (no HTML/CSS edits).
 * Drives column balance, deduplication, and empty-column collapse.
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
  sidebarSelectors: string[];
  centerSelectors?: string[];
  mainSelectors: string[];
  sidebarSections: LayoutSectionKey[];
  mainSections: LayoutSectionKey[];
  collapseEmptySidebar: boolean;
  collapseEmptyCenter?: boolean;
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

export function getSectionListClass(key: LayoutSectionKey): string {
  return SECTION_LIST_CLASS[key];
}

export const TEMPLATE_LAYOUT_REGISTRY: Record<string, TemplateLayoutProfile> = {
  'teal-modern': {
    id: 'teal-modern',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar', 'aside.sidebar'],
    mainSelectors: ['.main-content', 'main.main-content'],
    sidebarSections: ['languages', 'skills'],
    mainSections: ['profileImage', 'contact', 'summary', 'experience', 'projects', 'education', 'certifications', 'achievements', 'hobbies'],
    collapseEmptySidebar: true,
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
  },
  'editorial-elegant': {
    id: 'editorial-elegant',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['profileImage', 'contact'],
    mainSections: ['summary', 'skills', 'experience', 'education', 'certifications', 'projects', 'achievements', 'languages', 'hobbies'],
    collapseEmptySidebar: true,
  },
  'editorial-mauve': {
    id: 'editorial-mauve',
    family: 'three-column',
    columnCount: 3,
    sidebarSelectors: ['.col-left'],
    centerSelectors: ['.col-center'],
    mainSelectors: ['.col-right'],
    sidebarSections: ['contact', 'summary', 'hobbies', 'skills', 'education', 'languages', 'certifications'],
    mainSections: ['experience', 'projects', 'achievements'],
    collapseEmptySidebar: false,
    collapseEmptyCenter: true,
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
  },
  'elegant-ivory': {
    id: 'elegant-ivory',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-panel', 'main.main-panel'],
    sidebarSections: ['summary', 'skills', 'languages'],
    mainSections: ['experience', 'education', 'certifications', 'projects', 'achievements'],
    collapseEmptySidebar: true,
  },
  'luxe-executive': {
    id: 'luxe-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar'],
    mainSelectors: ['.main-content', '.main-panel'],
    sidebarSections: ['skills', 'education', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'projects'],
    collapseEmptySidebar: true,
  },
  'executive-graphite': {
    id: 'executive-graphite',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.col-left', '.sidebar'],
    mainSelectors: ['.col-right', '.main-content'],
    sidebarSections: ['summary', 'skills', 'education', 'certifications', 'languages'],
    mainSections: ['experience', 'projects', 'achievements'],
    collapseEmptySidebar: true,
  },
  'royal-copper-executive': {
    id: 'royal-copper-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.col-left', '.sidebar'],
    mainSelectors: ['.col-right', '.main-content'],
    sidebarSections: ['skills', 'education', 'certifications', 'languages', 'achievements'],
    mainSections: ['summary', 'experience', 'projects'],
    collapseEmptySidebar: true,
  },
  'royal-edge': {
    id: 'royal-edge',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.re-sidebar'],
    mainSelectors: ['.re-main', '.main-content'],
    sidebarSections: ['profileImage', 'education', 'certifications', 'languages', 'achievements'],
    mainSections: ['summary', 'experience', 'skills', 'projects'],
    collapseEmptySidebar: true,
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
  },
  'ivory-boardroom-executive': {
    id: 'ivory-boardroom-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.col-side', 'aside.col-side'],
    mainSelectors: ['.col-main', 'main.col-main'],
    sidebarSections: ['skills', 'education', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'projects', 'achievements'],
    collapseEmptySidebar: true,
  },
  'executive-slate-luxe': {
    id: 'executive-slate-luxe',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.esl-side', 'aside.esl-side'],
    mainSelectors: ['.esl-main', 'main.esl-main'],
    sidebarSections: ['skills', 'projects', 'achievements', 'languages'],
    mainSections: ['summary', 'experience', 'education', 'certifications'],
    collapseEmptySidebar: true,
  },
  'emerald-executive-luxe': {
    id: 'emerald-executive-luxe',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.eel-col-side', 'aside.eel-col-side'],
    mainSelectors: ['.eel-col-main', 'main.eel-col-main'],
    sidebarSections: ['skills', 'education', 'certifications', 'achievements', 'languages'],
    mainSections: ['summary', 'experience', 'projects'],
    collapseEmptySidebar: true,
  },
  'velvet-ribbon-executive': {
    id: 'velvet-ribbon-executive',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.vre-sidebar', 'aside.vre-sidebar'],
    mainSelectors: ['.vre-main', '.main-content'],
    sidebarSections: ['education', 'certifications', 'projects', 'achievements', 'languages'],
    mainSections: ['summary', 'experience', 'skills'],
    collapseEmptySidebar: true,
  },
  'organic-luxe-editorial': {
    id: 'organic-luxe-editorial',
    family: 'sidebar-main',
    columnCount: 2,
    sidebarSelectors: ['.sidebar', 'aside.sidebar'],
    mainSelectors: ['.main-content'],
    sidebarSections: ['experience', 'certifications'],
    mainSections: ['summary', 'skills', 'projects', 'education', 'achievements', 'languages'],
    collapseEmptySidebar: true,
  },
};

const DEFAULT_PROFILE: TemplateLayoutProfile = {
  id: 'default',
  family: 'sidebar-main',
  columnCount: 2,
  sidebarSelectors: ['.sidebar', 'aside.sidebar', '.col-side', '.esl-side', '.eel-col-side', '.re-sidebar'],
  mainSelectors: ['.main-content', 'main.main-content', '.col-main', '.main-panel', '.esl-main', '.eel-col-main', '.re-main'],
  sidebarSections: ['skills', 'languages', 'education', 'certifications'],
  mainSections: ['summary', 'experience', 'projects', 'achievements'],
  collapseEmptySidebar: true,
};

export function getTemplateLayoutProfile(templateId?: string): TemplateLayoutProfile {
  if (templateId && TEMPLATE_LAYOUT_REGISTRY[templateId]) {
    return TEMPLATE_LAYOUT_REGISTRY[templateId];
  }
  return DEFAULT_PROFILE;
}

export function detectTemplateIdFromHtml(html: string): string | undefined {
  for (const id of Object.keys(TEMPLATE_LAYOUT_REGISTRY)) {
    if (html.includes(`/${id}/`) || html.includes(`data-template="${id}"`)) {
      return id;
    }
  }
  if (html.includes('col-left') && html.includes('col-center')) return 'editorial-mauve';
  if (html.includes('col-side') && html.includes('col-main')) return 'ivory-boardroom-executive';
  if (html.includes('esl-side')) return 'executive-slate-luxe';
  if (html.includes('eel-col-side')) return 'emerald-executive-luxe';
  if (html.includes('re-sidebar')) return 'royal-edge';
  if (html.includes('executive-header')) return 'executive-corporate';
  return undefined;
}
