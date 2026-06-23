/**
 * Cloudinary delivery transforms for next/image and static assets.
 * Keeps visual output identical while reducing bytes over the wire.
 */
export const CLOUDINARY_UPLOAD_HOST = 'res.cloudinary.com';

export function isCloudinaryUrl(url: string): boolean {
  return url.includes(CLOUDINARY_UPLOAD_HOST);
}

/** Apply auto format/quality when URL is Cloudinary and not already transformed. */
export function optimizeCloudinaryUrl(url: string, width?: number): string {
  if (!isCloudinaryUrl(url)) return url;
  if (url.includes('/upload/') && /\/upload\/[^/]*q_auto/.test(url)) {
    return url;
  }
  const transform = width
    ? `q_auto,f_auto,w_${width},c_limit`
    : 'q_auto,f_auto';
  return url.replace('/upload/', `/upload/${transform}/`);
}
