/**
 * Real Job Search API
 * Focuses on real jobs with minimal sample jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { realJobSearch } from '@/lib/jobs/real-job-search';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Real job search API called');
    
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

    console.log('📊 Real search params:', { 
      query, location, country, page, limit, jobType, experienceLevel, isRemote 
    });

    const startTime = Date.now();

    // Perform real job search
    const result = await realJobSearch.search({
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
      limit
    });

    const searchTime = Date.now() - startTime;
    console.log(`⚡ Real job search completed in ${searchTime}ms`);

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      pagination: {
        currentPage: page,
        totalJobs: result.totalJobs,
        hasMore: result.hasMore,
        nextPage: result.nextPage,
        jobsPerPage: limit,
        totalPages: Math.ceil(result.totalJobs / limit) || 1
      },
      sources: result.sources,
      metadata: {
        ...result.metadata,
        searchTimeMs: searchTime,
        performance: {
          responseTime: `${searchTime}ms`,
          realJobsPercentage: result.metadata.realJobsPercentage
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Real job search failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Real job search failed',
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
          realJobsPercentage: 0,
          performance: {
            responseTime: 'error',
            realJobsPercentage: 0
          }
        }
      },
      { status: 500 }
    );
  }
}