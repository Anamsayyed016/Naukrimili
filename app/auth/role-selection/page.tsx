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
    if (status === 'loading') {
      console.log('Session is loading...');
      return; // Still loading
    }

    if (status === 'unauthenticated') {
      console.log('User is not authenticated, redirecting to signin');
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      console.log('User is authenticated:', session.user);
      console.log('User role:', session.user.role);
      
      // Let the PostAuthRoleSelection component handle role-based logic
      // This page only shows the role selection interface
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


  // Only render if we have a valid session
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PostAuthRoleSelection 
        user={session.user} 
        onComplete={(user) => {
          console.log('Role selection completed for user:', user);
        }}
      />
    </div>
  );
}
