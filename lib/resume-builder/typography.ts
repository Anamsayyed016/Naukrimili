/**
 * Resume Builder Typography
 *
 * Lightweight typography overrides applied on top of any template.
 * Single source of truth shared by:
 *   - LivePreview (via `customCss`)
 *   - Editor preview wrapper
 *   - resume-export (PDF/HTML download)
 *
 * Persisted inside `formData.__typography` so it auto-saves with the rest
 * of the resume and travels through the existing template-change flow.
 *
 * IMPORTANT: Defaults are no-ops — when typography is `null`/undefined the
 * template's own CSS is used unchanged. This guarantees existing templates
 * keep rendering exactly the same when the user hasn't customized anything.
 */

export type TypographyFontFamily =
  | 'template-default'
  | 'inter'
  | 'plus-jakarta-sans'
  | 'roboto'
  | 'open-sans'
  | 'lato'
  | 'source-sans-pro'
  | 'merriweather'
  | 'playfair-display'
  | 'georgia'
  | 'libre-baskerville';

export interface TypographyOverrides {
  fontFamily: TypographyFontFamily;
  bodyFontSize: number; // multiplier 0.85 – 1.2
  headingWeight: 400 | 500 | 600 | 700 | 800;
  lineSpacing: number; // multiplier 0.9 – 1.5
  sectionSpacing: number; // multiplier 0.8 – 1.3
}

export const DEFAULT_TYPOGRAPHY: TypographyOverrides = {
  fontFamily: 'template-default',
  bodyFontSize: 1,
  headingWeight: 700,
  lineSpacing: 1,
  sectionSpacing: 1,
};

const FONT_STACKS: Record<TypographyFontFamily, string | null> = {
  'template-default': null,
  inter:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  'plus-jakarta-sans':
    "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  roboto:
    "Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  'open-sans':
    "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  lato:
    "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  'source-sans-pro':
    "'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  merriweather:
    "Merriweather, Georgia, 'Times New Roman', Times, serif",
  'playfair-display':
    "'Playfair Display', Georgia, 'Times New Roman', Times, serif",
  georgia: "Georgia, 'Times New Roman', Times, serif",
  'libre-baskerville':
    "'Libre Baskerville', Georgia, 'Times New Roman', Times, serif",
};

export const FONT_FAMILY_OPTIONS: ReadonlyArray<{
  value: TypographyFontFamily;
  label: string;
  family: 'sans' | 'serif' | 'system';
}> = [
  { value: 'template-default', label: 'Template default', family: 'system' },
  { value: 'inter', label: 'Inter', family: 'sans' },
  { value: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', family: 'sans' },
  { value: 'roboto', label: 'Roboto', family: 'sans' },
  { value: 'open-sans', label: 'Open Sans', family: 'sans' },
  { value: 'lato', label: 'Lato', family: 'sans' },
  { value: 'source-sans-pro', label: 'Source Sans Pro', family: 'sans' },
  { value: 'merriweather', label: 'Merriweather', family: 'serif' },
  { value: 'playfair-display', label: 'Playfair Display', family: 'serif' },
  { value: 'georgia', label: 'Georgia', family: 'serif' },
  { value: 'libre-baskerville', label: 'Libre Baskerville', family: 'serif' },
];

const TYPOGRAPHY_KEY = '__typography';

export function readTypographyFromFormData(
  formData: Record<string, unknown> | null | undefined
): TypographyOverrides | null {
  if (!formData) return null;
  const raw = (formData as Record<string, unknown>)[TYPOGRAPHY_KEY];
  if (!raw || typeof raw !== 'object') return null;
  return normalizeTypography(raw as Partial<TypographyOverrides>);
}

export function writeTypographyToFormData(
  formData: Record<string, unknown>,
  next: TypographyOverrides | null
): Record<string, unknown> {
  const cloned = { ...formData };
  if (next === null) {
    delete cloned[TYPOGRAPHY_KEY];
  } else {
    cloned[TYPOGRAPHY_KEY] = normalizeTypography(next);
  }
  return cloned;
}

export function normalizeTypography(
  partial: Partial<TypographyOverrides>
): TypographyOverrides {
  const fontFamily: TypographyFontFamily =
    partial.fontFamily && partial.fontFamily in FONT_STACKS
      ? (partial.fontFamily as TypographyFontFamily)
      : DEFAULT_TYPOGRAPHY.fontFamily;

  const clampNum = (val: unknown, min: number, max: number, fallback: number) => {
    const n = typeof val === 'number' ? val : Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(Math.max(n, min), max);
  };

  const headingWeight = ([400, 500, 600, 700, 800] as const).includes(
    partial.headingWeight as 400 | 500 | 600 | 700 | 800
  )
    ? (partial.headingWeight as 400 | 500 | 600 | 700 | 800)
    : DEFAULT_TYPOGRAPHY.headingWeight;

  return {
    fontFamily,
    bodyFontSize: clampNum(partial.bodyFontSize, 0.85, 1.2, 1),
    headingWeight,
    lineSpacing: clampNum(partial.lineSpacing, 0.9, 1.5, 1),
    sectionSpacing: clampNum(partial.sectionSpacing, 0.8, 1.3, 1),
  };
}

export function isTypographyChanged(t: TypographyOverrides | null): boolean {
  if (!t) return false;
  return (
    t.fontFamily !== DEFAULT_TYPOGRAPHY.fontFamily ||
    t.bodyFontSize !== DEFAULT_TYPOGRAPHY.bodyFontSize ||
    t.headingWeight !== DEFAULT_TYPOGRAPHY.headingWeight ||
    t.lineSpacing !== DEFAULT_TYPOGRAPHY.lineSpacing ||
    t.sectionSpacing !== DEFAULT_TYPOGRAPHY.sectionSpacing
  );
}

/**
 * Build a CSS block that overrides typography inside the resume container.
 *
 * Returns `''` when typography matches defaults so we never inject unnecessary
 * CSS — keeps every existing template byte-identical for users who haven't
 * customized anything.
 *
 * Scoped to `.resume-container` so it cannot leak into iframe chrome or the
 * surrounding editor UI.
 */
export function buildTypographyCss(
  typography: TypographyOverrides | null | undefined
): string {
  if (!typography || !isTypographyChanged(typography)) return '';

  const t = normalizeTypography(typography);
  const fontStack = FONT_STACKS[t.fontFamily];
  const baseLine = 1.5 * t.lineSpacing;
  const headingLine = Math.max(1.1, 1.25 * Math.min(t.lineSpacing, 1.2));

  return `
/* ── Resume typography overrides (Design Studio) ── */
.resume-container,
.resume-container * {
  line-height: ${baseLine.toFixed(3)};
}
${
  fontStack
    ? `.resume-container,
.resume-container p,
.resume-container li,
.resume-container span,
.resume-container div {
  font-family: ${fontStack} !important;
}`
    : ''
}
.resume-container {
  font-size: ${(100 * t.bodyFontSize).toFixed(2)}% !important;
}
.resume-container h1,
.resume-container h2,
.resume-container h3,
.resume-container h4,
.resume-container h5,
.resume-container h6,
.resume-container .section-title,
.resume-container .resume-name {
  font-weight: ${t.headingWeight} !important;
  line-height: ${headingLine.toFixed(3)};
${fontStack ? `  font-family: ${fontStack} !important;` : ''}
}
.resume-container section,
.resume-container .section,
.resume-container .resume-section {
  margin-bottom: calc(1.25em * ${t.sectionSpacing.toFixed(3)}) !important;
}
`.trim();
}
