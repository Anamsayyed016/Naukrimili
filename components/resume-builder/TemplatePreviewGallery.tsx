'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { LoadedTemplate, ColorVariant, Template } from '@/lib/resume-builder/types';
import { cn } from '@/lib/utils';
import { Check, Sparkles, Crown } from 'lucide-react';
import Image from 'next/image';
import {
  buildGallerySampleFormData,
  getGalleryCardAccent,
  isGalleryEmptyFormData,
} from '@/lib/resume-builder/gallery-demo';
import GalleryResumePreview from '@/components/resume-builder/GalleryResumePreview';

type TemplateLockState = 'open' | 'locked' | 'upgrade' | 'slot_used';

interface TemplatePreviewGalleryProps {
  templates: Template[];
  formData: Record<string, unknown>;
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
  templateLockStates?: Record<string, TemplateLockState>;
  onLockedTemplateSelect?: (templateId: string, lockState: TemplateLockState) => void;
}

/**
 * Continuous template gallery — every template rendered in a single responsive
 * grid. Pagination was intentionally removed for a smoother browsing flow.
 *
 * Per-card preview iframes are still lazy: each card only kicks off its
 * `template-loader` import + iframe write once it enters the viewport (see
 * `EnhancedTemplateCard` below). This keeps initial paint cost in line with
 * the previous paginated version on lower-end devices.
 */
export default function TemplatePreviewGallery({
  templates,
  formData,
  selectedTemplateId,
  onTemplateSelect,
  templateLockStates,
  onLockedTemplateSelect,
}: TemplatePreviewGalleryProps) {
  // Stable identity for the memoised template list so card identity is
  // preserved across re-renders that don't actually change the array contents.
  const galleryTemplates = useMemo(() => templates, [templates]);

  if (galleryTemplates.length === 0) {
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
    <div className="space-y-4">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Template Gallery</h3>
        <p className="text-sm text-gray-600">
          See how your resume looks in different templates. Click any template to start editing.
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 animate-in fade-in duration-300"
      >
        {galleryTemplates.map((template) => (
          <EnhancedTemplateCard
            key={template.id}
            template={template}
            formData={formData}
            isSelected={selectedTemplateId === template.id}
            lockState={templateLockStates?.[template.id] ?? 'open'}
            onSelect={() => onTemplateSelect(template.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface EnhancedTemplateCardProps {
  template: Template;
  formData: Record<string, unknown>;
  isSelected: boolean;
  lockState?: TemplateLockState;
  onSelect: () => void;
}

function EnhancedTemplateCard({
  template,
  formData,
  isSelected,
  lockState = 'open',
  onSelect,
}: EnhancedTemplateCardProps) {
  const isPremium =
    template.categories?.includes('Premium') || template.categories?.includes('premium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [useImagePreview, setUseImagePreview] = useState(true);
  // Lazy-mount the heavy preview iframe only when the card enters the viewport.
  // Once revealed, it stays revealed (latch) so scrolling away doesn't unmount
  // and the user never re-pays the load cost.
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Gallery always uses HTML preview so demo profile + all sections render (static SVG thumbs have no photo)
  useEffect(() => {
    setUseImagePreview(false);
    setImageError(false);
  }, [template.id]);

  // IntersectionObserver: mark the card "in viewport" once it's near the
  // visible area. We use a generous rootMargin so previews start loading
  // slightly before the user scrolls to them, removing perceived latency.
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
      { rootMargin: '400px 0px', threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasEnteredViewport]);

  // Load live preview if image not available AND the card has entered viewport.
  useEffect(() => {
    if (useImagePreview) return;
    if (!hasEnteredViewport) return;

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
          : (await import('@/lib/resume-builder/import-transformer')).backfillImportedExperienceForDisplay(
              (await import('@/lib/resume-builder/builder-hydration')).ensureBuilderContactFields(
                (await import('@/lib/resume-builder/import-transformer')).coalesceBuilderImportPayload(
                  formData
                )
              )
            );

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
  }, [template.id, formData, useImagePreview, hasEnteredViewport]);

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
    <div ref={cardRef} className="flex w-full flex-col">
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
        {template.recommended && !isSelected && lockState === 'open' && (
          <div className="absolute top-2 right-2 z-20">
            <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
              ★ Recommended
            </div>
          </div>
        )}

        {isPremium && lockState !== 'slot_used' && (
          <div className="absolute top-2 left-2 z-20">
            <div className="bg-slate-800/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          </div>
        )}

        {lockState === 'slot_used' && (
          <div className="absolute top-2 left-2 z-20">
            <div className="bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
              Used Slot
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
              loading="lazy"
            />
          </div>
        ) : hasEnteredViewport ? (
          <GalleryResumePreview
            previewHtml={previewHtml}
            loading={loading}
            error={error}
            templateName={template.name}
            iframeRef={iframeRef}
          />
        ) : (
          // Static placeholder for cards still outside the viewport — no
          // animation, no iframe, no network. Swapped for the real preview
          // by the IntersectionObserver effect above.
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-50"
            aria-hidden
          >
            <Sparkles className="h-7 w-7 text-gray-300" />
            <p className="text-xs text-gray-400">{template.name}</p>
          </div>
        )}
        </div>

        {/* Hover Overlay - Subtle */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t via-transparent to-transparent',
            cardAccent.hoverOverlay,
            'opacity-0 group-hover:opacity-100',
            'transition-opacity duration-300',
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
