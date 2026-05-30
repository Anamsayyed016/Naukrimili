/**
 * Resolve external jobs that appear in listings but are not yet in the database.
 * External APIs do not expose get-by-id; we scan provider feeds and match sourceId.
 */
import type { NormalizedJob } from './types';
import type { ExtCompositeId } from './resolve-job-lookup';
import { fetchFromAdzuna, fetchFromJooble, fetchFromSerpApi, fetchFromUSAJobs } from './provider-registry';
import { fetchAdzunaJobById } from './fetchers/adzuna';
import { REGION_SYNC_CONFIG, SYNC_REGION_PRIORITY, type SyncRegion } from './region-sync-config';
import { upsertNormalizedJob } from './upsertJob';

const JOB_PROVIDERS = [
  'adzuna',
  'jooble',
  'serpapi',
  'usajobs',
  'jsearch',
] as const;

function normalizeSource(source?: string): string {
  return (source || 'external').toLowerCase();
}

/** True when a fetched row matches the listing / URL lookup id. */
export function externalJobMatchesLookup(
  job: NormalizedJob,
  source: string,
  sourceId: string
): boolean {
  const jobSource = normalizeSource(job.source);
  const expectedSource = normalizeSource(source);
  const expectedId = String(sourceId).trim();
  const jobSourceId = String(job.sourceId || '').trim();

  if (expectedSource !== 'external' && jobSource !== expectedSource) {
    return false;
  }

  if (jobSourceId === expectedId) return true;

  const prefixed = `${expectedSource}-${expectedId}`;
  if (jobSourceId === prefixed) return true;

  const strippedExpected = expectedId.replace(
    new RegExp(`^${expectedSource}-`, 'i'),
    ''
  );
  if (jobSourceId === strippedExpected) return true;

  const expectedNumeric = expectedId.match(/(\d{5,})$/)?.[1];
  const jobNumeric = jobSourceId.match(/(\d{5,})$/)?.[1];
  if (expectedNumeric && jobNumeric && expectedNumeric === jobNumeric) {
    return expectedSource === 'external' || jobSource === expectedSource;
  }

  return false;
}

async function fetchProviderPage(
  source: string,
  region: SyncRegion,
  page: number
): Promise<NormalizedJob[]> {
  const cfg = REGION_SYNC_CONFIG[region];
  const query = 'engineer OR developer OR manager';

  switch (source) {
    case 'adzuna':
      if (!cfg.enableAdzuna || !cfg.adzunaCode) return [];
      return fetchFromAdzuna(query, cfg.adzunaCode, page);
    case 'jooble':
      if (!cfg.enableJooble) return [];
      return fetchFromJooble(query, cfg.joobleLocation || cfg.serpLocation, page, {
        countryCode: cfg.code,
      });
    case 'serpapi':
      if (!cfg.enableSerpApi) return [];
      return fetchFromSerpApi(query, cfg.serpLocation, cfg.code, page);
    case 'usajobs':
      if (!cfg.enableUSAJobs || region !== 'US') return [];
      return fetchFromUSAJobs(query, page);
    default:
      return [];
  }
}

function regionsForLookup(countryHint?: string): SyncRegion[] {
  const hint = countryHint?.toUpperCase().slice(0, 2);
  if (hint && SYNC_REGION_PRIORITY.includes(hint as SyncRegion)) {
    return [hint as SyncRegion, ...SYNC_REGION_PRIORITY.filter((r) => r !== hint)];
  }
  return [...SYNC_REGION_PRIORITY];
}

/**
 * Scan configured providers for a job matching source + sourceId (IN, US, GB, AE).
 */
export async function fetchExternalJobByLookup(
  lookup: ExtCompositeId,
  options?: { countryHint?: string; maxPages?: number }
): Promise<NormalizedJob | null> {
  const source = normalizeSource(lookup.source);
  const sourceId = String(lookup.sourceId).trim();
  if (!sourceId) return null;

  if (source === 'adzuna') {
    const direct = await fetchAdzunaJobById(sourceId, options?.countryHint, {
      maxPages: options?.maxPages ?? 1,
      maxCountries: 2,
    });
    if (direct) return direct;
    // Adzuna has no get-by-id API; generic search scan already ran — skip duplicate pages
    return null;
  }

  const providers =
    source === 'external' ? [...JOB_PROVIDERS] : [source as (typeof JOB_PROVIDERS)[number]];
  const regions = regionsForLookup(options?.countryHint);
  const maxPages = options?.maxPages ?? 2;

  for (const provider of providers) {
    for (const region of regions) {
      for (let page = 1; page <= maxPages; page++) {
        try {
          const jobs = await fetchProviderPage(provider, region, page);
          const match = jobs.find((job) =>
            externalJobMatchesLookup(job, source, sourceId)
          );
          if (match) return match;
        } catch {
          // try next page/region
        }
      }
    }
  }

  return null;
}

/** Try every provider when only a numeric sourceId is known. */
export async function fetchExternalJobBySourceId(
  sourceId: string,
  options?: { countryHint?: string; preferredSource?: string }
): Promise<NormalizedJob | null> {
  const id = String(sourceId).trim();
  if (!id) return null;

  if (options?.preferredSource) {
    const preferred = await fetchExternalJobByLookup(
      { source: options.preferredSource, sourceId: id },
      options
    );
    if (preferred) return preferred;
  }

  for (const provider of JOB_PROVIDERS) {
    const match = await fetchExternalJobByLookup(
      { source: provider, sourceId: id },
      { ...options, maxPages: 1 }
    );
    if (match) return match;
  }

  return null;
}

/** Fetch from providers, persist to DB, return stored row (or null). */
export async function resolveAndPersistExternalJob(
  lookup: ExtCompositeId | { source?: string; sourceId: string },
  options?: { countryHint?: string; maxPages?: number }
) {
  const source = normalizeSource(lookup.source);
  const sourceId = String(lookup.sourceId).trim();
  if (!sourceId) return null;

  const extLookup: ExtCompositeId =
    source === 'external'
      ? { source: 'external', sourceId }
      : { source, sourceId };

  let normalized =
    source === 'external'
      ? await fetchExternalJobBySourceId(sourceId, options)
      : await fetchExternalJobByLookup(extLookup, options);

  if (!normalized) return null;

  const persisted = await upsertNormalizedJob(normalized);
  return persisted ?? normalized;
}
