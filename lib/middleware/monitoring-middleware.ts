/**
 * Monitoring Middleware
 * 
 * Automatically tracks performance, errors, and metrics for all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/lib/services/monitoring-service';

export function withMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const request = args[0] as NextRequest;
    const endpoint = request.nextUrl.pathname;
    const method = request.method;
    
    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Execute the original handler
      response = await handler(...args);
      
      // Log performance metrics
      MonitoringService.logPerformance({
        endpoint,
        method,
        duration: Date.now() - startTime,
        statusCode: response.status,
        userId: request.headers.get('x-user-id') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage().user / 1000000 // Convert to milliseconds
      });

      return response;

    } catch (err) {
      error = err instanceof Error ? err : new Error('Unknown error');
      
      // Log error
      MonitoringService.logError(error, {
        endpoint,
        method,
        requestId: request.headers.get('x-request-id') || undefined,
        userId: request.headers.get('x-user-id') || undefined
      }, 'high');

      // Return error response
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  };
}

/**
 * Database query monitoring wrapper
 */
export function withDatabaseMonitoring<T extends any[]>(
  queryFn: (...args: T) => Promise<any>,
  queryName: string
) {
  return async (...args: T): Promise<any> => {
    const startTime = Date.now();
    let success = true;
    let error: string | undefined;
    let rowsAffected: number | undefined;

    try {
      const result = await queryFn(...args);
      
      // Try to determine rows affected
      if (Array.isArray(result)) {
        rowsAffected = result.length;
      } else if (result && typeof result === 'object' && 'count' in result) {
        rowsAffected = result.count;
      }

      return result;

    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown database error';
      throw err;

    } finally {
      // Log database metrics
      MonitoringService.logDatabaseQuery(
        queryName,
        Date.now() - startTime,
        success,
        rowsAffected,
        error
      );
    }
  };
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<NextResponse> {
  try {
    // Perform basic health checks
    await MonitoringService.performHealthCheck('database', async () => {
      // Add database health check here
      return true;
    });

    await MonitoringService.performHealthCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      return memUsage.heapUsed < 500 * 1024 * 1024; // 500MB limit
    });

    const healthStatus = MonitoringService.getHealthStatus();
    const metrics = MonitoringService.getComprehensiveMetrics();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      health: healthStatus,
      metrics: {
        performance: metrics.performance,
        errors: metrics.errors,
        database: metrics.database
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    }, { status: 503 });
  }
}
