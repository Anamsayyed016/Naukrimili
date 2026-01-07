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
// Dialog imports removed - View Full Resume feature removed

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
  // View Full Resume feature removed - not needed
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

  // Generate PDF-style HTML for full preview (matches PDF export exactly)
  // MUST be defined BEFORE renderPreviewInIframe to avoid "Cannot access before initialization" error
  const generateFullPreviewHTML = useCallback(async () => {
    if (!templateCacheRef.current || !templateId) return null;

    try {
      const { template, html, css } = templateCacheRef.current;

      // Apply color variant (EXACTLY matches LivePreview logic)
      const { applyColorVariant, injectResumeData } = await import('@/lib/resume-builder/template-loader');
      const colorVariant = selectedColorId
        ? template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0]
        : template.colors.find((c: ColorVariant) => c.id === template.defaultColor) || template.colors[0];
      const finalCss = applyColorVariant(css, colorVariant);

      // Inject user's formData into template (EXACTLY matches LivePreview)
      const injectedHtml = injectResumeData(html, formData);

      // Convert emoji icons to inline SVG for better PDF compatibility (EXACTLY matches PDF export)
      // Wrap in try-catch to prevent emoji conversion from breaking export
      let htmlWithInlineIcons: string;
      try {
        const { convertEmojiToSVG } = await import('@/lib/resume-builder/resume-export');
        htmlWithInlineIcons = convertEmojiToSVG(injectedHtml);
      } catch (emojiError: any) {
        console.warn('⚠️ [Full Preview] Emoji conversion failed, using original HTML:', emojiError.message);
        // Fallback to original HTML if emoji conversion fails
        htmlWithInlineIcons = injectedHtml;
      }

      // Detect language direction (RTL support) - EXACTLY matches LivePreview
      const detectLanguageDirection = (text: string): 'ltr' | 'rtl' => {
        if (!text) return 'ltr';
        const rtlPattern = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return rtlPattern.test(text) ? 'rtl' : 'ltr';
      };
      const fullName = formData.firstName || formData.lastName || formData.name || '';
      const summary = formData.summary || formData.professionalSummary || '';
      const dir = detectLanguageDirection(fullName + ' ' + summary);

      // Build PDF-optimized HTML document (EXACTLY matches LivePreview and PDF export)
      const pdfOptimizedHTML = `<!DOCTYPE html>
<html lang="en" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${finalCss}
    
    /* PDF Export Optimizations - Lock to A4 width and prevent layout shifts */
    /* EXACTLY matches LivePreview - no scaling, no transforms */
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    html {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
    }
    
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0 !important;
  padding: 0 !important; /* CRITICAL: Remove body padding used by classic/modern templates */
  background: white !important;
  width: 100% !important;
  height: auto !important;
  overflow-x: hidden !important;
  overflow-y: visible !important;
  transform: none !important;
  scale: 1 !important;
  zoom: 1 !important;
  line-height: 1.4 !important; /* Reduce from default 1.6 */
}
    
    /* Lock resume container to A4 dimensions (210mm x 297mm = 794px x 1123px at 96 DPI) */
    /* EXACTLY matches LivePreview - no scaling, no transforms */
    .resume-container {
      width: 794px !important;
      max-width: 794px !important;
      min-width: 794px !important;
      margin: 0 auto !important;
      background: white !important;
      box-sizing: border-box !important;
      position: relative !important;
      transform-origin: top center !important;
      transform: none !important; /* Explicitly no transforms to match LivePreview */
      scale: 1 !important; /* Explicitly set scale to 1 to prevent any scaling */
      zoom: 1 !important; /* Prevent browser zoom */
    }
    
    /* CRITICAL: Remove any scaling from parent elements or wrapper divs */
    body > *,
    html > * {
      transform: none !important;
      scale: 1 !important;
      zoom: 1 !important;
    }
    
    /* Prevent layout shifts - lock all widths */
    .resume-wrapper,
    .sidebar,
    .content,
    section,
    .section {
      box-sizing: border-box !important;
    }
    
    /* Page break rules - allow natural page breaks (don't force single page) */
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    /* Preserve all graphics, icons, and colors */
    img {
      display: block !important;
      max-width: 100% !important;
      height: auto !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    svg, svg * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      display: inline-block !important;
    }
    
    /* Preserve background colors and gradients */
    [style*="background"],
    [class*="bg-"],
    [class*="background"],
    [style*="gradient"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Preserve borders */
    [style*="border"],
    [class*="border"] {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Ensure emoji/SVG icons are visible */
    .contact-icon,
    .icon,
    [class*="icon"] {
      display: inline-block !important;
      vertical-align: middle !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Typography consistency */
    p, div, span, li, td, th {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      hyphens: auto;
    }
    
    /* Ensure consistent spacing */
    * {
      box-sizing: border-box;
    }
    
    /* PDF-SPECIFIC: AGGRESSIVE spacing optimization to fit ALL content on ONE A4 page (1123px height) */
    /* A4 height = 1123px @ 96 DPI. Header ~150px, so body area ~950px. Must compress aggressively. */
    
    /* UNIVERSAL: Override CSS variables used by some templates */
    :root {
      --spacing-xl: 16px !important; /* Classic/Modern use this for resume-container padding */
      --spacing-lg: 14px !important;
      --spacing-md: 12px !important;
      --spacing-sm: 8px !important;
      --spacing-xs: 4px !important;
      --section-gap: 12px !important;
    }
    
    /* UNIVERSAL: Compress resume-container padding for single-column templates */
    .resume-container {
      padding: 20px 28px !important; /* Override large padding in classic/modern templates */
    }
    
    /* UNIVERSAL: Compress all sections regardless of structure */
    section,
    .section,
    .content-section,
    .sidebar-section {
      margin-bottom: 12px !important;
      padding-bottom: 0 !important;
    }
    
    /* UNIVERSAL: Compress all headings */
    h1, .name, .header-name {
      font-size: 28px !important;
      margin-bottom: 6px !important;
      margin-top: 0 !important;
      line-height: 1.1 !important;
    }
    
    h2, .section-title, .sidebar-section-title {
      font-size: 16px !important;
      margin-bottom: 10px !important;
      margin-top: 0 !important;
      padding-bottom: 4px !important;
    }
    
    h3, .experience-header h3, .education-item h3 {
      font-size: 14px !important;
      margin-bottom: 3px !important;
      margin-top: 0 !important;
    }
    
    /* UNIVERSAL: Compress all paragraphs and text blocks */
    p, .description, .profile-text, .about-text {
      margin-top: 6px !important;
      margin-bottom: 6px !important;
      line-height: 1.4 !important;
    }
    
    /* UNIVERSAL: Compress all lists */
    ul, ol {
      margin-top: 6px !important;
      margin-bottom: 6px !important;
      padding-left: 18px !important;
    }
    
    li {
      margin-bottom: 4px !important;
      line-height: 1.4 !important;
    }
    
    /* CRITICAL: MAXIMUM compression for header (biggest space consumer) */
    .content-header,
    header {
      padding: 12px 20px !important; /* ULTRA reduced from 30-40px */
      margin-bottom: 0 !important;
      margin-top: 0 !important;
      gap: 12px !important; /* ULTRA reduced from 30px */
    }
    
    /* CRITICAL: MAXIMUM compression for sidebar and main content */
    .sidebar {
      padding: 16px 16px !important; /* ULTRA reduced from 40px 25px */
      gap: 10px !important; /* ULTRA reduced from 30px */
    }
    
    .main-content {
      padding: 16px 20px !important; /* ULTRA reduced from 40px */
      gap: 10px !important; /* ULTRA reduced from 30px */
    }
    
    /* CRITICAL: MAXIMUM compression for all list gaps */
    .experience-list,
    .education-list,
    .projects-list,
    .certifications-list,
    .achievements-list {
      gap: 10px !important; /* ULTRA reduced from 25px */
    }
    
    .skills-list,
    .languages-list,
    .references-list,
    .hobbies-list,
    .interests-list {
      gap: 8px !important; /* ULTRA reduced from 15-20px */
    }
    
    .experience-item,
    .education-item,
    .project-item,
    .certification-item,
    .achievement-item,
    .reference-item,
    .language-item,
    .skill-item {
      margin-bottom: 0 !important;
      padding-bottom: 0 !important;
      gap: 4px !important; /* Reduce internal gaps */
    }
    
    .sidebar-section,
    .content-section {
      margin-bottom: 10px !important; /* ULTRA reduced from 30px */
    }
    
    .content-section:last-child {
      margin-bottom: 0 !important;
    }
    
    /* CRITICAL: Reduce section title margins dramatically */
    .section-title,
    .sidebar-section-title {
      margin-bottom: 10px !important; /* Heavily reduced from 15-20px */
      padding-bottom: 4px !important; /* Heavily reduced from 8px */
      font-size: 16px !important; /* Slightly smaller */
    }
    
    /* CRITICAL: Optimize line heights for maximum compactness */
    .profile-text,
    .about-text,
    .description {
      line-height: 1.4 !important; /* Heavily reduced from 1.6 */
      margin-top: 8px !important; /* Reduced from 10px */
    }
    
    /* CRITICAL: Reduce gaps in all contact/info lists */
    .contact-list,
    .languages-list,
    .hobbies-list,
    .social-list {
      gap: 8px !important; /* Heavily reduced from 12px */
    }
    
    /* CRITICAL: Compress header elements */
    .name {
      margin-bottom: 6px !important; /* Heavily reduced from 10px */
      font-size: 28px !important; /* Reduced from 36px for space saving */
      line-height: 1.1 !important;
    }
    
    .profession {
      font-size: 14px !important; /* Reduced from 16-18px */
      margin-top: 0 !important;
    }
    
    .profile-image-wrapper {
      width: 70px !important; /* ULTRA reduced from 120px */
      height: 70px !important;
    }
    
    .profile-initials {
      font-size: 20px !important; /* Adjusted proportionally */
    }
    
    .profile-placeholder {
      width: 70px !important;
      height: 70px !important;
    }
    
    /* CRITICAL: MAXIMUM compression for experience/education headers */
    .experience-header,
    .education-item h3,
    .project-item h3 {
      margin-bottom: 4px !important; /* ULTRA reduced from 8-10px */
      gap: 2px !important;
    }
    
    .experience-header h3,
    .education-item h3,
    .project-item h3,
    .certification-item h3 {
      font-size: 13px !important; /* ULTRA reduced from 15-16px */
      margin-bottom: 2px !important;
    }
    
    .company,
    .institution,
    .issuer,
    .technologies {
      font-size: 12px !important; /* ULTRA reduced from 13-14px */
      margin-bottom: 2px !important; /* ULTRA reduced from 4-5px */
    }
    
    .duration,
    .year,
    .date {
      font-size: 10px !important; /* ULTRA reduced from 12px */
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      padding: 2px 6px !important; /* ULTRA reduced padding */
    }
    
    /* CRITICAL: MAXIMUM text compression */
    .contact-label,
    .language,
    .skill-tag,
    .hobby,
    .interest,
    .achievement-text,
    .summary-text {
      font-size: 12px !important; /* ULTRA reduced from 13-14px */
      line-height: 1.35 !important; /* ULTRA compressed */
    }
    
    .cgpa,
    .proficiency,
    .psp-skill-percentage,
    .psp-language-percentage {
      font-size: 10px !important; /* ULTRA reduced from 11-12px */
      margin-top: 2px !important;
      margin-bottom: 2px !important;
    }
    
    .skill-name,
    .language-name,
    .psp-skill-name,
    .psp-language-name {
      font-size: 11px !important; /* ULTRA reduced from 12px */
    }
    
    /* CRITICAL: Reduce progress bar spacing */
    .psp-skill-item,
    .psp-language-item,
    .skill-item,
    .language-item {
      gap: 3px !important; /* ULTRA reduced from 6px */
    }
    
    .psp-skill-bar-container,
    .psp-language-bar-container {
      height: 6px !important; /* ULTRA reduced from 8px */
      margin-top: 2px !important;
      margin-bottom: 2px !important;
    }
  </style>
</head>
<body>
  ${htmlWithInlineIcons}
</body>
</html>`;

      return pdfOptimizedHTML;
    } catch (err) {
      console.error('Error generating full preview HTML:', err);
      return null;
    }
  }, [formData, selectedColorId, templateId]);

  // Helper function to render preview in an iframe (uses EXACT same HTML as generateFullPreviewHTML)
  const renderPreviewInIframe = useCallback(async (targetIframe: HTMLIFrameElement, onResize?: () => void) => {
    if (!templateCacheRef.current || loading) return;

    let iframeDoc: Document | null = null;
    try {
      iframeDoc = targetIframe.contentDocument || targetIframe.contentWindow?.document;
    } catch (e) {
      console.warn('Cannot access iframe document:', e);
      return;
    }
    
    if (!iframeDoc) {
      // Try to initialize iframe with blank document
      try {
        if (targetIframe.contentWindow) {
          iframeDoc = targetIframe.contentWindow.document;
        }
      } catch (e) {
        console.warn('Cannot initialize iframe document:', e);
        return;
      }
    }
    
    if (!iframeDoc) return;

    try {
      // Use the SAME HTML generation as generateFullPreviewHTML to ensure consistency
      const fullPreviewHTML = await generateFullPreviewHTML();
      
      if (!fullPreviewHTML) {
        console.error('❌ [Render Preview] Failed to generate HTML');
        return;
      }

      console.log('📝 [Render Preview] Writing HTML to iframe, length:', fullPreviewHTML.length);
      iframeDoc.open();
      iframeDoc.write(fullPreviewHTML);
      iframeDoc.close();
      
      console.log('✅ [Render Preview] HTML written to iframe (using same HTML as full preview)');

      // Wait for iframe to fully load, then resize
      setTimeout(() => {
        // Verify content was written
        try {
          const body = iframeDoc?.body;
          const hasContent = body && body.querySelector('.resume-container');
          console.log('🔍 [Render Preview] Content verification:', {
            hasBody: !!body,
            hasContent: !!hasContent,
            bodyHTML: body ? body.innerHTML.substring(0, 100) : 'no body'
          });
        } catch (e) {
          console.warn('⚠️ [Render Preview] Could not verify content:', e);
        }
        
        if (onResize) onResize();
      }, 200);
    } catch (err) {
      console.error('Error rendering preview:', err);
    }
  }, [generateFullPreviewHTML, loading]);

  // Update preview when formData or color changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !templateCacheRef.current || loading) return;

    // Create stable string representation for comparison
    const formDataString = JSON.stringify(formData, Object.keys(formData).sort());

    // Only update if form data actually changed
    if (previousFormDataRef.current === formDataString && !selectedColorId) return;

    previousFormDataRef.current = formDataString;

    // Use generateFullPreviewHTML to ensure consistency with full preview modal
    renderPreviewInIframe(iframe, resizeIframe);
  }, [formData, selectedColorId, loading, renderPreviewInIframe, resizeIframe, generateFullPreviewHTML]);

  // Generate HTML when full preview opens
  useEffect(() => {
    if (showFullPreview && templateCacheRef.current) {
      generateFullPreviewHTML().then((html) => {
        setFullPreviewHTML(html);
      }).catch((err) => {
        console.error('Error generating full preview HTML:', err);
        setFullPreviewHTML(null);
      });
    } else {
      setFullPreviewHTML(null);
    }
  }, [showFullPreview, generateFullPreviewHTML]);

  // Prevent body scroll when full preview is open + ESC key handler
  useEffect(() => {
    if (showFullPreview) {
      // Save current scroll position and prevent scrolling
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const scrollY = window.scrollY;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Handle ESC key to close modal
      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
          event.preventDefault();
          event.stopPropagation();
          setShowFullPreview(false);
        }
      };
      
      window.addEventListener('keydown', handleEscapeKey);
      
      return () => {
        // Restore scroll position
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        window.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showFullPreview]);

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
        minWidth: isMobile ? 'auto' : '900px', // Ensure minimum width for proper template display
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
          {/* View Full Resume feature removed - Live Preview is the source of truth */}
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
              width: isMobile ? '100%' : '950px', // Increased width for better template display - ensures sidebar (280px) + main content (514px) + extra padding are fully visible
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

      {/* View Full Resume Modal - REMOVED - Live Preview is the authoritative display */}
      {/* Dialog section removed to simplify code and rely on LivePreview as source of truth */}
        <DialogContent 
          className="p-0 gap-0 [&>button]:hidden"
          onInteractOutside={(e) => {
            // Prevent closing on backdrop click for fullscreen experience
            // Users should use the close button or ESC key
            e.preventDefault();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            padding: 0,
            margin: 0,
            transform: 'none',
            translate: 'none',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0,
            border: 'none',
            zIndex: 9999,
          }}
        >
          <DialogTitle className="sr-only">Full Resume Preview - PDF Format</DialogTitle>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            maxHeight: '100vh',
            background: '#f5f5f5',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Modal Header with Close Button - Fixed Position */}
            <div style={{
              padding: isMobile ? '12px 16px' : '16px 20px',
              background: 'white',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 10000,
              flexShrink: 0,
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFullPreview(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowFullPreview(false);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  minHeight: isMobile ? '40px' : '44px',
                  borderRadius: '8px',
                  border: '2px solid #3b82f6',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  zIndex: 10001,
                  flexShrink: 0,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 600,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  lineHeight: 1.5,
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                aria-label="Back to Editor"
                title="Back to Editor (Esc)"
              >
                <span style={{ fontSize: isMobile ? '18px' : '20px', lineHeight: 1, display: 'inline-block' }}>←</span>
                <span style={{ display: 'inline-block' }}>Back to Editor</span>
              </div>
              <h2 style={{
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: 600,
                color: '#374151',
                margin: 0,
                flex: 1,
                textAlign: 'center',
                paddingLeft: '12px',
                paddingRight: '12px',
              }}>
                Full Resume Preview (PDF Format)
              </h2>
              <div style={{ width: isMobile ? '120px' : '140px', flexShrink: 0 }} /> {/* Spacer for alignment */}
            </div>

            {/* PDF Format Preview Container */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: isMobile ? '16px 8px' : '24px',
              minHeight: 0,
              maxHeight: '100%',
              background: '#f5f5f5',
              WebkitOverflowScrolling: 'touch',
            }}>
              {showFullPreview && (
                fullPreviewHTML ? (
                  <iframe
                    key={fullPreviewHTML.substring(0, 100)} // Force re-render when HTML changes
                    ref={fullPreviewIframeRef}
                    title="Full Resume Preview - PDF Format"
                    srcDoc={fullPreviewHTML}
                    style={{
                      width: '794px',
                      maxWidth: '100%',
                      height: '1123px',
                      minHeight: '1123px',
                      border: 'none',
                      display: 'block',
                      background: 'white',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    sandbox="allow-same-origin allow-scripts"
                    onLoad={() => {
                      const iframe = fullPreviewIframeRef.current;
                      if (!iframe) return;
                      
                      try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!iframeDoc || !iframeDoc.body) {
                          console.warn('⚠️ [Full Preview] Iframe document or body not available');
                          return;
                        }
                        
                        console.log('✅ [Full Preview] Iframe loaded, checking for resume container...');
                        const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
                        if (resumeContainer) {
                          console.log('✅ [Full Preview] Resume container found, adjusting height...');
                          const contentHeight = Math.max(
                            resumeContainer.scrollHeight,
                            resumeContainer.offsetHeight,
                            1123
                          );
                          if (contentHeight > 0) {
                            iframe.style.height = `${contentHeight + 40}px`;
                          }
                        } else {
                          console.warn('⚠️ [Full Preview] Resume container not found in iframe');
                        }
                      } catch (err) {
                        console.error('❌ [Full Preview] Error in onLoad:', err);
                      }
                    }}
                  />
                ) : (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#6b7280',
                  }}>
                    Loading preview...
                  </div>
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
