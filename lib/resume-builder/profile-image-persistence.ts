/**
 * Template-agnostic profile photo persistence.
 * User photos survive template switches even when per-template drafts are empty
 * or localStorage quota prevents embedding large base64 blobs in draft JSON.
 */

import {
  isValidProfileImage,
  resolveProfileImageForRender,
} from '@/lib/resume-builder/section-visibility';

export const PROFILE_IMAGE_STORAGE_KEY = 'resume-builder-user-profile-image';

const PROFILE_FIELD_ALIASES = [
  'profileImage',
  'photo',
  'profilePhoto',
  'Profile Image',
  'Photo',
] as const;

export function profileImageFieldPatch(value: string): Record<string, string> {
  const patch: Record<string, string> = {};
  for (const key of PROFILE_FIELD_ALIASES) {
    patch[key] = value;
  }
  return patch;
}

export function readPersistedProfileImage(): string {
  if (typeof window === 'undefined') return '';
  try {
    const fromLocal = localStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
    if (fromLocal && isValidProfileImage(fromLocal)) return fromLocal;
    const fromSession = sessionStorage.getItem(PROFILE_IMAGE_STORAGE_KEY);
    if (fromSession && isValidProfileImage(fromSession)) return fromSession;
  } catch {
    /* quota / privacy mode */
  }
  return '';
}

export function persistProfileImage(value: string): void {
  if (typeof window === 'undefined') return;

  if (!value || !isValidProfileImage(value)) {
    try {
      localStorage.removeItem(PROFILE_IMAGE_STORAGE_KEY);
      sessionStorage.removeItem(PROFILE_IMAGE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    localStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, value);
    sessionStorage.removeItem(PROFILE_IMAGE_STORAGE_KEY);
    return;
  } catch {
    /* fall through */
  }

  try {
    sessionStorage.setItem(PROFILE_IMAGE_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

/** Sync global photo store from any form payload that carries a valid image. */
export function syncPersistedProfileImageFromFormData(
  formData: Record<string, unknown>
): void {
  const current = resolveProfileImageForRender(formData);
  if (isValidProfileImage(current)) {
    persistProfileImage(current);
  }
}

/**
 * Whether persisted user photo should be merged before template injection.
 * Gallery demo cards and marketing previews must never read the global photo store.
 */
export function shouldMergePersistedProfileImageForRender(
  formData: Record<string, unknown>,
  options?: { galleryPreview?: boolean }
): boolean {
  if (options?.galleryPreview) return false;
  if (formData._galleryDemo === true) return false;
  return true;
}

/** Merge global user photo only for editor/export renders — not gallery demo cards. */
export function prepareFormDataForResumeRender(
  formData: Record<string, unknown>,
  options?: { galleryPreview?: boolean }
): Record<string, unknown> {
  if (!shouldMergePersistedProfileImageForRender(formData, options)) {
    return formData;
  }
  return mergePersistedProfileImageIntoFormData(formData);
}

/**
 * Restore a user-uploaded photo onto form data when the draft/import omitted it.
 * Never overwrites an existing valid user photo.
 */
export function mergePersistedProfileImageIntoFormData(
  formData: Record<string, unknown>
): Record<string, unknown> {
  const current = resolveProfileImageForRender(formData);
  if (isValidProfileImage(current)) {
    syncPersistedProfileImageFromFormData(formData);
    return formData;
  }

  const persisted = readPersistedProfileImage();
  if (!persisted) return formData;

  return {
    ...formData,
    ...profileImageFieldPatch(persisted),
  };
}
