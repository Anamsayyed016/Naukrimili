'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { clearAllBrowserAuthData, forceRefreshAndClear } from '@/lib/client-auth-utils';

export default function AuthResetPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'instructions' | 'manual' | 'automatic' | 'complete'>('instructions');
  const { forceClearAllAuth } = useAuth();

  const handleAutomaticReset = async () => {
    if (confirm('⚠️ This will clear ALL authentication data and refresh the page. Continue?')) {
      setIsLoading(true);
      try {
        await forceClearAllAuth();
        setStep('complete');
      } catch (_error) {
        console.error('Automatic reset error:', _error);
        setIsLoading(false);
      }
    }
  };

  const handleManualReset = () => {
    setStep('manual');
  };

  const handleBrowserClear = () => {
    if (confirm('🧹 This will clear browser data and refresh the page. Continue?')) {
      clearAllBrowserAuthData();
      forceRefreshAndClear();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleEmergencyLogout = () => {
    if (confirm('🚨 EMERGENCY: This will immediately clear all data and redirect you to the homepage. Continue?')) {
      // Clear everything immediately
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Force redirect to homepage
        window.location.href = '/';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 Authentication Reset</h1>
          <p className="text-gray-600">
            Clear all authentication state and start fresh
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {step === 'instructions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Why Reset Authentication?
                </h2>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Stuck in authentication state</p>
                  <p>• Can&apos;t access role selection</p>
                  <p>• Session mismatch between client and server</p>
                  <p>• OAuth authentication issues</p>
                  <p>• Browser cache conflicts</p>
                </div>
              </div>

              {/* Emergency Logout Section */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-medium text-red-800 mb-3">
                  🚨 Emergency Logout
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  If you&apos;re completely stuck and can&apos;t access anything, use this emergency logout:
                </p>
                <button
                  onClick={handleEmergencyLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm font-medium"
                >
                  🚨 Emergency Logout & Clear All
                </button>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Choose Reset Method
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={handleAutomaticReset}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    🚀 Automatic Reset (Recommended)
                  </button>
                  <button
                    onClick={handleManualReset}
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    📋 Manual Instructions
                  </button>
                  <button
                    onClick={handleBrowserClear}
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    🌐 Browser Clear Only
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'manual' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Manual Authentication Reset
                </h2>
                <div className="text-sm text-gray-600 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800">1. Clear Browser Data</h4>
                    <ul className="ml-4 mt-2 space-y-1">
                      <li>• Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Shift+Delete</kbd> (Windows) or <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+Shift+Delete</kbd> (Mac)</li>
                      <li>• Select "All time" for time range</li>
                      <li>• Check all boxes: Cookies, Local storage, Session storage, Cache</li>
                      <li>• Click "Clear data"</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800">2. Force Refresh</h4>
                    <ul className="ml-4 mt-2 space-y-1">
                      <li>• Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Shift+R</kbd> (Windows) or <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+Shift+R</kbd> (Mac)</li>
                      <li>• This bypasses browser cache completely</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800">3. Test in Incognito</h4>
                    <ul className="ml-4 mt-2 space-y-1">
                      <li>• Open a new incognito/private window</li>
                      <li>• Navigate to your site</li>
                      <li>• Verify authentication state is correct</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800">4. Alternative: Hard Reset</h4>
                    <ul className="ml-4 mt-2 space-y-1">
                      <li>• Close all browser windows</li>
                      <li>• Restart your browser completely</li>
                      <li>• Navigate to your site</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('instructions')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Go Home
                </button>
              </div>
            </div>
          )}

          {step === 'automatic' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <h3 className="text-lg font-medium text-gray-900">
                Clearing Authentication Data...
              </h3>
              <p className="text-sm text-gray-600">
                Please wait while we reset your authentication state
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Reset Complete!
                </h3>
                <p className="text-sm text-gray-600">
                  All authentication data has been cleared. You should now see the normal homepage.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGoHome}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  🏠 Go to Homepage
                </button>
                
                <button
                  onClick={() => setStep('instructions')}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  🔄 Reset Again
                </button>
              </div>
            </div>
          )}

          {step === 'instructions' && (
            <div className="mt-6 text-center">
              <button
                onClick={handleGoHome}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                ← Back to Homepage
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Resetting Authentication...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait</p>
          </div>
        </div>
      )}
    </div>
  );
}
