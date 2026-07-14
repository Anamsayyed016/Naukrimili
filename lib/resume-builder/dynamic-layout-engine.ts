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
  resolveTemplateRenderCapacity,
  type TemplateRenderCapacity,
} from './section-visibility';
import { isPremiumTemplate } from './ats-content-balance-css';
import { estimateRenderableSectionHeight } from './section-height-estimator';
import { resolveTemplateLayoutMetadata } from './template-layout-metadata';

export const A4_PAGE_HEIGHT_PX = 1123;
export const A4_PAGE_WIDTH_PX = 794;

const BASE_SECTION_GAP = 14;
const BASE_BLOCK_GAP = 10;
const BASE_BULLET_GAP = 0.42;
const BASE_HEADING_GAP = 8;
const BASE_SECTION_PADDING = 6;
const BASE_PARAGRAPH_SPACING = 5;
const BASE_COLUMN_GAP = 12;

/** Expand when coverage is below the professional fill band (85–95%). */
const FILL_EXPAND_BELOW = 0.85;
/** Unused printable height that triggers whitespace redistribution (px). */
const WHITESPACE_EXPAND_THRESHOLD_PX = 72;
/** Minimum readable rhythm — never compress below these. */
const READABLE_BULLET_GAP_MIN = 0.42;
const READABLE_LINE_HEIGHT_MUL_MIN = 0.92;
const READABLE_DESC_LH_MUL_MIN = 1.05;
const READABLE_PARAGRAPH_SPACING_MIN = 5;
/** Soft hold only inside the elegant band — avoid both emptiness and edge-to-edge stretch. */
const FILL_HOLD_MIN = 0.85;
const FILL_HOLD_MAX = 0.95;
const FILL_COMPRESS_ABOVE = 0.95;
/** Target ~90% printable coverage (mid of 85–95%). */
const TARGET_PAGE_FILL = 0.9;

/**
 * Hard bounds — keep adaptations subtle so premium designs stay intact.
 * Sidebar gap ±20%, section padding ±12%, paragraph line-height ±10%.
 */
const SIDEBAR_GAP_MUL_MIN = 0.8;
const SIDEBAR_GAP_MUL_MAX = 1.2;
const SECTION_PAD_MUL_MIN = 0.88;
const SECTION_PAD_MUL_MAX = 1.12;
const LINE_HEIGHT_MUL_MIN = 0.9;
const LINE_HEIGHT_MUL_MAX = 1.1;
const SECTION_GAP_MUL_MIN = 0.85;
const SECTION_GAP_MUL_MAX = 1.2;
const BLOCK_GAP_MUL_MIN = 0.85;
const BLOCK_GAP_MUL_MAX = 1.2;
/** Cap padding dumps (px) — fill whitespace via rhythm, not empty card stretch. */
const SECTION_EXTRA_CAP_PX = 16;

export type LayoutRhythmMode = 'compact' | 'normal' | 'relaxed';

/**
 * Content priority — lower values compress first; experience anchors last.
 * Mirrors DEFAULT_SECTION_PRIORITIES (inverted for space distribution).
 */
const SECTION_CONTENT_PRIORITY: Record<LayoutSectionKind, number> = {
  experience: 0.22,
  summary: 0.28,
  projects: 0.42,
  skills: 0.48,
  education: 0.52,
  certifications: 0.58,
  achievements: 0.62,
  languages: 0.66,
  interests: 0.7,
  contact: 0.18,
  other: 0.55,
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
  /** Main column materially taller than sidebar (experience-heavy resumes). */
  columnOverload: boolean;
  columnImbalanceRatio: number;
  /** Printable page has meaningful unused vertical space. */
  pageUnderfill: boolean;
  /** True when column-balance-engine already relocated flexible sections. */
  columnBalanced: boolean;
}

/** Structural capacity inferred from template HTML — no per-template hardcoding. */
export interface TemplateLayoutCapacity {
  hasSidebar: boolean;
  isSingleColumn: boolean;
  isCardLayout: boolean;
  isExecutiveLayout: boolean;
  mainColumnBasisHint: number;
  sidebarColumnBasisHint: number;
  usablePageHeightPx: number;
  headerReservePx: number;
  footerReservePx: number;
  renderCapacity: TemplateRenderCapacity;
}

export type TemplateLayoutProfile = 'sidebar' | 'single-column' | 'card' | 'executive' | 'standard';

/**
 * Estimate printable regions and content budgets from template structure.
 * Reuses resolveTemplateRenderCapacity — does not duplicate capacity math.
 */
export function computeTemplateLayoutCapacity(
  htmlTemplate: string = '',
  templateId?: string
): TemplateLayoutCapacity {
  const metadata = resolveTemplateLayoutMetadata({ htmlTemplate, templateId });
  const hasSidebar =
    detectHasSidebar(htmlTemplate) || metadata.hasSidebar === true;
  const isCardLayout =
    metadata.layoutType === 'card' ||
    /card-grid|bento|module-card|floating-card|[\s"'](?:card|cards)[\s"']/i.test(
      htmlTemplate
    );
  const isExecutiveLayout =
    /executive|boardroom|career-history/i.test(templateId ?? '') ||
    /\btimeline\b|executive|boardroom|career-history/i.test(htmlTemplate);
  const isSingleColumn =
    !hasSidebar &&
    metadata.layoutType !== 'two-column' &&
    metadata.layoutType !== 'sidebar' &&
    !/columns|two-column|2-column|split-layout/i.test(htmlTemplate);

  const headerReservePx =
    /header-photo|profile-image|photo-block|ese-photo|pee-photo|portrait/i.test(
      htmlTemplate
    )
      ? 190
      : 72;
  const footerReservePx = 36;
  const usablePageHeightPx = Math.max(
    720,
    A4_PAGE_HEIGHT_PX - headerReservePx - footerReservePx
  );

  let mainColumnBasisHint = metadata.mainColumnBasisPct || 100;
  let sidebarColumnBasisHint = hasSidebar
    ? metadata.sidebarColumnBasisPct || 0
    : 0;
  if (hasSidebar) {
    const ratioMatch = htmlTemplate.match(/(\d{2})\s*\/\s*(\d{2})/);
    if (ratioMatch) {
      const a = parseInt(ratioMatch[1], 10);
      const b = parseInt(ratioMatch[2], 10);
      if (Number.isFinite(a) && Number.isFinite(b) && a + b >= 90 && a + b <= 110) {
        const mainPct = Math.max(a, b);
        const sidePct = Math.min(a, b);
        mainColumnBasisHint = mainPct;
        sidebarColumnBasisHint = sidePct;
      }
    }
    if (sidebarColumnBasisHint === 0) {
      mainColumnBasisHint = isExecutiveLayout ? 70 : 68;
      sidebarColumnBasisHint = 100 - mainColumnBasisHint;
    }
  } else {
    mainColumnBasisHint = 100;
    sidebarColumnBasisHint = 0;
  }

  return {
    hasSidebar,
    isSingleColumn,
    isCardLayout,
    isExecutiveLayout,
    mainColumnBasisHint,
    sidebarColumnBasisHint,
    usablePageHeightPx,
    headerReservePx,
    footerReservePx,
    renderCapacity: resolveTemplateRenderCapacity(htmlTemplate, { templateId }),
  };
}

export function resolveTemplateLayoutProfile(
  capacity: TemplateLayoutCapacity
): TemplateLayoutProfile {
  if (capacity.hasSidebar) return 'sidebar';
  if (capacity.isCardLayout) return 'card';
  if (capacity.isExecutiveLayout) return 'executive';
  if (capacity.isSingleColumn) return 'single-column';
  return 'standard';
}

function applyTemplateAwareDistribution(
  plan: Partial<DynamicLayoutPlan> & {
    sectionExtras: Partial<Record<LayoutSectionKind, number>>;
    mainFlexGrow: number;
    sidebarFlexGrow: number;
    mainColumnBasisPct: number;
    sidebarColumnBasisPct: number;
    sidebarCardPadding: number;
    sidebarInternalGap: number;
    experienceSpacing: number;
    experienceCardPadding: number;
    layoutRhythm?: LayoutRhythmMode;
  },
  capacity: TemplateLayoutCapacity,
  profile: TemplateLayoutProfile,
  fillSignals: LayoutFillSignals
): void {
  const extras = plan.sectionExtras;
  const compactRhythm = plan.layoutRhythm === 'compact';

  switch (profile) {
    case 'sidebar':
      if (fillSignals.sidebarUnderfilled && compactRhythm) {
        // Dense/compact: never inflate sidebar gaps to chase the main column.
        plan.sidebarInternalGap =
          Math.round(plan.sidebarInternalGap * 0.94 * 10) / 10;
        plan.sidebarCardPadding =
          Math.round(plan.sidebarCardPadding * 0.96 * 10) / 10;
        plan.sidebarFlexGrow = Math.min(plan.sidebarFlexGrow, 1.0);
      } else if (fillSignals.sidebarUnderfilled) {
        // Underfill: expand sidebar rhythm so the short column catches up.
        // Never widen main flex — that deepens the blank-sidebar look.
        const expandSidebar =
          fillSignals.columnOverload || fillSignals.experienceDominant;
        if (expandSidebar) {
          plan.sidebarCardPadding =
            Math.round(plan.sidebarCardPadding * 1.14 * 10) / 10;
          plan.sidebarInternalGap =
            Math.round(plan.sidebarInternalGap * 1.18 * 10) / 10;
          plan.sidebarFlexGrow = Math.max(plan.sidebarFlexGrow, 1.12);
          plan.mainFlexGrow = Math.min(plan.mainFlexGrow, 1.62);
          for (const kind of SIDEBAR_COMPRESSIBLE_KINDS) {
            extras[kind] = Math.round((extras[kind] ?? 0) + 8);
          }
        } else {
          plan.sidebarCardPadding =
            Math.round(plan.sidebarCardPadding * 1.06 * 10) / 10;
          plan.sidebarInternalGap =
            Math.round(plan.sidebarInternalGap * 1.08 * 10) / 10;
          plan.sidebarFlexGrow = Math.max(plan.sidebarFlexGrow, 1.0);
          plan.mainFlexGrow = Math.min(Math.max(plan.mainFlexGrow, 1.55), 1.75);
        }
      } else {
        extras.experience = (extras.experience ?? 0) + 6;
        for (const kind of SIDEBAR_COMPRESSIBLE_KINDS) {
          if (extras[kind]) extras[kind] = Math.round((extras[kind] ?? 0) * 0.85);
        }
      }
      break;
    case 'single-column':
      plan.mainColumnBasisPct = 100;
      plan.sidebarColumnBasisPct = 0;
      extras.experience = (extras.experience ?? 0) + 4;
      break;
    case 'executive':
      extras.experience = (extras.experience ?? 0) + 10;
      extras.summary = (extras.summary ?? 0) + 4;
      plan.experienceCardPadding = Math.round(plan.experienceCardPadding * 1.06 * 10) / 10;
      break;
    case 'card':
      extras.projects = Math.round((extras.projects ?? 0) * 1.05);
      plan.sidebarInternalGap = Math.round(plan.sidebarInternalGap * 0.92 * 10) / 10;
      break;
    default:
      break;
  }

  if (capacity.hasSidebar && capacity.mainColumnBasisHint > 0) {
    // Template metadata owns column proportions — never content-weight resize.
    plan.mainColumnBasisPct = Math.round(
      clamp(capacity.mainColumnBasisHint, 58, 78)
    );
    plan.sidebarColumnBasisPct = Math.round(
      clamp(capacity.sidebarColumnBasisHint, 22, 42)
    );
    plan.sidebarMaxWidthPct = plan.sidebarColumnBasisPct;
  }
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
  /** Adaptive typography hierarchy (relative to container 1em) */
  companyFontScale: number;
  titleFontScale: number;
  metaFontScale: number;
  bodyFontScale: number;
  headingFontScale: number;
  skillFontScale: number;
  /** Description/summary line-height multiplier (walls of text stay readable) */
  descLineHeightMul: number;
  /** Comfortable reading measure for summary (ch) */
  summaryMaxCh: number;
  /** Main-column description measure (ch) — wider when page/column has room */
  contentMeasureCh: number;
  /** sparse | balanced | dense — drives data-dl-density */
  typographyDensity: 'sparse' | 'balanced' | 'dense';
  /** compact | normal | relaxed — spacing / breathe without redesign */
  layoutRhythm: LayoutRhythmMode;
  /** Inner skill-list gap (px) */
  skillGap: number;
  /** Adaptive font weights (numeric 100–900) */
  companyFontWeight: number;
  titleFontWeight: number;
  metaFontWeight: number;
  bodyFontWeight: number;
  headingFontWeight: number;
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
  return estimateRenderableSectionHeight(html);
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
  } else if (metrics.mainHeight > metrics.sidebarHeight * 1.18) {
    sidebarPct = clamp(sidebarPct - 0.02, 0.24, 0.36);
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
  const columnImbalanceRatio =
    metrics.sidebarHeight > 0
      ? metrics.mainHeight / Math.max(metrics.sidebarHeight, 1)
      : metrics.mainHeight > 0
        ? 99
        : 1;
  const sidebarUnderfilled =
    metrics.sidebarSparse ||
    (metrics.sidebarHeight > 0 && metrics.sidebarFillRatio < 0.55) ||
    (metrics.sidebarHeight > 0 && metrics.sidebarContentHeight < metrics.mainContentHeight * 0.35);

  const expSection = metrics.mainSections.find((s) => s.kind === 'experience');
  const mainWeight = sumSectionHeights(metrics.mainSections) || 1;
  const experienceDominant = Boolean(
    expSection && expSection.height >= mainWeight * 0.42
  );
  const columnOverload =
    metrics.sidebarHeight > 0 &&
    metrics.mainHeight > metrics.sidebarHeight * 1.18 &&
    experienceDominant;
  const pageUnderfill =
    metrics.remainingWhitespace > WHITESPACE_EXPAND_THRESHOLD_PX && pageFill < 0.88;

  /** Set by plan when HTML was already section-balanced across columns. */
  const columnBalanced = false;

  const shouldExpand =
    pageFill < FILL_EXPAND_BELOW || pageUnderfill;
  const shouldCompress =
    pageFill > FILL_COMPRESS_ABOVE &&
    !pageUnderfill &&
    !(sidebarUnderfilled && mainColumnRatio > 0.72 && experienceDominant);

  return {
    pageFill,
    mainColumnRatio,
    sidebarColumnRatio,
    shouldExpand,
    shouldCompress,
    experienceDominant,
    sidebarUnderfilled,
    columnOverload,
    columnImbalanceRatio,
    pageUnderfill,
    columnBalanced,
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

  if (fillSignals.columnBalanced) {
    return out;
  }

  if (fillSignals.columnOverload || metrics.mainHeight > metrics.sidebarHeight * 1.08) {
    const gap = metrics.mainHeight - metrics.sidebarHeight;
    const transfer = Math.min(120, gap * 0.18);

    if (fillSignals.columnOverload && !fillSignals.pageUnderfill) {
      // Column imbalance only — tighten inter-job rhythm, not description readability.
      out.experience = Math.round((out.experience ?? 0) - transfer * 0.15);
      out.projects = Math.round((out.projects ?? 0) - transfer * 0.08);
      for (const kind of SIDEBAR_COMPRESSIBLE_KINDS) {
        if (!metrics.sidebarSections.some((s) => s.kind === kind)) continue;
        out[kind] = Math.round((out[kind] ?? 0) + transfer * 0.22);
      }
      out.summary = Math.round((out.summary ?? 0) + transfer * 0.15);
    } else if (fillSignals.sidebarUnderfilled) {
      // Short sidebar + taller main: feed extras into sidebar sections only.
      for (const kind of SIDEBAR_COMPRESSIBLE_KINDS) {
        if (!metrics.sidebarSections.some((s) => s.kind === kind)) continue;
        out[kind] = Math.round((out[kind] ?? 0) + transfer * 0.28);
      }
      if (metrics.sidebarSections.some((s) => s.kind === 'summary')) {
        out.summary = Math.round((out.summary ?? 0) + transfer * 0.18);
      }
      out.experience = Math.round((out.experience ?? 0) - transfer * 0.08);
    } else if (fillSignals.pageUnderfill) {
      // Redistribute unused page height into readable rhythm.
      for (const kind of ['experience', 'summary', 'skills', 'education'] as LayoutSectionKind[]) {
        if (!metrics.sections.some((s) => s.kind === kind)) continue;
        out[kind] = Math.round((out[kind] ?? 0) + transfer * 0.28);
      }
    } else {
      out.experience = (out.experience ?? 0) + Math.round(transfer * 0.22);
      out.summary = (out.summary ?? 0) + Math.round(transfer * 0.12);
      for (const kind of SIDEBAR_COMPRESSIBLE_KINDS) {
        if (!metrics.sidebarSections.some((s) => s.kind === kind)) continue;
        out[kind] = Math.round((out[kind] ?? 0) * 0.72);
      }
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

  const sidebarItemCount =
    contentMetrics.skillCount +
    contentMetrics.certificationCount +
    contentMetrics.languageCount +
    contentMetrics.achievementCount;
  const denseSidebar = sidebarItemCount >= 14;

  if (denseSidebar && fillSignals.sidebarUnderfilled) {
    // Many sidebar items already fill the track — tighten, don't expand.
    sidebarCardMul = 0.96;
    sidebarGapMul = 0.9;
    educationItemMul = 0.94;
    if (fillSignals.columnOverload) experienceProtectMul = 0.9;
  } else if (fillSignals.sidebarUnderfilled && fillSignals.columnOverload) {
    // Experience-heavy: expand sidebar rhythm instead of crushing it.
    sidebarCardMul = contentMetrics.educationCount <= 1 ? 1.08 : 1.18;
    sidebarGapMul = 1.22;
    educationItemMul = contentMetrics.educationCount <= 1 ? 1.05 : 1.12;
    experienceProtectMul = 0.88;
  } else if (fillSignals.sidebarUnderfilled) {
    // Still expand sparse sidebar — compressing it widens the blank column.
    sidebarCardMul = contentMetrics.educationCount <= 1 ? 1.06 : 1.12;
    sidebarGapMul = 1.12;
    educationItemMul = contentMetrics.educationCount <= 1 ? 1.04 : 1.08;
  } else if (metrics.sidebarHeight > metrics.mainHeight * 1.2) {
    sidebarCardMul = 1.08;
    sidebarGapMul = 1.05;
  }

  if (fillSignals.experienceDominant) {
    experienceProtectMul = fillSignals.columnOverload
      ? 0.86
      : fillSignals.shouldCompress
        ? 0.96
        : 1.02;
    if (contentMetrics.experienceTextUnits >= 8 && !fillSignals.columnOverload) {
      experienceProtectMul += 0.04;
    }
  }

  if (contentMetrics.lowValueNoiseScore >= 1) {
    sidebarCardMul *= 0.9;
    educationItemMul *= 0.88;
  }

  return { sidebarCardMul, sidebarGapMul, educationItemMul, experienceProtectMul };
}

/**
 * Sidebar item density → smooth gap multiplier (±20%).
 * 2–4 items: generous · 8: normal · 12: compact · 18+: very compact.
 */
function resolveSidebarSpacingMul(
  contentMetrics: SectionContentMetrics,
  fillSignals: LayoutFillSignals
): number {
  const itemCount =
    contentMetrics.skillCount +
    contentMetrics.certificationCount +
    contentMetrics.languageCount +
    contentMetrics.achievementCount;
  // Piecewise-linear soft curve across the common skill counts.
  let mul: number;
  if (itemCount <= 2) mul = 1.2;
  else if (itemCount <= 4) mul = 1.14;
  else if (itemCount <= 8) mul = 1.0;
  else if (itemCount <= 12) mul = 0.92;
  else if (itemCount <= 18) mul = 0.86;
  else mul = 0.8;

  // Only sparse sidebars get underfill breathing room — dense ones stay tight.
  if (fillSignals.sidebarUnderfilled && itemCount <= 8) {
    mul = Math.min(SIDEBAR_GAP_MUL_MAX, mul + 0.08);
  } else if (
    (fillSignals.shouldCompress && !fillSignals.sidebarUnderfilled) ||
    itemCount >= 18
  ) {
    mul = Math.max(SIDEBAR_GAP_MUL_MIN, mul - 0.06);
  }
  return clamp(mul, SIDEBAR_GAP_MUL_MIN, SIDEBAR_GAP_MUL_MAX);
}

/**
 * compact | normal | relaxed from fill + section inventory (no hardcoding).
 * Content inventory wins over synthetic under-estimates of page fill.
 */
function resolveLayoutRhythm(
  fillSignals: LayoutFillSignals,
  contentMetrics: SectionContentMetrics
): LayoutRhythmMode {
  const sidebarItems =
    contentMetrics.skillCount +
    contentMetrics.certificationCount +
    contentMetrics.languageCount;
  const heavyInventory =
    contentMetrics.experienceCount >= 6 ||
    sidebarItems >= 18 ||
    (contentMetrics.experienceCount >= 5 &&
      contentMetrics.experienceTextUnits >= 10) ||
    (contentMetrics.projectCount >= 3 && contentMetrics.experienceCount >= 4);

  if (
    heavyInventory ||
    fillSignals.shouldCompress ||
    (contentMetrics.experienceCount >= 4 && fillSignals.pageFill > 0.92)
  ) {
    return 'compact';
  }
  if (
    fillSignals.shouldExpand ||
    fillSignals.pageUnderfill ||
    (contentMetrics.experienceCount <= 2 && fillSignals.pageFill < 0.85)
  ) {
    return 'relaxed';
  }
  return 'normal';
}

function clampSectionExtras(
  extras: Partial<Record<LayoutSectionKind, number>>
): Partial<Record<LayoutSectionKind, number>> {
  const out: Partial<Record<LayoutSectionKind, number>> = {};
  for (const [key, value] of Object.entries(extras)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue;
    out[key as LayoutSectionKind] = Math.min(Math.round(value), SECTION_EXTRA_CAP_PX);
  }
  return out;
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
 * Density-aware type hierarchy — company stays largest; body/bullets tighten first.
 * Never truncates content; typography/spacing only.
 */
export function resolveAdaptiveTypography(input: {
  experienceCount: number;
  experienceTextUnits: number;
  summaryWords: number;
  skillCount: number;
  fill: number;
  experienceDominant: boolean;
  columnOverload?: boolean;
}): Pick<
  DynamicLayoutPlan,
  | 'companyFontScale'
  | 'titleFontScale'
  | 'metaFontScale'
  | 'bodyFontScale'
  | 'headingFontScale'
  | 'skillFontScale'
  | 'descLineHeightMul'
  | 'summaryMaxCh'
  | 'typographyDensity'
  | 'companyFontWeight'
  | 'titleFontWeight'
  | 'metaFontWeight'
  | 'bodyFontWeight'
  | 'headingFontWeight'
> {
  const {
    experienceCount,
    experienceTextUnits,
    summaryWords,
    skillCount,
    fill,
    experienceDominant,
    columnOverload = false,
  } = input;

  let companyFontScale = 1.15;
  let titleFontScale = 1.02;
  let metaFontScale = 0.84;
  let bodyFontScale = 0.98;
  let headingFontScale = 1.1;
  let skillFontScale = 0.9;
  let descLineHeightMul = 1.12;
  let summaryMaxCh = 68;
  let companyFontWeight = 650;
  let titleFontWeight = 560;
  let metaFontWeight = 450;
  let bodyFontWeight = 400;
  let headingFontWeight = 750;

  let typographyDensity: 'sparse' | 'balanced' | 'dense' = 'balanced';
  if (experienceCount <= 2 && fill < 0.78 && experienceTextUnits < 8) {
    typographyDensity = 'sparse';
  } else if (experienceCount >= 5 || experienceTextUnits >= 18 || fill > 0.98) {
    typographyDensity = 'dense';
  }

  if (typographyDensity === 'sparse') {
    companyFontScale = 1.18;
    titleFontScale = 1.05;
    bodyFontScale = 1.02;
    headingFontScale = 1.12;
    descLineHeightMul = 1.16;
    summaryMaxCh = 72;
    skillFontScale = 0.94;
    metaFontScale = 0.86;
    companyFontWeight = 680;
    titleFontWeight = 580;
    metaFontWeight = 460;
    bodyFontWeight = 420;
    headingFontWeight = 760;
  } else if (typographyDensity === 'dense') {
    // Tighten body/bullets first; keep company prominent.
    const densify = clamp(
      Math.max(experienceCount - 3, 0) / 7 + Math.max(experienceTextUnits - 12, 0) / 28,
      0,
      1
    );
    companyFontScale = 1.13 - densify * 0.02;
    titleFontScale = 1.0 - densify * 0.04;
    metaFontScale = 0.82 - densify * 0.04;
    bodyFontScale = 0.95 - densify * 0.08;
    headingFontScale = 1.06 - densify * 0.04;
    skillFontScale = 0.86 - densify * 0.04;
    // Longer walls need slightly more leading even when font shrinks.
    descLineHeightMul = 1.12 + densify * 0.08;
    summaryMaxCh = 62 - Math.round(densify * 4);
    companyFontWeight = 640 - Math.round(densify * 20);
    titleFontWeight = 540 - Math.round(densify * 30);
    metaFontWeight = 430 - Math.round(densify * 20);
    bodyFontWeight = 390;
    headingFontWeight = 720;
  } else if (experienceCount >= 3) {
    const mid = clamp((experienceCount - 2) / 4, 0, 1);
    bodyFontScale = 0.98 - mid * 0.05;
    titleFontScale = 1.02 - mid * 0.03;
    metaFontScale = 0.84 - mid * 0.02;
    descLineHeightMul = 1.12 + mid * 0.05;
    companyFontScale = 1.15;
  }

  if (experienceTextUnits >= 14) {
    descLineHeightMul = Math.max(descLineHeightMul, 1.14);
    bodyFontScale = Math.min(bodyFontScale, 0.95);
    summaryMaxCh = Math.min(summaryMaxCh, 64);
  }

  if (experienceDominant && experienceCount >= 3) {
    // Protect hierarchy: company/title stay readable while body densifies.
    companyFontScale = Math.max(companyFontScale, 1.12);
    titleFontScale = Math.max(titleFontScale, 0.98);
    descLineHeightMul = Math.max(descLineHeightMul, 1.12);
  }

  if (summaryWords > 90) {
    summaryMaxCh = Math.min(summaryMaxCh, 62);
    descLineHeightMul = Math.max(descLineHeightMul, 1.12);
  } else if (summaryWords > 0 && summaryWords < 45) {
    summaryMaxCh = Math.max(summaryMaxCh, 70);
    descLineHeightMul = Math.max(descLineHeightMul, 1.14);
  }

  if (skillCount >= 16) {
    skillFontScale = Math.min(skillFontScale, 0.84);
  } else if (skillCount > 0 && skillCount <= 6) {
    skillFontScale = Math.max(skillFontScale, 0.92);
  }

  return {
    companyFontScale: Math.round(clamp(companyFontScale, 1.02, 1.22) * 1000) / 1000,
    titleFontScale: Math.round(clamp(titleFontScale, 0.92, 1.12) * 1000) / 1000,
    metaFontScale: Math.round(clamp(metaFontScale, 0.76, 0.92) * 1000) / 1000,
    bodyFontScale: Math.round(clamp(bodyFontScale, 0.84, 1.06) * 1000) / 1000,
    headingFontScale: Math.round(clamp(headingFontScale, 0.96, 1.18) * 1000) / 1000,
    skillFontScale: Math.round(clamp(skillFontScale, 0.76, 0.98) * 1000) / 1000,
    descLineHeightMul: Math.round(clamp(descLineHeightMul, 1.02, 1.26) * 1000) / 1000,
    summaryMaxCh: Math.round(clamp(summaryMaxCh, 56, 78)),
    typographyDensity,
    companyFontWeight: Math.round(clamp(companyFontWeight, 580, 700)),
    titleFontWeight: Math.round(clamp(titleFontWeight, 500, 620)),
    metaFontWeight: Math.round(clamp(metaFontWeight, 400, 480)),
    bodyFontWeight: Math.round(clamp(bodyFontWeight, 380, 440)),
    headingFontWeight: Math.round(clamp(headingFontWeight, 680, 780)),
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
  const columnBalanced = /data-column-balanced=["']true["']/i.test(
    options?.renderedHtml ?? ''
  );
  const fillSignals: LayoutFillSignals = {
    ...computeLayoutFillSignals(metrics),
    columnBalanced,
  };
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
    const expand = clamp((TARGET_PAGE_FILL - fill) / TARGET_PAGE_FILL, 0, 1);
    const sparseBoost = fill < 0.55 ? 1.35 : fill < 0.7 ? 1.18 : 1;
    const underfillBoost = fillSignals.pageUnderfill ? 1.28 : 1;
    const boost = sparseBoost * underfillBoost;
    sectionGapMul = 1 + expand * 0.72 * boost;
    blockGapMul = 1 + expand * 0.58 * boost;
    bulletGapMul = 1 + expand * 0.48 * boost;
    headingGapMul = 1 + expand * 0.48 * boost;
    lineHeightMul = 1 + expand * 0.24 * boost;
    fontScale = 1 + expand * 0.08 * Math.min(boost, 1.2);
    sectionPaddingMul = 1 + expand * 0.62 * boost;
    paragraphSpacingMul = 1 + expand * 0.55 * boost;
    columnGapMul = 1 + expand * 0.18;
    sidebarGapMul = 1 + expand * 0.7 * boost;
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
    if (fillSignals.columnBalanced) {
      mainFlexGrow = 1.72;
      sidebarFlexGrow = 0.95;
    } else if (fillSignals.columnOverload) {
      // Do not widen main further when experience already dominates.
      mainFlexGrow = 1.58;
      sidebarFlexGrow = 1.12;
    } else {
      mainFlexGrow = 1.72;
      sidebarFlexGrow = 0.92;
    }
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
  const inventorySidebarMul = resolveSidebarSpacingMul(contentMetrics, fillSignals);
  sidebarGapMul *= adaptiveCards.sidebarGapMul;
  sidebarGapMul *= inventorySidebarMul;

  const layoutRhythm = resolveLayoutRhythm(fillSignals, contentMetrics);
  if (layoutRhythm === 'relaxed') {
    lineHeightMul = Math.min(LINE_HEIGHT_MUL_MAX, lineHeightMul + 0.06);
    paragraphSpacingMul = Math.min(1.2, paragraphSpacingMul + 0.1);
    sectionGapMul = Math.min(SECTION_GAP_MUL_MAX, sectionGapMul + 0.06);
    blockGapMul = Math.min(BLOCK_GAP_MUL_MAX, blockGapMul + 0.06);
  } else if (layoutRhythm === 'compact') {
    lineHeightMul = Math.max(LINE_HEIGHT_MUL_MIN, lineHeightMul - 0.04);
    paragraphSpacingMul = Math.max(0.88, paragraphSpacingMul - 0.06);
    sectionGapMul = Math.max(SECTION_GAP_MUL_MIN, sectionGapMul - 0.06);
    blockGapMul = Math.max(BLOCK_GAP_MUL_MIN, blockGapMul - 0.06);
    // Drop page-expand residue — compact spacing stays ≤ base (±20% floor).
    sidebarGapMul = clamp(
      Math.min(inventorySidebarMul, adaptiveCards.sidebarGapMul, 0.95),
      SIDEBAR_GAP_MUL_MIN,
      1
    );
  }

  if (fillSignals.experienceDominant) {
    lineHeightMul = Math.max(lineHeightMul, 1.02);
    if (fillSignals.shouldCompress) {
      blockGapMul = Math.max(blockGapMul, 0.9);
      bulletGapMul = Math.max(bulletGapMul, 0.88);
    }
  }

  let projectSpacingMul = 1;
  if (projectCount === 1 && fill < 0.88) {
    projectSpacingMul = 1.35;
  } else if (projectCount >= 3) {
    projectSpacingMul = 1 - clamp((projectCount - 2) / 6, 0, 0.22);
  }

  // Soft clamp — never exceed design-safe deltas.
  sectionGapMul = clamp(sectionGapMul, SECTION_GAP_MUL_MIN, SECTION_GAP_MUL_MAX);
  blockGapMul = clamp(blockGapMul, BLOCK_GAP_MUL_MIN, BLOCK_GAP_MUL_MAX);
  sectionPaddingMul = clamp(sectionPaddingMul, SECTION_PAD_MUL_MIN, SECTION_PAD_MUL_MAX);
  lineHeightMul = clamp(lineHeightMul, LINE_HEIGHT_MUL_MIN, LINE_HEIGHT_MUL_MAX);
  sidebarGapMul = clamp(sidebarGapMul, SIDEBAR_GAP_MUL_MIN, SIDEBAR_GAP_MUL_MAX);
  paragraphSpacingMul = clamp(paragraphSpacingMul, 0.88, 1.2);
  bulletGapMul = clamp(bulletGapMul, 0.85, 1.2);

  const blockGap = Math.round(BASE_BLOCK_GAP * blockGapMul * 10) / 10;
  const sectionGap = Math.round(BASE_SECTION_GAP * sectionGapMul * 10) / 10;
  const sectionPadding = Math.round(BASE_SECTION_PADDING * sectionPaddingMul * 10) / 10;

  sectionExtras = clampSectionExtras(
    rebalanceColumnExtras(sectionExtras, metrics, fillSignals)
  );

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
  } else if (experienceCount >= 4 && fillSignals.shouldCompress && !fillSignals.pageUnderfill) {
    const compress = clamp((experienceCount - 3) / 6, 0, 1);
    const dampen = fillSignals.experienceDominant ? 0.55 : 0.75;
    experienceCardPadding = Math.round(sectionPadding * (1 - compress * 0.18 * dampen) * 10) / 10;
    experienceListGap = Math.round(blockGap * (1 - compress * 0.2 * dampen) * 10) / 10;
    experienceDescPadding = Math.round(
      experienceDescPadding * (1 - compress * 0.12 * dampen) * 10
    ) / 10;
    experienceHeaderGap = Math.round(experienceHeaderGap * (1 - compress * 0.1 * dampen) * 10) / 10;
    bulletGapMul *= 1 - compress * 0.12 * dampen;
    paragraphSpacingMul *= 1 - compress * 0.08 * dampen;
  }

  if (fillSignals.pageUnderfill && experienceCount >= 2) {
    const fillBoost = clamp((TARGET_PAGE_FILL - fill) / TARGET_PAGE_FILL, 0, 1);
    // When the main column is already overloaded, do not grow inter-job gaps —
    // that deepens the blank-sidebar imbalance.
    const listBoost = fillSignals.columnOverload ? 0.04 : 0.22;
    const descBoost = fillSignals.columnOverload ? 0.08 : 0.28;
    experienceListGap = Math.round(experienceListGap * (1 + fillBoost * listBoost) * 10) / 10;
    experienceDescPadding = Math.round(experienceDescPadding * (1 + fillBoost * descBoost) * 10) / 10;
    experienceHeaderGap = Math.round(
      experienceHeaderGap * (1 + fillBoost * (fillSignals.columnOverload ? 0.04 : 0.15)) * 10
    ) / 10;
    if (!fillSignals.columnOverload) {
      bulletGapMul *= 1 + fillBoost * 0.18;
      paragraphSpacingMul *= 1 + fillBoost * 0.22;
      lineHeightMul *= 1 + fillBoost * 0.1;
    }
  }

  if (fillSignals.experienceDominant && !fillSignals.columnOverload) {
    experienceListGap = Math.round(experienceListGap * experienceProtect * 10) / 10;
    experienceDescPadding = Math.round(experienceDescPadding * experienceProtect * 10) / 10;
  }

  const adaptiveType = resolveAdaptiveTypography({
    experienceCount,
    experienceTextUnits: contentMetrics.experienceTextUnits,
    summaryWords,
    skillCount,
    fill,
    experienceDominant: fillSignals.experienceDominant,
    columnOverload: fillSignals.columnOverload,
  });

  // Align density hook with rhythm so template CSS (:dense/:sparse) cooperates.
  let typographyDensity = adaptiveType.typographyDensity;
  if (layoutRhythm === 'relaxed' && typographyDensity === 'balanced') {
    typographyDensity = 'sparse';
  } else if (layoutRhythm === 'compact' && typographyDensity === 'balanced') {
    typographyDensity = 'dense';
  }

  // Dense body text: slightly more description padding so walls don't feel glued.
  if (typographyDensity === 'dense') {
    experienceDescPadding = Math.round(experienceDescPadding * 1.08 * 10) / 10;
    bulletIndent = Math.max(14, bulletIndent - 1);
  } else if (typographyDensity === 'sparse' || layoutRhythm === 'relaxed') {
    experienceDescPadding = Math.round(experienceDescPadding * 1.1 * 10) / 10;
    bulletIndent = Math.min(20, bulletIndent + 2);
  }

  let contentMeasureCh = adaptiveType.summaryMaxCh;
  if (hasSidebar && (fillSignals.columnOverload || fillSignals.sidebarUnderfilled)) {
    contentMeasureCh = Math.max(contentMeasureCh, 76);
  }
  if (fillSignals.pageUnderfill || layoutRhythm === 'relaxed') {
    const widen = Math.round(clamp((TARGET_PAGE_FILL - fill) / 0.2, 0, 1) * 10);
    contentMeasureCh = Math.min(84, contentMeasureCh + widen + (layoutRhythm === 'relaxed' ? 4 : 0));
  }
  if (layoutRhythm === 'compact') {
    contentMeasureCh = Math.min(contentMeasureCh, 68);
  }

  const finalBulletGap = Math.max(
    READABLE_BULLET_GAP_MIN,
    Math.round(BASE_BULLET_GAP * bulletGapMul * 100) / 100
  );
  const finalLineHeightMul = Math.round(
    clamp(lineHeightMul, LINE_HEIGHT_MUL_MIN, LINE_HEIGHT_MUL_MAX) * 1000
  ) / 1000;
  const finalParagraphSpacing = Math.max(
    READABLE_PARAGRAPH_SPACING_MIN,
    Math.round(BASE_PARAGRAPH_SPACING * paragraphSpacingMul * 10) / 10
  );
  // Description LH: base ~1.12, allow ±10% (= ~1.01–1.23)
  let finalDescLhMul = Math.round(adaptiveType.descLineHeightMul * 1000) / 1000;
  if (layoutRhythm === 'relaxed') {
    finalDescLhMul = Math.min(1.232, finalDescLhMul * 1.06);
  } else if (layoutRhythm === 'compact') {
    finalDescLhMul = Math.max(READABLE_DESC_LH_MUL_MIN, finalDescLhMul * 0.96);
  }
  finalDescLhMul = clamp(finalDescLhMul, READABLE_DESC_LH_MUL_MIN, 1.232);

  let summaryMaxCh = adaptiveType.summaryMaxCh;
  if (layoutRhythm === 'relaxed') {
    summaryMaxCh = Math.min(78, summaryMaxCh + 4);
  } else if (layoutRhythm === 'compact') {
    summaryMaxCh = Math.max(56, summaryMaxCh - 4);
  }

  let sidebarCardPadding = Math.round(
    sectionPadding * adaptiveCards.sidebarCardMul * 10
  ) / 10;
  sidebarCardPadding = Math.round(
    clamp(
      sidebarCardPadding,
      BASE_SECTION_PADDING * SECTION_PAD_MUL_MIN,
      BASE_SECTION_PADDING * SECTION_PAD_MUL_MAX * 1.25
    ) * 10
  ) / 10;
  const educationSpacingMul = adaptiveCards.educationItemMul;
  // Compact: measure sidebar rhythm from base gap × inventory mul only —
  // page-expand sectionGap must not inflate dense sidebar packing.
  const sidebarGapBasis =
    layoutRhythm === 'compact' ? BASE_SECTION_GAP : sectionGap;
  const sidebarInternalGap = Math.round(sidebarGapBasis * sidebarGapMul * 10) / 10;
  const skillGap = Math.round(
    clamp(sidebarInternalGap * 0.55, 4, 12) * 10
  ) / 10;

  const templateCapacity = computeTemplateLayoutCapacity(
    htmlTemplate,
    options?.templateId
  );
  // Live DOM/metrics prove a sidebar even when callers omit htmlTemplate
  // (gallery refine). Never collapse that to single-column (sidebar basis 0),
  // or underfill CSS paints an empty second track.
  const metricHasSidebar =
    metrics.sidebarHeight > 0 || metrics.sidebarSections.length > 0;
  const layoutCapacity: TemplateLayoutCapacity = metricHasSidebar
    ? {
        ...templateCapacity,
        hasSidebar: true,
        isSingleColumn: false,
        mainColumnBasisHint:
          templateCapacity.hasSidebar && templateCapacity.mainColumnBasisHint < 100
            ? templateCapacity.mainColumnBasisHint
            : 68,
        sidebarColumnBasisHint:
          templateCapacity.sidebarColumnBasisHint > 0
            ? templateCapacity.sidebarColumnBasisHint
            : 32,
      }
    : templateCapacity;
  const layoutProfile = resolveTemplateLayoutProfile(layoutCapacity);

  const plan: DynamicLayoutPlan = {
    sectionGap,
    blockGap,
    bulletGap: finalBulletGap,
    headingGap: Math.round(BASE_HEADING_GAP * headingGapMul * 10) / 10,
    fontScale: Math.round(clamp(fontScale, 0.88, 1.12) * 1000) / 1000,
    lineHeightMul: finalLineHeightMul,
    skillColumns,
    mainFlexGrow: Math.round(mainFlexGrow * 100) / 100,
    sidebarFlexGrow: Math.round(sidebarFlexGrow * 100) / 100,
    density: Math.round(density * 1000) / 1000,
    sectionPadding,
    paragraphSpacing: finalParagraphSpacing,
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
    sidebarInternalGap,
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
    ...adaptiveType,
    typographyDensity,
    summaryMaxCh,
    descLineHeightMul: finalDescLhMul,
    contentMeasureCh,
    layoutRhythm,
    skillGap,
  };

  applyTemplateAwareDistribution(plan, layoutCapacity, layoutProfile, fillSignals);

  // Keep skill/item gap in sync if template distribution adjusted sidebar rhythm.
  plan.skillGap =
    Math.round(clamp(plan.sidebarInternalGap * 0.55, 4, 12) * 10) / 10;

  plan.summarySpacing =
    Math.round((plan.blockGap + (plan.sectionExtras.summary ?? 0)) * 10) / 10;
  plan.experienceSpacing =
    Math.round((plan.blockGap + (plan.sectionExtras.experience ?? 0)) * 10) / 10;
  plan.educationSpacing =
    Math.round((plan.blockGap + (plan.sectionExtras.education ?? 0)) * educationSpacingMul * 10) /
    10;
  plan.projectSpacing =
    Math.round((plan.blockGap + (plan.sectionExtras.projects ?? 0)) * projectSpacingMul * 10) /
    10;

  return plan;
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
.resume-container[data-dl-density][data-dl-summary='short'] .summary-text,
.resume-container[data-dl-density][data-dl-summary='short'] [class*='summary-text'],
.resume-container[data-dl-density][data-dl-summary='short'] .professional-summary {
  max-width: 100% !important;
  line-height: calc(var(--resume-line-height, 1.68) * 1.04) !important;
  margin-bottom: calc(var(--dl-summary-spacing, 12px) + var(--resume-paragraph-gap, 5px)) !important;
}`
    : '';

  // Absolute clamps beat baked ACB 9–10px floors; density scales keep short/long resumes balanced.
  const sz = (min: number, vw: number, max: number, scale: number) => {
    const s = Math.round(scale * 1000) / 1000;
    return `clamp(${(min * s).toFixed(2)}px, ${(vw * s).toFixed(3)}vw, ${(max * s).toFixed(2)}px)`;
  };
  const nameSize = sz(26, 3.3, 40, 1);
  const headingSize = sz(12.5, 1.25, 15, plan.headingFontScale);
  const companySize = sz(12, 1.18, 14, plan.companyFontScale);
  const jobSize = sz(11, 1.08, 12.5, plan.titleFontScale);
  const bodySize = sz(10.5, 1.08, 12.5, plan.bodyFontScale);
  const smallSize = sz(9.5, 0.98, 11, plan.metaFontScale);
  const skillSize = sz(9.5, 1.0, 11, plan.skillFontScale);
  const descLh = (Math.round(1.62 * plan.descLineHeightMul * 1000) / 1000).toFixed(3);
  const headingGapAbove = Math.max(2, Math.round(plan.headingGap * 0.35));
  const bulletGap = `${Math.max(READABLE_BULLET_GAP_MIN, plan.bulletGap).toFixed(2)}em`;

  return `
/* Professional resume typography — absolute clamps + density (preserves template fonts/colors) */
.resume-container[data-dl-density] {
  --dl-fs-company: ${plan.companyFontScale};
  --dl-fs-title: ${plan.titleFontScale};
  --dl-fs-meta: ${plan.metaFontScale};
  --dl-fs-body: ${plan.bodyFontScale};
  --dl-fs-heading: ${plan.headingFontScale};
  --dl-fs-skill: ${plan.skillFontScale};
  --dl-lh-desc: ${descLh};
  --dl-summary-max-ch: ${plan.summaryMaxCh};
  --dl-content-measure-ch: ${plan.contentMeasureCh};
  --resume-name-size: ${nameSize};
  --resume-heading-size: ${headingSize};
  --resume-company-size: ${companySize};
  --resume-job-size: ${jobSize};
  --resume-body-size: ${bodySize};
  --resume-small-size: ${smallSize};
  --resume-date-size: ${smallSize};
  --resume-skill-size: ${skillSize};
  --resume-line-height: ${descLh};
  --resume-body-weight: ${plan.bodyFontWeight};
  --resume-heading-weight: ${plan.headingFontWeight};
  --resume-company-weight: ${plan.companyFontWeight};
  --resume-job-weight: ${plan.titleFontWeight};
  --resume-meta-weight: ${plan.metaFontWeight};
  --resume-paragraph-gap: var(--dl-paragraph-spacing, 5px);
  --resume-bullet-gap: ${bulletGap};
  --resume-letter-spacing: 0.012em;
  --resume-ls-name: 0.02em;
  --resume-ls-heading: 0.08em;
  --resume-ls-job: 0.04em;
  --resume-word-spacing: 0.025em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Name — premium clamp hierarchy */
.resume-container[data-dl-density] .candidate-name,
.resume-container[data-dl-density] .candidate-name .name-first,
.resume-container[data-dl-density] .candidate-name .name-last {
  font-size: var(--resume-name-size) !important;
  font-weight: 700 !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  letter-spacing: var(--resume-ls-name, 0.02em) !important;
  line-height: 1.1 !important;
}

/* Header job title — secondary to name */
.resume-container[data-dl-density] .header-title {
  font-size: clamp(12px, 1.2vw, 15px) !important;
  font-weight: var(--resume-job-weight, 500) !important;
  letter-spacing: var(--resume-ls-job, 0.04em) !important;
  line-height: 1.35 !important;
  margin-top: 0.2em !important;
}

/* Section headings */
.resume-container[data-dl-density] section > h2,
.resume-container[data-dl-density] .section-title,
.resume-container[data-dl-density] [class*='section-title'],
.resume-container[data-dl-density] [class*='-section-head'] {
  font-size: var(--resume-heading-size) !important;
  font-weight: var(--resume-heading-weight, 700) !important;
  line-height: 1.2 !important;
  letter-spacing: var(--resume-ls-heading, 0.08em) !important;
  margin-top: ${headingGapAbove}px !important;
  margin-bottom: var(--dl-heading-gap) !important;
  padding-bottom: 0.2em !important;
}

/* Company / employer */
.resume-container[data-dl-density] .experience-header .company,
.resume-container[data-dl-density] .project-item .project-employer,
.resume-container[data-dl-density] .project-item .company {
  display: block !important;
  font-size: var(--resume-company-size) !important;
  font-weight: var(--resume-company-weight, 600) !important;
  line-height: 1.28 !important;
  letter-spacing: 0.015em !important;
}

/* Designation / degree / project title */
.resume-container[data-dl-density] .experience-header h3,
.resume-container[data-dl-density] .project-item > h3,
.resume-container[data-dl-density] .education-item h3,
.resume-container[data-dl-density] .education-item .degree {
  font-size: var(--resume-job-size) !important;
  font-weight: var(--resume-job-weight, 500) !important;
  line-height: 1.32 !important;
  letter-spacing: 0.01em !important;
  margin-bottom: 0.2em !important;
}

/* Dates — muted secondary */
.resume-container[data-dl-density] .experience-header .duration,
.resume-container[data-dl-density] .education-item .duration,
.resume-container[data-dl-density] .education-item .year,
.resume-container[data-dl-density] .project-item .duration,
.resume-container[data-dl-density] .certification-item .date,
.resume-container[data-dl-density] .certification-item .year {
  display: inline-block !important;
  font-size: var(--resume-small-size) !important;
  font-weight: var(--resume-meta-weight, 450) !important;
  line-height: 1.35 !important;
  letter-spacing: 0.02em !important;
  color: color-mix(in srgb, currentColor 66%, transparent) !important;
}

/* Body / summary / descriptions */
.resume-container[data-dl-density] .experience-item .description,
.resume-container[data-dl-density] .project-item .description {
  font-size: var(--resume-body-size) !important;
  font-weight: var(--resume-body-weight, 400) !important;
  line-height: var(--resume-line-height) !important;
  letter-spacing: var(--resume-letter-spacing, 0.012em) !important;
  word-spacing: var(--resume-word-spacing, 0.025em) !important;
  max-width: min(100%, calc(var(--dl-content-measure-ch, 76) * 1ch)) !important;
  overflow-wrap: break-word !important;
  hyphens: auto;
  -webkit-hyphens: auto;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.resume-container[data-dl-density] .summary-text,
.resume-container[data-dl-density] [class*='summary-text'],
.resume-container[data-dl-density] .professional-summary,
.resume-container[data-dl-density] .objective-text,
.resume-container[data-dl-density] .description:not(.experience-item .description):not(.project-item .description) {
  font-size: var(--resume-body-size) !important;
  font-weight: var(--resume-body-weight, 400) !important;
  line-height: var(--resume-line-height) !important;
  letter-spacing: var(--resume-letter-spacing, 0.012em) !important;
  word-spacing: var(--resume-word-spacing, 0.025em) !important;
  max-width: min(100%, calc(var(--dl-summary-max-ch, 68) * 1ch)) !important;
  overflow-wrap: break-word !important;
  hyphens: auto;
  -webkit-hyphens: auto;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.resume-container[data-dl-density] .experience-item .description[data-desc-volume='short'] {
  line-height: calc(var(--resume-line-height) * 1.04) !important;
}

.resume-container[data-dl-density] .experience-item .description[data-desc-volume='medium'] {
  line-height: var(--resume-line-height) !important;
}

.resume-container[data-dl-density] .experience-item .description[data-desc-volume='long'] {
  line-height: calc(var(--resume-line-height) * 1.02) !important;
}

.resume-container[data-dl-density] .experience-item .description[data-desc-volume='long'] li {
  margin-bottom: calc(var(--resume-bullet-gap, 0.5em) * 1.05) !important;
}

.resume-container[data-dl-density] .summary-text,
.resume-container[data-dl-density] [class*='summary-text'],
.resume-container[data-dl-density] .professional-summary,
.resume-container[data-dl-density] .objective-text {
  line-height: calc(var(--resume-line-height) * 1.03) !important;
  margin-bottom: calc(var(--dl-summary-spacing, 12px) * 0.45 + var(--resume-paragraph-gap)) !important;
}

.resume-container[data-dl-density] .experience-item .description p,
.resume-container[data-dl-density] .project-item .description p,
.resume-container[data-dl-density] .description p,
.resume-container[data-dl-density] .summary-text p,
.resume-container[data-dl-density] .professional-summary p {
  margin: 0 0 var(--resume-paragraph-gap) !important;
  line-height: inherit !important;
}

.resume-container[data-dl-density] .experience-item .description p:last-child,
.resume-container[data-dl-density] .project-item .description p:last-child,
.resume-container[data-dl-density] .description p:last-child {
  margin-bottom: 0 !important;
}

/* Bullets — breathable rhythm */
.resume-container[data-dl-density] .experience-item .description li,
.resume-container[data-dl-density] .experience-item .description ul li,
.resume-container[data-dl-density] .project-item li,
.resume-container[data-dl-density] .description li {
  font-size: inherit !important;
  font-weight: inherit !important;
  line-height: var(--resume-line-height) !important;
  letter-spacing: inherit !important;
  word-spacing: inherit !important;
  margin-bottom: var(--resume-bullet-gap, 0.42em) !important;
  padding-top: 0.08em !important;
  padding-bottom: 0.08em !important;
  orphans: 2;
  widows: 2;
}

.resume-container[data-dl-density] .experience-item .description li:last-child,
.resume-container[data-dl-density] .project-item li:last-child,
.resume-container[data-dl-density] .description li:last-child {
  margin-bottom: 0.12em !important;
}

.resume-container[data-dl-density='dense'] .experience-item .description,
.resume-container[data-dl-density='dense'] .project-item .description {
  letter-spacing: 0.006em !important;
  word-spacing: 0.015em !important;
}

.resume-container[data-dl-density='sparse'] .experience-item .description,
.resume-container[data-dl-density='sparse'] .summary-text {
  letter-spacing: 0.016em !important;
  word-spacing: 0.03em !important;
}

/* Experience structure */
.resume-container[data-dl-density] .experience-list {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--dl-exp-list-gap, var(--dl-block-gap)) !important;
}

.resume-container[data-dl-density] .experience-item {
  /* Never stretch experience cards into empty vertical space */
  flex: 0 0 auto !important;
  /* Only adjust vertical rhythm — preserve template horizontal card padding */
  padding-top: var(--dl-exp-card-padding, var(--dl-section-padding)) !important;
  padding-bottom: var(--dl-exp-card-padding, var(--dl-section-padding)) !important;
  margin-bottom: var(--dl-experience-spacing, var(--dl-block-gap)) !important;
  min-height: auto !important;
  max-height: none !important;
  height: auto !important;
}

.resume-container[data-dl-density] .experience-list > .experience-item:only-child,
.resume-container[data-dl-density][data-dl-exp-count='1'] .experience-item {
  padding-top: calc(var(--dl-exp-card-padding, 6px) * 1.2) !important;
  padding-bottom: calc(var(--dl-exp-card-padding, 6px) * 1.4) !important;
}

.resume-container[data-dl-density] .experience-header {
  margin-bottom: var(--dl-exp-header-gap, var(--dl-heading-gap)) !important;
}

.resume-container[data-dl-density] .experience-item .description {
  margin-top: var(--dl-exp-desc-padding, 8px) !important;
  padding-top: calc(var(--dl-exp-desc-padding, 8px) * 0.9) !important;
  border-top: 1px solid color-mix(in srgb, currentColor 13%, transparent) !important;
}

.resume-container[data-dl-density] .experience-desc--lead {
  margin-bottom: calc(var(--resume-paragraph-gap) * 0.85) !important;
  font-weight: var(--resume-body-weight, 400) !important;
}

.resume-container[data-dl-density] .experience-desc--grouped .experience-bullet-group {
  margin-bottom: calc(var(--resume-bullet-gap, 0.42em) * 1.1) !important;
}

.resume-container[data-dl-density] .experience-desc--grouped .experience-bullet-group:last-child {
  margin-bottom: 0 !important;
}

.resume-container[data-dl-density] .experience-item .description ul {
  margin: calc(var(--dl-exp-desc-padding, 8px) * 0.35) 0 0 !important;
  padding-left: 0 !important;
  list-style: none !important;
}

.resume-container[data-dl-density] .experience-item .description li,
.resume-container[data-dl-density] .experience-item .description ul li {
  position: relative !important;
  padding-left: var(--dl-bullet-indent, 16px) !important;
}

/* Projects */
.resume-container[data-dl-density] .project-item > h3 {
  font-weight: 600 !important;
}

.resume-container[data-dl-density] .project-item .technologies,
.resume-container[data-dl-density] .project-item .tech-stack,
.resume-container[data-dl-density] .project-item .project-tech {
  font-size: var(--resume-small-size) !important;
  font-weight: var(--resume-meta-weight, 450) !important;
  line-height: 1.4 !important;
  letter-spacing: 0.02em !important;
  color: color-mix(in srgb, currentColor 62%, transparent) !important;
  margin-top: 0.25em !important;
  margin-bottom: 0.4em !important;
}

.resume-container[data-dl-density] .project-item .description {
  margin-top: 0.4em !important;
}

/* Skills chips — typography only */
.resume-container[data-dl-density] .skill-tag,
.resume-container[data-dl-density] .psp-skill-name {
  font-size: var(--resume-skill-size) !important;
  font-weight: var(--resume-meta-weight, 450) !important;
  line-height: 1.35 !important;
  letter-spacing: 0.02em !important;
  padding-block: 0.22em !important;
  padding-inline: 0.5em !important;
}

/* Education */
.resume-container[data-dl-density] .education-item .institution {
  display: block !important;
  font-size: var(--resume-company-size) !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  letter-spacing: 0.01em !important;
}

.resume-container[data-dl-density] .education-item .degree,
.resume-container[data-dl-density] .education-item h3 {
  font-weight: var(--resume-meta-weight, 450) !important;
}

.resume-container[data-dl-density] .education-item .cgpa {
  font-size: var(--resume-small-size) !important;
  color: color-mix(in srgb, currentColor 70%, transparent) !important;
}

/* Certifications */
.resume-container[data-dl-density] .certification-item > h3,
.resume-container[data-dl-density] .certification-item .cert-title,
.resume-container[data-dl-density] .certification-item strong {
  font-size: var(--resume-company-size) !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  letter-spacing: 0.01em !important;
}

.resume-container[data-dl-density] .certification-item .issuer {
  display: block !important;
  font-size: var(--resume-job-size) !important;
  font-weight: var(--resume-meta-weight, 450) !important;
  line-height: 1.35 !important;
  color: color-mix(in srgb, currentColor 78%, transparent) !important;
  margin-top: 0.12em !important;
}

/* Languages */
.resume-container[data-dl-density] .language-item,
.resume-container[data-dl-density] .psp-language-item {
  font-size: var(--resume-body-size) !important;
  line-height: 1.4 !important;
  letter-spacing: 0.01em !important;
}

.resume-container[data-dl-density] .language-item .proficiency,
.resume-container[data-dl-density] .psp-language-item .proficiency,
.resume-container[data-dl-density] .language-item .level {
  font-size: var(--resume-small-size) !important;
  font-weight: var(--resume-meta-weight, 450) !important;
  color: color-mix(in srgb, currentColor 68%, transparent) !important;
}

/* Interests */
.resume-container[data-dl-density] .hobby-item,
.resume-container[data-dl-density] .hobby-item .hobby {
  font-size: var(--resume-small-size) !important;
  font-weight: var(--resume-meta-weight, 450) !important;
  line-height: 1.4 !important;
  letter-spacing: 0.02em !important;
  color: color-mix(in srgb, currentColor 75%, transparent) !important;
}

${summaryShortCss}

.resume-container[data-dl-density] .skills-list:not(:has(.psp-skill-item)),
.resume-container[data-dl-density] .skills-chips-wrap:not(:has(.psp-skill-item)),
.resume-container[data-dl-density] [class*='skills-grid']:not(:has(.psp-skill-item)),
.resume-container[data-dl-density] [class*='skills-list']:not(:has(.psp-skill-item)) {
  justify-items: stretch !important;
  align-content: start !important;
}

.resume-container[data-dl-density] .skills-list:not(:has(.psp-skill-item)) > .skill-tag,
.resume-container[data-dl-density] .skills-chips-wrap:not(:has(.psp-skill-item)) > .skill-tag {
  text-align: center !important;
  justify-self: stretch !important;
}

.resume-container[data-dl-sidebar-density='compact'] aside .education-item,
.resume-container[data-dl-sidebar-density='compact'] aside .certification-item,
.resume-container[data-dl-sidebar-density='compact'] aside .language-item,
.resume-container[data-dl-sidebar-density='compact'] .sidebar .education-item,
.resume-container[data-dl-sidebar-density='compact'] .sidebar .certification-item,
.resume-container[data-dl-sidebar-density='compact'] .sidebar .language-item {
  padding-top: calc(var(--dl-sidebar-card-padding, var(--dl-section-padding)) * 0.25) !important;
  padding-bottom: calc(var(--dl-sidebar-card-padding, var(--dl-section-padding)) * 0.35) !important;
}

.resume-container[data-dl-density] aside .education-item,
.resume-container[data-dl-density] aside .certification-item,
.resume-container[data-dl-density] aside .language-item,
.resume-container[data-dl-density] aside .psp-language-item,
.resume-container[data-dl-density] .sidebar .education-item,
.resume-container[data-dl-density] .sidebar .certification-item,
.resume-container[data-dl-density] .sidebar .language-item,
.resume-container[data-dl-density] .sidebar .psp-language-item {
  padding-top: calc(var(--dl-sidebar-card-padding, var(--dl-section-padding)) * 0.35) !important;
  padding-bottom: calc(var(--dl-sidebar-card-padding, var(--dl-section-padding)) * 0.55) !important;
  flex: 0 1 auto !important;
  min-height: auto !important;
}

.resume-container[data-dl-density] section,
.resume-container[data-dl-density] .content-section,
.resume-container[data-dl-density] .sidebar-section {
  /* Content-sized sections — never flex-grow into blank page regions */
  flex: 0 0 auto !important;
  min-height: auto !important;
  max-height: none !important;
}

/* Sidebar item rhythm (skills / contact / certs / languages) — gap only, never width */
.resume-container[data-dl-density] aside .skills-list,
.resume-container[data-dl-density] [class*='-sidebar'] .skills-list,
.resume-container[data-dl-density] aside .contact-list,
.resume-container[data-dl-density] [class*='-sidebar'] .contact-list,
.resume-container[data-dl-density] aside .languages-list,
.resume-container[data-dl-density] [class*='-sidebar'] .languages-list,
.resume-container[data-dl-density] aside .certifications-list,
.resume-container[data-dl-density] [class*='-sidebar'] .certifications-list,
.resume-container[data-dl-density] aside .hobbies-list,
.resume-container[data-dl-density] [class*='-sidebar'] .hobbies-list {
  gap: var(--dl-skill-gap, calc(var(--dl-sidebar-gap, 12px) * 0.55)) !important;
}

/* Rhythm: relaxed — paragraph breathe into whitespace (no card stretch) */
.resume-container[data-dl-rhythm='relaxed'] .summary-text,
.resume-container[data-dl-rhythm='relaxed'] [class*='summary-text'],
.resume-container[data-dl-rhythm='relaxed'] .professional-summary,
.resume-container[data-dl-page-underfill='true'] .summary-text,
.resume-container[data-dl-page-underfill='true'] [class*='summary-text'],
.resume-container[data-dl-page-underfill='true'] .professional-summary {
  line-height: calc(var(--resume-line-height, 1.62) * 1.08) !important;
  max-width: min(100%, calc(var(--dl-summary-max-ch, 72) * 1ch)) !important;
  max-height: none !important;
  height: auto !important;
  margin-bottom: calc(var(--dl-summary-spacing, 12px) * 0.65 + var(--resume-paragraph-gap, 5px)) !important;
}

.resume-container[data-dl-rhythm='relaxed'] .experience-item .description,
.resume-container[data-dl-rhythm='relaxed'] .project-item .description,
.resume-container[data-dl-page-underfill='true'] .experience-item .description {
  line-height: calc(var(--resume-line-height, 1.62) * 1.06) !important;
  max-width: min(100%, calc(var(--dl-content-measure-ch, 80) * 1ch)) !important;
  max-height: none !important;
}

.resume-container[data-dl-rhythm='relaxed'] .experience-item .description li,
.resume-container[data-dl-page-underfill='true'] .experience-item .description li {
  margin-bottom: calc(var(--resume-bullet-gap, 0.42em) * 1.08) !important;
}

/* Rhythm: compact — tighten internal padding only */
.resume-container[data-dl-rhythm='compact'] aside .skill-tag,
.resume-container[data-dl-rhythm='compact'] [class*='-sidebar'] .skill-tag,
.resume-container[data-dl-rhythm='compact'] aside .psp-skill-name {
  padding-block: 0.16em !important;
}

@media (max-width: 640px) {
  .resume-container[data-dl-density] {
    --resume-ls-heading: 0.06em;
    --resume-word-spacing: 0.015em;
  }
  .resume-container[data-dl-density] .summary-text,
  .resume-container[data-dl-density] .professional-summary,
  .resume-container[data-dl-density] .experience-item .description {
    max-width: 100% !important;
  }
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
  root.style.setProperty('--dl-skill-gap', `${plan.skillGap}px`);
  root.style.setProperty('--dl-fs-company', String(plan.companyFontScale));
  root.style.setProperty('--dl-fs-title', String(plan.titleFontScale));
  root.style.setProperty('--dl-fs-meta', String(plan.metaFontScale));
  root.style.setProperty('--dl-fs-body', String(plan.bodyFontScale));
  root.style.setProperty('--dl-fs-heading', String(plan.headingFontScale));
  root.style.setProperty('--dl-fs-skill', String(plan.skillFontScale));
  root.style.setProperty(
    '--dl-lh-desc',
    String(Math.round(1.62 * plan.descLineHeightMul * 1000) / 1000)
  );
  root.style.setProperty('--dl-summary-max-ch', String(plan.summaryMaxCh));
  root.style.setProperty('--dl-content-measure-ch', String(plan.contentMeasureCh));
  root.style.setProperty('--resume-line-height', `var(--dl-lh-desc)`);
  root.style.setProperty('--resume-paragraph-gap', `${plan.paragraphSpacing}px`);
  root.style.setProperty('--resume-bullet-gap', `${plan.bulletGap}em`);
  root.style.setProperty('--resume-letter-spacing', '0.012em');
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
  root.setAttribute('data-dl-density', plan.typographyDensity);
  root.setAttribute('data-dl-rhythm', plan.layoutRhythm);
  const sidebarCompact =
    plan.sidebarCardPadding < plan.sectionPadding * 0.85 ? 'compact' : 'normal';
  root.setAttribute('data-dl-sidebar-density', sidebarCompact);
  root.setAttribute(
    'data-dl-page-underfill',
    plan.pageFillRatio < 0.88 ? 'true' : 'false'
  );
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
  --dl-skill-gap: ${plan.skillGap}px;
  --dl-fs-company: ${plan.companyFontScale};
  --dl-fs-title: ${plan.titleFontScale};
  --dl-fs-meta: ${plan.metaFontScale};
  --dl-fs-body: ${plan.bodyFontScale};
  --dl-fs-heading: ${plan.headingFontScale};
  --dl-fs-skill: ${plan.skillFontScale};
  --dl-lh-desc: ${(Math.round(1.62 * plan.descLineHeightMul * 1000) / 1000).toFixed(3)};
  --dl-summary-max-ch: ${plan.summaryMaxCh};
  --dl-content-measure-ch: ${plan.contentMeasureCh};
  --resume-line-height: var(--dl-lh-desc);
  --resume-paragraph-gap: ${plan.paragraphSpacing}px;
  --resume-bullet-gap: ${plan.bulletGap}em;
  --resume-letter-spacing: 0.012em;
  --resume-body-weight: ${plan.bodyFontWeight};
  --resume-heading-weight: ${plan.headingFontWeight};
  --resume-company-weight: ${plan.companyFontWeight};
  --resume-job-weight: ${plan.titleFontWeight};
  --resume-meta-weight: ${plan.metaFontWeight};
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

/* Column proportions stay on the template. Never rewrite grid tracks here —
   invalid calc(fr) and reversed main|aside order previously either no-op'd or
   could crush aside-first layouts. Spacing vars (--dl-sidebar-gap, etc.) adapt. */

.resume-container [class*='-layout'] > main,
.resume-container [class*='-layout'] > [class*='-main'],
.resume-container .main-content,
.resume-container .content-column {
  flex: var(--dl-main-flex, 1) 1 var(--dl-main-basis, auto) !important;
  flex-grow: var(--dl-main-flex, 1) !important;
  max-width: none !important;
  min-width: 0 !important;
}

.resume-container [class*='-layout'] > aside,
.resume-container [class*='-layout'] > [class*='-sidebar'],
.resume-container .sidebar,
.resume-container .side-column {
  flex: 0 0 var(--dl-sidebar-basis, 30%) !important;
  flex-grow: 0 !important;
  flex-shrink: 0 !important;
  max-width: var(--dl-sidebar-basis, 30%) !important;
  min-width: 0 !important;
}

.resume-container aside,
.resume-container .sidebar,
.resume-container [class*='-sidebar']:not([class*='-layout']) {
  display: flex !important;
  flex-direction: column !important;
  gap: var(--dl-sidebar-gap, var(--dl-section-gap)) !important;
  justify-content: flex-start !important;
  align-items: stretch !important;
}

/* Grid children must fill their tracks — never shrink-wrap the column */
.resume-container [class*='-body'] > aside,
.resume-container [class*='-body'] > [class*='-sidebar'],
.resume-container [class*='-body'] > main,
.resume-container [class*='-body'] > [class*='-main'] {
  justify-self: stretch !important;
  min-width: 0 !important;
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
  line-height: var(--resume-line-height, var(--dl-lh-desc, var(--dl-line-height))) !important;
  margin-bottom: var(--resume-paragraph-gap, var(--dl-paragraph-spacing)) !important;
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
  line-height: var(--resume-line-height, var(--dl-lh-desc, var(--dl-line-height))) !important;
}

.resume-container .experience-item .description,
.resume-container .project-item .description,
.resume-container .summary-text,
.resume-container [class*='summary-text'],
.resume-container .professional-summary {
  line-height: var(--resume-line-height, var(--dl-lh-desc, var(--dl-line-height))) !important;
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
    var mf=m.sidebarHeight>0?1.65:1, sf=m.sidebarHeight>0?1:0;
    /* Column % locked to template CSS vars already injected — spacing only adapts. */
    var rootEl=document.querySelector('.resume-container');
    var sbPct=parseFloat(rootEl?getComputedStyle(rootEl).getPropertyValue('--dl-sidebar-basis'):'')||32;
    var mnPct=parseFloat(rootEl?getComputedStyle(rootEl).getPropertyValue('--dl-main-basis'):'')||68;
    var sbMax=sbPct;
    var skillTagsEarly=document.querySelectorAll('.skill-tag,.psp-skill-item').length;
    var denseSidebar=skillTagsEarly>=14;
    if(m.sidebarUnderfilled&&denseSidebar){
      sgap=Math.max(0.8,sgap*0.72);
    } else if(m.sidebarUnderfilled){
      if(m.columnBalanced){mf=1.72;sf=0.95;sgap*=1.08;}
      else if(m.experienceDominant){mf=1.58;sf=1.12;sgap*=1.18;}
      else{mf=1.65;sf=1.05;sgap*=1.1;}
    }
    else if(m.columnImbalance>40&&m.sidebarHeight>0){
      var t=Math.max(m.sidebarHeight,m.mainHeight), s=Math.min(m.sidebarHeight,m.mainHeight)||1;
      var r=Math.min(0.45,(t-s)/t);
      if(m.sidebarHeight>m.mainHeight){mf=1.65+r*1.1;sf=1-r*0.35;}else{sf=1+r*0.55;mf=1.65-r*0.4;}
    }
    if(!m.columnBalanced&&m.mainHeight>m.sidebarHeight*1.08){
      var tr=Math.min(96,(m.mainHeight-m.sidebarHeight)*0.14);
      if(m.sidebarUnderfilled&&!denseSidebar){
        ['education','languages','certifications','skills','summary'].forEach(function(k){
          if(m.sidebarSections.some(function(s){return s.kind===k;}))
            extras[k]=Math.round((extras[k]||0)+tr*0.28);
        });
        extras.experience=Math.round((extras.experience||0)-tr*0.08);
      } else if(!m.sidebarUnderfilled) {
        extras.experience=(extras.experience||0)+Math.round(tr*0.62);
        extras.summary=(extras.summary||0)+Math.round(tr*0.18);
        ['education','languages','certifications','skills'].forEach(function(k){
          if(m.sidebarSections.some(function(s){return s.kind===k;}))
            extras[k]=Math.round((extras[k]||0)*0.55);
        });
      }
    }
    var invMul=1;
    if(skillTagsEarly<=2)invMul=1.2;
    else if(skillTagsEarly<=4)invMul=1.14;
    else if(skillTagsEarly<=8)invMul=1;
    else if(skillTagsEarly<=12)invMul=0.92;
    else if(skillTagsEarly<=18)invMul=0.86;
    else invMul=0.8;
    sgap=Math.max(0.8,Math.min(1.2,sgap*invMul));
    return {sectionGap:14*sg,blockGap:10*bg,fontScale:Math.min(1.12,Math.max(0.92,fg)),
      lineHeight:1.45*lh,mainFlex:mf,sidebarFlex:sf,pad:6*pad,pg:4*pg,cg:12*cg,
      sidebarGap:14*sg*sgap,sidebarGapCompact:14*Math.min(invMul,0.95),
      mnPct:mnPct,sbPct:sbPct,sbMax:sbMax,extras:extras,sidebarUnder:m.sidebarUnderfilled,
      denseSidebar:denseSidebar,invMul:invMul};
  }
  function apply(){
    var root=document.querySelector('.resume-container'); if(!root)return;
    var m=measure();
    m.columnBalanced=root.getAttribute('data-column-balanced')==='true';
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
    var sbCard=6*p.pad*(p.sidebarUnder?(m.experienceDominant?1.12:1.06):(m.mainHeight>m.sidebarHeight*1.1?0.88:1));
    root.style.setProperty('--dl-section-gap',p.sectionGap+'px');
    root.style.setProperty('--dl-block-gap',p.blockGap+'px');
    root.style.setProperty('--dl-font-scale',String(p.fontScale));
    root.style.setProperty('--dl-line-height',String(p.lineHeight));
    root.style.setProperty('--dl-main-flex',String(p.mainFlex));
    root.style.setProperty('--dl-sidebar-flex',String(p.sidebarFlex));
    root.style.setProperty('--dl-section-padding',p.pad+'px');
    root.style.setProperty('--dl-paragraph-spacing',p.pg+'px');
    root.style.setProperty('--dl-column-gap',p.cg+'px');
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
    /* Adaptive typography hierarchy (mirrors resolveAdaptiveTypography) */
    var dens='balanced';
    var rhythm='normal';
    if(expCount<=2&&fill<0.78){dens='sparse';rhythm='relaxed';}
    else if(expCount>=5||fill>0.98||skillTags>=18){dens='dense';rhythm='compact';}
    else if(fill<0.85){rhythm='relaxed';}
    else if(fill>0.95){rhythm='compact';
    if(skillTags>=20){rhythm='compact';if(dens==='balanced')dens='dense';}
    else if(skillTags<=4&&fill<0.85){rhythm='relaxed';}
    var sidebarGapPx=p.sidebarGap;
    if(rhythm==='compact'){
      sidebarGapPx=typeof p.sidebarGapCompact==='number'?p.sidebarGapCompact:14*Math.min(p.invMul||0.95,0.95);
    } else if(p.denseSidebar){
      sidebarGapPx=14*Math.max(0.8,Math.min(1,(p.invMul||0.9)*0.9));
    }
    root.style.setProperty('--dl-sidebar-gap',sidebarGapPx+'px');
    var fsCompany=1.15, fsTitle=1.02, fsMeta=0.84, fsBody=0.98, fsHead=1.1, fsSkill=0.9, lhDesc=1.12, maxCh=68;
    if(dens==='sparse'||rhythm==='relaxed'){fsCompany=1.18;fsTitle=1.05;fsBody=1.02;fsHead=1.12;lhDesc=1.16;maxCh=72;fsSkill=0.94;fsMeta=0.86;}
    else if(dens==='dense'||rhythm==='compact'){
      var d=Math.min(1,Math.max(0,(expCount-3)/7));
      fsCompany=1.13-d*0.02;fsTitle=1.0-d*0.04;fsMeta=0.82-d*0.04;fsBody=0.95-d*0.08;fsHead=1.06-d*0.04;fsSkill=0.86-d*0.04;lhDesc=1.12+d*0.08;maxCh=62-Math.round(d*4);
    } else if(expCount>=3){
      var mid=Math.min(1,Math.max(0,(expCount-2)/4));
      fsBody=0.98-mid*0.05;fsTitle=1.02-mid*0.03;fsMeta=0.84-mid*0.02;lhDesc=1.12+mid*0.05;
    }
    if(skillTags>=16)fsSkill=Math.min(fsSkill,0.84);
    var skillGap=Math.max(4,Math.min(12,Math.round(sidebarGapPx*0.55)));
    root.style.setProperty('--dl-skill-gap',skillGap+'px');
    root.style.setProperty('--dl-fs-company',String(fsCompany));
    root.style.setProperty('--dl-fs-title',String(fsTitle));
    root.style.setProperty('--dl-fs-meta',String(fsMeta));
    root.style.setProperty('--dl-fs-body',String(fsBody));
    root.style.setProperty('--dl-fs-heading',String(fsHead));
    root.style.setProperty('--dl-fs-skill',String(fsSkill));
    root.style.setProperty('--dl-lh-desc',String(1.62*lhDesc));
    root.style.setProperty('--dl-summary-max-ch',String(maxCh));
    root.style.setProperty('--resume-line-height','var(--dl-lh-desc)');
    root.style.setProperty('--resume-letter-spacing','0.012em');
    root.style.setProperty('--resume-bullet-gap',(rhythm==='compact'?0.36:rhythm==='relaxed'?0.48:0.42)+'em');
    root.style.setProperty('--dl-bullet-gap',(rhythm==='compact'?0.36:rhythm==='relaxed'?0.48:0.42)+'em');
    Object.keys(p.extras).forEach(function(k){root.style.setProperty('--dl-extra-'+k,Math.min(16,p.extras[k]||0)+'px');});
    root.setAttribute('data-dl-refined','true');
    root.setAttribute('data-dl-fill',String(Math.round(measure().pageFillRatio*100)));
    root.setAttribute('data-dl-exp-count',String(expCount));
    var sumEl=document.querySelector('.summary-text,.professional-summary,[class*="summary-text"]');
    var sumShort=false;
    if(sumEl){var w=(sumEl.textContent||'').trim().split(/\\s+/).filter(Boolean).length;sumShort=w>0&&w<45;}
    root.setAttribute('data-dl-summary',sumShort?'short':'normal');
    root.setAttribute('data-dl-density',dens);
    root.setAttribute('data-dl-rhythm',rhythm);
    root.setAttribute('data-dl-sidebar-density',p.sidebarUnder?'normal':(sbCard<p.pad*0.85?'compact':'normal'));
    root.setAttribute('data-dl-page-underfill', fill<0.88?'true':'false');
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
 * Column section relocation runs earlier in injectResumeData; this stage applies density CSS.
 */
export function injectDynamicLayoutIntoHtml(
  html: string,
  formData: Record<string, unknown>,
  options?: ComputeDynamicLayoutOptions & { htmlTemplate?: string }
): string {
  const templateCapacity = computeTemplateLayoutCapacity(
    options?.htmlTemplate ?? '',
    options?.templateId
  );
  const metrics = synthesizeMetricsFromRenderedHtml(
    html,
    templateCapacity.usablePageHeightPx
  );
  let plan = computeDynamicLayoutPlanFromMetrics(metrics, formData, {
    ...options,
    renderedHtml: html,
  });

  const auditRows = auditRenderedSections(formData, html);
  for (const row of auditRows) {
    if (!row.missing) continue;
    const kind = row.section as LayoutSectionKind;
    if (
      kind === 'projects' ||
      kind === 'achievements' ||
      kind === 'skills' ||
      kind === 'certifications' ||
      kind === 'languages'
    ) {
      plan.sectionExtras[kind] = (plan.sectionExtras[kind] ?? 0) + 6;
    }
  }

  const preservePremiumTypography = isPremiumTemplate(options?.templateId);
  const isPdf = options?.mode === 'pdf';
  const block =
    getDynamicLayoutStyleBlock(plan, { preservePremiumTypography }) +
    (isPdf ? '' : getDomAwareLayoutRefinementScript());
  let result = appendStyleBlockToHtml(html, block);
  result = result.replace(
    /(<div[^>]*class="[^"]*\bresume-container\b[^"]*"[^>]*)(>)/i,
    `$1 data-dl-exp-count="${plan.experienceCount}" data-dl-summary="${plan.summaryIsShort ? 'short' : 'normal'}" data-dl-sections="${plan.visibleSectionCount}" data-dl-fill="${Math.round(plan.pageFillRatio * 100)}" data-dl-density="${plan.typographyDensity}" data-dl-rhythm="${plan.layoutRhythm}" data-dl-sidebar-density="${plan.sidebarCardPadding < plan.sectionPadding * 0.85 ? 'compact' : 'normal'}" data-dl-page-underfill="${plan.pageFillRatio < 0.88 ? 'true' : 'false'}"$2`
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
