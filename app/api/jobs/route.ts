import { NextRequest } from 'next/server';

// Quick fix for API jobs route
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
  }
];

function sanitizeJobsResponse(jobs: any[]) {
  return jobs.map(job => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: (job.description || '').substring(0, 500),
    redirect_url: job.redirect_url,
    isUrgent: job.isUrgent,
    isRemote: job.isRemote,
    jobType: job.jobType,
    source: job.source
  }));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get('query') || searchParams.get('q') || '';
    const location = searchParams.get('location') || 'India';
    const sector = searchParams.get('sector') || '';
    const experience = searchParams.get('experience') || '';
    const jobType = searchParams.get('jobType') || '';
    const remote = searchParams.get('remote') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Forward all parameters to real API
    const realApiUrl = new URL('/api/jobs/real', request.url);
    realApiUrl.searchParams.set('query', query);
    realApiUrl.searchParams.set('location', location);
    if (sector) realApiUrl.searchParams.set('sector', sector);
    if (experience) realApiUrl.searchParams.set('experience', experience);
    if (jobType) realApiUrl.searchParams.set('jobType', jobType);
    if (remote) realApiUrl.searchParams.set('remote', 'true');
    realApiUrl.searchParams.set('page', page.toString());
    realApiUrl.searchParams.set('limit', limit.toString());
    
    const realResponse = await fetch(realApiUrl.toString());
    
    if (realResponse.ok) {
      const realData = await realResponse.json();
      if (realData.success) {
        return Response.json(realData);
      }
    }

    // Fallback to mock data
    const response = { 
      success: true, 
      jobs: sanitizeJobsResponse(mockJobs),
      total: mockJobs.length,
      page: 1,
      totalPages: 1,
      hasMore: false,
      meta: {
        source: 'mock',
        timestamp: new Date().toISOString()
      }
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({ 
      success: false,
      error: 'API Error',
      jobs: mockJobs,
      total: mockJobs.length
    });
  }
}
