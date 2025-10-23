import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import OAuthScopeManager from '@/lib/oauth-scope-manager';

/**
 * Request Additional OAuth Scopes
 * Implements incremental authorization for Google OAuth
 */
export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { action, currentScopes = [] } = await request.json();
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const scopeManager = OAuthScopeManager.getInstance();
    
    // Check if user already has required scopes
    if (scopeManager.hasRequiredScopes(currentScopes, action)) {
      return NextResponse.json({
        success: true,
        message: 'User already has required scopes',
        scopes: currentScopes
      });
    }

    // Get additional scopes needed
    const additionalScopes = scopeManager.getAdditionalScopes(action);
    const scopeDescriptions = scopeManager.getScopeDescriptions(additionalScopes.split(' '));

    // Generate OAuth URL for additional scopes
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
    
    if (!googleClientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', googleClientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', additionalScopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', JSON.stringify({ 
      action, 
      userId: session.user.id,
      timestamp: Date.now()
    }));

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      scopes: additionalScopes.split(' '),
      descriptions: scopeDescriptions,
      action
    });

  } catch (error) {
    console.error('❌ OAuth scope request error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process scope request' },
      { status: 500 }
    );
  }
}

/**
 * Get current user's OAuth scopes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // In a real implementation, you would store and retrieve
    // the user's granted scopes from the database
    // For now, return basic scopes
    const basicScopes = ['openid', 'email', 'profile'];
    
    return NextResponse.json({
      scopes: basicScopes,
      hasIncrementalAuth: true
    });

  } catch (error) {
    console.error('❌ OAuth scope retrieval error:', error);
    
    return NextResponse.json(
      { error: 'Failed to retrieve scopes' },
      { status: 500 }
    );
  }
}
