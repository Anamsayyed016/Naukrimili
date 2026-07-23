/**
 * Live builder form handoff for Design Studio / Change Template.
 *
 * Single source of truth across Editor → Design Studio → Apply → Editor.
 * Large profile images are stored only in PROFILE_IMAGE_STORAGE_KEY and
 * stripped from this payload so sessionStorage quota never leaves a STALE
 * prior handoff in place (root cause of "wrong resume" in Design Studio).
 */

import {
  mergePersistedProfileImageIntoFormData,
  syncPersistedProfileImageFromFormData,
} from '@/lib/resume-builder/profile-image-persistence';

export const DESIGN_STUDIO_STATE_KEY = 'resume-builder-design-studio-state';
/** @deprecated alias — same key as DESIGN_STUDIO_STATE_KEY */
export const LIVE_BUILDER_FORM_KEY = DESIGN_STUDIO_STATE_KEY;

export type DesignStudioHandoff = {
  templateId: string;
  formData: Record<string, unknown>;
  at: number;
  /** Monotonic write stamp so readers can reject empty/failed overwrites conceptually */
  v: number;
};

const PROFILE_KEYS = [
  'profileImage',
  'photo',
  'profilePhoto',
  'Profile Image',
  'Photo',
] as const;

/** Keep resume text; drop embedded images (restored from the global photo store). */
export function stripProfileImagesForHandoff(
  formData: Record<string, unknown>
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...formData };
  for (const key of PROFILE_KEYS) {
    if (key in next) delete next[key];
  }
  // Drop bulky parser dumps that blow sessionStorage quota.
  if (typeof next.rawText === 'string' && next.rawText.length > 20_000) {
    next.rawText = '';
  }
  return next;
}

function markUserEdited(formData: Record<string, unknown>): Record<string, unknown> {
  return {
    ...formData,
    _userEdited: true,
    _userEditedAt: Date.now(),
  };
}

/**
 * Persist the CURRENT in-memory editor form for Design Studio.
 * Always clears the previous handoff first so a failed write cannot leave
 * an older resume (e.g. a previous import) as the preferred source.
 */
export function writeDesignStudioHandoff(
  templateId: string,
  formData: Record<string, unknown>
): boolean {
  if (typeof window === 'undefined' || !templateId) return false;

  // Photo lives in the dedicated store — keep it current before stripping.
  syncPersistedProfileImageFromFormData(formData);

  const payload: DesignStudioHandoff = {
    templateId,
    formData: markUserEdited(stripProfileImagesForHandoff(formData)),
    at: Date.now(),
    v: 1,
  };

  // Clear first so readers never see a previous person's resume.
  try {
    sessionStorage.removeItem(DESIGN_STUDIO_STATE_KEY);
  } catch {
    /* ignore */
  }

  try {
    sessionStorage.setItem(DESIGN_STUDIO_STATE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    // Last resort: drop more bulky fields and retry once.
    try {
      const slim = { ...payload.formData };
      delete slim.rawText;
      delete slim._aiSuggestions;
      delete slim.projectAiSuggestions;
      sessionStorage.setItem(
        DESIGN_STUDIO_STATE_KEY,
        JSON.stringify({ ...payload, formData: slim })
      );
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Read the live handoff and restore the user photo from the global store.
 * Returns null when missing or templateId mismatches (stale / wrong template).
 */
export function readDesignStudioHandoff(
  templateId: string
): Record<string, unknown> | null {
  if (typeof window === 'undefined' || !templateId) return null;
  try {
    const raw = sessionStorage.getItem(DESIGN_STUDIO_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DesignStudioHandoff;
    if (!parsed || typeof parsed !== 'object' || !parsed.formData) return null;
    if (parsed.templateId && parsed.templateId !== templateId) {
      return null;
    }
    // Restore photo from dedicated store (stripped on write).
    return mergePersistedProfileImageIntoFormData({ ...parsed.formData });
  } catch {
    return null;
  }
}

export function clearDesignStudioHandoff(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(DESIGN_STUDIO_STATE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Write a quota-safe per-template draft (text + flags; photo in global store).
 * Returns true when localStorage accepted the write.
 */
export function writeQuotaSafeTemplateDraft(
  templateId: string,
  formData: Record<string, unknown>
): boolean {
  if (typeof window === 'undefined' || !templateId) return false;
  syncPersistedProfileImageFromFormData(formData);
  const payload = markUserEdited(stripProfileImagesForHandoff(formData));
  try {
    localStorage.setItem(`resume-${templateId}`, JSON.stringify(payload));
    return true;
  } catch {
    try {
      const slim = { ...payload };
      delete slim.rawText;
      localStorage.setItem(`resume-${templateId}`, JSON.stringify(slim));
      return true;
    } catch {
      return false;
    }
  }
}
