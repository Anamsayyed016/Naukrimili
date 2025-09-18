import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Allow access to public pages
  if (
    pathname === '/' ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/companies') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms')
  ) {
    return NextResponse.next();
  }

  // For protected routes, check for authentication via cookies
  const sessionToken = req.cookies.get('next-auth.session-token') || 
                      req.cookies.get('__Secure-next-auth.session-token');
  
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};