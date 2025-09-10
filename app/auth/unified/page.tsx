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
    
    // Always redirect to role selection page for clean flow
    router.push('/auth/role-selection');
  };

  return (
    <div className="min-h-screen">
      <UnifiedAuthFlow onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}
