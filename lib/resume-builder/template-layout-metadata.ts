/**
 * Metadata-driven layout balancing — no template-ID hardcoding.
 * Reads templates.json when available; falls back to HTML placeholder detection.
 */

import templatesRegistry from './templates.json';
import { detectTemplateSectionShell } from '@/lib/resume-builder/section-visibility';
import type { ColumnSectionKind } from './column-balance-engine';

export type LayoutSectionPriorityKind =
  | 'header'
  | 'contact'
  | 'summary'
  | 'experience'
  | 'projects'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'languages'
  | 'achievements'
  | 'interests'
  | 'references'
  | 'extended'
  | 'other';

/** Higher = more anchor-like; only sections below experience priority may relocate. */
export const DEFAULT_SECTION_PRIORITIES: Record<LayoutSectionPriorityKind, number> = {
  header: 100,
  contact: 98,
  experience: 95,
  summary: 90,
  skills: 92,
  languages: 91,
  education: 88,
  projects: 70,
  certifications: 58,
  achievements: 50,
  interests: 40,
  references: 38,
  extended: 36,
  other: 30,
};

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

export interface TemplateLayoutMetadata {
  layoutType: 'one-column' | 'two-column' | 'sidebar' | 'card' | 'standard';
  columnCount: number;
  hasSidebar: boolean;
  mainColumnBasisPct: number;
  sidebarColumnBasisPct: number;
  /**
   * Intended assignment for sections into the left (main) and right (sidebar) flows.
   * Used by the column-flow engine to avoid “waiting” between columns.
   */
  leftSections: Set<ColumnSectionKind>;
  rightSections: Set<ColumnSectionKind>;
  movableSections: Set<ColumnSectionKind>;
  fixedSections: Set<ColumnSectionKind>;
  sectionPriorities: Record<LayoutSectionPriorityKind, number>;
  /** Minimum priority gap required before a section may relocate (default: experience). */
  maxMovablePriority: number;
}

export interface ResolveTemplateLayoutMetadataInput {
  htmlTemplate?: string;
  templateId?: string;
}

function columnKindToPriorityKind(kind: ColumnSectionKind): LayoutSectionPriorityKind {
  if (kind === 'interests') return 'interests';
  if (kind === 'contact') return 'contact';
  if (kind === 'references') return 'references';
  if (kind === 'other') return 'other';
  return kind as LayoutSectionPriorityKind;
}

function detectLayoutType(htmlTemplate: string): TemplateLayoutMetadata['layoutType'] {
  const hasSidebar =
    /<aside[\s>]|class="[^"]*\bsidebar\b[^"]*"/i.test(htmlTemplate);
  if (hasSidebar) return 'two-column';
  if (/card-grid|bento|module-card/i.test(htmlTemplate)) return 'card';
  if (/one-column|single-column/i.test(htmlTemplate)) return 'one-column';
  return 'standard';
}

function detectColumnBasis(htmlTemplate: string): { main: number; sidebar: number } {
  const ratioMatch = htmlTemplate.match(/(\d{2})\s*\/\s*(\d{2})/);
  if (ratioMatch) {
    const a = parseInt(ratioMatch[1], 10);
    const b = parseInt(ratioMatch[2], 10);
    if (Number.isFinite(a) && Number.isFinite(b) && a + b >= 90 && a + b <= 110) {
      return {
        main: Math.max(a, b),
        sidebar: Math.min(a, b),
      };
    }
  }
  if (/\b65\s*\/\s*35\b|sce-main|65%/i.test(htmlTemplate)) {
    return { main: 65, sidebar: 35 };
  }
  return { main: 68, sidebar: 32 };
}

function deriveMovableFromHtml(htmlTemplate: string): Set<ColumnSectionKind> {
  const movable = new Set<ColumnSectionKind>();
  const hasSidebar =
    /<aside[\s>]|class="[^"]*\bsidebar\b[^"]*"|tm-sidebar|sep-sidebar/i.test(
      htmlTemplate
    );
  if (!hasSidebar) return movable;

  const flexibleKinds: ColumnSectionKind[] = [
    'projects',
    'achievements',
    'interests',
    'certifications',
    'references',
    'extended',
  ];

  for (const kind of flexibleKinds) {
    if (kind === 'extended') {
      movable.add('extended');
      continue;
    }
    const token = KIND_TO_TOKEN[kind];
    if (!token) continue;
    const hasPlaceholder = new RegExp(
      `\\{\\{#if\\s+${token}\\}\\}|\\{\\{${token}\\}\\}`,
      'i'
    ).test(htmlTemplate);
    if (!hasPlaceholder) continue;
    const shell = detectTemplateSectionShell(htmlTemplate, token);
    if (shell.placement === 'sidebar' || shell.placement === 'main') {
      movable.add(kind);
    }
  }

  return movable;
}

function registryEntryForTemplate(templateId?: string): Record<string, unknown> | null {
  if (!templateId) return null;
  const templates = (templatesRegistry as { templates?: Array<Record<string, unknown>> })
    .templates;
  if (!Array.isArray(templates)) return null;
  return templates.find((t) => t.id === templateId) ?? null;
}

/**
 * Resolve balancing metadata for any template from registry + HTML structure.
 */
export function resolveTemplateLayoutMetadata(
  input: ResolveTemplateLayoutMetadataInput = {}
): TemplateLayoutMetadata {
  const htmlTemplate = input.htmlTemplate ?? '';
  const registry = registryEntryForTemplate(input.templateId);
  const registryMeta = (registry?.layoutMetadata ?? null) as
    | Record<string, unknown>
    | null;

  const layoutType =
    (registryMeta?.layoutType as TemplateLayoutMetadata['layoutType']) ??
    detectLayoutType(htmlTemplate);
  const columnCount =
    typeof registryMeta?.columnCount === 'number'
      ? (registryMeta.columnCount as number)
      : layoutType === 'two-column' || layoutType === 'sidebar'
        ? 2
        : 1;
  const hasSidebar =
    typeof registryMeta?.hasSidebar === 'boolean'
      ? (registryMeta.hasSidebar as boolean)
      : columnCount > 1 && /<aside[\s>]|class="[^"]*\bsidebar\b/i.test(htmlTemplate);

  const basis = detectColumnBasis(htmlTemplate);
  const mainColumnBasisPct =
    typeof registryMeta?.mainColumnBasisPct === 'number'
      ? (registryMeta.mainColumnBasisPct as number)
      : basis.main;
  const sidebarColumnBasisPct =
    typeof registryMeta?.sidebarColumnBasisPct === 'number'
      ? (registryMeta.sidebarColumnBasisPct as number)
      : basis.sidebar;

  const sectionPriorities = {
    ...DEFAULT_SECTION_PRIORITIES,
    ...((registryMeta?.sectionPriorities as Partial<
      Record<LayoutSectionPriorityKind, number>
    >) ?? {}),
  };

  const maxMovablePriority =
    typeof registryMeta?.maxMovablePriority === 'number'
      ? (registryMeta.maxMovablePriority as number)
      : sectionPriorities.experience;

  const defaultFixed: ColumnSectionKind[] = [
    'summary',
    'experience',
    'education',
    'skills',
    'languages',
    'contact',
  ];
  const defaultMovable: ColumnSectionKind[] = [
    'projects',
    'certifications',
    'achievements',
    'interests',
    'references',
    'extended',
  ];

  const fixedSections = new Set<ColumnSectionKind>(
    Array.isArray(registryMeta?.fixedSections)
      ? (registryMeta.fixedSections as ColumnSectionKind[])
      : defaultFixed
  );
  const movableSections = new Set<ColumnSectionKind>(
    Array.isArray(registryMeta?.movableSections)
      ? (registryMeta.movableSections as ColumnSectionKind[])
      : deriveMovableFromHtml(htmlTemplate).size > 0
        ? [...deriveMovableFromHtml(htmlTemplate)]
        : defaultMovable
  );

  for (const kind of fixedSections) {
    movableSections.delete(kind);
  }

  const parseKindSet = (value: unknown): Set<ColumnSectionKind> => {
    if (!Array.isArray(value)) return new Set<ColumnSectionKind>();
    const kinds = (value as unknown[]).filter((x) => typeof x === 'string') as string[];
    return new Set(
      kinds
        .map((k) => k.trim() as ColumnSectionKind)
        .filter((k) => k.length > 0)
    );
  };

  // leftSections/rightSections come from template config when present.
  // When missing, we derive from current placeholder placement as a safe fallback.
  const leftSections =
    parseKindSet(registryMeta?.leftSections).size > 0
      ? parseKindSet(registryMeta?.leftSections)
      : new Set<ColumnSectionKind>();
  const rightSections =
    parseKindSet(registryMeta?.rightSections).size > 0
      ? parseKindSet(registryMeta?.rightSections)
      : new Set<ColumnSectionKind>();

  const ensureFallbackPlacements = () => {
    if (leftSections.size > 0 || rightSections.size > 0) return;

    // If no template HTML was provided, `detectTemplateSectionShell` may recurse
    // across fallback tokens indefinitely. Use safe generic defaults.
    const trimmed = htmlTemplate?.trim?.() ?? '';
    const hasHandlebarsMarkers =
      /\{\{#if\s+\w+\}\}|\{\{\s*[\w-]+\s*\}\}/i.test(htmlTemplate);

    if (!trimmed || !hasHandlebarsMarkers) {
      leftSections.add('summary');
      leftSections.add('education');
      leftSections.add('skills');
      leftSections.add('languages');
      leftSections.add('certifications');
      leftSections.add('interests');
      rightSections.add('experience');
      rightSections.add('projects');
      rightSections.add('achievements');
      rightSections.add('extended');
      return;
    }

    const fixedTokens: Array<[ColumnSectionKind, string]> = [
      ['summary', 'SUMMARY'],
      ['experience', 'EXPERIENCE'],
      ['education', 'EDUCATION'],
      ['skills', 'SKILLS'],
      ['projects', 'PROJECTS'],
      ['certifications', 'CERTIFICATIONS'],
      ['languages', 'LANGUAGES'],
      ['achievements', 'ACHIEVEMENTS'],
      ['interests', 'HOBBIES'],
    ];
    for (const [kind, token] of fixedTokens) {
      const shell = detectTemplateSectionShell(htmlTemplate, token);
      if (shell.placement === 'sidebar') rightSections.add(kind);
      else leftSections.add(kind);
    }
  };

  ensureFallbackPlacements();

  return {
    layoutType,
    columnCount,
    hasSidebar,
    mainColumnBasisPct,
    sidebarColumnBasisPct,
    leftSections,
    rightSections,
    movableSections,
    fixedSections,
    sectionPriorities,
    maxMovablePriority,
  };
}

export function sectionMovePriority(
  kind: ColumnSectionKind,
  metadata: TemplateLayoutMetadata
): number {
  const priorityKind = columnKindToPriorityKind(kind);
  const priority = metadata.sectionPriorities[priorityKind] ?? 30;
  if (priority >= metadata.maxMovablePriority) return 999;
  return 100 - priority;
}

export function canRelocateSection(
  kind: ColumnSectionKind,
  metadata: TemplateLayoutMetadata
): boolean {
  if (metadata.fixedSections.has(kind)) return false;
  if (!metadata.movableSections.has(kind)) return false;
  const priorityKind = columnKindToPriorityKind(kind);
  const priority = metadata.sectionPriorities[priorityKind] ?? 30;
  return priority < metadata.maxMovablePriority;
}
