'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import TemplateFilters from '@/components/resume-builder/TemplateFilters';
import TemplateGrid from '@/components/resume-builder/TemplateGrid';
import templatesData from '@/lib/resume-builder/templates.json';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';

interface Filters {
  category: string;
  layout: string;
  color: string | null;
}

export default function TemplateGalleryPage() {
  const router = useRouter();
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
    return templatesData.templates.filter((template) => {
      const categoryMatch =
        filters.category === 'All Templates' ||
        template.categories.includes(filters.category);
      
      const layoutMatch =
        filters.layout === 'All' ||
        template.layout === filters.layout;
      
      // Color match - check if any color variant matches
      const colorMatch =
        filters.color === null ||
        (template.colors && template.colors.some((c: any) => c.primary === filters.color)) ||
        template.color === filters.color;

      return categoryMatch && layoutMatch && colorMatch;
    });
  }, [filters]);

  const handleNext = () => {
    if (selectedTemplate) {
      router.push(`/resume-builder/select-type?template=${selectedTemplate}`);
    }
  };

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
                categories={templatesData.filters.categories}
                layouts={templatesData.filters.layouts}
                colors={templatesData.filters.colors}
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
              onSelectTemplate={setSelectedTemplate}
            />

            {/* Next Button */}
            {selectedTemplate && (
              <div className="sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                <Button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
                  size="lg"
                >
                  Next: Choose Resume Type
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

