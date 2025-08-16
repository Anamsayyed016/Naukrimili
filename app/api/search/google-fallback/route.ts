import { NextRequest, NextResponse } from 'next/server';
import GoogleSearchService, { GoogleSearchParams } from '@/lib/google-search-service';

const googleSearchService = new GoogleSearchService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const searchParams: GoogleSearchParams = {
      query: body.query || '',
      location: body.location || 'India',
      jobType: body.jobType || 'all',
      experienceLevel: body.experienceLevel || 'all',
      remote: body.remote || false,
      salary: body.salary || '',
      company: body.company || '',
      skills: body.skills || []
    };

    // Validate required parameters
    if (!searchParams.query.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required'
      }, { status: 400 });
    }

    // Get Google search fallback
    const result = await googleSearchService.searchGoogleJobs(searchParams);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate Google search fallback'
      }, { status: 500 });
    }

    // Add additional metadata
    const enhancedResult = {
      ...result,
      metadata: {
        searchQuery: searchParams.query,
        location: searchParams.location,
        timestamp: new Date().toISOString(),
        platform: 'google-fallback',
        searchSuggestions: googleSearchService.getSearchSuggestions(searchParams.query, searchParams.location || 'India'),
        smartQueries: googleSearchService.generateSmartQueries(searchParams.query, searchParams.location || 'India')
      }
    };

    return NextResponse.json({
      success: true,
      data: enhancedResult
    });

  } catch (error) {
    console.error('Google fallback API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || 'India';

    if (!query.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required'
      }, { status: 400 });
    }

    // Get Google search fallback
    const result = await googleSearchService.searchGoogleJobs({
      query: query.trim(),
      location: location || 'India'
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate Google search fallback'
      }, { status: 500 });
    }

    // Add metadata
    const enhancedResult = {
      ...result,
      metadata: {
        searchQuery: query.trim(),
        location: location || 'India',
        timestamp: new Date().toISOString(),
        platform: 'google-fallback',
        searchSuggestions: googleSearchService.getSearchSuggestions(query.trim(), location || 'India'),
        smartQueries: googleSearchService.generateSmartQueries(query.trim(), location || 'India')
      }
    };

    return NextResponse.json({
      success: true,
      data: enhancedResult
    });

  } catch (error) {
    console.error('Google fallback API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
