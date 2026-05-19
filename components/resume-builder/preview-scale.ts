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
export function computeFitScale(
  containerWidth: number,
  containerHeight: number,
  contentHeight: number,
  padding = 48
): number {
  if (containerWidth <= 0 || containerHeight <= 0) return 1;

  const availableW = Math.max(containerWidth - padding, 200);
  const availableH = Math.max(containerHeight - padding, 200);
  const h = Math.max(contentHeight, A4_HEIGHT_PX);

  const scaleW = availableW / A4_WIDTH_PX;
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
