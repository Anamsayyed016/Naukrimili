import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";

export async function requireAdminAuth(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + request.url, request.url));
    }

    if (session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url));
    }

    return null; // No redirect needed
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard/admin') || pathname.startsWith('/admin');
}
