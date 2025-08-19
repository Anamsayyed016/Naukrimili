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
 * Adzuna fetcher with enhanced error handling and logging
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
  
  if (!app_id || !app_key) {
    console.warn('Adzuna API keys not configured, skipping Adzuna job fetch');
    return [] as NormalizedJob[];
  }

  try {
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/${page}`;
    // // console.log(`🔍 Fetching from Adzuna: ${countryCode.toUpperCase()} - "${query}"`);
    
    const { data } = await axios.get(url, {
      params: {
        app_id,
        app_key,
        what: query,
        results_per_page: 20,
        ...(options?.location ? { where: options.location } : {}),
        ...(options?.distanceKm ? { distance: options.distanceKm } : {}),
      },
      timeout: 15000, // Increased timeout for better reliability
    });

    const jobs = (data.results || []).map((r: any): NormalizedJob => ({
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

    // // console.log(`✅ Adzuna: Found ${jobs.length} jobs for "${query}" in ${countryCode.toUpperCase()}`);
    return jobs;

  } catch (error: any) {
    console.error(`❌ Adzuna API error for ${countryCode}:`, error.message);
    if (error.response?.status === 429) {
      console.warn('⚠️ Adzuna rate limit reached, consider upgrading plan');
    }
    return [] as NormalizedJob[];
  }
}

/**
 * JSearch (RapidAPI) fetcher with enhanced error handling
 * Note: JSearch sometimes returns different fields; adapt as needed.
 */
export async function fetchFromJSearch(query: string, countryCode = 'US', page = 1) {
  const key = process.env.RAPIDAPI_KEY;
  
  if (!key) {
    console.warn('RapidAPI key not configured, skipping JSearch job fetch');
    return [] as NormalizedJob[];
  }

  try {
    // // console.log(`🔍 Fetching from JSearch: ${countryCode} - "${query}"`);
    
    const { data } = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: { 
        query: `${query} jobs ${countryCode}`,
        page,
        num_pages: 1,
        country: countryCode
      },
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': key,
      },
      timeout: 15000, // Increased timeout for better reliability
    });

    const jobs = (data?.data || []).map((r: any): NormalizedJob => ({
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

    // // console.log(`✅ JSearch: Found ${jobs.length} jobs for "${query}" in ${countryCode}`);
    return jobs;

  } catch (error: any) {
    console.error(`❌ JSearch API error:`, error.message);
    if (error.response?.status === 403) {
      console.warn('⚠️ JSearch API subscription required. Visit: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/');
    } else if (error.response?.status === 429) {
      console.warn('⚠️ JSearch rate limit reached, consider upgrading plan');
    }
    return [] as NormalizedJob[];
  }
}

/**
 * Google Jobs API fetcher (using RapidAPI)
 */
export async function fetchFromGoogleJobs(
  query: string,
  location: string = 'India',
  page = 1
) {
  const key = process.env.RAPIDAPI_KEY;
  
  if (!key) {
    console.warn('RapidAPI key not configured, skipping Google Jobs fetch');
    return [] as NormalizedJob[];
  }

  try {
    // // console.log(`🔍 Fetching from Google Jobs: "${query}" in ${location}`);
    
    const { data } = await axios.get('https://google-jobs-api.p.rapidapi.com/google-jobs/job-type', {
      params: {
        jobType: 'Full-time',
        include: query,
        location: location,
        page: page
      },
      headers: {
        'x-rapidapi-host': 'google-jobs-api.p.rapidapi.com',
        'x-rapidapi-key': key,
      },
      timeout: 15000,
    });

    const jobs = (data?.data || []).map((r: any): NormalizedJob => ({
      source: 'google-jobs',
      sourceId: r.job_id || `google-${Date.now()}-${Math.random()}`,
      title: r.job_title || r.title || '',
      company: r.company_name || r.employer || '',
      location: r.location || location,
      country: 'IN', // Default to India for Google Jobs
      description: r.job_description || r.snippet || '',
      applyUrl: r.apply_link || r.job_url || '',
      postedAt: r.posted_date || undefined,
      salary: r.salary || undefined,
      raw: r,
    }));

    // // console.log(`✅ Google Jobs: Found ${jobs.length} jobs for "${query}" in ${location}`);
    return jobs;

  } catch (error: any) {
    console.error(`❌ Google Jobs API error:`, error.message);
    if (error.response?.status === 403) {
      console.warn('⚠️ Google Jobs API subscription required. Visit: https://rapidapi.com/letscrape-6bRBa3QguO5/api/google-jobs-api/');
    } else if (error.response?.status === 429) {
      console.warn('⚠️ Google Jobs rate limit reached, consider upgrading plan');
    }
    return [] as NormalizedJob[];
  }
}

/**
 * Health check for all job providers
 */
export async function checkJobProvidersHealth(): Promise<{
  adzuna: boolean;
  jsearch: boolean;
  googleJobs: boolean;
  details: Record<string, any>;
}> {
  const health = {
    adzuna: false,
    jsearch: false,
    googleJobs: false,
    details: {} as Record<string, any>
  };

  // Check Adzuna
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    try {
      const testJobs = await fetchFromAdzuna('test', 'gb', 1);
      health.adzuna = testJobs.length >= 0; // Success if no error
      health.details.adzuna = { status: 'healthy', jobsFound: testJobs.length };
    } catch (error: any) {
      health.details.adzuna = { status: 'error', message: error.message };
    }
  } else {
    health.details.adzuna = { status: 'not_configured' };
  }

  // Check JSearch
  if (process.env.RAPIDAPI_KEY) {
    try {
      const testJobs = await fetchFromJSearch('test', 'US', 1);
      health.jsearch = testJobs.length >= 0; // Success if no error
      health.details.jsearch = { status: 'healthy', jobsFound: testJobs.length };
    } catch (error: any) {
      health.details.jsearch = { status: 'error', message: error.message };
    }
  } else {
    health.details.jsearch = { status: 'not_configured' };
  }

  // Check Google Jobs
  if (process.env.RAPIDAPI_KEY) {
    try {
      const testJobs = await fetchFromGoogleJobs('test', 'India', 1);
      health.googleJobs = testJobs.length >= 0; // Success if no error
      health.details.googleJobs = { status: 'healthy', jobsFound: testJobs.length };
    } catch (error: any) {
      health.details.googleJobs = { status: 'error', message: error.message };
    }
  } else {
    health.details.googleJobs = { status: 'not_configured' };
  }

  return health;
}
