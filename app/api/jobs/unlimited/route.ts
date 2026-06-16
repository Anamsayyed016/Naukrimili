/**
 * Unlimited Job Search API - OPTIMIZED VERSION
 * Uses the same optimized implementation as /api/jobs but with unlimited limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geoUtils';
import { filterValidJobs } from '@/lib/jobs/job-id-validator';
import { jobCacheService } from '@/lib/job-cache-service';
import {
  buildUnlimitedCacheKey,
  EXTERNAL_API_TIMEOUT_MS,
  EXTERNAL_COUNTRY_CAP,
  logJobApiTiming,
  settleAllWithTimeout,
  type JobApiTimings,
} from '@/lib/jobs/api-perf';
import {
  passesJobListingQualityCheck,
  applyJobTextSearchToWhere,
  applyJobLocationToWhere,
  applyEmployerLocationToWhere,
  applyExplicitCountryToWhere,
  applyJobTypeFilterToWhere,
  applyExperienceLevelFilterToWhere,
  jobMatchesListingLocation,
  buildJobListingBaseWhere,
} from '@/lib/job-data-normalizer';
import { JobRankingService } from '@/lib/services/job-ranking-service';
import { getJobDescriptionPreview } from '@/lib/jobs/clean-job-description';

function isExternalSource(source?: string | null): boolean {
  if (!source) return false;
  const s = source.toLowerCase();
  return [
    'external',
    'adzuna',
    'jsearch',
    'jooble',
    'serpapi',
    'usajobs',
    'rapidapi',
    'google',
    'indeed',
    'ziprecruiter',
  ].includes(s);
}

/** Stable listing ID: ext-adzuna-{numericSourceId} (matches DB source+sourceId) */
function externalListingId(job: {
  source?: string | null;
  sourceId?: string | number | null;
  id?: string | number | null;
}): string {
  const rawSourceId = String(job.sourceId || job.id || '').trim();
  const nested = rawSourceId.match(
    /^(adzuna|jsearch|jooble|indeed|ziprecruiter|google|rapidapi|serpapi|usajobs)-(.+)$/i
  );
  let source = String(job.source || 'external').toLowerCase();
  let sourceId = rawSourceId;
  if (nested) {
    source = nested[1].toLowerCase();
    sourceId = nested[2].match(/(\d{5,})$/)?.[1] || nested[2];
  } else {
    sourceId = rawSourceId.match(/(\d{5,})$/)?.[1] || rawSourceId;
    if (source === 'external') {
      const fromId = String(job.id || '');
      const pe = fromId.match(/^ext-(adzuna|jsearch|jooble|indeed|ziprecruiter|serpapi|usajobs)-/i);
      if (pe) source = pe[1].toLowerCase();
    }
  }
  if (source === 'external') source = 'adzuna';
  return `ext-${source}-${sourceId}`;
}

/**
 * ENHANCED: Smart duplicate removal - handles variations and prioritizes employer/manual jobs
 * IMPROVED: Better duplicate detection with normalized keys and source prioritization
 */
function removeDuplicateJobs(jobs: any[]): any[] {
  const seenByKey = new Map<string, any>();
  const seenById = new Map<string, any>(); // Track by ID to ensure uniqueness and preserve source
  
  // Source priority: employer/manual (highest) > database > external
  const getSourcePriority = (source: string): number => {
    if (source === 'manual' || source === 'employer') return 3;
    if (source === 'database') return 2;
    return 1; // external, adzuna, jsearch, jooble, etc.
  };
  
  jobs.forEach(job => {
    // Normalize fields for better duplicate detection
    const title = (job.title || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const company = (job.company || job.companyRelation?.name || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const location = (job.location || job.companyRelation?.location || '').toLowerCase().trim().replace(/[^a-z0-9\s,]/g, '');
    
    // Normalize location variations (e.g., "New York" vs "NYC" vs "New York, NY")
    const normalizedLocation = location.split(',')[0].trim();
    
    // Primary key: exact match (title + company + normalized location)
    const primaryKey = `${title}|${company}|${normalizedLocation}`;
    
    // Secondary key: title + company only (for location variations)
    const secondaryKey = `${title}|${company}`;
    
    // Job ID for final deduplication (preserve original source)
    const jobId = job.id || job.sourceId || `${job.source || 'unknown'}-${job.sourceId || 'unknown'}`;
    
    // Check if we've seen this job before by key
    const existingByKey = seenByKey.get(primaryKey) || seenByKey.get(secondaryKey);
    
    if (!existingByKey) {
      // New job - add it
      seenByKey.set(primaryKey, job);
      seenByKey.set(secondaryKey, job);
      seenById.set(jobId, job);
    } else {
      // Potential duplicate - prefer employer/manual jobs over all others
      const existingById = seenById.get(jobId);
      if (existingById) {
        // Same job by ID - keep the one with better source priority
        const jobSourcePriority = getSourcePriority(job.source || 'external');
        const existingSourcePriority = getSourcePriority(existingById.source || 'external');
        
        if (jobSourcePriority > existingSourcePriority) {
          seenById.set(jobId, job);
          seenByKey.set(primaryKey, job);
          seenByKey.set(secondaryKey, job);
        }
      } else {
        // Different job ID but similar content (same title+company+location)
        // Prioritize employer/manual jobs over all others
        const existingSourcePriority = getSourcePriority(existingByKey.source || 'external');
        const jobSourcePriority = getSourcePriority(job.source || 'external');
        
        if (jobSourcePriority > existingSourcePriority) {
          // New job has higher priority - replace existing
          seenByKey.set(primaryKey, job);
          seenByKey.set(secondaryKey, job);
          seenById.set(jobId, job);
        }
        // If priorities are equal or existing is higher, keep existing (first come, first served)
      }
    }
  });
  
  // Return unique jobs from seenById (ensures no duplicates by ID and preserves source field)
  const uniqueJobs = Array.from(seenById.values());
  
  const removed = jobs.length - uniqueJobs.length;
  if (removed > 0) {
    console.log(`🔄 Removed ${removed} duplicates (kept ${uniqueJobs.length} unique jobs)`);
  }
  
  return uniqueJobs;
}

const LIST_JOB_SELECT = {
  id: true,
  sourceId: true,
  source: true,
  title: true,
  company: true,
  description: true,
  companyLogo: true,
  location: true,
  country: true,
  applyUrl: true,
  source_url: true,
  postedAt: true,
  expiryDate: true,
  salary: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  jobType: true,
  experienceLevel: true,
  isRemote: true,
  isHybrid: true,
  isUrgent: true,
  isFeatured: true,
  isActive: true,
  sector: true,
  views: true,
  applicationsCount: true,
  createdAt: true,
  updatedAt: true,
  companyRelation: {
    select: {
      name: true,
      logo: true,
      location: true,
      industry: true,
    },
  },
} as const;

/** List view still reads description from DB but serializes a short preview only. */
const LIST_JOB_LIST_SELECT = {
  ...LIST_JOB_SELECT,
} as const;

type ListingFormatOptions = {
  /** When true, return ~200 char preview instead of full description (smaller JSON). */
  listView?: boolean;
};

type ListingFilterParams = {
  query: string;
  location: string;
  company: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  sector: string;
};

/** Employer/manual jobs: same text + location filters as listing; country filter still bypassed in main where. */
function buildEmployerListingWhere(f: ListingFilterParams): Record<string, unknown> {
  const employerListingWhere: Record<string, unknown> = {
    isActive: true,
    source: { in: ['manual', 'employer'] },
  };
  if (f.query) {
    applyJobTextSearchToWhere(employerListingWhere, f.query);
  }
  if (f.location) {
    applyEmployerLocationToWhere(employerListingWhere, f.location);
  }
  if (f.company) {
    employerListingWhere.company = { contains: f.company, mode: 'insensitive' };
  }
  if (f.jobType && f.jobType !== 'all') {
    applyJobTypeFilterToWhere(employerListingWhere, f.jobType);
  }
  if (f.experienceLevel && f.experienceLevel !== 'all') {
    applyExperienceLevelFilterToWhere(employerListingWhere, f.experienceLevel);
  }
  if (f.isRemote) {
    employerListingWhere.isRemote = true;
  }
  if (f.sector) {
    employerListingWhere.sector = { contains: f.sector, mode: 'insensitive' };
  }
  return employerListingWhere;
}

function capListingWithEmployerFirst<T extends { source?: string | null }>(
  rows: T[],
  limit: number
): T[] {
  const employerRows = rows
    .filter((j) => j.source === 'manual' || j.source === 'employer')
    .slice(0, limit);
  const otherRows = rows.filter((j) => j.source !== 'manual' && j.source !== 'employer');
  const otherCap = Math.max(0, limit - employerRows.length);
  return [...employerRows, ...otherRows.slice(0, otherCap)];
}

function formatListingJob(job: Record<string, unknown>, options?: ListingFormatOptions) {
  const isExternalJob = isExternalSource(job.source as string | undefined);
  const listingId = isExternalJob
    ? externalListingId(job as { source?: string; sourceId?: string | number; id?: string | number })
    : job.id;
  let applyUrl = job.applyUrl;
  if (isExternalJob) {
    applyUrl = job.source_url || job.applyUrl;
  } else {
    applyUrl = `/jobs/${job.id}/apply`;
  }
  const rel = job.companyRelation as { name?: string; logo?: string } | undefined;
  const fullDescription = String(job.description || '');
  const description = options?.listView
    ? getJobDescriptionPreview(fullDescription, 220)
    : fullDescription;
  return {
    id: listingId,
    sourceId: job.sourceId,
    title: job.title,
    company: job.company || rel?.name,
    companyLogo: job.companyLogo || rel?.logo,
    location: job.location,
    country: job.country,
    description,
    applyUrl,
    source: job.source || 'database',
    isExternal: isExternalJob,
    postedAt: job.postedAt,
    salary: job.salary,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    skills: job.skills,
    isRemote: job.isRemote,
    isHybrid: job.isHybrid,
    isUrgent: job.isUrgent,
    isFeatured: job.isFeatured,
    isActive: job.isActive,
    sector: job.sector,
    views: job.views,
    applicationsCount: job.applicationsCount,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    distance: job.distance,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const timings: JobApiTimings = {};
  
  try {
    console.log('🚀 Unlimited job search API called (OPTIMIZED VERSION)');
    
    // Validate request
    if (!request.url) {
      console.error('❌ Invalid request URL in unlimited jobs API');
      return NextResponse.json(
        { success: false, error: 'Invalid request URL' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse search parameters with unlimited limits
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const company = searchParams.get('company') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true' || searchParams.get('remote') === 'true' || searchParams.get('remote_only') === 'true';
    const sector = searchParams.get('sector') || '';
    const country = searchParams.get('country') || ''; // Only filter by country if explicitly provided
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    
    // Pagination (Indeed/Naukri style): small pages from DB, not 24k rows per request
    const LIST_PAGE_DEFAULT = 25;
    const LIST_PAGE_MAX = 100;
    const DB_ONLY_JOB_THRESHOLD = 200;
    let page = 1;
    let limit = LIST_PAGE_DEFAULT;
    let radius = 25;
    let userLat = 0;
    let userLng = 0;
    
    try {
      page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      limit = Math.min(
        LIST_PAGE_MAX,
        Math.max(10, parseInt(searchParams.get('limit') || String(LIST_PAGE_DEFAULT)))
      );
      radius = Math.max(5, Math.min(100, parseInt(searchParams.get('radius') || '25')));
      userLat = parseFloat(searchParams.get('lat') || '0');
      userLng = parseFloat(searchParams.get('lng') || '0');
    } catch (parseError) {
      console.warn('⚠️ Parameter parsing failed, using defaults:', parseError);
    }

    const includeExternalParam = searchParams.get('includeExternal');
    const refreshExternal = searchParams.get('refreshExternal') === 'true';
    const isListView = (searchParams.get('view') || '').toLowerCase() === 'list';
    const jobSelect = isListView ? LIST_JOB_LIST_SELECT : LIST_JOB_SELECT;
    const cacheKey = buildUnlimitedCacheKey({
      query,
      location,
      country,
      company,
      jobType,
      experienceLevel,
      isRemote: isRemote ? 1 : 0,
      sector,
      salaryMin,
      salaryMax,
      page,
      limit,
      includeExternal: includeExternalParam ?? 'true',
      refreshExternal: refreshExternal ? 1 : 0,
      descPreview: 1,
    });
    const listingFilters: ListingFilterParams = {
      query,
      location,
      company,
      jobType,
      experienceLevel,
      isRemote,
      sector,
    };

    const cached = await jobCacheService.get<Record<string, unknown>>(cacheKey, 'api_jobs_list');
    // Page 1 sends refreshExternal=true — always refetch so new employer (manual) jobs are not hidden by a stale cache entry.
    if (cached && !refreshExternal) {
      let responsePayload = { ...cached };
      const cachedJobs = (responsePayload as { jobs?: Record<string, unknown>[] }).jobs;
      // Employer boost only on page 1 — re-injecting on page 2+ duplicates the same rows every page.
      if (page === 1) {
        try {
          const manualRows = await prisma.job.findMany({
            where: buildEmployerListingWhere(listingFilters),
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: jobSelect,
          });
          const existingIds = new Set(
            (Array.isArray(cachedJobs) ? cachedJobs : []).map((j) => String(j.id))
          );
          const freshManual = manualRows
            .filter((row) => !existingIds.has(String(row.id)))
            .map((row) => formatListingJob(row as Record<string, unknown>, { listView: isListView }));
          if (freshManual.length > 0) {
            const merged = capListingWithEmployerFirst(
              [...freshManual, ...(Array.isArray(cachedJobs) ? cachedJobs : [])] as {
                source?: string | null;
              }[],
              limit
            );
            responsePayload = { ...responsePayload, jobs: merged };
          }
        } catch (employerCacheMergeError) {
          console.warn('⚠️ Employer cache merge failed (serving cached list):', employerCacheMergeError);
        }
      }
      const jobsForDetail = (responsePayload as { jobs?: Record<string, unknown>[] }).jobs;
      if (Array.isArray(jobsForDetail) && jobsForDetail.length > 0) {
        await jobCacheService.cacheJobsForDetail(jobsForDetail);
      }
      timings.cacheHit = true;
      timings.totalMs = Date.now() - startTime;
      logJobApiTiming('GET /api/jobs/unlimited', timings, { page, limit });
      return NextResponse.json(
        {
          ...responsePayload,
          metadata: {
            ...(responsePayload.metadata as Record<string, unknown> | undefined),
            performance: {
              ...(responsePayload.metadata as { performance?: object })?.performance,
              cacheHit: true,
              responseTimeMs: timings.totalMs,
            },
          },
        },
        { headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    console.log(`🔍 Unlimited search params:`, {
      query, location, country, page, limit, includeExternal: includeExternalParam,
      includeDatabase: searchParams.get('includeDatabase')
    });

    const where: any = buildJobListingBaseWhere();

    const isSearchActive = !!(query.trim() || location.trim());

    if (query) {
      applyJobTextSearchToWhere(where, query);
    }

    if (location) {
      applyJobLocationToWhere(where, location);
    }

    // Company filtering
    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    if (jobType && jobType !== 'all') {
      applyJobTypeFilterToWhere(where, jobType);
    }

    if (experienceLevel && experienceLevel !== 'all') {
      applyExperienceLevelFilterToWhere(where, experienceLevel);
    }

    // Remote work filtering
    if (isRemote) {
      where.isRemote = true;
    }

    // Sector filtering
    if (sector) {
      where.sector = { contains: sector, mode: 'insensitive' };
    }

    // Country filtering — only when client sends explicit country chip (not inferred from city)
    const countryCode = country?.trim().toUpperCase();
    if (countryCode && countryCode !== 'ALL') {
      applyExplicitCountryToWhere(where, countryCode);
    }

    console.log('[jobs-pipeline] request', {
      query: query || '(none)',
      location: location || '(none)',
      country: countryCode || '(none)',
      jobType: jobType || '(none)',
      experienceLevel: experienceLevel || '(none)',
      isRemote,
      sector: sector || '(none)',
      page,
      limit,
    });

    // Salary filtering
    if (salaryMin) {
      where.salaryMin = { gte: parseInt(salaryMin) };
    }
    if (salaryMax) {
      where.salaryMax = { lte: parseInt(salaryMax) };
    }

    // Calculate pagination — search uses a ranked pool then slices by page (skip/take alone breaks ranking pages)
    const skip = (page - 1) * limit;
    const dbTake = isSearchActive
      ? Math.min(Math.max(page * limit, limit * 2), 200)
      : limit;
    const dbSkip = isSearchActive ? 0 : skip;

    console.log(`🔍 Database query built:`, { where, skip: dbSkip, take: dbTake, limit, page });

    // Fetch jobs from database with company relations
    let jobs: any[] = [];
    let total = 0;
    let dbOk = true;
    let shouldFetchExternal = false;
    let backgroundUpsertScheduled = false;
    
    try {
      // Database can be unavailable/misconfigured in production; don't hard-fail the whole endpoint.
      let jobsResult: any[] = [];
      let totalResult = 0;
      const prismaStart = Date.now();
      try {
        [jobsResult, totalResult] = await Promise.all([
          prisma.job.findMany({
            where,
            skip: dbSkip,
            take: dbTake,
            orderBy: { createdAt: 'desc' },
            select: jobSelect,
          }),
          prisma.job.count({ where })
        ]);

        let employerBoostCount = 0;
        // Page 1 only: pin fresh employer/manual posts — on page 2+ this would ignore skip and repeat page-1 rows.
        if (page === 1 && !isSearchActive) {
          const manualEmployerRows = await prisma.job.findMany({
            where: buildEmployerListingWhere(listingFilters),
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: jobSelect,
          });
          const dbRowById = new Map<string, (typeof jobsResult)[0]>();
          for (const row of [...manualEmployerRows, ...jobsResult]) {
            dbRowById.set(String(row.id), row);
          }
          jobsResult = Array.from(dbRowById.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          employerBoostCount = manualEmployerRows.length;
          if (jobsResult.length > limit) {
            jobsResult = capListingWithEmployerFirst(jobsResult, limit);
          }
        } else if (!isSearchActive && jobsResult.length > limit) {
          jobsResult = jobsResult.slice(0, limit);
        }

        timings.prismaMs = Date.now() - prismaStart;
        const prismaInternal = jobsResult.filter(
          (j) => j.source === 'manual' || j.source === 'employer'
        ).length;
        console.log('[jobs-pipeline] after-prisma', {
          dbRows: jobsResult.length,
          internalRows: prismaInternal,
          employerBoost: employerBoostCount,
          totalInDb: totalResult,
        });
      } catch (dbQueryError: any) {
        dbOk = false;
        console.error('❌ Database query failed (continuing with external only):', dbQueryError);
      }
      
      // IMPORTANT: All jobs fetched from our database should be marked as 'database'
      // CRITICAL: Filter out jobs with invalid IDs (decimals from Math.random())
      const validJobsResult = filterValidJobs(jobsResult);
      
      // PRESERVE original source field (don't overwrite 'manual' employer jobs)
      // Only normalize null/undefined sources to 'database'
      jobs = validJobsResult.map(job => ({
        ...job,
        source: job.source || 'database', // Preserve original source, default to 'database' only if missing
        apply_url: job.apply_url ?? job.applyUrl ?? job.source_url ?? null // Alias for legacy consumers
      }));
      total = totalResult; // CRITICAL FIX: Use database count, not filtered count!

      console.log('[jobs-pipeline] after-db-normalize', {
        jobs: jobs.length,
        internal: jobs.filter((j) => j.source === 'manual' || j.source === 'employer').length,
      });
      
      // Debug: Check source fields right after normalization
      const dbJobsWithSource = jobs.filter(j => j.source === 'database' || j.source === 'employer').length;
      const jobsWithNullSource = jobs.filter(j => !j.source || j.source === null).length;
      
      console.log(`✅ Database query completed:`, {
        jobsFound: jobs.length,
        totalJobs: total,
        dbJobsWithSource,
        jobsWithNullSource,
        query: where,
        skip,
        limit,
        searchParams: { query, location, company, jobType, experienceLevel, isRemote, sector, country }
      });
      
      // Debug: Show sample of found jobs with their source values
      if (jobs.length > 0) {
        console.log(`🔍 Sample database jobs:`, jobs.slice(0, 3).map(j => ({
          id: j.id,
          title: j.title?.substring(0, 40),
          company: j.company,
          source: j.source,
          sourceType: typeof j.source,
          hasSource: j.source !== undefined && j.source !== null
        })));
      }
      
      // OPTIMIZED: Check for API keys once
      const hasAdzuna = !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
      const hasRapidAPI = !!process.env.RAPIDAPI_KEY;
      const hasJooble = !!process.env.JOOBLE_API_KEY;
      const hasExternalApiKeys = hasAdzuna || hasRapidAPI || hasJooble;
      
      // External APIs: sync into DB only when needed — not on every paginated page (keeps site fast at 24k+ rows)
      const dbHasCatalog = totalResult >= DB_ONLY_JOB_THRESHOLD;
      shouldFetchExternal =
        hasExternalApiKeys &&
        includeExternalParam !== 'false' &&
        (refreshExternal || !dbHasCatalog || (isSearchActive && page === 1));
      if (dbHasCatalog && !refreshExternal) {
        console.log(
          `[jobs-debug] DB-only listing: ${totalResult} jobs in database (page ${page}, limit ${limit})`
        );
      }
      
      if (shouldFetchExternal) {
        // CRITICAL FIX: Include location in search query when no keywords provided
        // This ensures external APIs respect the location filter
        let searchQuery = query;
        
        if (!searchQuery && location) {
          // User is searching by location only - include location in query
          searchQuery = `jobs in ${location}`;
          console.log(`🗺️ Location-only search detected. Using query: "${searchQuery}"`);
        } else if (!searchQuery) {
          // No query and no location - use default popular jobs query
          searchQuery = 'developer OR engineer OR manager OR analyst OR designer';
          console.log(`🔍 No search criteria. Using default query: "${searchQuery}"`);
        }
        
        console.log(`🚀 Fetching jobs from ${[hasAdzuna && 'Adzuna', hasRapidAPI && 'JSearch', hasJooble && 'Jooble'].filter(Boolean).join(', ')}`);
        console.log(`📍 Search query: "${searchQuery}", Location filter: "${location}"`);
        
        try {
          let realExternalJobs: any[] = [];
          const apiStartTime = Date.now();
          
          // PARALLEL API CALLS - All 3 APIs called simultaneously for maximum speed
          const externalPromises = [];
          
          try {
            const { fetchFromAdzuna, fetchFromJooble } = await import('@/lib/jobs/providers');
            const { fetchFromJSearch } = await import('@/lib/jobs/dynamic-providers');
            const { getCountriesToFetch } = await import('@/lib/utils/country-detection');
            
            // SMART COUNTRY DETECTION: cap countries when broad search to avoid 12+ API calls
            const countriesToFetch = getCountriesToFetch({ location, country }).slice(
              0,
              country || location ? EXTERNAL_COUNTRY_CAP + 2 : EXTERNAL_COUNTRY_CAP
            );
            
            console.log(`🌍 Fetching jobs from ${countriesToFetch.length} countries:`, 
              countriesToFetch.map(c => c.name).join(', '));
            
            const externalStart = Date.now();
            // Fetch from multiple countries in parallel
            for (const countryConfig of countriesToFetch) {
              // Adzuna API (Multi-country support)
              if (hasAdzuna) {
                externalPromises.push(
                  fetchFromAdzuna(searchQuery, countryConfig.adzunaCode, 1, { 
                    location: location || undefined,
                    distanceKm: 50 
                  }).catch(err => {
                    console.log(`⚠️ Adzuna ${countryConfig.name} failed:`, err.message);
                    return [];
                  })
                );
              }
              
              // JSearch API via RapidAPI (Global coverage)
              if (hasRapidAPI) {
                externalPromises.push(
                  fetchFromJSearch(searchQuery, countryConfig.jsearchCode, 1).catch(err => {
                    console.log(`⚠️ JSearch ${countryConfig.name} failed:`, err.message);
                    return [];
                  })
                );
              }
              
              // Jooble API (Additional job source)
              if (hasJooble) {
                externalPromises.push(
                  fetchFromJooble(searchQuery, countryConfig.joobleLocation, 1, {
                    countryCode: countryConfig.code
                  }).catch(err => {
                    console.log(`⚠️ Jooble ${countryConfig.name} failed:`, err.message);
                    return [];
                  })
                );
              }
            }
            
            if (externalPromises.length > 0) {
              const externalResults = await settleAllWithTimeout(
                externalPromises,
                EXTERNAL_API_TIMEOUT_MS
              );
              timings.externalMs = Date.now() - externalStart;
              console.log(
                `[jobs-debug] external settled: ${externalResults.filter((r) => r.status === 'fulfilled').length}/${externalResults.length} providers`
              );

              // Collect results from all successful APIs
              externalResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value && Array.isArray(result.value) && result.value.length > 0) {
                  console.log(`✅ external provider #${index}: ${result.value.length} jobs`);
                  const jobsWithSource = result.value.map((job: any) => ({
                    ...job,
                    source: job.source || 'external',
                  }));
                  realExternalJobs.push(...jobsWithSource);
                }
              });
              
              const apiDuration = Date.now() - apiStartTime;
              console.log(`⚡ API calls completed in ${apiDuration}ms`);
            }
            
            // OPTIMIZED: Fast caching and deduplication
            if (realExternalJobs.length > 0) {
              // Persist in background when DB is reachable (fills empty DB from external feeds)
              if (dbOk) {
                const upsertStart = Date.now();
                const { scheduleNormalizedJobUpserts } = await import('@/lib/jobs/upsertJob');
                scheduleNormalizedJobUpserts(
                  realExternalJobs.map((job) => ({
                    source: job.source || 'external',
                    sourceId: String(job.sourceId || job.id || `external-${Date.now()}`),
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    country: job.country || country,
                    description: job.description,
                    requirements: job.requirements || '',
                    applyUrl: job.source_url || job.applyUrl,
                    source_url: job.source_url || job.applyUrl,
                    postedAt: job.postedAt,
                    salary: job.salary,
                    salaryMin: job.salaryMin,
                    salaryMax: job.salaryMax,
                    salaryCurrency: job.salaryCurrency,
                    jobType: job.jobType,
                    experienceLevel: job.experienceLevel,
                    skills: job.skills,
                    isRemote: job.isRemote,
                    isHybrid: job.isHybrid,
                    sector: job.sector || 'General',
                  }))
                );
                backgroundUpsertScheduled = true;
                console.log(`💾 Scheduled background upsert for ${realExternalJobs.length} external jobs (${Date.now() - upsertStart}ms to queue)`);
              } else {
                console.log('⏭️ Skipping caching external jobs (database unavailable)');
              }
              
              // SMART DEDUPLICATION: Deduplicate external jobs against database jobs before combining
              // This prevents duplicates when external jobs were already cached to database
              const dbJobSourceIds = new Set(jobs.map(j => j.sourceId || j.id?.toString()).filter(Boolean));
              const uniqueExternalJobs = realExternalJobs.filter(extJob => {
                const extSourceId = extJob.sourceId || extJob.id?.toString();
                // Skip external job if it already exists in database (was cached previously)
                return !extSourceId || !dbJobSourceIds.has(extSourceId.toString());
              });
              
              console.log(`🔄 Deduplication: ${realExternalJobs.length} external jobs → ${uniqueExternalJobs.length} unique (${realExternalJobs.length - uniqueExternalJobs.length} already in database)`);
              
              // Combine database jobs with unique external jobs, then deduplicate by content
              const databaseJobsCountBeforeDedup = jobs.length;
              const combinedJobs = [...jobs, ...uniqueExternalJobs]; // Database jobs first, then unique external
              jobs = removeDuplicateJobs(combinedJobs);
              console.log('[jobs-pipeline] after-external-merge', {
                jobs: jobs.length,
                internal: jobs.filter((j) => j.source === 'manual' || j.source === 'employer').length,
                external: jobs.filter((j) =>
                  ['external', 'adzuna', 'jsearch', 'jooble', 'serpapi'].includes(
                    String(j.source || '').toLowerCase()
                  )
                ).length,
              });

              // CRITICAL FIX: Update total to include external jobs
              // When database has few/no jobs but external APIs have many, total should reflect reality
              const dbCount = jobs.filter(j => (j.source === 'database' || j.source === 'employer')).length;
              const extCount = jobs.filter(j => (j.source === 'external' || j.source === 'adzuna' || j.source === 'jsearch' || j.source === 'jooble')).length;
              
              // If we have external jobs, estimate total available jobs
              if (extCount > 0) {
                // Conservative estimate: current page size * 10 pages for external jobs
                const estimatedExternalTotal = Math.max(extCount, limit * 10);
                total = totalResult + estimatedExternalTotal;
                console.log(`📊 Updated total: ${total} (${totalResult} database + ~${estimatedExternalTotal} estimated external)`);
              }
              
              // Debug: Check source fields before formatting
              console.log(`✅ Combined: ${jobs.length} jobs on this page (${dbCount} database + ${extCount} external after dedup). Total available: ${total}`);
              console.log(`🔍 Debug - Sample job sources:`, jobs.slice(0, 5).map(j => ({ id: j.id, source: j.source, title: j.title?.substring(0, 30) })));
            }
          } catch (importError) {
            console.error('❌ Failed to import job providers:', importError);
          }
        } catch (externalError) {
          console.error('❌ External job fetch failed:', externalError);
        }
      } else {
        console.log('⚠️ No search query provided or external APIs disabled, using database jobs only');
      }
      
      const beforeQuality = jobs.length;
      const professionalJobs = jobs.filter(passesJobListingQualityCheck);
      
      if (beforeQuality !== professionalJobs.length) {
        console.log(`🔄 Quality filter: Removed ${beforeQuality - professionalJobs.length} unprofessional jobs (${professionalJobs.length} professional jobs remaining)`);
      }
      
      jobs = professionalJobs;
      console.log('[jobs-pipeline] after-quality-filter', {
        jobs: jobs.length,
        removed: beforeQuality - jobs.length,
        internal: jobs.filter((j) => j.source === 'manual' || j.source === 'employer').length,
      });

      if (location.trim()) {
        const beforeLocation = jobs.length;
        jobs = jobs.filter((j) => {
          const isInternal = j.source === 'manual' || j.source === 'employer';
          if (isInternal && !String(j.location || '').trim()) return true;
          return jobMatchesListingLocation(j, location);
        });
        console.log('[jobs-pipeline] after-location-filter', {
          before: beforeLocation,
          after: jobs.length,
          internal: jobs.filter((j) => j.source === 'manual' || j.source === 'employer').length,
        });
      }

      if (isSearchActive) {
        const ranker = JobRankingService.getInstance();
        const rankings = await ranker.rankJobs(jobs, query, location);
        const scoreById = new Map(rankings.map((r) => [String(r.jobId), r.score]));
        jobs = [...jobs].sort((a, b) => {
          const aInternal =
            a.source === 'manual' || a.source === 'employer' ? 1 : 0;
          const bInternal =
            b.source === 'manual' || b.source === 'employer' ? 1 : 0;
          if (aInternal !== bInternal) return bInternal - aInternal;
          const scoreA =
            scoreById.get(String(a.id)) ??
            scoreById.get(String(a.sourceId)) ??
            0;
          const scoreB =
            scoreById.get(String(b.id)) ??
            scoreById.get(String(b.sourceId)) ??
            0;
          return scoreB - scoreA;
        });
        const pageStart = (page - 1) * limit;
        jobs = jobs.slice(pageStart, pageStart + limit);
        console.log('[jobs-pipeline] after-ranking', {
          jobs: jobs.length,
          internal: jobs.filter((j) => j.source === 'manual' || j.source === 'employer').length,
        });
      }

      // Employer/manual rows must stay visible after external merge + dedupe (do not touch external logic).
      const isEmployerJob = (j: { source?: string | null }) =>
        j.source === 'manual' || j.source === 'employer';
      jobs = [
        ...jobs.filter(isEmployerJob),
        ...jobs.filter((j) => !isEmployerJob(j)),
      ];
      
      // NO SAMPLE JOBS - Only show real jobs from APIs or database
      if (jobs.length === 0) {
        console.log(`⚠️ No real jobs found for query "${query}". Returning empty results (no fake/sample jobs).`);
      } else {
        console.log(`✅ Found ${jobs.length} professional jobs for query "${query}"`);
      }
    } catch (dbError: any) {
      // Keep this as a last-resort catch for unexpected runtime errors (not DB connectivity).
      console.error('❌ Unlimited jobs handler failed:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job search failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

    // Format jobs with SMART apply URL handling
    let formattedJobs = [];
    try {
      formattedJobs = jobs.map((job) =>
        formatListingJob(job as Record<string, unknown>, { listView: isListView })
      );
      formattedJobs = capListingWithEmployerFirst(
        [
          ...formattedJobs.filter((j) => j.source === 'manual' || j.source === 'employer'),
          ...formattedJobs.filter((j) => j.source !== 'manual' && j.source !== 'employer'),
        ],
        limit
      );

      // Debug: Check source fields after formatting
      const dbJobsAfterFormat = formattedJobs.filter(j => j.source === 'database' || j.source === 'employer').length;
      const extJobsAfterFormat = formattedJobs.filter(j => j.source === 'external' || j.source === 'adzuna' || j.source === 'jsearch' || j.source === 'jooble').length;
      console.log('[jobs-pipeline] final-response', {
        jobs: formattedJobs.length,
        internal: formattedJobs.filter((j) => j.source === 'manual' || j.source === 'employer').length,
        external: extJobsAfterFormat,
      });
      console.log(`🔍 After formatting: ${formattedJobs.length} jobs (${dbJobsAfterFormat} database + ${extJobsAfterFormat} external)`);
      console.log(`🔍 Sample formatted job sources:`, formattedJobs.slice(0, 3).map(j => ({ id: j.id, source: j.source, title: j.title?.substring(0, 30) })));
    } catch (formatError) {
      console.error('❌ Job formatting failed:', formatError);
      formattedJobs = jobs; // Return raw jobs if formatting fails
    }

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    
    // Enhanced response with unlimited search metadata
    const response = {
      success: true,
      jobs: formattedJobs,
      pagination: {
        currentPage: page,
        totalJobs: total,
        hasMore: page < totalPages,
        nextPage: page < totalPages ? page + 1 : null,
        jobsPerPage: limit,
        totalPages: totalPages
      },
      sources: {
        database: formattedJobs.filter(
          (j) =>
            j.source === 'database' ||
            j.source === 'employer' ||
            j.source === 'manual'
        ).length,
        external: formattedJobs.filter(j => j.source === 'external' || j.source === 'adzuna' || j.source === 'jsearch' || j.source === 'jooble').length,
        sample: 0
      },
      metadata: {
        sectors: Array.from(new Set(jobs.map(j => j.sector).filter(Boolean))),
        countries: Array.from(new Set(jobs.map(j => j.country).filter(Boolean))),
        searchTime: new Date().toISOString(),
        query: query,
        location: location,
        country: country,
        performance: {
          responseTimeMs: Date.now() - startTime,
          cacheHit: false,
          prismaMs: timings.prismaMs,
          externalMs: timings.externalMs,
          upsertScheduled: backgroundUpsertScheduled,
        }
      }
    };

    const manualInResponse = formattedJobs.filter(
      (j) => j.source === 'manual' || j.source === 'employer'
    ).length;
    const externalInResponse = formattedJobs.filter((j) =>
      isExternalSource(j.source)
    ).length;

    timings.totalMs = Date.now() - startTime;
    console.log('[jobs-debug] unlimited response', {
      formatted: formattedJobs.length,
      manualJobs: manualInResponse,
      externalJobs: externalInResponse,
      total,
      cacheKey: cacheKey.slice(0, 80),
    });
    logJobApiTiming('GET /api/jobs/unlimited', timings, { jobs: formattedJobs.length, total });
    // Never cache empty listings — avoids locking the UI on a bad/empty response
    if (formattedJobs.length > 0) {
      await jobCacheService.set(cacheKey, response, 'api_jobs_list');
      await jobCacheService.cacheJobsForDetail(
        formattedJobs as Record<string, unknown>[]
      );
    }

    console.log(`✅ Unlimited Jobs API: Successfully returned ${formattedJobs.length} jobs (${total} total)`);
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'private, no-store' },
    });

  } catch (error: any) {
    console.error('❌ Unlimited job search failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Job search failed',
        details: error.message,
        jobs: [],
        pagination: {
          currentPage: 1,
          totalJobs: 0,
          hasMore: false,
          nextPage: null,
          jobsPerPage: 0,
          totalPages: 0
        },
        sources: { database: 0, external: 0, sample: 0 },
        metadata: {
          sectors: [],
          countries: [],
          searchTime: new Date().toISOString(),
          query: '',
          location: '',
          country: 'IN'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  // Redirect POST to GET for consistency
  return GET(_request);
}

export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
