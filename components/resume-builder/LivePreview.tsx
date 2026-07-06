'use client';

/**
 * Enhanced Live Preview Component
 * Clean, centered, perfectly fitted preview - No scrolling
 * Features:
 * - Auto-scaled to fit container perfectly
 * - No scrollbars - clean professional look
 * - Instant updates without flicker
 * - Responsive design
 * - Universal CSS fixes
 * - Full language support (RTL)
 * - Matches gallery preview style
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minus, Plus } from 'lucide-react';
import type { LoadedTemplate, Template } from '@/lib/resume-builder/types';
import { resolveColorVariant } from '@/lib/resume-builder/color-theme';
import { PREVIEW_CONTENT_FLOW_CSS } from '@/lib/resume-builder/preview-content-flow';
import { PDF_PAGINATION_EXPORT_CSS } from '@/lib/resume-builder/pdf-pagination-overrides';
import { cn } from '@/lib/utils';
import {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  PREVIEW_ZOOM_STEPS,
  computeFitScale,
  resolvePreviewScale,
  type PreviewZoomMode,
} from '@/components/resume-builder/preview-scale';

interface LivePreviewProps {
  templateId: string;
  formData: Record<string, unknown>;
  selectedColorId?: string;
  className?: string;
  showZoomControls?: boolean;
  /**
   * Extra CSS appended after the template's coloured CSS inside the iframe.
   * Used by Design Studio typography overrides. When omitted nothing is
   * injected so existing previews stay byte-identical.
   */
  customCss?: string;
  /** Re-fit content area aspect: full preview canvas size. */
  paddingClassName?: string;
}

export default function LivePreview({
  templateId,
  formData,
  selectedColorId,
  className,
  showZoomControls = true,
  customCss,
  paddingClassName,
}: LivePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState(A4_HEIGHT_PX);
  const [zoom, setZoom] = useState<PreviewZoomMode>('fit');
  const [fitScale, setFitScale] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previousColorIdRef = useRef<string | undefined>(selectedColorId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const previousFormDataRef = useRef<string>('');
  const previousCustomCssRef = useRef<string>('');
  const templateCacheRef = useRef<{ template: Template | null; html: string; css: string } | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

  const displayScale = useMemo(
    () => resolvePreviewScale(zoom, fitScale),
    [zoom, fitScale]
  );

  const updateFitScale = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const inner = canvasInnerRef.current;
    const measureWidth = inner?.clientWidth ?? container.clientWidth;
    const isNarrowViewport = measureWidth > 0 && measureWidth < 1200;

    setFitScale(
      computeFitScale(
        measureWidth,
        container.clientHeight,
        contentHeight,
        undefined,
        isNarrowViewport ? 'width' : 'both'
      )
    );
  }, [contentHeight]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const inner = canvasInnerRef.current;
    if (!container) return;

    updateFitScale();
    const ro = new ResizeObserver(() => updateFitScale());
    ro.observe(container);
    if (inner) ro.observe(inner);
    return () => ro.disconnect();
  }, [updateFitScale]);

  const stepZoom = (direction: 'in' | 'out' | 'fit') => {
    if (direction === 'fit') {
      setZoom('fit');
      return;
    }
    const numericSteps = PREVIEW_ZOOM_STEPS.filter((s) => s.value !== 'fit').map(
      (s) => s.value as number
    );
    const current =
      zoom === 'fit' ? fitScale : zoom;
    const idx = numericSteps.findIndex((s) => s >= current - 0.001);
    if (direction === 'in') {
      const next = numericSteps[Math.min(idx + 1, numericSteps.length - 1)];
      setZoom(next ?? 1.25);
    } else {
      const prev = numericSteps[Math.max(idx - 1, 0)];
      setZoom(prev ?? 0.75);
    }
  };

  // Create a stable reference for formData
  const formDataString = JSON.stringify(formData);
  // Detect language direction (RTL support)
  const detectLanguageDirection = useCallback((text: string): 'ltr' | 'rtl' => {
    if (!text) return 'ltr';
    const rtlPattern = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlPattern.test(text) ? 'rtl' : 'ltr';
  }, []);

  // Get language direction from form data
  const getDocumentDirection = useCallback((): 'ltr' | 'rtl' => {
    const fullName = formData.firstName || formData.lastName || formData.name || '';
    const summary = formData.summary || formData.professionalSummary || '';
    return detectLanguageDirection(fullName + ' ' + summary);
  }, [formData, detectLanguageDirection]);

  // Universal CSS fixes for all templates
  const getUniversalCSS = useCallback((dir: 'ltr' | 'rtl'): string => {
    return `
      /* Universal Reset */
      *, *::before, *::after {
        box-sizing: border-box !important;
      }
      
      html {
        background-color: #ffffff !important;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden !important;
        direction: ${dir};
      }
      
      body {
        background-color: #ffffff !important;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif, 'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans Urdu';
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #000000;
        overflow: hidden !important;
        direction: ${dir};
        word-wrap: break-word;
        overflow-wrap: break-word;
        hyphens: auto;
      }
      
      /* Resume Container - Natural Size, No Fixed Height */
      .resume-container {
        width: 794px !important;
        max-width: 100% !important;
        min-height: auto !important;
        height: auto !important;
        max-height: none !important;
        display: block !important;
        margin: 0 auto !important;
        padding: 0 !important;
        overflow: visible !important;
        position: relative;
        background: white !important;
        page-break-inside: avoid;
      }
      
      /* NO responsive scaling - always show full-size like View Full Resume */
      @media (max-width: 850px) {
        .resume-container {
          width: 100% !important;
          max-width: 794px !important;
          transform: none !important; /* NO SCALING */
        }
      }
      
      @media (max-width: 768px) {
        .resume-container {
          transform: none !important; /* NO SCALING */
        }
      }
      
      @media (max-width: 640px) {
        .resume-container {
          transform: none !important; /* NO SCALING */
        }
      }
      
      /* Remove all fixed heights from sections */
      section, .section, .section-content, .section-header,
      .experience-item, .education-item, .project-item,
      .skill-item, .certification-item, .achievement-item, .hobby-item,
      .language-item {
        min-height: auto !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        page-break-inside: avoid;
      }
      
      /* Ensure all sections are visible */
      section, .section-content, .section-header {
        display: block !important;
        visibility: visible !important;
        width: 100%;
      }
      
      /* Text wrapping */
      p, div, span, li, td, th {
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        hyphens: auto;
        max-width: 100%;
      }
      
      h1, h2, h3, h4, h5, h6 {
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        max-width: 100%;
      }
      
      /* Lists */
      ul, ol {
        list-style-position: outside;
        padding-left: ${dir === 'rtl' ? '0' : '1.5em'};
        padding-right: ${dir === 'rtl' ? '1.5em' : '0'};
      }
      
      /* RTL Support */
      [dir="rtl"], .rtl {
        direction: rtl;
        text-align: right;
      }
      
      [dir="ltr"], .ltr {
        direction: ltr;
        text-align: left;
      }
      
      /* Responsive images */
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      
      /* Responsive tables */
      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: auto;
      }
    `;
  }, []);

  // Load template (only when templateId changes)
  useEffect(() => {
    let mounted = true;

    async function loadTemplate() {
      try {
        setLoading(true);
        setError(null);

        // Clear cache to force reload (important for CSS updates)
        templateCacheRef.current = null;

        const { loadTemplate } = await import('@/lib/resume-builder/template-loader');
        const loaded: LoadedTemplate | null = await loadTemplate(templateId);
        
        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${templateId}" not found`);
        }

        templateCacheRef.current = {
          template: loaded.template,
          html: loaded.html,
          css: loaded.css,
        };

        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading template:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
        setLoading(false);
      }
    }

    // Always reload template to ensure fresh CSS (no cache check)
    loadTemplate();

    return () => {
      mounted = false;
    };
  }, [templateId]);

  // Adjust iframe height to match content - NO SCALING (matches View Full Resume exactly)
  const adjustIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframeDoc.body) return;

    try {
      const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
      if (resumeContainer) {
        // Get actual rendered content height
        const contentHeight = Math.ceil(
          resumeContainer.scrollHeight || resumeContainer.offsetHeight || 1123
        );
        
        // A4 dimensions in pixels (794px = actual A4 width)
        const resumeWidth = 794;
        const resumeHeight = contentHeight;
        
        setContentHeight(resumeHeight);

        // Fixed A4 width — scaling applied on outer paper wrapper via CSS transform
        iframe.style.width = `${resumeWidth}px`;
        iframe.style.height = `${resumeHeight}px`;
        iframe.style.transform = 'none';
        iframe.style.transformOrigin = 'top center';
        (iframe.style as any).scale = '1';
        (iframe.style as any).zoom = '1';
        
        // CRITICAL: Remove ALL scaling from resume-container inside iframe
        resumeContainer.style.transform = 'none';
        resumeContainer.style.width = '794px';
        resumeContainer.style.maxWidth = '794px';
        resumeContainer.style.minWidth = '794px';
        (resumeContainer.style as any).scale = '1';
        (resumeContainer.style as any).zoom = '1';
        
        // Remove scaling from all child elements
        const allElements = iframeDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style.transform && htmlEl.style.transform.includes('scale')) {
            htmlEl.style.transform = htmlEl.style.transform.replace(/scale\([^)]*\)/g, '').trim() || 'none';
          }
          if ((htmlEl.style as any).scale) {
            (htmlEl.style as any).scale = '1';
          }
          if ((htmlEl.style as any).zoom) {
            (htmlEl.style as any).zoom = '1';
          }
        });
        
        // Ensure no overflow in iframe - content should never be clipped
        iframeDoc.body.style.overflow = 'visible';
        iframeDoc.documentElement.style.overflow = 'visible';
        iframeDoc.body.style.height = `${contentHeight}px`;
        iframeDoc.documentElement.style.height = `${contentHeight}px`;
        iframeDoc.body.style.transform = 'none';
        iframeDoc.documentElement.style.transform = 'none';
      }
        updateFitScale();
    } catch (err) {
      console.error('[LivePreview] Error adjusting height:', err);
    }
  }, [updateFitScale]);

  // Update preview with smooth updates
  useEffect(() => {
    if (!iframeRef.current || !templateCacheRef.current || loading) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const currentFormData = JSON.parse(formDataString);
    const colorChanged = previousColorIdRef.current !== selectedColorId;
    const formDataChanged = previousFormDataRef.current !== formDataString;
    const customCssChanged = previousCustomCssRef.current !== (customCss || '');
    const isFullReload =
      !previousFormDataRef.current ||
      templateCacheRef.current.template?.id !== templateId ||
      colorChanged ||
      formDataChanged ||
      customCssChanged;

    const updatePreview = async () => {
      try {
        const { template, html, css } = templateCacheRef.current!;
        
        const colorVariant = resolveColorVariant(
          template.colors,
          selectedColorId,
          template.defaultColor
        );

        const { applyColorVariant, injectResumeData } = await import('@/lib/resume-builder/template-loader');
        const coloredCss = applyColorVariant(css, colorVariant);
        const dir = getDocumentDirection();
        const dataInjectedHtml = injectResumeData(html, currentFormData, { templateId });
        // CRITICAL: Do NOT use getUniversalCSS - use PDF-optimized CSS that matches View Full Resume exactly

        // Full reload or first load
        // CRITICAL: Use EXACT same HTML generation as View Full Resume modal
        if (isFullReload || !iframeDoc.body || !iframeDoc.body.querySelector('.resume-container')) {
          const fullHtml = `
            <!DOCTYPE html>
            <html lang="en" dir="${dir}">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                ${coloredCss}
                
                /* PDF Export Optimizations - Lock to A4 width and prevent layout shifts */
                /* EXACTLY matches View Full Resume modal and PDF export */
                * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }

                html {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                }
                
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow-x: hidden !important;
                  overflow-y: visible !important;
                  transform: none !important;
                  scale: 1 !important;
                  zoom: 1 !important;
                }
                
                /* Lock resume container to A4 dimensions (210mm x 297mm = 794px x 1123px at 96 DPI) */
                /* EXACTLY matches View Full Resume - no scaling, no transforms */
                .resume-container {
                  width: 794px !important;
                  max-width: 794px !important;
                  min-width: 794px !important;
                  margin: 0 auto !important;
                  background: white !important;
                  box-sizing: border-box !important;
                  position: relative !important;
                  transform-origin: top center !important;
                  transform: none !important; /* Explicitly no transforms to match View Full Resume */
                  scale: 1 !important; /* Explicitly set scale to 1 to prevent any scaling */
                  zoom: 1 !important; /* Prevent browser zoom */
                }
                
                /* CRITICAL: Remove any scaling from parent elements or wrapper divs */
                body > *,
                html > * {
                  transform: none !important;
                  scale: 1 !important;
                  zoom: 1 !important;
                }

                /* Prevent layout shifts - lock all widths */
                .resume-wrapper,
                .sidebar,
                .content,
                section,
                .section {
                  box-sizing: border-box !important;
                }
                
                /* Page break rules - allow natural page breaks (don't force single page) */
                @page {
                  size: A4 portrait;
                  margin: 0;
                }
                
                /* Preserve all graphics, icons, and colors */
                img {
                  display: block !important;
                  max-width: 100% !important;
                  height: auto !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                svg, svg * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  display: inline-block !important;
                }
                
                /* Preserve background colors and gradients */
                [style*="background"],
                [class*="bg-"],
                [class*="background"],
                [style*="gradient"] {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                /* Preserve borders */
                [style*="border"],
                [class*="border"] {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                /* Ensure emoji/SVG icons are visible */
                .contact-icon,
                .icon,
                [class*="icon"] {
                  display: inline-block !important;
                  vertical-align: middle !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                /* Typography consistency */
                p, div, span, li, td, th {
                  word-wrap: break-word !important;
                  overflow-wrap: break-word !important;
                  hyphens: auto;
                }

                ${PDF_PAGINATION_EXPORT_CSS}

                ${PREVIEW_CONTENT_FLOW_CSS}
                
                /* Ensure consistent spacing */
                * {
                  box-sizing: border-box;
                }
                ${customCss || ''}
              </style>
            </head>
            <body>
              ${dataInjectedHtml}
            </body>
            </html>
          `;

          iframeDoc.open();
          iframeDoc.write(fullHtml);
          iframeDoc.close();

          // Wait for content to load
          setTimeout(() => {
            adjustIframeHeight();
          }, 300);
        } else {
          // Partial update - smooth update without flicker
          const resumeContainer = iframeDoc.querySelector('.resume-container');
          if (resumeContainer) {
            const newContent = injectResumeData(html, currentFormData, { templateId });
            const tempDiv = iframeDoc.createElement('div');
            tempDiv.innerHTML = newContent;
            const newContainer = tempDiv.querySelector('.resume-container');
            
            if (newContainer) {
              // Smooth update
              resumeContainer.innerHTML = newContainer.innerHTML;
              
              // Adjust height after update
              setTimeout(() => {
                adjustIframeHeight();
              }, 50);
            }
          }
        }

        previousFormDataRef.current = formDataString;
        previousColorIdRef.current = selectedColorId;
        previousCustomCssRef.current = customCss || '';
      } catch (err) {
        console.error('[LivePreview] Error updating preview:', err);
      }
    };

    updatePreview();
    }, [formDataString, selectedColorId, templateId, loading, getDocumentDirection, adjustIframeHeight, customCss]);

  // Setup MutationObserver to detect content changes and window resize
  useEffect(() => {
    if (!iframeRef.current || !scrollContainerRef.current) return;

    const iframe = iframeRef.current;
    const scrollContainer = scrollContainerRef.current;
    
    // Also observe the scroll container for resize
    const resizeObserver = new ResizeObserver(() => {
      adjustIframeHeight();
      updateFitScale();
    });
    
    resizeObserver.observe(scrollContainer);
    
    const setupObserver = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) return;

      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }

      mutationObserverRef.current = new MutationObserver(() => {
        adjustIframeHeight();
      });

      const resumeContainer = iframeDoc.querySelector('.resume-container');
      if (resumeContainer) {
        mutationObserverRef.current.observe(resumeContainer, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
      }
    };

    const checkInterval = setInterval(() => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc && iframeDoc.body && iframeDoc.body.querySelector('.resume-container')) {
        setupObserver();
        clearInterval(checkInterval);
      }
    }, 100);

    // Handle window resize
    const handleResize = () => {
      adjustIframeHeight();
      updateFitScale();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
    }, [adjustIframeHeight, updateFitScale]);

  const scaledWidth = A4_WIDTH_PX * displayScale;
  const scaledHeight = contentHeight * displayScale;
  const useTopLeftScaleOrigin = displayScale < 0.999;
  const zoomLabel =
    zoom === 'fit'
      ? `Fit (${Math.round(fitScale * 100)}%)`
      : `${Math.round(displayScale * 100)}%`;

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'flex flex-col h-full min-h-[480px] rounded-xl border border-slate-200 bg-slate-100 overflow-hidden',
          className
        )}
      >
        <motion.div className="flex flex-1 items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading preview...</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col h-full rounded-xl border border-red-200 bg-white p-8',
          className
        )}
      >
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Error loading preview</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        'resume-preview-shell flex flex-col h-full min-h-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-sm',
        className
      )}
    >
      <div className="resume-preview-toolbar flex-shrink-0 flex items-center justify-between gap-2 sm:gap-3 min-w-0 px-3 sm:px-4 min-[1200px]:px-4 py-2.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-sm font-semibold text-slate-800 truncate">Live Preview</p>
          <span className="hidden sm:inline text-xs text-slate-400 font-medium tabular-nums">
            A4 · {zoomLabel}
          </span>
        </div>

        {showZoomControls && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => stepZoom('out')}
              className="resume-preview-zoom-button inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="hidden sm:flex items-center gap-0.5 px-0.5">
              {PREVIEW_ZOOM_STEPS.map((step) => {
                const isActive =
                  step.value === 'fit'
                    ? zoom === 'fit'
                    : zoom !== 'fit' && Math.abs((zoom as number) - step.value) < 0.01;
                return (
                  <button
                    key={step.label}
                    type="button"
                    onClick={() => setZoom(step.value)}
                    className={cn(
                      'resume-preview-zoom-button px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => stepZoom('in')}
              className="resume-preview-zoom-button inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => stepZoom('fit')}
              className="resume-preview-zoom-button inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors sm:hidden"
              title="Fit to screen"
              aria-label="Fit to screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hidden sm:inline-flex ml-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Top
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="resume-preview-canvas flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      >
        <div
          ref={canvasInnerRef}
          className="resume-preview-canvas-inner flex justify-center py-8 px-2 sm:px-4 min-[1200px]:px-6 min-h-full w-full max-w-full min-w-0 box-border"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="resume-preview-scale-stage shrink-0"
            style={{
              width: scaledWidth,
              height: scaledHeight,
              minHeight: scaledHeight,
            }}
          >
            <div
              ref={paperRef}
              className="resume-preview-paper resume-preview-zoom-container bg-white rounded-sm ring-1 ring-slate-200/80"
              style={{
                width: A4_WIDTH_PX,
                height: contentHeight,
                transform: `scale(${displayScale})`,
                transformOrigin: useTopLeftScaleOrigin ? 'top left' : 'top center',
                boxShadow:
                  '0 1px 2px rgba(15,23,42,0.06), 0 8px 24px -4px rgba(15,23,42,0.12), 0 24px 48px -12px rgba(15,23,42,0.08)',
              }}
            >
              <iframe
                ref={iframeRef}
                className="border-0 block"
                title="Resume Preview"
                sandbox="allow-same-origin allow-scripts"
                scrolling="no"
                style={{
                  width: A4_WIDTH_PX,
                  height: contentHeight,
                  minHeight: A4_HEIGHT_PX,
                  transform: 'none',
                  transformOrigin: 'top center',
                  border: 'none',
                  display: 'block',
                  flexShrink: 0,
                  margin: 0,
                  padding: 0,
                  backgroundColor: '#ffffff',
                  pointerEvents: 'none',
                }}
                onLoad={() => {
                  setTimeout(() => adjustIframeHeight(), 300);
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
