/**
 * Advanced Jobs API Route
 * 
 * Senior-level implementation with:
 * - Optimized database queries
 * - Intelligent caching
 * - Advanced filtering and ranking
 * - Performance monitoring
 * - Comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { JobSearchService } from '@/lib/services/job-search-service';
import { JobSearchFilters } from '@/types/jobs';

// Enhanced validation schema
const searchQuerySchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  country: z.string().length(2).optional().default('IN'),
  job_type: z.enum(['all', 'full-time', 'part-time', 'contract', 'internship']).optional().default('all'),
  experience_level: z.enum(['all', 'entry', 'mid', 'senior', 'lead', 'executive']).optional().default('all'),
  salary_min: z.coerce.number().min(0).optional(),
  salary_max: z.coerce.number().min(0).optional(),
  remote_only: z.coerce.boolean().optional().default(false),
  sector: z.string().optional(),
  skills: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()) : []),
  page: z.coerce.number().min(1).max(100).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  sort_by: z.enum(['relevance', 'date', 'salary', 'company']).optional().default('relevance'),
  include_external: z.coerce.boolean().optional().default(true),
  enable_cache: z.coerce.boolean().optional().default(true)
});

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    
    const validationResult = searchQuerySchema.safeParse(rawParams);
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.flatten(),
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const filters: JobSearchFilters = validationResult.data;
    
    // Log search request for monitoring
    console.log(`🔍 Advanced job search:`, {
      query: filters.query,
      location: filters.location,
      country: filters.country,
      jobType: filters.job_type,
      experienceLevel: filters.experience_level,
      salaryRange: filters.salary_min && filters.salary_max ? 
        `${filters.salary_min}-${filters.salary_max}` : 'any',
      remoteOnly: filters.remote_only,
      sector: filters.sector,
      skills: filters.skills,
      page: filters.page,
      limit: filters.limit,
      sortBy: filters.sort_by,
      includeExternal: filters.include_external,
      enableCache: filters.enable_cache
    });

    // Perform advanced search
    const searchOptions = {
      enableCache: filters.enable_cache,
      cacheTTL: 300, // 5 minutes
      maxResults: filters.limit * 2, // Get more results for better ranking
      includeExternal: filters.include_external,
      enableRanking: true
    };

    const { data, metrics } = await JobSearchService.searchJobs(filters, searchOptions);

    // Add performance metrics to response
    const response = {
      ...data,
      performance: {
        totalTime: Date.now() - startTime,
        searchTime: metrics.queryTime,
        cacheHit: metrics.cacheHit,
        sources: metrics.sources,
        resultsCount: metrics.resultsCount
      },
      timestamp: new Date().toISOString()
    };

    // Set cache headers
    const headers = new Headers();
    if (metrics.cacheHit) {
      headers.set('X-Cache', 'HIT');
    } else {
      headers.set('X-Cache', 'MISS');
    }
    headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    headers.set('X-Results-Count', metrics.resultsCount.toString());

    return NextResponse.json(response, { 
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error('❌ Advanced job search error:', error);
    
    // Return structured error response
    return NextResponse.json({
      success: false,
      error: 'Job search failed',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      performance: {
        totalTime: Date.now() - startTime
      }
    }, { status: 500 });
  }
}

/**
 * Health check endpoint
 */
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check
    const testFilters: JobSearchFilters = {
      query: 'test',
      country: 'IN',
      page: 1,
      limit: 1
    };

    await JobSearchService.searchJobs(testFilters, {
      enableCache: false,
      maxResults: 1,
      includeExternal: false
    });

    return new Response(null, { 
      status: 200,
      headers: {
        'X-Health': 'OK',
        'X-Timestamp': new Date().toISOString()
      }
    });
  } catch (_error) {
    return new Response(null, { 
      status: 503,
      headers: {
        'X-Health': 'ERROR',
        'X-Timestamp': new Date().toISOString()
      }
    });
  }
}
