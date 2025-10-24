'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Authentication Debug Panel
 * This component provides debugging tools for authentication issues
 * Only show in development mode
 */
export default function AuthDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading,
    forceClearAllAuth,
    forceRefreshAndClear,
    clearAuthAndRedirect,
    checkRemainingAuthData
  } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleForceClear = async () => {
    if (confirm('⚠️ This will force clear ALL authentication data and refresh the page. Continue?')) {
      setIsLoading(true);
      try {
        await forceClearAllAuth();
      } catch (error) {
        console.error('Force clear error:', error);
        setIsLoading(false);
      }
    }
  };

  const handleForceRefresh = () => {
    if (confirm('🔄 This will clear browser data and force refresh. Continue?')) {
      forceRefreshAndClear();
    }
  };

  const handleClearAndRedirect = () => {
    if (confirm('🧹 This will clear auth data and redirect to home. Continue?')) {
      clearAuthAndRedirect('/');
    }
  };

  const handleCheckRemainingData = () => {
    const data = checkRemainingAuthData();
    setDebugInfo(data);
  };

  const handleCheckServerSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/force-clear');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-mono"
        title="Authentication Debug Panel"
      >
        🔐 Debug
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🔐 Auth Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Current Status */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium text-gray-700 mb-2">Current Status</h4>
            <div className="text-sm space-y-1">
              <div>Authenticated: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                {isAuthenticated ? '✅ Yes' : '❌ No'}
              </span></div>
              <div>Loading: <span className={authLoading ? 'text-yellow-600' : 'text-gray-600'}>
                {authLoading ? '⏳ Yes' : '✅ No'}
              </span></div>
              <div>User: <span className="text-gray-600">
                {user ? `${user.name} (${user.email})` : 'None'}
              </span></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mb-4">
            <button
              onClick={handleForceClear}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm"
            >
              {isLoading ? '⏳ Clearing...' : '🗑️ Force Clear All Auth'}
            </button>
            
            <button
              onClick={handleForceRefresh}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm"
            >
              🔄 Force Refresh & Clear
            </button>
            
            <button
              onClick={handleClearAndRedirect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
            >
              🧹 Clear & Redirect Home
            </button>
          </div>

          {/* Debug Info Buttons */}
          <div className="space-y-2 mb-4">
            <button
              onClick={handleCheckRemainingData}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
            >
              🔍 Check Browser Auth Data
            </button>
            
            <button
              onClick={handleCheckServerSession}
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-3 py-2 rounded text-sm"
            >
              {isLoading ? '⏳ Checking...' : '🖥️ Check Server Session'}
            </button>
          </div>

          {/* Debug Info Display */}
          {debugInfo && (
            <div className="p-3 bg-gray-50 rounded">
              <h4 className="font-medium text-gray-700 mb-2">Debug Info</h4>
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 mt-4 p-2 bg-yellow-50 rounded">
            <p className="font-medium mb-1">💡 Usage:</p>
            <ul className="space-y-1">
              <li>• <strong>Force Clear All:</strong> Clears both client and server auth data</li>
              <li>• <strong>Force Refresh:</strong> Clears browser data and refreshes page</li>
              <li>• <strong>Clear & Redirect:</strong> Clears auth and redirects to home</li>
              <li>• <strong>Check Data:</strong> Shows remaining auth artifacts</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
