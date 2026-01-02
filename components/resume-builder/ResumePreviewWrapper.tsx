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
} from '@/components/ui/dialog';
import { Maximize2 } from 'lucide-react';

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
  const templateCacheRef = useRef<{ template: Template | null; html: string; css: string } | null>(null);
  const previousFormDataRef = useRef<string>('');
  const fullPreviewIframeRef = useRef<HTMLIFrameElement>(null);

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

    const iframeDoc = targetIframe.contentDocument || targetIframe.contentWindow?.document;
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

      // Inject form data into template
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
      background: transparent;
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

      iframeDoc.open();
      iframeDoc.write(completeHTML);
      iframeDoc.close();

      // Wait for iframe to fully load, then resize
      setTimeout(() => {
        if (onResize) onResize();
      }, 150);
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

  // Update full preview modal when it's open and data changes
  useEffect(() => {
    if (!showFullPreview || !templateCacheRef.current || loading) return;
    
    const renderFullPreview = async () => {
      // Wait for iframe to be available
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryRender = () => {
        const iframe = fullPreviewIframeRef.current;
        if (!iframe) {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(tryRender, 50);
          }
          return;
        }
        
        const resizeFullPreview = () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc || !iframeDoc.body) return;
            
            const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
            if (resumeContainer) {
              const contentHeight = Math.max(
                resumeContainer.scrollHeight,
                resumeContainer.offsetHeight
              );
              if (contentHeight > 0) {
                iframe.style.height = `${contentHeight + 40}px`;
              }
            }
          } catch (err) {
            console.warn('Error resizing full preview:', err);
          }
        };
        
        // Render the preview
        renderPreviewInIframe(iframe, resizeFullPreview);
      };
      
      // Start trying to render
      tryRender();
    };
    
    // Render when modal opens
    renderFullPreview();
  }, [showFullPreview, formData, selectedColorId, loading, renderPreviewInIframe]);

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
            sandbox="allow-same-origin"
            onLoad={resizeIframe}
          />
        )}
        {error && (
          <div style={{ padding: '20px', color: '#6b7280', textAlign: 'center' }}>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Full Preview Modal */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent 
          className="max-w-[95vw] w-full h-[95vh] p-0 gap-0"
          style={{
            maxWidth: '95vw',
            width: '95vw',
            height: '95vh',
            maxHeight: '95vh',
            padding: 0,
            margin: 0,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#f5f5f5',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              background: 'white',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#374151',
              }}>
                Full Resume Preview
              </h2>
            </div>

            {/* Scrollable Preview Container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '24px',
              minHeight: 0,
            }}>
              <iframe
                key={showFullPreview ? 'full-preview-open' : 'full-preview-closed'}
                ref={fullPreviewIframeRef}
                title="Full Resume Preview"
                style={{
                  width: '900px',
                  maxWidth: '100%',
                  height: 'auto',
                  minHeight: '800px',
                  border: 'none',
                  display: 'block',
                  background: 'white',
                }}
                sandbox="allow-same-origin"
                onLoad={() => {
                  // Render content when iframe loads
                  if (fullPreviewIframeRef.current && templateCacheRef.current && !loading && showFullPreview) {
                    const resizeFullPreview = () => {
                      const iframe = fullPreviewIframeRef.current;
                      if (!iframe) return;
                      
                      try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!iframeDoc || !iframeDoc.body) return;
                        
                        const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
                        if (resumeContainer) {
                          const contentHeight = Math.max(
                            resumeContainer.scrollHeight,
                            resumeContainer.offsetHeight
                          );
                          if (contentHeight > 0) {
                            iframe.style.height = `${contentHeight + 40}px`;
                          }
                        }
                      } catch (err) {
                        console.warn('Error resizing full preview:', err);
                      }
                    };
                    
                    renderPreviewInIframe(fullPreviewIframeRef.current, resizeFullPreview);
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
