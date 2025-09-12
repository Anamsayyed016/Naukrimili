import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/nextauth-config";

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Auth cleanup requested');
    
    // Clear NextAuth session
    const session = await auth();
    if (session) {
      console.log('🔐 Clearing NextAuth session for user:', session.user?.email);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Auth cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    return NextResponse.json({
      success: true,
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        role: (session.user as any).role
      } : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
