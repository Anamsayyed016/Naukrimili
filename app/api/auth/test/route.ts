import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'
    };

    // Check if Google OAuth is properly configured
    const googleOAuthStatus = {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      isConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      redirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      googleOAuth: googleOAuthStatus,
      instructions: {
        nextSteps: [
          '1. Verify all environment variables are set correctly',
          '2. Ensure Google OAuth redirect URI matches exactly in Google Cloud Console',
          '3. Check browser console for any JavaScript errors',
          '4. Verify database connection is working',
          '5. Test OAuth flow with proper redirect URIs'
        ],
        googleCloudConsole: 'https://console.cloud.google.com/apis/credentials',
        redirectUri: googleOAuthStatus.redirectUri
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test endpoint failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
