/**
 * Role Selection Page
 * For users who need to choose their role after authentication
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut, getSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import PostAuthRoleSelection from '@/components/auth/PostAuthRoleSelection';
import { getJobseekerPostLoginRedirect } from '@/lib/resume-builder/jobseeker-entry-redirect';
import { ensureWorkspacePreferenceOwnedBy } from '@/lib/preferences/workspace-preference';

export default function RoleSelectionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [hasRedirectedToSignin, setHasRedirectedToSignin] = useState(false);
  const [hasRedirectedAway, setHasRedirectedAway] = useState(false);
  const [bootstrappedSession, setBootstrappedSession] = useState<Session | null | undefined>(undefined);
  const [bootstrappedStatus, setBootstrappedStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const bootstrapAttempted = useRef(false);

  // useSession can remain stuck on "loading" after OAuth; resolve session directly.
  useEffect(() => {
    if (bootstrapAttempted.current) {
      return;
    }
    bootstrapAttempted.current = true;

    let cancelled = false;

    const applySession = (nextSession: Session | null) => {
      if (cancelled) {
        return;
      }
      setBootstrappedSession(nextSession);
      setBootstrappedStatus(nextSession?.user ? 'authenticated' : 'unauthenticated');
    };

    const loadSession = async () => {
      try {
        const nextSession = await getSession();
        applySession(nextSession);
        if (nextSession?.user) {
          void update();
        }
      } catch {
        if (!cancelled) {
          setBootstrappedStatus('unauthenticated');
        }
      }
    };

    void loadSession();

    const retryTimer = window.setTimeout(() => {
      if (cancelled || status !== 'loading') {
        return;
      }
      void loadSession();
    }, 2500);

    const escapeTimer = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      setBootstrappedStatus((prev) => (prev === 'loading' ? 'unauthenticated' : prev));
    }, 8000);

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      window.clearTimeout(escapeTimer);
    };
  }, [status, update]);

  useEffect(() => {
    if (status !== 'loading') {
      setBootstrappedSession(session ?? null);
      setBootstrappedStatus(status);
    }
  }, [session, status]);

  const effectiveStatus =
    status !== 'loading' ? status : bootstrappedStatus;
  const effectiveSession =
    status !== 'loading' ? session : bootstrappedSession;

  console.log('RoleSelectionPage - effectiveStatus:', effectiveStatus);
  console.log('RoleSelectionPage - effectiveSession:', effectiveSession);
  console.log('RoleSelectionPage - User data:', effectiveSession?.user);

  useEffect(() => {
    if (effectiveStatus === 'loading') {
      return;
    }

    if (effectiveStatus === 'unauthenticated') {
      if (hasRedirectedToSignin) {
        return;
      }
      console.log('User is not authenticated, redirecting to signin');
      setHasRedirectedToSignin(true);
      router.push('/auth/signin');
      return;
    }

    if (effectiveStatus === 'authenticated' && effectiveSession?.user) {
      console.log('User is authenticated:', effectiveSession.user);
      console.log('User role:', effectiveSession.user.role);

      // If user is admin but session.role is missing, force sign out and reload session
      if (!effectiveSession.user.role && effectiveSession.user.email === 'naukrimili@naukrimili.com') {
        if (hasRedirectedAway) {
          return;
        }
        console.log('Admin user detected but role missing in session, forcing sign out to refresh session.');
        setHasRedirectedAway(true);
        signOut({ callbackUrl: '/auth/signin' });
        return;
      }

      // If user already has a role, redirect them to the appropriate page
      if (effectiveSession.user.role) {
        if (hasRedirectedAway) {
          return;
        }
        console.log('User already has role:', effectiveSession.user.role, '- redirecting from role selection page');
        setHasRedirectedAway(true);

        // Owner-scoped cache cleanup so a previous account's preference
        // cannot bypass the workspace selector for this user.
        const sessionUser = effectiveSession.user as { id?: string; email?: string };
        const ownerKey = sessionUser.id || sessionUser.email || null;
        const wiped = ensureWorkspacePreferenceOwnedBy(ownerKey);
        if (wiped) {
          console.log('🧹 [RoleSelection] Wiped cross-account workspace cache for', ownerKey);
        }

        let targetUrl = '/dashboard';

        switch (effectiveSession.user.role) {
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
  }, [effectiveSession, effectiveStatus, router, hasRedirectedToSignin, hasRedirectedAway]);

  if (effectiveStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (effectiveStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  if (!effectiveSession?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <PostAuthRoleSelection 
        user={effectiveSession.user} 
        onComplete={(user) => {
          console.log('Role selection completed for user:', user);
        }}
      />
    </div>
  );
}
