/** Retired templates map to an active premium template for saved resumes / exports. */
const RETIRED_TEMPLATE_ALIASES: Record<string, string> = {
  'executive-copper': 'slate-executive-pro',
  'platinum-executive-edge': 'slate-executive-pro',
  'editorial-mauve': 'elegant-ivory',
  'executive-corporate': 'slate-executive-pro',
  'executive-modern': 'slate-executive-pro',
  'charcoal-premium': 'slate-executive-pro',
  'executive-minimal-pro': 'slate-executive-pro',
  'maroon-gold-executive': 'executive-burgundy-diamond',
  'executive-graphite': 'slate-executive-pro',
};

export function resolveTemplateId(templateId: string): string {
  return RETIRED_TEMPLATE_ALIASES[templateId] ?? templateId;
}
