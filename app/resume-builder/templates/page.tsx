'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TemplateFilters from '@/components/resume-builder/TemplateFilters';
import TemplatePreviewGallery from '@/components/resume-builder/TemplatePreviewGallery';
import PersonalInfoStep from '@/components/resume-builder/steps/PersonalInfoStep';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import templatesData from '@/lib/resume-builder/templates.json';
import resumeTypesData from '@/lib/resume-builder/resume-types.json';
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
  const typeId = searchParams.get('type') || 'experienced';

  // Template filters state
  const [filters, setFilters] = useState<Filters>({
    category: 'All Templates',
    layout: 'All',
    color: null,
  });

  // Form state for template previews
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [experienceLevel, setExperienceLevel] = useState<string>('experienced');

  // Determine experience level from typeId
  useEffect(() => {
    if (typeId) {
      const resumeType = resumeTypesData.resumeTypes.find((type: any) => type.id === typeId);
      if (resumeType) {
        if (resumeType.id === 'fresher' || resumeType.id === 'student') {
          setExperienceLevel('fresher');
        } else if (resumeType.id === 'senior') {
          setExperienceLevel('senior');
        } else {
          setExperienceLevel('experienced');
        }
        setFormData((prev) => ({ ...prev, experienceLevel: resumeType.id }));
      }
    } else {
      setExperienceLevel('experienced');
      setFormData((prev) => ({ ...prev, experienceLevel: 'experienced' }));
    }
  }, [typeId]);

  const handleFilterChange = (key: keyof Filters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filter templates based on active filters
  const filteredTemplates = useMemo(() => {
    const templates = (templatesData.templates || []) as Template[];
    
    if (!Array.isArray(templates) || templates.length === 0) {
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
  }, [filters]);

  const handleTemplateSelect = (templateId: string) => {
    // Save current form data before navigating
    const resumeType = typeId || 'experienced';
    const saveKey = `resume-builder-${templateId}-${resumeType}`;
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(saveKey, JSON.stringify(formData));
    }
    
    // Navigate directly to editor with selected template
    router.push(`/resume-builder/editor?template=${templateId}&type=${typeId}`);
  };

  // Get filter options from templates.json
  const filterOptions = useMemo(() => {
    const templates = (templatesData.templates || []) as Template[];
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
  }, []);

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
              Fill out your information and see how it looks in different templates
            </p>
          </div>
        </div>

        {/* Main Layout: Filters Sidebar + Form + Template Gallery */}
        <div className={cn(
          "grid gap-6 lg:gap-8",
          isMobile ? "grid-cols-1" : "lg:grid-cols-[280px_1fr_1fr]"
        )}>
          {/* Left Side - Filters Sidebar */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <TemplateFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={['All Templates', ...filterOptions.categories]}
                layouts={['All', ...filterOptions.layouts]}
                colors={[]}
                templates={templatesData.templates as Template[]}
              />
            </div>
          </div>

          {/* Middle - Form Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:p-8">
            <PersonalInfoStep
              formData={formData}
              onFieldChange={handleFieldChange}
            />
          </div>

          {/* Right Side - Template Gallery with Live Previews */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <TemplatePreviewGallery
              templates={filteredTemplates}
              formData={formData}
              selectedTemplateId={null}
              onTemplateSelect={handleTemplateSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
