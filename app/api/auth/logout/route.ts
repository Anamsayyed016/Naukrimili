import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';


export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'No active session found' },
        { status: 401 }
      );
    }

    // Clear any server-side session data if needed
    // NextAuth handles most of the session cleanup automatically
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}