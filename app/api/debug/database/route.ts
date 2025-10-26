import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    const jobCount = await prisma.job.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      debug: {
        userCount,
        jobCount,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      },
      timestamp: new Date().toISOString()
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
