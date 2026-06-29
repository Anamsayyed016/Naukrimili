/** Retired templates map to an active premium template for saved resumes / exports. */
const RETIRED_TEMPLATE_ALIASES: Record<string, string> = {
  'executive-copper': 'platinum-executive-edge',
  'maroon-gold-executive': 'executive-burgundy-diamond',
  'executive-graphite': 'slate-executive-pro',
};

export function resolveTemplateId(templateId: string): string {
  return RETIRED_TEMPLATE_ALIASES[templateId] ?? templateId;
}
