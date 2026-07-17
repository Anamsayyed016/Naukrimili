/** Shared demo portrait URL — gallery cards and editor/preview placeholders only. */
export const DEFAULT_DEMO_PROFILE_IMAGE =
  'https://res.cloudinary.com/drot7xb9m/image/upload/v1782134751/naulogoimg_j5uodj.png';

export function isDemoProfileImageUrl(url: unknown): boolean {
  const value = typeof url === 'string' ? url.trim() : '';
  if (!value) return false;
  if (value === DEFAULT_DEMO_PROFILE_IMAGE) return true;
  if (value.includes('naulogoimg_j5uodj')) return true;
  if (value.includes('drot7xb9m/image/upload') && value.includes('naulogoimg')) return true;
  return false;
}
