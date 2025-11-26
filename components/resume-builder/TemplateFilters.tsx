'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/resume-builder/types';

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
}: TemplateFiltersProps) {

  return (
    <div className="space-y-8">
      <h2 className="text-base font-semibold text-gray-900">Filters</h2>

      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-900">Category</Label>
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onFilterChange('category', category)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-normal transition-colors",
                filters.category === category
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-900">Layout</Label>
        <div className="space-y-1">
          {layouts.map((layout) => (
            <button
              key={layout}
              onClick={() => onFilterChange('layout', layout)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-normal transition-colors",
                filters.layout === layout
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

