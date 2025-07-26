import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { env } from './lib/env';
import { generateCSP } from './lib/csp';
import { checkRateLimit } from './lib/rate-limit';
import { validateCSRFToken, getCSRFTokenFromRequest, isCSRFProtectedMethod } from './lib/csrf';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Enhanced CSRF token validation
function validateCSRFTokenMiddleware(request: NextRequest): boolean {
  if (!isCSRFProtectedMethod(request.method)) {
    return true;
  }
  
  const sessionId = request.cookies.get('session-id')?.value;
  if (!sessionId) {
    return false; // No session, no CSRF protection needed
  }
  
  const csrfToken = getCSRFTokenFromRequest(request);
  if (!csrfToken) {
    return false;
  }
  
  return validateCSRFToken(sessionId, csrfToken);
}

// Rate limiting
function checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();
  
  // Enhanced security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', generateCSP());
  
  if (env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Enhanced rate limiting for API routes
  if (path.startsWith('/api/')) {
    let limitType: 'auth' | 'upload' | 'search' | 'api' = 'api';
    
    if (path.includes('/auth/')) limitType = 'auth';
    else if (path.includes('/upload')) limitType = 'upload';
    else if (path.includes('/search')) limitType = 'search';
    
    const rateLimit = checkRateLimit(request, limitType);
    
    if (!rateLimit.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }
    
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    
    // Enhanced CSRF protection
    if (!validateCSRFTokenMiddleware(request)) {
      console.warn('CSRF validation failed', { path, ip: request.ip });
      return new NextResponse('CSRF token validation failed', { status: 403 });
    }
  }
  
  // Authentication check for protected routes
  const protectedPaths = ['/dashboard', '/admin', '/employer', '/jobseeker'];
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p));
  
  if (isProtectedPath) {
    const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET });
    
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Role-based access control
    if (path.startsWith('/admin') && token.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    if (path.startsWith('/employer') && !['employer', 'admin'].includes(token.role as string)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  
  // CORS for API routes
  if (path.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      env.NEXTAUTH_URL
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/employer/:path*',
    '/jobseeker/:path*'
  ],
};
