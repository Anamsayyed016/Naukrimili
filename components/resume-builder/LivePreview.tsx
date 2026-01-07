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
import type { LoadedTemplate, ColorVariant, Template } from '@/lib/resume-builder/types';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  templateId: string;
  formData: Record<string, unknown>;
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousFormDataRef = useRef<string>('');
  const templateCacheRef = useRef<{ template: Template | null; html: string; css: string } | null>(null);
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
        
        // Set iframe to actual content dimensions - NO SCALING
        iframe.style.width = `${resumeWidth}px`;
        iframe.style.height = `${resumeHeight}px`;
        iframe.style.transform = 'none'; // NO SCALING - matches View Full Resume
        iframe.style.transformOrigin = 'top center';
        (iframe.style as any).scale = '1'; // Explicitly set scale to 1
        (iframe.style as any).zoom = '1'; // Explicitly set zoom to 1
        
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
    } catch (err) {
      console.error('[LivePreview] Error adjusting height:', err);
    }
  }, []);

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
                
                /* Ensure consistent spacing */
                * {
                  box-sizing: border-box;
                }
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
            const newContent = injectResumeData(html, currentFormData);
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
      } catch (err) {
        console.error('[LivePreview] Error updating preview:', err);
      }
    };

    updatePreview();
    }, [formDataString, selectedColorId, templateId, loading, getDocumentDirection, adjustIframeHeight]);

  // Setup MutationObserver to detect content changes and window resize
  useEffect(() => {
    if (!iframeRef.current || !scrollContainerRef.current) return;

    const iframe = iframeRef.current;
    const scrollContainer = scrollContainerRef.current;
    
    // Also observe the scroll container for resize
    const resizeObserver = new ResizeObserver(() => {
      adjustIframeHeight();
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
    }, [adjustIframeHeight]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn('bg-transparent rounded-none shadow-none border-none overflow-visible flex flex-col h-full backdrop-blur-0', className)}
      style={{
        boxShadow: 'none',
        transform: 'none',
        scale: '1',
        zoom: '1',
      } as React.CSSProperties}
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
        
        {/* View Full Resume Button - Matches View Full Resume Modal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Scroll to top of preview
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors text-xs font-semibold text-white"
            title="Scroll to Top"
            aria-label="Scroll to Top"
          >
            ↑ Top
          </motion.button>
        </div>
      </div>

      {/* Premium Preview Container - With Vertical Scrolling (matches View Full Resume) */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden resume-preview-container bg-gradient-to-br from-gray-50 via-white to-blue-50/20 flex items-start justify-center p-4 lg:p-6"
        style={{
          position: 'relative',
        }}
      >
        {/* Centered A4 Preview Container */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative w-full flex items-start justify-center"
          style={{
            maxWidth: '100%',
            minHeight: '100%',
            paddingTop: '24px',
            paddingBottom: '24px',
          }}
        >
          {/* A4 Paper Container - Full Size, NO SCALING */}
          <div 
            className="bg-white rounded-none overflow-visible resume-preview-iframe-wrapper"
            style={{
              width: '794px', // A4 width - NO SCALING
              maxWidth: '100%', // Responsive on small screens
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              display: 'block',
              position: 'relative',
              transform: 'none', // NO SCALING - explicit override
              scale: '1', // NO SCALING - explicit override
              zoom: '1', // NO SCALING - explicit override
            } as React.CSSProperties}
          >
              {/* Iframe - Full-size A4 resume, NO SCALING (matches View Full Resume exactly) */}
              <iframe
                ref={iframeRef}
                className="border-0 pointer-events-none"
                title="Resume Preview"
                sandbox="allow-same-origin allow-scripts"
                scrolling="no"
                style={{
                  width: '794px', // A4 width - NO SCALING
                  height: 'auto',
                  minHeight: '1123px', // A4 height
                  transform: 'none', // NO SCALING - matches View Full Resume
                  transformOrigin: 'top center',
                  border: 'none',
                  overflow: 'visible',
                  display: 'block',
                  flexShrink: 0,
                  margin: '0 auto',
                  padding: 0,
                  backgroundColor: 'white',
                }}
                onLoad={() => {
                  // Adjust height when iframe loads - wait for content to render
                  setTimeout(() => {
                    adjustIframeHeight();
                  }, 300);
                }}
              />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
