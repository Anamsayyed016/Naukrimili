/**
 * OTP Test Page - For testing OTP functionality
 * This page demonstrates the OTP authentication flow
 */

'use client';

import React from 'react';
import EnhancedAuthCard from '@/components/auth/EnhancedAuthCard';

export default function OTPTestPage() {
  const handleAuthSuccess = (user: any) => {
    console.log('Authentication successful:', user);
    alert(`Welcome ${user.name || user.email}! Authentication successful.`);
  };

  return (
    <div className="min-h-screen">
      <EnhancedAuthCard onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}
