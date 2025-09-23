import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug session endpoint called');
    
    const session = await auth();
    console.log('📋 Session data:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      sessionKeys: session ? Object.keys(session) : []
    });
    
    return NextResponse.json({
      success: true,
      session: session ? {
        hasSession: true,
        hasUser: !!session.user,
        userId: session.user?.id,
        userEmail: session.user?.email,
        userRole: session.user?.role,
        userName: session.user?.name,
        userImage: session.user?.image,
        isActive: (session.user as any)?.isActive,
        sessionKeys: Object.keys(session)
      } : {
        hasSession: false,
        message: 'No session found'
      }
    });
  } catch (error) {
    console.error('❌ Debug session error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}