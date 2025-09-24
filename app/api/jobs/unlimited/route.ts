/**
 * Unlimited Job Search API
 * Provides unlimited job search across all sectors with comprehensive filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { unlimitedJobSearch, UnlimitedSearchOptions } from '@/lib/jobs/unlimited-search';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Unlimited job search API called');
    
    const { searchParams } = new URL(request.url);
    
    // Parse search parameters
    const options: UnlimitedSearchOptions = {
      query: searchParams.get('query') || '',
      location: searchParams.get('location') || '',
      country: searchParams.get('country') || 'IN',
      jobType: searchParams.get('jobType') || '',
      experienceLevel: searchParams.get('experienceLevel') || '',
      isRemote: searchParams.get('isRemote') === 'true',
      salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
      salaryMax: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined,
      sector: searchParams.get('sector') || '',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(2000, Math.max(10, parseInt(searchParams.get('limit') || '200'))), // Truly unlimited limit
      includeExternal: searchParams.get('includeExternal') !== 'false',
      includeDatabase: searchParams.get('includeDatabase') !== 'false',
      includeSample: searchParams.get('includeSample') !== 'false'
    };

    console.log('📊 Search options:', options);

    // Perform unlimited search
    const result = await unlimitedJobSearch.search(options);

    // Add metadata for frontend
    const response = {
      success: true,
      jobs: result.jobs,
      pagination: {
        currentPage: options.page,
        totalJobs: result.totalJobs,
        hasMore: result.hasMore,
        nextPage: result.nextPage,
        jobsPerPage: options.limit,
        totalPages: Math.ceil(result.totalJobs / options.limit)
      },
      sources: result.sources,
      metadata: {
        sectors: result.sectors,
        countries: result.countries,
        searchTime: new Date().toISOString(),
        query: options.query,
        location: options.location,
        country: options.country
      }
    };

    console.log(`✅ Unlimited search completed: ${result.jobs.length} jobs returned, ${result.totalJobs} total available`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Unlimited job search failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Job search failed',
        details: error.message,
        jobs: [],
        pagination: {
          currentPage: 1,
          totalJobs: 0,
          hasMore: false,
          nextPage: null,
          jobsPerPage: 0,
          totalPages: 0
        },
        sources: { database: 0, external: 0, sample: 0 },
        metadata: {
          sectors: [],
          countries: [],
          searchTime: new Date().toISOString(),
          query: '',
          location: '',
          country: 'IN'
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Unlimited job search POST called');
    
    const body = await request.json();
    
    // Parse search options from request body
    const options: UnlimitedSearchOptions = {
      query: body.query || '',
      location: body.location || '',
      country: body.country || 'IN',
      jobType: body.jobType || '',
      experienceLevel: body.experienceLevel || '',
      isRemote: body.isRemote || false,
      salaryMin: body.salaryMin || undefined,
      salaryMax: body.salaryMax || undefined,
      sector: body.sector || '',
      page: body.page || 1,
      limit: Math.min(500, Math.max(10, body.limit || 100)),
      includeExternal: body.includeExternal !== false,
      includeDatabase: body.includeDatabase !== false,
      includeSample: body.includeSample !== false
    };

    console.log('📊 POST search options:', options);

    // Perform unlimited search
    const result = await unlimitedJobSearch.search(options);

    // Add metadata for frontend
    const response = {
      success: true,
      jobs: result.jobs,
      pagination: {
        currentPage: options.page,
        totalJobs: result.totalJobs,
        hasMore: result.hasMore,
        nextPage: result.nextPage,
        jobsPerPage: options.limit,
        totalPages: Math.ceil(result.totalJobs / options.limit)
      },
      sources: result.sources,
      metadata: {
        sectors: result.sectors,
        countries: result.countries,
        searchTime: new Date().toISOString(),
        query: options.query,
        location: options.location,
        country: options.country
      }
    };

    console.log(`✅ Unlimited POST search completed: ${result.jobs.length} jobs returned, ${result.totalJobs} total available`);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('❌ Unlimited job search POST failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Job search failed',
        details: error.message,
        jobs: [],
        pagination: {
          currentPage: 1,
          totalJobs: 0,
          hasMore: false,
          nextPage: null,
          jobsPerPage: 0,
          totalPages: 0
        },
        sources: { database: 0, external: 0, sample: 0 },
        metadata: {
          sectors: [],
          countries: [],
          searchTime: new Date().toISOString(),
          query: '',
          location: '',
          country: 'IN'
        }
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
