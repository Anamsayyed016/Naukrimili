'use client';

import { useState, useEffect } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function TestOAuthPage() {
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        console.log('🔍 Loading providers...');
        const availableProviders = await getProviders();
        console.log('🔍 Providers loaded:', availableProviders);
        setProviders(availableProviders);
      } catch (err: any) {
        console.error('❌ Error loading providers:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProviders();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 Attempting Google sign-in...');
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false
      });
      console.log('🔐 Sign-in result:', result);
    } catch (err: any) {
      console.error('❌ Google sign-in error:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">OAuth Debug Test</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">Error: {error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Available Providers:</h2>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(providers, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Test Google Sign-In:</h2>
            <Button 
              onClick={handleGoogleSignIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Test Google OAuth
            </Button>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Environment Check:</h2>
            <div className="text-sm text-gray-600">
              <p>NODE_ENV: {process.env.NODE_ENV}</p>
              <p>NEXTAUTH_URL: {process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}