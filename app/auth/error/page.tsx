"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Mail, Lock, ArrowLeft, Home, UserPlus } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    solution: string;
    action: string;
    actionUrl: string;
  }>({
    title: 'Authentication Error',
    message: 'An unexpected error occurred during authentication.',
    solution: 'Please try again or contact support if the problem persists.',
    action: 'Try Again',
    actionUrl: '/auth/login'
  });

  useEffect(() => {
    // Handle different error types
    switch (error) {
      case 'OAuthAccountNotLinked':
        setErrorDetails({
          title: 'Account Already Exists',
          message: 'An account with this email already exists but was created using a different sign-in method.',
          solution: 'Please sign in using the same method you used to create your account, or link your accounts.',
          action: 'Sign In with Password',
          actionUrl: '/auth/login'
        });
        break;
      case 'OAuthSignin':
        setErrorDetails({
          title: 'OAuth Sign-in Error',
          message: 'There was a problem with the OAuth sign-in process.',
          solution: 'Please try again or use email/password authentication.',
          action: 'Try Again',
          actionUrl: '/auth/login'
        });
        break;
      case 'OAuthCallback':
        setErrorDetails({
          title: 'OAuth Callback Error',
          message: 'There was a problem completing the OAuth authentication.',
          solution: 'Please try again or use email/password authentication.',
          action: 'Try Again',
          actionUrl: '/auth/login'
        });
        break;
      case 'OAuthCreateAccount':
        setErrorDetails({
          title: 'Account Creation Error',
          message: 'Unable to create a new account with OAuth.',
          solution: 'Please try again or create an account with email/password.',
          action: 'Create Account',
          actionUrl: '/auth/register'
        });
        break;
      case 'EmailCreateAccount':
        setErrorDetails({
          title: 'Account Creation Error',
          message: 'Unable to create a new account with this email.',
          solution: 'The email may already be in use. Please try signing in instead.',
          action: 'Sign In',
          actionUrl: '/auth/login'
        });
        break;
      case 'Callback':
        setErrorDetails({
          title: 'Authentication Callback Error',
          message: 'There was a problem with the authentication callback.',
          solution: 'Please try signing in again.',
          action: 'Try Again',
          actionUrl: '/auth/login'
        });
        break;
      case 'OAuthSignout':
        setErrorDetails({
          title: 'Sign-out Error',
          message: 'There was a problem signing out.',
          solution: 'Please try again or refresh the page.',
          action: 'Go Home',
          actionUrl: '/'
        });
        break;
      case 'SessionRequired':
        setErrorDetails({
          title: 'Session Required',
          message: 'You need to be signed in to access this page.',
          solution: 'Please sign in to continue.',
          action: 'Sign In',
          actionUrl: '/auth/login'
        });
        break;
      case 'Default':
        setErrorDetails({
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          solution: 'Please try again or contact support if the problem persists.',
          action: 'Try Again',
          actionUrl: '/auth/login'
        });
        break;
      default:
        setErrorDetails({
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          solution: 'Please try again or contact support if the problem persists.',
          action: 'Try Again',
          actionUrl: '/auth/login'
        });
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-8">
            <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              NaukriMili
            </span>
          </Link>
          
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900">{errorDetails.title}</h2>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="space-y-6">
            {/* Error Message */}
            <div className="text-center">
              <p className="text-gray-700 mb-4">{errorDetails.message}</p>
              <p className="text-sm text-gray-600">{errorDetails.solution}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link
                href={errorDetails.actionUrl}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:scale-105"
              >
                {errorDetails.action}
              </Link>
              
              <Link
                href="/"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </div>

            {/* Additional Help */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Need help?</p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                >
                  <Lock className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
