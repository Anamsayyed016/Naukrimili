/**
 * Dynamic Sidebar Balancing Engine
 *
 * For long two-column resumes where main content is much taller than the sidebar,
 * relocates complete low-priority sections into the sidebar to reduce blank space.
 *
 * Never moves: Contact, Skills, Languages, Experience, Education, Summary.
 * May move: Projects, Certifications, Achievements, Interests, References, Extended.
 *
 * Does not change column widths, fonts, colors, or section internals.
 */

import { A4_PAGE_HEIGHT_PX } from '@/lib/resume-builder/dynamic-layout-engine';
import { estimateRenderableSectionHeight } from '@/lib/resume-builder/section-height-estimator';
import {
  canRelocateSection,
  resolveTemplateLayoutMetadata,
  sectionMovePriority,
  type TemplateLayoutMetadata,
} from '@/lib/resume-builder/template-layout-metadata';

export type ColumnSectionKind =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'interests'
  | 'references'
  | 'contact'
  | 'extended'
  | 'other';

/** Low-priority sections that may relocate into the sidebar. */
export const FLEXIBLE_COLUMN_SECTIONS: ReadonlySet<ColumnSectionKind> = new Set([
  'projects',
  'certifications',
  'achievements',
  'interests',
  'references',
  'extended',
]);

/** Core anchors — must never relocate. */
export const FIXED_COLUMN_SECTIONS: ReadonlySet<ColumnSectionKind> = new Set([
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'contact',
]);

/** Empty space below sidebar as a fraction of page height before balancing runs. */
const DEFAULT_EMPTY_SPACE_RATIO = 0.18;

/** If sidebar already fills this share of main height, keep original layout. */
const DEFAULT_SIDEBAR_ADEQUATE_RATIO = 0.78;

const MAX_BALANCE_ITERATIONS = 8;
const DEFAULT_MIN_GAP_PX = 80;
const DEFAULT_MAX_MOVES_PER_PASS = 3;
const OVERSHOOT_RATIO = 1.35;

/** Preferred move order (lower = move earlier). */
const MOVE_ORDER: Record<string, number> = {
  projects: 1,
  certifications: 2,
  achievements: 3,
  interests: 4,
  references: 5,
  extended: 6,
};

export interface ColumnBalanceOptions {
  /** Fraction of page height of empty sidebar space that triggers balancing (default 0.18). */
  emptySpaceRatio?: number;
  /** Sidebar/main height ratio above which balancing is skipped (default 0.78). */
  sidebarAdequateRatio?: number;
  /** Absolute min gap (px) between main and sidebar before moving (default 80). */
  minGapPx?: number;
  /** Max flexible sections to move per iteration (default 3). */
  maxMoves?: number;
  maxIterations?: number;
  pageHeightPx?: number;
  htmlTemplate?: string;
  templateId?: string;
  /** @deprecated Prefer emptySpaceRatio — kept for older callers. */
  imbalanceRatio?: number;
}

export interface ColumnBalanceResult {
  html: string;
  moved: Array<{ kind: ColumnSectionKind; from: 'main' | 'sidebar'; to: 'main' | 'sidebar' }>;
  balanced: boolean;
  mainHeight: number;
  sidebarHeight: number;
  emptySpacePx: number;
  iterations: number;
}

export function classifyColumnSectionKind(block: string): ColumnSectionKind {
  if (/\bexperience-item\b/i.test(block)) return 'experience';
  if (/\bsummary-text\b|professional-summary\b|objective-text\b/i.test(block)) return 'summary';
  if (/\beducation-item\b/i.test(block)) return 'education';
  if (/\bskill-tag\b|psp-skill-item\b/i.test(block)) return 'skills';
  if (/\bproject-item\b/i.test(block)) return 'projects';
  if (/\bcertification-item\b/i.test(block)) return 'certifications';
  if (/\blanguage-item\b|psp-language-item\b/i.test(block)) return 'languages';
  if (/\bachievement-item\b/i.test(block)) return 'achievements';
  if (/\bhobby-item\b/i.test(block)) return 'interests';
  if (/\breference-item\b|references-list\b/i.test(block)) return 'references';
  if (/\bcontact-list\b|ese-contact-list\b/i.test(block)) return 'contact';
  if (/\bextended-section\b/i.test(block)) return 'extended';
  if (/projects?/i.test(block) && /section-title|heading/i.test(block)) return 'projects';
  if (/achievements?/i.test(block) && /section-title|heading/i.test(block)) return 'achievements';
  if (/interests?|hobbies/i.test(block) && /section-title|heading/i.test(block)) return 'interests';
  if (/references?/i.test(block) && /section-title|heading/i.test(block)) return 'references';
  if (/certifications?|certificates?/i.test(block) && /section-title|heading/i.test(block)) {
    return 'certifications';
  }
  if (/languages?/i.test(block) && /section-title|heading/i.test(block)) return 'languages';
  return 'other';
}

export function estimateColumnBlockHeight(html: string): number {
  return estimateRenderableSectionHeight(html);
}

export function detectTwoColumnLayout(html: string): boolean {
  const hasAside = /<aside[\s>]/i.test(html);
  const hasSidebarClass = /class="[^"]*\bsidebar\b[^"]*"/i.test(html);
  const hasMain = /<main[\s>]/i.test(html);
  return (hasAside || hasSidebarClass) && hasMain;
}

interface ColumnSlice {
  fullMatch: string;
  inner: string;
  openTag: string;
  closeTag: string;
}

function extractSidebarSlice(html: string): ColumnSlice | null {
  const aside = html.match(/(<aside\b[^>]*>)([\s\S]*?)(<\/aside>)/i);
  if (aside) {
    return { fullMatch: aside[0], openTag: aside[1], inner: aside[2], closeTag: aside[3] };
  }
  const sidebar = html.match(
    /(<div\b[^>]*class="[^"]*\bsidebar\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i
  );
  if (sidebar) {
    return {
      fullMatch: sidebar[0],
      openTag: sidebar[1],
      inner: sidebar[2],
      closeTag: sidebar[3],
    };
  }
  return null;
}

function extractMainSlice(html: string): ColumnSlice | null {
  const main = html.match(/(<main\b[^>]*>)([\s\S]*?)(<\/main>)/i);
  if (main) {
    return { fullMatch: main[0], openTag: main[1], inner: main[2], closeTag: main[3] };
  }
  const mainContent = html.match(
    /(<div\b[^>]*class="[^"]*\bmain-content\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i
  );
  if (mainContent) {
    return {
      fullMatch: mainContent[0],
      openTag: mainContent[1],
      inner: mainContent[2],
      closeTag: mainContent[3],
    };
  }
  return null;
}

interface LocatedSection {
  kind: ColumnSectionKind;
  html: string;
  height: number;
  column: 'main' | 'sidebar';
}

function collectSectionsInColumn(
  columnHtml: string,
  column: 'main' | 'sidebar'
): LocatedSection[] {
  const sections: LocatedSection[] = [];
  const re = /<section\b[^>]*>[\s\S]*?<\/section>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(columnHtml)) !== null) {
    const block = match[0];
    const kind = classifyColumnSectionKind(block);
    if (kind === 'other' || kind === 'contact') continue;
    sections.push({
      kind,
      html: block,
      height: estimateColumnBlockHeight(block),
      column,
    });
  }
  return sections;
}

export function resolveSidebarAllowedFlexibleSections(
  htmlTemplate: string,
  templateId?: string
): Set<ColumnSectionKind> {
  const metadata = resolveTemplateLayoutMetadata({ htmlTemplate, templateId });
  const allowed = new Set<ColumnSectionKind>();
  for (const kind of metadata.movableSections) {
    if (FLEXIBLE_COLUMN_SECTIONS.has(kind) && !FIXED_COLUMN_SECTIONS.has(kind)) {
      allowed.add(kind);
    }
  }
  // Always allow known flexible kinds when the template has a sidebar and placeholders.
  if (allowed.size === 0 && detectTwoColumnLayout(htmlTemplate || '')) {
    for (const kind of FLEXIBLE_COLUMN_SECTIONS) {
      allowed.add(kind);
    }
  }
  return allowed;
}

function moveImprovesBalance(
  mainHeight: number,
  sidebarHeight: number,
  projectedMain: number,
  projectedSidebar: number
): boolean {
  const beforeGap = Math.abs(mainHeight - sidebarHeight);
  const afterGap = Math.abs(projectedMain - projectedSidebar);
  return afterGap + 1e-6 < beforeGap;
}

/** True when main is tall enough and sidebar has meaningful empty space below it. */
function shouldFillSidebar(
  mainHeight: number,
  sidebarHeight: number,
  pageHeight: number,
  emptySpaceRatio: number,
  sidebarAdequateRatio: number,
  minGapPx: number
): boolean {
  if (mainHeight <= 0) return false;
  if (sidebarHeight / mainHeight >= sidebarAdequateRatio) return false;

  const emptyBelowSidebar = Math.max(0, mainHeight - sidebarHeight);
  if (emptyBelowSidebar < minGapPx) return false;
  if (emptyBelowSidebar < pageHeight * emptySpaceRatio) return false;

  return true;
}

function replaceColumnInner(html: string, slice: ColumnSlice, newInner: string): string {
  const rebuilt = `${slice.openTag}${newInner}${slice.closeTag}`;
  return html.replace(slice.fullMatch, rebuilt);
}

function removeFirstOccurrence(haystack: string, needle: string): string {
  const index = haystack.indexOf(needle);
  if (index === -1) return haystack;
  return haystack.slice(0, index) + haystack.slice(index + needle.length);
}

function sortFlexibleCandidates(
  sections: LocatedSection[],
  metadata: TemplateLayoutMetadata
): LocatedSection[] {
  return [...sections].sort((a, b) => {
    const orderA = MOVE_ORDER[a.kind] ?? 50;
    const orderB = MOVE_ORDER[b.kind] ?? 50;
    if (orderA !== orderB) return orderA - orderB;
    const priorityDiff =
      sectionMovePriority(a.kind, metadata) - sectionMovePriority(b.kind, metadata);
    if (priorityDiff !== 0) return priorityDiff;
    return b.height - a.height;
  });
}

function markMovedSection(html: string, kind: ColumnSectionKind): string {
  if (/\bdata-column-moved=/i.test(html)) return html;
  return html.replace(/<section\b/i, `<section data-column-moved="${kind}"`);
}

interface BalancePassResult {
  mainInner: string;
  sidebarInner: string;
  moved: ColumnBalanceResult['moved'];
  changed: boolean;
}

function balancePass(
  mainInner: string,
  sidebarInner: string,
  allowedFlexible: Set<ColumnSectionKind>,
  metadata: TemplateLayoutMetadata,
  options: {
    emptySpaceRatio: number;
    sidebarAdequateRatio: number;
    minGapPx: number;
    maxMoves: number;
    pageHeightPx: number;
    htmlTemplate?: string;
  }
): BalancePassResult {
  const moved: ColumnBalanceResult['moved'] = [];
  let mainHeight = estimateColumnBlockHeight(mainInner);
  let sidebarHeight = estimateColumnBlockHeight(sidebarInner);
  const htmlTemplate = options.htmlTemplate ?? '';

  if (
    !shouldFillSidebar(
      mainHeight,
      sidebarHeight,
      options.pageHeightPx,
      options.emptySpaceRatio,
      options.sidebarAdequateRatio,
      options.minGapPx
    )
  ) {
    return { mainInner, sidebarInner, moved, changed: false };
  }

  const sidebarKinds = new Set(
    collectSectionsInColumn(sidebarInner, 'sidebar').map((section) => section.kind)
  );

  const candidates = sortFlexibleCandidates(
    collectSectionsInColumn(mainInner, 'main').filter(
      (section) =>
        FLEXIBLE_COLUMN_SECTIONS.has(section.kind) &&
        !FIXED_COLUMN_SECTIONS.has(section.kind) &&
        allowedFlexible.has(section.kind) &&
        canRelocateSection(section.kind, metadata) &&
        !sidebarKinds.has(section.kind)
    ),
    metadata
  );

  let moves = 0;
  for (const candidate of candidates) {
    if (moves >= options.maxMoves) break;
    if (
      !shouldFillSidebar(
        mainHeight,
        sidebarHeight,
        options.pageHeightPx,
        options.emptySpaceRatio,
        options.sidebarAdequateRatio,
        options.minGapPx
      )
    ) {
      break;
    }
    if (sidebarKinds.has(candidate.kind)) continue;
    if (!mainInner.includes(candidate.html)) continue;

    const simulatedMain = removeFirstOccurrence(mainInner, candidate.html);
    const simulatedSidebar = `${sidebarInner}\n${markMovedSection(candidate.html, candidate.kind)}\n`;
    const projectedMain = estimateColumnBlockHeight(simulatedMain);
    const projectedSidebar = estimateColumnBlockHeight(simulatedSidebar);

    if (!moveImprovesBalance(mainHeight, sidebarHeight, projectedMain, projectedSidebar)) {
      continue;
    }
    // Avoid overshooting: sidebar should not become dramatically taller than main.
    if (projectedSidebar > projectedMain * OVERSHOOT_RATIO && candidate.height > options.minGapPx) {
      continue;
    }

    mainInner = simulatedMain;
    sidebarInner = simulatedSidebar;
    sidebarKinds.add(candidate.kind);
    moved.push({ kind: candidate.kind, from: 'main', to: 'sidebar' });
    moves += 1;
    mainHeight = projectedMain;
    sidebarHeight = projectedSidebar;
  }

  return { mainInner, sidebarInner, moved, changed: moved.length > 0 };
}

function buildSidebarBalanceCss(): string {
  return `
<style data-injected="sidebar-balance">
.resume-container[data-column-balanced='true'] aside section,
.resume-container[data-column-balanced='true'] .sidebar section,
.resume-container[data-column-balanced='true'] aside .sidebar-section,
.resume-container[data-column-balanced='true'] [class*='sidebar'] section {
  margin-bottom: 14px !important;
}
.resume-container[data-column-balanced='true'] aside section:last-child,
.resume-container[data-column-balanced='true'] .sidebar section:last-child {
  margin-bottom: 0 !important;
}
.resume-container[data-column-balanced='true'] section[data-column-moved] {
  break-inside: avoid;
  page-break-inside: avoid;
}
</style>`.trim();
}

function appendStyleBlock(html: string, styleBlock: string): string {
  if (!styleBlock) return html;
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${styleBlock}</body>`);
  if (/<\/html>/i.test(html)) return html.replace(/<\/html>/i, `${styleBlock}</html>`);
  return html + styleBlock;
}

/**
 * Balance two-column resumes by moving complete low-priority sections into the sidebar
 * when empty space below the sidebar exceeds the configured threshold.
 */
export function balanceTwoColumnLayout(
  renderedHtml: string,
  options?: ColumnBalanceOptions
): ColumnBalanceResult {
  const empty: ColumnBalanceResult = {
    html: renderedHtml,
    moved: [],
    balanced: false,
    mainHeight: 0,
    sidebarHeight: 0,
    emptySpacePx: 0,
    iterations: 0,
  };

  if (!renderedHtml || /data-column-balanced=["']true["']/i.test(renderedHtml)) {
    return empty;
  }

  if (!detectTwoColumnLayout(renderedHtml)) {
    return empty;
  }

  const emptySpaceRatio = options?.emptySpaceRatio ?? DEFAULT_EMPTY_SPACE_RATIO;
  const sidebarAdequateRatio =
    options?.sidebarAdequateRatio ?? DEFAULT_SIDEBAR_ADEQUATE_RATIO;
  const minGapPx = options?.minGapPx ?? DEFAULT_MIN_GAP_PX;
  const maxMoves = options?.maxMoves ?? DEFAULT_MAX_MOVES_PER_PASS;
  const maxIterations = options?.maxIterations ?? MAX_BALANCE_ITERATIONS;
  const pageHeightPx = options?.pageHeightPx ?? A4_PAGE_HEIGHT_PX;
  const htmlTemplate = options?.htmlTemplate ?? '';

  const allowedFlexible = resolveSidebarAllowedFlexibleSections(
    htmlTemplate || renderedHtml,
    options?.templateId
  );
  if (allowedFlexible.size === 0) {
    return empty;
  }

  const layoutMetadata = resolveTemplateLayoutMetadata({
    htmlTemplate: htmlTemplate || renderedHtml,
    templateId: options?.templateId,
  });

  // Force fixed kinds out of movable set for this pass.
  for (const kind of FIXED_COLUMN_SECTIONS) {
    layoutMetadata.movableSections.delete(kind);
    layoutMetadata.fixedSections.add(kind);
  }

  let html = renderedHtml;
  const moved: ColumnBalanceResult['moved'] = [];
  let iterations = 0;

  for (let i = 0; i < maxIterations; i += 1) {
    const sidebarSlice = extractSidebarSlice(html);
    const mainSlice = extractMainSlice(html);
    if (!sidebarSlice || !mainSlice) break;

    const pass = balancePass(
      mainSlice.inner,
      sidebarSlice.inner,
      allowedFlexible,
      layoutMetadata,
      {
        emptySpaceRatio,
        sidebarAdequateRatio,
        minGapPx,
        maxMoves,
        pageHeightPx,
        htmlTemplate,
      }
    );

    iterations += 1;
    if (!pass.changed) break;

    moved.push(...pass.moved);
    html = replaceColumnInner(html, mainSlice, pass.mainInner);
    // Re-extract sidebar after main replace (offsets may change if slices overlap — they shouldn't).
    const sidebarAfter = extractSidebarSlice(html) ?? sidebarSlice;
    html = replaceColumnInner(html, sidebarAfter, pass.sidebarInner);
  }

  const finalSidebar = extractSidebarSlice(html);
  const finalMain = extractMainSlice(html);
  const mainHeight = finalMain ? estimateColumnBlockHeight(finalMain.inner) : 0;
  const sidebarHeight = finalSidebar ? estimateColumnBlockHeight(finalSidebar.inner) : 0;
  const emptySpacePx = Math.max(0, mainHeight - sidebarHeight);
  const balanced = !shouldFillSidebar(
    mainHeight,
    sidebarHeight,
    pageHeightPx,
    emptySpaceRatio,
    sidebarAdequateRatio,
    minGapPx
  );

  if (moved.length > 0) {
    if (/class="[^"]*\bresume-container\b[^"]*"/i.test(html)) {
      html = html.replace(
        /(<div[^>]*class="[^"]*\bresume-container\b[^"]*")/i,
        `$1 data-column-balanced="true"`
      );
    }
    html = appendStyleBlock(html, buildSidebarBalanceCss());
  }

  return {
    html,
    moved,
    balanced,
    mainHeight,
    sidebarHeight,
    emptySpacePx,
    iterations,
  };
}

/** Convenience alias for the Dynamic Sidebar Balancing Engine. */
export function injectSidebarBalanceIntoHtml(
  renderedHtml: string,
  options?: ColumnBalanceOptions
): string {
  return balanceTwoColumnLayout(renderedHtml, options).html;
}
