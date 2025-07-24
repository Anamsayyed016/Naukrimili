import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch jobs from the user's own FastAPI backend
    const res = await fetch('http://localhost:8000/jobs');
    if (!res.ok) throw new Error('Failed to fetch jobs from backend');
    const jobs = await res.json();
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to fetch jobs from backend.' }, { status: 500 });
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
