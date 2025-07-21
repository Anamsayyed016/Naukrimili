import { NextRequest, NextResponse } from 'next/server';
import { getReedService } from '@/lib/reed-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Reed API directly...');
    
    const reed = getReedService();
    
    const testResult = await reed.searchFormattedJobs({
      keywords: 'developer',
      resultsToTake: 5
    });
    
    console.log(`✅ Reed API test result: ${testResult.jobs.length} jobs found`);
    
    return NextResponse.json({
      success: true,
      message: 'Reed API is working!',
      data: {
        totalResults: testResult.totalResults,
        jobsReturned: testResult.jobs.length,
        sampleJobs: testResult.jobs.slice(0, 3).map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary
        }))
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Reed API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: {
        apiKey: process.env.REED_API_KEY ? 'configured' : 'missing',
        errorType: error.constructor.name
      }
    }, { status: 500 });
  }
}
