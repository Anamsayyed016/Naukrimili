import {
  buildGallerySampleFormData,
  isGalleryEmptyFormData,
} from '@/lib/resume-builder/gallery-demo';

export type GalleryInjectOptions = {
  galleryPreview?: boolean;
  galleryTemplateId?: string;
  /**
   * Marketing gallery with real user/import content: force demo portrait only.
   * Does not switch layout into compact gallery budgets (unlike galleryPreview alone).
   */
  galleryForceDemoPhoto?: boolean;
  /** Gallery cards only: lock photo to the selected form object (no localStorage merge). */
  gallerySourceLock?: boolean;
  templateId?: string;
  mode?: 'preview';
};

/**
 * Inject options for a gallery card source object.
 * Demo sample → compact galleryPreview.
 * User/import content → live layout + force demo photo (never user upload / never full demo resume).
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
    galleryForceDemoPhoto: true,
  };
}

/** Demo/sample cards use compact typography; user resumes mirror Live Preview CSS. */
export function isGalleryCompactPreview(previewData: Record<string, unknown>): boolean {
  return isGalleryEmptyFormData(previewData) || previewData._galleryDemo === true;
}

/**
 * Marketing Template Gallery card plan.
 * - With import/user data → user content + demo portrait only.
 * - Without → full demo sample.
 */
export function resolveMarketingGalleryCardRenderPlan(
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

/**
 * @deprecated Use resolveMarketingGalleryCardRenderPlan for the public gallery.
 * Kept for callers that intentionally want a full demo sample.
 */
export function resolveDemoGalleryCardRenderPlan(templateId: string): {
  previewData: Record<string, unknown>;
  injectOptions: GalleryInjectOptions;
} {
  return resolveMarketingGalleryCardRenderPlan(templateId, null);
}

/**
 * Change-template / Design Studio cards: current editor form only (user photo included).
 * Never falls back to gallery demo resume content.
 */
export function resolveEditorTemplateCardRenderPlan(
  templateId: string,
  editorFormData: Record<string, unknown> | null | undefined
): {
  previewData: Record<string, unknown>;
  injectOptions: GalleryInjectOptions;
} {
  const previewData =
    editorFormData && !isGalleryEmptyFormData(editorFormData) ? editorFormData : {};
  return {
    previewData,
    injectOptions: {
      templateId,
      galleryTemplateId: templateId,
      mode: 'preview',
      gallerySourceLock: true,
    },
  };
}

/**
 * @deprecated Prefer resolveMarketingGalleryCardRenderPlan or resolveEditorTemplateCardRenderPlan.
 */
export function resolveGalleryCardRenderPlan(
  templateId: string,
  userPreviewData: Record<string, unknown> | null | undefined
): {
  previewData: Record<string, unknown>;
  injectOptions: GalleryInjectOptions;
} {
  return resolveMarketingGalleryCardRenderPlan(templateId, userPreviewData);
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
