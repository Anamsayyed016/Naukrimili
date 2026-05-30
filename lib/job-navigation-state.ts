/**
 * Shared sessionStorage keys for job detail back-navigation.
 * Single source of truth — do not duplicate elsewhere.
 */

export const JOB_NAV_KEYS = {
  source: 'jobDetailsSource',
  searchParams: 'jobSearchParams',
  listPage: 'jobsListPage',
  lastViewedJobId: 'lastViewedJobId',
} as const;

export function saveJobNavigationSource(sourcePath: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(JOB_NAV_KEYS.source, sourcePath);
}

export function saveJobSearchContext(searchQueryString: string, page?: number): void {
  if (typeof window === 'undefined') return;
  if (searchQueryString) {
    sessionStorage.setItem(JOB_NAV_KEYS.searchParams, searchQueryString);
  }
  if (page != null && page > 0) {
    sessionStorage.setItem(JOB_NAV_KEYS.listPage, String(page));
  }
}

function isJobsListSource(source: string | null): boolean {
  if (!source) return false;
  return source === '/jobs' || source.startsWith('/jobs?');
}

/**
 * Resolve where the job details Back button should go.
 * Priority: explicit non-jobs source → jobs search context → browser history.
 */
export function resolveJobDetailsBackTarget(): string | null {
  if (typeof window === 'undefined') return null;

  const sourcePage = sessionStorage.getItem(JOB_NAV_KEYS.source);
  const savedParams = sessionStorage.getItem(JOB_NAV_KEYS.searchParams);
  const savedPage = sessionStorage.getItem(JOB_NAV_KEYS.listPage);

  // Dashboard, bookmarks, resume upload, etc.
  if (sourcePage && !isJobsListSource(sourcePage)) {
    return sourcePage;
  }

  // Jobs list with filters/search (and optional page)
  if (isJobsListSource(sourcePage || '/jobs') || savedParams) {
    const params = new URLSearchParams(savedParams || '');
    if (savedPage && !params.has('page')) {
      params.set('page', savedPage);
    }
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : '/jobs';
  }

  if (sourcePage) {
    return sourcePage;
  }

  return null;
}

export function navigateJobDetailsBack(
  router: { push: (href: string) => void; back: () => void }
): void {
  const target = resolveJobDetailsBackTarget();
  if (target) {
    router.push(target);
    return;
  }
  router.back();
}
