/**
 * Design Studio handoff — carries the CURRENT in-memory editor form across
 * Change Template navigation without reloading import session snapshots.
 */

export const DESIGN_STUDIO_STATE_KEY = 'resume-builder-design-studio-state';

export type DesignStudioHandoff = {
  templateId: string;
  formData: Record<string, unknown>;
  at: number;
};

function markUserEdited(formData: Record<string, unknown>): Record<string, unknown> {
  return {
    ...formData,
    _userEdited: true,
    _userEditedAt: Date.now(),
  };
}

/** Persist the live editor form for Design Studio / post-Apply editor reload. */
export function writeDesignStudioHandoff(
  templateId: string,
  formData: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !templateId) return;
  const payload: DesignStudioHandoff = {
    templateId,
    formData: markUserEdited(formData),
    at: Date.now(),
  };
  try {
    sessionStorage.setItem(DESIGN_STUDIO_STATE_KEY, JSON.stringify(payload));
  } catch {
    /* quota — localStorage draft is the fallback */
  }
}

/** Read handoff for a template (exact match, or any recent handoff when applying a new template). */
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
      // Allow Apply→new template: handoff is rewritten to the destination id before navigate.
      return null;
    }
    return parsed.formData;
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
