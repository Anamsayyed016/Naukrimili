/** A4 dimensions at 96 DPI — used for editor preview scaling */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

export type PreviewZoomMode = 'fit' | number;

export const PREVIEW_ZOOM_STEPS: { label: string; value: PreviewZoomMode }[] = [
  { label: 'Fit', value: 'fit' },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: '125%', value: 1.25 },
];

/**
 * Scale to fit container while keeping full A4 logical width (794px).
 * Never scales above 1 unless user picks a zoom > 1.
 */
export function getPreviewFitPadding(containerWidth: number): number {
  if (containerWidth < 400) return 12;
  if (containerWidth < 640) return 20;
  if (containerWidth < 1200) return 32;
  return 48;
}

export type PreviewFitMode = 'both' | 'width';

/**
 * @param fitMode `width` — fit to viewport width only (mobile scroll vertically).
 *                `both` — fit width and height (desktop editor panel).
 */
export function computeFitScale(
  containerWidth: number,
  containerHeight: number,
  contentHeight: number,
  padding?: number,
  fitMode: PreviewFitMode = 'both'
): number {
  if (containerWidth <= 0) return 1;

  const pad =
    padding ??
    (fitMode === 'width' ? 4 : getPreviewFitPadding(containerWidth));

  const availableW = Math.max(containerWidth - pad, 120);
  const scaleW = availableW / A4_WIDTH_PX;

  if (fitMode === 'width') {
    return Math.min(scaleW, 1);
  }

  if (containerHeight <= 0) return Math.min(scaleW, 1);

  const availableH = Math.max(containerHeight - pad, 160);
  const h = Math.max(contentHeight, A4_HEIGHT_PX);
  const scaleH = availableH / h;

  return Math.min(scaleW, scaleH, 1);
}

export function resolvePreviewScale(
  zoom: PreviewZoomMode,
  fitScale: number
): number {
  if (zoom === 'fit') return fitScale;
  return zoom;
}

/** Logical iframe size for gallery thumbnail HTML previews (matches A4 at 96 DPI). */
export const GALLERY_IFRAME_WIDTH = A4_WIDTH_PX;
export const GALLERY_IFRAME_HEIGHT = A4_HEIGHT_PX;

/**
 * Proportional scale so a full A4 iframe fits inside the gallery card viewport.
 * Does not upscale above 1 — keeps text sharp (no blurry zoom-in).
 */
export function computeGalleryThumbnailScale(
  containerWidth: number,
  containerHeight: number,
  padding = 6,
  contentHeight = GALLERY_IFRAME_HEIGHT
): number {
  if (containerWidth <= 0 || containerHeight <= 0) return 0.5;

  const availableW = Math.max(containerWidth - padding * 2, 120);
  const availableH = Math.max(containerHeight - padding * 2, 120);

  const scaleW = availableW / GALLERY_IFRAME_WIDTH;
  const logicalHeight = Math.max(contentHeight, GALLERY_IFRAME_HEIGHT);
  const scaleH = availableH / logicalHeight;

  return Math.min(scaleW, scaleH, 1);
}
