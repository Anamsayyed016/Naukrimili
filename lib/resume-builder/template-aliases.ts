/** Retired templates map to an active premium template for saved resumes / exports. */

const RETIRED_TEMPLATE_ALIASES: Record<string, string> = {

  'elegant-ivory': 'soft-coral-executive',

  'luxe-executive': 'soft-coral-executive',

  'monarch-edge': 'soft-coral-executive',

  'sterling-executive': 'soft-coral-executive',

  'ivory-boardroom-executive': 'soft-coral-executive',

  'royal-copper-executive': 'soft-coral-executive',

  'fashion-editorial-premium': 'soft-coral-executive',

  'rosewood-modern': 'soft-coral-executive',

  'cascade-flow': 'soft-coral-executive',

  'lumen-studio': 'soft-coral-executive',

  'executive-mosaic': 'soft-coral-executive',

  'executive-timeline': 'soft-coral-executive',

  'nordic-fusion': 'soft-coral-executive',

  'modern-edge': 'soft-coral-executive',

  'prism-edition': 'soft-coral-executive',

  'executive-slate': 'soft-coral-executive',

  'verdant-scandi-executive': 'soft-coral-executive',

  'executive-copper': 'soft-coral-executive',

  'platinum-executive-edge': 'soft-coral-executive',

  'editorial-mauve': 'soft-coral-executive',

  'executive-corporate': 'soft-coral-executive',

  'executive-modern': 'soft-coral-executive',

  'charcoal-premium': 'soft-coral-executive',

  'executive-minimal-pro': 'soft-coral-executive',

  'royal-edge': 'soft-coral-executive',

  'velvet-ribbon-executive': 'soft-coral-executive',

  'aether-professional': 'soft-coral-executive',

  'nordic-creative-executive': 'soft-coral-executive',

  'executive-burgundy-diamond': 'soft-coral-executive',

  'maroon-gold-executive': 'soft-coral-executive',

  'executive-sidebar-elite': 'soft-coral-executive',

  'horizon-canvas': 'soft-coral-executive',

  'soft-sage-professional': 'soft-coral-executive',

  'executive-graphite': 'soft-coral-executive',

  'luxury-corporate': 'soft-coral-executive',

  'executive-navy-copper': 'soft-coral-executive',

  'organic-luxe-editorial': 'soft-coral-executive',

  'executive-slate-luxe': 'soft-coral-executive',

  'slate-executive-pro': 'soft-coral-executive',

  'organic-luxe-executive': 'soft-coral-executive',

  'velvet-horizon-executive': 'soft-coral-executive',

  'midnight-prestige-executive': 'soft-coral-executive',

  'frosted-glass-executive': 'soft-coral-executive',

  'executive-redline-elite': 'soft-coral-executive',

  'aurora-executive-glass': 'soft-coral-executive',

  'blush-executive-watercolor': 'soft-coral-executive',

  'graphite-orange-executive': 'soft-coral-executive',

  'executive-coral-elite': 'soft-coral-executive',

};



export function resolveTemplateId(templateId: string): string {

  return RETIRED_TEMPLATE_ALIASES[templateId] ?? templateId;

}


