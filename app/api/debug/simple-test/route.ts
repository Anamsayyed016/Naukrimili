import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Simple test endpoint called');
    
    // Test basic auth
    const session = await auth();
    console.log('📋 Session:', session);
    
    return NextResponse.json({
      success: true,
      message: 'Simple test successful',
      session: session ? {
        hasUser: !!session.user,
        userId: session.user?.id,
        userEmail: session.user?.email,
        userRole: session.user?.role
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (_error) {
    console.error('❌ Simple test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Simple test failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
