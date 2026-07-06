/**
 * Dynamic layout engine — shared content-density planning for all resume templates.
 *
 * Computes spacing, typography scale, and column-balance CSS variables from resume
 * content volume. Injected at render time via `injectResumeData` (preview + PDF).
 *
 * Complements (does not replace):
 *   - typography.ts          — user Design Studio overrides
 *   - ats-content-balance-css  — premium template typography
 *   - preview-content-flow.ts  — preview overflow visibility
 *   - pdf-pagination-overrides — export pagination rules
 */

import {
  estimateExperienceYears,
  filterMeaningfulExperiences,
  filterMeaningfulProjects,
  filterMeaningfulCertifications,
  filterMeaningfulAchievements,
  normalizeSkillsForRender,
  filterMeaningfulSkills,
  shouldPreserveFullContentForRender,
} from './section-visibility';
import { collectExperienceBodyFields } from '@/lib/resume-parser/import-sanitize';

export interface DynamicLayoutPlan {
  /** Section vertical gap (px) */
  sectionGap: number;
  /** Item block gap within sections (px) */
  blockGap: number;
  /** Bullet list item gap (em) */
  bulletGap: number;
  /** Heading-to-body gap (px) */
  headingGap: number;
  /** Body font scale multiplier (0.92 – 1.06) */
  fontScale: number;
  /** Line-height multiplier (0.9 – 1.15) */
  lineHeightMul: number;
  /** Skill chip grid columns (2 – 4) */
  skillColumns: number;
  /** Main column flex grow weight */
  mainFlexGrow: number;
  /** Sidebar column flex grow weight */
  sidebarFlexGrow: number;
  /** Estimated content density 0 (sparse) – 1 (very dense) */
  density: number;
}

export interface ComputeDynamicLayoutOptions {
  htmlTemplate?: string;
  templateId?: string;
  mode?: 'preview' | 'pdf';
}

const BASE_SECTION_GAP = 14;
const BASE_BLOCK_GAP = 10;
const BASE_BULLET_GAP = 0.35;
const BASE_HEADING_GAP = 8;
/** Target content units for ~1 A4 page at 80–95% fill */
const TARGET_FILL_UNITS = 50;
const TARGET_FILL_MIN = 0.8;
const TARGET_FILL_MAX = 0.95;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getStringField(formData: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = formData[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function countSummaryWords(formData: Record<string, unknown>): number {
  const text = getStringField(formData, [
    'summary',
    'professionalSummary',
    'Professional Summary',
    'Career Objective',
    'Objective',
    'Executive Summary',
  ]);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function countExperienceBullets(experiences: Array<Record<string, unknown>>): number {
  let total = 0;
  for (const exp of experiences) {
    const body = collectExperienceBodyFields(exp);
    const bullets = body.achievements.length
      ? body.achievements
      : String(body.description || '')
          .split(/\n|•|·/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 3);
    total += Math.max(bullets.length, body.description.trim() ? 1 : 0);
  }
  return total;
}

function detectHasSidebar(htmlTemplate: string): boolean {
  return /\bsidebar\b|tm-sidebar|<aside[\s>]/i.test(htmlTemplate);
}

/**
 * Weighted content units — higher-priority sections contribute more to density.
 * Mirrors section priority: experience > projects > summary > education > skills > …
 */
function estimateContentUnits(formData: Record<string, unknown>): number {
  const experience = filterMeaningfulExperiences(
    (Array.isArray(formData.experience) ? formData.experience : []) as Array<
      Record<string, unknown>
    >
  );
  const projects = filterMeaningfulProjects(
    (Array.isArray(formData.projects) ? formData.projects : []) as Array<Record<string, unknown>>
  );
  const skills = filterMeaningfulSkills(normalizeSkillsForRender(formData)) as string[];
  const certifications = filterMeaningfulCertifications(
    (Array.isArray(formData.certifications) ? formData.certifications : []) as Array<
      Record<string, unknown>
    >
  );
  const achievements = filterMeaningfulAchievements(
    Array.isArray(formData.achievements) ? formData.achievements : []
  );
  const languages = Array.isArray(formData.languages) ? formData.languages : [];
  const summaryWords = countSummaryWords(formData);
  const bullets = countExperienceBullets(experience);
  const eduCount = Array.isArray(formData.education) ? formData.education.length : 0;
  const expYears = estimateExperienceYears(experience);

  let units = 0;
  units += experience.length * 6;
  units += bullets * 1.8;
  units += expYears * 2.5;
  units += projects.length * 4;
  units += summaryWords * 0.12;
  units += eduCount * 2.5;
  units += skills.length * 0.35;
  units += certifications.length * 1.5;
  units += achievements.length * 1.2;
  units += languages.length * 0.8;

  return units;
}

/**
 * Pure layout plan from form data — no DOM measurement required.
 * Sparse resumes expand spacing; dense resumes compress gaps before font scale.
 */
export function computeDynamicLayoutPlan(
  formData: Record<string, unknown>,
  options?: ComputeDynamicLayoutOptions
): DynamicLayoutPlan {
  const htmlTemplate = options?.htmlTemplate ?? '';
  const hasSidebar = detectHasSidebar(htmlTemplate);
  const units = estimateContentUnits(formData);
  const fillRatio = units / TARGET_FILL_UNITS;
  const density = clamp(fillRatio, 0, 1.35) / 1.35;

  let sectionGapMul = 1;
  let blockGapMul = 1;
  let bulletGapMul = 1;
  let headingGapMul = 1;
  let fontScale = 1;
  let lineHeightMul = 1;

  if (fillRatio < TARGET_FILL_MIN) {
    const expand = clamp((TARGET_FILL_MIN - fillRatio) / TARGET_FILL_MIN, 0, 1);
    sectionGapMul = 1 + expand * 0.28;
    blockGapMul = 1 + expand * 0.22;
    bulletGapMul = 1 + expand * 0.18;
    headingGapMul = 1 + expand * 0.14;
    lineHeightMul = 1 + expand * 0.1;
    fontScale = 1 + expand * 0.05;
  } else if (fillRatio > TARGET_FILL_MAX) {
    const compress = clamp((fillRatio - TARGET_FILL_MAX) / 0.45, 0, 1);
    sectionGapMul = 1 - compress * 0.18;
    blockGapMul = 1 - compress * 0.2;
    bulletGapMul = 1 - compress * 0.22;
    headingGapMul = 1 - compress * 0.12;
    lineHeightMul = 1 - compress * 0.1;
    fontScale = 1 - compress * 0.06;
  }

  const skillCount = filterMeaningfulSkills(normalizeSkillsForRender(formData)).length;
  let skillColumns = 3;
  if (hasSidebar) {
    skillColumns = skillCount <= 6 ? 2 : skillCount <= 14 ? 2 : 3;
  } else if (skillCount <= 8) {
    skillColumns = 2;
  } else if (skillCount <= 20) {
    skillColumns = 3;
  } else {
    skillColumns = 4;
  }

  const mainFlexGrow = hasSidebar ? 1.65 : 1;
  const sidebarFlexGrow = hasSidebar ? 1 : 0;

  return {
    sectionGap: Math.round(BASE_SECTION_GAP * sectionGapMul * 10) / 10,
    blockGap: Math.round(BASE_BLOCK_GAP * blockGapMul * 10) / 10,
    bulletGap: Math.round(BASE_BULLET_GAP * bulletGapMul * 100) / 100,
    headingGap: Math.round(BASE_HEADING_GAP * headingGapMul * 10) / 10,
    fontScale: Math.round(clamp(fontScale, 0.92, 1.06) * 1000) / 1000,
    lineHeightMul: Math.round(clamp(lineHeightMul, 0.9, 1.15) * 1000) / 1000,
    skillColumns,
    mainFlexGrow,
    sidebarFlexGrow,
    density: Math.round(density * 1000) / 1000,
  };
}

/**
 * Build scoped CSS that applies the layout plan via custom properties.
 * Neutral plan values (~1 page of content) produce near-default spacing.
 */
export function buildDynamicLayoutCss(plan: DynamicLayoutPlan): string {
  const lh = (1.45 * plan.lineHeightMul).toFixed(3);
  const fontPct = (100 * plan.fontScale).toFixed(2);

  return `
/* Dynamic layout engine — content-density spacing & column balance */
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
}

/* Column shells — prevent empty-column stretch */
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

.resume-container [class*='-layout'] > main,
.resume-container [class*='-layout'] > [class*='-main'],
.resume-container .main-content,
.resume-container .content-column {
  flex-grow: var(--dl-main-flex, 1) !important;
}

.resume-container [class*='-layout'] > aside,
.resume-container [class*='-layout'] > [class*='-sidebar'],
.resume-container .sidebar,
.resume-container .side-column {
  flex-grow: var(--dl-sidebar-flex, 1) !important;
}

/* Adaptive section spacing */
.resume-container section,
.resume-container .content-section,
.resume-container .sidebar-section,
.resume-container [class*='-section']:not([class*='section-title']):not([class*='-section-head']) {
  margin-bottom: var(--dl-section-gap) !important;
}

.resume-container section > h2,
.resume-container .section-title,
.resume-container [class*='section-title'],
.resume-container [class*='-section-head'] {
  margin-bottom: var(--dl-heading-gap) !important;
}

/* Experience / project / education blocks */
.resume-container .experience-item,
.resume-container .education-item,
.resume-container .project-item,
.resume-container .certification-item,
.resume-container .achievement-item {
  margin-bottom: var(--dl-block-gap) !important;
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
  font-size: calc(1em * var(--dl-font-scale)) !important;
}

/* Skill chips — auto-wrap grid without empty panels */
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

/* Summary — no reserved empty container */
.resume-container .summary-text,
.resume-container [class*='summary-text'],
.resume-container .professional-summary,
.resume-container .objective-text {
  min-height: auto !important;
  max-height: none !important;
  height: auto !important;
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

export function getDynamicLayoutStyleBlock(plan: DynamicLayoutPlan): string {
  const css = buildDynamicLayoutCss(plan);
  if (!css) return '';
  return `<style data-injected="dynamic-layout">\n${css}\n</style>`;
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
 * Compute layout plan from form data and inject scoped CSS into rendered HTML.
 */
export function injectDynamicLayoutIntoHtml(
  html: string,
  formData: Record<string, unknown>,
  options?: ComputeDynamicLayoutOptions & { htmlTemplate?: string }
): string {
  let result = html;
  if (shouldPreserveFullContentForRender(formData) && options?.htmlTemplate) {
    result = rebalanceImportSectionPlacement(result, options.htmlTemplate, formData);
  }
  const plan = computeDynamicLayoutPlan(formData, options);
  const block = getDynamicLayoutStyleBlock(plan);
  return appendStyleBlockToHtml(result, block);
}

/* ── Import-mode section placement (sidebar balance) ── */

type RelocatableSectionKind =
  | 'achievements'
  | 'languages'
  | 'certifications'
  | 'skills'
  | 'projects';

const RELOCATABLE_SECTIONS: Array<{
  kind: RelocatableSectionKind;
  token: string;
  marker: RegExp;
  priority: number;
}> = [
  { kind: 'achievements', token: 'ACHIEVEMENTS', marker: /\bachievement-item\b/i, priority: 8 },
  { kind: 'languages', token: 'LANGUAGES', marker: /\blanguage-item\b|psp-language-item\b/i, priority: 7 },
  { kind: 'certifications', token: 'CERTIFICATIONS', marker: /\bcertification-item\b/i, priority: 6 },
  { kind: 'skills', token: 'SKILLS', marker: /\bskill-tag\b|psp-skill-item\b/i, priority: 5 },
  { kind: 'projects', token: 'PROJECTS', marker: /\bproject-item\b/i, priority: 3 },
];

function estimateHtmlVolume(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length;
}

function extractSectionBlocks(containerHtml: string): Array<{ html: string; kind: RelocatableSectionKind | 'fixed' }> {
  const blocks: Array<{ html: string; kind: RelocatableSectionKind | 'fixed' }> = [];
  const re = /<section[^>]*>[\s\S]*?<\/section>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(containerHtml)) !== null) {
    const block = match[0];
    let kind: RelocatableSectionKind | 'fixed' = 'fixed';
    for (const spec of RELOCATABLE_SECTIONS) {
      if (spec.marker.test(block)) {
        kind = spec.kind;
        break;
      }
    }
    blocks.push({ html: block, kind });
  }
  return blocks;
}

/**
 * Move flexible low-priority sections from main → sidebar when sidebar is sparse.
 * Import mode only. Experience, summary, and education stay in main.
 */
export function rebalanceImportSectionPlacement(
  renderedHtml: string,
  htmlTemplate: string,
  formData: Record<string, unknown>
): string {
  if (!shouldPreserveFullContentForRender(formData)) return renderedHtml;
  if (!detectHasSidebar(htmlTemplate)) return renderedHtml;

  const asideMatch = renderedHtml.match(/(<aside[^>]*>)([\s\S]*?)(<\/aside>)/i);
  if (!asideMatch) return renderedHtml;

  const mainMatch = renderedHtml.match(/(<main[^>]*>)([\s\S]*?)(<\/main>)/i);
  if (!mainMatch) return renderedHtml;

  const sidebarInner = asideMatch[2];
  const mainInner = mainMatch[2];
  const sidebarVol = estimateHtmlVolume(sidebarInner);
  const mainVol = estimateHtmlVolume(mainInner);

  if (sidebarVol >= mainVol * 0.55) return renderedHtml;

  const mainBlocks = extractSectionBlocks(mainInner);
  const toMove: string[] = [];
  let projectedSidebarVol = sidebarVol;

  const sorted = [...mainBlocks].sort((a, b) => {
    const pa = RELOCATABLE_SECTIONS.find((s) => s.kind === a.kind)?.priority ?? 99;
    const pb = RELOCATABLE_SECTIONS.find((s) => s.kind === b.kind)?.priority ?? 99;
    return pb - pa;
  });

  const targetSidebarVol = mainVol * 0.42;

  for (const block of sorted) {
    if (block.kind === 'fixed') continue;
    const spec = RELOCATABLE_SECTIONS.find((s) => s.kind === block.kind);
    if (!spec) continue;
    const templateSupports = new RegExp(`\\{\\{#if ${spec.token}\\}\\}`, 'i').test(htmlTemplate);
    if (!templateSupports) continue;
    if (projectedSidebarVol >= targetSidebarVol) break;

    toMove.push(block.html);
    projectedSidebarVol += estimateHtmlVolume(block.html);
  }

  if (toMove.length === 0) return renderedHtml;

  let newMainInner = mainInner;
  let newSidebarInner = sidebarInner;
  for (const blockHtml of toMove) {
    newMainInner = newMainInner.replace(blockHtml, '');
    newSidebarInner = `${newSidebarInner}\n${blockHtml}`;
  }

  return renderedHtml
    .replace(asideMatch[0], `${asideMatch[1]}${newSidebarInner}${asideMatch[3]}`)
    .replace(mainMatch[0], `${mainMatch[1]}${newMainInner}${mainMatch[3]}`);
}

/* ── Render validation audit ── */

export interface SectionAuditRow {
  section: string;
  available: boolean;
  rendered: boolean;
  missing: boolean;
  reason: string;
}

const AUDIT_SECTIONS: Array<{ key: string; marker: RegExp; hasData: (d: Record<string, unknown>) => boolean }> = [
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
