'use client';

import { useEffect, useRef, useState } from 'react';
import { loadTemplate, applyColorVariant, injectResumeData, type Template, type ColorVariant, type LoadedTemplate } from '@/lib/resume-builder/template-loader';
import { cn } from '@/lib/utils';

interface TemplateRendererProps {
  templateId: string;
  formData: Record<string, any>;
  selectedColorId?: string;
  className?: string;
}

export default function TemplateRenderer({
  templateId,
  formData,
  selectedColorId,
  className,
}: TemplateRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        console.log('[TemplateRenderer] Loading template:', templateId);
        
        let loaded: LoadedTemplate | null;
        try {
          loaded = await loadTemplate(templateId);
        } catch (loadError) {
          console.error('[TemplateRenderer] loadTemplate threw an error:', loadError);
          throw new Error(loadError instanceof Error ? loadError.message : `Template "${templateId}" failed to load`);
        }
        
        if (!loaded) {
          console.error(`[TemplateRenderer] loadTemplate returned null for: ${templateId}`);
          throw new Error(`Template "${templateId}" not found or failed to load`);
        }
        
        if (!mounted) return;

        const { template: templateData, html, css } = loaded;
        console.log('[TemplateRenderer] Template loaded:', templateData.name);
        console.log('[TemplateRenderer] HTML length:', html.length);
        console.log('[TemplateRenderer] CSS length:', css.length);
        
        setTemplate(templateData);

        // Get selected color variant
        const colorVariant = selectedColorId
          ? templateData.colors.find((c) => c.id === selectedColorId) || templateData.colors.find((c) => c.id === templateData.defaultColor)
          : templateData.colors.find((c) => c.id === templateData.defaultColor);

        if (!colorVariant) {
          throw new Error('Color variant not found');
        }

        // Apply color variant to CSS
        const themedCSS = applyColorVariant(css, colorVariant);

        // Inject resume data into HTML
        const populatedHTML = injectResumeData(html, formData);
        console.log('[TemplateRenderer] Form data keys:', Object.keys(formData));
        console.log('[TemplateRenderer] Populated HTML length:', populatedHTML.length);

        // Render in iframe
        if (!iframeRef.current) {
          console.warn('[TemplateRenderer] Iframe ref not available');
          setLoading(false);
          return;
        }

        const iframe = iframeRef.current;
        
        // Wait for iframe to be ready
        const renderContent = () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            
            if (!iframeDoc) {
              console.error('[TemplateRenderer] Cannot access iframe document');
              setError('Cannot access iframe document. This may be a CORS or security issue.');
              setLoading(false);
              return;
            }

            console.log('[TemplateRenderer] Writing content to iframe...');
            
            // Clean up any existing content
            iframeDoc.open();
            
            // Extract body content if HTML includes full document structure
            let bodyContent = populatedHTML;
            const bodyMatch = populatedHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (bodyMatch) {
              bodyContent = bodyMatch[1].trim();
            } else if (populatedHTML.includes('<!DOCTYPE') || populatedHTML.includes('<html')) {
              // If it's a full HTML document, try to extract just the inner content
              const innerMatch = populatedHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
              if (innerMatch) {
                bodyContent = innerMatch[1].trim();
              }
            }
            
            iframeDoc.write(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    ${themedCSS}
                    /* Ensure iframe content is isolated */
                    * {
                      box-sizing: border-box;
                    }
                    html, body {
                      margin: 0;
                      padding: 0;
                      overflow-x: hidden;
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    }
                    .resume-container {
                      max-width: 100%;
                      margin: 0 auto;
                      padding: 20px;
                    }
                  </style>
                </head>
                <body>
                  ${bodyContent}
                </body>
              </html>
            `);
            iframeDoc.close();
            
            console.log('[TemplateRenderer] Content written to iframe');
            
            // Adjust iframe height after content loads
            const adjustHeight = () => {
              if (iframeDoc.body && mounted) {
                const height = Math.max(
                  iframeDoc.body.scrollHeight,
                  iframeDoc.body.offsetHeight,
                  iframeDoc.documentElement.scrollHeight,
                  iframeDoc.documentElement.offsetHeight,
                  600
                );
                if (iframeRef.current) {
                  iframeRef.current.style.height = `${height + 20}px`; // Add padding
                }
                console.log('[TemplateRenderer] Iframe height adjusted to:', height);
              }
            };
            
            // Try multiple times to ensure content is rendered
            setTimeout(adjustHeight, 100);
            setTimeout(adjustHeight, 300);
            setTimeout(adjustHeight, 500);
          } catch (err) {
            console.error('[TemplateRenderer] Error writing to iframe:', err);
            setError(err instanceof Error ? err.message : 'Failed to render template in iframe');
            setLoading(false);
          }
        };

        // Wait for iframe to be ready
        if (iframe.contentDocument?.readyState === 'complete') {
          console.log('[TemplateRenderer] Iframe ready, rendering immediately');
          renderContent();
        } else {
          console.log('[TemplateRenderer] Waiting for iframe to load...');
          iframe.onload = () => {
            console.log('[TemplateRenderer] Iframe onload fired');
            renderContent();
          };
          // Fallback timeout
          setTimeout(() => {
            if (mounted) {
              console.log('[TemplateRenderer] Fallback timeout, rendering anyway');
              renderContent();
            }
          }, 1000);
        }

        setLoading(false);
      } catch (err) {
        console.error('[TemplateRenderer] Error rendering template:', err);
        setError(err instanceof Error ? err.message : 'Failed to render template');
        setLoading(false);
      }
    }

    loadAndRender();

    return () => {
      mounted = false;
    };
  }, [templateId, formData, selectedColorId]);

  if (error) {
    return (
      <div className={cn('p-8 text-center text-red-600', className)}>
        <p>Error loading template: {error}</p>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading template...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className={cn(
          'w-full border-0 rounded-lg',
          'bg-white',
          loading && 'opacity-0'
        )}
        style={{
          minHeight: '800px',
          height: '100%',
        }}
        title="Resume Preview"
        sandbox="allow-same-origin allow-scripts"
        allow="same-origin"
      />
    </div>
  );
}

