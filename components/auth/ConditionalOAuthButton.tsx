/**
 * Conditional OAuth Button
 * Only shows Google OAuth button if credentials are properly configured
 */

'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

interface ConditionalOAuthButtonProps {
  loading?: boolean;
  className?: string;
}

export default function ConditionalOAuthButton({ loading = false, className = '' }: ConditionalOAuthButtonProps) {
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if Google OAuth is available by making a test request
    const checkGoogleOAuth = async () => {
      try {
        // Try to get providers to see if Google is available
        const response = await fetch('/api/auth/providers');
        if (response.ok) {
          const providers = await response.json();
          setIsGoogleAvailable(!!providers.google);
        }
      } catch (error) {
        console.log('Google OAuth not available:', error);
        setIsGoogleAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkGoogleOAuth();
  }, []);

  const handleGoogleSignIn = () => {
    console.log('🔐 Gmail OAuth clicked');
    signIn('google', {
      callbackUrl: '/auth/role-selection',
      redirect: true
    });
  };

  // Don't show anything while checking
  if (isChecking) {
    return null;
  }

  // Show helpful message if Google OAuth is not available
  if (!isGoogleAvailable) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gmail Authentication
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Gmail sign-in is not currently configured. Please use one of the other authentication methods below.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
            <p className="text-xs text-blue-700">
              <strong>For Developers:</strong> To enable Gmail authentication, run <code className="bg-blue-100 px-1 rounded">node setup-oauth.js</code> and follow the setup instructions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold font-heading text-gray-900 mb-2">
          Quick Sign In with Gmail
        </h3>
        <p className="text-base text-gray-600">
          Sign in instantly with your Google account
        </p>
      </div>

      {/* Enhanced Gmail OAuth Button */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className={`w-full h-14 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-xl font-semibold text-base group ${className}`}
        disabled={loading}
        onClick={handleGoogleSignIn}
      >
        <div className="flex items-center justify-center">
          <svg className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </div>
      </Button>
    </div>
  );
}
