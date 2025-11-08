import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Database test endpoint called');
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      errors: [],
      success: []
    };

    // Test 1: Basic database connection (singleton is already connected)
    try {
      // Just test a query - singleton handles connection automatically
      await prisma.$queryRaw`SELECT 1`;
      debugInfo.connection = { status: 'Connected', success: true };
      debugInfo.success.push('Database connection successful');
    } catch (_error) {
      debugInfo.connection = { 
        status: 'Failed', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
      debugInfo.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: User count
    try {
      const userCount = await prisma.user.count();
      debugInfo.userCount = userCount;
      debugInfo.success.push(`User count retrieved: ${userCount}`);
    } catch (_error) {
      debugInfo.errors.push(`User count failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Company count
    try {
      const companyCount = await prisma.company.count();
      debugInfo.companyCount = companyCount;
      debugInfo.success.push(`Company count retrieved: ${companyCount}`);
    } catch (_error) {
      debugInfo.errors.push(`Company count failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Sample users
    try {
      const users = await prisma.user.findMany({
        take: 3,
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true
        }
      });
      debugInfo.sampleUsers = users;
      debugInfo.success.push(`Sample users retrieved: ${users.length}`);
    } catch (_error) {
      debugInfo.errors.push(`Sample users failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Sample companies
    try {
      const companies = await prisma.company.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          createdBy: true,
          isActive: true
        }
      });
      debugInfo.sampleCompanies = companies;
      debugInfo.success.push(`Sample companies retrieved: ${companies.length}`);
    } catch (_error) {
      debugInfo.errors.push(`Sample companies failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const hasErrors = debugInfo.errors.length > 0;

    return NextResponse.json({
      success: !hasErrors,
      debug: debugInfo,
      summary: {
        totalTests: 5,
        errors: debugInfo.errors.length,
        successes: debugInfo.success.length
      }
    }, { 
      status: hasErrors ? 500 : 200 
    });

  } catch (_error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
