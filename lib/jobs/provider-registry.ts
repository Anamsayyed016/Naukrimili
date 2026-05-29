import type { NormalizedJob } from './types';
import { fetchFromAdzuna } from './fetchers/adzuna';
import { fetchFromJooble } from './fetchers/jooble';
import { fetchFromSerpApi } from './fetchers/serpapi';
import { fetchFromUSAJobs } from './fetchers/usajobs';
import { REGION_SYNC_CONFIG, SYNC_REGION_PRIORITY, type SyncRegion } from './region-sync-config';

export type JobProviderId =
  | 'adzuna'
  | 'jsearch'
  | 'google_jobs'
  | 'jooble'
  | 'indeed'
  | 'ziprecruiter'
  | 'reed'
  | 'coresignal'
  | 'serpapi'
  | 'usajobs';

export interface JobProviderHealthDetail {
  status: 'healthy' | 'not_configured' | 'error' | 'disabled';
  message?: string;
  jobsFound?: number;
}

export interface JobProvidersHealth {
  adzuna: boolean;
  indeed: boolean;
  ziprecruiter: boolean;
  coresignal: boolean;
  serpapi: boolean;
  jooble: boolean;
  usajobs: boolean;
  details: Record<string, JobProviderHealthDetail>;
}

const empty = (): Promise<NormalizedJob[]> => Promise.resolve([]);

export { fetchFromAdzuna, fetchFromJooble, fetchFromSerpApi, fetchFromUSAJobs };

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
  return { healthy: false, message: 'Coresignal provider not configured' };
}

async function probe(
  label: string,
  configured: boolean,
  fetcher: () => Promise<NormalizedJob[]>
): Promise<{ ok: boolean; detail: JobProviderHealthDetail }> {
  if (!configured) {
    return { ok: false, detail: { status: 'not_configured' } };
  }
  try {
    const jobs = await fetcher();
    return {
      ok: true,
      detail: { status: 'healthy', jobsFound: jobs.length },
    };
  } catch (error: unknown) {
    return {
      ok: false,
      detail: {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        jobsFound: 0,
      },
    };
  }
}

export async function checkJobProvidersHealth(): Promise<JobProvidersHealth> {
  const adzunaConfigured = Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  const joobleConfigured = Boolean(process.env.JOOBLE_API_KEY);
  const serpConfigured = Boolean(process.env.SERPAPI_KEY);
  const usajobsConfigured = Boolean(
    process.env.USAJOBS_API_KEY &&
      (process.env.USAJOBS_USER_AGENT || process.env.USAJOBS_EMAIL || process.env.ADMIN_EMAIL)
  );

  const [adzuna, jooble, serpapi, usajobs] = await Promise.all([
    probe('adzuna', adzunaConfigured, () => fetchFromAdzuna('developer', 'gb', 1)),
    probe('jooble', joobleConfigured, () =>
      fetchFromJooble('developer', 'United States', 1, { countryCode: 'US' })
    ),
    probe('serpapi', serpConfigured, () =>
      fetchFromSerpApi('developer', 'India', 'IN', 1)
    ),
    probe('usajobs', usajobsConfigured, () => fetchFromUSAJobs('software', 1)),
  ]);

  const disabled: JobProviderHealthDetail = {
    status: 'disabled',
    message: 'Provider not enabled in this deployment',
    jobsFound: 0,
  };

  return {
    adzuna: adzuna.ok,
    jooble: jooble.ok,
    serpapi: serpapi.ok,
    usajobs: usajobs.ok,
    indeed: false,
    ziprecruiter: false,
    coresignal: false,
    details: {
      adzuna: adzuna.detail,
      jooble: jooble.detail,
      serpapi: serpapi.detail,
      usajobs: usajobs.detail,
      indeed: disabled,
      ziprecruiter: disabled,
      jsearch: disabled,
      google_jobs: disabled,
      reed: disabled,
      coresignal: disabled,
    },
  };
}

/** Fetch jobs for one region using the configured provider matrix. */
export async function fetchJobsForRegion(
  query: string,
  region: SyncRegion,
  page = 1
): Promise<NormalizedJob[]> {
  const cfg = REGION_SYNC_CONFIG[region];
  const tasks: Promise<NormalizedJob[]>[] = [];

  if (cfg.enableAdzuna && cfg.adzunaCode) {
    tasks.push(fetchFromAdzuna(query, cfg.adzunaCode, page));
  }
  if (cfg.enableSerpApi) {
    tasks.push(fetchFromSerpApi(query, cfg.serpLocation, cfg.code, page));
  }
  if (cfg.enableJooble && cfg.joobleLocation) {
    tasks.push(
      fetchFromJooble(query, cfg.joobleLocation, page, { countryCode: cfg.code })
    );
  }
  if (cfg.enableUSAJobs && region === 'US') {
    tasks.push(fetchFromUSAJobs(query, page));
  }

  const batches = await Promise.allSettled(tasks);
  const jobs: NormalizedJob[] = [];
  for (const batch of batches) {
    if (batch.status === 'fulfilled') jobs.push(...batch.value);
  }
  return jobs;
}

/** Fetch from all active regions (priority order). */
export async function fetchAllExternalJobs(
  query: string,
  options?: { country?: string; location?: string; page?: number; regions?: SyncRegion[] }
): Promise<NormalizedJob[]> {
  const page = options?.page ?? 1;
  const regions =
    options?.regions ||
    (options?.country
      ? ([options.country.toUpperCase()] as SyncRegion[]).filter((r) => r in REGION_SYNC_CONFIG)
      : SYNC_REGION_PRIORITY);

  const validRegions = regions.filter((r): r is SyncRegion => r in REGION_SYNC_CONFIG);
  const results = await Promise.allSettled(
    validRegions.map((region) => fetchJobsForRegion(query, region, page))
  );

  const jobs: NormalizedJob[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') jobs.push(...result.value);
  }

  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.source}-${job.sourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
