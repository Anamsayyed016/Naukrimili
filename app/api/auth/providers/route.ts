import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check which OAuth providers are configured
 * GET /api/auth/providers
 */
export async function GET(_request: NextRequest) {
  try {
    const providers: any = {};
    
    // Check Google OAuth
    const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID;
    const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    
    if (hasGoogleId && hasGoogleSecret) {
      providers.google = {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        configured: true,
        clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + '...',
        hasSecret: true
      };
    } else {
      providers.google = {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        configured: false,
        error: hasGoogleId ? 'Missing GOOGLE_CLIENT_SECRET' : 'Missing GOOGLE_CLIENT_ID'
      };
    }
    
    // Check GitHub OAuth
    const hasGitHubId = !!process.env.GITHUB_ID;
    const hasGitHubSecret = !!process.env.GITHUB_SECRET;
    
    if (hasGitHubId && hasGitHubSecret) {
      providers.github = {
        id: 'github',
        name: 'GitHub',
        type: 'oauth',
        configured: true
      };
    }
    
    // Check NextAuth config
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'Not set';
    
    return NextResponse.json({
      success: true,
      providers,
      config: {
        hasNextAuthSecret,
        nextAuthUrl,
        nodeEnv: process.env.NODE_ENV
      },
      message: 'Check providers object to see which OAuth providers are configured'
    });
    
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        providers: {},
        config: {
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set'
        }
      },
      { status: 500 }
    );
  }
}
