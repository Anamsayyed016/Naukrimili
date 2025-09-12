import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic database connection
    const jobCount = await prisma.job.count();
    console.log('✅ Database connection successful. Job count:', jobCount);
    
    // Test specific job query
    const job = await prisma.job.findUnique({
      where: { id: '4' },
      include: {
        companyRelation: {
          select: {
            name: true,
            logo: true,
            location: true,
            industry: true,
            website: true
          }
        }
      }
    });
    
    console.log('✅ Job query result:', job ? 'Found' : 'Not found');
    
    return NextResponse.json({
      success: true,
      jobCount,
      jobFound: !!job,
      job: job || null
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}