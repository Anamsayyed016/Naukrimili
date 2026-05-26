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

export const WORKSPACE_ROUTES: Record<WorkspaceId, string> = {
  jobs: '/dashboard/jobseeker',
  'resume-builder': '/resume-builder/start',
};

function isWorkspaceId(value: unknown): value is WorkspaceId {
  return value === 'jobs' || value === 'resume-builder';
}

/** Read the cached workspace preference from localStorage (synchronous, SSR-safe). */
export function getCachedWorkspacePreference(): WorkspacePreference {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return isWorkspaceId(raw) ? raw : null;
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
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
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
