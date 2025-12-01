import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Canonical base URL - single source of truth
const CANONICAL_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://naukrimili.com';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  // Skip redirects for:
  // 1. Localhost/development environments (localhost, 127.0.0.1, 0.0.0.0)
  // 2. Health check endpoints
  // 3. Internal API routes that need to work in development
  const isLocalhost = hostname.includes('localhost') || 
                      hostname.includes('127.0.0.1') || 
                      hostname.includes('0.0.0.0') ||
                      hostname.startsWith('192.168.') ||
                      hostname.startsWith('10.') ||
                      hostname.startsWith('172.');
  
  const isHealthCheck = pathname.startsWith('/api/health') || 
                        pathname.startsWith('/health') ||
                        pathname === '/api/health';
  
  // Only apply redirects in production for actual domain names
  const isProduction = process.env.NODE_ENV === 'production';
  const isActualDomain = !isLocalhost && hostname.includes('.');
  
  // URL Normalization: Redirect www → non-www and http → https
  // BUT ONLY for production domains, not localhost
  if (isProduction && isActualDomain && !isHealthCheck) {
    const needsRedirect = 
      hostname.startsWith('www.') || 
      (request.nextUrl.protocol === 'http:' && !isLocalhost);
    
    if (needsRedirect) {
      // Remove www subdomain
      if (hostname.startsWith('www.')) {
        url.hostname = hostname.replace(/^www\./, '');
      }
      
      // Force https (only for actual domains, not localhost)
      if (request.nextUrl.protocol === 'http:' && !isLocalhost) {
        url.protocol = 'https:';
      }
      
      // Redirect to canonical URL
      return NextResponse.redirect(url, 301); // Permanent redirect
    }
  }

  // Handle preflight requests for OAuth routes first
  if (request.method === 'OPTIONS' && request.nextUrl.pathname.startsWith('/api/auth/')) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': CANONICAL_BASE_URL,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  const response = NextResponse.next();
  
  // Enhanced OAuth security for auth routes
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    // Allow all OAuth-related requests to pass through to NextAuth
    // NextAuth will handle the authentication logic
    
    // Set OAuth-specific CORS headers
    response.headers.set('Access-Control-Allow-Origin', CANONICAL_BASE_URL);
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
    // CRITICAL FIX: Must use specific origin for credentials (cookies) to work
    response.headers.set('Access-Control-Allow-Origin', CANONICAL_BASE_URL);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
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
        'Access-Control-Allow-Origin': CANONICAL_BASE_URL,
        'Access-Control-Allow-Credentials': 'true',
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
