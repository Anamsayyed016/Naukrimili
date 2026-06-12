import { DM_Sans } from 'next/font/google';

/**
 * Navbar typography — single source of truth.
 * DM Sans: geometric sans with more product personality than Inter/system-ui.
 */
export const navigationFont = DM_Sans({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
});

/** Charcoal slate palette (#1F2937–#334155) — not pure black */
export const navType = {
  link: 'text-[13px] font-medium leading-[1.45] tracking-[-0.015em] text-[#334155]',
  linkHover: 'hover:text-[#1f2937]',
  linkActive: 'font-semibold text-[#1f2937]',
  pill: 'text-[12px] font-medium leading-[1.35] tracking-[-0.012em] text-[#475569] sm:text-[13px]',
  pillHover: 'hover:text-[#1f2937]',
  pillActive: 'font-semibold text-[#1f2937]',
  mobile: 'text-[15px] font-medium leading-[1.45] tracking-[-0.01em] text-[#334155]',
  mobileHover: 'hover:text-[#1f2937]',
  mobileActive: 'font-semibold text-[#1f2937]',
  cta: 'text-[13px] font-semibold leading-[1.35] tracking-[-0.012em] sm:text-sm',
  sectionLabel: 'text-xs font-semibold uppercase tracking-[0.06em] text-[#64748b]',
} as const;
