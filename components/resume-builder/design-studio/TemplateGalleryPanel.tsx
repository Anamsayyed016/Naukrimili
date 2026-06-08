'use client';

/**
 * Design Studio — Templates panel
 *
 * Sidebar template cards are mini live previews of the user's resume data
 * (same template-loader + GalleryResumePreview pipeline as the public gallery,
 * but always uses real formData — never demo fallbacks).
 */

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/resume-builder/types';
import DesignStudioTemplateCard from '@/components/resume-builder/design-studio/DesignStudioTemplateCard';

interface TemplateGalleryPanelProps {
  templates: Template[];
  selectedTemplateId: string;
  formData: Record<string, unknown>;
  selectedColorId?: string;
  typographyCss?: string;
  onSelect: (templateId: string) => void;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export default function TemplateGalleryPanel({
  templates,
  selectedTemplateId,
  formData,
  selectedColorId,
  typographyCss,
  onSelect,
}: TemplateGalleryPanelProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = useMemo(
    () =>
      ['All', ...unique(templates.flatMap((t) => t.categories ?? []))].filter(
        Boolean
      ),
    [templates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesCategory =
        activeCategory === 'All' ||
        (t.categories ?? []).includes(activeCategory);
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.categories ?? []).join(' ').toLowerCase().includes(q)
      );
    });
  }, [templates, query, activeCategory]);

  return (
    <div className="design-studio-panel design-studio-panel--templates">
      <div className="design-studio-panel__search">
        <Search className="design-studio-panel__search-icon" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          aria-label="Search templates"
          className="design-studio-panel__search-input"
        />
      </div>

      <div
        className="design-studio-chip-row"
        role="tablist"
        aria-label="Template categories"
      >
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'design-studio-chip',
              activeCategory === cat && 'design-studio-chip--active'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="design-studio-template-grid">
        {filtered.map((template) => (
          <DesignStudioTemplateCard
            key={template.id}
            template={template}
            formData={formData}
            isSelected={template.id === selectedTemplateId}
            selectedColorId={selectedColorId}
            typographyCss={typographyCss}
            onSelect={() => onSelect(template.id)}
          />
        ))}

        {filtered.length === 0 && (
          <p className="design-studio-template-grid__empty">
            No templates match your search.
          </p>
        )}
      </div>
    </div>
  );
}
