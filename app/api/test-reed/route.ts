import { NextRequest } from 'next/server';
import { handleApiError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Reed API (mock)...');
    
    return Response.json({
      success: true,
      message: 'Reed API service not implemented yet',
      data: {
        totalResults: 0,
        jobsReturned: 0,
        sampleJobs: []
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/test-reed',
      context: {
        apiKey: process.env.REED_API_KEY ? 'configured' : 'missing',
        timestamp: new Date().toISOString()
      }
    });
  }
}
