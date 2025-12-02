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
  // CRITICAL: Don't force HTTPS if server is running on HTTP port (e.g., :3000)
  if (isProduction && isActualDomain && !isHealthCheck) {
    // CRITICAL FIX: Use X-Forwarded-Port and X-Forwarded-Proto from Nginx proxy
    // When behind a reverse proxy, the app sees internal port (3000) not external port (443)
    const forwardedPort = request.headers.get('x-forwarded-port') || '';
    const forwardedProto = request.headers.get('x-forwarded-proto') || '';
    const requestPort = forwardedPort || request.nextUrl.port || '';
    const isNonStandardPort = requestPort && requestPort !== '80' && requestPort !== '443';
    const isHttpPort3000 = requestPort === '3000';
    
    // Check if we need to redirect
    const hasWww = hostname.startsWith('www.');
    
    // Only force HTTPS if:
    // 1. Request is HTTP
    // 2. Not localhost
    // 3. NOT on port 3000 (development/testing port)
    // 4. NOT on any non-standard HTTP por
    // t
    const shouldForceHttps = 
      request.nextUrl.protocol === 'http:' && 
      !isLocalhost && 
      !isHttpPort3000 && 
      !isNonStandardPort;
    
    const needsRedirect = hasWww || shouldForceHttps;
    
    if (needsRedirect) {
      // Remove www subdomain (keep same protocol and port)
      if (hasWww) {
        url.hostname = hostname.replace(/^www\./, '');
      }
      
      // Force https ONLY if conditions are met (not on port 3000)
      // This prevents SSL errors when server is running on HTTP
      if (shouldForceHttps) {
        url.protocol = 'https:';
        // Remove port if it's the default HTTP port (80)
        if (requestPort === '80' || !requestPort) {
          url.port = '';
        }
      } else {
        // Use forwarded protocol if behind proxy (Nginx sends x-forwarded-proto)
        url.protocol = forwardedProto ? `${forwardedProto}:` : request.nextUrl.protocol;
        // CRITICAL: Remove port for standard HTTPS (443) to avoid :3000 in redirects
        if (forwardedProto === 'https' || forwardedPort === '443') {
          url.port = '';
        } else if (requestPort && requestPort !== '80' && requestPort !== '3000') {
          url.port = requestPort;
        } else {
          url.port = '';
        }
      }
      
      // Redirect to canonical URL
      return NextResponse.redirect(url.toString(), 301); // Permanent redirect
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
