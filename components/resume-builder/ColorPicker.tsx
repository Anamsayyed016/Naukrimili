'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ColorVariant } from '@/lib/resume-builder/types';

interface ColorPickerProps {
  colors: ColorVariant[];
  selectedColorId: string;
  onColorChange: (colorId: string) => void;
  className?: string;
}

export default function ColorPicker({
  colors,
  selectedColorId,
  onColorChange,
  className,
}: ColorPickerProps) {
  if (!colors || colors.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <Label className="text-sm font-semibold text-gray-900 mb-1 block">Color Scheme</Label>
        <p className="text-xs text-gray-500">Choose a color theme for your resume</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = color.id === selectedColorId;
          return (
            <button
              key={color.id}
              onClick={() => onColorChange(color.id)}
              className={cn(
                "relative w-14 h-14 rounded-xl border-2 transition-all duration-200",
                "hover:scale-110 hover:shadow-lg hover:z-10",
                isSelected
                  ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2 shadow-lg shadow-blue-500/20 scale-105"
                  : "border-gray-300 hover:border-gray-400"
              )}
              style={{ backgroundColor: color.primary }}
              title={color.name}
              aria-label={`Select ${color.name} color`}
            >
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selectedColorId && (
        <div className="pt-2 border-t border-gray-200/50">
          <p className="text-xs font-medium text-gray-700">
            Selected: <span className="text-gray-900">{colors.find((c) => c.id === selectedColorId)?.name || 'Custom'}</span>
          </p>
        </div>
      )}
    </div>
  );
}

