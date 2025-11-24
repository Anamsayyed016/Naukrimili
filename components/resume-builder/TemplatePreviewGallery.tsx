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
      <h3 className="text-xl font-bold text-gray-900 mb-2">Template Gallery</h3>
      <p className="text-sm text-gray-600 mb-6">
        See how your resume looks in different templates. Click any template to start editing.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        "relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200",
        "hover:shadow-xl bg-white",
        isSelected
          ? "border-blue-600 shadow-xl ring-4 ring-blue-200 ring-offset-2 scale-[1.02]"
          : "border-gray-200 hover:border-gray-300 hover:scale-[1.01]"
      )}
    >
      {/* Template Name */}
      <div className="absolute top-3 left-3 z-10">
        <div className={cn(
          "px-3 py-1.5 rounded-md text-sm font-bold backdrop-blur-sm shadow-md",
          isSelected ? "bg-blue-600 text-white" : "bg-black/70 text-white"
        )}>
          {template.name}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-blue-600 rounded-full p-2 shadow-xl">
            <Check className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Preview Container - Desktop Size */}
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
              transform: 'scale(0.55)', 
              transformOrigin: 'top left', 
              width: '181.82%', 
              height: '181.82%' 
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
        "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        "flex items-end justify-center pb-4"
      )}>
        <div className="text-white text-base font-semibold bg-blue-600/90 px-4 py-2 rounded-lg shadow-lg">
          {isSelected ? '✓ Selected - Click to Edit' : 'Click to Start Editing'}
        </div>
      </div>
    </div>
  );
}

