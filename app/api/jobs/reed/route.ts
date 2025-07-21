import { NextRequest, NextResponse } from 'next/server';
import { getReedService } from '@/lib/reed-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords') || searchParams.get('q') || '';
    const location = searchParams.get('location') || searchParams.get('locationName') || '';
    const minSalary = searchParams.get('minSalary');
    const maxSalary = searchParams.get('maxSalary');
    const jobType = searchParams.get('jobType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Calculate pagination
    const resultsToSkip = (page - 1) * limit;
    const resultsToTake = Math.min(limit, 100); // Reed API max is 100

    console.log('Reed API Request:', {
      keywords,
      location,
      minSalary,
      maxSalary,
      jobType,
      page,
      limit,
      resultsToSkip,
      resultsToTake
    });

    const reed = getReedService();
    
    // Build search parameters
    const searchParams_reed: any = {
      keywords: keywords || undefined,
      locationName: location || undefined,
      minimumSalary: minSalary ? parseInt(minSalary) : undefined,
      maximumSalary: maxSalary ? parseInt(maxSalary) : undefined,
      resultsToTake,
      resultsToSkip
    };

    // Add job type filters
    if (jobType) {
      switch (jobType.toLowerCase()) {
        case 'permanent':
        case 'full-time':
          searchParams_reed.permanent = true;
          searchParams_reed.fullTime = true;
          break;
        case 'contract':
          searchParams_reed.contract = true;
          break;
        case 'temporary':
        case 'temp':
          searchParams_reed.temp = true;
          break;
        case 'part-time':
          searchParams_reed.partTime = true;
          break;
      }
    }

    const results = await reed.searchFormattedJobs(searchParams_reed);
    
    // Format response to match your existing API structure
    const response = {
      success: true,
      source: 'Reed',
      data: {
        jobs: results.jobs,
        totalResults: results.totalResults,
        page,
        limit,
        totalPages: Math.ceil(results.totalResults / limit),
        hasNextPage: resultsToSkip + resultsToTake < results.totalResults,
        hasPrevPage: page > 1
      },
      metadata: {
        searchParams: {
          keywords,
          location,
          minSalary,
          maxSalary,
          jobType
        },
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    };

    console.log(`Reed API Success: Found ${results.totalResults} jobs`);
    
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Reed API Error:', error);

    const errorResponse = {
      success: false,
      source: 'Reed',
      error: {
        message: error.message || 'Failed to fetch jobs from Reed API',
        code: error.message?.includes('Reed API key is required') ? 'MISSING_API_KEY' : 
              error.message?.includes('401') ? 'INVALID_API_KEY' :
              error.message?.includes('429') ? 'RATE_LIMITED' : 'API_ERROR'
      },
      data: {
        jobs: [],
        totalResults: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      }
    };

    // Return appropriate HTTP status
    const status = error.message?.includes('401') ? 401 :
                   error.message?.includes('429') ? 429 :
                   error.message?.includes('Reed API key is required') ? 400 : 500;

    return NextResponse.json(errorResponse, { status });
  }
}

// POST method for more complex searches
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keywords = '',
      location = '',
      filters = {},
      pagination = { page: 1, limit: 20 }
    } = body;

    const reed = getReedService();
    
    const resultsToSkip = (pagination.page - 1) * pagination.limit;
    const resultsToTake = Math.min(pagination.limit, 100);

    const searchParams_reed: any = {
      keywords: keywords || undefined,
      locationName: location || undefined,
      minimumSalary: filters.minSalary,
      maximumSalary: filters.maxSalary,
      permanent: filters.permanent,
      contract: filters.contract,
      temp: filters.temporary,
      partTime: filters.partTime,
      fullTime: filters.fullTime,
      postedByDirectEmployer: filters.directEmployer,
      postedByRecruitmentAgency: filters.recruitmentAgency,
      graduate: filters.graduate,
      distanceFromLocation: filters.distance,
      resultsToTake,
      resultsToSkip
    };

    const results = await reed.searchFormattedJobs(searchParams_reed);
    
    const response = {
      success: true,
      source: 'Reed',
      data: {
        jobs: results.jobs,
        totalResults: results.totalResults,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(results.totalResults / pagination.limit),
        hasNextPage: resultsToSkip + resultsToTake < results.totalResults,
        hasPrevPage: pagination.page > 1
      },
      filters: filters,
      metadata: {
        searchParams: { keywords, location },
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Reed API POST Error:', error);
    
    return NextResponse.json({
      success: false,
      source: 'Reed',
      error: {
        message: error.message || 'Failed to process Reed API request',
        code: 'API_ERROR'
      },
      data: { jobs: [], totalResults: 0 }
    }, { status: 500 });
  }
}
