import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { getAuthenticatedUser, getAuthenticatedEmployer, requireEmployerAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Comprehensive Auth Debug - Starting');
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      errors: [],
      warnings: [],
      success: []
    };

    // Test 1: Basic NextAuth session
    try {
      const session = await auth();
      debugInfo.session = {
        exists: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userRole: session?.user?.role,
        isActive: (session?.user as any)?.isActive
      };
      debugInfo.success.push('NextAuth session retrieved');
    } catch (_error) {
      debugInfo.errors.push(`NextAuth session error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: Database connection
    try {
      const userCount = await prisma.user.count();
      debugInfo.database = {
        connected: true,
        userCount,
        status: 'Connected'
      };
      debugInfo.success.push('Database connection successful');
    } catch (_error) {
      debugInfo.database = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'Failed'
      };
      debugInfo.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Basic user authentication
    try {
      const basicUser = await getAuthenticatedUser();
      debugInfo.basicAuth = {
        success: !!basicUser,
        user: basicUser ? {
          id: basicUser.id,
          email: basicUser.email,
          role: basicUser.role,
          isActive: (basicUser as any).isActive
        } : null
      };
      if (basicUser) {
        debugInfo.success.push('Basic user authentication successful');
      } else {
        debugInfo.warnings.push('No authenticated user found');
      }
    } catch (_error) {
      debugInfo.errors.push(`Basic auth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Employer authentication
    try {
      const employerUser = await getAuthenticatedEmployer();
      debugInfo.employerAuth = {
        success: !!employerUser,
        user: employerUser ? {
          id: employerUser.id,
          email: employerUser.email,
          role: employerUser.role,
          hasCompany: !!employerUser.company
        } : null
      };
      if (employerUser) {
        debugInfo.success.push('Employer authentication successful');
      } else {
        debugInfo.warnings.push('No authenticated employer found');
      }
    } catch (_error) {
      debugInfo.errors.push(`Employer auth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Require employer auth
    try {
      const requireAuth = await requireEmployerAuth();
      debugInfo.requireAuth = {
        success: !('error' in requireAuth),
        hasError: 'error' in requireAuth,
        error: 'error' in requireAuth ? requireAuth.error : null,
        status: 'error' in requireAuth ? requireAuth.status : null,
        user: 'user' in requireAuth ? {
          id: requireAuth.user.id,
          email: requireAuth.user.email,
          role: requireAuth.user.role
        } : null
      };
      if ('user' in requireAuth) {
        debugInfo.success.push('Require employer auth successful');
      } else {
        debugInfo.warnings.push(`Require employer auth failed: ${requireAuth.error}`);
      }
    } catch (_error) {
      debugInfo.errors.push(`Require auth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 6: Company profile check
    try {
      const companies = await prisma.company.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          createdBy: true,
          isActive: true
        }
      });
      debugInfo.companies = {
        count: companies.length,
        companies: companies
      };
      debugInfo.success.push('Company data retrieved');
    } catch (_error) {
      debugInfo.errors.push(`Company query error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 7: Headers analysis
    debugInfo.headers = {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie') ? 'Present' : 'Not Present',
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    };

    // Test 8: Cookie analysis
    const cookies = request.cookies.getAll();
    debugInfo.cookies = {
      count: cookies.length,
      cookies: cookies.map(c => ({ name: c.name, value: c.value ? 'Present' : 'Not Present' }))
    };

    const hasErrors = debugInfo.errors.length > 0;
    const hasWarnings = debugInfo.warnings.length > 0;

    return NextResponse.json({
      success: !hasErrors,
      debug: debugInfo,
      summary: {
        totalTests: 8,
        errors: debugInfo.errors.length,
        warnings: debugInfo.warnings.length,
        successes: debugInfo.success.length
      }
    }, { 
      status: hasErrors ? 500 : 200 
    });

  } catch (_error) {
    console.error('❌ Comprehensive auth debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Comprehensive auth debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
