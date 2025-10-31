'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminJobsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard/admin/jobs');
  }, [router]);

  return (
    <div className="container mx-auto p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to Jobs Management...</p>
      </div>
    </div>
  );
}
