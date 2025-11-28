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

  // Adjust iframe height based on content
  const adjustIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc || !iframeDoc.body) return;

    try {
      const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
      if (resumeContainer) {
        // Get actual content height
        const contentHeight = resumeContainer.scrollHeight;
        const minHeight = 1123; // A4 minimum
        const calculatedHeight = Math.max(contentHeight, minHeight);
        
        // Set iframe height to match content
        iframe.style.height = `${calculatedHeight}px`;
        iframeDoc.body.style.minHeight = `${calculatedHeight}px`;
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
    <div className={cn('bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden flex flex-col h-full', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50/50 border-b border-gray-200/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"
          />
          <p className="text-sm font-semibold text-gray-800">Live Preview</p>
        </div>
        <p className="text-xs text-gray-600 font-medium">Updates automatically</p>
      </div>

      {/* Scrollable Preview Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-white to-gray-50/50"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* White Box Container with Shadow */}
        <div className="p-4 lg:p-6 flex items-start justify-center min-h-full py-6">
          <div 
            className="bg-white rounded-xl shadow-2xl border border-gray-200/80 overflow-hidden mx-auto"
            style={{
              width: '100%',
              maxWidth: '850px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Iframe - Natural Size, Responsive */}
            <iframe
              ref={iframeRef}
              className="border-0 bg-white block w-full"
              title="Resume Preview"
              sandbox="allow-same-origin"
              style={{
                width: '100%',
                minWidth: '794px',
                minHeight: '1123px',
                border: 'none',
                backgroundColor: '#ffffff',
                display: 'block',
                margin: 0,
                padding: 0,
              }}
              onLoad={() => {
                // Adjust height when iframe loads
                setTimeout(() => {
                  adjustIframeHeight();
                }, 200);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
