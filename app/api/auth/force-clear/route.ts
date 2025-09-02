import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';

/**
 * Force Clear All Authentication State
 * This endpoint clears all server-side sessions and forces re-authentication
 * Use this when you need to completely reset the authentication state
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session to log what we're clearing
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      console.log('🔄 Force clearing session for user:', session.user.email);
    }

    // Create a response that will clear all cookies
    const response = NextResponse.json({
      success: true,
      message: 'All authentication state cleared successfully',
      timestamp: new Date().toISOString(),
      cleared: {
        session: !!session,
        userEmail: session?.user?.email || null,
        timestamp: new Date().toISOString()
      }
    });

    // Clear all NextAuth cookies
    const cookieNames = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token',
      'next-auth.pkce.code-verifier',
      '__Host-next-auth.csrf-token'
    ];

    cookieNames.forEach(cookieName => {
      // Clear cookie with various path and domain combinations
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // Also try to clear with /api path
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/api',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // And with /auth path
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/auth',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    // Clear any other potential auth cookies
    const additionalCookieNames = [
      'auth_token',
      'user_token',
      'session_token',
      'access_token',
      'refresh_token'
    ];

    additionalCookieNames.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    // Add headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    console.log('✅ Force clear completed successfully');
    
    return response;

  } catch (error) {
    console.error('❌ Error during force clear:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear authentication state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET method to check current authentication state
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any)?.role
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error checking session:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check authentication state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * OPTIONS method for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
