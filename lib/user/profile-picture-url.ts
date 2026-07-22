/**
 * Client-safe profile picture URL helpers (no Node.js fs imports).
 */

export const PROFILE_PICTURE_LEGACY_PREFIX = '/uploads/profile-pictures/';

export const PROFILE_PICTURE_ASSET_PREFIX = '/api/user/profile-photo/asset/';

/**
 * Rewrite legacy /uploads/profile-pictures/* to the servable API asset URL.
 * GCS and OAuth URLs are returned unchanged.
 */
export function normalizeStoredProfilePictureUrl(
  url: string | null | undefined
): string | null {
  if (!url?.trim()) return null;
  const base = url.trim().split('?')[0];
  if (base.startsWith(PROFILE_PICTURE_LEGACY_PREFIX)) {
    return base.replace(
      PROFILE_PICTURE_LEGACY_PREFIX,
      PROFILE_PICTURE_ASSET_PREFIX
    );
  }
  return base;
}

export function toProfilePictureAssetUrl(userId: string, fileName: string): string {
  return `${PROFILE_PICTURE_ASSET_PREFIX}${userId}/${fileName}`;
}

/** Relative path `{userId}/{filename}` for local disk operations (server only). */
export function localProfilePictureRelativePath(
  storedUrl: string
): string | null {
  const trimmed = storedUrl.trim().split('?')[0];
  if (trimmed.startsWith(PROFILE_PICTURE_ASSET_PREFIX)) {
    return trimmed.slice(PROFILE_PICTURE_ASSET_PREFIX.length);
  }
  if (trimmed.startsWith(PROFILE_PICTURE_LEGACY_PREFIX)) {
    return trimmed.slice(PROFILE_PICTURE_LEGACY_PREFIX.length);
  }
  return null;
}
