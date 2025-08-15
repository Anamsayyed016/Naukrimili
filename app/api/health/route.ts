import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/database';

export async function GET() {
  try {
    const health = await databaseService.checkHealth();
    const currentMode = databaseService.getCurrentMode();
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      database: {
        mode: currentMode,
        health: health,
        url: process.env.DATABASE_URL ? 'configured' : 'not configured'
      },
      features: {
        mockData: currentMode === 'development-mock',
        postgresql: currentMode === 'production-postgresql',
        automatic: true
      },
      message: `Database service running in ${currentMode} mode`
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        mode: 'error',
        health: { isHealthy: false, error: 'Health check failed' }
      }
    }, { status: 500 });
  }
}