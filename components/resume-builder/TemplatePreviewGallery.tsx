'use client';

import { useState, useEffect, useRef } from 'react';
import type { LoadedTemplate, ColorVariant, Template } from '@/lib/resume-builder/types';
import { cn } from '@/lib/utils';
import { Check, FileText, Sparkles } from 'lucide-react';
import Image from 'next/image';

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
  if (templates.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Template Gallery</h3>
        <p className="text-sm text-gray-600 mb-6">
          See how your resume looks in different templates. Click any template to start editing.
        </p>
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No templates found matching your filters.</p>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Template Gallery</h3>
        <p className="text-sm text-gray-600">
          See how your resume looks in different templates. Click any template to start editing.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <EnhancedTemplateCard
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

interface EnhancedTemplateCardProps {
  template: Template;
  formData: Record<string, any>;
  isSelected: boolean;
  onSelect: () => void;
}

function EnhancedTemplateCard({
  template,
  formData,
  isSelected,
  onSelect,
}: EnhancedTemplateCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [useImagePreview, setUseImagePreview] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Try to use thumbnail/preview image first
  useEffect(() => {
    if (template.preview || template.thumbnail) {
      setUseImagePreview(true);
      setLoading(false);
    } else {
      setUseImagePreview(false);
    }
  }, [template.preview, template.thumbnail]);

  // Load live preview if image not available
  useEffect(() => {
    if (useImagePreview) return;

    let mounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import template-loader functions to avoid module initialization issues
        const { loadTemplate, applyColorVariant, injectResumeData } = await import('@/lib/resume-builder/template-loader');

        const loaded: LoadedTemplate | null = await loadTemplate(template.id);
        
        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${template.id}" not found`);
        }

        const { template: templateMeta, html, css } = loaded;
        const colorVariant = templateMeta.colors.find((c: ColorVariant) => c.id === templateMeta.defaultColor) || templateMeta.colors[0];
        const coloredCss = applyColorVariant(css, colorVariant);
        
        // Use sample data if formData is empty for better preview
        const sampleData = Object.keys(formData).length === 0 ? {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1 234 567 8900',
          jobTitle: 'Software Engineer',
          location: 'New York, NY',
          summary: 'Experienced professional with a strong background in software development.',
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          experience: [{
            title: 'Senior Developer',
            company: 'Tech Corp',
            startDate: '2020',
            endDate: 'Present',
            description: 'Led development of key features and improvements.'
          }],
          education: [{
            degree: 'Bachelor of Science',
            school: 'University',
            field: 'Computer Science',
            graduationDate: '2018'
          }]
        } : formData;
        
        const dataInjectedHtml = injectResumeData(html, sampleData);

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
                font-size: 10px;
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
  }, [template.id, formData, useImagePreview]);

  // Update iframe content when previewHtml changes
  useEffect(() => {
    if (!useImagePreview && iframeRef.current && previewHtml) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }
  }, [previewHtml, useImagePreview]);

  const handleImageError = () => {
    setImageError(true);
    setUseImagePreview(false);
    setLoading(true);
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300",
        "bg-white hover:shadow-xl",
        isSelected
          ? "border-blue-600 shadow-xl ring-4 ring-blue-100"
          : "border-gray-200 hover:border-blue-300"
      )}
    >
      {/* Template Name Badge */}
      <div className="absolute top-3 left-3 z-20">
        <div className={cn(
          "px-3 py-1.5 rounded-md text-xs font-semibold backdrop-blur-md shadow-lg",
          isSelected 
            ? "bg-blue-600 text-white" 
            : "bg-gray-900/80 text-white"
        )}>
          {template.name}
        </div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-blue-600 rounded-full p-1.5 shadow-lg">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Recommended Badge */}
      {template.recommended && !isSelected && (
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-md shadow-md">
            ★ Recommended
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className="relative w-full aspect-[8.5/11] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {useImagePreview && (template.preview || template.thumbnail) && !imageError ? (
          <>
            <Image
              src={template.preview || template.thumbnail || ''}
              alt={template.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              unoptimized
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-xs text-gray-500">Loading preview...</p>
            </div>
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50">
            <div className="text-center">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <div 
            className="w-full h-full overflow-hidden bg-white" 
            style={{ 
              transform: 'scale(0.35)', 
              transformOrigin: 'top left', 
              width: '285.71%', 
              height: '285.71%' 
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

      {/* Template Info Footer */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{template.name}</h4>
            {template.description && (
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{template.description}</p>
            )}
          </div>
        </div>
        
        {/* Categories */}
        {template.categories && template.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {template.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md"
              >
                {category}
              </span>
            ))}
            {template.layout && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md">
                {template.layout}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        "flex items-end justify-center pb-4 z-10"
      )}>
        <div className="text-white text-sm font-semibold bg-blue-600/95 px-4 py-2 rounded-lg shadow-lg">
          {isSelected ? '✓ Selected - Click to Edit' : 'Click to Start Editing'}
        </div>
      </div>
    </div>
  );
}
