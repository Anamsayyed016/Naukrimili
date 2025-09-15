'use client';

import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';

export default function TestOAuthPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OAuth Test Page</h1>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Google Console Setup Required</h3>
          <p className="text-yellow-700 mb-4">
            Configure this redirect URI in Google Console:
          </p>
          <div className="bg-yellow-100 p-3 rounded">
            <p className="font-mono text-sm">
              https://aftionix.in/api/auth/callback/google
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
