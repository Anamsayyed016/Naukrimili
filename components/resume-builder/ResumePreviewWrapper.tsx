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
  const templateCacheRef = useRef<{ template: Template | null; html: string; css: string } | null>(null);
  const previousFormDataRef = useRef<string>('');

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

  // Update preview when formData or color changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !templateCacheRef.current || loading) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const formDataString = JSON.stringify(formData);

    // Only update if form data actually changed
    if (previousFormDataRef.current === formDataString && !selectedColorId) return;

    previousFormDataRef.current = formDataString;

    (async () => {
      try {
        const { template, html, css } = templateCacheRef.current!;

        // Apply color variant if selected
        let finalCss = css;
        if (selectedColorId) {
          const { applyColorVariant } = await import('@/lib/resume-builder/template-loader');
          const colorVariant = template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0];
          finalCss = applyColorVariant(css, colorVariant);
        }

        // Inject form data into template
        // Use sample data for empty fields to show all sections like gallery
        const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
        
        // Sample data for empty fields (merge with user data)
        const sampleData = {
          firstName: 'Brian',
          lastName: 'Baxter',
          name: 'Brian R. Baxter',
          email: 'brian.baxter@email.com',
          phone: '+1 234 567 8900',
          jobTitle: 'Graphic & Web Designer',
          location: 'Chicago, IL',
          linkedin: 'linkedin.com/in/brianbaxter',
          portfolio: 'www.yourwebsite.com',
          profileImage: 'https://ui-avatars.com/api/?name=Brian+Baxter&size=200&background=1e3a5f&color=fff&bold=true',
          summary: 'Creative and experienced graphic designer with over 10 years of expertise in web design, branding, and digital marketing. Proven track record of delivering high-quality visual solutions that drive business growth and enhance user engagement.',
          skills: ['Adobe Photoshop', 'Adobe Illustrator', 'Microsoft Word', 'Microsoft PowerPoint', 'HTML/CSS', 'JavaScript', 'UI/UX Design', 'Brand Identity'],
          experience: [
            {
              title: 'Senior Web Designer',
              company: 'Creative Agency',
              location: 'Chicago',
              startDate: '2020',
              endDate: 'Present',
              description: 'Lead design initiatives for major client projects, creating innovative web interfaces and digital experiences.'
            },
            {
              title: 'Graphic Designer',
              company: 'Creative Market',
              location: 'Chicago',
              startDate: '2015',
              endDate: '2020',
              description: 'Designed marketing materials, brand identities, and digital assets for various clients.'
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
          hobbies: ['Photography', 'Reading', 'Traveling', 'Digital Art']
        };
        
        // Merge: user data overrides sample data, but use sample data for empty fields
        const mergedData = { ...sampleData, ...formData };
        // For arrays, use user data if present, otherwise sample data
        if (Array.isArray(formData.skills) && formData.skills.length > 0) mergedData.skills = formData.skills;
        if (Array.isArray(formData.experience) && formData.experience.length > 0) mergedData.experience = formData.experience;
        if (Array.isArray(formData.education) && formData.education.length > 0) mergedData.education = formData.education;
        if (Array.isArray(formData.hobbies) && formData.hobbies.length > 0) mergedData.hobbies = formData.hobbies;
        
        const injectedHtml = injectResumeData(html, mergedData);

        // Build complete HTML document with height adjustments
        const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Preview</title>
  <style>
    ${finalCss}
    /* PREVIEW-SPECIFIC OVERRIDES: Match creative-modern rendering pattern for proper preview */
    html {
      min-height: auto !important;
      height: auto !important;
      overflow: visible !important;
      max-height: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    body {
      min-height: auto !important;
      height: auto !important;
      overflow: visible !important;
      max-height: none !important;
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important; /* Transparent so preview container background shows */
    }
    /* Match creative-modern approach: max-width (not fixed width), no overflow hidden, allow natural expansion */
    .resume-container {
      max-height: none !important;
      min-height: auto !important;
      height: auto !important;
      overflow: visible !important; /* Critical: override overflow:hidden from some templates */
      width: auto !important; /* Allow natural width, override fixed widths */
      max-width: 850px !important; /* Flexible max-width like creative-modern */
      margin: 0 auto !important;
      position: relative !important; /* Match creative-modern */
    }
    /* Override any wrapper constraints that might limit content */
    .resume-wrapper {
      min-height: auto !important;
      height: auto !important;
      overflow: visible !important;
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

        // Wait for iframe to fully load and render, then resize
        setTimeout(() => {
          resizeIframe();
        }, 150);

        // Also resize after images load
        const images = iframeDoc.querySelectorAll('img');
        if (images.length > 0) {
          let loadedCount = 0;
          const totalImages = images.length;
          
          const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              resizeIframe();
            }
          };

          images.forEach((img) => {
            if (img.complete) {
              checkAllLoaded();
            } else {
              img.onload = checkAllLoaded;
              img.onerror = checkAllLoaded;
            }
          });
        }
      } catch (err) {
        console.error('Error updating preview:', err);
      }
    })();
  }, [formData, selectedColorId, loading]);

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
        {loading && (
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loading...</div>
        )}
        {error && (
          <div style={{ fontSize: '12px', color: '#ef4444' }}>Error loading template</div>
        )}
      </div>

      {/* Scrollable Preview Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
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
              width: '100%',
              maxWidth: isMobile ? '100%' : '850px', // Slightly wider for better content visibility
              height: 'auto',
              minHeight: '800px',
              border: 'none',
              display: 'block',
              background: 'transparent', // Transparent so preview container background shows
            }}
            sandbox="allow-same-origin"
            onLoad={resizeIframe}
          />
        )}
        {error && (
          <div style={{ padding: '20px', color: '#6b7280', textAlign: 'center' }}>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
