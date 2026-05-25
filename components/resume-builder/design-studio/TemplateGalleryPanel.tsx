'use client';

/**
 * Design Studio — Templates panel
 *
 * Renders a searchable, filterable list of templates using each template's
 * static thumbnail SVG (already shipped under `public/templates/<id>/`).
 * No iframes here — the heavy live render is reserved for the right-side
 * preview only, so the sidebar stays smooth even with 12+ templates.
 */

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/lib/resume-builder/types';

interface TemplateGalleryPanelProps {
  templates: Template[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export default function TemplateGalleryPanel({
  templates,
  selectedTemplateId,
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
        {filtered.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          const thumb = template.thumbnail || template.preview;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              aria-pressed={isSelected}
              className={cn(
                'design-studio-template-card',
                isSelected && 'design-studio-template-card--selected'
              )}
            >
              <div className="design-studio-template-card__thumb">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={template.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 240px"
                    className="design-studio-template-card__thumb-img"
                    unoptimized
                  />
                ) : (
                  <div className="design-studio-template-card__thumb-fallback">
                    {template.name}
                  </div>
                )}

                {isSelected && (
                  <div className="design-studio-template-card__check">
                    <Check className="h-4 w-4" aria-hidden />
                  </div>
                )}
                {template.recommended && !isSelected && (
                  <div className="design-studio-template-card__badge">
                    <Star className="h-3 w-3" aria-hidden />
                    <span>Recommended</span>
                  </div>
                )}
              </div>
              <div className="design-studio-template-card__meta">
                <p className="design-studio-template-card__name">
                  {template.name}
                </p>
                {template.layout && (
                  <p className="design-studio-template-card__layout">
                    {template.layout}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="design-studio-template-grid__empty">
            No templates match your search.
          </p>
        )}
      </div>
    </div>
  );
}
