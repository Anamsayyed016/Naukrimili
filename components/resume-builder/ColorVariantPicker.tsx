'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColorVariant } from '@/lib/resume-builder/template-loader';

interface ColorVariantPickerProps {
  colors: ColorVariant[];
  selectedColorId: string;
  onColorChange: (colorId: string) => void;
  className?: string;
}

export default function ColorVariantPicker({
  colors,
  selectedColorId,
  onColorChange,
  className,
}: ColorVariantPickerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold text-gray-700">Color Theme</h3>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color.id}
            onClick={() => onColorChange(color.id)}
            className={cn(
              'relative w-10 h-10 rounded-full border-2 transition-all',
              'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              selectedColorId === color.id
                ? 'ring-2 ring-blue-600 ring-offset-2 scale-110'
                : 'border-gray-300 hover:border-gray-400'
            )}
            style={{ backgroundColor: color.primary }}
            aria-label={color.name}
            title={color.name}
          >
            {selectedColorId === color.id && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Selected: {colors.find((c) => c.id === selectedColorId)?.name || 'Default'}
      </p>
    </div>
  );
}

