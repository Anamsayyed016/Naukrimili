import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    // Safety check for request and nextUrl
    if (!request || !request.nextUrl) {
      return NextResponse.next();
    }

    const { pathname } = request.nextUrl;
    
    // Safety check for pathname
    if (!pathname || typeof pathname !== 'string') {
      return NextResponse.next();
    }

    // Protect debug routes in production
    if (pathname.startsWith('/api/debug') || pathname.startsWith('/debug') || pathname.startsWith('/mobile-debug')) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    // For now, let all other requests pass through
    // We can add job URL routing back later once the basic middleware works
    return NextResponse.next();
    
  } catch (error) {
    console.error('❌ Middleware error:', error);
    // Always return NextResponse.next() to prevent middleware from breaking the app
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/jobs/:path*'
  ]
};