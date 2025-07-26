import { NextRequest, NextResponse } from 'next/server';
import { unifiedJobService } from '@/lib/unified-job-service';
import type { JobSearchParams } from '@/lib/unified-job-service';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || 'India';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Try to fetch from backend first
    const backendUrl = process.env.BACKEND_API_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/jobs?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&page=${page}&limit=${limit}`, {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (res.ok) {
          const jobs = await res.json();
          return NextResponse.json({ success: true, jobs });
        }
      } catch (error) {
        console.warn('Backend API not available, using fallback data');
      }
    }

    // Fallback to mock data
    return NextResponse.json({ 
      success: true, 
      jobs: mockJobs,
      total: mockJobs.length,
      page: 1,
      totalPages: 1,
      hasMore: false
    });
  } catch (error) {
    console.error('GET jobs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs', jobs: [] }, 
      { status: 500 }
    );
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
      return NextResponse.json(
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

    console.log('🔍 POST unified job search:', searchOptions);

    try {
      const result = await unifiedJobService.searchJobs(searchOptions);
      return NextResponse.json({
        success: true,
        jobs: result.jobs,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasMore: result.hasMore,
        query: searchOptions,
        meta: {
          searchTime: new Date().toISOString(),
          method: 'POST'
        }
      });
    } catch (serviceError) {
      console.warn('Unified job service failed, using mock data:', serviceError);
      
      // Filter mock jobs based on query
      const filteredJobs = mockJobs.filter(job =>
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase())
      );

      return NextResponse.json({
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
    console.error('❌ POST unified job search error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        jobs: [],
        debug: {
          message: 'POST request failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
