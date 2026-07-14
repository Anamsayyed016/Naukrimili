/**

 * Two-column layout balancing engine.

 *

 * Runs AFTER sections are rendered into template HTML and BEFORE dynamic-layout CSS.

 * Moves only FLEXIBLE sections between columns when imbalance exceeds threshold.

 *

 * Metadata-driven: template HTML placeholders + section shell detection — no template IDs.

 */



import { estimateRenderableSectionHeight } from '@/lib/resume-builder/section-height-estimator';
import { detectTemplateSectionShell } from '@/lib/resume-builder/section-visibility';
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

  | 'contact'

  | 'extended'

  | 'other';



/** Sections that may relocate when the template supports sidebar placement. */

export const FLEXIBLE_COLUMN_SECTIONS: ReadonlySet<ColumnSectionKind> = new Set([

  'projects',

  'achievements',

  'interests',

  'certifications',

  'languages',

  'extended',

]);



/** Never relocate — core identity anchors unless template metadata allows (not implemented). */

export const FIXED_COLUMN_SECTIONS: ReadonlySet<ColumnSectionKind> = new Set([

  'summary',

  'experience',

  'education',

  'skills',

  'contact',

]);



const MAX_BALANCE_ITERATIONS = 8;

const DEFAULT_IMBALANCE_RATIO = 1.22;

const DEFAULT_MIN_GAP_PX = 72;

const DEFAULT_MAX_MOVES_PER_PASS = 4;

const OVERSHOOT_RATIO = 1.38;



export interface ColumnBalanceOptions {

  /** Main/sidebar height ratio that triggers balancing (default 1.22). */

  imbalanceRatio?: number;

  /** Minimum absolute height gap in estimated px (default 72). */

  minGapPx?: number;

  /** Max flexible sections to move per iteration pass (default 4). */

  maxMoves?: number;

  /** Max iteration passes (default 8). */

  maxIterations?: number;

  htmlTemplate?: string;

  templateId?: string;

}



export interface ColumnBalanceResult {

  html: string;

  moved: Array<{ kind: ColumnSectionKind; from: 'main' | 'sidebar'; to: 'main' | 'sidebar' }>;

  balanced: boolean;

  mainHeight: number;

  sidebarHeight: number;

  iterations: number;

}



function countMatches(html: string, re: RegExp): number {

  return (html.match(re) || []).length;

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

  if (/\bcontact-list\b|ese-contact-list\b/i.test(block)) return 'contact';

  if (/\bextended-section\b/i.test(block)) return 'extended';

  if (/projects?/i.test(block) && /section-title|heading/i.test(block)) return 'projects';

  if (/achievements?/i.test(block) && /section-title|heading/i.test(block)) return 'achievements';

  if (/interests?|hobbies/i.test(block) && /section-title|heading/i.test(block)) return 'interests';

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



/**

 * Derive which flexible sections may live in the sidebar from template placeholders.

 * No hardcoded template IDs — uses placeholder location + sidebar presence.

 */

export function resolveSidebarAllowedFlexibleSections(

  htmlTemplate: string,

  templateId?: string

): Set<ColumnSectionKind> {

  const metadata = resolveTemplateLayoutMetadata({ htmlTemplate, templateId });

  return new Set(metadata.movableSections);

}



function columnImbalanceGap(mainHeight: number, sidebarHeight: number): number {

  return mainHeight - sidebarHeight;

}



function columnImbalanceScore(mainHeight: number, sidebarHeight: number): number {

  const main = Math.max(mainHeight, 1);

  const side = Math.max(sidebarHeight, 1);

  return Math.max(main / side, side / main);

}



function moveImprovesBalance(

  mainHeight: number,

  sidebarHeight: number,

  projectedMain: number,

  projectedSidebar: number

): boolean {

  const beforeGap = Math.abs(mainHeight - sidebarHeight);

  const afterGap = Math.abs(projectedMain - projectedSidebar);

  if (afterGap < beforeGap) return true;

  const beforeScore = columnImbalanceScore(mainHeight, sidebarHeight);

  const afterScore = columnImbalanceScore(projectedMain, projectedSidebar);

  return afterScore + 1e-6 < beforeScore;

}



function isMainOverloaded(

  mainHeight: number,

  sidebarHeight: number,

  ratio: number,

  minGap: number

): boolean {

  if (sidebarHeight <= 0) return mainHeight > minGap;

  const gap = columnImbalanceGap(mainHeight, sidebarHeight);

  return gap >= minGap && mainHeight / Math.max(sidebarHeight, 1) >= ratio;

}



function isSidebarOverloaded(

  mainHeight: number,

  sidebarHeight: number,

  ratio: number,

  minGap: number

): boolean {

  if (mainHeight <= 0) return sidebarHeight > minGap;

  const gap = sidebarHeight - mainHeight;

  return gap >= minGap && sidebarHeight / Math.max(mainHeight, 1) >= ratio;

}



function isBalanced(

  mainHeight: number,

  sidebarHeight: number,

  ratio: number,

  minGap: number

): boolean {

  return (

    !isMainOverloaded(mainHeight, sidebarHeight, ratio, minGap) &&

    !isSidebarOverloaded(mainHeight, sidebarHeight, ratio, minGap)

  );

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

    const priorityDiff = sectionMovePriority(a.kind, metadata) - sectionMovePriority(b.kind, metadata);

    if (priorityDiff !== 0) return priorityDiff;

    return b.height - a.height;

  });

}



function markMovedSection(html: string, kind: ColumnSectionKind): string {

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
    imbalanceRatio: number;
    minGapPx: number;
    maxMoves: number;
    htmlTemplate?: string;
  }

): BalancePassResult {

  const moved: ColumnBalanceResult['moved'] = [];

  let mainHeight = estimateColumnBlockHeight(mainInner);

  let sidebarHeight = estimateColumnBlockHeight(sidebarInner);

  const htmlTemplate = options.htmlTemplate ?? '';



  if (isBalanced(mainHeight, sidebarHeight, options.imbalanceRatio, options.minGapPx)) {

    return { mainInner, sidebarInner, moved, changed: false };

  }



  const mainKinds = new Set(

    collectSectionsInColumn(mainInner, 'main').map((section) => section.kind)

  );

  const sidebarKinds = new Set(

    collectSectionsInColumn(sidebarInner, 'sidebar').map((section) => section.kind)

  );



  let moves = 0;



  if (isMainOverloaded(mainHeight, sidebarHeight, options.imbalanceRatio, options.minGapPx)) {

    const candidates = sortFlexibleCandidates(
      collectSectionsInColumn(mainInner, 'main').filter(
        (section) =>
          FLEXIBLE_COLUMN_SECTIONS.has(section.kind) &&
          allowedFlexible.has(section.kind) &&
          canRelocateSection(section.kind, metadata) &&
          !sidebarKinds.has(section.kind)
      ),
      metadata
    );

    for (const candidate of candidates) {
      if (moves >= options.maxMoves) break;
      if (!isMainOverloaded(mainHeight, sidebarHeight, options.imbalanceRatio, options.minGapPx)) {
        break;
      }
      if (sidebarKinds.has(candidate.kind)) continue;
      if (!mainInner.includes(candidate.html)) continue;

      const simulatedMain = removeFirstOccurrence(mainInner, candidate.html);
      const simulatedSidebar = `${sidebarInner}\n${markMovedSection(candidate.html, candidate.kind)}\n`;
      const projectedMain = estimateColumnBlockHeight(simulatedMain);
      const projectedSidebar = estimateColumnBlockHeight(simulatedSidebar);

      if (
        !moveImprovesBalance(mainHeight, sidebarHeight, projectedMain, projectedSidebar)
      ) {
        continue;
      }
      if (
        projectedSidebar > projectedMain * OVERSHOOT_RATIO &&
        candidate.height > options.minGapPx
      ) {
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

  } else if (
    isSidebarOverloaded(mainHeight, sidebarHeight, options.imbalanceRatio, options.minGapPx)
  ) {

    const candidates = sortFlexibleCandidates(
      collectSectionsInColumn(sidebarInner, 'sidebar').filter((section) => {
        if (!FLEXIBLE_COLUMN_SECTIONS.has(section.kind)) return false;
        if (!allowedFlexible.has(section.kind)) return false;
        if (!canRelocateSection(section.kind, metadata)) return false;
        if (mainKinds.has(section.kind)) return false;
        // Keep template-native sidebar sections in the sidebar when it is taller
        // (Soft Coral / executive sidebars — avoid peeling Certs/Languages into main).
        const token =
          section.kind === 'interests'
            ? 'HOBBIES'
            : section.kind === 'projects'
              ? 'PROJECTS'
              : section.kind === 'certifications'
                ? 'CERTIFICATIONS'
                : section.kind === 'languages'
                  ? 'LANGUAGES'
                  : section.kind === 'achievements'
                    ? 'ACHIEVEMENTS'
                    : '';
        if (token && htmlTemplate) {
          const native = detectTemplateSectionShell(htmlTemplate, token).placement;
          if (native === 'sidebar') return false;
        }
        return true;
      }),
      metadata
    );

    for (const candidate of candidates) {
      if (moves >= options.maxMoves) break;
      if (
        !isSidebarOverloaded(mainHeight, sidebarHeight, options.imbalanceRatio, options.minGapPx)
      ) {
        break;
      }
      if (mainKinds.has(candidate.kind)) continue;
      if (!sidebarInner.includes(candidate.html)) continue;

      const simulatedSidebar = removeFirstOccurrence(sidebarInner, candidate.html);
      const simulatedMain = `${mainInner}\n${markMovedSection(candidate.html, candidate.kind)}\n`;
      const projectedMain = estimateColumnBlockHeight(simulatedMain);
      const projectedSidebar = estimateColumnBlockHeight(simulatedSidebar);

      if (
        !moveImprovesBalance(mainHeight, sidebarHeight, projectedMain, projectedSidebar)
      ) {
        continue;
      }
      if (
        projectedMain > projectedSidebar * OVERSHOOT_RATIO &&
        candidate.height > options.minGapPx
      ) {
        continue;
      }

      sidebarInner = simulatedSidebar;
      mainInner = simulatedMain;
      mainKinds.add(candidate.kind);
      moved.push({ kind: candidate.kind, from: 'sidebar', to: 'main' });
      moves += 1;
      mainHeight = projectedMain;
      sidebarHeight = projectedSidebar;
    }

  }



  return { mainInner, sidebarInner, moved, changed: moved.length > 0 };

}



/**

 * Balance two-column resumes by iteratively relocating flexible sections only.

 * Idempotent when already marked balanced.

 */

export function balanceTwoColumnLayout(

  renderedHtml: string,

  options?: ColumnBalanceOptions

): ColumnBalanceResult {

  const moved: ColumnBalanceResult['moved'] = [];

  const empty: ColumnBalanceResult = {

    html: renderedHtml,

    moved,

    balanced: false,

    mainHeight: 0,

    sidebarHeight: 0,

    iterations: 0,

  };



  if (!renderedHtml || /data-column-balanced=["']true["']/i.test(renderedHtml)) {

    return empty;

  }



  if (!detectTwoColumnLayout(renderedHtml)) {

    return empty;

  }



  const imbalanceRatio = options?.imbalanceRatio ?? DEFAULT_IMBALANCE_RATIO;

  const minGapPx = options?.minGapPx ?? DEFAULT_MIN_GAP_PX;

  const maxMoves = options?.maxMoves ?? DEFAULT_MAX_MOVES_PER_PASS;

  const maxIterations = options?.maxIterations ?? MAX_BALANCE_ITERATIONS;

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



  let html = renderedHtml;

  let iterations = 0;



  for (let i = 0; i < maxIterations; i += 1) {

    const sidebarSlice = extractSidebarSlice(html);

    const mainSlice = extractMainSlice(html);

    if (!sidebarSlice || !mainSlice) break;



    const pass = balancePass(mainSlice.inner, sidebarSlice.inner, allowedFlexible, layoutMetadata, {

      imbalanceRatio,

      minGapPx,

      maxMoves,

      htmlTemplate,

    });



    iterations += 1;

    if (!pass.changed) break;



    moved.push(...pass.moved);

    html = replaceColumnInner(html, mainSlice, pass.mainInner);

    html = replaceColumnInner(html, sidebarSlice, pass.sidebarInner);

  }



  const finalSidebar = extractSidebarSlice(html);

  const finalMain = extractMainSlice(html);

  const mainHeight = finalMain ? estimateColumnBlockHeight(finalMain.inner) : 0;

  const sidebarHeight = finalSidebar ? estimateColumnBlockHeight(finalSidebar.inner) : 0;

  const balanced = isBalanced(mainHeight, sidebarHeight, imbalanceRatio, minGapPx);



  if (moved.length > 0 && /class="[^"]*\bresume-container\b[^"]*"/i.test(html)) {

    html = html.replace(

      /(<div[^>]*class="[^"]*\bresume-container\b[^"]*")/i,

      `$1 data-column-balanced="true"`

    );

  }



  return {

    html,

    moved,

    balanced,

    mainHeight,

    sidebarHeight,

    iterations,

  };

}


