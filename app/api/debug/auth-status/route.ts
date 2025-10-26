import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getAuthenticatedEmployer, requireEmployerAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug auth status endpoint called');
    
    // Test basic auth
    const basicUser = await getAuthenticatedUser();
    console.log('👤 Basic user auth:', basicUser);
    
    // Test employer auth
    const employerUser = await getAuthenticatedEmployer();
    console.log('👤 Employer user auth:', employerUser);
    
    // Test require employer auth
    const requireAuth = await requireEmployerAuth();
    console.log('👤 Require employer auth:', requireAuth);
    
    return NextResponse.json({
      success: true,
      debug: {
        basicUser,
        employerUser,
        requireAuth,
        timestamp: new Date().toISOString(),
        headers: Object.fromEntries(request.headers.entries())
      }
    });

  } catch (_error) {
    console.error('❌ Error in debug auth status endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check auth status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}
