import type { NormalizedJob } from './types';

/** External job providers are disabled; adapters return empty results safely. */
const DISABLED = 'disabled' as const;

export type JobProviderId =
  | 'adzuna'
  | 'jsearch'
  | 'google_jobs'
  | 'jooble'
  | 'indeed'
  | 'ziprecruiter'
  | 'reed'
  | 'coresignal';

export interface JobProviderHealthDetail {
  status: typeof DISABLED | 'not_configured';
  message?: string;
  jobsFound?: number;
}

export interface JobProvidersHealth {
  adzuna: boolean;
  indeed: boolean;
  ziprecruiter: boolean;
  coresignal: boolean;
  details: Record<string, JobProviderHealthDetail>;
}

const empty = (): Promise<NormalizedJob[]> => Promise.resolve([]);

export async function fetchFromAdzuna(
  _query: string,
  _countryCode = 'gb',
  _page = 1,
  _options?: { location?: string; distanceKm?: number }
): Promise<NormalizedJob[]> {
  return empty();
}

export async function fetchFromJSearch(
  _query: string,
  _countryCode = 'US',
  _page = 1,
  _location?: string
): Promise<NormalizedJob[]> {
  return empty();
}

export async function fetchFromGoogleJobs(
  _query: string,
  _location = 'India',
  _page = 1
): Promise<NormalizedJob[]> {
  return empty();
}

export async function fetchFromJooble(
  _query: string,
  _location = 'India',
  _page = 1,
  _options?: { radius?: number; salary?: string; countryCode?: string }
): Promise<NormalizedJob[]> {
  return empty();
}

export async function fetchFromIndeed(
  _query: string,
  _location = 'India',
  _page = 1
): Promise<NormalizedJob[]> {
  return empty();
}

export async function fetchFromZipRecruiter(
  _query: string,
  _location = 'India',
  _page = 1
): Promise<NormalizedJob[]> {
  return empty();
}

export async function fetchFromCoresignal(
  _query: string,
  _countryCode = 'IN',
  _page = 1,
  _options?: Record<string, unknown>
): Promise<NormalizedJob[]> {
  return empty();
}

export async function checkCoresignalHealth(): Promise<{
  healthy: boolean;
  message: string;
}> {
  return { healthy: false, message: 'External job providers disabled' };
}

export async function checkJobProvidersHealth(): Promise<JobProvidersHealth> {
  const detail: JobProviderHealthDetail = {
    status: DISABLED,
    message: 'External job providers have been removed from this deployment',
    jobsFound: 0,
  };

  return {
    adzuna: false,
    indeed: false,
    ziprecruiter: false,
    coresignal: false,
    details: {
      adzuna: detail,
      indeed: detail,
      ziprecruiter: detail,
      coresignal: detail,
      jsearch: detail,
      jooble: detail,
      google_jobs: detail,
      reed: detail,
    },
  };
}

/** Fetch from all registered external providers (all noop). */
export async function fetchAllExternalJobs(
  _query: string,
  _options?: { country?: string; location?: string; page?: number }
): Promise<NormalizedJob[]> {
  return empty();
}
