import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/utils/csrf';

export async function GET(_request: NextRequest) {
  try {
    // Generate a new CSRF token
    const token = generateCSRFToken();
    
    // Set the token in a cookie
    const response = NextResponse.json({
      success: true,
      token,
      message: 'CSRF token generated successfully'
    });
    
    // Set the token in an httpOnly cookie
    response.cookies.set('next-auth.csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: parseInt(process.env.CSRF_TIMEOUT || '3600')
    });
    
    return response;
  } catch (_error) {
    console.error('CSRF token generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate CSRF token'
    }, { status: 500 });
  }
}
