'use client';

/**
 * Enhanced Live Preview Component
 * Clean, centered, scrollable, full-page preview
 * Features:
 * - Natural size display (no scaling)
 * - Smooth scrolling
 * - Auto-resizing based on content
 * - Instant updates without flicker
 * - Responsive design
 * - Universal CSS fixes
 * - Full language support (RTL)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
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
        overflow-x: hidden;
        direction: ${dir};
      }
      
      body {
        background-color: #ffffff !important;
        margin: 0;
        padding: 0;
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif, 'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans Urdu';
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        color: #000000;
        overflow-x: hidden;
        overflow-y: visible;
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
      .skill-item, .certification-item, .achievement-item,
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

  // Adjust iframe height and scale based on content and container
  const adjustIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!iframe || !scrollContainer) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframeDoc.body) return;

    try {
      const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
      if (resumeContainer) {
        // Get actual content height
        const contentHeight = resumeContainer.scrollHeight;
        const minHeight = 1123; // A4 minimum
        const calculatedHeight = Math.max(contentHeight, minHeight);
        
        // Calculate optimal scale to fit container (520px max width)
        const containerWidth = scrollContainer.clientWidth - 48; // Account for padding (24px * 2)
        const resumeWidth = 794; // A4 width in pixels
        const optimalScale = Math.min(containerWidth / resumeWidth, 0.65); // Max 65% scale, min to fit
        
        // Set iframe height to match content
        iframe.style.height = `${calculatedHeight}px`;
        iframe.style.transform = `scale(${optimalScale})`;
        iframe.style.transformOrigin = 'top center';
        iframeDoc.body.style.minHeight = `${calculatedHeight}px`;
        
        // Update wrapper minHeight for proper centering
        const wrapper = iframe.parentElement;
        if (wrapper) {
          wrapper.style.minHeight = `${calculatedHeight * optimalScale}px`;
        }
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
            adjustIframeHeight();
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
  }, [formDataString, selectedColorId, templateId, loading, getDocumentDirection, getUniversalCSS, adjustIframeHeight]);

  // Setup MutationObserver to detect content changes
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

    return () => {
      clearInterval(checkInterval);
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
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn('bg-white rounded-2xl shadow-2xl border border-gray-200/60 overflow-hidden flex flex-col h-full backdrop-blur-sm', className)}
      style={{
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-b border-gray-200/50 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/60"
          />
          <p className="text-sm font-bold text-white">Live Preview</p>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-white/90 font-medium"
        >
          Auto-updates
        </motion.p>
      </div>

      {/* Premium Scrollable Preview Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-white to-blue-50/20"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Centered A4 Preview Container */}
        <div className="flex items-center justify-center min-h-full p-4 lg:p-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative"
            style={{
              width: '100%',
              maxWidth: '520px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* A4 Paper Container with Premium Shadow */}
            <div 
              className="bg-white rounded-xl overflow-hidden mx-auto"
              style={{
                width: '100%',
                maxWidth: '100%',
                boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.1)',
                transform: 'scale(1)',
                transformOrigin: 'center center',
              }}
            >
              {/* Iframe Wrapper for Perfect Centering */}
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '100%',
                  height: 'auto',
                  minHeight: '730px',
                  overflow: 'hidden',
                }}
              >
                {/* Iframe - Auto-scaled to fit container */}
                <iframe
                  ref={iframeRef}
                  className="border-0 bg-white block"
                  title="Resume Preview"
                  sandbox="allow-same-origin allow-scripts"
                  style={{
                    width: '794px',
                    height: '1123px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    display: 'block',
                    margin: 0,
                    padding: 0,
                    transform: 'scale(0.65)',
                    transformOrigin: 'top center',
                    transition: 'transform 0.3s ease-out',
                  }}
                  onLoad={() => {
                    // Adjust height and scale when iframe loads
                    setTimeout(() => {
                      adjustIframeHeight();
                    }, 200);
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
