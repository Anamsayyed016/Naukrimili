import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {return Response.json({
      success: true,
      message: 'Test API endpoint working',
      timestamp: new Date().toISOString(),
      jobs: [
        {
          id: 'test-1',
          title: 'Test Job 1',
          company: 'Test Company',
          location: 'Test Location',
          description: 'This is a test job',
          salaryFormatted: '₹10-15 LPA',
          timeAgo: '1 day ago',
          redirect_url: '/jobs/test-1',
          isUrgent: false,
          isRemote: false,
          jobType: 'Full-time'
  // TODO: Complete function implementation
}
        }
      ]})} catch (error) {
    console.error("Error:", error);
    throw error}
    console.error('❌ TEST API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Test API failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 })}
}
