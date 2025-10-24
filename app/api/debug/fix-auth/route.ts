import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { getAuthenticatedUser, getAuthenticatedEmployer, requireEmployerAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fix Auth Debug - Starting comprehensive analysis');
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set',
      errors: [],
      warnings: [],
      success: [],
      fixes: []
    };

    // Test 1: Environment variables
    if (!process.env.NEXTAUTH_SECRET) {
      debugInfo.errors.push('NEXTAUTH_SECRET is not set');
    } else {
      debugInfo.success.push('NEXTAUTH_SECRET is set');
    }

    if (!process.env.DATABASE_URL) {
      debugInfo.errors.push('DATABASE_URL is not set');
    } else {
      debugInfo.success.push('DATABASE_URL is set');
    }

    // Test 2: Database connection
    try {
      await prisma.$connect();
      const userCount = await prisma.user.count();
      debugInfo.database = { connected: true, userCount };
      debugInfo.success.push('Database connection successful');
    } catch (error) {
      debugInfo.database = { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
      debugInfo.errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: NextAuth session
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
      
      if (session?.user) {
        debugInfo.success.push('NextAuth session exists with user');
      } else {
        debugInfo.warnings.push('No NextAuth session or user found');
      }
    } catch (error) {
      debugInfo.errors.push(`NextAuth session error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Basic authentication
    try {
      const basicUser = await getAuthenticatedUser();
      debugInfo.basicAuth = {
        success: !!basicUser,
        user: basicUser ? {
          id: basicUser.id,
          email: basicUser.email,
          role: basicUser.role
        } : null
      };
      
      if (basicUser) {
        debugInfo.success.push('Basic authentication successful');
      } else {
        debugInfo.warnings.push('Basic authentication failed - no user found');
      }
    } catch (error) {
      debugInfo.errors.push(`Basic auth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 5: Employer authentication
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
        debugInfo.warnings.push('Employer authentication failed - no employer found');
      }
    } catch (error) {
      debugInfo.errors.push(`Employer auth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 6: Require employer auth
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
    } catch (error) {
      debugInfo.errors.push(`Require auth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 7: Headers and cookies
    debugInfo.headers = {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie') ? 'Present' : 'Not Present',
      userAgent: request.headers.get('user-agent'),
      host: request.headers.get('host'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    };

    const cookies = request.cookies.getAll();
    debugInfo.cookies = {
      count: cookies.length,
      cookies: cookies.map(c => ({ name: c.name, value: c.value ? 'Present' : 'Not Present' }))
    };

    // Test 8: Company data
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
      debugInfo.success.push('Company data retrieved successfully');
    } catch (error) {
      debugInfo.errors.push(`Company query error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Generate fixes based on errors
    if (debugInfo.errors.length > 0) {
      debugInfo.fixes.push('Fix 1: Check environment variables (NEXTAUTH_SECRET, DATABASE_URL)');
      debugInfo.fixes.push('Fix 2: Ensure database is running and accessible');
      debugInfo.fixes.push('Fix 3: Check NextAuth configuration');
      debugInfo.fixes.push('Fix 4: Verify user authentication flow');
    }

    if (debugInfo.warnings.length > 0) {
      debugInfo.fixes.push('Fix 5: Ensure user is properly logged in');
      debugInfo.fixes.push('Fix 6: Check user role assignment');
      debugInfo.fixes.push('Fix 7: Verify session persistence');
    }

    const hasErrors = debugInfo.errors.length > 0;
    const hasWarnings = debugInfo.warnings.length > 0;

    return NextResponse.json({
      success: !hasErrors,
      debug: debugInfo,
      summary: {
        totalTests: 8,
        errors: debugInfo.errors.length,
        warnings: debugInfo.warnings.length,
        successes: debugInfo.success.length,
        fixes: debugInfo.fixes.length
      }
    }, { 
      status: hasErrors ? 500 : 200 
    });

  } catch (error) {
    console.error('❌ Fix auth debug error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Fix auth debug failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
