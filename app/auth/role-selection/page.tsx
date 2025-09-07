/**
 * Role Selection Page
 * For users who need to choose their role after authentication
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PostAuthRoleSelection from '@/components/auth/PostAuthRoleSelection';

export default function RoleSelectionPage() {
  const { data: session, status } = useSession();
  console.log('RoleSelectionPage - Session data:', session);
  console.log('RoleSelectionPage - User data:', session?.user);
  console.log('RoleSelectionPage - User ID:', session?.user?.id);
  console.log('RoleSelectionPage - User email:', session?.user?.email);
  console.log('RoleSelectionPage - User name:', session?.user?.name);
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      // Not authenticated, redirect to unified auth
      console.log('No session found, redirecting to unified auth');
      router.push('/auth/unified');
      return;
    }

    if (session.user?.role) {
      // User already has a role, redirect to appropriate dashboard
      console.log('User has role:', session.user.role, 'redirecting to dashboard');
      if (session.user.role === 'jobseeker') {
        router.push('/dashboard/jobseeker');
      } else if (session.user.role === 'employer') {
        router.push('/dashboard/company');
      }
    } else {
      // User is authenticated but has no role - show role selection
      console.log('User authenticated but no role assigned, showing role selection');
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
