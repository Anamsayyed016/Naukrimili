'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Template, ColorVariant } from '@/lib/resume-builder/template-loader';

interface Filters {
  category: string;
  layout: string;
  color: string | null;
}

interface TemplateFiltersProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string | null) => void;
  categories: string[];
  layouts: string[];
  colors: string[];
  templates: Template[];
}

export default function TemplateFilters({
  filters,
  onFilterChange,
  categories,
  layouts,
  colors,
  templates,
}: TemplateFiltersProps) {
  // Get color names from templates
  const getColorName = (colorId: string): string => {
    for (const template of templates) {
      const color = template.colors?.find((c: ColorVariant) => c.id === colorId);
      if (color) return color.name;
    }
    return colorId;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Filters</h2>

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Category</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onFilterChange('category', category)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                filters.category === category
                  ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Layout</Label>
        <div className="space-y-2">
          {layouts.map((layout) => (
            <button
              key={layout}
              onClick={() => onFilterChange('layout', layout)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                filters.layout === layout
                  ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent"
              )}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      {/* Color Filter */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Color</Label>
          <div className="space-y-2">
            <button
              onClick={() => onFilterChange('color', null)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                filters.color === null
                  ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent"
              )}
            >
              All Colors
            </button>
            {colors.map((colorId) => {
              const colorName = getColorName(colorId);
              // Find color from templates to get actual color value
              let colorValue = '#000000';
              for (const template of templates) {
                const color = template.colors?.find((c: ColorVariant) => c.id === colorId);
                if (color) {
                  colorValue = color.primary;
                  break;
                }
              }
              
              return (
                <button
                  key={colorId}
                  onClick={() => onFilterChange('color', colorId)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                    filters.color === colorId
                      ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent"
                  )}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: colorValue }}
                  />
                  <span>{colorName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {(filters.category !== 'All Templates' || filters.layout !== 'All' || filters.color !== null) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onFilterChange('category', 'All Templates');
            onFilterChange('layout', 'All');
            onFilterChange('color', null);
          }}
          className="w-full"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}

