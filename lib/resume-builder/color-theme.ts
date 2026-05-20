/**
 * Resume template color resolution — shared by preview, export, and picker UI.
 * Custom colors use selectedColorId format: custom:<hex without #>  e.g. custom:14b8a6
 */

import type { ColorVariant } from './types';

export const CUSTOM_COLOR_PREFIX = 'custom:';

export function isCustomColorId(id: string | undefined): boolean {
  return !!id && id.startsWith(CUSTOM_COLOR_PREFIX);
}

export function createCustomColorId(hex: string): string {
  return `${CUSTOM_COLOR_PREFIX}${normalizeHex(hex).replace('#', '')}`;
}

export function parseCustomColorHex(id: string): string | null {
  if (!isCustomColorId(id)) return null;
  const raw = id.slice(CUSTOM_COLOR_PREFIX.length).trim();
  if (!raw) return null;
  return normalizeHex(raw.startsWith('#') ? raw : `#${raw}`);
}

export function normalizeHex(hex: string): string {
  let h = hex.trim();
  if (!h.startsWith('#')) h = `#${h}`;
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    const r = h[1];
    const g = h[2];
    const b = h[3];
    h = `#${r}${r}${g}${g}${b}${b}`;
  }
  if (!/^#[0-9A-Fa-f]{6}$/i.test(h)) {
    return '#14b8a6';
  }
  return h.toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = normalizeHex(hex);
  const n = parseInt(h.slice(1), 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = 1 - amount;
  return rgbToHex(rgb.r * f, rgb.g * f, rgb.b * f);
}

export function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount
  );
}

export function buildCustomColorVariant(hex: string): ColorVariant {
  const primary = normalizeHex(hex);
  return {
    id: createCustomColorId(primary),
    name: 'Custom',
    primary,
    accent: darkenHex(primary, 0.18),
    text: '#1f2937',
  };
}

/**
 * Resolve palette or custom color for preview/export.
 */
export function resolveColorVariant(
  colors: ColorVariant[],
  selectedColorId: string | undefined,
  defaultColorId: string
): ColorVariant {
  if (selectedColorId && isCustomColorId(selectedColorId)) {
    const hex = parseCustomColorHex(selectedColorId);
    if (hex) return buildCustomColorVariant(hex);
  }
  if (selectedColorId) {
    const preset = colors.find((c) => c.id === selectedColorId);
    if (preset) return preset;
  }
  return (
    colors.find((c) => c.id === defaultColorId) ||
    colors[0] || {
      id: 'default',
      name: 'Default',
      primary: '#2563eb',
      accent: '#1d4ed8',
      text: '#1f2937',
    }
  );
}

export function getColorDisplayLabel(
  colors: ColorVariant[],
  selectedColorId: string
): string {
  if (isCustomColorId(selectedColorId)) {
    const hex = parseCustomColorHex(selectedColorId);
    return hex ? `Custom ${hex.toUpperCase()}` : 'Custom';
  }
  return colors.find((c) => c.id === selectedColorId)?.name || 'Custom';
}

/**
 * Apply color variant to template CSS (preview + PDF/HTML export).
 */
export function applyColorVariant(css: string, colorVariant: ColorVariant): string {
  const lightBg = lightenHex(colorVariant.primary, 0.92);
  const borderColor = lightenHex(colorVariant.primary, 0.65);

  let out = css
    .replace(/--primary-color:\s*[^;]+;/gi, `--primary-color: ${colorVariant.primary};`)
    .replace(/--accent-color:\s*[^;]+;/gi, `--accent-color: ${colorVariant.accent};`)
    .replace(/--text-color:\s*[^;]+;/gi, `--text-color: ${colorVariant.text};`);

  if (/--light-bg:/i.test(out)) {
    out = out.replace(/--light-bg:\s*[^;]+;/gi, `--light-bg: ${lightBg};`);
  }
  if (/--border-color:/i.test(out)) {
    out = out.replace(/--border-color:\s*[^;]+;/gi, `--border-color: ${borderColor};`);
  }

  return out;
}

export const RECENT_COLORS_STORAGE_KEY = 'resume-builder-recent-colors';

export function loadRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_COLORS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return parsed.filter((h) => /^#[0-9A-Fa-f]{6}$/i.test(h)).slice(0, 8);
  } catch {
    return [];
  }
}

export function pushRecentColor(hex: string): string[] {
  const normalized = normalizeHex(hex);
  const prev = loadRecentColors().filter((h) => h.toLowerCase() !== normalized);
  const next = [normalized, ...prev].slice(0, 8);
  if (typeof window !== 'undefined') {
    localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
