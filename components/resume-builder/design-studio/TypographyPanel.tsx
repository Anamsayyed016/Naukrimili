'use client';

/**
 * Design Studio — Typography panel
 *
 * Light surface that edits the typography overrides persisted inside
 * `formData.__typography`. The actual CSS is built in
 * `lib/resume-builder/typography.ts` and applied by both LivePreview
 * (preview) and resume-export (PDF) so a single source of truth governs
 * how typography is rendered everywhere.
 */

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  DEFAULT_TYPOGRAPHY,
  FONT_FAMILY_OPTIONS,
  isTypographyChanged,
  type TypographyFontFamily,
  type TypographyOverrides,
} from '@/lib/resume-builder/typography';

interface TypographyPanelProps {
  typography: TypographyOverrides;
  onChange: (next: TypographyOverrides) => void;
  onReset: () => void;
}

const HEADING_WEIGHTS = [400, 500, 600, 700, 800] as const;

export default function TypographyPanel({
  typography,
  onChange,
  onReset,
}: TypographyPanelProps) {
  const changed = isTypographyChanged(typography);

  return (
    <div className="design-studio-panel design-studio-panel--typography">
      <div className="design-studio-panel__intro">
        <p className="design-studio-panel__title">Typography</p>
        <p className="design-studio-panel__hint">
          Applies to live preview and exported PDF.
        </p>
      </div>

      <div className="design-studio-field">
        <Label htmlFor="design-studio-font-family" className="design-studio-field__label">
          Font family
        </Label>
        <select
          id="design-studio-font-family"
          value={typography.fontFamily}
          onChange={(e) =>
            onChange({
              ...typography,
              fontFamily: e.target.value as TypographyFontFamily,
            })
          }
          className="design-studio-field__select"
        >
          {FONT_FAMILY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.family === 'serif' ? '  (serif)' : ''}
              {opt.family === 'sans' ? '  (sans)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="design-studio-field">
        <Label className="design-studio-field__label">Heading weight</Label>
        <div className="design-studio-field__chip-row">
          {HEADING_WEIGHTS.map((w) => {
            const active = typography.headingWeight === w;
            return (
              <button
                key={w}
                type="button"
                onClick={() => onChange({ ...typography, headingWeight: w })}
                aria-pressed={active}
                className={cn(
                  'design-studio-chip design-studio-chip--weight',
                  active && 'design-studio-chip--active'
                )}
                style={{ fontWeight: w }}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>

      <SliderField
        label="Body font size"
        value={typography.bodyFontSize}
        min={0.85}
        max={1.2}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => onChange({ ...typography, bodyFontSize: v })}
      />

      <SliderField
        label="Line spacing"
        value={typography.lineSpacing}
        min={0.9}
        max={1.5}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => onChange({ ...typography, lineSpacing: v })}
      />

      <SliderField
        label="Section spacing"
        value={typography.sectionSpacing}
        min={0.8}
        max={1.3}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => onChange({ ...typography, sectionSpacing: v })}
      />

      <button
        type="button"
        onClick={onReset}
        disabled={!changed}
        className="design-studio-typography-reset"
      >
        Reset to defaults
      </button>

      <p className="design-studio-typography-footnote">
        Typography overrides save with your resume and apply to PDF export.
      </p>

      {/* Force-import default to keep tree-shaker happy when referenced via reset */}
      <span hidden aria-hidden>
        {DEFAULT_TYPOGRAPHY.fontFamily}
      </span>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderFieldProps) {
  return (
    <div className="design-studio-field">
      <div className="design-studio-field__row">
        <Label className="design-studio-field__label">{label}</Label>
        <span className="design-studio-field__value">{format(value)}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="design-studio-field__slider"
      />
    </div>
  );
}
