import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    // Mock admin dashboard data
    const dashboardData = {
      success: true,
      stats: {
        totalUsers: 15420,
        totalJobs: 8750,
        totalApplications: 23450,
        activeCompanies: 1250,
        fraudReports: 45,
        systemHealth: 'healthy'
      },
      recentActivity: [
        {
          id: '1',
          type: 'user_registration',
          message: 'New user registered: john.doe@example.com',
          timestamp: new Date().toISOString(),
          severity: 'info'
        },
        {
          id: '2',
          type: 'job_posted',
          message: 'New job posted: Senior Software Engineer at Tech Corp',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'info'
        },
        {
          id: '3',
          type: 'fraud_report',
          message: 'Fraud report submitted for job ID: 12345',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          severity: 'warning'
        }
      ],
      systemMetrics: {
        cpuUsage: 45,
        memoryUsage: 68,
        diskSpace: 72,
        responseTime: 245
      }
    };

    return Response.json(dashboardData);
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/admin',
      context: { timestamp: new Date().toISOString() }
    });
  }
}
