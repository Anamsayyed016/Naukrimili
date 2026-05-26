/**
 * Default post-auth destination for jobseekers — resume builder entry.
 * Client-only (uses sessionStorage / localStorage).
 */

import { getPreferredWorkspacePath } from '@/lib/preferences/workspace-preference';

const LAST_EDITOR_KEY = 'resume-builder-last-editor';
const RESUME_DRAFT_PREFIX = 'resume-';

const WORKSPACE_SELECTOR_PATH = '/dashboard/workspace-selector';

export interface ResumeBuilderLastEditor {
  templateId: string;
  typeId?: string;
  updatedAt: number;
}

/** Persist latest editor session (called from editor auto-save). */
export function saveResumeBuilderLastEditor(templateId: string, typeId?: string): void {
  if (typeof window === 'undefined' || !templateId) return;
  try {
    const payload: ResumeBuilderLastEditor = {
      templateId,
      typeId: typeId || undefined,
      updatedAt: Date.now(),
    };
    localStorage.setItem(LAST_EDITOR_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota errors */
  }
}

function buildEditorUrl(templateId: string, typeId?: string): string {
  const type = typeId ? `&type=${encodeURIComponent(typeId)}` : '';
  return `/resume-builder/editor?template=${encodeURIComponent(templateId)}${type}`;
}

function hasMeaningfulDraft(raw: string | null): boolean {
  if (!raw || raw.length < 8) return false;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return Boolean(
      data.firstName ||
        data.lastName ||
        data.name ||
        data.email ||
        data['Full Name'] ||
        (Array.isArray(data.experience) && data.experience.length > 0)
    );
  } catch {
    return false;
  }
}

/**
 * Resolve where a jobseeker should land after login / role selection.
 * Priority: return URL → payment flow → last editor draft → /resume-builder/start
 */
export function getJobseekerResumeBuilderEntryPath(): string {
  if (typeof window === 'undefined') {
    return '/resume-builder/start';
  }

  try {
    const returnUrl = sessionStorage.getItem('resume-builder-return-url');
    if (returnUrl?.startsWith('/resume-builder/')) {
      return returnUrl;
    }

    const paymentFlow = sessionStorage.getItem('resume-builder-payment-flow');
    if (paymentFlow) {
      const saved = JSON.parse(paymentFlow) as { templateId?: string; typeId?: string };
      if (saved.templateId) {
        return buildEditorUrl(saved.templateId, saved.typeId);
      }
    }

    const lastRaw = localStorage.getItem(LAST_EDITOR_KEY);
    if (lastRaw) {
      const last = JSON.parse(lastRaw) as ResumeBuilderLastEditor;
      if (last.templateId && hasMeaningfulDraft(localStorage.getItem(`${RESUME_DRAFT_PREFIX}${last.templateId}`))) {
        return buildEditorUrl(last.templateId, last.typeId);
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(RESUME_DRAFT_PREFIX) || key === LAST_EDITOR_KEY) continue;
      const templateId = key.slice(RESUME_DRAFT_PREFIX.length);
      if (!templateId || templateId.includes('/')) continue;
      if (hasMeaningfulDraft(localStorage.getItem(key))) {
        return buildEditorUrl(templateId);
      }
    }
  } catch {
    /* fall through */
  }

  return '/resume-builder/start';
}

/**
 * Resolve the **post-login** destination for a jobseeker.
 *
 * Priority order (intentionally favours one-shot intents so payment / return-URL
 * flows continue to work, then falls back to the user's saved workspace pref,
 * then to the workspace-selector screen so the user picks):
 *
 *   1) Active resume-builder return URL / payment-flow / draft (urgent, one-shot)
 *   2) Saved workspace preference (localStorage mirror of the DB Settings row)
 *   3) /dashboard/workspace-selector (premium "pick your workspace" screen)
 *
 * On the server (no `window`) we cannot read sessionStorage / localStorage, so
 * we return the workspace selector — the client effect on the destination page
 * will reconcile preferences after hydration.
 */
export function getJobseekerPostLoginRedirect(): string {
  if (typeof window === 'undefined') {
    return WORKSPACE_SELECTOR_PATH;
  }

  try {
    // 1) Active resume-builder intents always win (payment / return-URL / draft).
    const returnUrl = sessionStorage.getItem('resume-builder-return-url');
    if (returnUrl?.startsWith('/resume-builder/')) {
      return returnUrl;
    }

    const paymentFlow = sessionStorage.getItem('resume-builder-payment-flow');
    if (paymentFlow) {
      const saved = JSON.parse(paymentFlow) as { templateId?: string; typeId?: string };
      if (saved.templateId) {
        return buildEditorUrl(saved.templateId, saved.typeId);
      }
    }
  } catch {
    /* fall through */
  }

  // 2) Saved workspace preference (Remember my choice).
  const preferred = getPreferredWorkspacePath();
  if (preferred) return preferred;

  // 3) No preference and no intent → show the workspace selector.
  return WORKSPACE_SELECTOR_PATH;
}
