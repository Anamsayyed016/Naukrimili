'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ColorVariant } from '@/lib/resume-builder/template-loader';

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
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm font-medium text-gray-700">Color Scheme</Label>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = color.id === selectedColorId;
          return (
            <button
              key={color.id}
              onClick={() => onColorChange(color.id)}
              className={cn(
                "relative w-12 h-12 rounded-lg border-2 transition-all",
                "hover:scale-110 hover:shadow-md",
                isSelected
                  ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2"
                  : "border-gray-300 hover:border-gray-400"
              )}
              style={{ backgroundColor: color.primary }}
              title={color.name}
              aria-label={`Select ${color.name} color`}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {selectedColorId && (
        <p className="text-xs text-gray-500">
          {colors.find((c) => c.id === selectedColorId)?.name || 'Custom'}
        </p>
      )}
    </div>
  );
}

