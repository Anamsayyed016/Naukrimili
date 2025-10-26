'use client';

import { useState } from 'react';
import OAuthButtons from '@/components/auth/OAuthButtons';

export default function OAuthDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Override console.log to capture logs
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);
    addLog(args.join(' '));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          OAuth Debug Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Google OAuth</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to test Google OAuth redirect. Check the logs below for debugging information.
          </p>
          <OAuthButtons callbackUrl="/auth/role-selection" />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click the OAuth button above to start debugging.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setLogs([])}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear Logs
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Direct Test Links</h2>
          <div className="space-y-2">
            <a 
              href="/api/auth/signin/google?callbackUrl=%2Fauth%2Frole-selection"
              target="_blank"
              className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Direct Google OAuth Link (Opens in New Tab)
            </a>
            <a 
              href="/api/auth/providers"
              target="_blank"
              className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              View OAuth Providers JSON
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
