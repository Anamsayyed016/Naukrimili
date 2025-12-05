/**
 * Resume Export Utility
 * Generates the exact HTML/CSS used in live preview for export
 */

import { loadTemplateServer, applyColorVariant, injectResumeData, type LoadedTemplate, type ColorVariant } from './template-loader-server';

export interface ExportOptions {
  templateId: string;
  formData: Record<string, any>;
  selectedColorId?: string;
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

  // Combine into full HTML document (same as LivePreview)
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${coloredCss}
        
        /* ATS-safe typography enhancements */
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          margin: 0;
          padding: 0;
        }
        
        /* Ensure print-friendly styles with graphics */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          /* Preserve all background colors and images */
          [style*="background"],
          [class*="bg-"],
          [class*="background"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Preserve borders and decorative elements */
          [style*="border"],
          [class*="border"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Ensure images are visible and properly sized */
          img {
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid;
          }
          
          /* Preserve SVG graphics and icons */
          svg, svg * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Preserve gradient backgrounds */
          [style*="gradient"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        
        /* Ensure all graphics are visible in all contexts */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
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

