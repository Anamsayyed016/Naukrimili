import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/database-service';

export async function GET() {
  const db = await checkDatabaseHealth();
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Job Portal API is running',
    database: {
      healthy: db.isHealthy,
      latencyMs: db.latency,
      error: db.error || null,
    },
  });
}