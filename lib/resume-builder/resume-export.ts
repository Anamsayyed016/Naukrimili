/**
 * Resume Export Utility
 * Generates the exact HTML/CSS used in live preview for export
 */

import { loadTemplateServer, applyColorVariant, injectResumeData } from './template-loader-server';
import type { LoadedTemplate, ColorVariant } from './types';

export interface ExportOptions {
  templateId: string;
  formData: Record<string, unknown>;
  selectedColorId?: string;
}

/**
 * Convert emoji icons to inline SVG for better PDF compatibility
 * Handles emojis in various HTML contexts
 */
function convertEmojiToSVG(html: string): string {
  // Emoji to SVG mapping for common icons used in resumes
  const emojiToSVG: Record<string, string> = {
    '📞': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
    '✉': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    '📍': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
    '💼': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>',
    '🎓': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>',
    '⚡': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
    '⭐': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
    '🎭': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="8.5" cy="10.5" r="1.5"/><circle cx="15.5" cy="10.5" r="1.5"/><path d="M12 18c2.28 0 4.22-1.66 5-4H7c.78 2.34 2.72 4 5 4z"/></svg>',
  };

  let result = html;
  
  // Replace emoji icons with inline SVG
  Object.entries(emojiToSVG).forEach(([emoji, svg]) => {
    const escapedEmoji = emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const svgWithStyle = `<span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; vertical-align: middle; line-height: 1;">${svg}</span>`;
    
    // Match emoji in span.contact-icon or similar contexts (with various HTML structures)
    const patterns = [
      // Pattern 1: <span class="contact-icon">📞</span>
      new RegExp(`(<span[^>]*class="[^"]*contact-icon[^"]*"[^>]*>)${escapedEmoji}(</span>)`, 'gi'),
      // Pattern 2: <span class="contact-icon">📞</span> (with whitespace)
      new RegExp(`(<span[^>]*class="[^"]*contact-icon[^"]*"[^>]*>\\s*)${escapedEmoji}(\\s*</span>)`, 'gi'),
      // Pattern 3: Standalone emoji in text nodes
      new RegExp(`(>\\s*)${escapedEmoji}(\\s*<)`, 'g'),
    ];
    
    patterns.forEach((pattern) => {
      result = result.replace(pattern, (match, before, after) => {
        // If it's a span with contact-icon class, replace the emoji inside
        if (before.includes('contact-icon')) {
          return before + svgWithStyle + (after || '');
        }
        // Otherwise, replace standalone emoji
        return (before || '') + svgWithStyle + (after || '');
      });
    });
  });
  
  return result;
}

/**
 * Generate the full HTML document for export (identical to live preview)
 */
export async function generateExportHTML(options: ExportOptions): Promise<string> {
  const { templateId, formData, selectedColorId } = options;

  // Load template using server-side loader (for API routes)
  const loaded: LoadedTemplate | null = await loadTemplateServer(templateId);
  
  if (!loaded) {
    throw new Error(`Template "${templateId}" not found`);
  }

  const { template, html, css } = loaded;

  // Get selected color variant (same as LivePreview)
  const colorVariant = selectedColorId
    ? template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0]
    : template.colors.find((c: ColorVariant) => c.id === template.defaultColor) || template.colors[0];

  // Apply color variant to CSS (same as LivePreview)
  const coloredCss = applyColorVariant(css, colorVariant);

  // Inject resume data into HTML (same as LivePreview)
  const dataInjectedHtml = injectResumeData(html, formData);

  // Convert emoji icons to inline SVG for better PDF compatibility
  // Wrap in try-catch to prevent emoji conversion from breaking export
  let htmlWithInlineIcons: string;
  try {
    htmlWithInlineIcons = convertEmojiToSVG(dataInjectedHtml);
  } catch (emojiError: any) {
    console.warn('⚠️ [Export] Emoji conversion failed, using original HTML:', emojiError.message);
    // Fallback to original HTML if emoji conversion fails
    htmlWithInlineIcons = dataInjectedHtml;
  }

  // Combine into full HTML document with PDF-optimized styles
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${coloredCss}
        
        /* PDF Export Optimizations - Lock to A4 width and prevent layout shifts */
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
    /* EXACTLY matches View Full Resume - no scaling, no transforms */
    .resume-container {
      width: 794px !important;
      max-width: 794px !important;
      min-width: 794px !important;
      margin: 0 auto !important;
      background: white !important;
      box-sizing: border-box !important;
      position: relative !important;
      transform-origin: top center !important;
      transform: none !important; /* Explicitly no transforms to match View Full Resume */
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
    </html>
  `;

  return fullHtml;
}

