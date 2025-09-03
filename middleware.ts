import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Skip middleware for API routes and static files
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/')
    ) {
      return NextResponse.next();
    }

    // If user is authenticated and requires OTP verification for Google OAuth
    if (token && (token as any).requiresOTP && (token as any).otpPurpose === 'gmail-oauth') {
      // Redirect to OTP verification page (except if already on verify-otp page)
      if (pathname !== '/auth/verify-otp') {
        console.log('🔄 Middleware: Redirecting to OTP verification for Google OAuth user');
        return NextResponse.redirect(new URL('/auth/verify-otp', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Allow access to auth pages and public pages
        if (
          pathname.startsWith('/auth/') ||
          pathname.startsWith('/api/') ||
          pathname === '/' ||
          pathname.startsWith('/jobs') ||
          pathname.startsWith('/companies')
        ) {
          return true;
        }

        // For protected routes, require authentication
        return !!token;
      },
    },
  }
);

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