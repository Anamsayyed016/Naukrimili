import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug auth route called');
    
    const session = await auth();
    console.log('🔍 Session from auth():', session);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No session found',
        session: null
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Session found',
      session: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug auth error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
