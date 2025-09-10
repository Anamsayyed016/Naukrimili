import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic database connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Test User table
    const userCount = await prisma.user.count();
    console.log('👤 User count:', userCount);
    
    // Test Resume table
    const resumeCount = await prisma.resume.count();
    console.log('📄 Resume count:', resumeCount);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        connection: 'OK',
        userCount,
        resumeCount,
        testQuery: result
      }
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
      details: error
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
