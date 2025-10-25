'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getMobileOAuthFlow, optimizeMobileOAuth, logMobileOAuthPerformance } from '@/lib/mobile-oauth-performance-fix';

interface OAuthButtonsProps {
  callbackUrl?: string;
  className?: string;
}

export default function OAuthButtons({ callbackUrl, className }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Optimize mobile OAuth performance
      optimizeMobileOAuth();
      logMobileOAuthPerformance();
      
      // Get optimal OAuth flow for device
      const oauthFlow = getMobileOAuthFlow();
      const useRedirect = oauthFlow === 'redirect';
      
      console.log('🔍 OAuth Device Detection:', {
        oauthFlow,
        useRedirect,
        userAgent: navigator.userAgent.substring(0, 100)
      });
      
      if (useRedirect) {
        // Use redirect flow - don't await, let it redirect
        console.log('🔄 Using redirect flow for Google sign-in');
        signIn('google', { 
          callbackUrl: callbackUrl || '/auth/role-selection',
          redirect: true
        });
        
        // Set a timeout to reset loading state if redirect gets stuck
        timeoutRef.current = setTimeout(() => {
          console.warn('⚠️ OAuth redirect timeout - resetting loading state');
          setError('Sign-in is taking too long. Please try again.');
          setIsLoading(false);
        }, 20000); // 20 second timeout for redirect
      } else {
        console.log('🔄 Using popup flow for desktop Google sign-in');
        // Use popup flow for desktop
        const result = await signIn('google', { 
          callbackUrl: callbackUrl || '/auth/role-selection',
          redirect: false
        });
        
        // Clear timeout if signIn completes
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // If there's an error, reset loading
        if (result?.error) {
          console.error('OAuth error:', result.error);
          setError('Sign-in failed. Please try again.');
          setIsLoading(false);
        }
      }
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Sign-in failed. Please try again.');
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

// Named export for compatibility
export { OAuthButtons };