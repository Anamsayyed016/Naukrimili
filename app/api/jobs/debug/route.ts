import { NextRequest, NextResponse } from 'next/server';
import { unifiedJobService } from '@/lib/unified-job-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testSearch = searchParams.get('test') === 'true';
    
    // Get API status
    const apiStatus = unifiedJobService.getApiStatus();
    
    // Get cache stats
    const cacheStats = unifiedJobService.getCacheStats();
    
    // Test search if requested
    let testResult = null;
    if (testSearch) {
      try {
        testResult = await unifiedJobService.searchJobs({
          query: 'software engineer',
          location: 'Mumbai',
          limit: 5
        });
      } catch (error) {
        testResult = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Check environment variables (without exposing actual values)
    const envCheck = {
      SERPAPI_KEY: !!process.env.SERPAPI_KEY,
      ADZUNA_APP_ID: !!process.env.ADZUNA_APP_ID,
      ADZUNA_API_KEY: !!process.env.ADZUNA_API_KEY,
      REED_API_KEY: !!process.env.REED_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      DEBUG: process.env.DEBUG === 'true'
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      apiStatus,
      cacheStats,
      environment: envCheck,
      testResult,
      troubleshooting: {
        noJobsFound: {
          possibleCauses: [
            'API keys not configured',
            'Network connectivity issues',
            'API rate limits exceeded',
            'Search query too specific'
          ],
          solutions: [
            'Check environment variables are set',
            'Verify internet connection',
            'Try different search terms',
            'Check API service status'
          ]
        },
        apiKeysMissing: {
          serpApi: 'Get SerpApi key from https://serpapi.com/',
          adzuna: 'Get Adzuna keys from https://developer.adzuna.com/',
          reed: 'Get Reed key from https://www.reed.co.uk/developers'
        }
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'clearCache':
        unifiedJobService.clearCache();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString()
        });

      case 'testSearch':
        if (!params?.query) {
          return NextResponse.json(
            { success: false, error: 'Query parameter required for test search' },
            { status: 400 }
          );
        }

        const result = await unifiedJobService.searchJobs({
          query: params.query,
          location: params.location || 'India',
          limit: params.limit || 5
        });

        return NextResponse.json({
          success: true,
          testResult: result,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "clearCache" or "testSearch"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Debug POST error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 