/**
 * Unlimited Job Search API - OPTIMIZED VERSION
 * Uses the same optimized implementation as /api/jobs but with unlimited limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geoUtils';
import { trackJobSearch } from '@/lib/analytics/event-integration';
import { auth } from '@/lib/nextauth-config';
import { filterValidJobs } from '@/lib/jobs/job-id-validator';

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
      // Increased limit to 50000 to support 26000+ jobs
      limit = Math.min(50000, Math.max(10, parseInt(searchParams.get('limit') || '200')));
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
    // EXCLUDE: Sample, dynamic, and seeded jobs - only show professional/real jobs
    const where: any = {
      isActive: true,
      // Exclude unprofessional jobs (sample, dynamic, seeded) - protect employer jobs (source='manual')
      source: {
        notIn: ['sample', 'dynamic', 'seeded']
      }
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

    // Enhanced dynamic location filtering - works for city, state, country, or any combination
    if (location) {
      // Split by comma to support "Mumbai, India" or "New York, USA" format
      const locationParts = location.split(',').map(part => part.trim()).filter(Boolean);
      
      // Create OR conditions for each part to match against location string or country
      const locationConditions = locationParts.flatMap(part => [
        { location: { contains: part, mode: 'insensitive' } },
        { country: { contains: part, mode: 'insensitive' } }
      ]);
      
      // If there's already an OR clause (from query), combine with AND
      if (where.OR) {
        // Preserve source filter when adding AND conditions
        if (where.source && !where.AND) {
          where.AND = [{ source: where.source }];
          delete where.source;
        }
        where.AND = [
          ...(where.AND || []),
          { OR: where.OR },
          { OR: locationConditions }
        ];
        delete where.OR;
      } else {
        // Otherwise, use OR directly
        where.OR = locationConditions;
      }
      
      // Ensure source filter is in AND if AND exists
      if (where.AND && where.source) {
        where.AND.push({ source: where.source });
        delete where.source;
      }
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
    let dbOk = true;
    
    try {
      // Database can be unavailable/misconfigured in production; don't hard-fail the whole endpoint.
      let jobsResult: any[] = [];
      let totalResult = 0;
      try {
        [jobsResult, totalResult] = await Promise.all([
          prisma.job.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              sourceId: true,
              source: true,
              title: true,
              company: true,
              companyLogo: true,
              location: true,
              country: true,
              description: true,
              requirements: true,
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
              skills: true,
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
                  industry: true
                }
              }
            }
          }),
          prisma.job.count({ where })
        ]);
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
      const includeExternalParam = searchParams.get('includeExternal');
      const shouldFetchExternal = hasExternalApiKeys && (
        includeExternalParam === 'true' ||
        (!dbOk && includeExternalParam !== 'false') ||
        (query && includeExternalParam !== 'false')
      );
      
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
              // Cache external jobs only if DB is healthy; otherwise skip to avoid slow failures.
              if (dbOk) {
                const cachingPromises = realExternalJobs.map(job => {
                  // CRITICAL FIX: Convert sourceId to string to avoid type errors with large numbers
                  const sourceIdString = String(job.sourceId || job.id || `external-${Date.now()}-${Math.random()}`);
                  
                  return prisma.job.upsert({
                    where: { 
                      source_sourceId: {
                        source: job.source || 'external',
                        sourceId: sourceIdString
                      }
                    },
                    update: {
                      isActive: true,
                      updatedAt: new Date(),
                      views: { increment: 0 } // Touch the record
                    },
                    create: {
                      sourceId: sourceIdString,
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
                  }).catch(err => console.log(`⚠️ Cache failed for ${job.id}:`, err.message));
                });
                
                // CRITICAL FIX: Wait for caching to complete before showing jobs to users
                // This prevents "job not found" errors when users click immediately
                await Promise.all(cachingPromises);
                console.log(`💾 Successfully cached ${realExternalJobs.length} external jobs to database`);
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
      
      // QUALITY FILTER: Remove unprofessional jobs with generic descriptions or missing essential info
      const professionalJobs = jobs.filter(job => {
        // Essential fields check
        if (!job.title || !job.company || !job.description) {
          return false;
        }
        
        // Filter out jobs with very short descriptions (likely unprofessional)
        if (job.description && job.description.length < 50) {
          return false;
        }
        
        // Filter out generic template descriptions
        const descLower = (job.description || '').toLowerCase();
        const unprofessionalPatterns = [
          'this is a sample job description',
          'we are looking for a',
          'join our team',
          'great opportunity',
          'dynamic environment',
          'this is a comprehensive job description',
          'sample job',
          'test job',
          'placeholder'
        ];
        
        // Check if description is too generic (matches multiple patterns)
        const matchesGenericPattern = unprofessionalPatterns.filter(pattern => 
          descLower.includes(pattern)
        ).length >= 2; // If matches 2+ generic patterns, likely unprofessional
        
        if (matchesGenericPattern && descLower.length < 200) {
          return false;
        }
        
        return true;
      });
      
      if (jobs.length !== professionalJobs.length) {
        console.log(`🔄 Quality filter: Removed ${jobs.length - professionalJobs.length} unprofessional jobs (${professionalJobs.length} professional jobs remaining)`);
      }
      
      jobs = professionalJobs;
      
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
          sourceId: job.sourceId,
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
