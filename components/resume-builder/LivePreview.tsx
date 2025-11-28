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

  // Create a stable reference for formData that changes when nested arrays change
  const formDataString = JSON.stringify(formData);
  
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
        
        // Parse formData from string to ensure we have the latest data
        const currentFormData = JSON.parse(formDataString);
        
        // Debug: Log formData to check what sections have data (always enabled for troubleshooting)
        console.log('[LivePreview] formData check:', {
          hasLanguages: !!currentFormData.languages && Array.isArray(currentFormData.languages) && currentFormData.languages.length > 0,
          hasProjects: !!currentFormData.projects && Array.isArray(currentFormData.projects) && currentFormData.projects.length > 0,
          hasCertifications: !!currentFormData.certifications && Array.isArray(currentFormData.certifications) && currentFormData.certifications.length > 0,
          hasAchievements: !!currentFormData.achievements && Array.isArray(currentFormData.achievements) && currentFormData.achievements.length > 0,
          languages: currentFormData.languages,
          projects: currentFormData.projects,
          certifications: currentFormData.certifications,
          achievements: currentFormData.achievements,
          formDataKeys: Object.keys(currentFormData),
        });
        
        // Inject resume data into HTML
        const dataInjectedHtml = injectResumeData(html, currentFormData);

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

        console.log('[LivePreview] Generated HTML length:', fullHtml.length);
        console.log('[LivePreview] HTML body preview:', dataInjectedHtml.substring(0, 500));

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
  }, [templateId, formDataString, selectedColorId]);

  // Update iframe content when previewHtml changes
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        try {
          iframeDoc.open();
          iframeDoc.write(previewHtml);
          iframeDoc.close();
          
          // Debug: Log iframe content after writing
          console.log('[LivePreview] Iframe content written, body length:', iframeDoc.body?.innerHTML?.length || 0);
          console.log('[LivePreview] Iframe body preview:', iframeDoc.body?.innerHTML?.substring(0, 200) || 'empty');
        } catch (error) {
          console.error('[LivePreview] Error writing to iframe:', error);
        }
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
    <div className={cn('bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full', className)}>
      <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <p className="text-sm font-semibold text-gray-700">Live Preview</p>
        </div>
        <p className="text-xs text-gray-500">Updates automatically</p>
      </div>
      <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 p-3 lg:p-4 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden mx-auto" style={{ width: '100%' }}>
          <div 
            className="w-full"
            style={{ 
              aspectRatio: '8.5/11',
              position: 'relative',
              minHeight: '600px'
            }}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Resume Preview"
              sandbox="allow-same-origin allow-scripts"
              style={{ 
                width: '100%',
                height: '100%',
                display: 'block',
                border: 'none',
                minHeight: '600px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

