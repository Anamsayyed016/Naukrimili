'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('=== DEBUG SESSION ===');
    console.log('Status:', status);
    console.log('Session:', session);
    console.log('User:', session?.user);
    console.log('User ID:', session?.user?.id);
    console.log('User Email:', session?.user?.email);
    console.log('User Name:', session?.user?.name);
    console.log('User Role:', session?.user?.role);
    console.log('===================');
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Session</h1>
        
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
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-4">
            <a 
              href="/auth/signin" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Go to Sign In
            </a>
            <a 
              href="/auth/role-selection" 
              className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 ml-4"
            >
              Go to Role Selection
            </a>
            <a 
              href="/" 
              className="inline-block bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 ml-4"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
