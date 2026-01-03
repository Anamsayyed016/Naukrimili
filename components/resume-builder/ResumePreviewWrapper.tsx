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
  DialogClose,
} from '@/components/ui/dialog';
import { Maximize2, X } from 'lucide-react';

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

      // Comprehensive sample data to show all sections (like gallery preview)
      // Merge with formData, prioritizing user data but using sample data for empty sections
      const sampleData = {
        firstName: 'Brian',
        lastName: 'Baxter',
        'First Name': 'Brian',
        'Last Name': 'Baxter',
        name: 'Brian R. Baxter',
        'Full Name': 'Brian R. Baxter',
        email: 'brian.baxter@email.com',
        Email: 'brian.baxter@email.com',
        phone: '+1 234 567 8900',
        Phone: '+1 234 567 8900',
        jobTitle: 'Graphic & Web Designer',
        'Job Title': 'Graphic & Web Designer',
        location: 'Chicago, IL',
        Location: 'Chicago, IL',
        linkedin: 'linkedin.com/in/brianbaxter',
        LinkedIn: 'linkedin.com/in/brianbaxter',
        portfolio: 'www.yourwebsite.com',
        Portfolio: 'www.yourwebsite.com',
        website: 'www.yourwebsite.com',
        profileImage: 'https://ui-avatars.com/api/?name=Brian+Baxter&size=200&background=1e3a5f&color=fff&bold=true',
        'Profile Image': 'https://ui-avatars.com/api/?name=Brian+Baxter&size=200&background=1e3a5f&color=fff&bold=true',
        summary: 'Creative and experienced graphic designer with over 10 years of expertise in web design, branding, and digital marketing. Proven track record of delivering high-quality visual solutions that drive business growth and enhance user engagement.',
        Summary: 'Creative and experienced graphic designer with over 10 years of expertise in web design, branding, and digital marketing. Proven track record of delivering high-quality visual solutions that drive business growth and enhance user engagement.',
        'Professional Summary': 'Creative and experienced graphic designer with over 10 years of expertise in web design, branding, and digital marketing. Proven track record of delivering high-quality visual solutions that drive business growth and enhance user engagement.',
        Skills: [
          'Adobe Photoshop',
          'Adobe Illustrator',
          'Microsoft Word',
          'Microsoft PowerPoint',
          'HTML/CSS',
          'JavaScript',
          'UI/UX Design',
          'Brand Identity'
        ],
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
        'Work Experience': [
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
        Experience: [
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
        Education: [
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
        Projects: [
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
        Certifications: [
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
        Languages: [
          {
            Language: 'English',
            language: 'English',
            proficiency: 'Native',
            Proficiency: 'Native'
          },
          {
            Language: 'Spanish',
            language: 'Spanish',
            proficiency: 'Fluent',
            Proficiency: 'Fluent'
          },
          {
            Language: 'French',
            language: 'French',
            proficiency: 'Intermediate',
            Proficiency: 'Intermediate'
          }
        ],
        languages: [
          {
            Language: 'English',
            language: 'English',
            proficiency: 'Native',
            Proficiency: 'Native'
          },
          {
            Language: 'Spanish',
            language: 'Spanish',
            proficiency: 'Fluent',
            Proficiency: 'Fluent'
          },
          {
            Language: 'French',
            language: 'French',
            proficiency: 'Intermediate',
            Proficiency: 'Intermediate'
          }
        ],
        Achievements: [
          'Employee of the Year 2023',
          'Best Design Award - Creative Excellence 2022',
          'Published in Design Magazine 2021'
        ],
        achievements: [
          'Employee of the Year 2023',
          'Best Design Award - Creative Excellence 2022',
          'Published in Design Magazine 2021'
        ],
        Hobbies: [
          'Photography',
          'Reading',
          'Traveling',
          'Digital Art'
        ],
        hobbies: [
          'Photography',
          'Reading',
          'Traveling',
          'Digital Art'
        ],
        'Hobbies & Interests': [
          'Photography',
          'Reading',
          'Traveling',
          'Digital Art'
        ]
      };

      // Merge sample data with formData, prioritizing formData values
      // Start with sample data, then override with user's formData
      const mergedData: Record<string, unknown> = { ...sampleData };
      
      // Override with formData, but for arrays only replace if formData has non-empty array
      Object.keys(formData).forEach((key) => {
        const formValue = formData[key];
        
        // For arrays: use formData if it's non-empty, otherwise keep sample data
        if (Array.isArray(formValue)) {
          if (formValue.length > 0) {
            mergedData[key] = formValue;
          }
          // If formData array is empty, keep sample data (already in mergedData)
        } else if (formValue !== undefined && formValue !== null && formValue !== '') {
          // For non-array values: use formData if it's not empty
          mergedData[key] = formValue;
        }
        // If formData value is empty/null/undefined, keep sample data (already in mergedData)
      });

      // Inject merged data into template
      const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
      const injectedHtml = injectResumeData(html, mergedData);

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
            sandbox="allow-same-origin allow-scripts"
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
              <DialogClose asChild>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </DialogClose>
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
                sandbox="allow-same-origin allow-scripts"
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
