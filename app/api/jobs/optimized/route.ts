/**
 * Optimized Job Search API
 * High-performance job search with intelligent caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { optimizedJobSearch } from '@/lib/jobs/optimized-search';

export async function GET(request: NextRequest) {
  try {
    console.log('⚡ Optimized job search API called');
    
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const country = searchParams.get('country') || 'IN';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const salaryMin = searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined;
    const salaryMax = searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined;
    const sector = searchParams.get('sector') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get('limit') || '100')));
    const includeExternal = searchParams.get('includeExternal') !== 'false';
    const includeDatabase = searchParams.get('includeDatabase') !== 'false';
    const includeSample = searchParams.get('includeSample') !== 'false';

    console.log('📊 Optimized search params:', { 
      query, location, country, page, limit, includeExternal, includeDatabase, includeSample 
    });

    const startTime = Date.now();

    // Perform optimized search
    const result = await optimizedJobSearch.search({
      query,
      location,
      country,
      jobType,
      experienceLevel,
      isRemote,
      salaryMin,
      salaryMax,
      sector,
      page,
      limit,
      includeExternal,
      includeDatabase,
      includeSample
    });

    const searchTime = Date.now() - startTime;
    console.log(`⚡ Optimized search completed in ${searchTime}ms`);

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      pagination: {
        currentPage: page,
        totalJobs: result.totalJobs,
        hasMore: result.hasMore,
        nextPage: result.hasMore ? page + 1 : null,
        jobsPerPage: limit,
        totalPages: Math.ceil(result.totalJobs / limit) || 1
      },
      sources: result.sources,
      metadata: {
        ...result.metadata,
        searchTimeMs: searchTime,
        performance: {
          cached: result.metadata.cached,
          responseTime: `${searchTime}ms`
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Optimized job search failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Optimized job search failed',
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
          cached: false,
          performance: {
            cached: false,
            responseTime: 'error'
          }
        }
      },
      { status: 500 }
    );
  }
}
