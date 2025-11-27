'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ChevronDown, Filter } from 'lucide-react';
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
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  return (
    <>
      {/* Desktop: Horizontal Filter Bar */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Category Filter - Horizontal */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Category:</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onFilterChange('category', category)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    filters.category === category
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Filter - Horizontal */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-300">
            <Label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Layout:</Label>
            <div className="flex flex-wrap gap-2">
              {layouts.map((layout) => (
                <button
                  key={layout}
                  onClick={() => onFilterChange('layout', layout)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    filters.layout === layout
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {layout}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Dropdown Filter */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">Filters</span>
            {(filters.category !== 'All Templates' || filters.layout !== 'All') && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                Active
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-gray-600 transition-transform duration-200",
              mobileFilterOpen && "transform rotate-180"
            )}
          />
        </button>

        {mobileFilterOpen && (
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-6">
            {/* Category Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900">Category</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => onFilterChange('category', category)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      filters.category === category
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-900">Layout</Label>
              <div className="flex flex-wrap gap-2">
                {layouts.map((layout) => (
                  <button
                    key={layout}
                    onClick={() => onFilterChange('layout', layout)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      filters.layout === layout
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {layout}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </>
  );
}

