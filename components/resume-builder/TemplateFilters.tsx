'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';

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
}

export default function TemplateFilters({
  filters,
  onFilterChange,
  categories,
  layouts,
  colors,
}: TemplateFiltersProps) {
  const { isMobile } = useResponsive();

  const handleCategoryClick = (category: string) => {
    onFilterChange('category', category === filters.category ? 'All Templates' : category);
  };

  const handleColorClick = (color: string) => {
    onFilterChange('color', color === filters.color ? null : color);
  };

  const clearFilters = () => {
    onFilterChange('category', 'All Templates');
    onFilterChange('layout', 'All');
    onFilterChange('color', null);
  };

  const hasActiveFilters = filters.category !== 'All Templates' || 
                          filters.layout !== 'All' || 
                          filters.color !== null;

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">Category</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(categories) && categories.length > 0 ? categories.map((category) => (
            <Badge
              key={category}
              variant={filters.category === category ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all",
                filters.category === category && "bg-blue-600 text-white hover:bg-blue-700"
              )}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </Badge>
          )) : (
            <p className="text-sm text-gray-500">No categories available</p>
          )}
        </div>
      </div>

      {/* Layout and Color Filters */}
      <div className={cn(
        "flex gap-4",
        isMobile ? "flex-col" : "flex-row"
      )}>
        {/* Layout Dropdown */}
        <div className="flex-1">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Layout</label>
          <Select
            value={filters.layout}
            onValueChange={(value) => onFilterChange('layout', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Layouts" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(layouts) && layouts.length > 0 ? layouts.map((layout) => (
                <SelectItem key={layout} value={layout}>
                  {layout}
                </SelectItem>
              )) : (
                <SelectItem value="All" disabled>No layouts available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Color Filter */}
        <div className="flex-1">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(colors) && colors.length > 0 ? colors.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  filters.color === color && "ring-2 ring-blue-600 ring-offset-2 scale-110"
                )}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            )) : (
              <p className="text-xs text-gray-500">No colors available</p>
            )}
            {filters.color && (
              <button
                onClick={() => onFilterChange('color', null)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100"
                aria-label="Clear color filter"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="w-full sm:w-auto"
        >
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

