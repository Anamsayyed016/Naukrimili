/**
 * Two-column layout balancing engine.
 *
 * Runs AFTER sections are rendered into template HTML and BEFORE dynamic-layout CSS.
 * Moves only FLEXIBLE sections from an overloaded main column into an underfilled sidebar
 * when the template is two-column and the section is allowed there.
 *
 * Does NOT redesign templates, change colors/typography/parser, or move fixed sections
 * (header, contact, summary, experience, education, skills, languages, certifications).
 */

import { detectTemplateSectionShell } from '@/lib/resume-builder/section-visibility';

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
  | 'other';

/** Sections that may relocate when the template supports sidebar placement. */
export const FLEXIBLE_COLUMN_SECTIONS: ReadonlySet<ColumnSectionKind> = new Set([
  'projects',
  'achievements',
  'interests',
]);

/** Never relocate — core identity of the primary column / sidebar anchors. */
export const FIXED_COLUMN_SECTIONS: ReadonlySet<ColumnSectionKind> = new Set([
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'certifications',
  'contact',
]);

const KIND_TO_TOKEN: Record<string, string> = {
  projects: 'PROJECTS',
  achievements: 'ACHIEVEMENTS',
  interests: 'HOBBIES',
  education: 'EDUCATION',
  skills: 'SKILLS',
  languages: 'LANGUAGES',
  certifications: 'CERTIFICATIONS',
  experience: 'EXPERIENCE',
  summary: 'SUMMARY',
};

const STRUCTURAL_HEIGHTS = {
  sectionHeading: 36,
  experienceItemBase: 72,
  experienceBullet: 22,
  educationItem: 56,
  projectItem: 64,
  skillTag: 26,
  certificationItem: 40,
  languageItem: 28,
  achievementItem: 36,
  hobbyItem: 24,
  summaryLine: 18,
};

export interface ColumnBalanceOptions {
  /** Main/sidebar height ratio that triggers balancing (default 1.35). */
  imbalanceRatio?: number;
  /** Minimum absolute height gap in estimated px (default 140). */
  minGapPx?: number;
  /** Max flexible sections to move in one pass (default 3). */
  maxMoves?: number;
  htmlTemplate?: string;
  templateId?: string;
}

export interface ColumnBalanceResult {
  html: string;
  moved: Array<{ kind: ColumnSectionKind; from: 'main' | 'sidebar'; to: 'main' | 'sidebar' }>;
  balanced: boolean;
  mainHeight: number;
  sidebarHeight: number;
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
  // Heading-only fallbacks for empty/sparse shells
  if (/projects?/i.test(block) && /section-title|heading/i.test(block)) return 'projects';
  if (/achievements?/i.test(block) && /section-title|heading/i.test(block)) return 'achievements';
  if (/interests?|hobbies/i.test(block) && /section-title|heading/i.test(block)) return 'interests';
  return 'other';
}

export function estimateColumnBlockHeight(html: string): number {
  let h = STRUCTURAL_HEIGHTS.sectionHeading;
  h += countMatches(html, /\bexperience-item\b/gi) * STRUCTURAL_HEIGHTS.experienceItemBase;
  h += countMatches(html, /<li\b/gi) * STRUCTURAL_HEIGHTS.experienceBullet;
  h += countMatches(html, /\beducation-item\b/gi) * STRUCTURAL_HEIGHTS.educationItem;
  h += countMatches(html, /\bproject-item\b/gi) * STRUCTURAL_HEIGHTS.projectItem;
  h += countMatches(html, /\bskill-tag\b|psp-skill-item\b/gi) * STRUCTURAL_HEIGHTS.skillTag;
  h += countMatches(html, /\bcertification-item\b/gi) * STRUCTURAL_HEIGHTS.certificationItem;
  h += countMatches(html, /\blanguage-item\b|psp-language-item\b/gi) * STRUCTURAL_HEIGHTS.languageItem;
  h += countMatches(html, /\bachievement-item\b/gi) * STRUCTURAL_HEIGHTS.achievementItem;
  h += countMatches(html, /\bhobby-item\b/gi) * STRUCTURAL_HEIGHTS.hobbyItem;
  const text = html.replace(/<[^>]+>/g, ' ').trim();
  if (/\bsummary-text\b|professional-summary\b/i.test(html) && text) {
    h += Math.max(
      STRUCTURAL_HEIGHTS.summaryLine * 2,
      Math.ceil(text.length / 80) * STRUCTURAL_HEIGHTS.summaryLine
    );
  }
  return Math.max(h, 24);
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
  htmlTemplate: string
): Set<ColumnSectionKind> {
  const allowed = new Set<ColumnSectionKind>();
  const hasSidebar =
    /<aside[\s>]|class="[^"]*\bsidebar\b[^"]*"|tm-sidebar|sep-sidebar/i.test(htmlTemplate);
  if (!hasSidebar) return allowed;

  for (const kind of FLEXIBLE_COLUMN_SECTIONS) {
    const token = KIND_TO_TOKEN[kind];
    if (!token) continue;
    const hasPlaceholder =
      new RegExp(`\\{\\{#if\\s+${token}\\}\\}|\\{\\{${token}\\}\\}`, 'i').test(htmlTemplate);
    if (!hasPlaceholder) continue;

    // Template already authors this section somewhere → sidebar relocation is allowed
    // when a secondary column exists (metadata-driven fallback).
    const shell = detectTemplateSectionShell(htmlTemplate, token);
    if (shell.placement === 'sidebar' || shell.placement === 'main') {
      allowed.add(kind);
    }
  }

  return allowed;
}

function isImbalanced(
  mainHeight: number,
  sidebarHeight: number,
  ratio: number,
  minGap: number
): boolean {
  if (sidebarHeight <= 0) return mainHeight > minGap;
  const gap = mainHeight - sidebarHeight;
  return gap >= minGap && mainHeight / Math.max(sidebarHeight, 1) >= ratio;
}

function replaceColumnInner(
  html: string,
  slice: ColumnSlice,
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

/**
 * Balance two-column resumes by relocating flexible sections only.
 * Idempotent when already marked / balanced.
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
  };

  if (!renderedHtml || /data-column-balanced=["']true["']/i.test(renderedHtml)) {
    return empty;
  }

  if (!detectTwoColumnLayout(renderedHtml)) {
    return empty;
  }

  const imbalanceRatio = options?.imbalanceRatio ?? 1.35;
  const minGapPx = options?.minGapPx ?? 140;
  const maxMoves = options?.maxMoves ?? 3;
  const htmlTemplate = options?.htmlTemplate ?? '';

  const allowedFlexible = resolveSidebarAllowedFlexibleSections(
    htmlTemplate || renderedHtml
  );
  if (allowedFlexible.size === 0) {
    return empty;
  }

  let html = renderedHtml;
  let sidebarSlice = extractSidebarSlice(html);
  let mainSlice = extractMainSlice(html);
  if (!sidebarSlice || !mainSlice) {
    return empty;
  }

  let mainInner = mainSlice.inner;
  let sidebarInner = sidebarSlice.inner;
  let mainHeight = estimateColumnBlockHeight(mainInner);
  let sidebarHeight = estimateColumnBlockHeight(sidebarInner);

  if (!isImbalanced(mainHeight, sidebarHeight, imbalanceRatio, minGapPx)) {
    return {
      html,
      moved,
      balanced: true,
      mainHeight,
      sidebarHeight,
    };
  }

  const sidebarKinds = new Set(
    collectSectionsInColumn(sidebarInner, 'sidebar').map((section) => section.kind)
  );

  // Prefer moving larger flexible blocks first so fewer moves fill more gap.
  const candidates = collectSectionsInColumn(mainInner, 'main')
    .filter(
      (section) =>
        FLEXIBLE_COLUMN_SECTIONS.has(section.kind) &&
        allowedFlexible.has(section.kind) &&
        !FIXED_COLUMN_SECTIONS.has(section.kind) &&
        !sidebarKinds.has(section.kind)
    )
    .sort((a, b) => b.height - a.height);

  let moves = 0;
  for (const candidate of candidates) {
    if (moves >= maxMoves) break;
    if (!isImbalanced(mainHeight, sidebarHeight, imbalanceRatio, minGapPx)) break;

    // Moving this block should not overshoot sidebar into a worse imbalance.
    const projectedSidebar = sidebarHeight + candidate.height;
    const projectedMain = mainHeight - candidate.height;
    if (projectedSidebar > projectedMain * 1.45 && candidate.height > minGapPx) {
      continue;
    }

    const marked = candidate.html.replace(
      /<section\b/i,
      `<section data-column-moved="${candidate.kind}"`
    );

    mainInner = removeFirstOccurrence(mainInner, candidate.html);
    sidebarInner = `${sidebarInner}\n${marked}\n`;
    sidebarKinds.add(candidate.kind);
    moved.push({ kind: candidate.kind, from: 'main', to: 'sidebar' });
    moves += 1;

    mainHeight = estimateColumnBlockHeight(mainInner);
    sidebarHeight = estimateColumnBlockHeight(sidebarInner);
  }

  if (moved.length === 0) {
    return {
      html,
      moved,
      balanced: !isImbalanced(mainHeight, sidebarHeight, imbalanceRatio, minGapPx),
      mainHeight,
      sidebarHeight,
    };
  }

  // Rebuild columns from the originally captured slices (aside/main are siblings).
  html = replaceColumnInner(html, mainSlice, mainInner);
  html = replaceColumnInner(html, sidebarSlice, sidebarInner);

  if (/class="[^"]*\bresume-container\b[^"]*"/i.test(html)) {
    html = html.replace(
      /(<div[^>]*class="[^"]*\bresume-container\b[^"]*")/i,
      `$1 data-column-balanced="true"`
    );
  }

  mainHeight = estimateColumnBlockHeight(mainInner);
  sidebarHeight = estimateColumnBlockHeight(sidebarInner);

  return {
    html,
    moved,
    balanced: !isImbalanced(mainHeight, sidebarHeight, imbalanceRatio, minGapPx),
    mainHeight,
    sidebarHeight,
  };
}
