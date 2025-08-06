import { NextRequest } from 'next/server';
import { unifiedJobService } from '@/lib/unified-job-service';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testSearch = searchParams.get('test') === 'true';
    
    // Get API status
    let apiStatus;
    let cacheStats;
    let testResult = null;
    
    try {
      apiStatus = unifiedJobService.getApiStatus();
      cacheStats = unifiedJobService.getCacheStats();
      
      // Test search if requested
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
    } catch (serviceError) {
      // console.warn('Unified job service not available:', serviceError);
      apiStatus = { error: 'Service unavailable' };
      cacheStats = { size: 0, keys: [] };
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

    return Response.json({
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
    return handleApiError(error, {
      endpoint: 'GET /api/jobs/debug',
      context: {
        timestamp: new Date().toISOString()
      }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'clearCache':
        try {
          unifiedJobService.clearCache();
          return Response.json({
            success: true,
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          return handleApiError(error, {
            endpoint: 'POST /api/jobs/debug',
            context: {
              action: 'clearCache',
              timestamp: new Date().toISOString()
            }
          });
        }

      case 'testSearch':
        if (!params?.query) {
          return Response.json(
            { success: false, error: 'Query parameter required for test search' },
            { status: 400 }
          );
        }

        try {
          const result = await unifiedJobService.searchJobs({
            query: params.query,
            location: params.location || 'India',
            limit: params.limit || 5
          });

          return Response.json({
            success: true,
            testResult: result,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          return handleApiError(error, {
            endpoint: 'POST /api/jobs/debug',
            context: {
              action: 'testSearch',
              query: params.query,
              timestamp: new Date().toISOString()
            }
          });
        }

      default:
        return Response.json(
          { success: false, error: 'Invalid action. Use "clearCache" or "testSearch"' },
          { status: 400 }
        );
    }

  } catch (error) {
    return handleApiError(error, {
      endpoint: 'POST /api/jobs/debug',
      context: {
        timestamp: new Date().toISOString()
      }
    });
  }
} 