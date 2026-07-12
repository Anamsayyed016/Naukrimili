/** Retired templates map to an active premium template for saved resumes / exports. */
const RETIRED_TEMPLATE_ALIASES: Record<string, string> = {
  'executive-copper': 'charcoal-premium',
  'platinum-executive-edge': 'charcoal-premium',
  'editorial-mauve': 'elegant-ivory',
  'executive-corporate': 'charcoal-premium',
  'executive-modern': 'charcoal-premium',
  'maroon-gold-executive': 'executive-burgundy-diamond',
  'executive-graphite': 'slate-executive-pro',
};

export function resolveTemplateId(templateId: string): string {
  return RETIRED_TEMPLATE_ALIASES[templateId] ?? templateId;
}
