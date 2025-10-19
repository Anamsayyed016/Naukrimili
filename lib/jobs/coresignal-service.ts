/**
 * Coresignal International Jobs API Service
 * Fetches real, live job listings from Coresignal across multiple countries
 * 
 * API Documentation: https://coresignal.com/api-documentation
 * Rate Limits: 1000 requests/month (free tier)
 */

import axios from 'axios';
import { SkillsExtractionService } from '@/lib/services/skills-extraction';

export interface CoresignalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  description: string;
  requirements?: string;
  applyUrl?: string;
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
  sector?: string;
  raw: any;
}

export interface CoresignalSearchOptions {
  query: string;
  country?: string;
  location?: string;
  page?: number;
  limit?: number;
  jobType?: string;
  experienceLevel?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  sector?: string;
}

export interface CoresignalResponse {
  success: boolean;
  data: CoresignalJob[];
  total: number;
  page: number;
  hasMore: boolean;
  error?: string;
}

// Country code mapping for Coresignal API
const COUNTRY_MAPPING: Record<string, string> = {
  'IN': 'india',
  'US': 'united-states',
  'GB': 'united-kingdom',
  'AE': 'united-arab-emirates',
  'CA': 'canada',
  'AU': 'australia',
  'DE': 'germany',
  'FR': 'france',
  'SG': 'singapore',
  'NL': 'netherlands',
  'SE': 'sweden',
  'NO': 'norway',
  'DK': 'denmark',
  'FI': 'finland',
  'CH': 'switzerland',
  'AT': 'austria',
  'BE': 'belgium',
  'IT': 'italy',
  'ES': 'spain',
  'PT': 'portugal'
};

// Currency mapping for salary normalization
const CURRENCY_MAPPING: Record<string, string> = {
  'india': 'INR',
  'united-states': 'USD',
  'united-kingdom': 'GBP',
  'united-arab-emirates': 'AED',
  'canada': 'CAD',
  'australia': 'AUD',
  'germany': 'EUR',
  'france': 'EUR',
  'singapore': 'SGD',
  'netherlands': 'EUR',
  'sweden': 'SEK',
  'norway': 'NOK',
  'denmark': 'DKK',
  'finland': 'EUR',
  'switzerland': 'CHF',
  'austria': 'EUR',
  'belgium': 'EUR',
  'italy': 'EUR',
  'spain': 'EUR',
  'portugal': 'EUR'
};

// Experience level mapping
const EXPERIENCE_MAPPING: Record<string, string> = {
  'entry': 'entry-level',
  'junior': 'entry-level',
  'mid': 'mid-level',
  'senior': 'senior-level',
  'lead': 'senior-level',
  'principal': 'senior-level',
  'executive': 'executive-level',
  'director': 'executive-level',
  'vp': 'executive-level',
  'c-level': 'executive-level'
};

// Job type mapping
const JOB_TYPE_MAPPING: Record<string, string> = {
  'full-time': 'full-time',
  'part-time': 'part-time',
  'contract': 'contract',
  'temporary': 'temporary',
  'internship': 'internship',
  'freelance': 'freelance',
  'remote': 'remote',
  'hybrid': 'hybrid'
};

/**
 * Fetch jobs from Coresignal API
 */
export async function fetchFromCoresignal(
  query: string,
  countryCode = 'IN',
  page = 1,
  options: Partial<CoresignalSearchOptions> = {}
): Promise<CoresignalJob[]> {
  const apiKey = process.env.CORESIGNAL_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ CORESIGNAL_API_KEY not configured, skipping Coresignal job fetch');
    return [];
  }

  try {
    // Map country code to Coresignal format
    const coresignalCountry = COUNTRY_MAPPING[countryCode.toUpperCase()] || 'india';
    const currency = CURRENCY_MAPPING[coresignalCountry] || 'USD';
    
    // Build search parameters
    const searchParams: any = {
      q: query,
      country: coresignalCountry,
      page: page,
      per_page: Math.min(options.limit || 20, 50), // Max 50 per request
      sort: 'relevance',
      order: 'desc'
    };

    // Add optional filters
    if (options.location) {
      searchParams.location = options.location;
    }
    if (options.jobType) {
      searchParams.job_type = options.jobType;
    }
    if (options.experienceLevel) {
      searchParams.experience_level = options.experienceLevel;
    }
    if (options.isRemote !== undefined) {
      searchParams.remote = options.isRemote;
    }
    if (options.salaryMin) {
      searchParams.salary_min = options.salaryMin;
    }
    if (options.salaryMax) {
      searchParams.salary_max = options.salaryMax;
    }
    if (options.sector) {
      searchParams.sector = options.sector;
    }

    console.log(`🔍 Fetching Coresignal jobs for: ${query} in ${coresignalCountry} (page ${page})`);

    // Make API request
    const response = await axios.get('https://api.coresignal.com/cdapi/v1/linkedin/jobs/search', {
      params: searchParams,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NaukriMili/1.0'
      },
      timeout: 15000, // 15 second timeout
    });

    const data = response.data;
    
    if (!data || !Array.isArray(data.jobs)) {
      console.warn('⚠️ Coresignal API returned invalid data structure');
      return [];
    }

    console.log(`✅ Coresignal API returned ${data.jobs.length} jobs`);

    // Normalize jobs to our schema
    const normalizedJobs: CoresignalJob[] = data.jobs.map((job: any, index: number) => {
      return normalizeCoresignalJob(job, coresignalCountry, currency, index);
    });

    return normalizedJobs;

  } catch (error: any) {
    console.error('❌ Coresignal API error:', error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      console.error('❌ Coresignal API: Invalid API key');
    } else if (error.response?.status === 429) {
      console.error('❌ Coresignal API: Rate limit exceeded');
    } else if (error.response?.status === 403) {
      console.error('❌ Coresignal API: Access forbidden');
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ Coresignal API: Request timeout');
    }
    
    return [];
  }
}

/**
 * Normalize Coresignal job data to our schema
 */
function normalizeCoresignalJob(
  job: any, 
  country: string, 
  currency: string, 
  index: number
): CoresignalJob {
  // Extract basic information
  const title = job.title || job.job_title || 'Job Position';
  const company = job.company || job.company_name || 'Company';
  const location = job.location || job.job_location || country;
  const description = job.description || job.job_description || '';
  const requirements = job.requirements || job.job_requirements || '';
  const applyUrl = job.apply_url || job.job_url || job.url || '';
  
  // Parse salary information
  let salary = '';
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  
  if (job.salary) {
    salary = job.salary;
    // Try to extract numeric values
    const salaryMatch = job.salary.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/g);
    if (salaryMatch && salaryMatch.length >= 2) {
      salaryMin = parseInt(salaryMatch[0].replace(/,/g, ''));
      salaryMax = parseInt(salaryMatch[1].replace(/,/g, ''));
    } else if (salaryMatch && salaryMatch.length === 1) {
      salaryMin = parseInt(salaryMatch[0].replace(/,/g, ''));
    }
  } else if (job.salary_min || job.salary_max) {
    salaryMin = job.salary_min;
    salaryMax = job.salary_max;
    if (salaryMin && salaryMax) {
      salary = `${salaryMin.toLocaleString()} - ${salaryMax.toLocaleString()} ${currency}`;
    } else if (salaryMin) {
      salary = `From ${salaryMin.toLocaleString()} ${currency}`;
    } else if (salaryMax) {
      salary = `Up to ${salaryMax.toLocaleString()} ${currency}`;
    }
  }

  // Parse job type and experience level
  const jobType = JOB_TYPE_MAPPING[job.job_type?.toLowerCase()] || 'full-time';
  const experienceLevel = EXPERIENCE_MAPPING[job.experience_level?.toLowerCase()] || 'mid-level';
  
  // Determine if remote/hybrid
  const isRemote = job.remote || job.is_remote || job.work_type === 'remote' || false;
  const isHybrid = job.hybrid || job.is_hybrid || job.work_type === 'hybrid' || false;
  
  // Extract skills from description and requirements
  const skills = SkillsExtractionService.extractSkills(
    description + ' ' + requirements, 
    title, 
    company
  ).map(s => s.skill);

  // Parse posted date
  let postedAt: string | undefined;
  if (job.posted_at || job.created_at || job.published_at) {
    const date = new Date(job.posted_at || job.created_at || job.published_at);
    if (!isNaN(date.getTime())) {
      postedAt = date.toISOString();
    }
  }

  // Determine sector based on title and description
  const sector = determineSector(title, description, company);

  return {
    id: job.id || `coresignal-${Date.now()}-${index}`,
    title,
    company,
    location,
    country: country.toUpperCase(),
    description,
    requirements,
    applyUrl,
    postedAt,
    salary,
    salaryMin,
    salaryMax,
    salaryCurrency: currency,
    jobType,
    experienceLevel,
    skills,
    isRemote,
    isHybrid,
    isUrgent: job.urgent || job.is_urgent || false,
    isFeatured: job.featured || job.is_featured || false,
    sector,
    raw: job
  };
}

/**
 * Determine job sector based on title, description, and company
 */
function determineSector(title: string, description: string, company: string): string {
  const text = `${title} ${description} ${company}`.toLowerCase();
  
  const sectorKeywords = {
    'technology': ['software', 'developer', 'engineer', 'programmer', 'tech', 'it', 'data', 'ai', 'ml', 'cloud', 'devops', 'cyber', 'security'],
    'healthcare': ['health', 'medical', 'doctor', 'nurse', 'pharmacy', 'hospital', 'clinic', 'patient', 'care'],
    'finance': ['finance', 'banking', 'investment', 'accounting', 'audit', 'financial', 'trading', 'insurance'],
    'education': ['education', 'teacher', 'professor', 'school', 'university', 'college', 'student', 'learning'],
    'marketing': ['marketing', 'advertising', 'brand', 'digital', 'social media', 'content', 'seo', 'ppc'],
    'sales': ['sales', 'business development', 'account manager', 'revenue', 'client', 'customer'],
    'operations': ['operations', 'logistics', 'supply chain', 'procurement', 'management', 'admin'],
    'human resources': ['hr', 'human resources', 'recruitment', 'talent', 'people', 'employee'],
    'consulting': ['consulting', 'consultant', 'advisory', 'strategy', 'management consulting'],
    'retail': ['retail', 'ecommerce', 'shopping', 'store', 'merchandise', 'customer service'],
    'manufacturing': ['manufacturing', 'production', 'factory', 'industrial', 'machinery', 'assembly'],
    'construction': ['construction', 'building', 'architect', 'civil', 'engineering', 'project'],
    'media': ['media', 'journalism', 'publishing', 'broadcasting', 'entertainment', 'creative'],
    'government': ['government', 'public sector', 'policy', 'administration', 'civil service'],
    'nonprofit': ['nonprofit', 'ngo', 'charity', 'volunteer', 'social impact', 'community']
  };

  for (const [sector, keywords] of Object.entries(sectorKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return sector;
    }
  }

  return 'general';
}

/**
 * Check Coresignal API health
 */
export async function checkCoresignalHealth(): Promise<{ healthy: boolean; message: string }> {
  const apiKey = process.env.CORESIGNAL_API_KEY;
  
  if (!apiKey) {
    return {
      healthy: false,
      message: 'CORESIGNAL_API_KEY not configured'
    };
  }

  try {
    // Make a simple test request
    const response = await axios.get('https://api.coresignal.com/cdapi/v1/linkedin/jobs/search', {
      params: {
        q: 'test',
        country: 'india',
        per_page: 1
      },
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      healthy: true,
      message: `API responding (${response.status})`
    };
  } catch (error: any) {
    return {
      healthy: false,
      message: `API error: ${error.message}`
    };
  }
}

/**
 * Get supported countries for Coresignal
 */
export function getCoresignalSupportedCountries(): string[] {
  return Object.keys(COUNTRY_MAPPING);
}

/**
 * Get country mapping for Coresignal
 */
export function getCoresignalCountryMapping(): Record<string, string> {
  return COUNTRY_MAPPING;
}
