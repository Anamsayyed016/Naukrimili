/**
 * Resume Export Utility
 * Generates the exact HTML/CSS used in live preview for export
 */

import { loadTemplateServer, applyColorVariant, injectResumeData, type LoadedTemplate, type ColorVariant } from './template-loader-server';

export interface ExportOptions {
  templateId: string;
  formData: Record<string, any>;
  selectedColorId?: string;
  selectedBackgroundId?: string;
}

/**
 * Generate the full HTML document for export (identical to live preview)
 */
export async function generateExportHTML(options: ExportOptions): Promise<string> {
  const { templateId, formData, selectedColorId, selectedBackgroundId = 'none' } = options;

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

  // Load background pattern if selected
  let backgroundCSS = '';
  if (selectedBackgroundId && selectedBackgroundId !== 'none') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const publicPath = path.join(process.cwd(), 'public', 'backgrounds.json');
      const backgroundsData = JSON.parse(fs.readFileSync(publicPath, 'utf-8'));
      const backgroundPattern = backgroundsData.backgrounds.find((bg: any) => bg.id === selectedBackgroundId);
      
      if (backgroundPattern && backgroundPattern.pattern !== 'none') {
        // For PDF export, we need to embed the SVG pattern inline
        const patternPath = path.join(process.cwd(), 'public', 'backgrounds', 'patterns', `${backgroundPattern.pattern}.svg`);
        let svgContent = '';
        try {
          svgContent = fs.readFileSync(patternPath, 'utf-8');
          // Convert SVG to data URL
          const svgBase64 = Buffer.from(svgContent).toString('base64');
          const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
          
          backgroundCSS = `
            .resume-container {
              background-image: url('${dataUrl}') !important;
              background-size: ${backgroundPattern.pattern === 'corner' ? 'contain' : '20px 20px'} !important;
              background-repeat: ${backgroundPattern.pattern === 'corner' ? 'no-repeat' : 'repeat'} !important;
              background-position: ${backgroundPattern.pattern === 'corner' ? 'top left, top right, bottom left, bottom right' : 'top left'} !important;
            }
          `;
        } catch (e) {
          console.warn('Could not load background pattern for export:', e);
        }
      }
    } catch (e) {
      console.warn('Could not load backgrounds.json:', e);
    }
  }

  // Combine into full HTML document (same as LivePreview)
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${coloredCss}
        
        ${backgroundCSS}
        
        /* ATS-safe typography enhancements */
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Ensure print-friendly styles */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        /* Page break handling */
        @page {
          size: letter;
          margin: 0;
        }
      </style>
    </head>
    <body>
      ${dataInjectedHtml}
    </body>
    </html>
  `;

  return fullHtml;
}

