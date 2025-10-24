import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;

    const isGoogleConfigured = googleClientId && googleClientSecret && 
      !googleClientId.includes('your-') && !googleClientSecret.includes('your-') &&
      googleClientId !== '' && googleClientSecret !== '';

    return NextResponse.json({
      success: true,
      oauth: {
        google: {
          configured: isGoogleConfigured,
          clientId: googleClientId ? `${googleClientId.substring(0, 20)}...` : 'Not set',
          clientSecret: googleClientSecret ? 'Set' : 'Not set',
        },
        nextauth: {
          url: nextAuthUrl,
          secret: nextAuthSecret ? 'Set' : 'Not set',
        }
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
