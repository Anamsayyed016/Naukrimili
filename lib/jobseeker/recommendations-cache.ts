/**
 * Client-side cache for job seeker dashboard recommendations.
 * Invalidates when the active resume changes (upload, delete, activation).
 */

export const JOBSEEKER_RECOMMENDATIONS_CACHE_KEY = 'jobseeker_dashboard_recs_v2';
export const JOBSEEKER_RECOMMENDATIONS_CACHE_TTL_MS = 5 * 60 * 1000;

export type CachedRecommendationsPayload = {
  timestamp: number;
  resumeFingerprint: string;
  jobs: unknown[];
};

export function getResumeFingerprint(activeResumeId: string | null | undefined): string {
  return activeResumeId ?? 'no-active-resume';
}

export function clearJobseekerRecommendationsCache(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(JOBSEEKER_RECOMMENDATIONS_CACHE_KEY);
  } catch {
    // ignore
  }
}

export function readJobseekerRecommendationsCache<T>(
  resumeFingerprint: string
): T[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(JOBSEEKER_RECOMMENDATIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRecommendationsPayload;
    if (Date.now() - parsed.timestamp > JOBSEEKER_RECOMMENDATIONS_CACHE_TTL_MS) {
      clearJobseekerRecommendationsCache();
      return null;
    }
    if (parsed.resumeFingerprint !== resumeFingerprint) {
      clearJobseekerRecommendationsCache();
      return null;
    }
    return Array.isArray(parsed.jobs) ? (parsed.jobs as T[]) : null;
  } catch {
    return null;
  }
}

export function writeJobseekerRecommendationsCache(
  jobs: unknown[],
  resumeFingerprint: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedRecommendationsPayload = {
      timestamp: Date.now(),
      resumeFingerprint,
      jobs,
    };
    sessionStorage.setItem(
      JOBSEEKER_RECOMMENDATIONS_CACHE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // ignore
  }
}
