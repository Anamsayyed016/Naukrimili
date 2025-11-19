'use client';

import { useEffect, useRef, useState } from 'react';
import { loadTemplate, applyColorVariant, injectResumeData, type Template, type ColorVariant } from '@/lib/resume-builder/template-loader';
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

        const loaded = await loadTemplate(templateId);
        if (!loaded || !mounted) return;

        const { template: templateData, html, css } = loaded;
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

        // Render in iframe
        if (iframeRef.current) {
          const iframe = iframeRef.current;
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>${themedCSS}</style>
                </head>
                <body>
                  ${populatedHTML}
                </body>
              </html>
            `);
            iframeDoc.close();
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error rendering template:', err);
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
      />
    </div>
  );
}

