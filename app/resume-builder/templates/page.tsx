'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TemplateFilters from '@/components/resume-builder/TemplateFilters';
import TemplateGrid from '@/components/resume-builder/TemplateGrid';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import templatesData from '@/lib/resume-builder/templates.json';
import type { Template } from '@/lib/resume-builder/template-loader';

// Prevent static generation
export const dynamic = 'force-dynamic';

interface Filters {
  category: string;
  layout: string;
  color: string | null;
}

export default function TemplateSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsive();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    category: 'All Templates',
    layout: 'All',
    color: null,
  });

  const handleFilterChange = (key: keyof Filters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filter templates based on active filters
  const filteredTemplates = useMemo(() => {
    const templates = (templatesData.templates || []) as Template[];
    
    if (!Array.isArray(templates) || templates.length === 0) {
      return [];
    }
    
    return templates.filter((template) => {
      // Category filter
      const categoryMatch =
        filters.category === 'All Templates' ||
        (Array.isArray(template.categories) && template.categories.includes(filters.category));
      
      // Layout filter
      const layoutMatch =
        filters.layout === 'All' ||
        template.layout === filters.layout;
      
      // Color filter - check if any color variant matches
      const colorMatch =
        filters.color === null ||
        (Array.isArray(template.colors) && template.colors.some((c) => c.id === filters.color || c.primary === filters.color));
      
      return categoryMatch && layoutMatch && colorMatch;
    });
  }, [filters]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // Get type from URL if present, otherwise default to experienced
    const type = searchParams.get('type') || 'experienced';
    // Navigate to form editor with template and type
    router.push(`/resume-builder/editor?template=${templateId}&type=${type}`);
  };

  // Get filter options from templates.json
  const filterOptions = useMemo(() => {
    const templates = (templatesData.templates || []) as Template[];
    const categories = new Set<string>();
    const layouts = new Set<string>();
    const colors = new Set<string>();
    
    templates.forEach((template) => {
      if (Array.isArray(template.categories)) {
        template.categories.forEach((cat) => categories.add(cat));
      }
      if (template.layout) {
        layouts.add(template.layout);
      }
      if (Array.isArray(template.colors)) {
        template.colors.forEach((color) => {
          colors.add(color.id);
        });
      }
    });

    return {
      categories: Array.from(categories).sort(),
      layouts: Array.from(layouts).sort(),
      colors: Array.from(colors).sort(),
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/resume-builder/start')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Choose a Template
          </h1>
          <p className="text-gray-600">
            Select a professional template that matches your style
          </p>
        </div>

        <div className={cn(
          "grid gap-8",
          isMobile ? "grid-cols-1" : "lg:grid-cols-[300px_1fr]"
        )}>
          {/* Filters Sidebar */}
          <div className={cn(
            "space-y-6",
            isMobile && "order-2"
          )}>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <TemplateFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={templatesData.filters?.categories || filterOptions.categories}
                layouts={templatesData.filters?.layouts || filterOptions.layouts}
                colors={filterOptions.colors}
                templates={templatesData.templates as Template[]}
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className={cn(
            "space-y-6",
            isMobile && "order-1"
          )}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <TemplateGrid
              templates={filteredTemplates}
              selectedTemplate={selectedTemplate}
              onSelectTemplate={handleTemplateSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

