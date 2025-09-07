import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/nextauth-config";

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/')
  ) {
    return NextResponse.next();
  }

  // Allow access to auth pages and public pages
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/') ||
    pathname === '/' ||
    pathname.startsWith('/jobs') ||
    pathname.startsWith('/companies')
  ) {
    return NextResponse.next();
  }

  // For protected routes, require authentication
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // If user is authenticated but has no role, redirect to onboarding
  if (!session.user?.role && !pathname.startsWith('/auth/onboarding')) {
    return NextResponse.redirect(new URL('/auth/onboarding', req.url));
  }

  return NextResponse.next();
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