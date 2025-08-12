/**
 * Enhanced External Jobs API - Real Database Integration with External Sources
 * GET /api/jobs/external - Fetch and cache jobs from external APIs (Adzuna, JSearch, Reed)
 * POST /api/jobs/external/sync - Sync external jobs to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedJobService } from '@/lib/enhanced-job-service';
import { databaseService } from '@/lib/database-service';
import { z } from 'zod';

// External job search schema
const externalJobSearchSchema = z.object({
  q: z.string().optional(),
  location: z.string().optional(),
  country: z.string().default('IN'),
  source: z.enum(['adzuna', 'jsearch', 'reed', 'all']).default('all'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  cache: z.string().optional().transform(val => val !== 'false'),
  sync_to_db: z.string().optional().transform(val => val === 'true'),
});

// External job sync schema
const externalJobSyncSchema = z.object({
  source: z.enum(['adzuna', 'jsearch', 'reed']),
  jobs: z.array(z.any()),
  overwrite_existing: z.boolean().default(false),
});

// GET /api/jobs/external - Fetch jobs from external APIs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate and parse search parameters
    const validatedParams = externalJobSearchSchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    const results: any = {
      success: true,
      message: 'External jobs fetched successfully',
      sources: {},
      total_jobs: 0,
      cached: validatedParams.cache,
      synced_to_db: validatedParams.sync_to_db,
      timestamp: new Date().toISOString(),
    };

    // Check if we should use cached data
    if (validatedParams.cache) {
      const cachedJobs = await getCachedExternalJobs(validatedParams);
      if (cachedJobs.length > 0) {
        results.sources.cached = {
          jobs: cachedJobs,
          count: cachedJobs.length,
          source: 'database_cache',
        };
        results.total_jobs = cachedJobs.length;
        return NextResponse.json(results);
      }
    }

    // Fetch from external APIs based on source preference
    const fetchPromises: Promise<any>[] = [];

    if (validatedParams.source === 'all' || validatedParams.source === 'adzuna') {
      fetchPromises.push(fetchAdzunaJobs(validatedParams));
    }
    
    if (validatedParams.source === 'all' || validatedParams.source === 'jsearch') {
      fetchPromises.push(fetchJSearchJobs(validatedParams));
    }
    
    if (validatedParams.source === 'all' || validatedParams.source === 'reed') {
      fetchPromises.push(fetchReedJobs(validatedParams));
    }

    // Wait for all external API calls
    const externalResults = await Promise.allSettled(fetchPromises);

    // Process results from each source
    let totalJobs = 0;
    const jobsToSync: any[] = [];

    externalResults.forEach((result, index) => {
      const sourceName = getSourceName(validatedParams.source, index);
      
      if (result.status === 'fulfilled' && result.value) {
        results.sources[sourceName] = {
          jobs: result.value.jobs || [],
          count: result.value.jobs?.length || 0,
          status: 'success',
          api_response: result.value.meta || {},
        };
        totalJobs += result.value.jobs?.length || 0;
        
        // Collect jobs for database sync
        if (validatedParams.sync_to_db && result.value.jobs) {
          jobsToSync.push(...result.value.jobs.map((job: any) => ({
            ...job,
            source: sourceName,
          })));
        }
      } else {
        results.sources[sourceName] = {
          jobs: [],
          count: 0,
          status: 'error',
          error: result.status === 'rejected' ? result.reason?.message : 'Unknown error',
        };
      }
    });

    results.total_jobs = totalJobs;

    // Sync jobs to database if requested
    if (validatedParams.sync_to_db && jobsToSync.length > 0) {
      try {
        const syncResult = await syncExternalJobsToDatabase(jobsToSync);
        results.sync_result = {
          synced_count: syncResult.synced,
          skipped_count: syncResult.skipped,
          error_count: syncResult.errors,
          details: syncResult.details,
        };
      } catch (syncError: any) {
        results.sync_result = {
          error: 'Failed to sync jobs to database',
          message: syncError.message,
        };
      }
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('External jobs GET error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors,
        sources: {},
        total_jobs: 0,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch external jobs',
      message: error.message,
      sources: {},
      total_jobs: 0,
    }, { status: 500 });
  }
}

// POST /api/jobs/external/sync - Manually sync external jobs to database
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = externalJobSyncSchema.parse(body);

    // Sync jobs to database
    const syncResult = await syncExternalJobsToDatabase(
      validatedData.jobs.map(job => ({
        ...job,
        source: validatedData.source,
      })),
      validatedData.overwrite_existing
    );

    return NextResponse.json({
      success: true,
      message: 'Jobs synced to database successfully',
      sync_result: {
        synced_count: syncResult.synced,
        skipped_count: syncResult.skipped,
        error_count: syncResult.errors,
        details: syncResult.details,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('External jobs sync error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sync data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to sync external jobs',
      message: error.message,
    }, { status: 500 });
  }
}

// Helper function to get cached external jobs
async function getCachedExternalJobs(params: any) {
  try {
    const filters: any = {
      isActive: true,
    };

    if (params.q) {
      filters.q = params.q;
    }
    
    if (params.location) {
      filters.location = params.location;
    }
    
    if (params.country) {
      filters.country = params.country;
    }

    // Only get jobs from external sources
    filters.source = ['adzuna', 'jsearch', 'reed'];

    const result = await enhancedJobService.searchJobs(filters, {
      page: 1,
      limit: params.limit,
    });

    return result.data.map(job => ({
      id: job.sourceId || job.id.toString(),
      title: job.title,
      company: job.company,
      company_logo: job.companyLogo,
      location: job.location,
      country: job.country,
      description: job.description,
      salary: job.salary,
      job_type: job.jobType,
      remote: job.isRemote,
      posted_at: job.postedAt?.toISOString() || job.createdAt.toISOString(),
      redirect_url: job.applyUrl,
      source: job.source,
    }));
  } catch (error) {
    console.error('Error fetching cached external jobs:', error);
    return [];
  }
}

// Helper function to fetch jobs from Adzuna API
async function fetchAdzunaJobs(params: any) {
  const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
  const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;

  if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
    throw new Error('Adzuna API credentials not configured');
  }

  const queryParams = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_API_KEY,
    results_per_page: params.limit.toString(),
    what: params.q || '',
    where: params.location || '',
    country: params.country.toLowerCase(),
  });

  const response = await fetch(
    `https://api.adzuna.com/v1/api/jobs/${params.country.toLowerCase()}/search/1?${queryParams}`,
    {
      method: 'GET',
      headers: {
        'User-Agent': 'JobPortal/1.0',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    jobs: data.results?.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company?.display_name,
      location: job.location?.display_name,
      country: params.country,
      description: job.description,
      salary: job.salary_min && job.salary_max 
        ? `${job.salary_min} - ${job.salary_max} ${job.currency || 'USD'}`
        : null,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: job.currency,
      job_type: job.contract_type,
      posted_at: job.created,
      redirect_url: job.redirect_url,
      source: 'adzuna',
      raw_data: job,
    })) || [],
    meta: {
      total_results: data.count,
      page: 1,
      results_per_page: params.limit,
    },
  };
}

// Helper function to fetch jobs from JSearch API
async function fetchJSearchJobs(params: any) {
  const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;

  if (!JSEARCH_API_KEY) {
    throw new Error('JSearch API key not configured');
  }

  const queryParams = new URLSearchParams({
    query: params.q || 'software developer',
    page: '1',
    num_pages: '1',
    country: params.country,
  });

  if (params.location) {
    queryParams.append('location', params.location);
  }

  const response = await fetch(
    `https://jsearch.p.rapidapi.com/search?${queryParams}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': JSEARCH_API_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`JSearch API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    jobs: data.data?.slice(0, params.limit).map((job: any) => ({
      id: job.job_id,
      title: job.job_title,
      company: job.employer_name,
      company_logo: job.employer_logo,
      location: job.job_city || job.job_state || job.job_country,
      country: job.job_country,
      description: job.job_description,
      salary: job.job_salary,
      job_type: job.job_employment_type,
      remote: job.job_is_remote,
      posted_at: job.job_posted_at_datetime_utc,
      redirect_url: job.job_apply_link,
      source: 'jsearch',
      raw_data: job,
    })) || [],
    meta: {
      total_results: data.data?.length || 0,
      page: 1,
      results_per_page: params.limit,
    },
  };
}

// Helper function to fetch jobs from Reed API
async function fetchReedJobs(params: any) {
  const REED_API_KEY = process.env.REED_API_KEY;

  if (!REED_API_KEY) {
    throw new Error('Reed API key not configured');
  }

  const queryParams = new URLSearchParams({
    keywords: params.q || '',
    resultsToTake: params.limit.toString(),
  });

  if (params.location) {
    queryParams.append('locationName', params.location);
  }

  const response = await fetch(
    `https://www.reed.co.uk/api/1.0/search?${queryParams}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(REED_API_KEY + ':').toString('base64')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Reed API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    jobs: data.results?.map((job: any) => ({
      id: job.jobId,
      title: job.jobTitle,
      company: job.employerName,
      location: job.locationName,
      country: 'GB', // Reed is UK-focused
      description: job.jobDescription,
      salary: job.minimumSalary && job.maximumSalary 
        ? `${job.minimumSalary} - ${job.maximumSalary} GBP`
        : null,
      salary_min: job.minimumSalary,
      salary_max: job.maximumSalary,
      salary_currency: 'GBP',
      job_type: job.jobType,
      posted_at: job.date,
      redirect_url: job.jobUrl,
      source: 'reed',
      raw_data: job,
    })) || [],
    meta: {
      total_results: data.totalResults,
      page: 1,
      results_per_page: params.limit,
    },
  };
}

// Helper function to sync external jobs to database
async function syncExternalJobsToDatabase(jobs: any[], overwriteExisting: boolean = false) {
  const result = {
    synced: 0,
    skipped: 0,
    errors: 0,
    details: [] as any[],
  };

  for (const job of jobs) {
    try {
      // Check if job already exists by sourceId
      const existingJob = await enhancedJobService.getJobBySourceId(job.source, job.id);

      if (existingJob && !overwriteExisting) {
        result.skipped++;
        result.details.push({
          job_id: job.id,
          status: 'skipped',
          reason: 'Job already exists',
        });
        continue;
      }

      // Prepare job data for database
      const jobData = {
        title: job.title,
        company: job.company || 'Unknown Company',
        companyLogo: job.company_logo,
        location: job.location,
        country: job.country || 'IN',
        description: job.description || '',
        applyUrl: job.redirect_url,
        salary: job.salary,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        salaryCurrency: job.salary_currency,
        jobType: job.job_type,
        isRemote: job.remote || false,
        source: job.source,
        sourceId: job.id.toString(),
        postedAt: job.posted_at ? new Date(job.posted_at) : undefined,
        rawJson: job.raw_data || {},
      };

      if (existingJob && overwriteExisting) {
        // Update existing job
        await enhancedJobService.updateJob(existingJob.id, jobData);
        result.synced++;
        result.details.push({
          job_id: job.id,
          status: 'updated',
          database_id: existingJob.id,
        });
      } else {
        // Create new job
        const createdJob = await enhancedJobService.createJob(jobData);
        result.synced++;
        result.details.push({
          job_id: job.id,
          status: 'created',
          database_id: createdJob.id,
        });
      }

    } catch (error: any) {
      result.errors++;
      result.details.push({
        job_id: job.id,
        status: 'error',
        error: error.message,
      });
    }
  }

  return result;
}

// Helper function to get source name based on index
function getSourceName(source: string, index: number): string {
  if (source !== 'all') {
    return source;
  }
  
  const sources = ['adzuna', 'jsearch', 'reed'];
  return sources[index] || 'unknown';
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
