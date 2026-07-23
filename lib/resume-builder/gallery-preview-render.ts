import {
  buildGallerySampleFormData,
  isGalleryEmptyFormData,
} from '@/lib/resume-builder/gallery-demo';

export type GalleryInjectOptions = {
  galleryPreview?: boolean;
  galleryTemplateId?: string;
  /** Gallery cards only: lock photo to the selected form object (no localStorage / demoFallback). */
  gallerySourceLock?: boolean;
  templateId?: string;
  mode?: 'preview';
};

/**
 * Gallery inject options — always lock photo to the selected card source.
 * Demo → gallery/demo mode (compact).
 * Import → live layout mode + gallerySourceLock (no demoFallback / no photo-store merge).
 */
export function resolveGalleryInjectOptions(
  templateId: string,
  previewData: Record<string, unknown>
): GalleryInjectOptions {
  if (isGalleryEmptyFormData(previewData) || previewData._galleryDemo === true) {
    return { galleryPreview: true, galleryTemplateId: templateId };
  }
  return {
    templateId,
    galleryTemplateId: templateId,
    mode: 'preview',
    gallerySourceLock: true,
  };
}

/** Demo/sample cards use compact typography; user resumes mirror Live Preview CSS. */
export function isGalleryCompactPreview(previewData: Record<string, unknown>): boolean {
  return isGalleryEmptyFormData(previewData) || previewData._galleryDemo === true;
}

/**
 * Atomic gallery card source: one object + matching inject options.
 * Never returns a hybrid of demo text and a separately merged photo.
 */
export function resolveGalleryCardRenderPlan(
  templateId: string,
  userPreviewData: Record<string, unknown> | null | undefined
): {
  previewData: Record<string, unknown>;
  injectOptions: GalleryInjectOptions;
} {
  const previewData =
    userPreviewData && !isGalleryEmptyFormData(userPreviewData)
      ? userPreviewData
      : buildGallerySampleFormData(templateId);
  return {
    previewData,
    injectOptions: resolveGalleryInjectOptions(templateId, previewData),
  };
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
