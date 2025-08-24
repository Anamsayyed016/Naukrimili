import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // CSRF protection for state-changing operations
  if (request.method !== 'GET' && request.nextUrl.pathname.startsWith('/api/auth/')) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Block requests without proper origin/referer for auth routes
    if (!origin || !referer) {
      return NextResponse.json(
        { error: 'CSRF protection: Missing origin or referer' },
        { status: 403 }
      );
    }
    
    // Validate origin matches expected domain
    const expectedOrigin = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    if (!origin.startsWith(expectedOrigin)) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid origin' },
        { status: 403 }
      );
    }
  }

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL || 'http://localhost:3000');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Add security headers for all routes
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
