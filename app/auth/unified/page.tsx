/**
 * Unified Authentication Page
 * Single entry point for all authentication flows
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import UnifiedAuthFlow from '@/components/auth/UnifiedAuthFlow';

export default function UnifiedAuthPage() {
  const router = useRouter();

  const handleAuthSuccess = (user: any) => {
    console.log('Authentication successful:', user);
    
    // Redirect based on user role to action pages
    if (user.role === 'jobseeker') {
      router.push('/resumes/upload');
    } else if (user.role === 'employer') {
      router.push('/employer/post-job');
    } else {
      // If no role set, redirect to role selection
      router.push('/auth/role-selection');
    }
  };

  return (
    <div className="min-h-screen">
      <UnifiedAuthFlow onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}
