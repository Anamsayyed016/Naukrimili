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

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { LoadedTemplate, ColorVariant } from '@/lib/resume-builder/types';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  templateId: string;
  formData: Record<string, any>;
  selectedColorId?: string;
  className?: string;
}

export default function LivePreview({
  templateId,
  formData,
  selectedColorId,
  className,
}: LivePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 1.0 = 100% (auto-fit)
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true); // Default to auto-fit
  const [baseScale, setBaseScale] = useState<number>(0.65); // Store calculated base scale
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousFormDataRef = useRef<string>('');
  const templateCacheRef = useRef<{ template: any; html: string; css: string } | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

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
      
      /* Responsive scaling for smaller screens */
      @media (max-width: 850px) {
        .resume-container {
          width: 100% !important;
          max-width: 794px !important;
          transform: scale(0.95);
          transform-origin: top center;
        }
      }
      
      @media (max-width: 768px) {
        .resume-container {
          transform: scale(0.85);
        }
      }
      
      @media (max-width: 640px) {
        .resume-container {
          transform: scale(0.75);
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

    if (!templateCacheRef.current || templateCacheRef.current.template.id !== templateId) {
      loadTemplate();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [templateId]);

  // Adjust iframe scale to fit container perfectly - No scrolling, show full resume
  // Now supports user zoom level
  const adjustIframeHeight = useCallback((userZoom?: number) => {
    const iframe = iframeRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!iframe || !scrollContainer) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframeDoc.body) return;

    try {
      const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
      if (resumeContainer) {
        // Get actual rendered content height by measuring all children
        // Use scrollHeight for FULL content height including overflow
        const contentHeight = Math.ceil(
          resumeContainer.scrollHeight || resumeContainer.offsetHeight || 1100
        );
        
        // Get container dimensions WITHOUT padding constraints
        // Use full available space for better visibility
        const containerWidth = scrollContainer.clientWidth;
        const containerHeight = scrollContainer.clientHeight;
        
        // A4 dimensions in pixels (794px = actual A4 width, 850px with margins)
        const resumeWidth = 794; // Use actual A4 width, not container width
        const resumeHeight = contentHeight;
        
        // Calculate scale to fit content in container
        // Priority: show FULL content without clipping
        const scaleX = (containerWidth * 0.9) / resumeWidth; // 90% of width with margins
        const scaleY = (containerHeight * 0.95) / resumeHeight; // 95% of height with margins
        
        // Use the smaller scale to ensure EVERYTHING fits without clipping
        // Remove the 0.65 cap - let it scale naturally based on content
        const calculatedBaseScale = Math.min(scaleX, scaleY);
        
        // Store base scale for zoom calculations
        setBaseScale(calculatedBaseScale);
        
        // Apply user zoom if provided, otherwise use current zoom level
        const currentZoom = userZoom !== undefined ? userZoom : zoomLevel;
        const finalScale = isAutoFit 
          ? calculatedBaseScale 
          : calculatedBaseScale * currentZoom;
        
        // Clamp scale to reasonable bounds (0.25 to 1.50)
        // Expanded lower bound to allow more zoom flexibility
        const clampedScale = Math.max(0.25, Math.min(1.50, finalScale));
        
        // Apply scale with center origin for perfect centering
        iframe.style.transform = `scale(${clampedScale})`;
        iframe.style.transformOrigin = 'center center';
        
        // Set iframe to actual content dimensions (794px A4 width, auto height based on content)
        iframe.style.width = `${resumeWidth}px`;
        iframe.style.height = `${resumeHeight}px`;
        
        // Ensure no overflow in iframe - content should never be clipped
        iframeDoc.body.style.overflow = 'visible';
        iframeDoc.documentElement.style.overflow = 'visible';
        iframeDoc.body.style.height = `${contentHeight}px`;
        iframeDoc.documentElement.style.height = `${contentHeight}px`;
      }
    } catch (err) {
      console.error('[LivePreview] Error adjusting scale:', err);
    }
  }, [zoomLevel, isAutoFit]);

  // Update preview with smooth updates
  useEffect(() => {
    if (!iframeRef.current || !templateCacheRef.current || loading) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const currentFormData = JSON.parse(formDataString);
    const isFullReload = !previousFormDataRef.current || 
                         templateCacheRef.current.template.id !== templateId;

    const updatePreview = async () => {
      try {
        const { template, html, css } = templateCacheRef.current!;
        
        const colorVariant = selectedColorId
          ? template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0]
          : template.colors.find((c: ColorVariant) => c.id === template.defaultColor) || template.colors[0];

        const { applyColorVariant, injectResumeData } = await import('@/lib/resume-builder/template-loader');
        const coloredCss = applyColorVariant(css, colorVariant);
        const dir = getDocumentDirection();
        const dataInjectedHtml = injectResumeData(html, currentFormData);
        const universalCSS = getUniversalCSS(dir);

        // Full reload or first load
        if (isFullReload || !iframeDoc.body || !iframeDoc.body.querySelector('.resume-container')) {
          const fullHtml = `
            <!DOCTYPE html>
            <html lang="en" dir="${dir}">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                ${universalCSS}
                ${coloredCss}
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
            adjustIframeHeight(isAutoFit ? 1.0 : zoomLevel);
          }, 150);
        } else {
          // Partial update - smooth update without flicker
          const resumeContainer = iframeDoc.querySelector('.resume-container');
          if (resumeContainer) {
            const newContent = injectResumeData(html, currentFormData);
            const tempDiv = iframeDoc.createElement('div');
            tempDiv.innerHTML = newContent;
            const newContainer = tempDiv.querySelector('.resume-container');
            
            if (newContainer) {
              // Smooth update
              resumeContainer.innerHTML = newContainer.innerHTML;
              
              // Adjust height after update
              setTimeout(() => {
                adjustIframeHeight(isAutoFit ? 1.0 : zoomLevel);
              }, 50);
            }
          }
        }

        previousFormDataRef.current = formDataString;
      } catch (err) {
        console.error('[LivePreview] Error updating preview:', err);
      }
    };

    updatePreview();
  }, [formDataString, selectedColorId, templateId, loading, getDocumentDirection, getUniversalCSS, adjustIframeHeight, isAutoFit, zoomLevel]);

  // Setup MutationObserver to detect content changes and window resize
  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    
    const setupObserver = () => {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) return;

      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }

      mutationObserverRef.current = new MutationObserver(() => {
        adjustIframeHeight(isAutoFit ? 1.0 : zoomLevel);
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

    // Handle window resize - reset to auto-fit if enabled
    const handleResize = () => {
      if (isAutoFit) {
        adjustIframeHeight(1.0);
      } else {
        adjustIframeHeight(zoomLevel);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('resize', handleResize);
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
    };
  }, [adjustIframeHeight, isAutoFit, zoomLevel]);

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex items-center justify-center min-h-[600px]', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-red-200 p-8', className)}>
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading preview</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn('bg-transparent rounded-none shadow-none border-none overflow-visible flex flex-col h-full backdrop-blur-0', className)}
      style={{
        boxShadow: 'none',
      }}
    >
      {/* Premium Header with Zoom Controls */}
      <div className="resume-preview-header bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-gray-200/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/60"
          />
          <p className="text-sm font-bold text-white">Live Preview</p>
        </div>
        
        {/* Zoom Controls - Responsive */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Out */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsAutoFit(false);
              const newZoom = Math.max(0.5, zoomLevel - 0.1);
              setZoomLevel(newZoom);
              adjustIframeHeight(newZoom);
            }}
            className={cn(
              "p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors active:bg-white/30",
              zoomLevel <= 0.5 && "opacity-50 cursor-not-allowed"
            )}
            title="Zoom Out"
            disabled={zoomLevel <= 0.5}
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </motion.button>
          
          {/* Zoom Percentage / Reset */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsAutoFit(true);
              setZoomLevel(1.0);
              adjustIframeHeight(1.0);
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-xs font-semibold text-white min-w-[50px] sm:min-w-[60px]"
            title={isAutoFit ? "Auto-fit (Click to reset)" : "Reset to Fit"}
            aria-label="Reset Zoom"
          >
            {isAutoFit ? 'Fit' : `${Math.round(zoomLevel * 100)}%`}
          </motion.button>
          
          {/* Zoom In */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsAutoFit(false);
              const newZoom = Math.min(1.5, zoomLevel + 0.1);
              setZoomLevel(newZoom);
              adjustIframeHeight(newZoom);
            }}
            className={cn(
              "p-1.5 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors",
              zoomLevel >= 1.5 && "opacity-50 cursor-not-allowed"
            )}
            title="Zoom In"
            disabled={zoomLevel >= 1.5}
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Premium Preview Container - With Vertical Scrolling */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto resume-preview-container resume-preview-zoom-container bg-gradient-to-br from-gray-50 via-white to-blue-50/20 flex items-center justify-center p-4 lg:p-6"
        style={{
          position: 'relative',
        }}
      >
        {/* Centered A4 Preview Container */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative w-full h-full flex items-center justify-center"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          {/* A4 Paper Container with Premium Shadow */}
          <div 
            className="bg-white rounded-none overflow-hidden resume-preview-iframe-wrapper"
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Iframe Wrapper - Perfect Fit, No Scroll */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                overflow: 'hidden',
                padding: 0,
                margin: 0,
                backgroundColor: 'white',
              }}
            >
              {/* Iframe - Auto-scaled to fit container perfectly, shows full resume */}
              <iframe
                ref={iframeRef}
                className="border-0 pointer-events-none"
                title="Resume Preview"
                sandbox="allow-same-origin allow-scripts"
                scrolling="no"
                style={{
                  width: '850px',
                  height: '1100px',
                  minHeight: '1100px',
                  transform: 'scale(0.60)',
                  transformOrigin: 'center center',
                  border: 'none',
                  overflow: 'hidden',
                  display: 'block',
                  flexShrink: 0,
                  margin: 0,
                  padding: 0,
                  backgroundColor: 'white',
                  transition: 'transform 0.3s ease-out',
                }}
                onLoad={() => {
                  // Adjust scale when iframe loads - wait for content to render
                  setTimeout(() => {
                    adjustIframeHeight(isAutoFit ? 1.0 : zoomLevel);
                  }, 300);
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
