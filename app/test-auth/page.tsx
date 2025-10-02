'use client';

import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { clearAllBrowserAuthData } from '@/lib/auth-utils';
import Link from 'next/link';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const { user, isAuthenticated, forceClearAllAuth } = useAuth();

  const handleForceClear = async () => {
    if (confirm('⚠️ This will force clear ALL authentication data and refresh the page. Continue?')) {
      try {
        await forceClearAllAuth();
      } catch (error) {
        console.error('Force clear error:', error);
      }
    }
  };

  const handleBrowserClear = () => {
    if (confirm('🧹 This will clear browser data and refresh the page. Continue?')) {
      clearAllBrowserAuthData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔐 Authentication Test Page</h1>
        
        <div className="space-y-6">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Current Authentication Status</h2>
            <div className="space-y-2 text-sm">
              <div><strong>NextAuth Status:</strong> <span className={status === 'authenticated' ? 'text-green-600' : status === 'loading' ? 'text-yellow-600' : 'text-red-600'}>{status}</span></div>
              <div><strong>Custom Auth Status:</strong> <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span></div>
              <div><strong>User:</strong> <span className="text-gray-600">{user ? `${user.name} (${user.email})` : 'None'}</span></div>
              <div><strong>Session:</strong> <span className="text-gray-600">{session ? `${session.user?.name} (${session.user?.email})` : 'None'}</span></div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Test Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleForceClear}
                className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                🗑️ Force Clear All Auth
              </button>
              
              <button
                onClick={handleBrowserClear}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                🌐 Browser Clear Only
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Quick Links</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/auth/reset"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-center"
              >
                🔐 Go to Auth Reset Page
              </a>
              
              <Link
                href="/"
                className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-center block"
              >
                🏠 Go to Homepage
              </Link>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">💡 How to Test</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>1. <strong>Check Status:</strong> Verify current authentication state</p>
              <p>2. <strong>Test Force Clear:</strong> Use the red button to clear all auth data</p>
              <p>3. <strong>Test Browser Clear:</strong> Use the orange button for browser-only clear</p>
              <p>4. <strong>Verify Reset:</strong> Check that you&apos;re redirected to unauthenticated state</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
