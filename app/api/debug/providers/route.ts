import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Google OAuth is configured
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    const isGoogleConfigured = googleClientId && googleClientSecret && 
      !googleClientId.includes('your-') && !googleClientSecret.includes('your-') &&
      googleClientId !== '' && googleClientSecret !== '';

    const providers = {
      google: isGoogleConfigured ? {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        configured: true
      } : null,
      credentials: {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials',
        configured: true
      }
    };
    
    return NextResponse.json({
      success: true,
      providers: providers,
      googleConfigured: isGoogleConfigured,
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
