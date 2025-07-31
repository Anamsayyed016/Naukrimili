import { NextRequest } from 'next/server';
import { unifiedJobService } from '@/lib/unified-job-service';
import type { JobSearchParams } from '@/lib/unified-job-service';
import { safeLogger } from '@/lib/safe-logger';
import { handleApiError } from '@/lib/error-handler';

// Mock jobs data for fallback
const mockJobs = [
  {
    id: '1',
    title: 'Software Developer',
    company: 'Tech Solutions',
    location: 'Mumbai, India',
    description: 'We are looking for a skilled software developer...',
    salary: '₹8-15 LPA',
    timeAgo: '2 days ago',
    redirect_url: '/jobs/1',
    isUrgent: false,
    isRemote: false,
    jobType: 'Full-time',
    source: 'sample' as const
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'Startup Inc',
    location: 'Bangalore, India',
    description: 'Join our team as a full stack developer...',
    salary: '₹10-18 LPA',
    timeAgo: '1 day ago',
    redirect_url: '/jobs/2',
    isUrgent: true,
    isRemote: true,
    jobType: 'Full-time',
    source: 'sample' as const
  }
];

function sanitizeJobsResponse(jobs: any[]) {
  return jobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description?.substring(0, 500), // Limit description length
    redirect_url: job.redirect_url,
    isUrgent: job.isUrgent,
    isRemote: job.isRemote,
    jobType: job.jobType,
    source: job.source
  }));
}

export async function GET(request: NextRequest) {
  let searchParams;
  try {
    searchParams = new URL(request.url).searchParams;
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || 'India';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use dynamic real API that works like Adzuna
    try {
      const realApiUrl = new URL('/api/jobs/real', request.url);
      realApiUrl.searchParams.set('query', query);
      realApiUrl.searchParams.set('location', location);
      realApiUrl.searchParams.set('page', page.toString());
      realApiUrl.searchParams.set('limit', limit.toString());
      
      const realResponse = await fetch(realApiUrl.toString());
      
      if (realResponse.ok) {
        const realData = await realResponse.json();
        if (realData.success) {
          return Response.json(realData);
        }
      }
    } catch (error) {
      // Safely log error without potential circular references
      console.warn('Dynamic real API failed, using fallback:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Fallback to mock data
    return Response.json({ 
      success: true, 
      jobs: sanitizeJobsResponse(mockJobs),
      total: mockJobs.length,
      page: 1,
      totalPages: 1,
      hasMore: false
    });
  } catch (error) {
    return handleApiError(error, { 
      endpoint: 'GET /api/jobs',
      context: { query: searchParams?.get('query') ?? null }
    });
  }
}

// Handle POST requests for complex search queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      query = '',
      location = 'India',
      jobType,
      datePosted,
      remote = false,
      page = 1,
      limit = 20,
      salaryMin,
      salaryMax,
      filters = {}
    } = body;

    if (!query.trim()) {
      return Response.json(
        { 
          success: false,
          error: 'Search query is required',
          jobs: [],
          debug: {
            message: 'No search query provided in POST body'
          }
        },
        { status: 400 }
      );
    }

    const searchOptions: JobSearchParams = {
      query: query.trim(),
      location,
      page,
      limit: Math.min(limit, 50),
      ...(jobType && { jobType }),
      ...(datePosted && { datePosted }),
      ...(remote && { remote }),
      ...(salaryMin && { salaryMin }),
      ...(salaryMax && { salaryMax })
    };

    safeLogger.info('POST unified job search', {
      query: searchOptions.query,
      location: searchOptions.location,
      page: searchOptions.page,
      limit: searchOptions.limit
    });

    try {
      const result = await unifiedJobService.searchJobs(searchOptions);
      
      // Calculate pagination info
      const currentPage = searchOptions.page || 1;
      const pageSize = searchOptions.limit || 20;
      const totalPages = Math.ceil(result.total / pageSize);
      const hasMore = currentPage < totalPages;
      
      return Response.json({
        success: true,
        jobs: sanitizeJobsResponse(result.jobs),
        total: result.total,
        page: currentPage,
        totalPages,
        hasMore,
        query: searchOptions,
        meta: {
          searchTime: new Date().toISOString(),
          method: 'POST'
        }
      });
    } catch (serviceError) {
      // Log error summary only
      safeLogger.warn('Unified job service failed, using mock data', { 
        code: 'UNIFIED_JOB_SERVICE_ERROR',
        message: serviceError instanceof Error ? serviceError.message : 'Unknown error',
        time: new Date().toISOString()
      });
      
      // Filter mock jobs based on query
      const filteredJobs = mockJobs.filter(job =>
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase())
      );

      return Response.json({
        success: true,
        jobs: filteredJobs,
        total: filteredJobs.length,
        page: 1,
        totalPages: 1,
        hasMore: false,
        query: searchOptions,
        meta: {
          searchTime: new Date().toISOString(),
          method: 'POST',
          source: 'mock'
        }
      });
    }

  } catch (error) {
    return handleApiError(error, {
      endpoint: 'POST /api/jobs',
      context: {
        request: 'Search jobs',
        timestamp: new Date().toISOString()
      }
    });
  }
}
