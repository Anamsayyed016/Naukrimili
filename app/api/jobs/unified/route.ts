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

    console.log(`🔍 Unified Jobs API: Searching with filters:`, { query, location, country, source, page, limit, includeExternal });

    // 1. Fetch from Database
    if (source === 'db' || source === 'all') {
      try {
        const dbWhere: any = { isActive: true };
        
        if (query && query.trim().length > 0) {
          dbWhere.OR = [
            { title: { contains: query.trim(), mode: 'insensitive' } },
            { company: { contains: query.trim(), mode: 'insensitive' } },
            { description: { contains: query.trim(), mode: 'insensitive' } }
          ];
        }
        
        if (location && location.trim().length > 0) {
          dbWhere.location = { contains: location.trim(), mode: 'insensitive' };
        }
        
        if (country && country.trim().length > 0) {
          dbWhere.country = country.trim();
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
          skills: job.skills,
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

    // Format external jobs with new structure
    if (includeExternal && source !== 'db') {
      const externalJobs = await fetchExternalJobs(query, location, country, page);
      externalJobs.forEach(job => {
        allJobs.push({
          ...job,
          id: `ext-${job.source}-${job.sourceId}`,
          apply_url: null, // External jobs don't have internal apply URL
          source_url: job.applyUrl, // Use the old applyUrl as source_url
          isExternal: true,
          source: job.source
        });
      });
    }

    // 3. Sort and paginate combined results
    try {
      allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedJobs = allJobs.slice(startIndex, endIndex);

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
          external: includeExternal && (source === 'external' || source === 'all')
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
          totalJobsFound: totalJobs
        }
      };

      console.log(`✅ Unified Jobs API: Successfully returned ${paginatedJobs.length} jobs (${totalJobs} total)`);
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

async function fetchExternalJobs(query: string, location: string, country: string, page: number) {
  try {
    const allExternalJobs: any[] = [];
    
    // Fetch from multiple providers concurrently
    const fetchPromises = [
      fetchFromAdzuna(query, country.toLowerCase(), page, { location }),
      fetchFromJSearch(query, country.toUpperCase(), page),
      fetchFromGoogleJobs(query, location || 'India', page)
    ];
    
    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allExternalJobs.push(...result.value);
      } else {
        console.warn(`⚠️ External API ${index} failed:`, result.reason);
      }
    });
    
    return allExternalJobs;
  } catch (error) {
    console.error('❌ External job fetch error:', error);
    return [];
  }
}
