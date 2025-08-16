import axios from 'axios';

export type NormalizedJob = {
  source: string;
  sourceId: string;
  title: string;
  company?: string;
  location?: string;
  country: string;
  description: string;
  applyUrl?: string;
  postedAt?: string;
  salary?: string;
  raw: any;
};

function safeUpper(a?: string) {
  return (a || '').toUpperCase();
}

/**
 * Adzuna fetcher
 * countryCode like 'gb','in','us','ae'
 */
export async function fetchFromAdzuna(
  query: string,
  countryCode = 'gb',
  page = 1,
  options?: { location?: string; distanceKm?: number }
) {
  const app_id = process.env.ADZUNA_APP_ID;
  const app_key = process.env.ADZUNA_APP_KEY;
  if (!app_id || !app_key) return [] as NormalizedJob[];

  const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`;
  const { data } = await axios.get(url, {
    params: {
      app_id,
      app_key,
      what: query,
      results_per_page: 20,
      ...(options?.location ? { where: options.location } : {}),
      ...(options?.distanceKm ? { distance: options.distanceKm } : {}),
    },
    timeout: 10000,
  });

  return (data.results || []).map((r: any): NormalizedJob => ({
    source: 'adzuna',
    sourceId: `${r.id}`,
    title: r.title || r.position || '',
    company: r.company?.display_name || r.company || '',
    location: [
      r.location?.area?.slice(-1)?.[0],
      r.location?.display_name,
    ].filter(Boolean).join(', '),
    country: safeUpper(countryCode),
    description: r.description || r.redirect_url || '',
    applyUrl: r.redirect_url || r.url,
    postedAt: r.created ? new Date(r.created).toISOString() : undefined,
    salary: r.salary_min || r.salary_max ? `${r.salary_min || ''}-${r.salary_max || ''}` : undefined,
    raw: r,
  }));
}

/**
 * JSearch (RapidAPI) fetcher
 * Note: JSearch sometimes returns different fields; adapt as needed.
 */
export async function fetchFromJSearch(query: string, countryCode = 'US', page = 1) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) return [] as NormalizedJob[];

  const { data } = await axios.get('https://jsearch.p.rapidapi.com/search', {
    params: { query, page },
    headers: {
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      'x-rapidapi-key': key,
    },
    timeout: 10000,
  });

  return (data?.data || []).map((r: any): NormalizedJob => ({
    source: 'jsearch',
    sourceId: r.job_id || r.job_link || `${r.job_title}-${r.employer_name}-${r.job_city}`.slice(0, 255),
    title: r.job_title || r.title || '',
    company: r.employer_name || r.employer || '',
    location: [r.job_city, r.job_country].filter(Boolean).join(', '),
    country: safeUpper(r.job_country || countryCode),
    description: r.job_description || (Array.isArray(r.job_highlights) ? r.job_highlights.join('\n') : r.snippet) || '',
    applyUrl: r.job_apply_link || r.job_link || r.url,
    postedAt: r.job_posted_at || undefined,
    salary: r.salary || undefined,
    raw: r,
  }));
}
