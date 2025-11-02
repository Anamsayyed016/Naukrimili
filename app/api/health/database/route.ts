import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const isHealthy = await checkDatabaseHealth(3, 2000);
    const responseTime = Date.now() - startTime;
    
    if (isHealthy) {
      return NextResponse.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        database: 'disconnected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
