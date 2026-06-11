/**
 * Role Selection Page
 * For users who need to choose their role after authentication
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import PostAuthRoleSelection from '@/components/auth/PostAuthRoleSelection';
import { getJobseekerPostLoginRedirect } from '@/lib/resume-builder/jobseeker-entry-redirect';
import { ensureWorkspacePreferenceOwnedBy } from '@/lib/preferences/workspace-preference';

export default function RoleSelectionPage() {
  const { data: session, status } = useSession();
  console.log('RoleSelectionPage - Session data:', session);
  console.log('RoleSelectionPage - User data:', session?.user);
  console.log('RoleSelectionPage - User ID:', session?.user?.id);
  console.log('RoleSelectionPage - User email:', session?.user?.email);
  console.log('RoleSelectionPage - User name:', session?.user?.name);
  const router = useRouter();
  const [hasRedirectedToSignin, setHasRedirectedToSignin] = useState(false);
  const [hasRedirectedAway, setHasRedirectedAway] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      if (hasRedirectedToSignin) {
        return;
      }
      console.log('User is not authenticated, redirecting to signin');
      setHasRedirectedToSignin(true);
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      console.log('User is authenticated:', session.user);
      console.log('User role:', session.user.role);

      // If user is admin but session.role is missing, force sign out and reload session
      if (!session.user.role && session.user.email === 'naukrimili@naukrimili.com') {
        if (hasRedirectedAway) {
          return;
        }
        console.log('Admin user detected but role missing in session, forcing sign out to refresh session.');
        setHasRedirectedAway(true);
        signOut({ callbackUrl: '/auth/signin' });
        return;
      }

      // If user already has a role, redirect them to the appropriate page
      if (session.user.role) {
        if (hasRedirectedAway) {
          return;
        }
        console.log('User already has role:', session.user.role, '- redirecting from role selection page');
        setHasRedirectedAway(true);

        // Owner-scoped cache cleanup so a previous account's preference
        // cannot bypass the workspace selector for this user.
        const sessionUser = session.user as { id?: string; email?: string };
        const ownerKey = sessionUser.id || sessionUser.email || null;
        const wiped = ensureWorkspacePreferenceOwnedBy(ownerKey);
        if (wiped) {
          console.log('🧹 [RoleSelection] Wiped cross-account workspace cache for', ownerKey);
        }

        let targetUrl = '/dashboard';

        switch (session.user.role) {
          case 'jobseeker':
            // Workspace-aware redirect: one-shot resume-builder intents win,
            // then the saved (owner-scoped) workspace preference, otherwise
            // the workspace selector screen.
            targetUrl = getJobseekerPostLoginRedirect(ownerKey);
            break;
          case 'employer':
            targetUrl = '/dashboard/company';
            break;
          case 'admin':
            targetUrl = '/dashboard/admin';
            break;
          default:
            targetUrl = '/dashboard';
        }

        console.log('🎯 [RoleSelection] Redirecting to:', targetUrl);
        router.push(targetUrl);
        return;
      }
    }
  }, [session, status, router, hasRedirectedToSignin, hasRedirectedAway]);

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

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
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
