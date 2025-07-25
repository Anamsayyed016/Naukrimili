import { NextRequest, NextResponse } from 'next/server';
import { getJobService } from '@/lib/job-service';

export async function GET(request: NextRequest) {
  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // Test 1: Service initialization
    testResults.tests.push({
      name: 'Service Initialization',
      status: 'running'
    });

    let jobService;
    try {
      jobService = getJobService();
      testResults.tests[0].status = 'passed';
      testResults.tests[0].message = 'Job service initialized successfully';
    } catch (error: any) {
      testResults.tests[0].status = 'failed';
      testResults.tests[0].message = error.message;
      testResults.tests[0].error = error.message;
    }

    // Test 2: API Configuration
    testResults.tests.push({
      name: 'API Configuration',
      status: 'running'
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      testResults.tests[1].status = 'failed';
      testResults.tests[1].message = 'API URL not configured';
      testResults.tests[1].instructions = [
        'Add NEXT_PUBLIC_API_URL to your .env.local file',
        'Example: NEXT_PUBLIC_API_URL=http://localhost:3000/api'
      ];
    } else {
      testResults.tests[1].status = 'passed';
      testResults.tests[1].message = 'API URL is configured';
      testResults.tests[1].urlPreview = apiUrl;
    }

    // Test 3: Fetch specific job (only if API key is configured)
    if (jobService && apiUrl) {
      // Test 3: Fetch Job by ID
      testResults.tests.push({
        name: 'Fetch Job by ID',
        status: 'running'
      });

      try {
        const job = await jobService.getJob('test-job-id');
        testResults.tests[2].status = 'passed';
        testResults.tests[2].message = 'Successfully fetched job';
        testResults.tests[2].data = {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          salaryFormatted: job.salaryFormatted
        };
      } catch (error: any) {
        testResults.tests[2].status = 'failed';
        testResults.tests[2].message = error.message;
        testResults.tests[2].error = error.message;
        testResults.tests[2].instructions = ['Check if the job API endpoint is working'];
      }

      // Test 4: Job Search
      testResults.tests.push({
        name: 'Job Search (software engineer in Mumbai)',
        status: 'running'
      });

      try {
        const searchResults = await jobService.searchJobs('software engineer', {
          location: 'Mumbai',
          limit: 3
        });
        
        testResults.tests[3].status = 'passed';
        testResults.tests[3].message = `Found ${searchResults.total || 0} jobs`;
        testResults.tests[3].data = {
          total: searchResults.total,
          jobsReturned: searchResults.jobs?.length || 0,
          firstJob: searchResults.jobs?.[0] ? {
            title: searchResults.jobs[0].title,
            company: searchResults.jobs[0].company,
            location: searchResults.jobs[0].location
          } : null
        };
      } catch (error: any) {
        testResults.tests[3].status = 'failed';
        testResults.tests[3].message = error.message;
        testResults.tests[3].error = error.message;
      }
    } else {
      testResults.tests.push({
        name: 'API Tests',
        status: 'skipped',
        message: 'Skipped due to missing API configuration'
      });
    }

    // Test 5: Environment Check
    testResults.tests.push({
      name: 'Environment Check',
      status: 'passed',
      data: {
        nodeEnv: process.env.NODE_ENV,
        hasApiUrl: !!process.env.NEXT_PUBLIC_API_URL,
        platform: process.platform,
        baseUrl: process.env.NEXT_PUBLIC_API_URL
      }
    });

    // Summary
    const passedTests = testResults.tests.filter((t: any) => t.status === 'passed').length;
    const failedTests = testResults.tests.filter((t: any) => t.status === 'failed').length;
    const skippedTests = testResults.tests.filter((t: any) => t.status === 'skipped').length;

    testResults.summary = {
      total: testResults.tests.length,
      passed: passedTests,
      failed: failedTests,
      skipped: skippedTests,
      success: failedTests === 0,
      message: failedTests === 0 ? 
        'All tests passed! Job API is ready to use.' :
        `${failedTests} test(s) failed. Check the API configuration.`
    };

    // Set appropriate status code
    const statusCode = failedTests === 0 ? 200 : 
                      testResults.tests.some((t: any) => t.message?.includes('API key')) ? 400 : 500;

    return NextResponse.json(testResults, { status: statusCode });

  } catch (error: any) {
    console.error('Reed API test error:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: {
        message: 'Test execution failed',
        details: error.message
      },
      summary: {
        success: false,
        message: 'Test suite failed to execute'
      }
    }, { status: 500 });
  }
}
