import { NextRequest, NextResponse } from 'next/server';
import GoogleSearchService from '@/lib/google-search-service';

const googleSearchService = new GoogleSearchService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testQuery = searchParams.get('query') || 'software developer';
    const testLocation = searchParams.get('location') || 'Mumbai';

    // Test the Google search service
    const testParams = {
      query: testQuery,
      location: testLocation,
      jobType: 'full-time',
      experienceLevel: 'mid',
      remote: false
    };

    const result = await googleSearchService.searchGoogleJobs(testParams);
    
    // Test fallback logic
    const shouldTrigger = googleSearchService.shouldTriggerFallback(0, testParams);
    const suggestions = googleSearchService.getSearchSuggestions(testQuery, testLocation);
    const smartQueries = googleSearchService.generateSmartQueries(testQuery, testLocation);

    const testResults = {
      success: true,
      testParams,
      googleSearchResult: result,
      fallbackLogic: {
        shouldTrigger,
        suggestions,
        smartQueries
      },
      serviceMethods: {
        shouldTriggerFallback: shouldTrigger,
        getSearchSuggestions: suggestions.length,
        generateSmartQueries: smartQueries.length
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(testResults);

  } catch (error) {
    console.error('Google fallback test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType, params } = body;

    let testResults: any = {};

    switch (testType) {
      case 'fallback-trigger':
        testResults = {
          shouldTrigger: googleSearchService.shouldTriggerFallback(params.jobCount || 0, params),
          explanation: `Testing fallback trigger for ${params.jobCount || 0} jobs with query "${params.query}"`
        };
        break;

      case 'search-suggestions':
        testResults = {
          suggestions: googleSearchService.getSearchSuggestions(params.query, params.location),
          count: googleSearchService.getSearchSuggestions(params.query, params.location).length
        };
        break;

      case 'smart-queries':
        testResults = {
          smartQueries: googleSearchService.generateSmartQueries(params.query, params.location),
          count: googleSearchService.generateSmartQueries(params.query, params.location).length
        };
        break;

      case 'full-search':
        testResults = await googleSearchService.searchGoogleJobs(params);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test type. Use: fallback-trigger, search-suggestions, smart-queries, or full-search'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      testType,
      results: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Google fallback test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
