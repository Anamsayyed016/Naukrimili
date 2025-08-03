import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    // Mock debug jobs data
    const debugData = {
      success: true,
      message: 'Debug jobs endpoint',
      timestamp: new Date().toISOString(),
      debugInfo: {
        totalJobsInSystem: 15420,
        jobsBySource: {
          adzuna: 8500,
          reed: 3200,
          indeed: 2800,
          manual: 920
        },
        lastJobSync: new Date(Date.now() - 3600000).toISOString(),
        cacheStatus: 'healthy',
        apiKeys: {
          adzuna: process.env.ADZUNA_API_KEY ? 'configured' : 'missing',
          reed: process.env.REED_API_KEY ? 'configured' : 'missing',
          indeed: process.env.INDEED_API_KEY ? 'configured' : 'missing'
        }
      },
      sampleJobs: [
        {
          id: 'debug-1',
          title: 'Debug Job 1',
          company: 'Debug Corp',
          location: 'Debug City',
          source: 'manual',
          status: 'active'
        },
        {
          id: 'debug-2',
          title: 'Debug Job 2',
          company: 'Test Company',
          location: 'Test City',
          source: 'adzuna',
          status: 'active'
        }
      ]
    };

    return Response.json(debugData);
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/debug-jobs',
      context: { timestamp: new Date().toISOString() }
    });
  }
}
