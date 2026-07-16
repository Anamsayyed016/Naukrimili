/**
 * Dynamic two-column flow engine.
 *
 * Unlike `column-balance-engine` (which only relocates flexible sections),
 * this engine constructs independent vertical flows up-front:
 * - Pass 1: extract all section blocks and estimate their heights.
 * - Pass 2: place locked sections into configured left/right flows.
 * - Pass 2+: place movable sections into the shortest column (greedy).
 * - Pass 3: optional refinement by moving a small set of movable sections.
 *
 * This is server-side string-based DOM restructuring:
 * - never mutates resume data
 * - never changes template typography/colors
 * - only moves existing rendered `<section>...</section>` blocks
 */

import {
  classifyColumnSectionKind,
  detectTwoColumnLayout,
  type ColumnSectionKind,
} from './column-balance-engine';
import { estimateRenderableSectionHeight } from './section-height-estimator';
import { resolveTemplateLayoutMetadata } from './template-layout-metadata';

export interface ColumnFlowEngineOptions {
  htmlTemplate?: string;
  templateId?: string;
  /** Minimum absolute estimated height gap to trigger a refinement move (default 72px). */
  minGapPx?: number;
  /** Max movable sections to move in a single refinement pass (default 2). */
  maxMovesPerPass?: number;
  /** Max refinement passes (default 4). */
  maxRefinementPasses?: number;
}

export interface ColumnFlowResult {
  html: string;
  mainHeight: number;
  sidebarHeight: number;
  moved: number;
  refinementPasses: number;
}

function extractSidebarSlice(html: string): {
  startIndex: number;
  fullMatch: string;
  openTag: string;
  inner: string;
  closeTag: string;
} | null {
  const aside = /(<aside\b[^>]*>)([\s\S]*?)(<\/aside>)/i.exec(html);
  if (aside && typeof aside.index === 'number') {
    return {
      startIndex: aside.index,
      fullMatch: aside[0],
      openTag: aside[1],
      inner: aside[2],
      closeTag: aside[3],
    };
  }

  const sidebar = /(<div\b[^>]*class="[^"]*\bsidebar\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i.exec(html);
  if (sidebar && typeof sidebar.index === 'number') {
    return {
      startIndex: sidebar.index,
      fullMatch: sidebar[0],
      openTag: sidebar[1],
      inner: sidebar[2],
      closeTag: sidebar[3],
    };
  }

  return null;
}

function extractMainSlice(html: string): {
  startIndex: number;
  fullMatch: string;
  openTag: string;
  inner: string;
  closeTag: string;
} | null {
  const main = /(<main\b[^>]*>)([\s\S]*?)(<\/main>)/i.exec(html);
  if (main && typeof main.index === 'number') {
    return {
      startIndex: main.index,
      fullMatch: main[0],
      openTag: main[1],
      inner: main[2],
      closeTag: main[3],
    };
  }

  const mainContent = /(<div\b[^>]*class="[^"]*\bmain-content\b[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/i.exec(
    html
  );
  if (mainContent && typeof mainContent.index === 'number') {
    return {
      startIndex: mainContent.index,
      fullMatch: mainContent[0],
      openTag: mainContent[1],
      inner: mainContent[2],
      closeTag: mainContent[3],
    };
  }

  return null;
}

function replaceColumnInner(
  html: string,
  slice: { fullMatch: string; openTag: string; closeTag: string },
  newInner: string
): string {
  const rebuilt = `${slice.openTag}${newInner}${slice.closeTag}`;
  return html.replace(slice.fullMatch, rebuilt);
}

function removeFirstOccurrence(haystack: string, needle: string): string {
  const index = haystack.indexOf(needle);
  if (index === -1) return haystack;
  return haystack.slice(0, index) + haystack.slice(index + needle.length);
}

interface BankItem {
  kind: ColumnSectionKind;
  html: string;
  height: number;
  /** Absolute index within the full rendered HTML, for stable ordering. */
  index: number;
  currentColumn: 'main' | 'sidebar';
}

function collectSectionBank(columnInner: string, columnOffset: number, column: 'main' | 'sidebar'): BankItem[] {
  const items: BankItem[] = [];
  const re = /<section\b[^>]*>[\s\S]*?<\/section>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(columnInner)) !== null) {
    const block = m[0];
    const kind = classifyColumnSectionKind(block);
    if (kind === 'other' || kind === 'contact') continue;
    if (kind === 'extended') {
      // Keep; estimateRenderableSectionHeight is class-based and works for extended-section blocks.
    }
    const height = estimateRenderableSectionHeight(block);
    const idx = columnOffset + (typeof m.index === 'number' ? m.index : 0);
    items.push({ kind, html: block, height, index: idx, currentColumn: column });
  }
  return items;
}

function stripBlocksFromInner(
  columnInner: string,
  blocks: BankItem[],
  column: 'main' | 'sidebar'
): string {
  let out = columnInner;
  const relevant = blocks
    .filter((b) => b.currentColumn === column)
    .sort((a, b) => b.index - a.index); // remove from end to keep index stable

  for (const b of relevant) {
    out = removeFirstOccurrence(out, b.html);
  }
  return out;
}

function intendedColumnForKind(kind: ColumnSectionKind, meta: ReturnType<typeof resolveTemplateLayoutMetadata>): 'main' | 'sidebar' | null {
  if (meta.leftSections.has(kind)) return 'main';
  if (meta.rightSections.has(kind)) return 'sidebar';
  return null;
}

export function composeTwoColumnFlow(
  renderedHtml: string,
  options: ColumnFlowEngineOptions = {}
): ColumnFlowResult {
  if (!renderedHtml || !detectTwoColumnLayout(renderedHtml)) {
    return {
      html: renderedHtml,
      mainHeight: 0,
      sidebarHeight: 0,
      moved: 0,
      refinementPasses: 0,
    };
  }

  const htmlTemplate = options.htmlTemplate ?? '';
  const meta = resolveTemplateLayoutMetadata({ htmlTemplate, templateId: options.templateId });

  const minGapPx = options.minGapPx ?? 72;
  const maxMovesPerPass = options.maxMovesPerPass ?? 2;
  const maxRefinementPasses = options.maxRefinementPasses ?? 4;

  const mainSlice = extractMainSlice(renderedHtml);
  const sidebarSlice = extractSidebarSlice(renderedHtml);
  if (!mainSlice || !sidebarSlice) {
    return {
      html: renderedHtml,
      mainHeight: 0,
      sidebarHeight: 0,
      moved: 0,
      refinementPasses: 0,
    };
  }

  const bank = [
    ...collectSectionBank(mainSlice.inner, mainSlice.startIndex, 'main'),
    ...collectSectionBank(sidebarSlice.inner, sidebarSlice.startIndex, 'sidebar'),
  ];

  // If we didn’t extract any flow-able sections, do nothing.
  if (bank.length === 0) {
    return {
      html: renderedHtml,
      mainHeight: 0,
      sidebarHeight: 0,
      moved: 0,
      refinementPasses: 0,
    };
  }

  const lockedKinds = meta.fixedSections;
  const movableKinds = meta.movableSections;

  type ColumnState = { column: 'main' | 'sidebar'; items: BankItem[]; height: number };
  const mainState: ColumnState = { column: 'main', items: [], height: 0 };
  const sidebarState: ColumnState = { column: 'sidebar', items: [], height: 0 };

  const locked = bank.filter((b) => lockedKinds.has(b.kind)).sort((a, b) => a.index - b.index);
  const movable = bank
    .filter((b) => movableKinds.has(b.kind) && !lockedKinds.has(b.kind))
    .sort((a, b) => a.index - b.index);

  // Sections not in fixed/movable sets are treated as locked in their current column.
  const otherLocked = bank
    .filter((b) => !lockedKinds.has(b.kind) && !movableKinds.has(b.kind))
    .sort((a, b) => a.index - b.index);

  const pushItem = (state: ColumnState, item: BankItem) => {
    state.items.push(item);
    state.height += item.height;
  };

  // Place locked sections into configured side.
  for (const item of locked) {
    const target = intendedColumnForKind(item.kind, meta) ?? item.currentColumn;
    pushItem(target === 'main' ? mainState : sidebarState, item);
  }

  // Place “other locked” sections into their current column.
  for (const item of otherLocked) {
    pushItem(item.currentColumn === 'main' ? mainState : sidebarState, item);
  }

  // Initial greedy placement for movable sections using configured side when possible.
  const movableInitialOrdered = movable.slice();
  for (const item of movableInitialOrdered) {
    const intended = intendedColumnForKind(item.kind, meta);
    if (intended) {
      pushItem(intended === 'main' ? mainState : sidebarState, item);
      continue;
    }
    const target = mainState.height <= sidebarState.height ? 'main' : 'sidebar';
    pushItem(target === 'main' ? mainState : sidebarState, item);
  }

  const refinement = () => {
    for (let pass = 0; pass < maxRefinementPasses; pass += 1) {
      const diff = mainState.height - sidebarState.height;
      if (Math.abs(diff) <= minGapPx) return pass;

      const taller: 'main' | 'sidebar' = diff > 0 ? 'main' : 'sidebar';
      const shorter: 'main' | 'sidebar' = diff > 0 ? 'sidebar' : 'main';
      const tallerState = taller === 'main' ? mainState : sidebarState;
      const shorterState = shorter === 'main' ? mainState : sidebarState;

      const candidates = tallerState.items
        .filter((it) => movableKinds.has(it.kind))
        .sort((a, b) => b.height - a.height);

      let movedThisPass = 0;
      for (const cand of candidates) {
        if (movedThisPass >= maxMovesPerPass) break;

        const projectedMainHeight =
          taller === 'main'
            ? mainState.height - cand.height
            : mainState.height + cand.height;
        const projectedSidebarHeight =
          taller === 'sidebar'
            ? sidebarState.height - cand.height
            : sidebarState.height + cand.height;

        const currentAbs = Math.abs(mainState.height - sidebarState.height);
        const projectedAbs = Math.abs(projectedMainHeight - projectedSidebarHeight);
        if (projectedAbs + 1e-6 >= currentAbs) continue;

        // Apply move (remove from taller, add to shorter).
        tallerState.items = tallerState.items.filter((x) => x !== cand);
        shorterState.items.push(cand);
        tallerState.height -= cand.height;
        shorterState.height += cand.height;

        movedThisPass += 1;
      }
    }
    return maxRefinementPasses;
  };

  const refinementPasses = refinement();

  // Rebuild base inners by stripping all extracted section blocks.
  const baseMainInner = stripBlocksFromInner(mainSlice.inner, bank, 'main');
  const baseSidebarInner = stripBlocksFromInner(sidebarSlice.inner, bank, 'sidebar');

  // Stable order: sort by original index so we don’t re-order within each column.
  mainState.items.sort((a, b) => a.index - b.index);
  sidebarState.items.sort((a, b) => a.index - b.index);

  const orderedMainHtml = mainState.items.map((it) => it.html).join('\n');
  const orderedSidebarHtml = sidebarState.items.map((it) => it.html).join('\n');

  const htmlAfterMain = replaceColumnInner(
    renderedHtml,
    { ...mainSlice, fullMatch: mainSlice.fullMatch },
    `${baseMainInner.trimEnd()}\n${orderedMainHtml}\n`
  );
  const htmlFinal = replaceColumnInner(
    htmlAfterMain,
    { ...sidebarSlice, fullMatch: sidebarSlice.fullMatch },
    `${baseSidebarInner.trimEnd()}\n${orderedSidebarHtml}\n`
  );

  const moved = bank.filter((b) => {
    const nowIsMain = mainState.items.includes(b);
    return (b.currentColumn === 'main' && !nowIsMain) || (b.currentColumn === 'sidebar' && nowIsMain);
  }).length;

  let htmlOut = htmlFinal;
  if (moved > 0 && /class="[^"]*\bresume-container\b[^"]*"/i.test(htmlOut)) {
    htmlOut = htmlOut.replace(
      /(<div[^>]*class="[^"]*\bresume-container\b[^"]*")/i,
      `$1 data-column-balanced="true"`
    );
  }

  return {
    html: htmlOut,
    mainHeight: mainState.height,
    sidebarHeight: sidebarState.height,
    moved,
    refinementPasses: refinementPasses === maxRefinementPasses ? maxRefinementPasses : refinementPasses,
  };
}

