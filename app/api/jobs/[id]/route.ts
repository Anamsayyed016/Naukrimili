import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract the job ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const jobId = parseInt(id);
    
    if (isNaN(jobId)) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Mock job data for now
    const mockJob = {
      id: jobId,
      title: 'Software Engineer',
      company: 'Tech Company',
      location: 'Bangalore',
      description: 'Job description here',
      salary: '15-25 LPA',
      type: 'Full-time',
      experience: '3-5 years'
    };

    const res = NextResponse.json({
      success: true,
      job: mockJob
    });
    res.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
    return res;

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
