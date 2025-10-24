import { NextRequest, NextResponse } from 'next/server';
import { requireEmployerAuth, getAuthenticatedUser, getAuthenticatedEmployer } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug employer auth endpoint called');
    
    // Test basic auth
    const basicAuth = await getAuthenticatedUser();
    console.log('👤 Basic auth result:', basicAuth);
    
    // Test employer auth
    const employerAuth = await getAuthenticatedEmployer();
    console.log('🏢 Employer auth result:', employerAuth);
    
    // Test require employer auth
    const requireAuth = await requireEmployerAuth();
    console.log('🔐 Require employer auth result:', requireAuth);
    
    return NextResponse.json({
      success: true,
      basicAuth: basicAuth ? {
        id: basicAuth.id,
        email: basicAuth.email,
        name: basicAuth.name,
        role: basicAuth.role
      } : null,
      employerAuth: employerAuth ? {
        id: employerAuth.id,
        email: employerAuth.email,
        name: employerAuth.name,
        role: employerAuth.role,
        company: employerAuth.company
      } : null,
      requireAuth: "error" in requireAuth ? {
        error: requireAuth.error,
        status: requireAuth.status
      } : {
        success: true,
        user: {
          id: requireAuth.user.id,
          email: requireAuth.user.email,
          name: requireAuth.user.name,
          role: requireAuth.user.role,
          company: requireAuth.user.company
        }
      }
    });
  } catch (error) {
    console.error('❌ Debug employer auth error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
