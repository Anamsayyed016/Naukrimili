/**
 * Authentication Error Page
 * Handles authentication errors and provides user-friendly messages
 */

'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import OAuthErrorRecovery from '@/components/auth/OAuthErrorRecovery';

const errorMessages: { [key: string]: string } = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication. Please try again.',
  OAuthSignin: 'Error occurred during OAuth sign in.',
  OAuthCallback: 'Error occurred during OAuth callback.',
  OAuthCreateAccount: 'Could not create OAuth account.',
  EmailCreateAccount: 'Could not create email account.',
  Callback: 'Error occurred during callback.',
  OAuthAccountNotLinked: 'This email is already registered. Please sign in with your existing account or use a different email.',
  EmailSignin: 'Check your email for a sign in link.',
  CredentialsSignin: 'Sign in failed. Check your credentials.',
  SessionRequired: 'Please sign in to access this page.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error') || 'Default';
  const errorMessage = errorMessages[error] || errorMessages.Default;

  // Use OAuth error recovery for OAuth-specific errors
  if (error.startsWith('OAuth') || error === 'Configuration') {
    return <OAuthErrorRecovery error={error} />;
  }


  const handleRetry = () => {
    window.location.href = '/';
  };

  const handleSignInWithCredentials = () => {
    window.location.href = '/auth/signin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during the authentication process
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              onClick={handleRetry}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            {error === 'OAuthAccountNotLinked' && (
              <Button
                onClick={handleSignInWithCredentials}
                className="w-full"
                variant="outline"
              >
                Sign In with Email/Password
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Error Code: {error}</p>
            <p>If this problem persists, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}