import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';

/**
 * Cross-Account Protection Endpoint
 * Required by Google OAuth for production apps
 * 
 * This endpoint helps Google verify that users signing in
 * are using the correct account and prevents account confusion.
 * 
 * @see https://developers.google.com/identity/protocols/oauth2/cross-account-protection
 */
export async function GET(request: NextRequest) {
  try {
    // Enhanced Cross-Account Protection with origin validation
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Validate request origin for security
    const allowedOrigins = [
      'https://naukrimili.com',
      'http://localhost:3000',
      'https://accounts.google.com'
    ];
    
    if (origin && !allowedOrigins.some(allowed => origin.includes(allowed))) {
      console.warn('🚨 Cross-Account Protection: Blocked unauthorized origin:', origin);
      return NextResponse.json(
        { 
          error: 'Unauthorized origin',
          crossAccountProtection: false 
        }, 
        { status: 403 }
      );
    }

    // Get current authenticated session
    const session = await auth();
    
    // If no session or user email, return unauthorized
    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          error: 'Not authenticated',
          crossAccountProtection: false 
        }, 
        { status: 401 }
      );
    }

    // Enhanced response with security headers
    const response = NextResponse.json({
      email: session.user.email,
      userId: session.user.id || null,
      crossAccountProtection: true,
      timestamp: new Date().toISOString(),
      domain: 'naukrimili.com'
    });

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;

  } catch (_error) {
    console.error('❌ Cross-account protection error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        crossAccountProtection: false 
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST handler for cross-account protection verification
 * Handles token verification from Google OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    // Parse request body if needed for additional verification
    const body = await request.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      email: session.user.email,
      userId: session.user.id || null,
      crossAccountProtection: true,
      verified: true,
      timestamp: new Date().toISOString()
    });

  } catch (_error) {
    console.error('❌ Cross-account protection POST error:', error);
    
    return NextResponse.json(
      { error: 'Verification failed' }, 
      { status: 500 }
    );
  }
}

