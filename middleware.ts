import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();
  
  // Basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Authentication check for protected routes
  const protectedPaths = ['/dashboard', '/admin', '/employer', '/jobseeker'];
  const isProtectedPath = protectedPaths.some(p => path.startsWith(p));
  
  if (isProtectedPath) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
      });
      
      if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error('Middleware auth error:', error);
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/employer/:path*',
    '/jobseeker/:path*'
  ],
};