import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';


export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: (session.user as any)?.role
        }
      } : null,
      message: session ? 'User is authenticated' : 'User is not authenticated'
    });
  } catch (error) {
    console.error('OAuth test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
