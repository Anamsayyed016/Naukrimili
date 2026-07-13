/** Retired templates map to an active premium template for saved resumes / exports. */
const RETIRED_TEMPLATE_ALIASES: Record<string, string> = {
  'executive-copper': 'ivory-boardroom-executive',
  'platinum-executive-edge': 'ivory-boardroom-executive',
  'editorial-mauve': 'elegant-ivory',
  'executive-corporate': 'ivory-boardroom-executive',
  'executive-modern': 'ivory-boardroom-executive',
  'charcoal-premium': 'ivory-boardroom-executive',
  'executive-minimal-pro': 'ivory-boardroom-executive',
  'royal-edge': 'ivory-boardroom-executive',
  'velvet-ribbon-executive': 'elegant-ivory',
  'aether-professional': 'elegant-ivory',
  'nordic-creative-executive': 'elegant-ivory',
  'executive-burgundy-diamond': 'royal-copper-executive',
  'maroon-gold-executive': 'royal-copper-executive',
  'executive-sidebar-elite': 'ivory-boardroom-executive',
  'horizon-canvas': 'elegant-ivory',
  'soft-sage-professional': 'lumen-studio',
  'executive-graphite': 'ivory-boardroom-executive',
  'luxury-corporate': 'ivory-boardroom-executive',
  'executive-navy-copper': 'ivory-boardroom-executive',
  'organic-luxe-editorial': 'elegant-ivory',
  'executive-slate-luxe': 'ivory-boardroom-executive',
  'slate-executive-pro': 'ivory-boardroom-executive',
  'organic-luxe-executive': 'elegant-ivory',
  'velvet-horizon-executive': 'royal-copper-executive',
  'midnight-prestige-executive': 'ivory-boardroom-executive',
  'frosted-glass-executive': 'elegant-ivory',
  'executive-redline-elite': 'ivory-boardroom-executive',
  'aurora-executive-glass': 'lumen-studio',
  'blush-executive-watercolor': 'elegant-ivory',
  'graphite-orange-executive': 'royal-copper-executive',
  'executive-coral-elite': 'ivory-boardroom-executive',
};

export function resolveTemplateId(templateId: string): string {
  return RETIRED_TEMPLATE_ALIASES[templateId] ?? templateId;
}
