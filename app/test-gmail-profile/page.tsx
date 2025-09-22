'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function TestGmailProfilePage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🧪 Test Gmail Profile Page - Status:', status);
    console.log('🧪 Test Gmail Profile Page - Session:', session);
    console.log('🧪 Test Gmail Profile Page - User:', session?.user);
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Gmail Profile Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <p className="text-lg">
            <strong>Status:</strong> <span className="text-blue-600">{status}</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">User Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(session?.user, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Links</h2>
          <div className="space-y-2">
            <a href="/auth/gmail-profile" className="block text-blue-600 hover:underline">
              Go to Gmail Profile Page
            </a>
            <a href="/auth/role-selection" className="block text-blue-600 hover:underline">
              Go to Role Selection Page
            </a>
            <a href="/auth/signin" className="block text-blue-600 hover:underline">
              Go to Sign In Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
