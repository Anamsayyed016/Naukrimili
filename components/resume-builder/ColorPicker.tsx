'use client';

import { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Pipette } from 'lucide-react';
import type { ColorVariant } from '@/lib/resume-builder/types';
import {
  createCustomColorId,
  getColorDisplayLabel,
  isCustomColorId,
  parseCustomColorHex,
} from '@/lib/resume-builder/color-theme';

interface ColorPickerProps {
  colors: ColorVariant[];
  selectedColorId: string;
  onColorChange: (colorId: string) => void;
  className?: string;
  /** Tighter layout for popover toolbar */
  compact?: boolean;
}

function SwatchButton({
  color,
  isSelected,
  onClick,
  title,
}: {
  color: string;
  isSelected: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'resume-color-swatch',
        isSelected && 'resume-color-swatch--selected'
      )}
      style={{ backgroundColor: color }}
      title={title}
      aria-label={title}
      aria-pressed={isSelected}
    />
  );
}

export default function ColorPicker({
  colors,
  selectedColorId,
  onColorChange,
  className,
  compact = false,
}: ColorPickerProps) {
  const nativeInputRef = useRef<HTMLInputElement>(null);

  const customHex = isCustomColorId(selectedColorId)
    ? parseCustomColorHex(selectedColorId) || '#14b8a6'
    : '#14b8a6';

  if (!colors || colors.length === 0) {
    return null;
  }

  const isCustomSelected = isCustomColorId(selectedColorId);

  return (
    <div className={cn('resume-color-picker', compact && 'resume-color-picker--compact', className)}>
      {!compact && (
        <div className="resume-color-picker__header">
          <Label className="text-xs font-semibold text-slate-800">Color scheme</Label>
          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
            Presets or any custom brand color
          </p>
        </div>
      )}

      <div className="resume-color-picker__row">
        {colors.map((color) => (
          <SwatchButton
            key={color.id}
            color={color.primary}
            isSelected={!isCustomSelected && color.id === selectedColorId}
            onClick={() => onColorChange(color.id)}
            title={color.name}
          />
        ))}

        <button
          type="button"
          onClick={() => nativeInputRef.current?.click()}
          className={cn(
            'resume-color-swatch resume-color-swatch--custom',
            isCustomSelected && 'resume-color-swatch--selected'
          )}
          style={{ backgroundColor: customHex }}
          title="Pick custom color"
          aria-label="Pick custom color"
        >
          <Pipette className="w-3 h-3 text-white drop-shadow-sm" aria-hidden />
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
      </div>

      {compact && selectedColorId && (
        <p className="resume-color-picker__selected text-[10px] font-medium text-slate-600 truncate">
          {getColorDisplayLabel(colors, selectedColorId)}
        </p>
      )}

      {!compact && selectedColorId && (
        <p className="resume-color-picker__selected text-[10px] font-medium text-slate-600 truncate">
          Selected:{' '}
          <span className="text-slate-900">
            {getColorDisplayLabel(colors, selectedColorId)}
          </span>
        </p>
      )}
    </div>
  );
}
