'use client';

import TemplateCard from './TemplateCard';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/components/ui/use-mobile';

interface Template {
  id: string;
  name: string;
  categories: string[];
  layout: string;
  color: string;
  previewImage: string;
  recommended: boolean;
  description: string;
}

interface TemplateGridProps {
  templates: Template[];
  selectedTemplate: string | null;
  onSelectTemplate: (templateId: string) => void;
}

export default function TemplateGrid({
  templates,
  selectedTemplate,
  onSelectTemplate,
}: TemplateGridProps) {
  const { isMobile, isTablet } = useResponsive();

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No templates found matching your filters.</p>
      </div>
    );
  }

  if (!Array.isArray(templates) || templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No templates found matching your filters.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-6",
        isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-3"
      )}
    >
      {templates.map((template) => (
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

