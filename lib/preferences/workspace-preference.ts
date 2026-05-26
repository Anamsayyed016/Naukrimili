/**
 * Client-side workspace preference helper.
 *
 * The jobseeker can choose between two "workspaces":
 *   - 'jobs'           → /dashboard/jobseeker
 *   - 'resume-builder' → /resume-builder/start
 *
 * Storage strategy:
 *   - Primary  : DB (Settings table, via /api/user/preferences/workspace)
 *   - Cache    : localStorage (browser-local, instant SSR/route decisions)
 *
 * IMPORTANT — owner-scoped cache
 * The localStorage cache is *browser-wide* by nature. To prevent the situation
 * where account A's preference leaks into account B's login on the same
 * machine, every write also stamps the **owner identity** (the user's id or
 * email — whichever is available at write time). On read, callers can supply
 * the current user identity; if it does not match the cached owner, the
 * cached value is wiped and treated as missing.
 *
 * This keeps cross-account pollution impossible without requiring server
 * round-trips on every route decision.
 */

export type WorkspaceId = 'jobs' | 'resume-builder';
export type WorkspacePreference = WorkspaceId | null;

const LOCAL_STORAGE_KEY = 'preferredWorkspace';
/**
 * Companion marker proving the value was set via the explicit
 * "Remember my choice" flow on the workspace selector. Anything that lacks
 * this marker is treated as stale legacy state and wiped.
 */
const EXPLICIT_MARKER_KEY = 'preferredWorkspace:explicit';
const EXPLICIT_MARKER_VALUE = '1';
/**
 * The user identity that owns the cached preference. Set together with the
 * preference itself; checked on every read where the caller knows who is
 * currently authenticated.
 */
const OWNER_KEY = 'preferredWorkspace:owner';

export const WORKSPACE_ROUTES: Record<WorkspaceId, string> = {
  jobs: '/dashboard/jobseeker',
  'resume-builder': '/resume-builder/start',
};

function isWorkspaceId(value: unknown): value is WorkspaceId {
  return value === 'jobs' || value === 'resume-builder';
}

/** Normalize a user identity into the owner-key string. */
function normalizeOwner(ownerKey: string | null | undefined): string | null {
  if (!ownerKey) return null;
  const trimmed = ownerKey.trim().toLowerCase();
  return trimmed || null;
}

function wipeCache(): void {
  try {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.localStorage.removeItem(EXPLICIT_MARKER_KEY);
    window.localStorage.removeItem(OWNER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Read the cached workspace preference (synchronous, SSR-safe).
 *
 * Returns `null` and wipes the cache when any of the following holds:
 *   - the value is missing
 *   - the explicit marker is missing (legacy / silently-written values)
 *   - the caller passed `expectedOwnerKey` and it does not match the cached
 *     owner (cross-account pollution on a shared browser)
 */
export function getCachedWorkspacePreference(
  expectedOwnerKey?: string | null
): WorkspacePreference {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!isWorkspaceId(raw)) return null;

    const marker = window.localStorage.getItem(EXPLICIT_MARKER_KEY);
    if (marker !== EXPLICIT_MARKER_VALUE) {
      wipeCache();
      return null;
    }

    const expected = normalizeOwner(expectedOwnerKey);
    if (expected !== null) {
      const owner = normalizeOwner(window.localStorage.getItem(OWNER_KEY));
      if (owner !== expected) {
        wipeCache();
        return null;
      }
    }

    return raw;
  } catch {
    return null;
  }
}

/**
 * Write the workspace preference to localStorage (does not call the API).
 * When a workspace is provided, the explicit marker AND the owner identity
 * are stamped alongside it.
 */
export function setCachedWorkspacePreference(
  workspace: WorkspacePreference,
  ownerKey?: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    if (workspace) {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, workspace);
      window.localStorage.setItem(EXPLICIT_MARKER_KEY, EXPLICIT_MARKER_VALUE);
      const owner = normalizeOwner(ownerKey);
      if (owner) {
        window.localStorage.setItem(OWNER_KEY, owner);
      } else {
        window.localStorage.removeItem(OWNER_KEY);
      }
    } else {
      wipeCache();
    }
  } catch {
    /* ignore quota / privacy errors */
  }
}

/**
 * Hard-wipe the cached preference. Call this on logout, on signup, or whenever
 * a fresh slate is the safer default than trusting the cache.
 */
export function clearWorkspacePreferenceCache(): void {
  if (typeof window === 'undefined') return;
  wipeCache();
}

/**
 * Wipe the cached preference if it does not belong to the supplied user.
 * Returns `true` if the cache was wiped, `false` if it was kept (or absent).
 *
 * Call this immediately after a successful login / signup, passing the
 * authenticated user's id (or email as a fallback). Cross-account pollution
 * cannot survive this check.
 */
export function ensureWorkspacePreferenceOwnedBy(ownerKey: string | null | undefined): boolean {
  if (typeof window === 'undefined') return false;
  const expected = normalizeOwner(ownerKey);
  if (!expected) return false;

  try {
    const existing = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!existing) return false;

    const owner = normalizeOwner(window.localStorage.getItem(OWNER_KEY));
    if (owner === expected) return false;

    wipeCache();
    return true;
  } catch {
    return false;
  }
}

/**
 * Persist the preference server-side (and update the local cache).
 *
 *   remember=true   → upserts the preference (stamped with the owner key)
 *   remember=false  → clears it on the server AND in the local cache
 */
export async function persistWorkspacePreference(
  workspace: WorkspaceId,
  remember: boolean,
  ownerKey?: string | null
): Promise<void> {
  setCachedWorkspacePreference(remember ? workspace : null, ownerKey);
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
export async function refreshWorkspacePreferenceFromServer(
  ownerKey?: string | null
): Promise<WorkspacePreference> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/user/preferences/workspace', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return getCachedWorkspacePreference(ownerKey);
    const data = (await res.json()) as { workspace?: unknown };
    const workspace = isWorkspaceId(data?.workspace) ? data.workspace : null;
    setCachedWorkspacePreference(workspace, ownerKey);
    return workspace;
  } catch {
    return getCachedWorkspacePreference(ownerKey);
  }
}

/** Resolve the path the saved preference should redirect to, or null when none. */
export function getPreferredWorkspacePath(ownerKey?: string | null): string | null {
  const pref = getCachedWorkspacePreference(ownerKey);
  return pref ? WORKSPACE_ROUTES[pref] : null;
}
