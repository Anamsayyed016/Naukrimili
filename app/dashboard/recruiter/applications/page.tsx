'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect /dashboard/recruiter/applications to /employer/applications
 * "Recruiter" and "Employer" are the same role in this system
 */
export default function RecruiterApplicationsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to employer applications
    router.replace('/employer/applications');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Redirecting to Applications...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait while we redirect you to the employer applications page</p>
      </div>
    </div>
  );
}

