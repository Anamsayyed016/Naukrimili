/**
 * ATS content-balance CSS — typography & spacing for premium templates.
 * Applied at render time (preview + PDF) without altering layout or colors.
 */

import templatesRegistry from './templates.json';
import { resolveTemplateId } from './template-aliases';
import { ATS_CONTENT_BALANCE_CSS } from './ats-content-balance-css-content';

const MARKER = '/* ATS Content Balance — typography & spacing */';

/** Premium template IDs from templates.json (category includes "Premium"). */
const PREMIUM_TEMPLATE_IDS = new Set(
  (templatesRegistry.templates as Array<{ id: string; categories?: string[] }>)
    .filter((t) => Array.isArray(t.categories) && t.categories.includes('Premium'))
    .map((t) => t.id)
);

export function isPremiumTemplate(templateId?: string | null): boolean {
  if (!templateId) return false;
  return PREMIUM_TEMPLATE_IDS.has(resolveTemplateId(templateId));
}

export function getPremiumTemplateIds(): string[] {
  return [...PREMIUM_TEMPLATE_IDS];
}

export function getAtsContentBalanceCss(): string {
  return ATS_CONTENT_BALANCE_CSS;
}

export function getAtsContentBalanceStyleBlock(): string {
  if (!ATS_CONTENT_BALANCE_CSS) return '';
  return `<style data-injected="ats-content-balance">\n${ATS_CONTENT_BALANCE_CSS}\n</style>`;
}

export function appendBalanceCssToTemplateStylesheet(existingCss: string): string {
  if (!ATS_CONTENT_BALANCE_CSS) return existingCss;
  if (existingCss.includes(MARKER)) {
    const start = existingCss.indexOf(MARKER);
    const before = existingCss.slice(0, start).trimEnd();
    return `${before}\n\n${MARKER}\n${ATS_CONTENT_BALANCE_CSS}\n`;
  }
  return `${existingCss.trimEnd()}\n\n${MARKER}\n${ATS_CONTENT_BALANCE_CSS}\n`;
}

export { MARKER as ATS_CONTENT_BALANCE_MARKER };
