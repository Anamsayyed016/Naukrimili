import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromAdzuna, fetchFromJSearch, fetchFromGoogleJobs } from '@/lib/jobs/providers';

export async function GET(request: NextRequest) {
  try {
    // Validate request
    if (!request.url) {
      console.error('❌ Invalid request URL in unified jobs API');
      return NextResponse.json(
        { success: false, error: 'Invalid request URL' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Validate and parse parameters with defaults
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const country = searchParams.get('country') || 'IN';
    const source = searchParams.get('source') || 'all'; // 'db', 'external', 'all'
    
    // Additional filter parameters
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const lat = searchParams.get('lat') || '';
    const lng = searchParams.get('lng') || '';
    const radius = searchParams.get('radius') || '25';
    const sortByDistance = searchParams.get('sortByDistance') === 'true';
    
    // Validate numeric parameters
    let page = 1;
    let limit = 20;
    
    try {
      page = Math.max(1, parseInt(searchParams.get('page') || '1'));
      limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    } catch (parseError) {
      console.warn('⚠️ Parameter parsing error, using defaults:', parseError);
    }
    
    const includeExternal = searchParams.get('includeExternal') === 'true';

    let allJobs: any[] = [];
    let totalJobs = 0;
    let externalJobsCount = 0;

    console.log(`🔍 Unified Jobs API: Searching with filters:`, { 
      query, location, country, source, page, limit, includeExternal,
      jobType, experienceLevel, isRemote, salaryMin, salaryMax, lat, lng, radius, sortByDistance
    });

    // 1. Fetch from Database
    if (source === 'db' || source === 'all') {
      try {
        const dbWhere: any = { isActive: true };
        
        // Build OR conditions for query and location
        const orConditions: any[] = [];
        
        if (query && query.trim().length > 0) {
          orConditions.push(
            { title: { contains: query.trim(), mode: 'insensitive' } },
            { company: { contains: query.trim(), mode: 'insensitive' } },
            { description: { contains: query.trim(), mode: 'insensitive' } }
          );
        }
        
        if (location && location.trim().length > 0) {
          // Enhanced location filtering with smart matching
          const locationVariations = generateLocationVariations(location.trim());
          orConditions.push(
            { location: { contains: location.trim(), mode: 'insensitive' } },
            ...locationVariations.map(loc => ({ location: { contains: loc, mode: 'insensitive' } }))
          );
        }
        
        if (orConditions.length > 0) {
          dbWhere.OR = orConditions;
        }
        
        if (country && country.trim().length > 0) {
          dbWhere.country = country.trim();
        }
        
        // Additional filters
        if (jobType && jobType.trim().length > 0) {
          dbWhere.jobType = { contains: jobType.trim(), mode: 'insensitive' };
        }
        
        if (experienceLevel && experienceLevel.trim().length > 0) {
          dbWhere.experienceLevel = { contains: experienceLevel.trim(), mode: 'insensitive' };
        }
        
        if (isRemote) {
          dbWhere.isRemote = true;
        }
        
        if (salaryMin && salaryMin.trim().length > 0) {
          const minSalary = parseInt(salaryMin);
          if (!isNaN(minSalary)) {
            dbWhere.salary = { gte: minSalary };
          }
        }
        
        if (salaryMax && salaryMax.trim().length > 0) {
          const maxSalary = parseInt(salaryMax);
          if (!isNaN(maxSalary)) {
            if (dbWhere.salary) {
              dbWhere.salary = { ...dbWhere.salary, lte: maxSalary };
            } else {
              dbWhere.salary = { lte: maxSalary };
            }
          }
        }

        const dbJobs = await prisma.job.findMany({
          where: dbWhere,
          skip: (page - 1) * limit,
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
        });

        const dbFormattedJobs = dbJobs.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company || job.companyRelation?.name,
          companyLogo: job.companyLogo || job.companyRelation?.logo,
          location: job.location,
          country: job.country,
          description: job.description,
          applyUrl: job.applyUrl,
          postedAt: job.postedAt,
          salary: job.salary,
          jobType: job.jobType,
          experienceLevel: job.experienceLevel,
          skills: typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : (job.skills || []),
          isRemote: job.isRemote,
          isFeatured: job.isFeatured,
          source: 'database',
          createdAt: job.createdAt,
          // Add new fields for internal/external handling
          apply_url: job.apply_url || null,
          source_url: job.source_url || null,
          isExternal: job.source !== 'manual'
        }));

        allJobs.push(...dbFormattedJobs);
        totalJobs += dbJobs.length;
        
        console.log(`✅ Database: Found ${dbJobs.length} jobs`);
      } catch (dbError: any) {
        console.error('❌ Database query failed:', dbError);
        // Continue with external jobs if available
      }
    }

    // 2. Fetch External Jobs
    if (includeExternal && source !== 'db') {
      try {
        const externalJobs = await fetchExternalJobs(query, location, country, page, {
          jobType, experienceLevel, isRemote, salaryMin, salaryMax
        });
        
        // Process external jobs and add required fields
        const processedExternalJobs = externalJobs.map(job => ({
          ...job,
          id: `ext-${job.source}-${job.sourceId}`,
          apply_url: null, // External jobs don't have internal apply URL
          source_url: job.source_url || job.applyUrl || job.redirect_url, // Use the correct source_url field from providers
          isExternal: true,
          source: job.source,
          // Add missing required fields for sorting
          createdAt: job.postedAt ? new Date(job.postedAt) : new Date(),
          // Ensure all required fields exist
          company: job.company || 'Company not specified',
          location: job.location || 'Location not specified',
          country: job.country || country,
          description: job.description || 'No description available',
          skills: Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : []),
          isRemote: job.isRemote || false,
          isFeatured: job.isFeatured || false,
          // Add raw data for debugging
          rawData: job.raw || job
        }));
        
        allJobs.push(...processedExternalJobs);
        externalJobsCount = externalJobs.length;
        totalJobs += externalJobs.length; // ✅ FIXED: Now counting external jobs
        
        console.log(`✅ External APIs: Found ${externalJobs.length} jobs`);
      } catch (externalError: any) {
        console.error('❌ External job fetch failed:', externalError);
        // Continue with database jobs only
      }
    }

    // 3. Sort and paginate combined results
    try {
      // Safe sorting with fallback for missing dates
      allJobs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedJobs = allJobs.slice(startIndex, endIndex);

      // ✅ FIXED: Calculate total pages based on all jobs (database + external)
      const totalPages = Math.ceil(totalJobs / limit);

      const response = {
        success: true,
        jobs: paginatedJobs,
        pagination: {
          page,
          limit,
          total: totalJobs,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        sources: {
          database: source === 'db' || source === 'all',
          external: includeExternal && (source === 'external' || source === 'all'),
          databaseCount: totalJobs - externalJobsCount,
          externalCount: externalJobsCount
        },
        search: {
          query,
          location,
          country,
          source
        },
        meta: {
          timestamp: new Date().toISOString(),
          endpoint: '/api/jobs/unified',
          version: '1.0',
          totalJobsFound: totalJobs,
          breakdown: {
            database: totalJobs - externalJobsCount,
            external: externalJobsCount
          }
        }
      };

      console.log(`✅ Unified Jobs API: Successfully returned ${paginatedJobs.length} jobs (${totalJobs} total: ${totalJobs - externalJobsCount} DB + ${externalJobsCount} external)`);
      
      // If no jobs found, provide helpful message
      if (paginatedJobs.length === 0) {
        console.log('⚠️ No jobs found with current filters');
      }
      
      return NextResponse.json(response);
      
    } catch (processingError: any) {
      console.error('❌ Job processing failed:', processingError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Job processing failed',
          details: process.env.NODE_ENV === 'development' ? processingError.message : undefined,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Unified Jobs API error:', error);
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
    const lowerLocation = location.toLowerCase().trim();
    
    // Common location patterns
    const patterns = [
      // City, State patterns
      { regex: /^([^,]+),\s*([^,]+)$/, extract: (match: RegExpMatchArray) => [match[1].trim(), match[2].trim()] },
      // City patterns
      { regex: /^([^,]+)$/, extract: (match: RegExpMatchArray) => [match[1].trim()] }
    ];
    
    for (const pattern of patterns) {
      const match = lowerLocation.match(pattern.regex);
      if (match) {
        const parts = pattern.extract(match);
        if (parts.length === 2) {
          // City, State format
          variations.push(parts[0]); // Just city
          variations.push(parts[1]); // Just state
          variations.push(`${parts[0]}, ${parts[1]}`); // Full format
        } else if (parts.length === 1) {
          // Just city
          variations.push(parts[0]);
        }
        break;
      }
    }
    
    // Add common variations for major cities
    if (lowerLocation.includes('dubai')) {
      variations.push('dubai', 'dubai, uae', 'uae', 'united arab emirates');
    }
    if (lowerLocation.includes('mumbai')) {
      variations.push('mumbai', 'mumbai, maharashtra', 'maharashtra', 'bombay');
    }
    if (lowerLocation.includes('delhi')) {
      variations.push('delhi', 'new delhi', 'delhi, india', 'ncr');
    }
    if (lowerLocation.includes('bangalore')) {
      variations.push('bangalore', 'bengaluru', 'bangalore, karnataka', 'karnataka');
    }
    if (lowerLocation.includes('hyderabad')) {
      variations.push('hyderabad', 'hyderabad, telangana', 'telangana');
    }
    if (lowerLocation.includes('chennai')) {
      variations.push('chennai', 'madras', 'chennai, tamil nadu', 'tamil nadu');
    }
    if (lowerLocation.includes('pune')) {
      variations.push('pune', 'pune, maharashtra');
    }
    if (lowerLocation.includes('kolkata')) {
      variations.push('kolkata', 'calcutta', 'kolkata, west bengal', 'west bengal');
    }
    if (lowerLocation.includes('ahmedabad')) {
      variations.push('ahmedabad', 'ahmedabad, gujarat', 'gujarat');
    }
    
    // Remove duplicates and return
    return [...new Set(variations)].filter(v => v.length > 0);
  } catch (error) {
    console.warn('⚠️ Location variation generation failed:', error);
    return [location]; // Fallback to original location
  }
}

async function fetchExternalJobs(query: string, location: string, country: string, page: number, filters: {
  jobType?: string;
  experienceLevel?: string;
  isRemote?: boolean;
  salaryMin?: string;
  salaryMax?: string;
} = {}) {
  try {
    const allExternalJobs: any[] = [];
    
    // Dynamic query enhancement based on search terms
    const enhancedQueries = [query];
    
    // Add dynamic variations based on common job search patterns
    const queryLower = query.toLowerCase();
    
    // IT/Tech jobs
    if (queryLower.includes('developer') || queryLower.includes('programmer') || queryLower.includes('engineer')) {
      enhancedQueries.push('Software Developer', 'Programmer', 'Software Engineer');
    }
    
    // Customer service jobs
    if (queryLower.includes('customer') || queryLower.includes('service') || queryLower.includes('support')) {
      enhancedQueries.push('Customer Service', 'Customer Support', 'Client Service');
    }
    
    // Sales jobs
    if (queryLower.includes('sales') || queryLower.includes('marketing')) {
      enhancedQueries.push('Sales Representative', 'Marketing Executive', 'Business Development');
    }
    
    // Healthcare jobs
    if (queryLower.includes('nurse') || queryLower.includes('doctor') || queryLower.includes('medical')) {
      enhancedQueries.push('Healthcare', 'Medical', 'Nursing');
    }
    
    // Finance jobs
    if (queryLower.includes('accountant') || queryLower.includes('finance') || queryLower.includes('banking')) {
      enhancedQueries.push('Accounting', 'Finance', 'Banking');
    }
    
    // BPO/Outsourcing jobs (keeping the original BPO logic)
    if (queryLower.includes('bpo') || queryLower.includes('outsourcing')) {
      enhancedQueries.push(
        'BPO',
        'Business Process Outsourcing',
        'Customer Service',
        'Call Center',
        'Back Office',
        'Data Entry'
      );
    }
    
    // Admin/Office jobs
    if (queryLower.includes('admin') || queryLower.includes('office') || queryLower.includes('assistant')) {
      enhancedQueries.push('Administrative', 'Office Assistant', 'Executive Assistant');
    }
    
    // Remove duplicates from enhanced queries
    const uniqueQueries = [...new Set(enhancedQueries)];
    
    console.log(`🔍 Enhanced search queries for "${query}":`, uniqueQueries);
    
    // Fetch from multiple providers concurrently with enhanced queries
    const fetchPromises: Promise<any[]>[] = [];
    
    // Use the primary query for all providers
    const primaryQuery = uniqueQueries[0];
    
    fetchPromises.push(
      fetchFromAdzuna(primaryQuery, country.toLowerCase(), page, { location }),
      fetchFromJSearch(primaryQuery, country.toUpperCase(), page),
      fetchFromGoogleJobs(primaryQuery, location || 'India', page)
    );
    
    // Add additional searches with alternative queries (limit to 2 additional to avoid rate limits)
    if (uniqueQueries.length > 1) {
      uniqueQueries.slice(1, 3).forEach(altQuery => {
        fetchPromises.push(
          fetchFromAdzuna(altQuery, country.toLowerCase(), 1, { location })
        );
      });
    }
    
    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allExternalJobs.push(...result.value);
      } else {
        console.warn(`⚠️ External API ${index} failed:`, result.reason);
      }
    });
    
    // Enhanced duplicate removal based on multiple criteria
    const uniqueJobs = allExternalJobs.filter((job, index, self) => {
      // Check for exact duplicates based on sourceId and source
      const isExactDuplicate = self.findIndex(j => 
        j.sourceId === job.sourceId && 
        j.source === job.source &&
        j.title === job.title
      ) !== index;
      
      // Check for similar jobs (same title and company)
      const isSimilarDuplicate = self.findIndex(j => 
        j.title?.toLowerCase() === job.title?.toLowerCase() &&
        j.company?.toLowerCase() === job.company?.toLowerCase() &&
        j.source === job.source
      ) !== index;
      
      return !isExactDuplicate && !isSimilarDuplicate;
    });
    
    console.log(`✅ External jobs fetched: ${uniqueJobs.length} unique jobs from ${allExternalJobs.length} total`);
    
    return uniqueJobs;
  } catch (error) {
    console.error('❌ External job fetch error:', error);
    return [];
  }
}
