'use client';

/**
 * Design Studio — Colors panel
 *
 * Reuses the canonical `ColorPicker` but groups palettes by hue family
 * and ships a live preview swatch so users can compare at a glance.
 * No duplicate color resolution logic — palette data still comes from
 * the template's `colors` array.
 */

import { useMemo, useRef } from 'react';
import { Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorVariant, Template } from '@/lib/resume-builder/types';
import {
  createCustomColorId,
  getColorDisplayLabel,
  isCustomColorId,
  parseCustomColorHex,
} from '@/lib/resume-builder/color-theme';

interface ColorPanelProps {
  template: Template;
  selectedColorId: string;
  onColorChange: (colorId: string) => void;
}

type HueGroup = 'Warm' | 'Cool' | 'Neutral' | 'Bold';

function classifyHue(hex: string): HueGroup {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 18) return 'Neutral';
  if (max === r && r - Math.max(g, b) > 30) return delta > 100 ? 'Bold' : 'Warm';
  if (max === g && g - Math.max(r, b) > 30) return 'Cool';
  if (max === b && b - Math.max(r, g) > 30) return 'Cool';
  if (r > 180 && g > 130 && b < 120) return 'Warm';
  return 'Bold';
}

const GROUP_ORDER: HueGroup[] = ['Warm', 'Cool', 'Neutral', 'Bold'];

export default function ColorPanel({
  template,
  selectedColorId,
  onColorChange,
}: ColorPanelProps) {
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const colors = template.colors ?? [];
  const isCustomSelected = isCustomColorId(selectedColorId);
  const customHex = isCustomSelected
    ? parseCustomColorHex(selectedColorId) || '#14b8a6'
    : '#14b8a6';

  const grouped = useMemo(() => {
    const map: Record<HueGroup, ColorVariant[]> = {
      Warm: [],
      Cool: [],
      Neutral: [],
      Bold: [],
    };
    for (const c of colors) {
      map[classifyHue(c.primary)].push(c);
    }
    return map;
  }, [colors]);

  const selectedLabel = selectedColorId
    ? getColorDisplayLabel(colors, selectedColorId)
    : '';

  return (
    <div className="design-studio-panel design-studio-panel--colors">
      <div className="design-studio-panel__intro">
        <p className="design-studio-panel__title">Palette</p>
        <p className="design-studio-panel__hint">
          Live updates the preview on the right.
        </p>
      </div>

      {GROUP_ORDER.map((group) => {
        const list = grouped[group];
        if (!list || list.length === 0) return null;
        return (
          <section key={group} className="design-studio-color-group">
            <p className="design-studio-color-group__label">{group}</p>
            <div className="design-studio-color-group__row">
              {list.map((color) => {
                const active =
                  !isCustomSelected && color.id === selectedColorId;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => onColorChange(color.id)}
                    title={color.name}
                    aria-label={`${color.name} palette`}
                    aria-pressed={active}
                    className={cn(
                      'design-studio-color-swatch',
                      active && 'design-studio-color-swatch--active'
                    )}
                  >
                    <span
                      className="design-studio-color-swatch__primary"
                      style={{ background: color.primary }}
                    />
                    <span
                      className="design-studio-color-swatch__accent"
                      style={{ background: color.accent }}
                    />
                    <span className="design-studio-color-swatch__name">
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="design-studio-color-custom">
        <p className="design-studio-color-group__label">Custom brand color</p>
        <button
          type="button"
          onClick={() => nativeInputRef.current?.click()}
          className={cn(
            'design-studio-color-custom__trigger',
            isCustomSelected && 'design-studio-color-custom__trigger--active'
          )}
        >
          <span
            className="design-studio-color-custom__preview"
            style={{ background: customHex }}
          >
            <Pipette className="h-3.5 w-3.5 text-white drop-shadow-sm" aria-hidden />
          </span>
          <span className="design-studio-color-custom__copy">
            <span className="design-studio-color-custom__label">
              Pick custom color
            </span>
            <span className="design-studio-color-custom__hex">{customHex.toUpperCase()}</span>
          </span>
        </button>
        <input
          ref={nativeInputRef}
          type="color"
          value={customHex}
          onChange={(e) => onColorChange(createCustomColorId(e.target.value))}
          className="sr-only"
          aria-hidden
          tabIndex={-1}
        />
      </section>

      {selectedLabel && (
        <p className="design-studio-color-selected">
          Selected: <span>{selectedLabel}</span>
        </p>
      )}
    </div>
  );
}
