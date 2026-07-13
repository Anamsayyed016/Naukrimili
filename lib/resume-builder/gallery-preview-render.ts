import { isGalleryEmptyFormData } from '@/lib/resume-builder/gallery-demo';

/** Gallery inject options: demo cards stay compact; user/import data matches Live Preview. */
export function resolveGalleryInjectOptions(
  templateId: string,
  previewData: Record<string, unknown>
): {
  galleryPreview?: boolean;
  galleryTemplateId?: string;
  templateId?: string;
  mode?: 'preview';
} {
  if (isGalleryEmptyFormData(previewData)) {
    return { galleryPreview: true, galleryTemplateId: templateId };
  }
  return { templateId, mode: 'preview' };
}

/** Demo/sample cards use compact typography; user resumes mirror Live Preview CSS. */
export function isGalleryCompactPreview(previewData: Record<string, unknown>): boolean {
  return isGalleryEmptyFormData(previewData);
}

export function buildGalleryPreviewDocumentHtml(
  coloredCss: string,
  bodyHtml: string,
  compact: boolean
): string {
  const flowCss = compact
    ? `
                overflow: hidden;
                font-size: 10px;
                width: 100%;
                height: 100%;
                position: relative;`
    : `
                overflow-x: visible !important;
                overflow-y: visible !important;
                width: 794px;
                min-height: 100%;
                position: relative;`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${coloredCss}
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;${flowCss}
    }
    @page {
      size: 8.5in 11in;
      margin: 0;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}
