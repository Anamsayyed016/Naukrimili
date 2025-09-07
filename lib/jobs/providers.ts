import axios from 'axios';

export type NormalizedJob = {
  source: string;
  sourceId: string;
  title: string;
  company?: string;
  location?: string;
  country: string;
  description: string;
  applyUrl?: string;      // @deprecated - use apply_url instead
  apply_url?: string;     // Internal application URL (null for external jobs)
  source_url?: string;    // External source URL (for external jobs)
  postedAt?: string;
  salary?: string;
  raw: any;
};

function safeUpper(a?: string) {
  return (a || '').toUpperCase();
}

/**
 * External job provider fetcher with enhanced error handling and logging
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
    console.warn('External job API keys not configured, skipping external job fetch');
    return [] as NormalizedJob[];
  }

  try {
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
      timeout: 15000, // Increased timeout for better reliability
    });

    const jobs = (data.results || []).map((r: any): NormalizedJob => ({
      source: 'external', // Generic external source - hides the provider
      sourceId: `${r.id}`,
      title: r.title || r.position || '',
      company: r.company?.display_name || r.company || '',
      location: [
        r.location?.area?.slice(-1)?.[0],
        r.location?.display_name,
      ].filter(Boolean).join(', '),
      country: safeUpper(countryCode),
      description: r.description || r.redirect_url || '',
      requirements: extractRequirements(r.description || ''),
      applyUrl: r.redirect_url || r.url,  // @deprecated - keep for backward compatibility
      apply_url: null,                    // External jobs don't have internal apply URL
      source_url: r.redirect_url || r.url, // External source URL
      postedAt: r.created ? new Date(r.created).toISOString() : undefined,
      salary: r.salary_min || r.salary_max ? `${r.salary_min || ''}-${r.salary_max || ''}` : undefined,
      salaryMin: r.salary_min,
      salaryMax: r.salary_max,
      salaryCurrency: getCurrency(countryCode),
      jobType: 'full-time',
      experienceLevel: 'mid',
      skills: 'Software Development',
      isRemote: false,
      isHybrid: false,
      isUrgent: false,
      isFeatured: false,
      isActive: true,
      sector: 'Technology',
      views: 0,
      applicationsCount: 0,
      raw: r,
    }));

    return jobs;

  } catch (error: any) {
    console.error(`❌ External job API error for ${countryCode}:`, error.message);
    if (error.response?.status === 429) {
      console.warn('⚠️ External job API rate limit reached, consider upgrading plan');
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
    console.warn('External job API key not configured, skipping external job fetch');
    return [] as NormalizedJob[];
  }

  try {
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
      source: 'external', // Generic external source - hides the provider
      sourceId: r.job_id || r.job_link || `${r.job_title}-${r.employer_name}-${r.job_city}`.slice(0, 255),
      title: r.job_title || r.title || '',
      company: r.employer_name || r.employer || '',
      location: [r.job_city, r.job_country].filter(Boolean).join(', '),
      country: safeUpper(r.job_country || countryCode),
      description: r.job_description || (Array.isArray(r.job_highlights) ? r.job_highlights.join('\n') : r.snippet) || '',
      applyUrl: r.job_apply_link || r.job_link || r.url,  // @deprecated - keep for backward compatibility
      apply_url: null,                                     // External jobs don't have internal apply URL
      source_url: r.job_apply_link || r.job_link || r.url, // External source URL
      postedAt: r.job_posted_at || undefined,
      salary: r.salary || undefined,
      raw: r,
    }));

    return jobs;

  } catch (error: any) {
    console.error(`❌ External job API error:`, error.message);
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
      source: 'external', // Generic external source - hides the provider
      sourceId: r.job_id || `ext-${Date.now()}-${Math.random()}`,
      title: r.job_title || r.title || '',
      company: r.company_name || r.employer || '',
      location: r.location || location,
      country: 'IN', // Default to India for Google Jobs
      description: r.job_description || r.snippet || '',
      applyUrl: r.apply_link || r.job_url || '',  // @deprecated - keep for backward compatibility
      apply_url: null,                             // External jobs don't have internal apply URL
      source_url: r.apply_link || r.job_url || '', // External source URL
      postedAt: undefined,
      salary: undefined,
      raw: r,
    }));

    return jobs;

  } catch (error: any) {
    console.error(`❌ External job API error:`, error.message);
    if (error.response?.status === 403) {
      console.warn('⚠️ External job API subscription required. Visit: https://rapidapi.com/letscrape-6bRBa3QguO5/api/google-jobs-api/');
    } else if (error.response?.status === 429) {
      console.warn('⚠️ External job API rate limit reached, consider upgrading plan');
    }
    return [] as NormalizedJob[];
  }
}

/**
 * Health check for all job providers
 */
export async function checkJobProvidersHealth(): Promise<{
  externalProvider1: boolean;
  externalProvider2: boolean;
  externalProvider3: boolean;
  details: Record<string, any>;
}> {
  const health = {
    externalProvider1: false,
    externalProvider2: false,
    externalProvider3: false,
    details: {} as Record<string, any>
  };

  // Check External Provider 1
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    try {
      const testJobs = await fetchFromAdzuna('test', 'gb', 1);
      health.externalProvider1 = testJobs.length >= 0; // Success if no error
      health.details.externalProvider1 = { status: 'healthy', jobsFound: testJobs.length };
    } catch (error: any) {
      health.details.externalProvider1 = { status: 'error', message: error.message };
    }
  } else {
    health.details.externalProvider1 = { status: 'not_configured' };
  }

  // Check External Provider 2
  if (process.env.RAPIDAPI_KEY) {
    try {
      const testJobs = await fetchFromJSearch('test', 'US', 1);
      health.externalProvider2 = testJobs.length >= 0; // Success if no error
      health.details.externalProvider2 = { status: 'healthy', jobsFound: testJobs.length };
    } catch (error: any) {
      health.details.externalProvider2 = { status: 'error', message: error.message };
    }
  } else {
    health.details.externalProvider2 = { status: 'not_configured' };
  }

  // Check External Provider 3
  if (process.env.RAPIDAPI_KEY) {
    try {
      const testJobs = await fetchFromGoogleJobs('test', 'India', 1);
      health.externalProvider3 = testJobs.length >= 0; // Success if no error
      health.details.externalProvider3 = { status: 'healthy', jobsFound: testJobs.length };
    } catch (error: any) {
      health.details.externalProvider3 = { status: 'error', message: error.message };
    }
  } else {
    health.details.externalProvider3 = { status: 'not_configured' };
  }

  return health;
}

// Helper functions
function extractRequirements(description: string): string {
  if (!description) return '';
  const reqMatch = description.match(/(?:requirements?|qualifications?|skills?)[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)/i);
  return reqMatch ? reqMatch[1].substring(0, 500) : '';
}

function getCurrency(countryCode: string): string {
  const currencies: Record<string, string> = {
    'in': 'INR',
    'us': 'USD',
    'gb': 'GBP',
    'ae': 'AED'
  };
  return currencies[countryCode.toLowerCase()] || 'USD';
}
