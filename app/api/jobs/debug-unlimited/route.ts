/**
 * Debug Unlimited Search API
 * Test endpoint to debug unlimited search functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { unlimitedJobSearch } from '@/lib/jobs/unlimited-search';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug unlimited search API called');
    
    const { searchParams } = new URL(request.url);
    
    // Test with minimal parameters
    const options = {
      query: searchParams.get('query') || 'software engineer',
      location: searchParams.get('location') || '',
      country: searchParams.get('country') || 'IN',
      page: 1,
      limit: 10,
      includeExternal: true,
      includeDatabase: true,
      includeSample: true
    };

    console.log('📊 Debug search options:', options);

    // Test the unlimited search
    const result = await unlimitedJobSearch.search(options);

    console.log('✅ Debug search result:', {
      success: true,
      jobsCount: result.jobs.length,
      totalJobs: result.totalJobs,
      sources: result.sources,
      sectors: result.sectors.length,
      countries: result.countries.length
    });

    return NextResponse.json({
      success: true,
      message: 'Debug unlimited search completed',
      options,
      result: {
        jobsCount: result.jobs.length,
        totalJobs: result.totalJobs,
        hasMore: result.hasMore,
        sources: result.sources,
        sectors: result.sectors,
        countries: result.countries,
        sampleJobs: result.jobs.slice(0, 3).map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          country: job.country,
          source: job.source
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Debug unlimited search failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Debug search failed',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
