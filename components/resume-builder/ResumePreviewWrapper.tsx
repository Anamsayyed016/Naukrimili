'use client';

/**
 * Resume Preview Wrapper Component - Enhanced with Template System
 * 
 * Loads and renders the actual selected template with:
 * - Real template HTML and CSS from the gallery system
 * - Color variants applied properly
 * - Live resume data injection
 * - Independent vertical scrolling
 * - Professional template graphics and styling
 * 
 * Features:
 * - Uses the same template-loader system as the gallery
 * - Applies selected color variants
 * - Auto-updates when form data changes
 * - Sticky positioning for independent scrolling
 * - No conflicts with existing components
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useResponsive } from '@/components/ui/use-mobile';
import type { LoadedTemplate, ColorVariant, Template } from '@/lib/resume-builder/types';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog';
import { Maximize2, X } from 'lucide-react';

interface ResumePreviewWrapperProps {
  formData: Record<string, unknown>;
  templateId?: string;
  selectedColorId?: string;
  className?: string;
}

export default function ResumePreviewWrapper({
  formData,
  templateId,
  selectedColorId,
  className = '',
}: ResumePreviewWrapperProps) {
  const { isMobile } = useResponsive();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [fullPreviewHTML, setFullPreviewHTML] = useState<string | null>(null);
  const fullPreviewIframeRef = useRef<HTMLIFrameElement>(null);
  const templateCacheRef = useRef<{ template: Template | null; html: string; css: string } | null>(null);
  const previousFormDataRef = useRef<string>('');

  // Load template on mount or when templateId changes
  useEffect(() => {
    let mounted = true;

    async function loadTemplateData() {
      if (!templateId) {
        setError('No template selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Clear cache to force reload (important for CSS updates)
        templateCacheRef.current = null;

        // Dynamically import to avoid module initialization issues
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

    loadTemplateData();

    return () => {
      mounted = false;
    };
  }, [templateId]);

  // Function to resize iframe based on content
  const resizeIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) return;

      // Wait for content to be fully rendered, try multiple times for reliability
      const attemptResize = (delay: number) => {
        setTimeout(() => {
          try {
            // First, try to find the resume-container element (most accurate)
            const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
            let contentHeight = 0;

            if (resumeContainer) {
              // Use resume-container height if available (most accurate)
              // Force a reflow to get accurate measurements
              void resumeContainer.offsetHeight;
              const rect = resumeContainer.getBoundingClientRect();
              
              // Get the actual rendered height - use scrollHeight as it includes all content
              contentHeight = Math.max(
                resumeContainer.scrollHeight,
                resumeContainer.offsetHeight,
                rect.height,
                resumeContainer.getBoundingClientRect().height
              );
              
              console.log('📐 [Preview] Resume container found:', {
                scrollHeight: resumeContainer.scrollHeight,
                offsetHeight: resumeContainer.offsetHeight,
                rectHeight: rect.height,
                final: contentHeight
              });
            } else {
              // Fallback to body/html height - account for body padding
              const body = iframeDoc.body;
              const html = iframeDoc.documentElement;
              const bodyStyle = window.getComputedStyle(body);
              const bodyPaddingTop = parseFloat(bodyStyle.paddingTop) || 0;
              const bodyPaddingBottom = parseFloat(bodyStyle.paddingBottom) || 0;
              
              // Get scrollHeight which includes all content
              const bodyScrollHeight = body.scrollHeight || body.offsetHeight;
              const htmlScrollHeight = html.scrollHeight || html.offsetHeight;
              
              contentHeight = Math.max(
                bodyScrollHeight,
                body.offsetHeight,
                htmlScrollHeight,
                html.offsetHeight,
                body.getBoundingClientRect().height,
                html.getBoundingClientRect().height
              );
              
              console.log('📐 [Preview] Using body/html height:', {
                bodyScrollHeight,
                htmlScrollHeight,
                bodyPadding: bodyPaddingTop + bodyPaddingBottom,
                final: contentHeight
              });
            }

            // Set iframe height to match content (add buffer for margins/padding)
            if (contentHeight > 0) {
              // Add buffer for any outer margins/padding
              const buffer = 80; // Increased buffer for safety
              const newHeight = contentHeight + buffer;
              
              iframe.style.height = `${newHeight}px`;
              iframe.style.minHeight = `${newHeight}px`;
              iframe.style.maxHeight = 'none';
              
              console.log('✅ [Preview] Iframe resized to:', newHeight, 'px (content:', contentHeight, 'px, buffer:', buffer, 'px)');
            } else {
              console.warn('⚠️ [Preview] Content height is 0, cannot resize');
            }
          } catch (resizeError) {
            console.warn('Error resizing iframe:', resizeError);
          }
        }, delay);
      };

      // Try resizing at multiple intervals to catch late-rendering content
      attemptResize(100);
      attemptResize(300);
      attemptResize(600);
      attemptResize(1000);
    } catch (err) {
      console.warn('Error accessing iframe document:', err);
    }
  }, []);

  // Helper function to render preview in an iframe (reusable for both main preview and fullscreen modal)
  const renderPreviewInIframe = useCallback(async (targetIframe: HTMLIFrameElement, onResize?: () => void) => {
    if (!templateCacheRef.current || loading) return;

    let iframeDoc: Document | null = null;
    try {
      iframeDoc = targetIframe.contentDocument || targetIframe.contentWindow?.document;
    } catch (e) {
      console.warn('Cannot access iframe document:', e);
      return;
    }
    
    if (!iframeDoc) {
      // Try to initialize iframe with blank document
      try {
        if (targetIframe.contentWindow) {
          iframeDoc = targetIframe.contentWindow.document;
        }
      } catch (e) {
        console.warn('Cannot initialize iframe document:', e);
        return;
      }
    }
    
    if (!iframeDoc) return;

    try {
      const { template, html, css } = templateCacheRef.current;

      // Apply color variant if selected
      let finalCss = css;
      if (selectedColorId) {
        const { applyColorVariant } = await import('@/lib/resume-builder/template-loader');
        const colorVariant = template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0];
        finalCss = applyColorVariant(css, colorVariant);
      }

      // Inject user's formData directly into template (no sample data)
      // All sections will render based on what user has entered
      const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
      const injectedHtml = injectResumeData(html, formData);

      // Build complete HTML document
      const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Preview</title>
  <style>
    ${finalCss}
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body { 
      margin: 0;
      padding: 0;
      overflow: visible;
      width: 100%;
      height: auto;
      position: relative;
    }
    body {
      -webkit-overflow-scrolling: touch;
      background: white;
    }
    @page {
      size: 8.5in 11in;
      margin: 0;
    }
  </style>
</head>
<body>
  ${injectedHtml}
</body>
</html>`;

      console.log('📝 [Render Preview] Writing HTML to iframe, length:', completeHTML.length);
      iframeDoc.open();
      iframeDoc.write(completeHTML);
      iframeDoc.close();
      
      console.log('✅ [Render Preview] HTML written to iframe');

      // Wait for iframe to fully load, then resize
      setTimeout(() => {
        // Verify content was written
        try {
          const body = iframeDoc.body;
          const hasContent = body && body.querySelector('.resume-container');
          console.log('🔍 [Render Preview] Content verification:', {
            hasBody: !!body,
            hasContent: !!hasContent,
            bodyHTML: body ? body.innerHTML.substring(0, 100) : 'no body'
          });
        } catch (e) {
          console.warn('⚠️ [Render Preview] Could not verify content:', e);
        }
        
        if (onResize) onResize();
      }, 200);
    } catch (err) {
      console.error('Error rendering preview:', err);
    }
  }, [formData, selectedColorId, loading]);

  // Update preview when formData or color changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !templateCacheRef.current || loading) return;

    // Create stable string representation for comparison
    const formDataString = JSON.stringify(formData, Object.keys(formData).sort());

    // Only update if form data actually changed
    if (previousFormDataRef.current === formDataString && !selectedColorId) return;

    previousFormDataRef.current = formDataString;

    renderPreviewInIframe(iframe, resizeIframe);
  }, [formData, selectedColorId, loading, renderPreviewInIframe, resizeIframe]);

  // Generate PDF-style HTML for full preview (matches PDF export exactly)
  const generateFullPreviewHTML = useCallback(async () => {
    if (!templateCacheRef.current || !templateId) return null;

    try {
      const { template, html, css } = templateCacheRef.current;

      // Apply color variant if selected
      let finalCss = css;
      if (selectedColorId) {
        const { applyColorVariant } = await import('@/lib/resume-builder/template-loader');
        const colorVariant = template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0];
        finalCss = applyColorVariant(css, colorVariant);
      }

      // Inject user's formData into template
      const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
      const injectedHtml = injectResumeData(html, formData);

      // Build PDF-optimized HTML document (same format as PDF export)
      const pdfOptimizedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${finalCss}
    
    /* PDF Export Optimizations - Lock to A4 width and prevent layout shifts */
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
      height: 100% !important;
      overflow-x: hidden !important;
      overflow-y: visible !important;
    }
    
    /* Lock resume container to A4 dimensions (210mm x 297mm = 794px x 1123px at 96 DPI) */
    .resume-container {
      width: 794px !important;
      max-width: 794px !important;
      min-width: 794px !important;
      margin: 0 auto !important;
      background: white !important;
      box-sizing: border-box !important;
      position: relative !important;
      transform-origin: top center !important;
    }
    
    /* Prevent layout shifts - lock all widths */
    .resume-wrapper,
    .sidebar,
    .content,
    section,
    .section {
      box-sizing: border-box !important;
    }
    
    /* Page break rules - force single page */
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    /* Preserve all graphics, icons, and colors */
    img {
      display: block !important;
      max-width: 100% !important;
      height: auto !important;
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
  </style>
</head>
<body>
  ${injectedHtml}
</body>
</html>`;

      return pdfOptimizedHTML;
    } catch (err) {
      console.error('Error generating full preview HTML:', err);
      return null;
    }
  }, [formData, selectedColorId, templateId]);

  // Generate HTML when full preview opens
  useEffect(() => {
    if (showFullPreview && templateCacheRef.current) {
      generateFullPreviewHTML().then((html) => {
        setFullPreviewHTML(html);
      }).catch((err) => {
        console.error('Error generating full preview HTML:', err);
        setFullPreviewHTML(null);
      });
    } else {
      setFullPreviewHTML(null);
    }
  }, [showFullPreview, generateFullPreviewHTML]);

  // Prevent body scroll when full preview is open + ESC key handler
  useEffect(() => {
    if (showFullPreview) {
      // Save current scroll position and prevent scrolling
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const scrollY = window.scrollY;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Handle ESC key to close modal
      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
          event.preventDefault();
          event.stopPropagation();
          setShowFullPreview(false);
        }
      };
      
      window.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        // Restore scroll position
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        window.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showFullPreview]);

  return (
    <div
      className={`resume-preview-wrapper ${className}`}
      style={{
        height: isMobile ? 'auto' : 'calc(100vh - 120px)',
        position: isMobile ? 'relative' : 'sticky',
        top: isMobile ? undefined : 16,
        display: 'flex',
        flexDirection: 'column',
        background: '#f3f4f6',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 12px 30px -12px rgba(15, 23, 42, 0.2)',
      }}
    >
      {/* Preview Header */}
      <div 
        style={{
          padding: isMobile ? '10px 12px' : '12px 16px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: 600,
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Live Preview</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {loading && (
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loading...</div>
          )}
          {error && (
            <div style={{ fontSize: '12px', color: '#ef4444' }}>Error loading template</div>
          )}
          {!error && !loading && (
            <button
              onClick={() => setShowFullPreview(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#3b82f6',
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <Maximize2 size={14} />
              <span>View Full Resume</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Preview Container */}
      <div
        style={{
          flex: 1,
          minHeight: 0, // Critical for flex child to allow scrolling
          overflowY: 'auto',
          overflowX: 'hidden', // Prevent horizontal scroll, ensure full width visibility
          background: '#f5f5f5', // Match typical resume background
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: isMobile ? '12px 10px' : '16px',
        }}
      >
        {!error && (
          <iframe
            ref={iframeRef}
            title="Resume Preview"
            style={{
              width: isMobile ? '100%' : '900px', // Natural resume width to ensure sidebar (280px) + main content (~514px) + padding are fully visible
              maxWidth: '100%', // Respect container width to prevent overflow
              height: 'auto',
              minHeight: '800px',
              border: 'none',
              display: 'block',
              background: 'transparent', // Transparent so preview container background shows
            }}
            sandbox="allow-same-origin allow-scripts"
            onLoad={resizeIframe}
          />
        )}
        {error && (
          <div style={{ padding: '20px', color: '#6b7280', textAlign: 'center' }}>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Full Preview Modal - PDF Format */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent 
          className="p-0 gap-0 [&>button]:hidden"
          onInteractOutside={(e) => {
            // Prevent closing on backdrop click for fullscreen experience
            // Users should use the close button or ESC key
            e.preventDefault();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            padding: 0,
            margin: 0,
            transform: 'none',
            translate: 'none',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            border: 'none',
            zIndex: 9999,
          }}
        >
          <DialogTitle className="sr-only">Full Resume Preview - PDF Format</DialogTitle>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            maxHeight: '100vh',
            background: '#f5f5f5',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Modal Header with Close Button - Fixed Position */}
            <div style={{
              padding: isMobile ? '12px 16px' : '16px 20px',
              background: 'white',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 10000,
              flexShrink: 0,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFullPreview(false);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  minHeight: isMobile ? '40px' : '44px',
                  borderRadius: '8px',
                  border: '2px solid #3b82f6',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  zIndex: 10001,
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  lineHeight: 1,
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Back to Editor"
                title="Back to Editor (Esc)"
              >
                <span style={{ fontSize: isMobile ? '18px' : '20px', lineHeight: 1 }}>←</span>
                <span>Back to Editor</span>
              </button>
              <h2 style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#374151',
                margin: 0,
                flex: 1,
                textAlign: 'center',
                paddingLeft: '12px',
                paddingRight: '12px',
              }}>
                Full Resume Preview (PDF Format)
              </h2>
              <div style={{ width: isMobile ? '120px' : '140px', flexShrink: 0 }} /> {/* Spacer for alignment */}
            </div>

            {/* PDF Format Preview Container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: isMobile ? '16px 8px' : '24px',
              minHeight: 0,
              maxHeight: '100%',
              background: '#f5f5f5',
              WebkitOverflowScrolling: 'touch',
            }}>
              {showFullPreview && (
                fullPreviewHTML ? (
                  <iframe
                    key={fullPreviewHTML.substring(0, 100)} // Force re-render when HTML changes
                    ref={fullPreviewIframeRef}
                    title="Full Resume Preview - PDF Format"
                    srcDoc={fullPreviewHTML}
                    style={{
                      width: '794px',
                      maxWidth: '100%',
                      height: '1123px',
                      minHeight: '1123px',
                      border: 'none',
                      display: 'block',
                      background: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    sandbox="allow-same-origin allow-scripts"
                    onLoad={() => {
                      const iframe = fullPreviewIframeRef.current;
                      if (!iframe) return;
                      
                      try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!iframeDoc || !iframeDoc.body) {
                          console.warn('⚠️ [Full Preview] Iframe document or body not available');
                          return;
                        }
                        
                        console.log('✅ [Full Preview] Iframe loaded, checking for resume container...');
                        const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
                        if (resumeContainer) {
                          console.log('✅ [Full Preview] Resume container found, adjusting height...');
                          const contentHeight = Math.max(
                            resumeContainer.scrollHeight,
                            resumeContainer.offsetHeight,
                            1123
                          );
                          if (contentHeight > 0) {
                            iframe.style.height = `${contentHeight + 40}px`;
                          }
                        } else {
                          console.warn('⚠️ [Full Preview] Resume container not found in iframe');
                        }
                      } catch (err) {
                        console.error('❌ [Full Preview] Error in onLoad:', err);
                      }
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6b7280',
                  }}>
                    Loading preview...
                  </div>
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
