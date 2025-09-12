import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/nextauth-config';

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Force logout completed successfully'
    });

    // Clear all possible authentication cookies
    const cookieNames = [
      'next-auth.session-token',
      'next-auth.csrf-token', 
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      '__Secure-next-auth.callback-url',
      'user',
      'token',
      'auth-token',
      'session-token'
    ];

    cookieNames.forEach(cookieName => {
      // Clear cookie by setting it to expire in the past
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // Also try clearing with different path variations
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;
  } catch (error) {
    console.error('Error in force logout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to force logout' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Use POST method to force logout'
  });
}
