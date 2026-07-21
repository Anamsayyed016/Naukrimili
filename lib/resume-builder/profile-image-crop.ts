/**
 * Profile image crop export — mirrors the PhotoUpload live preview:
 * object-fit: cover + centered rotate/zoom, exported as a square fill.
 * Shape masking (circle, rounded, etc.) is handled by template CSS only.
 */

export const PROFILE_IMAGE_OUTPUT_SIZE = 512;

export interface ProfileImageFilters {
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
  grayscale: number;
}

export interface RenderProfileImageCropOptions {
  imageSrc: string;
  zoom: number;
  rotation: number;
  filters: ProfileImageFilters;
  outputSize?: number;
  /** Use PNG when the source is PNG with alpha; otherwise prefer JPEG for size. */
  preferPng?: boolean;
  quality?: number;
}

/** Cover-fit draw size after zoom — used by canvas export and unit tests. */
export function computeCoverDrawSize(
  imgWidth: number,
  imgHeight: number,
  outputSize: number,
  zoom: number
): { drawWidth: number; drawHeight: number } {
  const coverScale = Math.max(outputSize / imgWidth, outputSize / imgHeight);
  return {
    drawWidth: imgWidth * coverScale * zoom,
    drawHeight: imgHeight * coverScale * zoom,
  };
}

function applyPixelFilters(
  data: Uint8ClampedArray,
  filters: ProfileImageFilters
): void {
  const brightnessFactor = filters.brightness / 100;
  const contrastFactor = filters.contrast / 100;
  const intercept = 128 * (1 - contrastFactor);
  const satFactor = filters.saturate / 100;
  const grayAmount = filters.grayscale / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = r * brightnessFactor;
    g = g * brightnessFactor;
    b = b * brightnessFactor;

    r = r * contrastFactor + intercept;
    g = g * contrastFactor + intercept;
    b = b * contrastFactor + intercept;

    if (filters.saturate !== 100) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    if (grayAmount > 0) {
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      r = r * (1 - grayAmount) + gray * grayAmount;
      g = g * (1 - grayAmount) + gray * grayAmount;
      b = b * (1 - grayAmount) + gray * grayAmount;
    }

    data[i] = Math.min(255, Math.max(0, Math.round(r)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }
}

function loadImage(imageSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Failed to load image'));
    img.onload = () => resolve(img);
    img.src = imageSrc;
  });
}

/**
 * Render a square, full-bleed cropped profile image matching the editor preview.
 * Never bakes circle masks or white backgrounds into the export.
 */
export async function renderProfileImageCrop(
  options: RenderProfileImageCropOptions
): Promise<string> {
  const {
    imageSrc,
    zoom,
    rotation,
    filters,
    outputSize = PROFILE_IMAGE_OUTPUT_SIZE,
    preferPng = /^data:image\/png/i.test(imageSrc),
    quality = 0.92,
  } = options;

  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return imageSrc;

  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.save();
  ctx.translate(outputSize / 2, outputSize / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  const { drawWidth, drawHeight } = computeCoverDrawSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    outputSize,
    zoom
  );
  ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();

  const imageData = ctx.getImageData(0, 0, outputSize, outputSize);
  applyPixelFilters(imageData.data, filters);
  ctx.putImageData(imageData, 0, 0);

  if (filters.blur > 0) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = outputSize;
    tempCanvas.height = outputSize;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.filter = `blur(${filters.blur}px)`;
      tempCtx.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, outputSize, outputSize);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  if (preferPng) {
    return canvas.toDataURL('image/png');
  }
  return canvas.toDataURL('image/jpeg', quality);
}
