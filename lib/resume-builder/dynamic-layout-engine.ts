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

const FILL_EXPAND_BELOW = 0.65;
const FILL_HOLD_MIN = 0.7;
const FILL_HOLD_MAX = 0.9;
const FILL_COMPRESS_ABOVE = 0.95;
const TARGET_PAGE_FILL = 0.78;

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
  experienceBullet: 18,
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

function resolveSkillColumns(
  skillCount: number,
  hasSidebar: boolean,
  mainColumnBasisPct: number,
  fill: number
): number {
  const widthFactor = mainColumnBasisPct / 100;
  if (skillCount <= 0) return 2;
  if (hasSidebar) {
    if (skillCount <= 4) return 2;
    if (skillCount <= 10) return 2;
    return 3;
  }
  const cols =
    skillCount <= 6
      ? 2
      : skillCount <= 14
        ? 3
        : skillCount <= 28
          ? 4
          : 4;
  if (fill < 0.55 && widthFactor > 0.68) return Math.max(2, cols - 1);
  return cols;
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
  const fill = metrics.pageFillRatio;

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

  if (fill < FILL_EXPAND_BELOW) {
    const expand = clamp((TARGET_PAGE_FILL - fill) / TARGET_PAGE_FILL, 0, 1);
    sectionGapMul = 1 + expand * 0.52;
    blockGapMul = 1 + expand * 0.42;
    bulletGapMul = 1 + expand * 0.32;
    headingGapMul = 1 + expand * 0.38;
    lineHeightMul = 1 + expand * 0.16;
    fontScale = 1 + expand * 0.09;
    sectionPaddingMul = 1 + expand * 0.48;
    paragraphSpacingMul = 1 + expand * 0.36;
    columnGapMul = 1 + expand * 0.15;
    sidebarGapMul = 1 + expand * 0.55;
    const deficitPx = Math.max(
      metrics.remainingWhitespace,
      (TARGET_PAGE_FILL - fill) * metrics.pageHeight
    );
    sectionExtras = distributeProportionalExtras(metrics.sections, deficitPx, fill);
  } else if (fill > FILL_COMPRESS_ABOVE) {
    const compress = clamp((fill - FILL_COMPRESS_ABOVE) / 0.35, 0, 1);
    sectionGapMul = 1 - compress * 0.2;
    blockGapMul = 1 - compress * 0.22;
    bulletGapMul = 1 - compress * 0.24;
    headingGapMul = 1 - compress * 0.14;
    lineHeightMul = 1 - compress * 0.1;
    fontScale = 1 - compress * 0.06;
    sectionPaddingMul = 1 - compress * 0.12;
    paragraphSpacingMul = 1 - compress * 0.1;
    columnGapMul = 1 - compress * 0.08;
  } else if (fill >= FILL_HOLD_MIN && fill <= FILL_HOLD_MAX) {
    // Hold zone — minimal adjustment
  }

  const skillCount = formData
    ? (filterMeaningfulSkills(normalizeSkillsForRender(formData)) as string[]).length
    : countMatches(
        options?.renderedHtml ?? '',
        /\bskill-tag\b|psp-skill-item\b/gi
      );

  const columnBasis = computeColumnBasisPct(metrics, hasSidebar, metrics.sidebarSparse);
  let skillColumns = resolveSkillColumns(
    skillCount,
    hasSidebar,
    columnBasis.main,
    fill
  );

  let mainFlexGrow = hasSidebar ? 1.65 : 1;
  let sidebarFlexGrow = hasSidebar ? 1 : 0;

  if (hasSidebar && metrics.sidebarSparse) {
    mainFlexGrow = 2.05;
    sidebarFlexGrow = 0.72;
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
  const blockGap = Math.round(BASE_BLOCK_GAP * blockGapMul * 10) / 10;
  const sectionGap = Math.round(BASE_SECTION_GAP * sectionGapMul * 10) / 10;

  return {
    sectionGap,
    blockGap,
    bulletGap: Math.round(BASE_BULLET_GAP * bulletGapMul * 100) / 100,
    headingGap: Math.round(BASE_HEADING_GAP * headingGapMul * 10) / 10,
    fontScale: Math.round(clamp(fontScale, 0.92, 1.1) * 1000) / 1000,
    lineHeightMul: Math.round(clamp(lineHeightMul, 0.9, 1.18) * 1000) / 1000,
    skillColumns,
    mainFlexGrow: Math.round(mainFlexGrow * 100) / 100,
    sidebarFlexGrow: Math.round(sidebarFlexGrow * 100) / 100,
    density: Math.round(density * 1000) / 1000,
    sectionPadding: Math.round(BASE_SECTION_PADDING * sectionPaddingMul * 10) / 10,
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
      (blockGap + (sectionExtras.education ?? 0)) * 10
    ) / 10,
    certificationSpacing: Math.round(
      (blockGap + (sectionExtras.certifications ?? 0)) * 10
    ) / 10,
    languageSpacing: Math.round(
      (blockGap + (sectionExtras.languages ?? 0)) * 10
    ) / 10,
    projectSpacing: Math.round(
      (blockGap + (sectionExtras.projects ?? 0)) * 10
    ) / 10,
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
    return `${structureCss}\n\n${buildProportionalSectionRules()}`;
  }

  return `
${structureCss}

${buildProportionalSectionRules()}

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
.resume-container .education-item,
.resume-container .project-item,
.resume-container .certification-item,
.resume-container .achievement-item {
  margin-bottom: var(--dl-experience-spacing, var(--dl-block-gap)) !important;
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
    return {
      pageHeight:PAGE, containerHeight:ch, remainingWhitespace:Math.max(0,PAGE-ch),
      pageFillRatio:Math.min(1.5,ch/PAGE), sidebarHeight:sh, mainHeight:mh,
      columnImbalance:sb&&mn?Math.abs(sh-mh):0, sections:sections, sidebarSparse:sparse,
      sidebarSections:sbSecs, mainSections:mnSecs
    };
  }
  function plan(m){
    var fill=m.pageFillRatio, sg=1,bg=1,fg=1,lh=1,pad=1,pg=1,cg=1,sgap=1,extras={};
    if(fill<0.65){
      var ex=Math.min(1,Math.max(0,(0.78-fill)/0.78));
      sg=1+ex*0.52; bg=1+ex*0.42; fg=1+ex*0.09; lh=1+ex*0.16; pad=1+ex*0.48; pg=1+ex*0.36; cg=1+ex*0.15; sgap=1+ex*0.55;
      var def=Math.max(m.remainingWhitespace,(0.78-fill)*PAGE);
      if(fill<0.5&&m.sections.length>0){var eq=def*0.92/m.sections.length;m.sections.forEach(function(s){extras[s.kind]=Math.round(eq);});}
      else{var tot=0;m.sections.forEach(function(s){tot+=s.height;});if(tot>0&&def>0)m.sections.forEach(function(s){extras[s.kind]=Math.round((s.height/tot)*def*0.88);});}
    } else if(fill>0.95){
      var cp=Math.min(1,Math.max(0,(fill-0.95)/0.35));
      sg=1-cp*0.2; bg=1-cp*0.22; fg=1-cp*0.06; lh=1-cp*0.1; pad=1-cp*0.12;
    }
    var mf=m.sidebarHeight>0?1.65:1, sf=m.sidebarHeight>0?1:0, sbPct=32, mnPct=68, sbMax=34;
    if(m.sidebarSparse){mf=2.05;sf=0.72;sbPct=26;mnPct=74;sbMax=28;}
    else if(m.columnImbalance>40&&m.sidebarHeight>0){
      var t=Math.max(m.sidebarHeight,m.mainHeight), s=Math.min(m.sidebarHeight,m.mainHeight)||1;
      var r=Math.min(0.45,(t-s)/t);
      if(m.sidebarHeight>m.mainHeight){mf=1.65+r*1.1;sf=1-r*0.35;}else{sf=1+r*0.55;mf=1.65-r*0.4;}
    }
    return {sectionGap:14*sg,blockGap:10*bg,fontScale:Math.min(1.1,Math.max(0.92,fg)),
      lineHeight:1.45*lh,mainFlex:mf,sidebarFlex:sf,pad:6*pad,pg:4*pg,cg:12*cg,
      sidebarGap:14*sg*sgap,mnPct:mnPct,sbPct:sbPct,sbMax:sbMax,extras:extras};
  }
  function apply(){
    var root=document.querySelector('.resume-container'); if(!root)return;
    var p=plan(measure());
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
    Object.keys(p.extras).forEach(function(k){root.style.setProperty('--dl-extra-'+k,p.extras[k]+'px');});
    root.setAttribute('data-dl-refined','true');
    root.setAttribute('data-dl-fill',String(Math.round(measure().pageFillRatio*100)));
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
 * Measure rendered HTML structurally, plan layout, inject CSS + DOM refinement script.
 * Column balance uses flex only — sections are never relocated.
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
  const block =
    getDynamicLayoutStyleBlock(plan, { preservePremiumTypography }) +
    getDomAwareLayoutRefinementScript();
  return appendStyleBlockToHtml(html, block);
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
