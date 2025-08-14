import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Basic health checks
    const healthChecks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        api: 'operational',
        database: 'mock_data', // Using mock data instead of real database
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      }
    };

    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: healthChecks,
      responseTime: `${responseTime}ms`,
      message: 'System is healthy'
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}