import { NextRequest, NextResponse } from 'next/server';
import { filterValidJobs } from '@/lib/jobs/job-id-validator';

// Compatibility wrapper: forwards to /api/jobs and adapts response format if needed
export async function GET(request: NextRequest) {
  try {
    // Validate request
    if (!request.url) {
      console.error('❌ Invalid request URL');
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const fwd = new URL(url.pathname.replace('/api/jobs/search', '/api/jobs') + (url.search || ''), url.origin);
    
    console.log(`🔍 Forwarding search request to: ${fwd.toString()}`);
    
    // Create a timeout controller for better compatibility
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Search request timed out after 30 seconds');
      controller.abort();
    }, 30000); // 30 second timeout
    
    try {
      const resp = await fetch(fwd, { 
        headers: { 
          'accept': 'application/json',
          'user-agent': 'JobPortal-Search-API/1.0'
        },
        signal: controller.signal,
        // Add cache control for better performance
        cache: 'no-cache'
      });
      
      // Clear timeout since request completed
      clearTimeout(timeoutId);
      
      let json;
      try {
        json = await resp.json();
      } catch (parseError) {
        console.error('❌ Failed to parse response JSON:', parseError);
        json = {};
      }
      
      if (!resp.ok) {
        console.error(`❌ Upstream API error: ${resp.status} ${resp.statusText}`);
        return NextResponse.json(
          json || { 
            success: false, 
            error: `Search failed: ${resp.status} ${resp.statusText}`,
            endpoint: fwd.toString()
          }, 
          { status: resp.status }
        );
      }
      
      // Validate response structure
      if (!json || typeof json !== 'object') {
        console.error('❌ Invalid response structure from upstream API');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid response from search service',
            endpoint: fwd.toString()
          },
          { status: 502 }
        );
      }
      
      // Filter out jobs with invalid IDs before returning
      const rawJobs = Array.isArray(json.data?.jobs) ? json.data.jobs : 
                      Array.isArray(json.jobs) ? json.jobs : [];
      const validJobs = filterValidJobs(rawJobs);
      
      // Ensure consistent shape for optimized hooks
      const response = {
        success: true,
        data: {
          jobs: validJobs,
          pagination: json.data?.pagination || json.pagination || { 
            total_results: validJobs.length, 
            current_page: 1, 
            per_page: 20,
            total: validJobs.length
          },
        },
        filters: { 
          applied: {}, 
          available: json.availableFilters || {} 
        },
        meta: {
          search_time_ms: 0,
          query_type: 'compat',
          total_in_db: (json.pagination?.total_results || json.pagination?.total) || 0,
          suggestions: [],
          endpoint: fwd.toString(),
          timestamp: new Date().toISOString()
        },
      };
      
      console.log(`✅ Search completed successfully: ${response.data.jobs.length} jobs found`);
      return NextResponse.json(response);
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error: any) {
    console.error('❌ Search API error:', error);
    
    // Handle different types of errors
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Search request timed out',
          retry_after: 30
        },
        { status: 408 }
      );
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unable to connect to search service',
          retry_after: 60
        },
        { status: 503 }
      );
    }
    
    if (error.code === 'ECONNRESET') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Connection reset by search service',
          retry_after: 30
        },
        { status: 503 }
      );
    }
    
    // Generic error fallback
    return NextResponse.json(
      { 
        success: false, 
        error: 'Search service temporarily unavailable',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        retry_after: 60
      },
      { status: 500 }
    );
  }
}


