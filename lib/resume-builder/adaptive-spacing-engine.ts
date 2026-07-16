/**
 * Adaptive Spacing Engine (spacing-only)
 *
 * Restores premium templates by avoiding typography/reflow/wrap/max-width overrides.
 * Injects only margin/padding-style spacing adjustments via CSS selectors:
 * - section margin (margin-bottom)
 * - card margin (margin-bottom on experience/project/etc cards)
 * - paragraph spacing (bottom margin on summary/description <p>)
 * - list spacing (bottom margin on <li>)
 * - heading spacing (margin-bottom on section titles)
 *
 * Never changes fonts, font-size, line-height, max-width, or transforms.
 */

import {
  A4_PAGE_HEIGHT_PX,
  synthesizeMetricsFromRenderedHtml,
  computeTemplateLayoutCapacity,
  type RenderedLayoutMetrics,
} from './dynamic-layout-engine';

// Mirrors dynamic-layout-engine base spacing constants.
const BASE_SECTION_GAP = 14;
const BASE_BLOCK_GAP = 10;
const BASE_BULLET_GAP = 0.42; // em
const BASE_HEADING_GAP = 8;
const BASE_PARAGRAPH_SPACING = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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

function deriveBand(metrics: RenderedLayoutMetrics): 'small' | 'medium' | 'large' {
  const fill = metrics.pageFillRatio; // contentHeight / pageHeight (clamped)
  if (fill < 0.72) return 'small';
  if (fill > 0.95) return 'large';
  return 'medium';
}

function buildAdaptiveSpacingCss(plan: {
  sectionGapPx: number;
  cardGapPx: number;
  headingGapPx: number;
  paragraphGapPx: number;
  bulletGapEm: number;
}): string {
  const {
    sectionGapPx,
    cardGapPx,
    headingGapPx,
    paragraphGapPx,
    bulletGapEm,
  } = plan;

  return `
<style data-injected="adaptive-spacing">
.resume-container section,
.resume-container .content-section,
.resume-container .sidebar-section,
.resume-container [class*='-section']:not([class*='section-title']):not([class*='-section-head']) {
  margin-bottom: ${sectionGapPx}px !important;
}

.resume-container section > h2,
.resume-container .section-title,
.resume-container [class*='section-title'],
.resume-container [class*='-section-head'] {
  margin-bottom: ${headingGapPx}px !important;
}

.resume-container .experience-item,
.resume-container .project-item,
.resume-container .certification-item,
.resume-container .achievement-item {
  margin-bottom: ${cardGapPx}px !important;
}

/* Paragraph spacing inside summary/description blocks */
.resume-container .summary-text,
.resume-container .professional-summary,
.resume-container .objective-text,
.resume-container .experience-item .description p,
.resume-container .project-item .description p,
.resume-container .description p {
  margin: 0 0 ${paragraphGapPx}px !important;
  line-height: inherit !important;
}

/* Ensure last paragraph keeps its original bottom spacing */
.resume-container .experience-item .description p:last-child,
.resume-container .project-item .description p:last-child,
.resume-container .description p:last-child,
.resume-container .summary-text p:last-child,
.resume-container .professional-summary p:last-child,
.resume-container .objective-text p:last-child {
  margin-bottom: 0 !important;
}

/* List spacing */
.resume-container .experience-item .description li,
.resume-container .experience-item .description ul li,
.resume-container .project-item li,
.resume-container .description li {
  margin-bottom: ${bulletGapEm}em !important;
}

.resume-container .experience-item .description li:last-child,
.resume-container .project-item li:last-child,
.resume-container .description li:last-child {
  margin-bottom: 0.12em !important;
}
</style>
`.trim();
}

export function injectAdaptiveSpacingIntoHtml(
  html: string,
  _formData: Record<string, unknown>,
  options?: { htmlTemplate?: string; templateId?: string; mode?: 'preview' | 'pdf' }
): string {
  const templateCapacity = computeTemplateLayoutCapacity(options?.htmlTemplate ?? '', options?.templateId);
  const metrics = synthesizeMetricsFromRenderedHtml(html, templateCapacity.usablePageHeightPx);
  const band = deriveBand(metrics);

  // Spacing band:
  // - small resume: larger outer gaps, same internal rhythm
  // - medium: template baseline (1.0)
  // - large resume: tighter outer + internal spacing
  const sectionMult = band === 'small' ? 1.12 : band === 'large' ? 0.92 : 1;
  const cardMult = band === 'small' ? 1.12 : band === 'large' ? 0.92 : 1;
  const headingMult = band === 'small' ? 1.0 : band === 'large' ? 0.88 : 1;
  const paragraphMult = band === 'small' ? 1.0 : band === 'large' ? 0.88 : 1;
  const bulletMult = band === 'small' ? 1.0 : band === 'large' ? 0.90 : 1;

  const plan = {
    sectionGapPx: Math.round(BASE_SECTION_GAP * sectionMult * 10) / 10,
    cardGapPx: Math.round(BASE_BLOCK_GAP * cardMult * 10) / 10,
    headingGapPx: Math.round(BASE_HEADING_GAP * headingMult * 10) / 10,
    paragraphGapPx: Math.round(BASE_PARAGRAPH_SPACING * paragraphMult * 10) / 10,
    bulletGapEm: Math.round(BASE_BULLET_GAP * bulletMult * 1000) / 1000,
  };

  const css = buildAdaptiveSpacingCss(plan);
  return appendStyleBlockToHtml(html, css);
}

