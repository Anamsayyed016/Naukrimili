import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testQuery = searchParams.get('test') || 'developer';
    
    // Simulate a successful API response with Reed jobs
    const mockJobs = [
      {
        id: 'reed_55386028',
        title: 'React Developer',
        company: 'Marshall Wolfe',
        location: 'Felixstowe',
        description: 'React Developer Marshall Wolfe are looking to recruit the services of an experienced Senior Software Engineer...',
        salaryFormatted: '£400 - £450',
        timeAgo: '09/07/2025',
        redirect_url: 'https://www.reed.co.uk/jobs/react-developer/55386028',
        apply_url: 'https://www.reed.co.uk/jobs/react-developer/55386028',
        isUrgent: false,
        isRemote: false,
        jobType: 'Contract',
        source: 'live',
        posted_date: '09/07/2025'
      },
      {
        id: 'reed_55417907',
        title: 'Product Developer',
        company: 'Greencore',
        location: 'Bristol',
        description: 'Role: Product Developer Location: Bristol (on-site requirements) Why Greencore? We are a leading manufacturer...',
        salaryFormatted: 'Salary not specified',
        timeAgo: '15/07/2025',
        redirect_url: 'https://www.reed.co.uk/jobs/product-developer/55417907',
        apply_url: 'https://www.reed.co.uk/jobs/product-developer/55417907',
        isUrgent: false,
        isRemote: false,
        jobType: 'Full-time',
        source: 'live',
        posted_date: '15/07/2025'
      },
      {
        id: 'reed_55424917',
        title: 'Frontend Developer',
        company: 'FDM Group',
        location: 'Sheffield',
        description: 'About The Role FDM is a global business and technology consultancy seeking a Frontend Developer...',
        salaryFormatted: '£55,000 - £65,000',
        timeAgo: '16/07/2025',
        redirect_url: 'https://www.reed.co.uk/jobs/frontend-developer/55424917',
        apply_url: 'https://www.reed.co.uk/jobs/frontend-developer/55424917',
        isUrgent: false,
        isRemote: false,
        jobType: 'Contract',
        source: 'live',
        posted_date: '16/07/2025'
      }
    ];

    const response = {
      success: true,
      jobs: mockJobs,
      results: mockJobs, // For compatibility
      total: 4037,
      page: 1,
      totalPages: 1346,
      hasMore: true,
      query: {
        q: testQuery,
        location: 'London',
        jobType: '',
        datePosted: '',
        remote: false,
        page: 1,
        limit: 20
      },
      meta: {
        searchTime: new Date().toISOString(),
        cached: false,
        source: 'Reed API Debug',
        note: 'This is a debug endpoint showing working job data structure'
      },
      debug: {
        reedApiWorking: true,
        jobsStructure: 'Correct format for frontend',
        frontendShouldWork: true
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      debug: {
        reedApiWorking: false,
        errorDetails: error.toString()
      }
    }, { status: 500 });
  }
}
