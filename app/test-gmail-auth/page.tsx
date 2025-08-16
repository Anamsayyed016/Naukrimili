'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import OAuthButtons from '@/components/auth/OAuthButtons';

export default function TestGmailAuthPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Gmail Authentication Test</h1>
          <p className="text-xl text-gray-600">Test your Google OAuth setup</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {session ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl font-bold">✓</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Successful!</h2>
                <p className="text-gray-600">You are signed in with Google</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Session Information:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Name:</strong> {session.user?.name}</p>
                  <p><strong>Email:</strong> {session.user?.email}</p>
                  <p><strong>Provider:</strong> Google OAuth</p>
                  <p><strong>Status:</strong> Authenticated</p>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl font-bold">?</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Authenticated</h2>
                <p className="text-gray-600">Sign in with Google to test authentication</p>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-4">
                <OAuthButtons 
                  callbackUrl="/test-gmail-auth" 
                  className="max-w-sm mx-auto"
                />
                
                <div className="text-sm text-gray-500">
                  <p>Or test with credentials:</p>
                  <p className="mt-1">
                    <strong>Email:</strong> test@example.com | <strong>Password:</strong> password
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Information */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Information</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Status:</strong> <span className="font-mono">{status}</span></p>
            <p><strong>Session:</strong> <span className="font-mono">{session ? 'Active' : 'None'}</span></p>
            <p><strong>Environment:</strong> <span className="font-mono">{process.env.NODE_ENV}</span></p>
            <p><strong>NextAuth URL:</strong> <span className="font-mono">{process.env.NEXTAUTH_URL || 'Not set'}</span></p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/auth/register"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Registration Page
          </a>
        </div>
      </div>
    </div>
  );
}
