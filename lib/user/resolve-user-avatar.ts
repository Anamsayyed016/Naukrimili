/**
 * Account avatar resolution — separate from Resume Builder profile images.
 * OAuth avatars (User.image) are never overwritten; uploads use User.profilePicture.
 */

import { normalizeStoredProfilePictureUrl } from '@/lib/user/profile-picture-url';

export function resolveUserAvatarUrl(
  profilePicture?: string | null,
  oauthImage?: string | null
): string | null {
  const picture = normalizeStoredProfilePictureUrl(profilePicture);
  if (picture) return picture;
  const oauth = oauthImage?.trim();
  if (oauth) return oauth;
  return null;
}

/** Cache-bust avatar URLs after upload so browsers show the new image immediately. */
export function withAvatarCacheBust(
  url: string | null | undefined,
  version?: string | number | null
): string | undefined {
  if (!url?.trim()) return undefined;
  if (url.startsWith('data:')) return url;
  const v = version ?? Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(String(v))}`;
}

export function getUserInitials(
  name?: string | null,
  email?: string | null,
  firstName?: string | null,
  lastName?: string | null
): string {
  const first = firstName?.trim();
  const last = lastName?.trim();
  if (first || last) {
    return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'U';
  }
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].charAt(0).toUpperCase();
  }
  if (email?.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return 'U';
}
