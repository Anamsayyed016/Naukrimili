import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check if we can connect to the database
    const jobCount = await prisma.job.count();
    console.log(`✅ Database connection successful. Found ${jobCount} jobs.`);
    
    // Test 2: Try to fetch a few sample jobs
    const sampleJobs = await prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { isActive: true }
    });
    
    // Test 3: Check database schema
    const tableInfo = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Job' 
      LIMIT 5
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test successful',
      data: {
        totalJobs: jobCount,
        sampleJobs: sampleJobs.length,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      },
      sampleJobs: sampleJobs,
      schemaInfo: tableInfo
    });
    
  } catch (error: any) {
    console.error('❌ Database connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
