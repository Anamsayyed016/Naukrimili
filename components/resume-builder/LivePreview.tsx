'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import template-loader to avoid module initialization issues
        const { loadTemplate } = await import('@/lib/resume-builder/template-loader');
        
        // Load template
        const loaded: LoadedTemplate | null = await loadTemplate(templateId);
        
        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${templateId}" not found`);
        }

        const { template, html, css } = loaded;

        // Get selected color variant
        const colorVariant = selectedColorId
          ? template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0]
          : template.colors.find((c: ColorVariant) => c.id === template.defaultColor) || template.colors[0];

        // Dynamically import applyColorVariant to avoid module initialization issues
        const { applyColorVariant } = await import('@/lib/resume-builder/template-loader');
        
        // Apply color variant to CSS
        const coloredCss = applyColorVariant(css, colorVariant);

        // Dynamically import injectResumeData to avoid module initialization issues
        const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
        
        // Inject resume data into HTML
        const dataInjectedHtml = injectResumeData(html, formData);

        // Combine into full HTML document
        const fullHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${coloredCss}</style>
          </head>
          <body>
            ${dataInjectedHtml}
          </body>
          </html>
        `;

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
  }, [templateId, formData, selectedColorId]);

  // Update iframe content when previewHtml changes
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }
  }, [previewHtml]);

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
    <div className={cn('bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden', className)}>
      <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-sm font-semibold text-gray-700">Live Preview</p>
        </div>
        <p className="text-xs text-gray-500">Updates automatically</p>
      </div>
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 p-4 lg:p-6">
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ aspectRatio: '8.5/11', width: '100%' }}>
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Resume Preview"
            sandbox="allow-same-origin"
            style={{ 
              width: '100%',
              height: '100%',
              minHeight: '600px',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
}

