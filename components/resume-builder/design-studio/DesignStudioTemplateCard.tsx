'use client';

/**
 * Design Studio sidebar template card — mini live preview with real user data.
 * Reuses GalleryResumePreview + template-loader (same pipeline as public gallery
 * cards) but never falls back to demo content.
 */

import { useEffect, useRef, useState } from 'react';
import { Check, Star } from 'lucide-react';
import type { Template } from '@/lib/resume-builder/types';
import { resolveColorVariant } from '@/lib/resume-builder/color-theme';
import GalleryResumePreview from '@/components/resume-builder/GalleryResumePreview';
import { cn } from '@/lib/utils';

interface DesignStudioTemplateCardProps {
  template: Template;
  formData: Record<string, unknown>;
  isSelected: boolean;
  selectedColorId?: string;
  typographyCss?: string;
  onSelect: () => void;
}

export default function DesignStudioTemplateCard({
  template,
  formData,
  isSelected,
  selectedColorId,
  typographyCss,
  onSelect,
}: DesignStudioTemplateCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (hasEnteredViewport) return;
    const node = cardRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasEnteredViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEnteredViewport(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasEnteredViewport]);

  useEffect(() => {
    if (!hasEnteredViewport) return;

    let mounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        const { loadTemplate, applyColorVariant, injectResumeData } =
          await import('@/lib/resume-builder/template-loader');

        const loaded = await loadTemplate(template.id);
        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${template.id}" not found`);
        }

        const { template: templateMeta, html, css } = loaded;
        const colorId =
          isSelected && selectedColorId
            ? selectedColorId
            : templateMeta.defaultColor || templateMeta.colors[0]?.id;
        const colorVariant = resolveColorVariant(
          templateMeta.colors,
          colorId,
          templateMeta.defaultColor || templateMeta.colors[0]?.id || ''
        );
        const coloredCss = applyColorVariant(css, colorVariant);
        const dataInjectedHtml = injectResumeData(html, formData);

        const fullHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              ${coloredCss}
              ${typographyCss && isSelected ? typographyCss : ''}
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body {
                margin: 0;
                padding: 0;
                overflow: hidden;
                font-size: 10px;
                width: 100%;
                height: 100%;
                position: relative;
              }
              @page {
                size: 8.5in 11in;
                margin: 0;
              }
            </style>
          </head>
          <body>
            ${dataInjectedHtml}
          </body>
          </html>
        `;

        setPreviewHtml(fullHtml);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('[DesignStudioTemplateCard] Preview error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
        setLoading(false);
      }
    }

    loadAndRender();

    return () => {
      mounted = false;
    };
  }, [
    template.id,
    formData,
    hasEnteredViewport,
    isSelected,
    selectedColorId,
    typographyCss,
  ]);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        'design-studio-template-card',
        isSelected && 'design-studio-template-card--selected'
      )}
    >
      <div className="design-studio-template-card__thumb">
        {hasEnteredViewport ? (
          <GalleryResumePreview
            previewHtml={previewHtml}
            loading={loading}
            error={error}
            templateName={template.name}
            iframeRef={iframeRef}
            formData={formData}
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
        <p className="design-studio-template-card__name">{template.name}</p>
        {template.layout && (
          <p className="design-studio-template-card__layout">{template.layout}</p>
        )}
      </div>
    </button>
  );
}
