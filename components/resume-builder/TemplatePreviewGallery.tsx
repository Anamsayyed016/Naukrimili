'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { LoadedTemplate, ColorVariant, Template } from '@/lib/resume-builder/types';
import { cn } from '@/lib/utils';
import { Check, Sparkles, Crown } from 'lucide-react';
import Image from 'next/image';
import { getGalleryCardAccent } from '@/lib/resume-builder/gallery-demo';
import {
  buildGalleryPreviewDocumentHtml,
  isGalleryCompactPreview,
  resolveMarketingGalleryCardRenderPlan,
} from '@/lib/resume-builder/gallery-preview-render';
import { prepareGalleryPreviewFormData, builderFormChecksum } from '@/lib/resume-builder/builder-hydration';
import GalleryResumePreview from '@/components/resume-builder/GalleryResumePreview';

type TemplateLockState = 'open' | 'locked' | 'upgrade' | 'slot_used';

interface TemplatePreviewGalleryProps {
  templates: Template[];
  /** Imported/user resume for card text. Profile image is always the demo portrait. */
  formData?: Record<string, unknown>;
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
  templateLockStates?: Record<string, TemplateLockState>;
  onLockedTemplateSelect?: (templateId: string, lockState: TemplateLockState) => void;
}

/**
 * Marketing template gallery.
 * Card text = imported/user resume when present; otherwise demo sample.
 * Card photo = ALWAYS the template demo portrait (never the user's upload).
 */
export default function TemplatePreviewGallery({
  templates,
  formData = {},
  selectedTemplateId,
  onTemplateSelect,
  templateLockStates,
  onLockedTemplateSelect,
}: TemplatePreviewGalleryProps) {
  void onLockedTemplateSelect;
  const galleryTemplates = useMemo(() => templates, [templates]);

  const userPreviewData = useMemo(() => {
    try {
      return prepareGalleryPreviewFormData(formData);
    } catch {
      return {};
    }
  }, [formData]);

  const previewChecksum = useMemo(
    () => builderFormChecksum(userPreviewData),
    [userPreviewData]
  );

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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 animate-in fade-in duration-300">
        {galleryTemplates.map((template) => (
          <EnhancedTemplateCard
            key={`${template.id}:${previewChecksum}`}
            template={template}
            userPreviewData={userPreviewData}
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
  userPreviewData: Record<string, unknown>;
  isSelected: boolean;
  lockState?: TemplateLockState;
  onSelect: () => void;
}

function EnhancedTemplateCard({
  template,
  userPreviewData,
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
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cardPlan = useMemo(
    () => resolveMarketingGalleryCardRenderPlan(template.id, userPreviewData),
    [template.id, userPreviewData]
  );

  useEffect(() => {
    setUseImagePreview(false);
    setImageError(false);
  }, [template.id]);

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
        if (entries.some((e) => e.isIntersecting)) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasEnteredViewport]);

  useEffect(() => {
    if (!hasEnteredViewport || useImagePreview) return;

    let mounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        const { loadTemplate, applyColorVariant, injectResumeData } = await import(
          '@/lib/resume-builder/template-loader'
        );

        const loaded: LoadedTemplate | null = await loadTemplate(template.id);

        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${template.id}" not found`);
        }

        const { template: templateMeta, html, css } = loaded;
        const colorVariant =
          templateMeta.colors.find((c: ColorVariant) => c.id === templateMeta.defaultColor) ||
          templateMeta.colors[0];
        const coloredCss = applyColorVariant(css, colorVariant);

        // User/import text when present; photo always demo via inject options.
        const dataInjectedHtml = injectResumeData(
          html,
          cardPlan.previewData,
          cardPlan.injectOptions
        );

        const fullHtml = buildGalleryPreviewDocumentHtml(
          coloredCss,
          dataInjectedHtml,
          isGalleryCompactPreview(cardPlan.previewData)
        );

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
  }, [template.id, useImagePreview, hasEnteredViewport, cardPlan]);

  const cardAccent = getGalleryCardAccent(template.id);

  const handleImageError = () => {
    console.log(
      `[TemplatePreview] Image failed to load for ${template.id}, falling back to HTML/CSS preview`
    );
    setImageError(true);
    setUseImagePreview(false);
    setLoading(true);
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

        {isSelected && (
          <div className="absolute top-2 right-2 z-20">
            <div className="bg-blue-600 rounded-full p-1.5 shadow-lg">
              <Check className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

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
              formData={cardPlan.previewData}
              templateId={template.id}
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gray-50"
              aria-hidden
            >
              <Sparkles className="h-7 w-7 text-gray-300" />
              <p className="text-xs text-gray-400">{template.name}</p>
            </div>
          )}
        </div>

        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t via-transparent to-transparent',
            cardAccent.hoverOverlay,
            'opacity-0 group-hover:opacity-100',
            'transition-opacity duration-300',
            'flex items-end justify-center pb-8 z-10 rounded-2xl pointer-events-none'
          )}
        >
          <div
            className={cn(
              'text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-300 pointer-events-auto',
              'group-hover:translate-y-0 translate-y-2',
              isSelected ? 'bg-blue-600/95' : 'bg-blue-600/90'
            )}
          >
            {isSelected ? 'Selected' : 'Click to Edit'}
          </div>
        </div>
      </div>

      <div className="mt-3 px-1">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{template.name}</h4>
        {template.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{template.description}</p>
        )}
      </div>
    </div>
  );
}
