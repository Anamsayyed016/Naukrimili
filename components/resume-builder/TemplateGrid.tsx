'use client';

import { useMemo } from 'react';
import TemplateCard from './TemplateCard';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';
import type { Template } from '@/lib/resume-builder/types';

interface TemplateGridProps {
  templates: Template[];
  selectedTemplate: string | null;
  onSelectTemplate: (templateId: string) => void;
  variant?: 'default' | 'sidebar'; // Add variant prop
}

export default function TemplateGrid({
  templates,
  selectedTemplate,
  onSelectTemplate,
  variant = 'default',
}: TemplateGridProps) {
  const { isMobile, isTablet } = useResponsive();

  // Sort templates: recommended first, then by name
  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [templates]);

  if (sortedTemplates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No templates found matching your filters.</p>
        <p className="text-sm text-gray-400">Try adjusting your filter criteria.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-6",
        variant === 'sidebar'
          ? "grid-cols-1" // Force single column for sidebar
          : isMobile
          ? "grid-cols-1"
          : isTablet
          ? "grid-cols-2"
          : "grid-cols-2 lg:grid-cols-3"
      )}
    >
      {sortedTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedTemplate === template.id}
          onSelect={onSelectTemplate}
        />
      ))}
    </div>
  );
}

