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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 justify-items-center">
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

  // Always use HTML preview in gallery mode to show all sections with sample data
  // This ensures all templates display consistently with all available sections
  useEffect(() => {
    const hasFormData = Object.keys(formData).length > 0;
    
    // In gallery mode (formData empty), always use HTML preview to show all sections with sample data
    // This ensures users can see what sections each template supports
    if (!hasFormData) {
      // Gallery mode: Force HTML preview to show all sections
      setUseImagePreview(false);
      setImageError(false); // Reset image error state
    } else {
      // User has entered data: Use image preview for non-premium templates if available
      const isPremium = template.categories?.includes('Premium');
      if (!isPremium && (template.preview || template.thumbnail)) {
        setUseImagePreview(true);
        setLoading(false);
      } else {
        // Premium templates or no preview image: Use HTML preview
        setUseImagePreview(false);
      }
    }
  }, [template.preview, template.thumbnail, template.categories, formData]);

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
        // Enhanced sample data for premium templates to show full design
        const sampleData = Object.keys(formData).length === 0 ? {
          firstName: 'Brian',
          lastName: 'Baxter',
          name: 'Brian R. Baxter',
          email: 'brian.baxter@email.com',
          phone: '+1 234 567 8900',
          jobTitle: 'Graphic & Web Designer',
          location: 'Chicago, IL',
          linkedin: 'linkedin.com/in/brianbaxter',
          portfolio: 'www.yourwebsite.com',
          summary: 'Creative and experienced graphic designer with over 10 years of expertise in web design, branding, and digital marketing. Proven track record of delivering high-quality visual solutions that drive business growth and enhance user engagement.',
          skills: [
            'Adobe Photoshop',
            'Adobe Illustrator', 
            'Microsoft Word',
            'Microsoft PowerPoint',
            'HTML/CSS',
            'JavaScript',
            'UI/UX Design',
            'Brand Identity'
          ],
          experience: [
            {
              title: 'Senior Web Designer',
              company: 'Creative Agency',
              location: 'Chicago',
              startDate: '2020',
              endDate: 'Present',
              description: 'Lead design initiatives for major client projects, creating innovative web interfaces and digital experiences. Collaborate with cross-functional teams to deliver user-centered designs that exceed client expectations.'
            },
            {
              title: 'Graphic Designer',
              company: 'Creative Market',
              location: 'Chicago',
              startDate: '2015',
              endDate: '2020',
              description: 'Designed marketing materials, brand identities, and digital assets for various clients. Managed multiple projects simultaneously while maintaining high standards of quality and creativity.'
            },
            {
              title: 'Marketing Manager',
              company: 'Manufacturing Agency',
              location: 'New Jersey',
              startDate: '2013',
              endDate: '2015',
              description: 'Developed and executed marketing campaigns, managed brand communications, and created visual content for both digital and print media.'
            }
          ],
          education: [
            {
              degree: 'Master Degree',
              school: 'Stanford University',
              field: 'Graphic Design',
              year: '2011-2013',
              graduationDate: '2013'
            },
            {
              degree: 'Bachelor Degree',
              school: 'University of Chicago',
              field: 'Visual Arts',
              year: '2007-2010',
              graduationDate: '2010'
            }
          ],
          projects: [
            {
              name: 'E-commerce Platform Redesign',
              description: 'Complete redesign of client e-commerce platform resulting in 40% increase in conversions.',
              technologies: 'React, Node.js, MongoDB'
            },
            {
              name: 'Brand Identity System',
              description: 'Developed comprehensive brand identity including logo, color palette, and marketing materials for startup client.',
              technologies: 'Adobe Creative Suite, Figma'
            }
          ],
          certifications: [
            {
              name: 'Adobe Certified Expert',
              issuer: 'Adobe Systems',
              date: '2020'
            },
            {
              name: 'Google UX Design Certificate',
              issuer: 'Google',
              date: '2021'
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
            },
            {
              language: 'French',
              proficiency: 'Intermediate'
            }
          ],
          achievements: [
            'Employee of the Year 2023',
            'Best Design Award - Creative Excellence 2022',
            'Published in Design Magazine 2021'
          ],
          hobbies: [
            'Photography',
            'Reading',
            'Traveling',
            'Digital Art'
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
                width: 100%;
                height: 100%;
              }
              html {
                overflow: hidden;
                height: 100%;
                width: 100%;
              }
              * {
                -webkit-overflow-scrolling: touch;
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
    console.log(`[TemplatePreview] Image failed to load for ${template.id}, falling back to HTML/CSS preview`);
    setImageError(true);
    setUseImagePreview(false);
    setLoading(true);
    // Trigger HTML/CSS loading by setting useImagePreview to false
    // The useEffect will handle the loading
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <div
        onClick={onSelect}
        className={cn(
          "relative group cursor-pointer w-full rounded-2xl transition-all duration-300",
          "bg-white shadow-md hover:shadow-xl",
          "border border-gray-200/50 hover:border-gray-300",
          "p-4",
          isSelected
            ? "ring-2 ring-blue-500 ring-offset-2 shadow-xl"
            : ""
        )}
      >
        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-blue-600 rounded-full p-2 shadow-lg">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Recommended Badge */}
        {template.recommended && !isSelected && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              ★ Recommended
            </div>
          </div>
        )}

        {/* Preview Container - Clean White Background */}
        <div className="relative w-full aspect-[8.5/11] bg-white rounded-xl overflow-hidden shadow-inner border border-gray-100">
        {useImagePreview && (template.preview || template.thumbnail) && !imageError ? (
          <div className="absolute inset-0">
            <Image
              src={template.preview || template.thumbnail || ''}
              alt={template.name}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              onError={handleImageError}
              unoptimized
              priority={false}
            />
          </div>
        ) : loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600 mx-auto mb-3"></div>
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
            className="absolute inset-0 flex items-center justify-center bg-white"
            style={{ 
              transform: 'scale(0.36)',
              transformOrigin: 'center center',
              width: '277.78%',
              height: '277.78%',
              left: '50%',
              top: '50%',
              marginLeft: '-138.89%',
              marginTop: '-138.89%'
            }}
          >
            <iframe
              ref={iframeRef}
              className="border-0 pointer-events-none"
              title={`Preview: ${template.name}`}
              sandbox="allow-same-origin"
              scrolling="no"
              style={{
                display: 'block',
                width: '850px',
                height: '1100px',
                flexShrink: 0,
                overflow: 'hidden'
              }}
            />
          </div>
        )}
        </div>

        {/* Hover Overlay - Subtle */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "flex items-end justify-center pb-8 z-10 rounded-2xl pointer-events-none"
        )}>
          <div className={cn(
            "text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg transform transition-transform duration-300 pointer-events-auto",
            "group-hover:translate-y-0 translate-y-2",
            isSelected ? "bg-blue-600/95" : "bg-blue-600/90"
          )}>
            {isSelected ? '✓ Selected' : 'Click to Edit'}
          </div>
        </div>
      </div>

      {/* Template Name & Label - Below Card */}
      <div className="w-full max-w-sm mt-5 text-center px-2">
        <h4 className={cn(
          "text-lg font-semibold transition-colors duration-300",
          isSelected ? "text-blue-600" : "text-gray-900"
        )}>
          {template.name}
        </h4>
        {template.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
        )}
        {/* Categories - Subtle Tags */}
        {template.categories && template.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mt-2">
            {template.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
              >
                {category}
              </span>
            ))}
            {template.layout && (
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                {template.layout}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
