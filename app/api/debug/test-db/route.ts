import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    // Simple test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Database connection successful');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result: result
    });

  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
