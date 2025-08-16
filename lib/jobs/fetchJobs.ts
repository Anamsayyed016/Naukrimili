import { fetchFromAdzuna, fetchFromJSearch, NormalizedJob } from '@/lib/jobs/providers';
import { upsertNormalizedJobs } from '@/lib/jobs/upsertJob';
import GoogleSearchService from '@/lib/google-search-service';

type FetchOptions = {
  query: string;
  location?: string;
  radiusKm?: number;
  countryCode?: string; // e.g., 'IN', 'US'
  page?: number;
};

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) continue;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('fetch failed');
}

function normalizeKey(job: Pick<NormalizedJob, 'title' | 'company' | 'location'>): string {
  const clean = (s?: string) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  return `${clean(job.title)}|${clean(job.company)}|${clean(job.location)}`;
}

export async function fetchJobsAndUpsert(options: FetchOptions) {
  const query = options.query;
  const location = options.location || '';
  const radiusKm = options.radiusKm ?? 25;
  const page = options.page ?? 1;
  const adzunaCountry = (options.countryCode || 'IN').toLowerCase();
  const jsearchCountry = (options.countryCode || 'IN').toUpperCase();

  const all: NormalizedJob[] = [];

  // Adzuna
  try {
    const adz = await withRetry(() => fetchFromAdzuna(query, adzunaCountry, page, {
      location: location || undefined,
      distanceKm: radiusKm,
    }));
    all.push(...adz);
  } catch (e: any) {
    console.error('Adzuna fetch failed:', e?.message || e);
  }

  // JSearch
  try {
    const js = await withRetry(() => fetchFromJSearch(`${query}${location ? ` in ${location}` : ''}`, jsearchCountry, page));
    all.push(...js);
  } catch (e: any) {
    console.error('JSearch fetch failed:', e?.message || e);
  }

  // Fallback: Google Jobs (no direct items, only redirect URL)
  if (all.length === 0) {
    try {
      const googleSearch = new GoogleSearchService();
      const fallback = await googleSearch.searchGoogleJobs({ query, location: location || 'India' });
      if (fallback.success && fallback.searchUrl) {
        all.push({
          source: 'google',
          sourceId: `google-${Date.now()}`,
          title: 'Redirect to Google Jobs',
          company: 'Google',
          location: location || 'India',
          country: (options.countryCode || 'IN').toUpperCase(),
          description: 'No jobs found from providers. Use Google Jobs link provided.',
          applyUrl: fallback.searchUrl,
          postedAt: new Date().toISOString(),
          raw: { fallback },
        });
      }
    } catch (e: any) {
      console.error('Google fallback failed:', e?.message || e);
    }
  }

  // Skip malformed jobs (missing title/company)
  const filtered = all.filter(j => (j.title || '').trim() && (j.company || '').trim());

  // Deduplicate: first by source+sourceId, then by normalized title+company+location
  const bySource: Map<string, NormalizedJob> = new Map();
  for (const j of filtered) {
    const key = `${j.source}-${j.sourceId}`;
    if (!bySource.has(key)) bySource.set(key, j);
  }
  const bySemantic: Map<string, NormalizedJob> = new Map();
  for (const j of bySource.values()) {
    const key = normalizeKey(j);
    if (!bySemantic.has(key)) bySemantic.set(key, j);
  }

  const unique = Array.from(bySemantic.values());
  const persisted = await upsertNormalizedJobs(unique);

  return { fetched: filtered.length, unique: unique.length, persisted: persisted.length, jobs: unique };
}

export default fetchJobsAndUpsert;

// Simple wrapper for compatibility with existing imports
export async function fetchJobs(query: string, location?: string, radius: string = '25km') {
  const radiusKm = parseInt(String(radius).replace(/[^0-9]/g, ''), 10) || 25;
  const { jobs } = await fetchJobsAndUpsert({ query, location, radiusKm, countryCode: 'IN', page: 1 });
  return jobs;
}


