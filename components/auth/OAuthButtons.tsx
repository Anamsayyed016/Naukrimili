'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface OAuthButtonsProps {
  callbackUrl?: string;
  className?: string;
}

export default function OAuthButtons({ callbackUrl: propCallbackUrl, className }: OAuthButtonsProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get callbackUrl from prop, URL search params, or default
  const callbackUrl = propCallbackUrl || searchParams?.get('callbackUrl') || '/auth/role-selection';

  const handleGoogleSignIn = async () => {
    console.log('🔄 Starting Google OAuth redirect...');
    console.log('📍 CallbackUrl prop:', propCallbackUrl);
    console.log('📍 CallbackUrl from URL:', searchParams?.get('callbackUrl'));
    console.log('📍 Final CallbackUrl:', callbackUrl);
    setIsLoading(true);
    setError(null);

    try {
      // Check if signIn function is available
      if (typeof signIn !== 'function') {
        throw new Error('NextAuth signIn function is not available. Please check your NextAuth configuration.');
      }

      // First, check if Google provider is available by trying to get providers
      try {
        const providersResponse = await fetch('/api/auth/providers');
        const providersData = await providersResponse.json();
        
        if (!providersData?.providers?.google?.configured) {
          throw new Error('Google OAuth is not configured on the server. Please contact support.');
        }
        
        console.log('✅ Google OAuth provider is configured');
      } catch (providerCheckError) {
        console.warn('⚠️ Could not verify Google provider:', providerCheckError);
        // Continue anyway - the actual signIn call will fail if provider is missing
      }

      // Build signIn options - use redirect: true for OAuth flow
      // Decode callbackUrl if it's URL-encoded
      let finalCallbackUrl = callbackUrl;
      try {
        if (callbackUrl && callbackUrl.includes('%')) {
          finalCallbackUrl = decodeURIComponent(callbackUrl);
        }
        // If it's a full URL, extract just the path
        if (finalCallbackUrl && finalCallbackUrl.startsWith('http')) {
          const urlObj = new URL(finalCallbackUrl);
          finalCallbackUrl = urlObj.pathname + (urlObj.search || '');
        }
      } catch (e) {
        console.warn('⚠️ Could not parse callbackUrl, using as-is:', e);
      }
      
      // Default to role-selection if callbackUrl is invalid
      if (!finalCallbackUrl || finalCallbackUrl === '') {
        finalCallbackUrl = '/auth/role-selection';
      }
      
      // Ensure it starts with / for relative paths
      if (!finalCallbackUrl.startsWith('/') && !finalCallbackUrl.startsWith('http')) {
        finalCallbackUrl = '/' + finalCallbackUrl;
      }
      
      console.log('📤 Calling signIn("google", options)...');
      console.log('📋 Final Options:', { 
        callbackUrl: finalCallbackUrl,
        redirect: true
      });
      
      // CRITICAL: Use redirect: true for OAuth - NextAuth will handle the redirect
      // This will immediately redirect the browser to Google OAuth consent screen
      // The promise may not resolve if redirect succeeds (browser navigates away)
      const result = await signIn('google', {
        callbackUrl: finalCallbackUrl,
        redirect: true
      });
      
      // If we get a result (unusual with redirect: true), check for errors
      if (result) {
        if (result.error) {
          console.error('❌ signIn returned an error:', result.error);
          throw new Error(result.error);
        }
        if (!result.ok) {
          console.error('❌ signIn returned not ok:', result);
          throw new Error('Sign-in failed');
        }
        console.warn('⚠️ signIn returned a result but redirect should have happened');
      }
      
      // If we reach here without redirecting, something went wrong
      // But with redirect: true, we shouldn't normally reach here
      console.warn('⚠️ signIn completed without redirecting - checking for errors');
      setIsLoading(false);
    } catch (error: unknown) {
      console.error('❌ Google sign-in error:', error);
      const errorObj = error instanceof Error ? error : { message: 'Unknown error', stack: undefined, name: undefined };
      console.error('❌ Error details:', {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name
      });
      
      let errorMessage = 'Sign-in failed. Please try again.';
      
      if (errorObj.message?.includes('Configuration') || errorObj.message?.includes('not configured')) {
        errorMessage = 'Google OAuth is not configured on the server. Please contact support.';
      } else if (errorObj.message?.includes('OAuthAccountNotLinked')) {
        errorMessage = 'This Google account is already linked to another account. Please use a different account or contact support.';
      } else if (errorObj.message) {
        errorMessage = errorObj.message;
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className || ''}`}>
      {error && (
        <div className="text-red-600 text-sm text-center p-2 bg-red-50 rounded-lg">
          {error}
          <button
            onClick={() => {
              setError(null);
              handleGoogleSignIn();
            }}
            className="ml-2 text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full"
        variant="outline"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </>
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center px-2">
        By continuing, you agree to NaukriMili's{' '}
        <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
        . We'll use your Google account to create your profile and send you job notifications.
      </div>
    </div>
  );
}

export { OAuthButtons };
