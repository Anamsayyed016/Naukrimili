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

  // Combine into full HTML document with NATURAL styles (matches LivePreview exactly)
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${coloredCss}
        
        /* ========================================
           PDF EXPORT CSS - SMART MODERATE COMPRESSION
           Fits on 1 A4 page while maintaining professional appearance
           ======================================== */
        
        /* Page margin reset – let .resume-container control spacing */
        @page {
          margin: 0;
        }
        
        /* Universal Reset */
        *, *::before, *::after {
          box-sizing: border-box !important;
        }
        
        html {
          background-color: #ffffff !important;
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        
        body {
          background-color: #ffffff !important;
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          color: #000000;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          line-height: 1.5 !important; /* Moderate line height for readability */
        }
        
        /* Resume Container - A4 Size with Moderate Compression */
        .resume-container {
          width: 794px !important;
          max-width: 794px !important;
          min-width: 794px !important;
          margin: 0 auto !important;
          padding: 28px 36px !important; /* Slightly more padding; still one-page-friendly */
          background: white !important;
          box-sizing: border-box !important;
          position: relative;
        }
        
        /* Override CSS Variables with Moderate Values */
        :root {
          --spacing-xl: 22px !important;
          --spacing-lg: 18px !important;
          --spacing-md: 14px !important;
          --spacing-sm: 10px !important;
          --spacing-xs: 6px !important;
          --section-gap: 18px !important;
        }
        
        /* Moderate Section Spacing */
        section, .section, .content-section, .sidebar-section {
          margin-bottom: 16px !important;
          padding-bottom: 0 !important;
        }
        
        section:last-child, .section:last-child {
          margin-bottom: 0 !important;
        }
        
        /* Moderate Heading Compression */
        h1, .name, .header-name {
          font-size: 30px !important; /* Readable, not too small */
          margin-bottom: 8px !important;
          margin-top: 0 !important;
          line-height: 1.2 !important;
        }
        
        h2, .section-title, .sidebar-section-title {
          font-size: 17px !important;
          margin-bottom: 12px !important;
          margin-top: 0 !important;
          padding-bottom: 6px !important;
        }
        
        h3, .experience-header h3, .education-item h3 {
          font-size: 15px !important;
          margin-bottom: 6px !important;
          margin-top: 0 !important;
        }
        
        /* Moderate Text Compression */
        p, .description, .profile-text, .about-text {
          margin-top: 8px !important;
          margin-bottom: 8px !important;
          line-height: 1.5 !important;
          font-size: 13px !important;
        }
        
        /* Moderate List Spacing */
        ul, ol {
          margin-top: 8px !important;
          margin-bottom: 8px !important;
          padding-left: 20px !important;
        }
        
        li {
          margin-bottom: 6px !important;
          line-height: 1.5 !important;
        }
        
        /* Moderate Header Compression */
        .content-header, header {
          padding: 20px 24px !important;
          margin-bottom: 0 !important;
          margin-top: 0 !important;
          gap: 16px !important;
        }
        
        /* Moderate Sidebar & Main Content Spacing */
        .sidebar {
          padding: 24px 20px !important;
          gap: 14px !important;
        }
        
        .main-content {
          padding: 24px 28px !important;
          gap: 14px !important;
        }
        
        /* Moderate List Gaps */
        .experience-list, .education-list, .projects-list,
        .certifications-list, .achievements-list {
          gap: 14px !important;
        }
        
        .skills-list, .languages-list, .references-list,
        .hobbies-list, .interests-list {
          gap: 10px !important;
        }
        
        .experience-item, .education-item, .project-item,
        .certification-item, .achievement-item,
        .reference-item, .language-item, .skill-item {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
          gap: 6px !important;
        }
        
        /* Moderate Contact/Info Lists */
        .contact-list, .social-list {
          gap: 10px !important;
        }
        
        /* Moderate Profile Image */
        .profile-image-wrapper, .profile-placeholder {
          width: 110px !important;
          height: 110px !important;
        }
        
        .profile-initials {
          font-size: 30px !important;
        }
        
        /* Moderate Experience/Education Headers */
        .company, .institution, .issuer, .technologies {
          font-size: 13px !important;
          margin-bottom: 4px !important;
        }
        
        .duration, .year, .date {
          font-size: 11px !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          padding: 3px 8px !important;
        }
        
        /* Moderate Skills/Languages */
        .skill-name, .language-name,
        .psp-skill-name, .psp-language-name {
          font-size: 12px !important;
        }
        
        .cgpa, .proficiency,
        .psp-skill-percentage, .psp-language-percentage {
          font-size: 11px !important;
          margin-top: 3px !important;
          margin-bottom: 3px !important;
        }
        
        /* Moderate Progress Bar */
        .psp-skill-bar-container, .psp-language-bar-container {
          height: 7px !important;
          margin-top: 3px !important;
          margin-bottom: 3px !important;
        }
        
        .psp-skill-item, .psp-language-item {
          gap: 5px !important;
        }
        
        /* Print color preservation */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Prevent page breaks inside important elements */
        .experience-item, .education-item, .project-item,
        .certification-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Ensure visibility */
        img, svg, .icon, .contact-icon {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
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

