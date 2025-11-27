'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TemplateFilters from '@/components/resume-builder/TemplateFilters';
import TemplatePreviewGallery from '@/components/resume-builder/TemplatePreviewGallery';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import type { Template } from '@/lib/resume-builder/types';

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
  const typeId = searchParams.get('type') || 'experienced';
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Lazy load templates data to avoid module initialization issues
  useEffect(() => {
    import('@/lib/resume-builder/templates.json').then((templatesData) => {
      setTemplates((templatesData.default.templates || []) as Template[]);
      setTemplatesLoaded(true);
    });
  }, []);

  // Template filters state
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
    if (!templatesLoaded || !Array.isArray(templates) || templates.length === 0) {
      return [];
    }
    
    return templates.filter((template) => {
      const categoryMatch =
        filters.category === 'All Templates' ||
        (Array.isArray(template.categories) && template.categories.includes(filters.category));
      
      const layoutMatch =
        filters.layout === 'All' ||
        template.layout === filters.layout;
      
      return categoryMatch && layoutMatch;
    });
  }, [filters, templates, templatesLoaded]);

  const handleTemplateSelect = (templateId: string) => {
    // Editor temporarily disabled - show alert instead of navigating
    alert(`Template "${templateId}" selected. Editor is temporarily disabled for diagnostic purposes.`);
    // router.push(`/resume-builder/editor?template=${templateId}&type=${typeId}`);
  };

  // Get filter options from templates.json
  const filterOptions = useMemo(() => {
    if (!templatesLoaded || !Array.isArray(templates) || templates.length === 0) {
      return {
        categories: [],
        layouts: [],
      };
    }
    
    const categories = new Set<string>();
    const layouts = new Set<string>();
    
    templates.forEach((template) => {
      if (Array.isArray(template.categories)) {
        template.categories.forEach((cat) => categories.add(cat));
      }
      if (template.layout) {
        layouts.add(template.layout);
      }
    });

    return {
      categories: Array.from(categories).sort(),
      layouts: Array.from(layouts).sort(),
    };
  }, [templates, templatesLoaded]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/resume-builder/start')}
            className="mb-4 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Choose Your Resume Template
            </h1>
            <p className="text-gray-600">
              Select a template that best fits your style and career
            </p>
          </div>
        </div>

        {/* Filters - Horizontal on Desktop, Dropdown on Mobile */}
        <div className="mb-6">
          <TemplateFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={['All Templates', ...filterOptions.categories]}
            layouts={['All', ...filterOptions.layouts]}
            colors={[]}
            templates={templates}
          />
        </div>

        {/* Template Gallery */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <TemplatePreviewGallery
            templates={filteredTemplates}
            formData={{}}
            selectedTemplateId={null}
            onTemplateSelect={handleTemplateSelect}
          />
        </div>
      </div>
    </div>
  );
}
