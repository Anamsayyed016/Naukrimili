"use client";

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve redirect parameter when redirecting to role-selection
    const redirect = searchParams?.get('redirect');
    const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    router.replace(`/auth/role-selection${redirectParam}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to authentication...</p>
      </div>
    </div>
  );
}