'use client';

import { useState, useEffect, useRef } from 'react';
import { loadTemplate, applyColorVariant, injectResumeData, type LoadedTemplate, type ColorVariant } from '@/lib/resume-builder/template-loader';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { Template } from '@/lib/resume-builder/template-loader';

interface TemplatePreviewGalleryProps {
  templates: Template[];
  formData: Record<string, any>;
  selectedTemplateId: string | null;
  onTemplateSelect: (templateId: string) => void;
}

export default function TemplatePreviewGallery({
  templates,
  formData,
  selectedTemplateId,
  onTemplateSelect,
}: TemplatePreviewGalleryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Template Gallery</h3>
      <p className="text-sm text-gray-600 mb-6">
        See how your resume looks in different templates. Click to select.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <CompactTemplatePreview
            key={template.id}
            template={template}
            formData={formData}
            isSelected={selectedTemplateId === template.id}
            onSelect={() => onTemplateSelect(template.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface CompactTemplatePreviewProps {
  template: Template;
  formData: Record<string, any>;
  isSelected: boolean;
  onSelect: () => void;
}

function CompactTemplatePreview({
  template,
  formData,
  isSelected,
  onSelect,
}: CompactTemplatePreviewProps) {
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

        // Load template
        const loaded: LoadedTemplate | null = await loadTemplate(template.id);
        
        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${template.id}" not found`);
        }

        const { template: templateMeta, html, css } = loaded;

        // Get default color variant
        const colorVariant = templateMeta.colors.find((c: ColorVariant) => c.id === templateMeta.defaultColor) || templateMeta.colors[0];

        // Apply color variant to CSS
        const coloredCss = applyColorVariant(css, colorVariant);

        // Inject resume data into HTML
        const dataInjectedHtml = injectResumeData(html, formData);

        // Combine into full HTML document (compact version for gallery)
        const fullHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              ${coloredCss}
              body { 
                margin: 0;
                padding: 0;
                overflow: hidden;
              }
              @page {
                size: 8.5in 11in;
                margin: 0;
              }
            </style>
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
  }, [template.id, formData]);

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

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200",
        "hover:shadow-lg bg-white",
        isSelected
          ? "border-blue-600 shadow-lg ring-4 ring-blue-200 ring-offset-2"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Template Name */}
      <div className="absolute top-2 left-2 z-10">
        <div className={cn(
          "px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm",
          isSelected ? "bg-blue-600 text-white" : "bg-black/50 text-white"
        )}>
          {template.name}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-blue-600 rounded-full p-1.5 shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className="relative w-full aspect-[8.5/11] bg-gray-100 overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <p className="text-xs text-red-600 text-center">{error}</p>
          </div>
        ) : (
          <div 
            className="w-full h-full overflow-hidden" 
            style={{ 
              transform: 'scale(0.25)', 
              transformOrigin: 'top left', 
              width: '400%', 
              height: '400%' 
            }}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0 pointer-events-none"
              title={`Preview: ${template.name}`}
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        "flex items-end justify-center pb-2"
      )}>
        <div className="text-white text-sm font-medium">
          {isSelected ? 'Selected' : 'Click to select'}
        </div>
      </div>
    </div>
  );
}

