/**
 * Client-side workspace preference helper.
 *
 * The jobseeker can choose between two "workspaces":
 *   - 'jobs'           → /dashboard/jobseeker
 *   - 'resume-builder' → /resume-builder/start
 *
 * Storage strategy:
 *   - Primary  : DB (Settings table, via /api/user/preferences/workspace)
 *   - Cache    : localStorage  (instant SSR/route decisions before API resolves)
 *
 * The local mirror keeps the post-login redirect snappy. The DB write is fire-and-forget
 * from the selector page so the redirect is never blocked on a network round-trip.
 */

export type WorkspaceId = 'jobs' | 'resume-builder';
export type WorkspacePreference = WorkspaceId | null;

const LOCAL_STORAGE_KEY = 'preferredWorkspace';
/**
 * Companion marker proving the value was set via the explicit
 * "Remember my choice" flow. Older clients (or cache pollution from earlier
 * builds) may have a `preferredWorkspace` value WITHOUT this marker — those
 * are treated as stale and auto-cleared on first read.
 */
const EXPLICIT_MARKER_KEY = 'preferredWorkspace:explicit';
const EXPLICIT_MARKER_VALUE = '1';

export const WORKSPACE_ROUTES: Record<WorkspaceId, string> = {
  jobs: '/dashboard/jobseeker',
  'resume-builder': '/resume-builder/start',
};

function isWorkspaceId(value: unknown): value is WorkspaceId {
  return value === 'jobs' || value === 'resume-builder';
}

/**
 * Read the cached workspace preference from localStorage (synchronous, SSR-safe).
 *
 * Returns null if the value is missing OR if the explicit marker is missing —
 * the latter prevents legacy/stale writes (from older builds where the navbar
 * silently wrote the key on every click) from suppressing the workspace
 * selector forever.
 */
export function getCachedWorkspacePreference(): WorkspacePreference {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!isWorkspaceId(raw)) return null;

    const marker = window.localStorage.getItem(EXPLICIT_MARKER_KEY);
    if (marker !== EXPLICIT_MARKER_VALUE) {
      // Stale value from a previous build / aggressive navbar click — wipe it
      // so the workspace selector appears again on this login.
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      return null;
    }

    return raw;
  } catch {
    return null;
  }
}

/** Write the workspace preference to localStorage (does not call the API). */
export function setCachedWorkspacePreference(workspace: WorkspacePreference): void {
  if (typeof window === 'undefined') return;
  try {
    if (workspace) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, workspace);
      window.localStorage.setItem(EXPLICIT_MARKER_KEY, EXPLICIT_MARKER_VALUE);
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      window.localStorage.removeItem(EXPLICIT_MARKER_KEY);
    }
  } catch {
    /* ignore quota / privacy errors */
  }
}

/**
 * Persist the preference server-side (and update the local cache).
 *
 *   remember=true   → upserts the preference
 *   remember=false  → clears it on the server AND in the local cache
 */
export async function persistWorkspacePreference(
  workspace: WorkspaceId,
  remember: boolean
): Promise<void> {
  setCachedWorkspacePreference(remember ? workspace : null);
  try {
    await fetch('/api/user/preferences/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace, remember }),
      credentials: 'include',
    });
  } catch {
    /* server unreachable — local cache still keeps the choice for this device */
  }
}

/**
 * Refresh the local cache from the server (best-effort).
 * Call this on app boot / dashboard load so a user who set their preference on
 * device A also gets the saved choice on device B.
 */
export async function refreshWorkspacePreferenceFromServer(): Promise<WorkspacePreference> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/user/preferences/workspace', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return getCachedWorkspacePreference();
    const data = (await res.json()) as { workspace?: unknown };
    const workspace = isWorkspaceId(data?.workspace) ? data.workspace : null;
    setCachedWorkspacePreference(workspace);
    return workspace;
  } catch {
    return getCachedWorkspacePreference();
  }
}

/** Resolve the path the saved preference should redirect to, or null when none. */
export function getPreferredWorkspacePath(): string | null {
  const pref = getCachedWorkspacePreference();
  return pref ? WORKSPACE_ROUTES[pref] : null;
}
