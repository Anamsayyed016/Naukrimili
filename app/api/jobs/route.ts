import { NextRequest, NextResponse } from 'next/server';
import { unifiedJobService, JobSearchParams } from '@/lib/unified-job-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract and validate search parameters
    const query = searchParams.get('q') || searchParams.get('query') || searchParams.get('what') || '';
    const location = searchParams.get('location') || searchParams.get('where') || 'India';
    const jobType = searchParams.get('job_type') || searchParams.get('jobType') || '';
    const datePosted = searchParams.get('date_posted') || searchParams.get('datePosted') || '';
    const remote = searchParams.get('remote') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Salary parameters
    const salaryMin = searchParams.get('salary_min') ? parseInt(searchParams.get('salary_min')!) : undefined;
    const salaryMax = searchParams.get('salary_max') ? parseInt(searchParams.get('salary_max')!) : undefined;

    if (!query.trim()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Search query is required',
          jobs: [],
          total: 0,
          page: 1,
          totalPages: 0,
          hasMore: false,
          debug: {
            message: 'No search query provided',
            apiStatus: unifiedJobService.getApiStatus()
          }
        },
        { status: 400 }
      );
    }

    // Build search parameters
    const searchOptions: JobSearchParams = {
      query: query.trim(),
      location,
      page,
      limit: Math.min(limit, 50), // Cap at 50 per page
      ...(jobType && { jobType: jobType as any }),
      ...(datePosted && { datePosted: datePosted as any }),
      ...(remote && { remote }),
      ...(salaryMin && { salaryMin }),
      ...(salaryMax && { salaryMax })
    };

    console.log('🔍 Unified job search:', searchOptions);

    // Get API status for debugging
    const apiStatus = unifiedJobService.getApiStatus();
    console.log('📊 API Status:', apiStatus);

    // Try unified service
    let result;
    try {
      result = await unifiedJobService.searchJobs(searchOptions);
      console.log(`✅ Unified service: ${result.jobs.length}/${result.total} jobs`);
    } catch (unifiedError) {
      console.error('❌ Unified service failed:', unifiedError);
      
      // Return error with debugging information
      return NextResponse.json(
        { 
          success: false,
          error: 'Job search service temporarily unavailable',
          jobs: [],
          total: 0,
          page: 1,
          totalPages: 0,
          hasMore: false,
          debug: {
            message: 'Unified service failed',
            error: unifiedError instanceof Error ? unifiedError.message : 'Unknown error',
            apiStatus,
            troubleshooting: {
              checkApiKeys: 'Verify API keys are set in environment variables',
              checkInternet: 'Ensure internet connection is working',
              checkServices: 'Job APIs may be temporarily unavailable'
            }
          }
        },
        { status: 500 }
      );
    }

    console.log(`✅ Final result: ${result.jobs.length}/${result.total} jobs`);

    // Return successful response with consistent format
    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      results: result.jobs, // Alternative field name for compatibility
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      hasMore: result.hasMore,
      query: {
        q: query,
        location,
        jobType,
        datePosted,
        remote,
        page,
        limit
      },
      meta: {
        searchTime: new Date().toISOString(),
        cached: false,
        source: result.jobs.length > 0 ? (result.jobs[0].id.startsWith('reed_') ? 'Reed API' : 
               result.jobs[0].id.startsWith('serp_') ? 'SerpApi' :
               result.jobs[0].id.startsWith('adzuna_') ? 'Adzuna' :
               result.jobs[0].id.startsWith('sample_') ? 'Sample Data' : 'Unknown') : 'No jobs found',
        apiStatus
      }
    });

  } catch (error) {
    console.error('❌ Unified job search error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        jobs: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
        debug: {
          message: 'Unexpected error occurred',
          error: error instanceof Error ? error.message : 'Unknown error',
          apiStatus: unifiedJobService.getApiStatus(),
          troubleshooting: {
            checkQuery: 'Ensure search query is not empty',
            checkConnection: 'Verify internet connection',
            checkServices: 'Job APIs may be temporarily unavailable',
            checkEnvironment: 'Verify environment variables are set correctly'
          }
        }
      },
      { status: 500 }
    );
  }
}

// Handle POST requests for complex search queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      query = '',
      location = 'India',
      jobType,
      datePosted,
      remote = false,
      page = 1,
      limit = 20,
      salaryMin,
      salaryMax,
      filters = {}
    } = body;

    if (!query.trim()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Search query is required',
          jobs: [],
          debug: {
            message: 'No search query provided in POST body',
            apiStatus: unifiedJobService.getApiStatus()
          }
        },
        { status: 400 }
      );
    }

    const searchOptions: JobSearchParams = {
      query: query.trim(),
      location,
      page,
      limit: Math.min(limit, 50),
      ...(jobType && { jobType }),
      ...(datePosted && { datePosted }),
      ...(remote && { remote }),
      ...(salaryMin && { salaryMin }),
      ...(salaryMax && { salaryMax })
    };

    console.log('🔍 POST unified job search:', searchOptions);

    const result = await unifiedJobService.searchJobs(searchOptions);

    return NextResponse.json({
      success: true,
      jobs: result.jobs,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      hasMore: result.hasMore,
      query: searchOptions,
      meta: {
        searchTime: new Date().toISOString(),
        method: 'POST',
        apiStatus: unifiedJobService.getApiStatus()
      }
    });

  } catch (error) {
    console.error('❌ POST unified job search error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        jobs: [],
        debug: {
          message: 'POST request failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          apiStatus: unifiedJobService.getApiStatus()
        }
      },
      { status: 500 }
    );
  }
}
