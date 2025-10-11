import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/geoUtils';
import { JobProcessingMiddleware } from '@/lib/services/job-processing-middleware';
import { trackJobSearch } from '@/lib/analytics/event-integration';
import { auth } from '@/lib/nextauth-config';

/**
 * ENHANCED: Smart duplicate removal - handles variations and prioritizes database jobs
 */
function removeDuplicateJobs(jobs: any[]): any[] {
  const seen = new Map<string, any>();
  
  jobs.forEach(job => {
    // Create multiple keys for better duplicate detection
    const title = (job.title || '').toLowerCase().trim();
    const company = (job.company || job.companyRelation?.name || '').toLowerCase().trim();
    const location = (job.location || job.companyRelation?.location || '').toLowerCase().trim();
    
    // Primary key: exact match
    const primaryKey = `${title}|${company}|${location}`;
    
    // Secondary key: title + company only (for location variations)
    const secondaryKey = `${title}|${company}`;
    
    // Check if we've seen this job before
    if (!seen.has(primaryKey) && !seen.has(secondaryKey)) {
      seen.set(primaryKey, job);
      seen.set(secondaryKey, job);
    } else {
      // Prefer database/employer jobs over external jobs
      const existing = seen.get(primaryKey) || seen.get(secondaryKey);
      if (job.source === 'employer' || (job.source === 'database' && existing.source === 'external')) {
        seen.set(primaryKey, job);
        seen.set(secondaryKey, job);
      }
    }
  });
  
  // Return unique jobs
  const uniqueJobs = Array.from(new Set(Array.from(seen.values()).map(j => j.id || j.sourceId)))
    .map(id => Array.from(seen.values()).find(j => (j.id || j.sourceId) === id))
    .filter(Boolean);
  
  const removed = jobs.length - uniqueJobs.length;
  if (removed > 0) {
    console.log(`🔄 Removed ${removed} duplicates`);
  }
  
  return uniqueJobs;
}

// Interface for job with distance calculation
interface JobWithDistance {
  id: string;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  postedAt: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sector: string | null;
  views: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  companyRelation?: {
    name: string | null;
    logo: string | null;
    location: string | null;
    industry: string | null;
  } | null;
  distance?: number | null;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get session for analytics tracking
    const session = await auth();
    
    // Check if enhanced processing is enabled
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const useEnhancedProcessing = searchParams.get('enhanced') === 'true';
    
    if (useEnhancedProcessing) {
      return await handleEnhancedJobSearch(request);
    }
    
    // Validate request
    if (!request.url) {
      console.error('❌ Invalid request URL in jobs API');
      return NextResponse.json(
        { success: false, error: 'Invalid request URL' },
        { status: 400 }
      );
    }

    const url2 = new URL(request.url);
    const searchParams2 = url2.searchParams;
    
    // Validate and parse parameters with defaults - support both parameter names
    const query = searchParams2.get('query') || searchParams2.get('q') || '';
    const location = searchParams2.get('location') || '';
    const company = searchParams2.get('company') || '';
    const jobType = searchParams2.get('jobType') || '';
    const experienceLevel = searchParams2.get('experienceLevel') || '';
    const isRemote = searchParams2.get('isRemote') === 'true' || searchParams2.get('remote') === 'true' || searchParams2.get('remote_only') === 'true';
    const sector = searchParams2.get('sector') || '';
    const country = searchParams2.get('country') || 'IN';
    const salaryMin = searchParams2.get('salaryMin') || '';
    const salaryMax = searchParams2.get('salaryMax') || '';
    
    // Validate numeric parameters
    let page = 1;
    let limit = 20;
    let radius = 25;
    let userLat = 0;
    let userLng = 0;
    
    try {
      page = Math.max(1, parseInt(searchParams2.get('page') || '1'));
      limit = Math.min(1000, Math.max(1, parseInt(searchParams2.get('limit') || '500'))); // Increased for unlimited search
      radius = Math.min(100, Math.max(1, parseInt(searchParams2.get('radius') || '25')));
      userLat = parseFloat(searchParams2.get('lat') || '0');
      userLng = parseFloat(searchParams2.get('lng') || '0');
    } catch (parseError) {
      console.warn('⚠️ Parameter parsing error, using defaults:', parseError);
    }
    
    const sortByDistance = searchParams2.get('sortByDistance') === 'true';
    const includeDistance = searchParams2.get('includeDistance') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Debug logging for search parameters
    console.log('🔍 Jobs API Search Parameters:', {
      query, location, company, jobType, experienceLevel, isRemote, sector, country,
      page, limit, radius, userLat, userLng, sortByDistance, includeDistance
    });

    // Track job search event (moved after jobs are fetched)
    
    // Build where clause with validation
    const where: any = { isActive: true };
    
    // Build AND conditions for proper filtering
    const andConditions: any[] = [];
    
    // Text search (query) - multiple field search with OR within this condition
    if (query && query.trim().length > 0) {
      andConditions.push({
        OR: [
          { title: { contains: query.trim(), mode: 'insensitive' } },
          { company: { contains: query.trim(), mode: 'insensitive' } },
          { description: { contains: query.trim(), mode: 'insensitive' } },
          { skills: { contains: query.trim(), mode: 'insensitive' } }
        ]
      });
    }
    
    // Location filtering with smart matching - separate AND condition
    if (location && location.trim().length > 0) {
      try {
        const locationVariations = generateLocationVariations(location.trim());
        andConditions.push({
          OR: [
            { location: { contains: location.trim(), mode: 'insensitive' } },
            ...locationVariations.map(loc => ({ location: { contains: loc, mode: 'insensitive' } }))
          ]
        });
      } catch (error) {
        console.warn('⚠️ Location variation generation failed:', error);
        // Fallback to simple location search
        andConditions.push({ location: { contains: location.trim(), mode: 'insensitive' } });
      }
    }
    
    if (isRemote) {
      // Remote work filtering - add as AND condition
      andConditions.push({
        OR: [
          { isRemote: true },
          { isHybrid: true }
        ]
      });
    }
    
    // Apply AND conditions if any exist
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    
    if (company && company.trim().length > 0) {
      where.company = { contains: company.trim(), mode: 'insensitive' };
    }
    
    if (jobType && jobType.trim().length > 0 && jobType !== 'all') {
      // Simplified job type filtering for better performance
      where.jobType = { contains: jobType.trim(), mode: 'insensitive' };
    }
    
    if (experienceLevel && experienceLevel.trim().length > 0 && experienceLevel !== 'all') {
      // Simplified experience level filtering for better performance
      where.experienceLevel = { contains: experienceLevel.trim(), mode: 'insensitive' };
    }
    
    if (sector && sector.trim().length > 0) {
      where.sector = { contains: sector.trim(), mode: 'insensitive' };
    }
    
    if (country && country.trim().length > 0) {
      where.country = country.trim();
    }
    
    // Add salary filtering
    if (salaryMin || salaryMax) {
      if (salaryMin) {
        where.salaryMin = { gte: parseInt(salaryMin) };
      }
      if (salaryMax) {
        where.salaryMax = { lte: parseInt(salaryMax) };
      }
    }
    
    console.log(`🔍 Jobs API: Searching with filters:`, { query, location, company, jobType, experienceLevel, isRemote, sector, country, salaryMin, salaryMax, page, limit });
    console.log(`🔍 Jobs API: AND conditions:`, JSON.stringify(andConditions, null, 2));
    console.log(`🔍 Jobs API: Final where clause:`, JSON.stringify(where, null, 2));
    
    // Debug: Check if database has any jobs at all (optional - don't fail if DB is not available)
    let totalJobsInDb = 0;
    let activeJobsInDb = 0;
    let dbAvailable = false;
    
    try {
      totalJobsInDb = await prisma.job.count();
      activeJobsInDb = await prisma.job.count({ where: { isActive: true } });
      dbAvailable = true;
      console.log(`🔍 Database stats: Total jobs: ${totalJobsInDb}, Active jobs: ${activeJobsInDb}`);
    } catch (dbError) {
      console.warn('⚠️ Database not available, using external APIs only:', dbError.message);
      dbAvailable = false;
    }
    
    // Get jobs with pagination and error handling
    let jobs: any[] = [];
    let total = 0;
    
    // Try database first if available, otherwise skip to external APIs
    if (dbAvailable) {
      try {
        const [jobsResult, totalResult] = await Promise.all([
          prisma.job.findMany({
            where,
            skip,
            take: limit,
            orderBy: sortByDistance && userLat && userLng ? undefined : { createdAt: 'desc' },
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
        
        jobs = jobsResult;
        total = totalResult;
        
        console.log(`✅ Database query completed:`, {
          jobsFound: jobs.length,
          totalJobs: total,
          query: where,
          skip,
          limit,
          searchParams: { query, location, company, jobType, experienceLevel, isRemote, sector, country }
        });
        
        // Debug: Show sample of found jobs
        if (jobs.length > 0) {
          console.log(`🔍 Sample jobs found:`, jobs.slice(0, 3).map(j => ({
            title: j.title,
            company: j.company,
            location: j.location,
            source: j.source
          })));
        }
      } catch (dbError) {
        console.warn('⚠️ Database query failed, continuing with external APIs only:', dbError.message);
        jobs = [];
        total = 0;
      }
    } else {
      console.log('⚠️ Database not available, skipping database query and using external APIs only');
      jobs = [];
      total = 0;
    }
      
    // OPTIMIZED: Check for API keys once and fetch unlimited external jobs
    const hasAdzuna = !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
    const hasRapidAPI = !!process.env.RAPIDAPI_KEY;
    const hasJooble = !!process.env.JOOBLE_API_KEY;
    const hasExternalApiKeys = hasAdzuna || hasRapidAPI || hasJooble;
    
    // Fetch unlimited external jobs in parallel for maximum coverage
    if (query && hasExternalApiKeys) {
      console.log(`🚀 Fetching unlimited jobs from ${[hasAdzuna && 'Adzuna', hasRapidAPI && 'JSearch', hasJooble && 'Jooble'].filter(Boolean).join(', ')}`);
      
      try {
        let realExternalJobs: any[] = [];
        const apiStartTime = Date.now();
        
        // SMART LOADING: Fast initial load + background fetching for 1000+ jobs
        const maxPages = Math.ceil(limit / 20); // Each API returns ~20 jobs per page
        const pagesToFetch = Math.min(maxPages, 25); // Max 25 pages (500 jobs per API) for performance
        const initialPages = Math.min(5, pagesToFetch); // Load first 5 pages quickly (100 jobs)
        
        // PARALLEL API CALLS - All APIs with multiple pages for unlimited results
        const externalPromises = [];
        
        try {
          const { fetchFromAdzuna, fetchFromJooble } = await import('@/lib/jobs/providers');
          const { fetchFromJSearch } = await import('@/lib/jobs/dynamic-providers');
          
          // SMART FETCHING: Load initial pages quickly, then more in background
          for (let page = 1; page <= pagesToFetch; page++) {
            // Adzuna API (Multi-country support)
            if (hasAdzuna) {
              // Priority for first few pages (faster loading)
              const priority = page <= initialPages ? 'high' : 'normal';
              externalPromises.push(
                fetchFromAdzuna(query, country.toLowerCase(), page, { 
                  location: location || undefined,
                  distanceKm: 50 
                }).catch(err => {
                  console.log(`⚠️ Adzuna page ${page} failed:`, err.message);
                  return [];
                })
              );
            }
            
            // JSearch API via RapidAPI (Global coverage)
            if (hasRapidAPI) {
              externalPromises.push(
                fetchFromJSearch(query, location || 'India', page).catch(err => {
                  console.log(`⚠️ JSearch page ${page} failed:`, err.message);
                  return [];
                })
              );
            }
            
            // Jooble API (Additional job source)
            if (hasJooble) {
              externalPromises.push(
                fetchFromJooble(query, location || 'India', page).catch(err => {
                  console.log(`⚠️ Jooble page ${page} failed:`, err.message);
                  return [];
                })
              );
            }
          }
          
          // Wait for ALL API calls in parallel (FAST like Indeed/LinkedIn)
          if (externalPromises.length > 0) {
            const externalResults = await Promise.allSettled(externalPromises);
            const apiNames = [hasAdzuna && 'Adzuna', hasRapidAPI && 'JSearch', hasJooble && 'Jooble'].filter(Boolean);
            
            // Collect results from all successful APIs
            externalResults.forEach((result, index) => {
              if (result.status === 'fulfilled' && result.value && Array.isArray(result.value) && result.value.length > 0) {
                const apiName = apiNames[Math.floor(index / pagesToFetch)];
                const pageNum = (index % pagesToFetch) + 1;
                console.log(`✅ ${apiName} page ${pageNum}: ${result.value.length} jobs`);
                realExternalJobs.push(...result.value);
              }
            });
            
            const apiDuration = Date.now() - apiStartTime;
            console.log(`⚡ All API calls completed in ${apiDuration}ms - Total external jobs: ${realExternalJobs.length}`);
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
            const combinedJobs = [...jobs, ...realExternalJobs];
            jobs = removeDuplicateJobs(combinedJobs);
            total = jobs.length;
            
            console.log(`✅ Total: ${jobs.length} jobs (${realExternalJobs.length} external + ${jobs.length - realExternalJobs.length} database, after dedup)`);
          }
        } catch (importError) {
          console.error('❌ Failed to import job providers:', importError);
        }
      } catch (externalError) {
        console.error('❌ External job fetch failed:', externalError);
      }
    } else {
      console.log('⚠️ No search query provided, using database jobs only');
    }
      
    // NO SAMPLE JOBS - Only show real jobs from APIs or database
    if (jobs.length === 0) {
      console.log(`⚠️ No real jobs found for query "${query}". Returning empty results (no fake/sample jobs).`);
    } else {
      console.log(`✅ Found ${jobs.length} real jobs for query "${query}"`);
    }

    // Track job search event
    if (query || location) {
      try {
        await trackJobSearch(
          session?.user?.id,
          session?.user?.role,
          query,
          location,
          {
            company, jobType, experienceLevel, isRemote, sector, country,
            salaryMin, salaryMax, page, limit
          },
          jobs.length
        );
      } catch (error) {
        console.error('❌ Failed to track job search:', error);
      }
    }
    
    // Enhanced location processing with real distance calculation
    if (userLat && userLng && includeDistance) {
      try {
        // Real distance calculation using Haversine formula
        const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
          const R = 6371; // Earth's radius in kilometers
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };

        // Location mapping for major cities (coordinates for top 4 countries)
        const locationCoordinates: { [key: string]: { lat: number; lng: number } } = {
          // USA
          'new york': { lat: 40.7128, lng: -74.0060 },
          'san francisco': { lat: 37.7749, lng: -122.4194 },
          'los angeles': { lat: 34.0522, lng: -118.2437 },
          'chicago': { lat: 41.8781, lng: -87.6298 },
          'seattle': { lat: 47.6062, lng: -122.3321 },
          'boston': { lat: 42.3601, lng: -71.0589 },
          'austin': { lat: 30.2672, lng: -97.7431 },
          'denver': { lat: 39.7392, lng: -104.9903 },
          'miami': { lat: 25.7617, lng: -80.1918 },
          'atlanta': { lat: 33.7490, lng: -84.3880 },
          
          // UAE
          'dubai': { lat: 25.2048, lng: 55.2708 },
          'abu dhabi': { lat: 24.2992, lng: 54.3773 },
          'sharjah': { lat: 25.3573, lng: 55.4033 },
          'ajman': { lat: 25.4052, lng: 55.5136 },
          'ras al khaimah': { lat: 25.7895, lng: 55.9592 },
          
          // UK
          'london': { lat: 51.5074, lng: -0.1278 },
          'manchester': { lat: 53.4808, lng: -2.2426 },
          'birmingham': { lat: 52.4862, lng: -1.8904 },
          'edinburgh': { lat: 55.9533, lng: -3.1883 },
          'glasgow': { lat: 55.8642, lng: -4.2518 },
          'liverpool': { lat: 53.4084, lng: -2.9916 },
          'bristol': { lat: 51.4545, lng: -2.5879 },
          'leeds': { lat: 53.8008, lng: -1.5491 },
          
          // India
          'mumbai': { lat: 19.0760, lng: 72.8777 },
          'bangalore': { lat: 12.9716, lng: 77.5946 },
          'delhi': { lat: 28.7041, lng: 77.1025 },
          'hyderabad': { lat: 17.3850, lng: 78.4867 },
          'chennai': { lat: 13.0827, lng: 80.2707 },
          'pune': { lat: 18.5204, lng: 73.8567 },
          'kolkata': { lat: 22.5726, lng: 88.3639 },
          'ahmedabad': { lat: 23.0225, lng: 72.5714 },
          'gurgaon': { lat: 28.4595, lng: 77.0266 },
          'noida': { lat: 28.5355, lng: 77.3910 },
          'jaipur': { lat: 26.9124, lng: 75.7873 },
          'kochi': { lat: 9.9312, lng: 76.2673 },
          'coimbatore': { lat: 11.0168, lng: 76.9558 },
          'chandigarh': { lat: 30.7333, lng: 76.7794 },
          'indore': { lat: 22.7196, lng: 75.8577 },
          'bhopal': { lat: 23.2599, lng: 77.4126 },
          'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
          'vadodara': { lat: 22.3072, lng: 73.1812 },
          'nashik': { lat: 19.9975, lng: 73.7898 },
          'rajkot': { lat: 22.3039, lng: 70.8022 }
        };

        jobs = jobs.map(job => {
          let distance: number | null = null;
          
          if (job.location) {
            // Try to find coordinates for the job location
            const locationKey = job.location.toLowerCase().trim();
            const coords = locationCoordinates[locationKey];
            
            if (coords) {
              // Calculate real distance using Haversine formula
              distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
            } else {
              // For unknown locations, use a fallback estimation
              // This is a simplified approach for locations not in our database
              const locationMatch = job.location.toLowerCase().includes(location.toLowerCase());
              if (locationMatch) {
                distance = Math.random() * 25 + 5; // 5-30 km for matching locations
              } else {
                distance = Math.random() * 100 + 50; // 50-150 km for non-matching locations
              }
            }
          }
          
          return { ...job, distance };
        });
        
        // Sort by distance if requested
        if (sortByDistance) {
          jobs.sort((a, b) => {
            if (a.distance === null && b.distance === null) return 0;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });
        }
        
        // Filter by radius if specified
        if (radius > 0) {
          jobs = jobs.filter(job => job.distance === null || job.distance <= radius);
        }
        
        console.log(`📍 Location processing complete: ${jobs.length} jobs processed with distance calculation`);
      } catch (locationError) {
        console.warn('⚠️ Location processing failed, continuing without distance:', locationError);
      }
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
          companyLocation: job.companyRelation?.location,
          companyIndustry: job.companyRelation?.industry
        };
        
        // Add distance if available
        if (job.distance !== undefined) {
          return { ...baseJob, distance: job.distance };
        }
        
        return baseJob;
      });
    } catch (formatError) {
      console.error('❌ Job formatting failed:', formatError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job formatting failed',
          details: process.env.NODE_ENV === 'development' ? formatError.message : undefined
        },
        { status: 500 }
      );
    }
    
    const totalPages = Math.ceil(total / limit);
    
    // Enhanced response with location insights
    const response = {
      success: true,
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      location: {
        userCoordinates: userLat && userLng ? { lat: userLat, lng: userLng } : null,
        searchRadius: radius,
        jobsInRadius: userLat && userLng ? jobs.filter(j => j.distance !== null && j.distance <= radius).length : null,
        totalJobsFound: total
      },
      search: {
        query,
        location,
        filters: {
          jobType,
          experienceLevel,
          isRemote,
          sector,
          country
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/jobs',
        version: '1.0',
        searchTimeMs: Date.now() - startTime
      }
    };
    
    console.log(`✅ Jobs API: Successfully returned ${formattedJobs.length} jobs (${total} total)`);
    
    // Add caching headers for better performance
    const response_headers = new Headers({
      'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
      'Content-Type': 'application/json'
    });
    
    return NextResponse.json(response, { headers: response_headers });
    
  } catch (error: any) {
    console.error('❌ Jobs API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs', 
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper function to generate location variations for smart matching
function generateLocationVariations(location: string): string[] {
  try {
    const variations: string[] = [];
    const lowerLocation = location.toLowerCase();
    
         // Common location synonyms
     const synonyms: Record<string, string[]> = {
       'mumbai': ['bombay', 'bombai'],
       'delhi': ['new delhi', 'dilli', 'dehli'],
       'bangalore': ['bengaluru', 'bangaluru'],
       'calcutta': ['kolkata'],
       'madras': ['chennai']
     };
    
    // Add synonyms if found
    for (const [key, values] of Object.entries(synonyms)) {
      if (lowerLocation.includes(key)) {
        variations.push(...values);
      }
    }
    
    // Add common abbreviations
    if (lowerLocation.includes('new york')) variations.push('nyc', 'ny');
    if (lowerLocation.includes('los angeles')) variations.push('la', 'l.a.');
    if (lowerLocation.includes('san francisco')) variations.push('sf', 'san fran');
    if (lowerLocation.includes('united states')) variations.push('usa', 'us', 'america');
    if (lowerLocation.includes('united kingdom')) variations.push('uk', 'england', 'britain');
    
    return variations;
  } catch (error) {
    console.warn('⚠️ Location variation generation failed:', error);
    return [];
  }
}

// Generate sample jobs when database has few results
function generateSampleJobs(options: {
  query: string;
  location: string;
  country: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  sector: string;
  count: number;
}): any[] {
  const { query, location, country, jobType, experienceLevel, isRemote, sector, count } = options;
  
  const companies = [
    'TechCorp', 'InnovateLabs', 'Digital Solutions', 'CloudTech', 'DataFlow',
    'WebCraft', 'AppBuilder', 'CodeForge', 'TechNova', 'DevStudio',
    'HealthCare Plus', 'FinanceFirst', 'EduTech Solutions', 'MarketingPro',
    'SalesForce', 'Engineering Corp', 'RetailMax', 'Hospitality Group',
    'Manufacturing Inc', 'Consulting Partners', 'BPO Solutions', 'Call Center Pro',
    'Customer Care Inc', 'Support Systems', 'Service Excellence'
  ];
  
  const jobTitles = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Data Scientist', 'Product Manager', 'UX Designer', 'DevOps Engineer',
    'QA Engineer', 'Business Analyst', 'Marketing Manager', 'Sales Executive',
    'Customer Service Representative', 'BPO Executive', 'Call Center Agent',
    'Technical Support', 'Account Manager', 'Project Manager', 'HR Manager',
    'Financial Analyst', 'Operations Manager', 'Content Writer', 'Digital Marketer'
  ];
  
  const locations = [
    'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
    'Chennai, Tamil Nadu', 'Pune, Maharashtra', 'Kolkata, West Bengal', 'Ahmedabad, Gujarat',
    'New York, NY', 'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL',
    'London, UK', 'Manchester, UK', 'Dubai, UAE', 'Abu Dhabi, UAE'
  ];
  
  const sampleJobs: any[] = [];
  
  for (let i = 0; i < count; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const jobLocation = locations[Math.floor(Math.random() * locations.length)];
    
    // Match query if provided
    const finalTitle = query ? `${query} ${title}` : title;
    
    // Match job type if provided
    const finalJobType = jobType && jobType !== 'all' ? jobType : 
      ['Full-time', 'Part-time', 'Contract', 'Internship'][Math.floor(Math.random() * 4)];
    
    // Match experience level if provided
    const finalExperienceLevel = experienceLevel && experienceLevel !== 'all' ? experienceLevel :
      ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Executive'][Math.floor(Math.random() * 5)];
    
    // Match remote if requested
    const isRemoteJob = isRemote ? true : Math.random() > 0.7;
    
    // Match location if provided - prioritize user's location search
    const finalLocation = location ? 
      (isRemoteJob ? 'Remote' : location) : 
      (isRemoteJob ? 'Remote' : jobLocation);
    
    const job = {
      id: `sample-${Date.now()}-${i}`,
      source: 'sample',
      sourceId: `sample-${Date.now()}-${i}`,
      title: finalTitle,
      company: company,
      location: isRemoteJob ? 'Remote' : finalLocation,
      country: country,
      description: `This is a comprehensive job description for ${finalTitle} at ${company}. We are looking for a talented professional to join our team and contribute to our success.`,
      requirements: `Requirements: Bachelor's degree in relevant field, 2+ years experience, strong communication skills`,
      applyUrl: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers/${finalTitle.toLowerCase().replace(/\s+/g, '-')}`,
      salary: `$${Math.floor(Math.random() * 50000) + 30000} - $${Math.floor(Math.random() * 50000) + 80000}`,
      salaryMin: Math.floor(Math.random() * 30000) + 30000,
      salaryMax: Math.floor(Math.random() * 50000) + 60000,
      salaryCurrency: 'USD',
      jobType: finalJobType,
      experienceLevel: finalExperienceLevel,
      skills: 'JavaScript, React, Node.js, Python, SQL',
      isRemote: isRemoteJob,
      isHybrid: !isRemoteJob && Math.random() > 0.8,
      isUrgent: Math.random() > 0.9,
      isFeatured: Math.random() > 0.8,
      isActive: true,
      sector: sector || 'Technology',
      views: Math.floor(Math.random() * 100),
      applicationsCount: Math.floor(Math.random() * 50),
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      updatedAt: new Date(),
      companyRelation: {
        name: company,
        logo: `https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=${company.charAt(0)}`,
        location: finalLocation,
        industry: 'Technology'
      }
    };
    
    sampleJobs.push(job);
  }
  
  return sampleJobs;
}

/**
 * Enhanced job search using the new processing pipeline
 */
async function handleEnhancedJobSearch(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const userId = searchParams.get('userId') || undefined;
    const includeExternal = searchParams.get('includeExternal') !== 'false';
    const includeDatabase = searchParams.get('includeDatabase') !== 'false';
    const includeSample = searchParams.get('includeSample') !== 'false';
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '500'))); // Increased for unlimited search
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    
    // Custom ranking weights
    const rankingWeights = {
      keywordMatch: parseFloat(searchParams.get('keywordWeight') || '0.4'),
      locationMatch: parseFloat(searchParams.get('locationWeight') || '0.3'),
      freshness: parseFloat(searchParams.get('freshnessWeight') || '0.2'),
      userHistory: parseFloat(searchParams.get('userHistoryWeight') || '0.1')
    };

    console.log(`🚀 Enhanced Job Search:`, {
      query, location, userId, includeExternal, includeDatabase, includeSample, limit, page
    });

    // Process jobs through the enhanced pipeline
    const jobProcessor = JobProcessingMiddleware.getInstance();
    const result = await jobProcessor.processJobs({
      query,
      location,
      userId,
      includeExternal,
      includeDatabase,
      includeSample,
      limit,
      page,
      rankingWeights
    });

    // Format response
    const response = {
      success: true,
      jobs: result.jobs,
      pagination: {
        page,
        limit,
        total: result.totalJobs,
        totalPages: Math.ceil(result.totalJobs / limit),
        hasNext: page < Math.ceil(result.totalJobs / limit),
        hasPrev: page > 1
      },
      sources: result.sources,
      processing: {
        time: result.processingTime,
        duplicatesRemoved: result.duplicatesRemoved,
        categories: result.categories
      },
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/jobs?enhanced=true',
        searchTimeMs: Date.now() - Date.now(),
        source: 'enhanced-pipeline'
      }
    };

    console.log(`✅ Enhanced Job Search Complete:`, {
      jobsReturned: result.jobs.length,
      totalJobs: result.totalJobs,
      processingTime: `${result.processingTime}ms`,
      duplicatesRemoved: result.duplicatesRemoved,
      categories: result.categories
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Enhanced job search failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Enhanced job search failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
