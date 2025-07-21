import { NextRequest, NextResponse } from 'next/server';
import { getSerpApiService } from '@/lib/serpapi-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing SerpApi connection...');
    
    // Test the API key and connection
    const serpApiService = getSerpApiService();
    
    // Validate connection first
    const isConnected = await serpApiService.validateConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'SerpApi connection failed - API key may be invalid or service unavailable',
        connected: false
      }, { status: 500 });
    }

    // Perform a simple test search
    const testResult = await serpApiService.searchIndianJobs('software engineer', 'Mumbai', {
      num: 5
    });

    console.log(`✅ SerpApi test successful! Found ${testResult.jobs?.length || 0} jobs`);

    return NextResponse.json({
      success: true,
      connected: true,
      message: 'SerpApi is working correctly',
      testResults: {
        jobCount: testResult.jobs?.length || 0,
        sampleJob: testResult.jobs?.[0] || null,
        error: testResult.error || null
      },
      apiInfo: {
        supportedLocations: serpApiService.getSupportedLocations().slice(0, 5), // Show first 5
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ SerpApi test failed:', error);
    
    return NextResponse.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      troubleshooting: {
        checkApiKey: 'Verify SERPAPI_KEY is set correctly in environment variables',
        checkNetwork: 'Ensure network connection allows outbound HTTPS requests',
        checkQuota: 'Verify SerpApi account has remaining quota',
        documentation: 'https://serpapi.com/google-jobs-api'
      }
    }, { status: 500 });
  }
}
