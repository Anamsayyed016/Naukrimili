/**
 * Dynamic layout engine — DOM-aware content-density planning for resume templates.
 *
 * Pipeline: render HTML → measure layout (DOM or structural synthesis) → LayoutPlan → CSS vars.
 *
 * Complements (does not replace):
 *   - typography.ts, ats-content-balance-css, preview-content-flow, pdf-pagination-overrides
 */

import {
  filterMeaningfulExperiences,
  filterMeaningfulProjects,
  filterMeaningfulCertifications,
  filterMeaningfulAchievements,
  normalizeSkillsForRender,
  filterMeaningfulSkills,
} from './section-visibility';
import { isPremiumTemplate } from './ats-content-balance-css';

export const A4_PAGE_HEIGHT_PX = 1123;
export const A4_PAGE_WIDTH_PX = 794;

const BASE_SECTION_GAP = 14;
const BASE_BLOCK_GAP = 10;
const BASE_BULLET_GAP = 0.35;
const BASE_HEADING_GAP = 8;
const BASE_SECTION_PADDING = 6;
const BASE_PARAGRAPH_SPACING = 4;
const BASE_COLUMN_GAP = 12;

/** Expand when coverage is below the professional fill band (85–95%). */
const FILL_EXPAND_BELOW = 0.85;
/** Soft hold only inside the elegant band — avoid both emptiness and edge-to-edge stretch. */
const FILL_HOLD_MIN = 0.85;
const FILL_HOLD_MAX = 0.95;
const FILL_COMPRESS_ABOVE = 0.95;
/** Target ~90% printable coverage (mid of 85–95%). */
const TARGET_PAGE_FILL = 0.9;

/**
 * Content priority — higher values receive more layout space when balancing.
 * Generic across all templates; never resume-specific.
 */
const SECTION_CONTENT_PRIORITY: Record<LayoutSectionKind, number> = {
  experience: 1,
  projects: 0.82,
  summary: 0.78,
  skills: 0.72,
  education: 0.58,
  certifications: 0.48,
  achievements: 0.45,
  languages: 0.42,
  interests: 0.38,
  contact: 0.2,
  other: 0.3,
};

/** Sidebar sections that should compress when the main column carries most content. */
const SIDEBAR_COMPRESSIBLE_KINDS: LayoutSectionKind[] = [
  'education',
  'languages',
  'certifications',
  'skills',
  'interests',
  'achievements',
];

export interface SectionContentMetrics {
  experienceCount: number;
  projectCount: number;
  educationCount: number;
  skillCount: number;
  certificationCount: number;
  languageCount: number;
  achievementCount: number;
  summaryWords: number;
  experienceTextUnits: number;
  lowValueNoiseScore: number;
}

export interface LayoutFillSignals {
  pageFill: number;
  mainColumnRatio: number;
  sidebarColumnRatio: number;
  shouldExpand: boolean;
  shouldCompress: boolean;
  experienceDominant: boolean;
  sidebarUnderfilled: boolean;
}

export type LayoutSectionKind =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'interests'
  | 'contact'
  | 'other';

export interface SectionHeightMetric {
  kind: LayoutSectionKind;
  height: number;
  elementCount: number;
}

export interface RenderedLayoutMetrics {
  pageHeight: number;
  containerHeight: number;
  usedPageHeight: number;
  remainingWhitespace: number;
  pageFillRatio: number;
  sidebarHeight: number;
  mainHeight: number;
  sidebarContentHeight: number;
  mainContentHeight: number;
  sidebarFillRatio: number;
  mainFillRatio: number;
  columnImbalance: number;
  sections: SectionHeightMetric[];
  sidebarSections: SectionHeightMetric[];
  mainSections: SectionHeightMetric[];
  /** Sidebar has little content vs a fuller main column */
  sidebarSparse: boolean;
  visibleSectionKinds: LayoutSectionKind[];
}

export interface DynamicLayoutPlan {
  sectionGap: number;
  blockGap: number;
  bulletGap: number;
  headingGap: number;
  fontScale: number;
  lineHeightMul: number;
  skillColumns: number;
  mainFlexGrow: number;
  sidebarFlexGrow: number;
  density: number;
  sectionPadding: number;
  paragraphSpacing: number;
  columnGap: number;
  summarySpacing: number;
  experienceSpacing: number;
  pageFillRatio: number;
  /** Extra margin distributed per section kind (px) */
  sectionExtras: Partial<Record<LayoutSectionKind, number>>;
  /** Column flex-basis (% of row) — layout only, never changes colors */
  mainColumnBasisPct: number;
  sidebarColumnBasisPct: number;
  sidebarMaxWidthPct: number;
  /** Vertical gap between sidebar sections when sidebar is sparse */
  sidebarInternalGap: number;
  educationSpacing: number;
  certificationSpacing: number;
  languageSpacing: number;
  projectSpacing: number;
  experienceCount: number;
  visibleSectionCount: number;
  summaryIsShort: boolean;
  experienceCardPadding: number;
  experienceListGap: number;
  experienceHeaderGap: number;
  experienceDescPadding: number;
  bulletIndent: number;
  sidebarCardPadding: number;
}

export interface ComputeDynamicLayoutOptions {
  htmlTemplate?: string;
  templateId?: string;
  mode?: 'preview' | 'pdf';
  metrics?: RenderedLayoutMetrics;
  renderedHtml?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function detectHasSidebar(htmlTemplate: string): boolean {
  return /\bsidebar\b|tm-sidebar|<aside[\s>]/i.test(htmlTemplate);
}

function classifySectionKindFromHtml(block: string): LayoutSectionKind {
  if (/\bexperience-item\b/i.test(block)) return 'experience';
  if (/\bsummary-text\b|professional-summary\b|objective-text\b/i.test(block)) return 'summary';
  if (/\beducation-item\b/i.test(block)) return 'education';
  if (/\bskill-tag\b|psp-skill-item\b/i.test(block)) return 'skills';
  if (/\bproject-item\b/i.test(block)) return 'projects';
  if (/\bcertification-item\b/i.test(block)) return 'certifications';
  if (/\blanguage-item\b|psp-language-item\b/i.test(block)) return 'languages';
  if (/\bachievement-item\b/i.test(block)) return 'achievements';
  if (/\bhobby-item\b|interests?\b/i.test(block)) return 'interests';
  if (/\bcontact-list\b|ese-contact-list\b/i.test(block)) return 'contact';
  return 'other';
}

function classifySectionKindFromElement(el: Element): LayoutSectionKind {
  const html = el.outerHTML.slice(0, 4000);
  return classifySectionKindFromHtml(html);
}

/** Structural height weights calibrated from forensic DOM measurements (not character count). */
const STRUCTURAL_HEIGHTS = {
  photoBlock: 220,
  sectionHeading: 36,
  contactRow: 22,
  experienceItemBase: 72,
  experienceBullet: 22,
  educationItem: 56,
  projectItem: 64,
  skillTag: 26,
  certificationItem: 48,
  languageItem: 24,
  achievementItem: 40,
  hobbyItem: 28,
  summaryLine: 20,
  sectionShell: 12,
} as const;

function countMatches(html: string, pattern: RegExp): number {
  return (html.match(pattern) || []).length;
}

function estimateBlockHeight(html: string): number {
  let h = STRUCTURAL_HEIGHTS.sectionShell + STRUCTURAL_HEIGHTS.sectionHeading;
  const photos = countMatches(
    html,
    /profile-image-wrapper|photo-block|ese-photo-block|pee-photo-block|header-photo/gi
  );
  h += photos * STRUCTURAL_HEIGHTS.photoBlock;
  h += countMatches(html, /\bexperience-item\b/gi) * STRUCTURAL_HEIGHTS.experienceItemBase;
  h +=
    countMatches(html, /<li\b/gi) * STRUCTURAL_HEIGHTS.experienceBullet;
  h += countMatches(html, /\beducation-item\b/gi) * STRUCTURAL_HEIGHTS.educationItem;
  h += countMatches(html, /\bproject-item\b/gi) * STRUCTURAL_HEIGHTS.projectItem;
  h += countMatches(html, /\bskill-tag\b|psp-skill-item\b/gi) * STRUCTURAL_HEIGHTS.skillTag;
  h +=
    countMatches(html, /\bcertification-item\b/gi) * STRUCTURAL_HEIGHTS.certificationItem;
  h += countMatches(html, /\blanguage-item\b|psp-language-item\b/gi) * STRUCTURAL_HEIGHTS.languageItem;
  h += countMatches(html, /\bachievement-item\b/gi) * STRUCTURAL_HEIGHTS.achievementItem;
  h += countMatches(html, /\bhobby-item\b/gi) * STRUCTURAL_HEIGHTS.hobbyItem;
  const summaryText = html.replace(/<[^>]+>/g, ' ').trim();
  if (/\bsummary-text\b|professional-summary\b/i.test(html) && summaryText) {
    h += Math.max(STRUCTURAL_HEIGHTS.summaryLine * 2, Math.ceil(summaryText.length / 80) * STRUCTURAL_HEIGHTS.summaryLine);
  }
  h += countMatches(html, /\bcontact-list\b|ese-contact-list\b/gi) * STRUCTURAL_HEIGHTS.contactRow * 3;
  return h;
}

function extractColumnHtml(renderedHtml: string): { sidebar: string; main: string } {
  const sidebarMatch =
    renderedHtml.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i) ||
    renderedHtml.match(
      /<div[^>]*class="[^"]*\bsidebar[^"]*"[^>]*>([\s\S]*?)<\/div>(?=[\s\S]*<main)/i
    );
  const mainMatch = renderedHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  return {
    sidebar: sidebarMatch?.[1] ?? '',
    main: mainMatch?.[1] ?? renderedHtml,
  };
}

function collectSectionMetricsFromHtml(html: string): SectionHeightMetric[] {
  const byKind = new Map<LayoutSectionKind, SectionHeightMetric>();
  const re = /<section[^>]*>[\s\S]*?<\/section>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const block = match[0];
    const kind = classifySectionKindFromHtml(block);
    if (kind === 'contact' || kind === 'other') continue;
    const height = estimateBlockHeight(block);
    const prev = byKind.get(kind);
    if (prev) {
      prev.height += height;
      prev.elementCount += 1;
    } else {
      byKind.set(kind, { kind, height, elementCount: 1 });
    }
  }
  return Array.from(byKind.values());
}

function detectSidebarSparse(
  sidebarSections: SectionHeightMetric[],
  mainSections: SectionHeightMetric[],
  sidebarHeight: number,
  mainHeight: number
): boolean {
  const sidebarWeight = sumSectionHeights(sidebarSections);
  const mainWeight = sumSectionHeights(mainSections);
  if (mainWeight <= 0) return false;
  const fewSidebarKinds = sidebarSections.length <= 2 && mainSections.length >= 2;
  const heightRatio = sidebarHeight > 0 && mainHeight > sidebarHeight * 1.35;
  const weightRatio = sidebarWeight < mainWeight * 0.38;
  return fewSidebarKinds || (heightRatio && weightRatio) || sidebarWeight < mainWeight * 0.32;
}

function computeColumnBasisPct(
  metrics: RenderedLayoutMetrics,
  hasSidebar: boolean,
  sidebarSparse: boolean
): { main: number; sidebar: number; sidebarMax: number } {
  if (!hasSidebar) return { main: 100, sidebar: 0, sidebarMax: 0 };
  const sidebarWeight = sumSectionHeights(metrics.sidebarSections);
  const mainWeight = sumSectionHeights(metrics.mainSections);
  const total = sidebarWeight + mainWeight || 1;
  let sidebarPct = clamp((sidebarWeight / total) * 1.12 + 0.24, 0.26, 0.4);

  if (sidebarSparse) {
    sidebarPct = clamp(0.22 + (sidebarWeight / total) * 0.35, 0.22, 0.3);
  } else if (metrics.sidebarHeight > metrics.mainHeight * 1.2) {
    sidebarPct = clamp(sidebarPct + 0.04, 0.28, 0.42);
  }

  return {
    main: Math.round((1 - sidebarPct) * 100),
    sidebar: Math.round(sidebarPct * 100),
    sidebarMax: Math.round(sidebarPct * 100 + 2),
  };
}

function resolveSkillColumns(skillCount: number, hasSidebar: boolean): number {
  if (skillCount <= 0) return 2;
  if (hasSidebar) {
    if (skillCount <= 6) return 2;
    if (skillCount <= 12) return 2;
    return 3;
  }
  if (skillCount <= 4) return 2;
  if (skillCount <= 8) return 2;
  if (skillCount <= 12) return 3;
  return 4;
}

function countExperienceItems(
  formData?: Record<string, unknown>,
  renderedHtml?: string
): number {
  if (formData) {
    return filterMeaningfulExperiences(
      (Array.isArray(formData.experience) ? formData.experience : []) as Array<
        Record<string, unknown>
      >
    ).length;
  }
  return countMatches(renderedHtml ?? '', /\bexperience-item\b/gi);
}

function countProjectItems(
  formData?: Record<string, unknown>,
  renderedHtml?: string
): number {
  if (formData) {
    return filterMeaningfulProjects(
      (Array.isArray(formData.projects) ? formData.projects : []) as Array<
        Record<string, unknown>
      >
    ).length;
  }
  return countMatches(renderedHtml ?? '', /\bproject-item\b/gi);
}

function countEducationItems(formData?: Record<string, unknown>): number {
  if (!formData) return 0;
  const rows = Array.isArray(formData.education) ? formData.education : [];
  return rows.filter((row) => row && typeof row === 'object').length;
}

function rebalanceSectionExtrasForSparseContent(
  formData: Record<string, unknown> | undefined,
  fill: number,
  sectionExtras: Partial<Record<LayoutSectionKind, number>>,
  metrics: RenderedLayoutMetrics,
  counts: {
    skillCount: number;
    projectCount: number;
    experienceCount: number;
    educationCount: number;
  }
): Partial<Record<LayoutSectionKind, number>> {
  if (fill >= FILL_EXPAND_BELOW || !formData) return sectionExtras;

  const extras = { ...sectionExtras };
  const deficit = Math.max(
    metrics.remainingWhitespace,
    (TARGET_PAGE_FILL - fill) * metrics.pageHeight
  );
  const share = deficit * 0.1;

  const boost = (kind: LayoutSectionKind, px: number) => {
    if (px <= 0) return;
    extras[kind] = Math.round((extras[kind] ?? 0) + px);
  };

  if (counts.skillCount === 0) {
    extras.skills = 0;
    boost('experience', share);
    if (counts.projectCount > 0) boost('projects', share * 0.65);
    else boost('summary', share * 0.45);
  }

  if (counts.projectCount === 0) {
    extras.projects = 0;
    boost('experience', share * 0.75);
    boost('summary', share * 0.35);
  }

  if (counts.educationCount <= 1) {
    boost('experience', share * 0.45);
    if (extras.education) extras.education = Math.round(extras.education * 0.35);
  }

  if (metrics.sidebarSparse) {
    boost('experience', share * 0.35);
    boost('summary', share * 0.25);
    extras.skills = Math.min(extras.skills ?? 0, Math.round(share * 0.15));
  }

  return extras;
}

function countSummaryWords(
  formData?: Record<string, unknown>,
  renderedHtml?: string
): number {
  if (formData) {
    const text = String(
      formData.summary || formData.professionalSummary || formData['Professional Summary'] || ''
    ).trim();
    if (text) return text.split(/\s+/).filter(Boolean).length;
  }
  const match = (renderedHtml ?? '').match(
    /class="[^"]*summary-text[^"]*"[^>]*>([\s\S]*?)<\//i
  );
  if (!match) return 0;
  const text = match[1].replace(/<[^>]+>/g, ' ').trim();
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}


/**
 * Structural synthesis from rendered HTML when a live DOM is unavailable (server export path).
 * Uses element markers and calibrated heights — not raw character volume.
 */
export function synthesizeMetricsFromRenderedHtml(
  renderedHtml: string,
  pageHeight = A4_PAGE_HEIGHT_PX
): RenderedLayoutMetrics {
  const { sidebar, main } = extractColumnHtml(renderedHtml);
  const hasSidebar = Boolean(sidebar);
  const sidebarContentHeight = hasSidebar ? estimateBlockHeight(sidebar) : 0;
  const mainContentHeight = estimateBlockHeight(main);
  const sidebarHeight = hasSidebar ? sidebarContentHeight : 0;
  const mainHeight = mainContentHeight;
  const containerHeight = hasSidebar
    ? Math.max(sidebarHeight, mainHeight) + 80
    : mainHeight + 60;
  const usedPageHeight = Math.min(containerHeight, pageHeight);
  const remainingWhitespace = Math.max(0, pageHeight - containerHeight);
  const pageFillRatio = clamp(containerHeight / pageHeight, 0, 1.5);
  const sections = collectSectionMetricsFromHtml(renderedHtml);
  const sidebarSections = collectSectionMetricsFromHtml(sidebar);
  const mainSections = collectSectionMetricsFromHtml(main);
  const visibleSectionKinds = sections.map((s) => s.kind);
  const sidebarSparse = hasSidebar
    ? detectSidebarSparse(sidebarSections, mainSections, sidebarHeight, mainHeight)
    : false;

  return {
    pageHeight,
    containerHeight,
    usedPageHeight,
    remainingWhitespace,
    pageFillRatio,
    sidebarHeight,
    mainHeight,
    sidebarContentHeight,
    mainContentHeight,
    sidebarFillRatio: sidebarHeight > 0 ? sidebarContentHeight / sidebarHeight : 1,
    mainFillRatio: mainHeight > 0 ? mainContentHeight / mainHeight : 1,
    columnImbalance: hasSidebar ? Math.abs(sidebarHeight - mainHeight) : 0,
    sections,
    sidebarSections,
    mainSections,
    sidebarSparse,
    visibleSectionKinds,
  };
}

function sumSectionHeights(sections: SectionHeightMetric[]): number {
  return sections.reduce((sum, s) => sum + s.height, 0);
}

function countCertificationItems(formData?: Record<string, unknown>): number {
  if (!formData) return 0;
  return filterMeaningfulCertifications(
    (Array.isArray(formData.certifications) ? formData.certifications : []) as Array<
      Record<string, unknown>
    >
  ).length;
}

function countLanguageItems(formData?: Record<string, unknown>): number {
  if (!formData) return 0;
  return (Array.isArray(formData.languages) ? formData.languages : []).filter(Boolean).length;
}

function countAchievementItems(formData?: Record<string, unknown>): number {
  if (!formData) return 0;
  return filterMeaningfulAchievements(
    Array.isArray(formData.achievements) ? formData.achievements : []
  ).length;
}

function estimateExperienceTextUnits(formData?: Record<string, unknown>): number {
  if (!formData) return 0;
  const exps = filterMeaningfulExperiences(
    (Array.isArray(formData.experience) ? formData.experience : []) as Array<
      Record<string, unknown>
    >
  );
  return exps.reduce((sum, exp) => {
    const desc = String(exp.description || '').trim();
    const bullets = Array.isArray(exp.achievements) ? exp.achievements.length : 0;
    return sum + Math.max(1, bullets) + Math.ceil(desc.length / 90);
  }, 0);
}

/**
 * Layout-only content metrics — uses existing meaningful filters, never mutates formData.
 */
export function computeSectionContentMetrics(
  formData?: Record<string, unknown>,
  renderedHtml?: string
): SectionContentMetrics {
  const experienceCount = countExperienceItems(formData, renderedHtml);
  const projectCount = countProjectItems(formData, renderedHtml);
  const educationCount = countEducationItems(formData);
  const skillCount = formData
    ? (filterMeaningfulSkills(normalizeSkillsForRender(formData)) as string[]).length
    : countMatches(renderedHtml ?? '', /\bskill-tag\b|psp-skill-item\b/gi);
  const certificationCount = countCertificationItems(formData);
  const languageCount = countLanguageItems(formData);
  const achievementCount = countAchievementItems(formData);
  const summaryWords = countSummaryWords(formData, renderedHtml);
  const experienceTextUnits = estimateExperienceTextUnits(formData);

  let lowValueNoiseScore = 0;
  if (projectCount === 1 && formData) {
    const projects = filterMeaningfulProjects(
      (Array.isArray(formData.projects) ? formData.projects : []) as Array<
        Record<string, unknown>
      >
    );
    const only = projects[0];
    const name = String(only?.name || only?.title || '').trim();
    if (name.split(/\s+/).length <= 1) lowValueNoiseScore += 1;
  }
  if (skillCount > 0 && skillCount <= 2) lowValueNoiseScore += 0.5;
  if (educationCount === 1 && experienceCount >= 2) lowValueNoiseScore += 0.25;

  return {
    experienceCount,
    projectCount,
    educationCount,
    skillCount,
    certificationCount,
    languageCount,
    achievementCount,
    summaryWords,
    experienceTextUnits,
    lowValueNoiseScore,
  };
}

export function computeLayoutFillSignals(metrics: RenderedLayoutMetrics): LayoutFillSignals {
  const pageFill = metrics.pageFillRatio;
  const mainColumnRatio = metrics.mainHeight / metrics.pageHeight;
  const sidebarColumnRatio =
    metrics.sidebarHeight > 0 ? metrics.sidebarHeight / metrics.pageHeight : 0;
  const sidebarUnderfilled =
    metrics.sidebarSparse ||
    (metrics.sidebarHeight > 0 && metrics.sidebarFillRatio < 0.55) ||
    (metrics.sidebarHeight > 0 && metrics.sidebarContentHeight < metrics.mainContentHeight * 0.35);

  const expSection = metrics.mainSections.find((s) => s.kind === 'experience');
  const mainWeight = sumSectionHeights(metrics.mainSections) || 1;
  const experienceDominant = Boolean(
    expSection && expSection.height >= mainWeight * 0.42
  );

  const shouldExpand =
    pageFill < FILL_EXPAND_BELOW ||
    (sidebarUnderfilled && pageFill < FILL_HOLD_MAX);
  const shouldCompress =
    pageFill > FILL_COMPRESS_ABOVE &&
    !(sidebarUnderfilled && mainColumnRatio > 0.72 && experienceDominant);

  return {
    pageFill,
    mainColumnRatio,
    sidebarColumnRatio,
    shouldExpand,
    shouldCompress,
    experienceDominant,
    sidebarUnderfilled,
  };
}

function sectionPriorityWeight(kind: LayoutSectionKind): number {
  return SECTION_CONTENT_PRIORITY[kind] ?? SECTION_CONTENT_PRIORITY.other;
}

function distributeSpaceByPriority(
  sections: SectionHeightMetric[],
  deficitPx: number,
  pageFillRatio: number,
  contentMetrics?: SectionContentMetrics
): Partial<Record<LayoutSectionKind, number>> {
  const extras: Partial<Record<LayoutSectionKind, number>> = {};
  const distributable = sections.filter((s) => s.kind !== 'contact' && s.height > 0);
  if (distributable.length === 0 || deficitPx <= 0) return extras;

  const weighted = distributable.map((sec) => {
    let contentMul = 1;
    if (contentMetrics) {
      if (sec.kind === 'experience') {
        contentMul = 1 + Math.min(0.55, contentMetrics.experienceTextUnits * 0.04);
      } else if (sec.kind === 'projects' && contentMetrics.projectCount > 0) {
        contentMul = 0.85 + contentMetrics.projectCount * 0.08;
      } else if (sec.kind === 'education' && contentMetrics.educationCount <= 1) {
        contentMul = 0.55;
      } else if (sec.kind === 'skills' && contentMetrics.skillCount <= 4) {
        contentMul = 0.65;
      } else if (sec.kind === 'languages' && contentMetrics.languageCount <= 2) {
        contentMul = 0.5;
      }
    }
    const weight = sec.height * sectionPriorityWeight(sec.kind) * contentMul;
    return { sec, weight };
  });

  const totalWeight = weighted.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0) return extras;

  const shareMul = pageFillRatio < 0.5 ? 0.92 : 0.88;
  for (const { sec, weight } of weighted) {
    const share = (weight / totalWeight) * deficitPx * shareMul;
    extras[sec.kind] = Math.round((extras[sec.kind] ?? 0) + share);
  }
  return extras;
}

function rebalanceColumnExtras(
  extras: Partial<Record<LayoutSectionKind, number>>,
  metrics: RenderedLayoutMetrics,
  fillSignals: LayoutFillSignals
): Partial<Record<LayoutSectionKind, number>> {
  const out = { ...extras };

  if (metrics.mainHeight > metrics.sidebarHeight * 1.08) {
    const gap = metrics.mainHeight - metrics.sidebarHeight;
    const transfer = Math.min(96, gap * 0.14);
    out.experience = (out.experience ?? 0) + Math.round(transfer * 0.62);
    out.summary = (out.summary ?? 0) + Math.round(transfer * 0.18);
    if (fillSignals.experienceDominant) {
      out.experience = (out.experience ?? 0) + Math.round(transfer * 0.12);
    }

    const compressMul = fillSignals.sidebarUnderfilled ? 0.28 : 0.55;
    for (const kind of SIDEBAR_COMPRESSIBLE_KINDS) {
      if (!metrics.sidebarSections.some((s) => s.kind === kind)) continue;
      out[kind] = Math.round((out[kind] ?? 0) * compressMul);
    }
  } else if (
    metrics.sidebarHeight > metrics.mainHeight * 1.18 &&
    !metrics.sidebarSparse
  ) {
    const boost = Math.min(36, (metrics.sidebarHeight - metrics.mainHeight) * 0.07);
    for (const kind of ['skills', 'education'] as LayoutSectionKind[]) {
      if (metrics.sidebarSections.some((s) => s.kind === kind)) {
        out[kind] = (out[kind] ?? 0) + Math.round(boost * 0.45);
      }
    }
  }

  return out;
}

function resolveAdaptiveCardMultipliers(
  metrics: RenderedLayoutMetrics,
  fillSignals: LayoutFillSignals,
  contentMetrics: SectionContentMetrics
): {
  sidebarCardMul: number;
  sidebarGapMul: number;
  educationItemMul: number;
  experienceProtectMul: number;
} {
  let sidebarCardMul = 1;
  let sidebarGapMul = 1;
  let educationItemMul = 1;
  let experienceProtectMul = 1;

  if (fillSignals.sidebarUnderfilled) {
    sidebarCardMul = contentMetrics.educationCount <= 1 ? 0.58 : 0.72;
    sidebarGapMul = 0.78;
    educationItemMul = contentMetrics.educationCount <= 1 ? 0.62 : 0.82;
  } else if (metrics.sidebarHeight > metrics.mainHeight * 1.2) {
    sidebarCardMul = 1.08;
    sidebarGapMul = 1.05;
  }

  if (fillSignals.experienceDominant) {
    experienceProtectMul = fillSignals.shouldCompress ? 1.08 : 1.04;
    if (contentMetrics.experienceTextUnits >= 8) experienceProtectMul += 0.06;
  }

  if (contentMetrics.lowValueNoiseScore >= 1) {
    sidebarCardMul *= 0.9;
    educationItemMul *= 0.88;
  }

  return { sidebarCardMul, sidebarGapMul, educationItemMul, experienceProtectMul };
}

function distributeProportionalExtras(
  sections: SectionHeightMetric[],
  deficitPx: number,
  pageFillRatio: number
): Partial<Record<LayoutSectionKind, number>> {
  const extras: Partial<Record<LayoutSectionKind, number>> = {};
  const distributable = sections.filter(
    (s) => s.kind !== 'contact' && s.height > 0
  );
  if (distributable.length === 0 || deficitPx <= 0) return extras;

  if (pageFillRatio < 0.5) {
    const perKind = (deficitPx * 0.92) / distributable.length;
    for (const sec of distributable) {
      extras[sec.kind] = Math.round((extras[sec.kind] ?? 0) + perKind);
    }
    return extras;
  }

  const total = sumSectionHeights(distributable);
  if (total <= 0) return extras;

  for (const sec of distributable) {
    const share = (sec.height / total) * deficitPx * 0.88;
    extras[sec.kind] = Math.round((extras[sec.kind] ?? 0) + share);
  }
  return extras;
}

/**
 * Measure an already-rendered resume document (browser / Puppeteer).
 */
export function measureRenderedLayout(
  doc: Document,
  pageHeight = A4_PAGE_HEIGHT_PX
): RenderedLayoutMetrics {
  const container = doc.querySelector('.resume-container') as HTMLElement | null;
  const sidebarEl = doc.querySelector(
    'aside, .sidebar, [class*="-sidebar"]'
  ) as HTMLElement | null;
  const mainEl = doc.querySelector(
    'main, .main-content, [class*="-main"]'
  ) as HTMLElement | null;

  const containerHeight = container?.scrollHeight ?? doc.body?.scrollHeight ?? 0;

  const sectionEls = Array.from(
    doc.querySelectorAll(
      '.resume-container section, .resume-container .content-section, .resume-container .sidebar-section'
    )
  );

  const byKind = new Map<LayoutSectionKind, SectionHeightMetric>();
  const sidebarByKind = new Map<LayoutSectionKind, SectionHeightMetric>();
  const mainByKind = new Map<LayoutSectionKind, SectionHeightMetric>();
  for (const el of sectionEls) {
    const kind = classifySectionKindFromElement(el);
    if (kind === 'contact' || kind === 'other') continue;
    const height = el.getBoundingClientRect().height;
    if (height < 4) continue;
    const bump = (map: Map<LayoutSectionKind, SectionHeightMetric>) => {
      const prev = map.get(kind);
      if (prev) {
        prev.height += height;
        prev.elementCount += 1;
      } else {
        map.set(kind, { kind, height, elementCount: 1 });
      }
    };
    bump(byKind);
    if (sidebarEl?.contains(el)) bump(sidebarByKind);
    else if (mainEl?.contains(el)) bump(mainByKind);
    else bump(mainByKind);
  }
  const sections = Array.from(byKind.values());
  const sidebarSections = Array.from(sidebarByKind.values());
  const mainSections = Array.from(mainByKind.values());

  const sidebarHeight = sidebarEl?.scrollHeight ?? 0;
  const mainHeight = mainEl?.scrollHeight ?? 0;
  const sidebarContentHeight = sidebarEl
    ? Array.from(sidebarEl.querySelectorAll('section, .sidebar-section')).reduce(
        (sum, n) => sum + n.getBoundingClientRect().height,
        0
      ) || sidebarHeight
    : 0;
  const mainContentHeight = mainEl
    ? Array.from(mainEl.querySelectorAll('section, .content-section')).reduce(
        (sum, n) => sum + n.getBoundingClientRect().height,
        0
      ) || mainHeight
    : containerHeight;

  const remainingWhitespace = Math.max(0, pageHeight - containerHeight);
  const pageFillRatio = clamp(containerHeight / pageHeight, 0, 1.5);
  const sidebarSparse = sidebarEl
    ? detectSidebarSparse(sidebarSections, mainSections, sidebarHeight, mainHeight)
    : false;

  return {
    pageHeight,
    containerHeight,
    usedPageHeight: Math.min(containerHeight, pageHeight),
    remainingWhitespace,
    pageFillRatio,
    sidebarHeight,
    mainHeight,
    sidebarContentHeight,
    mainContentHeight,
    sidebarFillRatio: sidebarHeight > 0 ? sidebarContentHeight / sidebarHeight : 1,
    mainFillRatio: mainHeight > 0 ? mainContentHeight / mainHeight : 1,
    columnImbalance: sidebarEl && mainEl ? Math.abs(sidebarHeight - mainHeight) : 0,
    sections,
    sidebarSections,
    mainSections,
    sidebarSparse,
    visibleSectionKinds: sections.map((s) => s.kind),
  };
}

/**
 * DOM-aware layout plan from measured or synthesized metrics.
 */
export function computeDynamicLayoutPlanFromMetrics(
  metrics: RenderedLayoutMetrics,
  formData?: Record<string, unknown>,
  options?: ComputeDynamicLayoutOptions
): DynamicLayoutPlan {
  const htmlTemplate = options?.htmlTemplate ?? '';
  const hasSidebar = detectHasSidebar(htmlTemplate) || metrics.sidebarHeight > 0;
  const fillSignals = computeLayoutFillSignals(metrics);
  const fill = fillSignals.pageFill;
  const contentMetrics = computeSectionContentMetrics(formData, options?.renderedHtml);

  let sectionGapMul = 1;
  let blockGapMul = 1;
  let bulletGapMul = 1;
  let headingGapMul = 1;
  let fontScale = 1;
  let lineHeightMul = 1;
  let sectionPaddingMul = 1;
  let paragraphSpacingMul = 1;
  let columnGapMul = 1;
  let sidebarGapMul = 1;
  let sectionExtras: Partial<Record<LayoutSectionKind, number>> = {};

  if (fillSignals.shouldExpand) {
    // Stronger expansion for sparse pages; still capped so we don't stretch absurdly.
    const expand = clamp((TARGET_PAGE_FILL - fill) / TARGET_PAGE_FILL, 0, 1);
    const sparseBoost = fill < 0.55 ? 1.35 : fill < 0.7 ? 1.18 : 1;
    sectionGapMul = 1 + expand * 0.72 * sparseBoost;
    blockGapMul = 1 + expand * 0.58 * sparseBoost;
    bulletGapMul = 1 + expand * 0.42 * sparseBoost;
    headingGapMul = 1 + expand * 0.48 * sparseBoost;
    lineHeightMul = 1 + expand * 0.2 * sparseBoost;
    fontScale = 1 + expand * 0.11 * Math.min(sparseBoost, 1.2);
    sectionPaddingMul = 1 + expand * 0.62 * sparseBoost;
    paragraphSpacingMul = 1 + expand * 0.48 * sparseBoost;
    columnGapMul = 1 + expand * 0.18;
    sidebarGapMul = 1 + expand * 0.7 * sparseBoost;
    const deficitPx = Math.max(
      metrics.remainingWhitespace,
      (TARGET_PAGE_FILL - fill) * metrics.pageHeight
    );
    sectionExtras = distributeSpaceByPriority(
      metrics.sections,
      deficitPx,
      fill,
      contentMetrics
    );
  } else if (fillSignals.shouldCompress) {
    const compress = clamp((fill - FILL_COMPRESS_ABOVE) / 0.35, 0, 1);
    const compressDampen = fillSignals.experienceDominant ? 0.55 : 1;
    const c = compress * compressDampen;
    sectionGapMul = 1 - c * 0.22;
    blockGapMul = 1 - c * 0.24;
    bulletGapMul = 1 - c * 0.26;
    headingGapMul = 1 - c * 0.16;
    lineHeightMul = 1 - c * 0.1;
    fontScale = 1 - c * 0.07;
    sectionPaddingMul = 1 - c * 0.14;
    paragraphSpacingMul = 1 - c * 0.12;
    columnGapMul = 1 - c * 0.1;
  } else if (fill >= FILL_HOLD_MIN && fill <= FILL_HOLD_MAX) {
    // Elegant band (85–95%) — keep rhythm; tiny nudge toward TARGET_PAGE_FILL only.
    const nudge = clamp((TARGET_PAGE_FILL - fill) / 0.1, -0.35, 0.35);
    if (Math.abs(nudge) > 0.05) {
      sectionPaddingMul = 1 + nudge * 0.08;
      paragraphSpacingMul = 1 + nudge * 0.06;
      blockGapMul = 1 + nudge * 0.05;
    }
  }

  const visibleSectionCount = metrics.sections.length;
  if (visibleSectionCount <= 4 && fill < 0.85) {
    sectionGapMul *= 1.22;
    blockGapMul *= 1.16;
    sectionPaddingMul *= 1.14;
  }

  const skillCount = contentMetrics.skillCount;

  const columnBasis = computeColumnBasisPct(metrics, hasSidebar, metrics.sidebarSparse);
  const skillColumns = resolveSkillColumns(skillCount, hasSidebar);

  let mainFlexGrow = hasSidebar ? 1.65 : 1;
  let sidebarFlexGrow = hasSidebar ? 1 : 0;

  if (hasSidebar && fillSignals.sidebarUnderfilled) {
    mainFlexGrow = 2.12;
    sidebarFlexGrow = 0.68;
  } else if (hasSidebar && metrics.columnImbalance > 40) {
    const taller = Math.max(metrics.sidebarHeight, metrics.mainHeight);
    const shorter = Math.min(metrics.sidebarHeight, metrics.mainHeight) || 1;
    const ratio = clamp((taller - shorter) / taller, 0, 0.45);
    if (metrics.sidebarHeight > metrics.mainHeight) {
      mainFlexGrow = 1.65 + ratio * 1.1;
      sidebarFlexGrow = 1 - ratio * 0.35;
    } else {
      sidebarFlexGrow = 1 + ratio * 0.55;
      mainFlexGrow = 1.65 - ratio * 0.4;
    }
  }

  const density = clamp(fill, 0, 1.35) / 1.35;

  const experienceCount = contentMetrics.experienceCount;
  const projectCount = contentMetrics.projectCount;
  const educationCount = contentMetrics.educationCount;
  const summaryWords = contentMetrics.summaryWords;
  const summaryIsShort = summaryWords > 0 && summaryWords < 45;

  if (fillSignals.shouldExpand) {
    sectionExtras = rebalanceSectionExtrasForSparseContent(
      formData,
      fill,
      sectionExtras,
      metrics,
      { skillCount, projectCount, experienceCount, educationCount }
    );
  }

  if (visibleSectionCount <= 5 && fill < 0.55) {
    sectionGapMul *= 0.9;
    fontScale += 0.04;
    lineHeightMul += 0.06;
  }

  if (summaryIsShort && fill < 0.88) {
    lineHeightMul += 0.08;
    paragraphSpacingMul += 0.28;
  } else if (summaryWords > 80) {
    lineHeightMul -= 0.04;
    paragraphSpacingMul -= 0.08;
  }

  // Few skills → more breathing room inside the grid (not outer page gaps).
  if (skillCount > 0 && skillCount <= 6 && fill < 0.88) {
    blockGapMul *= 1.12;
    sectionPaddingMul *= 1.08;
  }

  const adaptiveCards = resolveAdaptiveCardMultipliers(metrics, fillSignals, contentMetrics);
  sidebarGapMul *= adaptiveCards.sidebarGapMul;

  if (fillSignals.experienceDominant) {
    lineHeightMul = Math.max(lineHeightMul, 1.02);
    if (fillSignals.shouldCompress) {
      blockGapMul = Math.max(blockGapMul, 0.9);
      bulletGapMul = Math.max(bulletGapMul, 0.88);
    }
  }

  let projectSpacingMul = 1;
  if (projectCount === 1 && fill < 0.88) {
    projectSpacingMul = 1.55;
  } else if (projectCount >= 3) {
    projectSpacingMul = 1 - clamp((projectCount - 2) / 6, 0, 0.28);
  }

  const blockGap = Math.round(BASE_BLOCK_GAP * blockGapMul * 10) / 10;
  const sectionGap = Math.round(BASE_SECTION_GAP * sectionGapMul * 10) / 10;
  const sectionPadding = Math.round(BASE_SECTION_PADDING * sectionPaddingMul * 10) / 10;

  sectionExtras = rebalanceColumnExtras(sectionExtras, metrics, fillSignals);

  let experienceCardPadding = sectionPadding;
  let experienceListGap = blockGap;
  let experienceHeaderGap = Math.round(BASE_HEADING_GAP * headingGapMul * 10) / 10;
  let experienceDescPadding = Math.round(blockGap * 0.85 * 10) / 10;
  let bulletIndent = 16;

  const experienceProtect = adaptiveCards.experienceProtectMul;

  if (experienceCount === 1) {
    const singleMul = fill < 0.85 ? 2.25 : 1.55;
    experienceCardPadding = Math.round(sectionPadding * singleMul * 10) / 10;
    experienceListGap = Math.round(blockGap * (fill < 0.85 ? 1.75 : 1.3) * 10) / 10;
    experienceDescPadding = Math.round(experienceDescPadding * (fill < 0.85 ? 1.6 : 1.25) * 10) / 10;
    bulletIndent = 18;
    if (fill < 0.55 && (skillCount === 0 || projectCount === 0)) {
      experienceCardPadding = Math.round(experienceCardPadding * 1.2 * 10) / 10;
      experienceDescPadding = Math.round(experienceDescPadding * 1.25 * 10) / 10;
    }
  } else if (experienceCount >= 4) {
    const compress = clamp((experienceCount - 3) / 6, 0, 1);
    const dampen = fillSignals.experienceDominant ? 0.45 : 1;
    experienceCardPadding = Math.round(sectionPadding * (1 - compress * 0.2 * dampen) * 10) / 10;
    experienceListGap = Math.round(blockGap * (1 - compress * 0.22 * dampen) * 10) / 10;
    experienceDescPadding = Math.round(
      experienceDescPadding * (1 - compress * 0.15 * dampen) * 10
    ) / 10;
  }

  if (fillSignals.experienceDominant) {
    experienceListGap = Math.round(experienceListGap * experienceProtect * 10) / 10;
    experienceDescPadding = Math.round(experienceDescPadding * experienceProtect * 10) / 10;
  }

  let sidebarCardPadding = Math.round(
    sectionPadding * adaptiveCards.sidebarCardMul * 10
  ) / 10;
  const educationSpacingMul = adaptiveCards.educationItemMul;

  return {
    sectionGap,
    blockGap,
    bulletGap: Math.round(BASE_BULLET_GAP * bulletGapMul * 100) / 100,
    headingGap: Math.round(BASE_HEADING_GAP * headingGapMul * 10) / 10,
    fontScale: Math.round(clamp(fontScale, 0.92, 1.12) * 1000) / 1000,
    lineHeightMul: Math.round(clamp(lineHeightMul, 0.9, 1.22) * 1000) / 1000,
    skillColumns,
    mainFlexGrow: Math.round(mainFlexGrow * 100) / 100,
    sidebarFlexGrow: Math.round(sidebarFlexGrow * 100) / 100,
    density: Math.round(density * 1000) / 1000,
    sectionPadding,
    paragraphSpacing: Math.round(BASE_PARAGRAPH_SPACING * paragraphSpacingMul * 10) / 10,
    columnGap: Math.round(BASE_COLUMN_GAP * columnGapMul * 10) / 10,
    summarySpacing: Math.round(
      (blockGap + (sectionExtras.summary ?? 0)) * 10
    ) / 10,
    experienceSpacing: Math.round(
      (blockGap + (sectionExtras.experience ?? 0)) * 10
    ) / 10,
    pageFillRatio: Math.round(fill * 1000) / 1000,
    sectionExtras,
    mainColumnBasisPct: columnBasis.main,
    sidebarColumnBasisPct: columnBasis.sidebar,
    sidebarMaxWidthPct: columnBasis.sidebarMax,
    sidebarInternalGap: Math.round(sectionGap * sidebarGapMul * 10) / 10,
    educationSpacing: Math.round(
      (blockGap + (sectionExtras.education ?? 0)) * educationSpacingMul * 10
    ) / 10,
    certificationSpacing: Math.round(
      (blockGap + (sectionExtras.certifications ?? 0)) * 10
    ) / 10,
    languageSpacing: Math.round(
      (blockGap + (sectionExtras.languages ?? 0)) * 10
    ) / 10,
    projectSpacing: Math.round(
      (blockGap + (sectionExtras.projects ?? 0)) * projectSpacingMul * 10
    ) / 10,
    experienceCount,
    visibleSectionCount,
    summaryIsShort,
    experienceCardPadding,
    experienceListGap,
    experienceHeaderGap,
    experienceDescPadding,
    bulletIndent,
    sidebarCardPadding,
  };
}

/**
 * Layout plan — prefers rendered metrics, then structural HTML synthesis, then form markers.
 */
export function computeDynamicLayoutPlan(
  formData: Record<string, unknown>,
  options?: ComputeDynamicLayoutOptions
): DynamicLayoutPlan {
  if (options?.metrics) {
    return computeDynamicLayoutPlanFromMetrics(options.metrics, formData, options);
  }
  if (options?.renderedHtml) {
    return computeDynamicLayoutPlanFromMetrics(
      synthesizeMetricsFromRenderedHtml(options.renderedHtml),
      formData,
      options
    );
  }
  const stubHtml = buildStubHtmlFromFormData(formData);
  return computeDynamicLayoutPlanFromMetrics(
    synthesizeMetricsFromRenderedHtml(stubHtml),
    formData,
    options
  );
}

function buildStubHtmlFromFormData(formData: Record<string, unknown>): string {
  const parts: string[] = [];
  const summary = String(formData.summary || formData.professionalSummary || '').trim();
  if (summary) parts.push(`<section><div class="summary-text">${summary}</div></section>`);
  const exps = filterMeaningfulExperiences(
    (Array.isArray(formData.experience) ? formData.experience : []) as Array<
      Record<string, unknown>
    >
  );
  for (const exp of exps) {
    const bullets = Array.isArray(exp.achievements) ? exp.achievements.length : 1;
    parts.push(
      `<section><div class="experience-item">${'<li></li>'.repeat(Math.max(bullets, 1))}</div></section>`
    );
  }
  const skills = filterMeaningfulSkills(normalizeSkillsForRender(formData)) as string[];
  if (skills.length) {
    parts.push(
      `<section>${skills.map(() => '<span class="skill-tag">s</span>').join('')}</section>`
    );
  }
  const edu = Array.isArray(formData.education) ? formData.education : [];
  for (const _ of edu) parts.push('<section><div class="education-item"></div></section>');
  return `<main>${parts.join('')}</main>`;
}

export interface BuildDynamicLayoutCssOptions {
  preservePremiumTypography?: boolean;
}

function sectionExtraVar(kind: LayoutSectionKind): string {
  return `--dl-extra-${kind}`;
}

function buildSectionExtraVars(plan: DynamicLayoutPlan): string {
  const kinds: LayoutSectionKind[] = [
    'summary',
    'experience',
    'projects',
    'education',
    'skills',
    'certifications',
    'languages',
    'achievements',
    'interests',
  ];
  return kinds
    .map((kind) => {
      const val = plan.sectionExtras[kind] ?? 0;
      return `  ${sectionExtraVar(kind)}: ${val}px;`;
    })
    .join('\n');
}

function buildProportionalSectionRules(): string {
  return `
.resume-container section:has(.summary-text),
.resume-container section:has([class*='summary-text']),
.resume-container section:has(.professional-summary) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-summary, 0px)) !important;
  padding-bottom: calc(var(--dl-section-padding) + var(--dl-extra-summary, 0px) * 0.15) !important;
}
.resume-container section:has(.experience-item),
.resume-container section:has(.experience-list) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-experience, 0px)) !important;
}
.resume-container section:has(.project-item),
.resume-container section:has(.projects-list) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-projects, 0px)) !important;
}
.resume-container section:has(.education-item),
.resume-container section:has(.education-list) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-education, 0px)) !important;
}
.resume-container section:has(.skill-tag),
.resume-container section:has(.psp-skill-item),
.resume-container section:has([class*='skills']) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-skills, 0px)) !important;
}
.resume-container section:has(.certification-item) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-certifications, 0px)) !important;
}
.resume-container section:has(.language-item),
.resume-container section:has(.psp-language-item) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-languages, 0px)) !important;
}
.resume-container section:has(.achievement-item) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-achievements, 0px)) !important;
}
.resume-container section:has(.hobby-item) {
  margin-bottom: calc(var(--dl-section-gap) + var(--dl-extra-interests, 0px)) !important;
}`.trim();
}

function buildRichContentLayoutCss(plan: DynamicLayoutPlan): string {
  const summaryShortCss = plan.summaryIsShort
    ? `
.resume-container[data-dl-summary='short'] .summary-text,
.resume-container[data-dl-summary='short'] [class*='summary-text'],
.resume-container[data-dl-summary='short'] .professional-summary {
  max-width: 100% !important;
  line-height: calc(var(--dl-line-height, 1.5) * 1.08) !important;
  margin-bottom: calc(var(--dl-summary-spacing, 12px) + var(--dl-paragraph-spacing, 4px)) !important;
}`
    : '';

  return `
/* Experience — hierarchy + adaptive card density (layout only) */
.resume-container .experience-list {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--dl-exp-list-gap, var(--dl-block-gap)) !important;
}

.resume-container .experience-item {
  padding: var(--dl-exp-card-padding, var(--dl-section-padding)) 0 !important;
  margin-bottom: var(--dl-experience-spacing, var(--dl-block-gap)) !important;
  flex: 1 1 auto !important;
  min-height: auto !important;
}

.resume-container .experience-list > .experience-item:only-child,
.resume-container[data-dl-exp-count='1'] .experience-item {
  padding-top: calc(var(--dl-exp-card-padding, 6px) * 1.2) !important;
  padding-bottom: calc(var(--dl-exp-card-padding, 6px) * 1.4) !important;
}

.resume-container .experience-header {
  margin-bottom: var(--dl-exp-header-gap, var(--dl-heading-gap)) !important;
}

.resume-container .experience-header h3 {
  margin-bottom: 2px !important;
}

.resume-container .experience-header .company {
  display: block !important;
}

.resume-container .experience-header .duration {
  display: inline-block !important;
}

.resume-container .experience-item .description {
  margin-top: var(--dl-exp-desc-padding, 8px) !important;
  padding-top: calc(var(--dl-exp-desc-padding, 8px) * 0.9) !important;
  border-top: 1px solid color-mix(in srgb, currentColor 13%, transparent) !important;
}

.resume-container .experience-item .description ul {
  margin: calc(var(--dl-exp-desc-padding, 8px) * 0.35) 0 0 !important;
  padding-left: 0 !important;
  list-style: none !important;
}

.resume-container .experience-item .description li,
.resume-container .experience-item .description ul li {
  position: relative !important;
  padding-left: var(--dl-bullet-indent, 16px) !important;
  margin-bottom: var(--dl-bullet-gap, 0.35em) !important;
  line-height: var(--dl-line-height) !important;
}

${summaryShortCss}

/* Skills — adaptive balanced grid */
.resume-container .skills-list:not(:has(.psp-skill-item)),
.resume-container .skills-chips-wrap:not(:has(.psp-skill-item)),
.resume-container [class*='skills-grid']:not(:has(.psp-skill-item)),
.resume-container [class*='skills-list']:not(:has(.psp-skill-item)) {
  justify-items: stretch !important;
  align-content: start !important;
}

.resume-container .skills-list:not(:has(.psp-skill-item)) > .skill-tag,
.resume-container .skills-chips-wrap:not(:has(.psp-skill-item)) > .skill-tag {
  text-align: center !important;
  justify-self: stretch !important;
}

/* Sidebar cards — compact when sparse, grow only with real content */
.resume-container[data-dl-sidebar-density='compact'] aside .education-item,
.resume-container[data-dl-sidebar-density='compact'] aside .certification-item,
.resume-container[data-dl-sidebar-density='compact'] aside .language-item,
.resume-container[data-dl-sidebar-density='compact'] .sidebar .education-item,
.resume-container[data-dl-sidebar-density='compact'] .sidebar .certification-item,
.resume-container[data-dl-sidebar-density='compact'] .sidebar .language-item {
  padding-top: calc(var(--dl-sidebar-card-padding, var(--dl-section-padding)) * 0.25) !important;
  padding-bottom: calc(var(--dl-sidebar-card-padding, var(--dl-section-padding)) * 0.35) !important;
}

.resume-container aside .education-item,
.resume-container aside .certification-item,
.resume-container aside .language-item,
.resume-container aside .psp-language-item,
.resume-container .sidebar .education-item,
.resume-container .sidebar .certification-item,
.resume-container .sidebar .language-item,
.resume-container .sidebar .psp-language-item {
  padding-top: calc(var(--dl-sidebar-card-padding, var(--dl-section-padding)) * 0.35) !important;
  padding-bottom: calc(var(--dl-sidebar-card-padding, var(--dl-section-padding)) * 0.55) !important;
  flex: 0 1 auto !important;
  min-height: auto !important;
}

/* Flexible section shells — no fixed heights */
.resume-container section,
.resume-container .content-section,
.resume-container .sidebar-section {
  flex: 1 1 auto !important;
  min-height: auto !important;
}`.trim();
}

export function applyLayoutPlanToElement(root: HTMLElement, plan: DynamicLayoutPlan): void {
  root.style.setProperty('--dl-section-gap', `${plan.sectionGap}px`);
  root.style.setProperty('--dl-block-gap', `${plan.blockGap}px`);
  root.style.setProperty('--dl-bullet-gap', `${plan.bulletGap}em`);
  root.style.setProperty('--dl-heading-gap', `${plan.headingGap}px`);
  root.style.setProperty('--dl-font-scale', String(plan.fontScale));
  root.style.setProperty('--dl-line-height', String(1.45 * plan.lineHeightMul));
  root.style.setProperty('--dl-skill-cols', String(plan.skillColumns));
  root.style.setProperty('--dl-main-flex', String(plan.mainFlexGrow));
  root.style.setProperty('--dl-sidebar-flex', String(plan.sidebarFlexGrow));
  root.style.setProperty('--dl-section-padding', `${plan.sectionPadding}px`);
  root.style.setProperty('--dl-paragraph-spacing', `${plan.paragraphSpacing}px`);
  root.style.setProperty('--dl-column-gap', `${plan.columnGap}px`);
  root.style.setProperty('--dl-summary-spacing', `${plan.summarySpacing}px`);
  root.style.setProperty('--dl-experience-spacing', `${plan.experienceSpacing}px`);
  root.style.setProperty('--dl-education-spacing', `${plan.educationSpacing}px`);
  root.style.setProperty('--dl-certification-spacing', `${plan.certificationSpacing}px`);
  root.style.setProperty('--dl-language-spacing', `${plan.languageSpacing}px`);
  root.style.setProperty('--dl-project-spacing', `${plan.projectSpacing}px`);
  root.style.setProperty('--dl-main-basis', `${plan.mainColumnBasisPct}%`);
  root.style.setProperty('--dl-sidebar-basis', `${plan.sidebarColumnBasisPct}%`);
  root.style.setProperty('--dl-sidebar-max', `${plan.sidebarMaxWidthPct}%`);
  root.style.setProperty('--dl-sidebar-gap', `${plan.sidebarInternalGap}px`);
  root.style.setProperty('--dl-exp-card-padding', `${plan.experienceCardPadding}px`);
  root.style.setProperty('--dl-exp-list-gap', `${plan.experienceListGap}px`);
  root.style.setProperty('--dl-exp-header-gap', `${plan.experienceHeaderGap}px`);
  root.style.setProperty('--dl-exp-desc-padding', `${plan.experienceDescPadding}px`);
  root.style.setProperty('--dl-bullet-indent', `${plan.bulletIndent}px`);
  root.style.setProperty('--dl-sidebar-card-padding', `${plan.sidebarCardPadding}px`);
  const kinds: LayoutSectionKind[] = [
    'summary',
    'experience',
    'projects',
    'education',
    'skills',
    'certifications',
    'languages',
    'achievements',
    'interests',
  ];
  for (const kind of kinds) {
    root.style.setProperty(sectionExtraVar(kind), `${plan.sectionExtras[kind] ?? 0}px`);
  }
  root.setAttribute('data-dl-refined', 'true');
  root.setAttribute('data-dl-fill', String(Math.round(plan.pageFillRatio * 100)));
  root.setAttribute('data-dl-exp-count', String(plan.experienceCount));
  root.setAttribute('data-dl-summary', plan.summaryIsShort ? 'short' : 'normal');
  root.setAttribute('data-dl-sections', String(plan.visibleSectionCount));
  const sidebarCompact =
    plan.sidebarCardPadding < plan.sectionPadding * 0.85 ? 'compact' : 'normal';
  root.setAttribute('data-dl-sidebar-density', sidebarCompact);
}

/**
 * Browser-only refinement: measure live DOM and apply CSS variables.
 */
export function applyDomAwareLayoutToDocument(
  doc: Document,
  formData: Record<string, unknown>,
  options?: ComputeDynamicLayoutOptions
): DynamicLayoutPlan {
  const metrics = measureRenderedLayout(doc, A4_PAGE_HEIGHT_PX);
  const plan = computeDynamicLayoutPlanFromMetrics(metrics, formData, options);
  const root = doc.querySelector('.resume-container') as HTMLElement | null;
  if (root) applyLayoutPlanToElement(root, plan);
  return plan;
}

export function buildDynamicLayoutCss(
  plan: DynamicLayoutPlan,
  options?: BuildDynamicLayoutCssOptions
): string {
  const preservePremium = options?.preservePremiumTypography === true;
  const lh = (1.45 * plan.lineHeightMul).toFixed(3);
  const extraVars = buildSectionExtraVars(plan);

  const structureCss = `
/* Dynamic layout engine — DOM-aware balance */
.resume-container {
  --dl-section-gap: ${plan.sectionGap}px;
  --dl-block-gap: ${plan.blockGap}px;
  --dl-bullet-gap: ${plan.bulletGap}em;
  --dl-heading-gap: ${plan.headingGap}px;
  --dl-font-scale: ${plan.fontScale};
  --dl-line-height: ${lh};
  --dl-skill-cols: ${plan.skillColumns};
  --dl-main-flex: ${plan.mainFlexGrow};
  --dl-sidebar-flex: ${plan.sidebarFlexGrow};
  --dl-section-padding: ${plan.sectionPadding}px;
  --dl-paragraph-spacing: ${plan.paragraphSpacing}px;
  --dl-column-gap: ${plan.columnGap}px;
  --dl-summary-spacing: ${plan.summarySpacing}px;
  --dl-experience-spacing: ${plan.experienceSpacing}px;
  --dl-education-spacing: ${plan.educationSpacing}px;
  --dl-certification-spacing: ${plan.certificationSpacing}px;
  --dl-language-spacing: ${plan.languageSpacing}px;
  --dl-project-spacing: ${plan.projectSpacing}px;
  --dl-main-basis: ${plan.mainColumnBasisPct}%;
  --dl-sidebar-basis: ${plan.sidebarColumnBasisPct}%;
  --dl-sidebar-max: ${plan.sidebarMaxWidthPct}%;
  --dl-sidebar-gap: ${plan.sidebarInternalGap}px;
  --dl-exp-card-padding: ${plan.experienceCardPadding}px;
  --dl-exp-list-gap: ${plan.experienceListGap}px;
  --dl-exp-header-gap: ${plan.experienceHeaderGap}px;
  --dl-exp-desc-padding: ${plan.experienceDescPadding}px;
  --dl-bullet-indent: ${plan.bulletIndent}px;
  --dl-sidebar-card-padding: ${plan.sidebarCardPadding}px;
${extraVars}
}

.resume-container .resume-wrapper,
.resume-container [class*='-layout'],
.resume-container [class*='-body']:not(body):not(html),
.resume-container [class*='-columns'],
.resume-container [class*='-main'],
.resume-container [class*='-sidebar'],
.resume-container main[class*='-'],
.resume-container aside[class*='-'],
.resume-container .main-content,
.resume-container .sidebar,
.resume-container .content-column,
.resume-container .side-column {
  align-items: flex-start !important;
  align-self: auto !important;
  justify-content: flex-start !important;
  min-height: auto !important;
  height: auto !important;
}

.resume-container [class*='-layout'],
.resume-container [class*='-columns'],
.resume-container .resume-wrapper {
  column-gap: var(--dl-column-gap) !important;
  gap: var(--dl-column-gap) !important;
}

.resume-container [class*='-layout'] > main,
.resume-container [class*='-layout'] > [class*='-main'],
.resume-container .main-content,
.resume-container .content-column {
  flex: var(--dl-main-flex, 1) 1 var(--dl-main-basis, auto) !important;
  flex-grow: var(--dl-main-flex, 1) !important;
  max-width: none !important;
}

.resume-container [class*='-layout'] > aside,
.resume-container [class*='-layout'] > [class*='-sidebar'],
.resume-container .sidebar,
.resume-container .side-column {
  flex: var(--dl-sidebar-flex, 1) 1 var(--dl-sidebar-basis, auto) !important;
  flex-grow: var(--dl-sidebar-flex, 1) !important;
  max-width: var(--dl-sidebar-max, 42%) !important;
}

.resume-container aside,
.resume-container .sidebar,
.resume-container [class*='-sidebar']:not([class*='-layout']) {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--dl-sidebar-gap, var(--dl-section-gap)) !important;
  justify-content: flex-start !important;
}

.resume-container .experience-item,
.resume-container .education-item,
.resume-container .project-item,
.resume-container .certification-item,
.resume-container .achievement-item,
.resume-container .language-item,
.resume-container .psp-language-item,
.resume-container [class*='-card'],
.resume-container [class*='card-'] {
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
}

.resume-container .education-item {
  margin-bottom: var(--dl-education-spacing, var(--dl-block-gap)) !important;
  padding-bottom: calc(var(--dl-section-padding) * 0.5) !important;
}

.resume-container .certification-item {
  margin-bottom: var(--dl-certification-spacing, var(--dl-block-gap)) !important;
}

.resume-container .language-item,
.resume-container .psp-language-item {
  margin-bottom: var(--dl-language-spacing, var(--dl-block-gap)) !important;
}

.resume-container .project-item {
  margin-bottom: var(--dl-project-spacing, var(--dl-block-gap)) !important;
}

.resume-container .skills-list:not(:has(.psp-skill-item)),
.resume-container .skills-chips-wrap:not(:has(.psp-skill-item)),
.resume-container [class*='skills-grid']:not(:has(.psp-skill-item)) {
  display: grid !important;
  grid-template-columns: repeat(var(--dl-skill-cols), minmax(0, 1fr)) !important;
  gap: calc(var(--dl-block-gap) * 0.6) calc(var(--dl-block-gap) * 0.9) !important;
  align-items: start !important;
  width: 100% !important;
}

.resume-container .skills-list:not(:has(.psp-skill-item)) > .skill-tag,
.resume-container .skills-chips-wrap:not(:has(.psp-skill-item)) > .skill-tag {
  min-height: auto !important;
  height: auto !important;
  white-space: normal !important;
  word-break: break-word !important;
}

.resume-container .summary-text,
.resume-container [class*='summary-text'],
.resume-container .professional-summary,
.resume-container .objective-text {
  min-height: auto !important;
  max-height: none !important;
  height: auto !important;
  line-height: var(--dl-line-height) !important;
  margin-bottom: var(--dl-paragraph-spacing) !important;
}
`.trim();

  if (preservePremium) {
    return `${structureCss}\n\n${buildProportionalSectionRules()}\n\n${buildRichContentLayoutCss(plan)}`;
  }

  return `
${structureCss}

${buildProportionalSectionRules()}

${buildRichContentLayoutCss(plan)}

.resume-container section,
.resume-container .content-section,
.resume-container .sidebar-section,
.resume-container [class*='-section']:not([class*='section-title']):not([class*='-section-head']) {
  margin-bottom: var(--dl-section-gap) !important;
  padding-bottom: var(--dl-section-padding) !important;
}

.resume-container section > h2,
.resume-container .section-title,
.resume-container [class*='section-title'],
.resume-container [class*='-section-head'] {
  margin-bottom: var(--dl-heading-gap) !important;
}

.resume-container .experience-item,
.resume-container .project-item,
.resume-container .certification-item,
.resume-container .achievement-item {
  margin-bottom: var(--dl-experience-spacing, var(--dl-block-gap)) !important;
}

.resume-container .education-item {
  margin-bottom: var(--dl-education-spacing, var(--dl-block-gap)) !important;
}

.resume-container .experience-item .description li,
.resume-container .description li,
.resume-container .project-item li {
  margin-bottom: var(--dl-bullet-gap) !important;
  line-height: var(--dl-line-height) !important;
}

.resume-container .experience-item .description,
.resume-container .project-item .description,
.resume-container .summary-text,
.resume-container [class*='summary-text'],
.resume-container .professional-summary {
  line-height: var(--dl-line-height) !important;
}

.resume-container {
  font-size: calc(1em * var(--dl-font-scale, 1)) !important;
}

.resume-container .experience-list > .experience-item:last-child,
.resume-container .education-list > .education-item:last-child,
.resume-container .projects-list > .project-item:last-child,
.resume-container section:last-child,
.resume-container .content-section:last-child,
.resume-container .sidebar-section:last-child {
  margin-bottom: 0 !important;
}
`.trim();
}

export function getDynamicLayoutStyleBlock(
  plan: DynamicLayoutPlan,
  options?: BuildDynamicLayoutCssOptions
): string {
  const css = buildDynamicLayoutCss(plan, options);
  if (!css) return '';
  return `<style data-injected="dynamic-layout">\n${css}\n</style>`;
}

/** Inline script refines layout from live DOM (gallery, preview iframe, PDF). */
export function getDomAwareLayoutRefinementScript(): string {
  return `<script data-injected="dynamic-layout-refine">
(function(){
  var PAGE=${A4_PAGE_HEIGHT_PX};
  function kind(el){
    var h=el.innerHTML.slice(0,3000);
    if(/experience-item/i.test(h))return 'experience';
    if(/summary-text|professional-summary/i.test(h))return 'summary';
    if(/education-item/i.test(h))return 'education';
    if(/skill-tag|psp-skill-item/i.test(h))return 'skills';
    if(/project-item/i.test(h))return 'projects';
    if(/certification-item/i.test(h))return 'certifications';
    if(/language-item|psp-language-item/i.test(h))return 'languages';
    if(/achievement-item/i.test(h))return 'achievements';
    if(/hobby-item/i.test(h))return 'interests';
    return 'other';
  }
  function measure(){
    var c=document.querySelector('.resume-container');
    var sb=document.querySelector('aside,.sidebar,[class*="-sidebar"]');
    var mn=document.querySelector('main,.main-content,[class*="-main"]');
    var ch=c?c.scrollHeight:(document.body?document.body.scrollHeight:0);
    var secs=Array.from(document.querySelectorAll('.resume-container section,.resume-container .content-section,.resume-container .sidebar-section'));
    var sections=[], sbSecs=[], mnSecs=[], map={};
    secs.forEach(function(el){
      var k=kind(el); if(k==='other')return;
      var ht=el.getBoundingClientRect().height; if(ht<4)return;
      if(!map[k]){map[k]={kind:k,height:0,elementCount:0};sections.push(map[k]);}
      map[k].height+=ht; map[k].elementCount++;
      if(sb&&sb.contains(el)){var sm=sbSecs.find(function(s){return s.kind===k;});if(sm)sm.height+=ht;else sbSecs.push({kind:k,height:ht,elementCount:1});}
      else if(mn&&mn.contains(el)){var mm=mnSecs.find(function(s){return s.kind===k;});if(mm)mm.height+=ht;else mnSecs.push({kind:k,height:ht,elementCount:1});}
    });
    var sh=sb?sb.scrollHeight:0, mh=mn?mn.scrollHeight:0;
    var sbW=sbSecs.reduce(function(a,s){return a+s.height;},0);
    var mnW=mnSecs.reduce(function(a,s){return a+s.height;},0);
    var sparse=sbSecs.length<=2&&mnSecs.length>=2||sbW<mnW*0.32;
    var expDominant=false;
    mnSecs.forEach(function(s){if(s.kind==='experience'&&s.height>=mnW*0.42)expDominant=true;});
    var sidebarUnder=sparse||(sb>0&&sbW<mnW*0.35);
    return {
      pageHeight:PAGE, containerHeight:ch, remainingWhitespace:Math.max(0,PAGE-ch),
      pageFillRatio:Math.min(1.5,ch/PAGE), sidebarHeight:sh, mainHeight:mh,
      columnImbalance:sb&&mn?Math.abs(sh-mh):0, sections:sections, sidebarSparse:sparse,
      sidebarUnderfilled:sidebarUnder, experienceDominant:expDominant,
      sidebarSections:sbSecs, mainSections:mnSecs
    };
  }
  function plan(m){
    var fill=m.pageFillRatio, sg=1,bg=1,fg=1,lh=1,pad=1,pg=1,cg=1,sgap=1,extras={};
    var TARGET=0.9;
    var shouldCompress=fill>0.95&&!(m.sidebarUnderfilled&&m.experienceDominant);
    if(fill<0.85){
      var ex=Math.min(1,Math.max(0,(TARGET-fill)/TARGET));
      var boost=fill<0.55?1.35:fill<0.7?1.18:1;
      sg=1+ex*0.72*boost; bg=1+ex*0.58*boost; fg=1+ex*0.11*Math.min(boost,1.2); lh=1+ex*0.2*boost;
      pad=1+ex*0.62*boost; pg=1+ex*0.48*boost; cg=1+ex*0.18; sgap=1+ex*0.7*boost;
      var def=Math.max(m.remainingWhitespace,(TARGET-fill)*PAGE);
      var pri={experience:1,projects:0.82,summary:0.78,skills:0.72,education:0.58,certifications:0.48,languages:0.42,achievements:0.45,interests:0.38,other:0.3};
      var tot=0;m.sections.forEach(function(s){tot+=s.height*(pri[s.kind]||0.3);});
      if(tot>0&&def>0)m.sections.forEach(function(s){var w=(s.height*(pri[s.kind]||0.3))/tot;extras[s.kind]=Math.round(w*def*0.88);});
    } else if(shouldCompress){
      var cp=Math.min(1,Math.max(0,(fill-0.95)/0.35));
      if(m.experienceDominant)cp*=0.55;
      sg=1-cp*0.22; bg=1-cp*0.24; fg=1-cp*0.07; lh=1-cp*0.1; pad=1-cp*0.14; pg=1-cp*0.12;
    } else {
      var nudge=Math.min(0.35,Math.max(-0.35,(TARGET-fill)/0.1));
      if(Math.abs(nudge)>0.05){pad=1+nudge*0.08;pg=1+nudge*0.06;bg=1+nudge*0.05;}
    }
    if(m.sections.length<=4&&fill<0.85){sg*=1.22;bg*=1.16;pad*=1.14;}
    var mf=m.sidebarHeight>0?1.65:1, sf=m.sidebarHeight>0?1:0, sbPct=32, mnPct=68, sbMax=34;
    if(m.sidebarUnderfilled){mf=2.12;sf=0.68;sbPct=24;mnPct=76;sbMax=26;sgap*=0.78;}
    else if(m.columnImbalance>40&&m.sidebarHeight>0){
      var t=Math.max(m.sidebarHeight,m.mainHeight), s=Math.min(m.sidebarHeight,m.mainHeight)||1;
      var r=Math.min(0.45,(t-s)/t);
      if(m.sidebarHeight>m.mainHeight){mf=1.65+r*1.1;sf=1-r*0.35;}else{sf=1+r*0.55;mf=1.65-r*0.4;}
    }
    if(m.mainHeight>m.sidebarHeight*1.08){
      var tr=Math.min(96,(m.mainHeight-m.sidebarHeight)*0.14);
      extras.experience=(extras.experience||0)+Math.round(tr*0.62);
      extras.summary=(extras.summary||0)+Math.round(tr*0.18);
      ['education','languages','certifications','skills'].forEach(function(k){
        if(m.sidebarSections.some(function(s){return s.kind===k;}))
          extras[k]=Math.round((extras[k]||0)*(m.sidebarUnderfilled?0.28:0.55));
      });
    }
    return {sectionGap:14*sg,blockGap:10*bg,fontScale:Math.min(1.12,Math.max(0.92,fg)),
      lineHeight:1.45*lh,mainFlex:mf,sidebarFlex:sf,pad:6*pad,pg:4*pg,cg:12*cg,
      sidebarGap:14*sg*sgap,mnPct:mnPct,sbPct:sbPct,sbMax:sbMax,extras:extras,sidebarUnder:m.sidebarUnderfilled};
  }
  function apply(){
    var root=document.querySelector('.resume-container'); if(!root)return;
    var m=measure();
    var fill=m.pageFillRatio;
    var p=plan(m);
    var expCount=(document.querySelectorAll('.experience-item')||[]).length;
    var projCount=(document.querySelectorAll('.project-item')||[]).length;
    var expPad=6*p.pad, expGap=p.blockGap, expDesc=p.blockGap*0.85, bulletInd=16;
    if(expCount===1){expPad=6*p.pad*(fill<0.85?2.25:1.55);expGap=p.blockGap*(fill<0.85?1.75:1.3);expDesc=expGap*0.85*(fill<0.85?1.6:1.25);bulletInd=18;}
    else if(expCount>=4){var c=Math.min(1,(expCount-3)/6);expPad=6*p.pad*(1-c*0.2);expGap=p.blockGap*(1-c*0.22);}
    var projMul=1;
    if(projCount===1&&fill<0.88)projMul=1.55;
    else if(projCount>=3)projMul=1-Math.min(0.28,(projCount-2)/6);
    var sbCard=6*p.pad*(p.sidebarUnder?0.62:(m.mainHeight>m.sidebarHeight*1.1?0.88:1));
    root.style.setProperty('--dl-section-gap',p.sectionGap+'px');
    root.style.setProperty('--dl-block-gap',p.blockGap+'px');
    root.style.setProperty('--dl-font-scale',String(p.fontScale));
    root.style.setProperty('--dl-line-height',String(p.lineHeight));
    root.style.setProperty('--dl-main-flex',String(p.mainFlex));
    root.style.setProperty('--dl-sidebar-flex',String(p.sidebarFlex));
    root.style.setProperty('--dl-section-padding',p.pad+'px');
    root.style.setProperty('--dl-paragraph-spacing',p.pg+'px');
    root.style.setProperty('--dl-column-gap',p.cg+'px');
    root.style.setProperty('--dl-sidebar-gap',p.sidebarGap+'px');
    root.style.setProperty('--dl-main-basis',p.mnPct+'%');
    root.style.setProperty('--dl-sidebar-basis',p.sbPct+'%');
    root.style.setProperty('--dl-sidebar-max',p.sbMax+'%');
    root.style.setProperty('--dl-exp-card-padding',expPad+'px');
    root.style.setProperty('--dl-exp-list-gap',expGap+'px');
    root.style.setProperty('--dl-exp-desc-padding',expDesc+'px');
    root.style.setProperty('--dl-bullet-indent',bulletInd+'px');
    root.style.setProperty('--dl-sidebar-card-padding',sbCard+'px');
    root.style.setProperty('--dl-project-spacing',(p.blockGap*projMul)+'px');
    var skillTags=document.querySelectorAll('.skill-tag,.psp-skill-item').length;
    var cols=2;
    if(skillTags<=6)cols=2;
    else if(skillTags>12)cols=m.sidebarHeight>0?3:4;
    else if(skillTags>8)cols=3;
    else cols=2;
    root.style.setProperty('--dl-skill-cols',String(cols));
    Object.keys(p.extras).forEach(function(k){root.style.setProperty('--dl-extra-'+k,p.extras[k]+'px');});
    root.setAttribute('data-dl-refined','true');
    root.setAttribute('data-dl-fill',String(Math.round(measure().pageFillRatio*100)));
    root.setAttribute('data-dl-exp-count',String(expCount));
    var sumEl=document.querySelector('.summary-text,.professional-summary,[class*="summary-text"]');
    var sumShort=false;
    if(sumEl){var w=(sumEl.textContent||'').trim().split(/\\s+/).filter(Boolean).length;sumShort=w>0&&w<45;}
    root.setAttribute('data-dl-summary',sumShort?'short':'normal');
    root.setAttribute('data-dl-sidebar-density',p.sidebarUnder?'compact':'normal');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();
</script>`;
}

function appendStyleBlockToHtml(html: string, styleBlock: string): string {
  if (!styleBlock) return html;
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${styleBlock}</body>`);
  }
  if (/<\/html>/i.test(html)) {
    return html.replace(/<\/html>/i, `${styleBlock}</html>`);
  }
  return html + styleBlock;
}

/**
 * Measure rendered HTML structurally, plan layout, inject CSS (+ DOM refine for preview).
 * Column balance uses flex only — sections are never relocated.
 * PDF gets the same CSS plan (no refine script) so Gallery/Live/PDF share density math.
 */
export function injectDynamicLayoutIntoHtml(
  html: string,
  formData: Record<string, unknown>,
  options?: ComputeDynamicLayoutOptions & { htmlTemplate?: string }
): string {
  const metrics = synthesizeMetricsFromRenderedHtml(html);
  const plan = computeDynamicLayoutPlanFromMetrics(metrics, formData, {
    ...options,
    renderedHtml: html,
  });
  const preservePremiumTypography = isPremiumTemplate(options?.templateId);
  const isPdf = options?.mode === 'pdf';
  const block =
    getDynamicLayoutStyleBlock(plan, { preservePremiumTypography }) +
    (isPdf ? '' : getDomAwareLayoutRefinementScript());
  let result = appendStyleBlockToHtml(html, block);
  result = result.replace(
    /(<div[^>]*class="[^"]*\bresume-container\b[^"]*"[^>]*)(>)/i,
    `$1 data-dl-exp-count="${plan.experienceCount}" data-dl-summary="${plan.summaryIsShort ? 'short' : 'normal'}" data-dl-sections="${plan.visibleSectionCount}" data-dl-fill="${Math.round(plan.pageFillRatio * 100)}" data-dl-sidebar-density="${plan.sidebarCardPadding < plan.sectionPadding * 0.85 ? 'compact' : 'normal'}"$2`
  );
  return result;
}

/* ── Render validation audit ── */

export interface SectionAuditRow {
  section: string;
  available: boolean;
  rendered: boolean;
  missing: boolean;
  reason: string;
}

const AUDIT_SECTIONS: Array<{
  key: string;
  marker: RegExp;
  hasData: (d: Record<string, unknown>) => boolean;
}> = [
  {
    key: 'summary',
    marker: /\bsummary-text\b|professional-summary\b/i,
    hasData: (d) =>
      Boolean(
        String(d.summary || d.professionalSummary || d['Professional Summary'] || '').trim()
      ),
  },
  {
    key: 'experience',
    marker: /\bexperience-item\b/i,
    hasData: (d) =>
      filterMeaningfulExperiences(
        (Array.isArray(d.experience) ? d.experience : []) as Array<Record<string, unknown>>
      ).length > 0,
  },
  {
    key: 'projects',
    marker: /\bproject-item\b/i,
    hasData: (d) =>
      filterMeaningfulProjects(
        (Array.isArray(d.projects) ? d.projects : []) as Array<Record<string, unknown>>
      ).length > 0,
  },
  {
    key: 'skills',
    marker: /\bskill-tag\b|psp-skill-item\b/i,
    hasData: (d) => (filterMeaningfulSkills(normalizeSkillsForRender(d)) as string[]).length > 0,
  },
  {
    key: 'education',
    marker: /\beducation-item\b/i,
    hasData: (d) => (Array.isArray(d.education) ? d.education : []).length > 0,
  },
  {
    key: 'certifications',
    marker: /\bcertification-item\b/i,
    hasData: (d) =>
      filterMeaningfulCertifications(
        (Array.isArray(d.certifications) ? d.certifications : []) as Array<Record<string, unknown>>
      ).length > 0,
  },
  {
    key: 'languages',
    marker: /\blanguage-item\b|psp-language-item\b/i,
    hasData: (d) => (Array.isArray(d.languages) ? d.languages : []).length > 0,
  },
  {
    key: 'achievements',
    marker: /\bachievement-item\b/i,
    hasData: (d) =>
      filterMeaningfulAchievements(Array.isArray(d.achievements) ? d.achievements : []).length > 0,
  },
];

export function auditRenderedSections(
  formData: Record<string, unknown>,
  renderedHtml: string
): SectionAuditRow[] {
  return AUDIT_SECTIONS.map(({ key, marker, hasData }) => {
    const available = hasData(formData);
    const rendered = marker.test(renderedHtml);
    let reason = 'ok';
    if (!available) reason = 'no data in builder';
    else if (!rendered) reason = 'data present but not in rendered HTML';
    return {
      section: key,
      available,
      rendered,
      missing: available && !rendered,
      reason,
    };
  });
}

export function formatSectionAuditReport(rows: SectionAuditRow[]): string {
  const header = ['Section', 'Available', 'Rendered', 'Missing', 'Reason'].join('\t');
  const lines = rows.map((r) =>
    [r.section, r.available, r.rendered, r.missing, r.reason].join('\t')
  );
  const missing = rows.filter((r) => r.missing);
  return [
    header,
    ...lines,
    '',
    `Missing sections: ${missing.length}`,
    ...missing.map((r) => `- ${r.section}: ${r.reason}`),
  ].join('\n');
}
