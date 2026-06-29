/**
 * Generic two-column section balancing for resume templates.
 * Moves entire optional {{#if SECTION}} blocks between main and sidebar columns
 * to reduce vertical whitespace — no template-specific IDs or design changes.
 */

import {
  hasMeaningfulRenderedHtml,
  shouldRenderSection,
  TEMPLATE_SECTION_TO_KEY,
} from './section-visibility';

/** Template conditional names that must never change columns. */
export const FIXED_COLUMN_SECTIONS = new Set(['SUMMARY', 'EXPERIENCE', 'EDUCATION']);

/** Optional sections that may move between columns as whole blocks. */
export const MOVABLE_COLUMN_SECTIONS = new Set([
  'SKILLS',
  'PROJECTS',
  'CERTIFICATIONS',
  'ACHIEVEMENTS',
  'LANGUAGES',
  'HOBBIES',
]);

const SECTION_BLOCK_RE = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/gi;

/** Minimum estimated height gap before moving a section (px). */
const BALANCE_THRESHOLD_PX = 72;

/** Cap balancing passes to avoid over-correction. */
const MAX_BALANCE_PASSES = 12;

/** Base chrome height per section block (heading + padding). */
const SECTION_BASE_PX: Record<string, number> = {
  SUMMARY: 88,
  EXPERIENCE: 64,
  EDUCATION: 56,
  SKILLS: 48,
  PROJECTS: 56,
  CERTIFICATIONS: 48,
  ACHIEVEMENTS: 44,
  LANGUAGES: 40,
  HOBBIES: 36,
};

export type ColumnId = 'main' | 'side';

interface TagRange {
  openStart: number;
  contentStart: number;
  contentEnd: number;
  closeEnd: number;
}

interface SectionBlock {
  id: string;
  html: string;
  start: number;
}

interface ColumnLayout {
  main: TagRange;
  side: TagRange;
}

export interface ColumnBalanceContext {
  placeholders: Record<string, string>;
  formData: Record<string, unknown>;
}

function findTagRange(html: string, openTagRe: RegExp): TagRange | null {
  const match = openTagRe.exec(html);
  if (!match) return null;

  const tagName = match[0].match(/<(\w+)/i)?.[1];
  if (!tagName) return null;

  const openStart = match.index;
  const contentStart = openStart + match[0].length;
  let depth = 1;
  let cursor = contentStart;
  const nestedOpen = new RegExp(`<${tagName}\\b`, 'gi');
  const nestedClose = new RegExp(`</${tagName}\\s*>`, 'gi');

  while (cursor < html.length && depth > 0) {
    nestedOpen.lastIndex = cursor;
    nestedClose.lastIndex = cursor;
    const nextOpen = nestedOpen.exec(html);
    const nextClose = nestedClose.exec(html);
    if (!nextClose) return null;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1;
      cursor = nextOpen.index + nextOpen[0].length;
      continue;
    }

    depth -= 1;
    if (depth === 0) {
      return {
        openStart,
        contentStart,
        contentEnd: nextClose.index,
        closeEnd: nextClose.index + nextClose[0].length,
      };
    }
    cursor = nextClose.index + nextClose[0].length;
  }

  return null;
}

const MAIN_COLUMN_OPENERS = [
  /<main\b[^>]*>/i,
  /<div\b[^>]*class="[^"]*\bmain-content\b[^"]*"[^>]*>/i,
  /<div\b[^>]*class="[^"]*\bmain-panel\b[^"]*"[^>]*>/i,
  /<div\b[^>]*class="[^"]*-main\b[^"]*"[^>]*>/i,
];

const SIDE_COLUMN_OPENERS = [
  /<aside\b[^>]*>/i,
  /<div\b[^>]*class="[^"]*\bsidebar\b[^"]*"[^>]*>/i,
  /<div\b[^>]*class="[^"]*\bcol-side\b[^"]*"[^>]*>/i,
  /<div\b[^>]*class="[^"]*-side\b[^"]*"[^>]*>/i,
];

function detectTwoColumnLayout(html: string): ColumnLayout | null {
  let main: TagRange | null = null;
  let side: TagRange | null = null;

  for (const re of MAIN_COLUMN_OPENERS) {
    const found = findTagRange(html, re);
    if (found) {
      main = found;
      break;
    }
  }

  for (const re of SIDE_COLUMN_OPENERS) {
    const found = findTagRange(html, re);
    if (found) {
      side = found;
      break;
    }
  }

  if (!main || !side) return null;

  const overlap =
    main.contentStart < side.contentEnd && side.contentStart < main.contentEnd;
  if (overlap) return null;

  return { main, side };
}

function columnForPosition(layout: ColumnLayout, position: number): ColumnId {
  const mainMid = (layout.main.contentStart + layout.main.contentEnd) / 2;
  const sideMid = (layout.side.contentStart + layout.side.contentEnd) / 2;
  const distMain = Math.abs(position - mainMid);
  const distSide = Math.abs(position - sideMid);
  return distMain <= distSide ? 'main' : 'side';
}

function extractSectionBlocks(html: string): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(SECTION_BLOCK_RE.source, SECTION_BLOCK_RE.flags);
  while ((match = re.exec(html)) !== null) {
    blocks.push({
      id: match[1].toUpperCase(),
      html: match[0],
      start: match.index,
    });
  }
  return blocks;
}

function isSectionVisible(
  sectionId: string,
  placeholders: Record<string, string>,
  formData: Record<string, unknown>
): boolean {
  const key = TEMPLATE_SECTION_TO_KEY[sectionId];
  if (!key) return true;
  const placeholder = `{{${sectionId}}}`;
  const rendered = placeholders[placeholder];
  if (sectionId === 'SUMMARY' || sectionId === 'JOB_TITLE') {
    return typeof rendered === 'string' && rendered.trim().length > 0;
  }
  if (
    sectionId === 'SKILLS' ||
    sectionId === 'PROJECTS' ||
    sectionId === 'CERTIFICATIONS' ||
    sectionId === 'ACHIEVEMENTS' ||
    sectionId === 'LANGUAGES' ||
    sectionId === 'HOBBIES' ||
    sectionId === 'EXPERIENCE' ||
    sectionId === 'EDUCATION'
  ) {
    return shouldRenderSection(sectionId, rendered, formData);
  }
  return hasMeaningfulRenderedHtml(rendered);
}

function estimateSectionHeight(
  sectionId: string,
  placeholders: Record<string, string>
): number {
  const base = SECTION_BASE_PX[sectionId] ?? 44;
  const rendered = placeholders[`{{${sectionId}}}`] || '';
  const text = rendered.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const lineEstimate = Math.ceil(text.length / 52);
  const itemBonus = (rendered.match(/<li\b/gi) || []).length * 14;
  const cardBonus = (rendered.match(/class="[^"]*(?:item|card|tag)/gi) || []).length * 6;
  return base + lineEstimate * 16 + itemBonus + cardBonus;
}

function estimateColumnHeight(
  sectionIds: string[],
  placeholders: Record<string, string>
): number {
  return sectionIds.reduce((sum, id) => sum + estimateSectionHeight(id, placeholders), 0);
}

function harmonizeSectionBlockForColumn(blockHtml: string, target: ColumnId): string {
  if (target === 'main') return blockHtml;

  if (/\bsection--side\b/.test(blockHtml) || /\bsidebar-section\b/.test(blockHtml)) {
    return blockHtml;
  }

  let out = blockHtml;
  if (/\bpee-section\b/.test(out) && !/\bpee-section--side\b/.test(out)) {
    out = out.replace(/\bpee-section\b/, 'pee-section pee-section--side');
  }
  if (/\bpee-heading\b/.test(out) && !/\bpee-heading--side\b/.test(out)) {
    out = out.replace(/\bpee-heading\b/, 'pee-heading pee-heading--side');
  }
  if (/<section\b[^>]*class="([^"]*)"/i.test(out)) {
    out = out.replace(
      /<section\b([^>]*)class="([^"]*)"/i,
      (full, attrs, classes) => {
        if (/\bsidebar-section\b/.test(classes) || /--side\b/.test(classes)) return full;
        const next = `${classes} sidebar-section`.trim();
        return `<section${attrs}class="${next}"`;
      }
    );
  }
  return out;
}

function rebuildColumnInner(
  originalInner: string,
  blocks: SectionBlock[],
  column: ColumnId,
  placement: Map<string, ColumnId>,
  originalColumn: Map<string, ColumnId>
): string {
  let inner = originalInner;

  for (const block of blocks) {
    const orig = originalColumn.get(block.id);
    const assigned = placement.get(block.id) ?? orig;
    if (orig !== column) continue;
    if (assigned !== column && inner.includes(block.html)) {
      inner = inner.replace(block.html, '');
    }
  }

  inner = inner.replace(/\n{3,}/g, '\n\n').trimEnd();

  const appended: string[] = [];
  for (const block of blocks) {
    if (!MOVABLE_COLUMN_SECTIONS.has(block.id)) continue;
    const orig = originalColumn.get(block.id);
    const assigned = placement.get(block.id) ?? orig;
    if (assigned === column && orig !== column) {
      appended.push(harmonizeSectionBlockForColumn(block.html, column));
    }
  }

  if (appended.length === 0) return inner;
  return `${inner}\n\n${appended.join('\n\n')}`;
}

function balancePlacement(
  originalColumn: Map<string, ColumnId>,
  visibleSections: Set<string>,
  placeholders: Record<string, string>
): Map<string, ColumnId> {
  const placement = new Map<string, ColumnId>();

  for (const [id, col] of originalColumn) {
    placement.set(id, col);
  }

  const columnSections = (col: ColumnId): string[] =>
    [...placement.entries()]
      .filter(([id, c]) => c === col && visibleSections.has(id))
      .map(([id]) => id);

  let mainH = estimateColumnHeight(columnSections('main'), placeholders);
  let sideH = estimateColumnHeight(columnSections('side'), placeholders);

  for (let pass = 0; pass < MAX_BALANCE_PASSES; pass += 1) {
    const diff = mainH - sideH;
    if (Math.abs(diff) <= BALANCE_THRESHOLD_PX) break;

    const from: ColumnId = diff > 0 ? 'main' : 'side';
    const to: ColumnId = from === 'main' ? 'side' : 'main';

    const movableInFrom = columnSections(from).filter(
      (id) =>
        MOVABLE_COLUMN_SECTIONS.has(id) &&
        (placement.get(id) ?? originalColumn.get(id)) === from
    );
    if (movableInFrom.length === 0) break;

    const sectionId = movableInFrom[movableInFrom.length - 1];
    placement.set(sectionId, to);

    mainH = estimateColumnHeight(columnSections('main'), placeholders);
    sideH = estimateColumnHeight(columnSections('side'), placeholders);
  }

  return placement;
}

/**
 * Balance optional sections between detected main/sidebar columns.
 * Returns the original HTML when layout is not two-column or nothing is visible.
 */
export function balanceTwoColumnTemplateSections(
  htmlTemplate: string,
  context: ColumnBalanceContext
): string {
  const layout = detectTwoColumnLayout(htmlTemplate);
  if (!layout) return htmlTemplate;

  const blocks = extractSectionBlocks(htmlTemplate);
  if (blocks.length === 0) return htmlTemplate;

  const originalColumn = new Map<string, ColumnId>();
  const visibleSections = new Set<string>();

  for (const block of blocks) {
    originalColumn.set(block.id, columnForPosition(layout, block.start));
    if (isSectionVisible(block.id, context.placeholders, context.formData)) {
      visibleSections.add(block.id);
    }
  }

  const hasMovable = blocks.some(
    (b) => MOVABLE_COLUMN_SECTIONS.has(b.id) && visibleSections.has(b.id)
  );
  if (!hasMovable) return htmlTemplate;

  const placement = balancePlacement(originalColumn, visibleSections, context.placeholders);

  let changed = false;
  for (const [id, col] of placement) {
    if (MOVABLE_COLUMN_SECTIONS.has(id) && originalColumn.get(id) !== col) {
      changed = true;
      break;
    }
  }
  if (!changed) return htmlTemplate;

  const mainInner = htmlTemplate.slice(layout.main.contentStart, layout.main.contentEnd);
  const sideInner = htmlTemplate.slice(layout.side.contentStart, layout.side.contentEnd);

  const newMainInner = rebuildColumnInner(mainInner, blocks, 'main', placement, originalColumn);
  const newSideInner = rebuildColumnInner(sideInner, blocks, 'side', placement, originalColumn);

  return (
    htmlTemplate.slice(0, layout.main.contentStart) +
    newMainInner +
    htmlTemplate.slice(layout.main.contentEnd, layout.side.contentStart) +
    newSideInner +
    htmlTemplate.slice(layout.side.contentEnd)
  );
}
