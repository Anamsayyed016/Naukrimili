"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/employer/dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to employer dashboard...</p>
      </div>
    </div>
  );
}
