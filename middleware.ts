import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Enhanced OAuth security for auth routes
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    // Log regional OAuth attempts for debugging
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const cfCountry = request.headers.get('cf-ipcountry') || 'unknown';
    const xForwardedFor = request.headers.get('x-forwarded-for') || 'unknown';
    
    console.log('🌍 OAuth Request:', {
      path: request.nextUrl.pathname,
      method: request.method,
      country: cfCountry,
      userAgent: userAgent.substring(0, 100), // Truncate for logs
      ip: xForwardedFor.split(',')[0],
      timestamp: new Date().toISOString()
    });
    // Cross-Account Protection - restrict to naukrimili.com
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    // Enhanced origin validation for Cross-Account Protection
    const allowedOrigins = [
      'https://naukrimili.com',
      'http://localhost:3000',
      'https://accounts.google.com',
      'https://www.googleapis.com'
    ];
    
    if (origin && !allowedOrigins.some(allowed => origin.includes(allowed))) {
      console.warn('🚨 Cross-Account Protection: Blocked unauthorized origin:', origin);
      return new NextResponse('Unauthorized origin', { status: 403 });
    }
    
    // Allow Google OAuth domains for OAuth callbacks
    const allowedRefererDomains = [
      'naukrimili.com',
      'localhost',
      'accounts.google.com',
      'www.googleapis.com'
    ];

    if (referer && !allowedRefererDomains.some(domain => referer.includes(domain))) {
      console.warn('🚨 Cross-Account Protection: Blocked unauthorized referer:', referer);
      return new NextResponse('Unauthorized referer', { status: 403 });
    }
    
    // OAuth-specific CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin || 'https://naukrimili.com');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    
    return response;
  }
  
  // Standard CORS headers for other API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
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
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Add security headers for all routes
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
