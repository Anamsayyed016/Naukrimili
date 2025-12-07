'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface OAuthButtonsProps {
  callbackUrl?: string;
  className?: string;
}

export default function OAuthButtons({ callbackUrl, className }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    console.log('🔄 Starting Google OAuth redirect...');
    console.log('📍 CallbackUrl prop:', callbackUrl);
    setIsLoading(true);
    setError(null);

    try {
      // Check if signIn function is available
      if (typeof signIn !== 'function') {
        throw new Error('NextAuth signIn function is not available. Please check your NextAuth configuration.');
      }

      // Build signIn options
      const signInOptions: any = {
        redirect: false  // Use false to get the OAuth URL, then redirect manually
      };
      
      // Only set callbackUrl if explicitly provided
      if (callbackUrl) {
        signInOptions.callbackUrl = callbackUrl;
        console.log('✅ Using explicit callbackUrl:', callbackUrl);
      }
      
      console.log('📤 Calling signIn("google", { redirect: false })...');
      
      // Call signIn with redirect: false to get the OAuth URL
      const result = await signIn('google', signInOptions);
      
      console.log('📥 SignIn result:', { 
        ok: result?.ok, 
        error: result?.error, 
        url: result?.url ? result.url.substring(0, 100) + '...' : null,
        status: result?.status 
      });
      
      if (result?.error) {
        console.error('❌ Google sign-in failed:', result.error);
        if (result.error === 'Configuration') {
          setError('Google OAuth is not configured on the server. Please check server logs.');
        } else if (result.error === 'OAuthSignin' || result.error === 'OAuthCallback') {
          setError('OAuth sign-in failed. Please check if redirect URI is configured in Google Cloud Console.');
        } else {
          setError(result.error || 'Sign-in failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }
      
      if (result?.url) {
        // OAuth URL received - redirect to Google's consent screen
        console.log('✅ OAuth URL received, redirecting to Google...');
        console.log('🔗 Redirect URL:', result.url);
        window.location.href = result.url;
        // Note: setIsLoading(false) won't execute because page navigates away
      } else {
        console.error('❌ No OAuth URL returned from signIn');
        console.error('❌ Result object:', result);
        setError('Failed to initiate Google sign-in. Please try again or contact support.');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Google sign-in error:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      let errorMessage = 'Sign-in failed. Please try again.';
      
      if (error?.message?.includes('Configuration')) {
        errorMessage = 'Google OAuth is not configured on the server. Please contact support.';
      } else if (error?.message) {
        errorMessage = error.message;
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
