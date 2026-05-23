'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { LoadedTemplate, ColorVariant, Template } from '@/lib/resume-builder/types';
import { cn } from '@/lib/utils';
import { Check, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useResponsive } from '@/components/ui/use-mobile';
import GalleryPagination from '@/components/resume-builder/GalleryPagination';
import {
  clampPage,
  getGalleryPageSize,
  getTotalPages,
  paginateItems,
} from '@/lib/resume-builder/gallery-pagination';
import {
  buildGallerySampleFormData,
  getGalleryCardAccent,
  isGalleryEmptyFormData,
} from '@/lib/resume-builder/gallery-demo';
import GalleryResumePreview from '@/components/resume-builder/GalleryResumePreview';

interface TemplatePreviewGalleryProps {
  templates: Template[];
  formData: Record<string, unknown>;
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
}

export default function TemplatePreviewGallery({
  templates,
  formData,
  selectedTemplateId,
  onTemplateSelect,
}: TemplatePreviewGalleryProps) {
  const { isMobile } = useResponsive();
  const pageSize = getGalleryPageSize(isMobile);
  const [currentPage, setCurrentPage] = useState(1);
  const galleryTopRef = useRef<HTMLDivElement>(null);

  const totalPages = getTotalPages(templates.length, pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [templates, pageSize]);

  useEffect(() => {
    setCurrentPage((prev) => clampPage(prev, totalPages));
  }, [totalPages]);

  const paginatedTemplates = useMemo(
    () => paginateItems(templates, currentPage, pageSize),
    [templates, currentPage, pageSize]
  );

  const handlePageChange = (page: number) => {
    const nextPage = clampPage(page, totalPages);
    setCurrentPage(nextPage);
    requestAnimationFrame(() => {
      galleryTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  if (templates.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Template Gallery</h3>
        <p className="text-sm text-gray-600 mb-6">
          See how your resume looks in different templates. Click any template to start editing.
        </p>
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No templates found matching your filters.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={galleryTopRef}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Template Gallery</h3>
          <p className="text-sm text-gray-600">
            See how your resume looks in different templates. Click any template to start editing.
          </p>
        </div>
        {templates.length > pageSize && (
          <p className="text-xs text-gray-500 tabular-nums shrink-0">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      <div
        key={`gallery-page-${currentPage}`}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 animate-in fade-in duration-300"
      >
        {paginatedTemplates.map((template) => (
          <EnhancedTemplateCard
            key={template.id}
            template={template}
            formData={formData}
            isSelected={selectedTemplateId === template.id}
            onSelect={() => onTemplateSelect(template.id)}
          />
        ))}
      </div>

      <GalleryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={templates.length}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        className="pt-4 border-t border-gray-100"
      />
    </div>
  );
}

interface EnhancedTemplateCardProps {
  template: Template;
  formData: Record<string, unknown>;
  isSelected: boolean;
  onSelect: () => void;
}

function EnhancedTemplateCard({
  template,
  formData,
  isSelected,
  onSelect,
}: EnhancedTemplateCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [useImagePreview, setUseImagePreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Gallery always uses HTML preview so demo profile + all sections render (static SVG thumbs have no photo)
  useEffect(() => {
    setUseImagePreview(false);
    setImageError(false);
  }, [template.id]);

  // Load live preview if image not available
  useEffect(() => {
    if (useImagePreview) return;

    let mounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import template-loader functions to avoid module initialization issues
        const { loadTemplate, applyColorVariant, injectResumeData } = await import('@/lib/resume-builder/template-loader');

        const loaded: LoadedTemplate | null = await loadTemplate(template.id);
        
        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${template.id}" not found`);
        }

        const { template: templateMeta, html, css } = loaded;
        const colorVariant = templateMeta.colors.find((c: ColorVariant) => c.id === templateMeta.defaultColor) || templateMeta.colors[0];
        const coloredCss = applyColorVariant(css, colorVariant);
        
        const previewData = isGalleryEmptyFormData(formData)
          ? buildGallerySampleFormData(template.id)
          : formData;

        const dataInjectedHtml = injectResumeData(html, previewData, {
          galleryPreview: true,
          galleryTemplateId: template.id,
        });

        const fullHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              ${coloredCss}
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
              body {
                -webkit-overflow-scrolling: touch;
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
        console.error('Error loading preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
        setLoading(false);
      }
    }

    loadAndRender();

    return () => {
      mounted = false;
    };
  }, [template.id, formData, useImagePreview]);

  const cardAccent = getGalleryCardAccent(template.id);

  const handleImageError = () => {
    console.log(`[TemplatePreview] Image failed to load for ${template.id}, falling back to HTML/CSS preview`);
    setImageError(true);
    setUseImagePreview(false);
    setLoading(true);
    // Trigger HTML/CSS loading by setting useImagePreview to false
    // The useEffect will handle the loading
  };

  return (
    <div className="flex w-full flex-col">
      <div
        onClick={onSelect}
        className={cn(
          'relative group cursor-pointer w-full rounded-2xl transition-all duration-300',
          'bg-white shadow-md hover:shadow-xl',
          'border border-gray-200/50 overflow-hidden',
          cardAccent.borderTint,
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl' : ''
        )}
      >
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none z-0 opacity-80"
          style={{ background: cardAccent.glow }}
          aria-hidden
        />
        <div
          className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full pointer-events-none z-0 opacity-50"
          style={{ background: cardAccent.glowSecondary }}
          aria-hidden
        />

        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 z-20">
            <div className="bg-blue-600 rounded-full p-1.5 shadow-lg">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        {/* Recommended Badge */}
        {template.recommended && !isSelected && (
          <div className="absolute top-2 right-2 z-20">
            <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              ★ Recommended
            </div>
          </div>
        )}

        {/* Preview Container - Clean White Background */}
        <div className="relative w-full aspect-[8.5/11] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-inner">
        {useImagePreview && (template.preview || template.thumbnail) && !imageError ? (
          <div className="absolute inset-0">
            <Image
              src={template.preview || template.thumbnail || ''}
              alt={template.name}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              onError={handleImageError}
              unoptimized
              priority={false}
            />
          </div>
        ) : (
          <GalleryResumePreview
            previewHtml={previewHtml}
            loading={loading}
            error={error}
            templateName={template.name}
            iframeRef={iframeRef}
          />
        )}
        </div>

        {/* Hover Overlay - Subtle */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t via-transparent to-transparent',
            cardAccent.hoverOverlay,
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
            'flex items-end justify-center pb-8 z-10 rounded-2xl pointer-events-none'
          )}
        >
          <div className={cn(
            "text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-300 pointer-events-auto",
            "group-hover:translate-y-0 translate-y-2",
            isSelected ? "bg-blue-600/95" : "bg-blue-600/90"
          )}>
            {isSelected ? '✓ Selected' : 'Click to Edit'}
          </div>
        </div>
      </div>

      {/* Template Name & Label - Below Card */}
      <div className="mt-3 w-full px-1 text-center">
        <h4 className={cn(
          "text-lg font-semibold transition-colors duration-300",
          isSelected ? "text-blue-600" : "text-gray-900"
        )}>
          {template.name}
        </h4>
        {template.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
        )}
        {/* Categories - Subtle Tags */}
        {template.categories && template.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            {template.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
              >
                {category}
              </span>
            ))}
            {template.layout && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                {template.layout}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
