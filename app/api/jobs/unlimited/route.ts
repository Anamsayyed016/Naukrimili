/**
 * Unlimited Job Search API - OPTIMIZED VERSION
 * Uses the same optimized implementation as /api/jobs but with unlimited limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geoUtils';
import { trackJobSearch } from '@/lib/analytics/event-integration';
import { auth } from '@/lib/nextauth-config';

/**
 * ENHANCED: Smart duplicate removal - handles variations and prioritizes database jobs
 */
function removeDuplicateJobs(jobs: any[]): any[] {
  const seenByKey = new Map<string, any>();
  const seenById = new Map<string, any>(); // Track by ID to ensure uniqueness and preserve source
  
  jobs.forEach(job => {
    // Create multiple keys for better duplicate detection
    const title = (job.title || '').toLowerCase().trim();
    const company = (job.company || job.companyRelation?.name || '').toLowerCase().trim();
    const location = (job.location || job.companyRelation?.location || '').toLowerCase().trim();
    
    // Primary key: exact match
    const primaryKey = `${title}|${company}|${location}`;
    
    // Secondary key: title + company only (for location variations)
    const secondaryKey = `${title}|${company}`;
    
    // Job ID for final deduplication
    const jobId = job.id || job.sourceId || `${job.source || 'unknown'}-${job.sourceId || 'unknown'}`;
    
    // Check if we've seen this job before by key
    const existingByKey = seenByKey.get(primaryKey) || seenByKey.get(secondaryKey);
    
    if (!existingByKey) {
      // New job - add it
      seenByKey.set(primaryKey, job);
      seenByKey.set(secondaryKey, job);
      seenById.set(jobId, job);
    } else {
      // Potential duplicate - prefer database/employer jobs over external jobs
      const existingById = seenById.get(jobId);
      if (existingById) {
        // Same job by ID - keep the one with better source (database/employer > external)
        const jobSourcePriority = job.source === 'employer' ? 3 : (job.source === 'database' ? 2 : 1);
        const existingSourcePriority = existingById.source === 'employer' ? 3 : (existingById.source === 'database' ? 2 : 1);
        
        if (jobSourcePriority > existingSourcePriority) {
          seenById.set(jobId, job);
          seenByKey.set(primaryKey, job);
          seenByKey.set(secondaryKey, job);
        }
      } else {
        // Different job ID but similar content (same title+company+location)
        // NEVER replace database/employer jobs with external jobs
        const existingIsDatabase = existingByKey.source === 'database' || existingByKey.source === 'employer';
        const jobIsDatabase = job.source === 'database' || job.source === 'employer';
        
        if (jobIsDatabase && !existingIsDatabase) {
          // New job is database/employer, existing is external - replace it
          seenByKey.set(primaryKey, job);
          seenByKey.set(secondaryKey, job);
          seenById.set(jobId, job);
        } else if (!existingIsDatabase && jobIsDatabase) {
          // Existing is external, new is database - replace it (this should not happen if we process database jobs first)
          seenByKey.set(primaryKey, job);
          seenByKey.set(secondaryKey, job);
          seenById.set(jobId, job);
        }
        // If both are database or both are external, keep the existing one (first come, first served)
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

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Unlimited job search API called (OPTIMIZED VERSION)');
    
    // Get session for analytics tracking
    const session = await auth();
    
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
    
    // Unlimited parameters
    let page = 1;
    let limit = Math.min(500, Math.max(10, parseInt(searchParams.get('limit') || '200'))); // Unlimited limit
    let radius = 25;
    let userLat = 0;
    let userLng = 0;
    
    try {
      page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      limit = Math.min(2000, Math.max(10, parseInt(searchParams.get('limit') || '200')));
      radius = Math.max(5, Math.min(100, parseInt(searchParams.get('radius') || '25')));
      userLat = parseFloat(searchParams.get('lat') || '0');
      userLng = parseFloat(searchParams.get('lng') || '0');
    } catch (parseError) {
      console.warn('⚠️ Parameter parsing failed, using defaults:', parseError);
    }

    console.log(`🔍 Unlimited search params:`, {
      query, location, country, page, limit, includeExternal: searchParams.get('includeExternal'),
      includeDatabase: searchParams.get('includeDatabase')
    });

    // Build database query with enhanced filtering
    const where: any = {
      isActive: true
    };

    // Enhanced text search with multiple fields
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
        { skills: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Location-based filtering with variations
    if (location) {
      const locationVariations = [
        location,
        location.toLowerCase(),
        location.toUpperCase(),
        ...location.split(' ').map(word => word.toLowerCase())
      ];
      
      where.OR = where.OR ? [
        ...where.OR,
        { location: { in: locationVariations, mode: 'insensitive' } }
      ] : [
        { location: { in: locationVariations, mode: 'insensitive' } }
      ];
    }

    // Company filtering
    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    // Enhanced job type filtering
    if (jobType && jobType !== 'all') {
      where.jobType = { contains: jobType, mode: 'insensitive' };
    }

    // Experience level filtering
    if (experienceLevel && experienceLevel !== 'all') {
      where.OR = where.OR ? [
        ...where.OR,
        { experienceLevel: { contains: experienceLevel, mode: 'insensitive' } }
      ] : [
        { experienceLevel: { contains: experienceLevel, mode: 'insensitive' } }
      ];
    }

    // Remote work filtering
    if (isRemote) {
      where.isRemote = true;
    }

    // Sector filtering
    if (sector) {
      where.sector = { contains: sector, mode: 'insensitive' };
    }

    // Country filtering
    if (country) {
      where.country = country.toUpperCase();
    }

    // Salary filtering
    if (salaryMin) {
      where.salaryMin = { gte: parseInt(salaryMin) };
    }
    if (salaryMax) {
      where.salaryMax = { lte: parseInt(salaryMax) };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    console.log(`🔍 Database query built:`, { where, skip, limit });

    // Fetch jobs from database with company relations
    let jobs: any[] = [];
    let total = 0;
    
    try {
      const [jobsResult, totalResult] = await Promise.all([
        prisma.job.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            companyRelation: {
              select: {
                name: true,
                logo: true,
                location: true,
                industry: true
              }
            }
          }
        }),
        prisma.job.count({ where })
      ]);
      
      jobs = jobsResult.map(job => ({
        ...job,
        source: job.source || 'database' // Ensure database jobs have source field set
      }));
      total = totalResult;
      
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
      
      // Fetch external jobs in parallel for speed (like other job portals)
      // Fetch external jobs if includeExternal=true (even without query) or if query is provided
      const shouldFetchExternal = hasExternalApiKeys && 
        (searchParams.get('includeExternal') === 'true' || (query && searchParams.get('includeExternal') !== 'false'));
      
      if (shouldFetchExternal) {
        // Use a default query if none provided to fetch popular jobs
        const searchQuery = query || 'developer OR engineer OR manager OR analyst OR designer';
        
        console.log(`🚀 Fetching jobs from ${[hasAdzuna && 'Adzuna', hasRapidAPI && 'JSearch', hasJooble && 'Jooble'].filter(Boolean).join(', ')}`);
        
        try {
          let realExternalJobs: any[] = [];
          const apiStartTime = Date.now();
          
          // PARALLEL API CALLS - All 3 APIs called simultaneously for maximum speed
          const externalPromises = [];
          
          try {
            const { fetchFromAdzuna, fetchFromJooble } = await import('@/lib/jobs/providers');
            const { fetchFromJSearch } = await import('@/lib/jobs/dynamic-providers');
            const { getCountriesToFetch } = await import('@/lib/utils/country-detection');
            
            // SMART COUNTRY DETECTION: Fetch from appropriate countries based on location
            const countriesToFetch = getCountriesToFetch({ location, country });
            
            console.log(`🌍 Fetching jobs from ${countriesToFetch.length} countries:`, 
              countriesToFetch.map(c => c.name).join(', '));
            
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
            
            // Wait for ALL APIs in parallel (FAST like Indeed/LinkedIn)
            if (externalPromises.length > 0) {
              const externalResults = await Promise.allSettled(externalPromises);
              const apiNames = [hasAdzuna && 'Adzuna', hasRapidAPI && 'JSearch', hasJooble && 'Jooble'].filter(Boolean);
              
              // Collect results from all successful APIs
              externalResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value && Array.isArray(result.value) && result.value.length > 0) {
                  console.log(`✅ ${apiNames[index]}: ${result.value.length} jobs`);
                  // Normalize source field for external jobs
                  const jobsWithSource = result.value.map((job: any) => ({
                    ...job,
                    source: job.source || apiNames[index]?.toLowerCase() || 'external'
                  }));
                  realExternalJobs.push(...jobsWithSource);
                }
              });
              
              const apiDuration = Date.now() - apiStartTime;
              console.log(`⚡ API calls completed in ${apiDuration}ms`);
            }
            
            // OPTIMIZED: Fast caching and deduplication
            if (realExternalJobs.length > 0) {
              // Cache external jobs in background (non-blocking)
              const cachingPromises = realExternalJobs.map(job => 
                prisma.job.upsert({
                  where: { 
                    source_sourceId: {
                      source: job.source || 'external',
                      sourceId: job.sourceId || job.id
                    }
                  },
                  update: {
                    isActive: true,
                    updatedAt: new Date(),
                    views: { increment: 0 } // Touch the record
                  },
                  create: {
                    sourceId: job.sourceId || job.id,
                    source: job.source || 'external',
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    country: job.country || country,
                    description: job.description,
                    requirements: job.requirements || '',
                    applyUrl: job.source_url || job.applyUrl,
                    source_url: job.source_url || job.applyUrl,
                    postedAt: job.postedAt ? new Date(job.postedAt) : new Date(),
                    salary: job.salary,
                    salaryMin: job.salaryMin,
                    salaryMax: job.salaryMax,
                    salaryCurrency: job.salaryCurrency || 'INR',
                    jobType: job.jobType || 'Full-time',
                    experienceLevel: job.experienceLevel || 'Mid Level',
                    skills: JSON.stringify(job.skills || []),
                    isRemote: job.isRemote || false,
                    isHybrid: job.isHybrid || false,
                    isUrgent: false,
                    isFeatured: false,
                    isActive: true,
                    sector: job.sector || 'General',
                    views: 0,
                    applicationsCount: 0,
                    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry
                  }
                }).catch(err => console.log(`⚠️ Cache failed for ${job.id}:`, err.message))
              );
              
              // Don't wait for caching - let it happen in background
              Promise.all(cachingPromises).then(() => 
                console.log(`💾 Cached ${realExternalJobs.length} external jobs`)
              );
              
              // SMART DEDUPLICATION: Combine and deduplicate efficiently
              // IMPORTANT: Put database jobs first so they're processed first in deduplication
              const databaseJobsCountBeforeDedup = jobs.length;
              const combinedJobs = [...jobs, ...realExternalJobs]; // Database jobs first, then external
              jobs = removeDuplicateJobs(combinedJobs);
              
              // Calculate total: database total + external jobs fetched
              // Note: External jobs are fetched fresh each time, so we add the count we got
              // Database total (totalResult) represents all matching jobs in DB across all pages
              total = totalResult + realExternalJobs.length;
              
              // Debug: Check source fields before formatting
              const dbJobsBeforeFormat = jobs.filter(j => (j.source === 'database' || j.source === 'employer')).length;
              const extJobsBeforeFormat = jobs.filter(j => (j.source === 'external' || j.source === 'adzuna' || j.source === 'jsearch' || j.source === 'jooble')).length;
              
              console.log(`✅ Combined: ${jobs.length} jobs on this page (${dbJobsBeforeFormat} database + ${extJobsBeforeFormat} external after dedup). Total available: ${total} (${totalResult} database + ${realExternalJobs.length} external)`);
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
      
      // NO SAMPLE JOBS - Only show real jobs from APIs or database
      if (jobs.length === 0) {
        console.log(`⚠️ No real jobs found for query "${query}". Returning empty results (no fake/sample jobs).`);
      } else {
        console.log(`✅ Found ${jobs.length} real jobs for query "${query}"`);
      }
    } catch (dbError: any) {
      console.error('❌ Database query failed:', dbError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query failed',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      );
    }

    // Format jobs with SMART apply URL handling
    let formattedJobs = [];
    try {
      formattedJobs = jobs.map(job => {
        // SMART APPLY URL: External jobs -> direct link, Employer jobs -> internal application
        let applyUrl = job.applyUrl;
        const isExternalJob = job.source === 'external' || job.source === 'adzuna' || 
                             job.source === 'jsearch' || job.source === 'jooble' ||
                             job.source === 'rapidapi';
        
        if (isExternalJob) {
          // External job: Use source_url (direct application link)
          applyUrl = job.source_url || job.applyUrl;
        } else {
          // Employer/Database job: Use internal application page
          applyUrl = `/jobs/${job.id}/apply`;
        }
        
        const baseJob = {
          id: job.id,
          title: job.title,
          company: job.company || job.companyRelation?.name,
          companyLogo: job.companyLogo || job.companyRelation?.logo,
          location: job.location,
          country: job.country,
          description: job.description,
          applyUrl: applyUrl,
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
          distance: job.distance
        };

        return baseJob;
      });
      
      // Debug: Check source fields after formatting
      const dbJobsAfterFormat = formattedJobs.filter(j => j.source === 'database' || j.source === 'employer').length;
      const extJobsAfterFormat = formattedJobs.filter(j => j.source === 'external' || j.source === 'adzuna' || j.source === 'jsearch' || j.source === 'jooble').length;
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
        database: formattedJobs.filter(j => j.source === 'database' || j.source === 'employer').length,
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
          apiCalls: 3 // All 3 APIs called in parallel
        }
      }
    };

    console.log(`✅ Unlimited Jobs API: Successfully returned ${formattedJobs.length} jobs (${total} total)`);
    return NextResponse.json(response);

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
  return GET(request);
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
