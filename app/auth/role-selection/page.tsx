/**
 * Role Selection Page
 * For users who need to choose their role after authentication
 */

'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PostAuthRoleSelection from '@/components/auth/PostAuthRoleSelection';

export default function RoleSelectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // Not authenticated, redirect to unified auth
      router.push('/auth/unified');
      return;
    }

    if (session.user?.role) {
      // User already has a role, redirect to appropriate dashboard
      if (session.user.role === 'jobseeker') {
        router.push('/dashboard/jobseeker');
      } else if (session.user.role === 'employer') {
        router.push('/dashboard/company');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  if (session.user?.role) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen">
      <PostAuthRoleSelection 
        user={session.user}
        onComplete={(user) => {
          console.log('Role selection completed:', user);
          // Redirect will be handled by the component
        }}
      />
    </div>
  );
}
