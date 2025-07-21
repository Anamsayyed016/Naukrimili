import { NextRequest, NextResponse } from 'next/server';
import { getSerpApiService, SerpJobSearchParams } from '@/lib/serpapi-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract search parameters
    const query = searchParams.get('q') || searchParams.get('what') || '';
    const location = searchParams.get('location') || searchParams.get('where') || 'India';
    const datePosted = searchParams.get('date_posted') as 'today' | 'yesterday' | 'week' | 'month' | 'all' | null;
    const jobType = searchParams.get('job_type') as 'full_time' | 'part_time' | 'contract' | 'internship' | null;
    const start = parseInt(searchParams.get('start') || '0');
    const num = parseInt(searchParams.get('num') || '20');

    // Additional filters
    const chips: string[] = [];
    if (searchParams.get('remote') === 'true') chips.push('remote');
    if (searchParams.get('entry_level') === 'true') chips.push('entry_level');
    if (searchParams.get('mid_level') === 'true') chips.push('mid_level');
    if (searchParams.get('senior_level') === 'true') chips.push('senior_level');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Create SerpApi service
    const serpApiService = getSerpApiService();

    // Prepare search parameters
    const searchOptions: SerpJobSearchParams = {
      query,
      location,
      ...(datePosted && { datePosted }),
      ...(jobType && { jobType }),
      ...(chips.length > 0 && { chips }),
      start,
      num: Math.min(num, 100) // SerpApi limit
    };

    console.log('Searching jobs with SerpApi:', searchOptions);

    // Search for jobs
    const result = await serpApiService.searchJobs(searchOptions);

    if (result.error) {
      console.error('SerpApi search error:', result.error);
      return NextResponse.json(
        { error: result.error, jobs: [] },
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      results: result.jobs,
      total: result.total,
      pagination: result.pagination,
      query: {
        q: query,
        location,
        datePosted,
        jobType,
        start,
        num
      }
    });

  } catch (error) {
    console.error('Error in SerpApi job search:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        jobs: [] 
      },
      { status: 500 }
    );
  }
}

// Handle POST requests for more complex search queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      query,
      location = 'India',
      datePosted,
      jobType,
      chips = [],
      start = 0,
      num = 20,
      filters = {}
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const serpApiService = getSerpApiService();

    // Prepare search parameters
    const searchOptions: SerpJobSearchParams = {
      query,
      location,
      ...(datePosted && { datePosted }),
      ...(jobType && { jobType }),
      ...(chips.length > 0 && { chips }),
      start,
      num: Math.min(num, 100)
    };

    console.log('POST: Searching jobs with SerpApi:', searchOptions);

    const result = await serpApiService.searchJobs(searchOptions);

    if (result.error) {
      return NextResponse.json(
        { error: result.error, jobs: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      results: result.jobs,
      total: result.total,
      pagination: result.pagination,
      query: searchOptions
    });

  } catch (error) {
    console.error('Error in SerpApi POST job search:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        jobs: [] 
      },
      { status: 500 }
    );
  }
}
