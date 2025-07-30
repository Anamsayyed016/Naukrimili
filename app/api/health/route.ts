import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    // Basic health metrics
    const health = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodejs: process.version,
      platform: process.platform,
      services: {
        api: true,
        database: true // In production, you'd want to do an actual DB health check
      }
    };

    return Response.json(health);
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/health',
      context: {
        timestamp: new Date().toISOString()
      }
    });
  }
}