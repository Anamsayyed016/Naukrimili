'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { Template, ColorVariant, LoadedTemplate } from '@/lib/resume-builder/types';

// Dynamic imports moved inside component to avoid TDZ issues

interface ChangeTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplateId: string;
  currentColorId: string;
  formData: Record<string, any>;
  onTemplateChange: (templateId: string, colorId: string) => void;
}

export default function ChangeTemplateModal({
  open,
  onOpenChange,
  currentTemplateId,
  currentColorId,
  formData,
  onTemplateChange,
}: ChangeTemplateModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(currentTemplateId);
  const [selectedColorId, setSelectedColorId] = useState<string>(currentColorId);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [componentsLoaded, setComponentsLoaded] = useState(false);
  const [ColorPickerComponent, setColorPickerComponent] = useState<React.ComponentType<unknown> | null>(null);
  const [LivePreviewComponent, setLivePreviewComponent] = useState<React.ComponentType<unknown> | null>(null);

  // Lazy load templates data to avoid module initialization issues
  useEffect(() => {
    import('@/lib/resume-builder/templates.json').then((templatesData) => {
      setTemplates((templatesData.default.templates || []) as Template[]);
    });
  }, []);

  // Dynamically load ColorPicker and LivePreview to avoid TDZ issues
  useEffect(() => {
    if (!open) return; // Only load when modal is open

    let mounted = true;

    async function loadComponents() {
      try {
        const [ColorPickerModule, LivePreviewModule] = await Promise.all([
          import('./ColorPicker'),
          import('./LivePreview'),
        ]);

        if (!mounted) return;

        setColorPickerComponent(() => ColorPickerModule.default);
        setLivePreviewComponent(() => LivePreviewModule.default);
        setComponentsLoaded(true);
      } catch (error) {
        if (!mounted) return;
        console.error('Error loading components:', error);
      }
    }

    loadComponents();

    return () => {
      mounted = false;
    };
  }, [open]);

  const selectedTemplate = useMemo(() => {
    if (!templates || templates.length === 0) return null;
    return templates.find((t) => t.id === selectedTemplateId) || templates[0] || null;
  }, [selectedTemplateId, templates]);

  // Reset selections when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTemplateId(currentTemplateId);
      setSelectedColorId(currentColorId);
    }
  }, [open, currentTemplateId, currentColorId]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Set to default color of new template, or first color if default not found
      const defaultColor = template.colors.find((c) => c.id === template.defaultColor) || template.colors[0];
      setSelectedColorId(defaultColor?.id || template.colors[0]?.id || '');
    }
  };

  const handleColorSelect = (colorId: string) => {
    setSelectedColorId(colorId);
  };

  const handleApply = () => {
    onTemplateChange(selectedTemplateId, selectedColorId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Change Template</DialogTitle>
          <DialogDescription>
            Select a new template and color scheme. Your resume data will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 p-6">
          {/* Left Side - Template Selection */}
          <div className="flex flex-col space-y-6 overflow-hidden">
            {/* Template Gallery */}
            <div className="flex-1 overflow-y-auto pr-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Gallery</h3>
              <div className="grid grid-cols-1 gap-4">
                {templates.map((template) => (
                  <EnhancedTemplateCard
                    key={template.id}
                    template={template}
                    formData={formData}
                    isSelected={template.id === selectedTemplateId}
                    onSelect={() => handleTemplateSelect(template.id)}
                  />
                ))}
              </div>
            </div>

            {/* Color Picker */}
            {selectedTemplate && selectedTemplate.colors && selectedTemplate.colors.length > 0 && componentsLoaded && ColorPickerComponent && (
              <div className="border-t pt-4">
                <ColorPickerComponent
                  colors={selectedTemplate.colors}
                  selectedColorId={selectedColorId}
                  onColorChange={handleColorSelect}
                />
              </div>
            )}
          </div>

          {/* Right Side - Live Preview */}
          <div className="flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
              {selectedTemplate && (
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                  {selectedTemplate.name}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto pr-2">
              {selectedTemplate && componentsLoaded && LivePreviewComponent ? (
                <LivePreviewComponent
                  templateId={selectedTemplateId}
                  formData={formData}
                  selectedColorId={selectedColorId}
                  className="min-h-[600px]"
                />
              ) : (
                <div className="min-h-[600px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">
                      {!selectedTemplate ? 'Loading templates...' : 'Loading preview...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EnhancedTemplateCardProps {
  template: Template;
  formData: Record<string, unknown>;
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
        // Enhanced sample data to show all sections for better template preview
        const sampleData = Object.keys(formData).length === 0 ? {
          firstName: 'John',
          lastName: 'Doe',
          name: 'John R. Doe',
          email: 'john.doe@example.com',
          phone: '+1 234 567 8900',
          jobTitle: 'Software Engineer',
          location: 'New York, NY',
          linkedin: 'linkedin.com/in/johndoe',
          portfolio: 'www.johndoe.dev',
          summary: 'Experienced professional with a strong background in software development. Proven track record of delivering high-quality solutions that drive business growth.',
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'Git'],
          experience: [
            {
              title: 'Senior Developer',
              company: 'Tech Corp',
              location: 'New York',
              startDate: '2020',
              endDate: 'Present',
              description: 'Led development of key features and improvements. Collaborated with cross-functional teams to deliver scalable solutions.'
            },
            {
              title: 'Full Stack Developer',
              company: 'Startup Inc',
              location: 'San Francisco',
              startDate: '2018',
              endDate: '2020',
              description: 'Developed and maintained web applications using modern technologies. Improved application performance by 40%.'
            }
          ],
          education: [
            {
              degree: 'Bachelor of Science',
              school: 'University',
              field: 'Computer Science',
              year: '2014-2018',
              graduationDate: '2018'
            }
          ],
          projects: [
            {
              name: 'E-commerce Platform',
              description: 'Built a full-stack e-commerce platform with payment integration.',
              technologies: 'React, Node.js, MongoDB'
            },
            {
              name: 'Cloud Migration Project',
              description: 'Led migration of legacy systems to cloud infrastructure, reducing costs by 30%.',
              technologies: 'AWS, Docker, Kubernetes'
            }
          ],
          certifications: [
            {
              name: 'AWS Certified Solutions Architect',
              issuer: 'Amazon Web Services',
              date: '2021'
            },
            {
              name: 'Certified Kubernetes Administrator',
              issuer: 'Cloud Native Computing Foundation',
              date: '2022'
            }
          ],
          languages: [
            {
              language: 'English',
              proficiency: 'Native'
            },
            {
              language: 'Spanish',
              proficiency: 'Fluent'
            }
          ],
          achievements: [
            'Employee of the Year 2023',
            'Best Code Quality Award 2022'
          ],
          hobbies: [
            'Photography',
            'Reading',
            'Open Source Contributions'
          ]
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
        "bg-white hover:shadow-lg",
        isSelected
          ? "border-blue-600 shadow-lg ring-2 ring-blue-100"
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
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        )}
      </div>

      {/* Template Info Footer */}
      <div className="p-3 bg-white border-t border-gray-100">
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
        "flex items-end justify-center pb-3 z-10"
      )}>
        <div className="text-white text-sm font-semibold bg-blue-600/95 px-3 py-1.5 rounded-lg shadow-lg">
          {isSelected ? '✓ Selected' : 'Click to Select'}
        </div>
      </div>
    </div>
  );
}
