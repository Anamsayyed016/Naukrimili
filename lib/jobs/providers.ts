import axios from 'axios';
import { SkillsExtractionService } from '@/lib/services/skills-extraction';

export type NormalizedJob = {
  source: string;
  sourceId: string;
  title: string;
  company?: string;
  location?: string;
  country: string;
  description: string;
  requirements?: string;
  applyUrl?: string;      // @deprecated - use apply_url instead
  apply_url?: string;     // Internal application URL (null for external jobs)
  source_url?: string;    // External source URL (for external jobs)
  postedAt?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[];
  isRemote?: boolean;
  isHybrid?: boolean;
  isUrgent?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  sector?: string;
  views?: number;
  applicationsCount?: number;
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
      apply_url: null, // External jobs redirect to source                    // External jobs don't have internal apply URL
      source_url: r.redirect_url || r.url || r.apply_url || r.link, // External source URL
      postedAt: r.created ? new Date(r.created).toISOString() : undefined,
      salary: r.salary_min || r.salary_max ? `${r.salary_min || ''}-${r.salary_max || ''}` : undefined,
      salaryMin: r.salary_min,
      salaryMax: r.salary_max,
      salaryCurrency: getCurrency(countryCode),
      jobType: 'full-time',
      experienceLevel: 'mid',
      skills: SkillsExtractionService.extractSkills(r.description || '', r.title || '', r.company?.display_name || r.company || '').map(s => s.skill),
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
      apply_url: null, // External jobs redirect to source                                     // External jobs don't have internal apply URL
      source_url: r.job_apply_link || r.job_link || r.url, // External source URL
      postedAt: r.job_posted_at || undefined,
      salary: r.salary || undefined,
      skills: SkillsExtractionService.extractSkills(r.job_description || (Array.isArray(r.job_highlights) ? r.job_highlights.join('\n') : r.snippet) || '', r.job_title || r.title || '', r.employer_name || r.employer || '').map(s => s.skill),
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
      apply_url: null, // External jobs redirect to source                             // External jobs don't have internal apply URL
      source_url: r.apply_link || r.job_url || '', // External source URL
      postedAt: undefined,
      salary: undefined,
      skills: SkillsExtractionService.extractSkills(r.job_description || r.snippet || '', r.job_title || r.title || '', r.company_name || r.employer || '').map(s => s.skill),
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
 * Jooble REST API fetcher for real jobs
 * API Documentation: https://help.jooble.org/en/support/solutions/articles/60001448238-rest-api-documentation
 */
export async function fetchFromJooble(
  query: string,
  location: string = 'India',
  page = 1,
  options?: { radius?: number; salary?: string; countryCode?: string }
) {
  const apiKey = process.env.JOOBLE_API_KEY;
  
  if (!apiKey) {
    console.warn('Jooble API key not configured, skipping Jooble fetch');
    return [] as NormalizedJob[];
  }

  try {
    const url = `https://jooble.org/api/${apiKey}`;
    
    const requestBody: any = {
      keywords: query || 'software engineer',
      location: location || 'India',
      page: page.toString(),
      ResultOnPage: '20',
      SearchMode: '1', // 1 = Job search mode
      companysearch: 'false'
    };

    // Add optional parameters
    if (options?.radius) {
      requestBody.radius = options.radius.toString();
    }
    if (options?.salary) {
      requestBody.salary = options.salary;
    }

    const { data } = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    console.log(`🔍 Jooble API response status: ${data.status || 'success'}, jobs found: ${data.jobs?.length || 0}`);

    const jobs = (data.jobs || []).map((r: any): NormalizedJob => ({
      source: 'jooble',
      sourceId: r.id || `jooble-${Date.now()}-${Math.random()}`,
      title: r.title || '',
      company: r.company || '',
      location: r.location || location,
      country: safeUpper(options?.countryCode || 'IN'),
      description: r.snippet || r.description || '',
      requirements: extractRequirements(r.snippet || r.description || ''),
      applyUrl: r.link || '',  // @deprecated - keep for backward compatibility
      apply_url: null, // External jobs redirect to source         // External jobs don't have internal apply URL
      source_url: r.link || '', // External source URL
      postedAt: r.updated ? new Date(r.updated).toISOString() : undefined,
      salary: r.salary || undefined,
      salaryMin: extractSalaryMin(r.salary),
      salaryMax: extractSalaryMax(r.salary),
      salaryCurrency: getCurrency(options?.countryCode || 'in'),
      jobType: mapJobType(r.type),
      experienceLevel: extractExperienceLevel(r.title || '', r.snippet || ''),
      skills: SkillsExtractionService.extractSkills(
        r.snippet || r.description || '', 
        r.title || '', 
        r.company || ''
      ).map(s => s.skill),
      isRemote: checkIfRemote(r.title || '', r.snippet || '', r.location || ''),
      isHybrid: checkIfHybrid(r.title || '', r.snippet || ''),
      isUrgent: checkIfUrgent(r.title || '', r.snippet || ''),
      isFeatured: false,
      isActive: true,
      sector: 'Technology',
      views: 0,
      applicationsCount: 0,
      raw: r,
    }));

    console.log(`✅ Jooble: Found ${jobs.length} jobs for "${query}" in "${location}"`);
    return jobs;

  } catch (error: any) {
    console.error(`❌ Jooble API error:`, error.message);
    if (error.response?.status === 401) {
      console.warn('⚠️ Jooble API key invalid or expired');
    } else if (error.response?.status === 429) {
      console.warn('⚠️ Jooble API rate limit reached');
    } else if (error.response?.status === 400) {
      console.warn('⚠️ Jooble API request parameters invalid');
    }
    return [] as NormalizedJob[];
  }
}

/**
 * Indeed Jobs API fetcher (using RapidAPI)
 * High-quality job listings from Indeed
 */
export async function fetchFromIndeed(
  query: string,
  location: string = 'India',
  page: number = 1
) {
  const key = process.env.RAPIDAPI_KEY;
  
  if (!key) {
    console.warn('RapidAPI key not configured, skipping Indeed fetch');
    return [] as NormalizedJob[];
  }

  try {
    const { data } = await axios.get('https://indeed11.p.rapidapi.com/', {
      params: {
        query: query,
        location: location,
        page: page,
        limit: 20
      },
      headers: {
        'x-rapidapi-host': 'indeed11.p.rapidapi.com',
        'x-rapidapi-key': key,
      },
      timeout: 15000,
    });

    const jobs = (data?.data || []).map((r: any): NormalizedJob => ({
      source: 'external', // Generic external source - hides the provider
      sourceId: r.jobId || `indeed-${Date.now()}-${Math.random()}`,
      title: r.jobTitle || r.title || '',
      company: r.companyName || r.company || '',
      location: r.jobLocation || r.location || location,
      country: 'IN', // Default to India for Indeed
      description: r.jobDescription || r.description || '',
      applyUrl: r.jobUrl || r.applyUrl || '',  // @deprecated - keep for backward compatibility
      apply_url: null,                             // External jobs don't have internal apply URL
      source_url: r.jobUrl || r.applyUrl || '', // External source URL
      postedAt: r.postedAt || undefined,
      salary: r.salary || undefined,
      skills: SkillsExtractionService.extractSkills(r.jobDescription || r.description || '', r.jobTitle || r.title || '', r.companyName || r.company || '').map(s => s.skill),
      raw: r,
    }));

    return jobs;

  } catch (error: any) {
    console.error(`❌ Indeed API error:`, error.message);
    if (error.response?.status === 403) {
      console.warn('⚠️ Indeed API subscription required. Visit: https://rapidapi.com/letscrape-6bRBa3QguO5/api/indeed11/');
    } else if (error.response?.status === 429) {
      console.warn('⚠️ Indeed API rate limit reached, consider upgrading plan');
    }
    return [] as NormalizedJob[];
  }
}

/**
 * ZipRecruiter Jobs API fetcher (using RapidAPI)
 * High-quality job listings from ZipRecruiter
 */
export async function fetchFromZipRecruiter(
  query: string,
  location: string = 'India',
  page: number = 1
) {
  const key = process.env.RAPIDAPI_KEY;
  
  if (!key) {
    console.warn('RapidAPI key not configured, skipping ZipRecruiter fetch');
    return [] as NormalizedJob[];
  }

  try {
    const { data } = await axios.get('https://ziprecruiter1.p.rapidapi.com/', {
      params: {
        search_terms: query,
        location: location,
        page: page,
        jobs_per_page: 20
      },
      headers: {
        'x-rapidapi-host': 'ziprecruiter1.p.rapidapi.com',
        'x-rapidapi-key': key,
      },
      timeout: 15000,
    });

    const jobs = (data?.jobs || []).map((r: any): NormalizedJob => ({
      source: 'external', // Generic external source - hides the provider
      sourceId: r.id || `ziprecruiter-${Date.now()}-${Math.random()}`,
      title: r.name || r.title || '',
      company: r.hiring_company?.name || r.company || '',
      location: r.location || location,
      country: 'IN', // Default to India for ZipRecruiter
      description: r.snippet || r.description || '',
      applyUrl: r.url || r.applyUrl || '',  // @deprecated - keep for backward compatibility
      apply_url: null,                             // External jobs don't have internal apply URL
      source_url: r.url || r.applyUrl || '', // External source URL
      postedAt: r.posted_time || undefined,
      salary: r.salary_min || r.salary_max ? `${r.salary_min || ''}-${r.salary_max || ''}` : undefined,
      salaryMin: r.salary_min,
      salaryMax: r.salary_max,
      salaryCurrency: 'INR',
      skills: SkillsExtractionService.extractSkills(r.snippet || r.description || '', r.name || r.title || '', r.hiring_company?.name || r.company || '').map(s => s.skill),
      raw: r,
    }));

    return jobs;

  } catch (error: any) {
    console.error(`❌ ZipRecruiter API error:`, error.message);
    if (error.response?.status === 403) {
      console.warn('⚠️ ZipRecruiter API subscription required. Visit: https://rapidapi.com/letscrape-6bRBa3QguO5/api/ziprecruiter1/');
    } else if (error.response?.status === 429) {
      console.warn('⚠️ ZipRecruiter API rate limit reached, consider upgrading plan');
    }
    return [] as NormalizedJob[];
  }
}

/**
 * Health check for working job providers
 */
export async function checkJobProvidersHealth(): Promise<{
  adzuna: boolean;
  indeed: boolean;
  ziprecruiter: boolean;
  details: Record<string, any>;
}> {
  const health = {
    adzuna: false,
    indeed: false,
    ziprecruiter: false,
    details: {} as Record<string, any>
  };

  // Check Adzuna Provider
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

  // Check Indeed Provider
  if (process.env.RAPIDAPI_KEY) {
    try {
      const testJobs = await fetchFromIndeed('test', 'India', 1);
      health.indeed = testJobs.length >= 0; // Success if no error
      health.details.indeed = { status: 'healthy', jobsFound: testJobs.length };
    } catch (error: any) {
      health.details.indeed = { status: 'error', message: error.message };
    }
  } else {
    health.details.indeed = { status: 'not_configured' };
  }

  // Check ZipRecruiter Provider
  if (process.env.RAPIDAPI_KEY) {
    try {
      const testJobs = await fetchFromZipRecruiter('test', 'India', 1);
      health.ziprecruiter = testJobs.length >= 0; // Success if no error
      health.details.ziprecruiter = { status: 'healthy', jobsFound: testJobs.length };
    } catch (error: any) {
      health.details.ziprecruiter = { status: 'error', message: error.message };
    }
  } else {
    health.details.ziprecruiter = { status: 'not_configured' };
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

// Jooble-specific helper functions
function extractSalaryMin(salary: string): number | undefined {
  if (!salary) return undefined;
  const match = salary.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : undefined;
}

function extractSalaryMax(salary: string): number | undefined {
  if (!salary) return undefined;
  const matches = salary.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
  if (matches && matches.length > 1) {
    return parseFloat(matches[1].replace(/,/g, ''));
  }
  return undefined;
}

function mapJobType(type: string): string {
  const typeMap: Record<string, string> = {
    'full-time': 'full-time',
    'full time': 'full-time',
    'part-time': 'part-time',
    'part time': 'part-time',
    'contract': 'contract',
    'temporary': 'temporary',
    'internship': 'internship',
    'freelance': 'freelance',
    'remote': 'full-time',
    'hybrid': 'full-time'
  };
  return typeMap[type?.toLowerCase() || ''] || 'full-time';
}

function extractExperienceLevel(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('5+') || text.includes('10+')) {
    return 'senior';
  }
  if (text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('0-2') || text.includes('1-3')) {
    return 'junior';
  }
  if (text.includes('mid') || text.includes('intermediate') || text.includes('3-5') || text.includes('2-4')) {
    return 'mid';
  }
  
  return 'mid'; // Default
}

function checkIfRemote(title: string, description: string, location: string): boolean {
  const text = `${title} ${description} ${location}`.toLowerCase();
  return text.includes('remote') || text.includes('work from home') || text.includes('wfh') || location.toLowerCase().includes('remote');
}

function checkIfHybrid(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return text.includes('hybrid') || text.includes('flexible') || text.includes('part remote');
}

function checkIfUrgent(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return text.includes('urgent') || text.includes('immediate') || text.includes('asap') || text.includes('hiring now');
}
