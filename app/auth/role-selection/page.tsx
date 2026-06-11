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

const SESSION_RETRY_DELAYS_MS = [0, 400, 1200, 2500, 4000];

export default function RoleSelectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasRedirectedAway, setHasRedirectedAway] = useState(false);
  const hasRedirectedToSigninRef = useRef(false);
  const [bootstrappedSession, setBootstrappedSession] = useState<Session | null | undefined>(undefined);
  const [bootstrappedStatus, setBootstrappedStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const bootstrapCompleteRef = useRef(false);

  // Resolve session directly — useSession often resolves unauthenticated before the
  // OAuth cookie is readable, which caused premature signin redirects and loops.
  useEffect(() => {
    let cancelled = false;

    const applySession = (nextSession: Session | null) => {
      if (cancelled) {
        return;
      }
      bootstrapCompleteRef.current = true;
      setBootstrappedSession(nextSession);
      setBootstrappedStatus(nextSession?.user ? 'authenticated' : 'unauthenticated');
    };

    const loadSession = async () => {
      try {
        const nextSession = await getSession();
        if (nextSession?.user) {
          applySession(nextSession);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const timers: number[] = [];

    const runRetries = async () => {
      for (const delay of SESSION_RETRY_DELAYS_MS) {
        if (cancelled || bootstrapCompleteRef.current) {
          return;
        }
        if (delay > 0) {
          await new Promise<void>((resolve) => {
            timers.push(window.setTimeout(resolve, delay));
          });
        }
        if (cancelled || bootstrapCompleteRef.current) {
          return;
        }
        const found = await loadSession();
        if (found) {
          return;
        }
      }
      if (!cancelled && !bootstrapCompleteRef.current) {
        applySession(null);
      }
    };

    void runRetries();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Upgrade bootstrap when useSession eventually catches up.
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      bootstrapCompleteRef.current = true;
      setBootstrappedSession(session);
      setBootstrappedStatus('authenticated');
    }
  }, [session, status]);

  const effectiveStatus = (() => {
    if (status === 'authenticated' && session?.user) {
      return 'authenticated' as const;
    }
    if (bootstrappedSession?.user) {
      return 'authenticated' as const;
    }
    // Never trust useSession "unauthenticated" until bootstrap finishes — otherwise
    // we redirect to signin before getSession() reads the OAuth cookie.
    if (bootstrappedStatus === 'loading') {
      return 'loading' as const;
    }
    if (bootstrappedStatus === 'unauthenticated') {
      return 'unauthenticated' as const;
    }
    if (status === 'loading') {
      return 'loading' as const;
    }
    return status;
  })();

  const effectiveSession = (() => {
    if (status === 'authenticated' && session?.user) {
      return session;
    }
    if (bootstrappedSession?.user) {
      return bootstrappedSession;
    }
    return status !== 'loading' ? session : bootstrappedSession;
  })();

  useEffect(() => {
    if (effectiveStatus === 'loading') {
      return;
    }

    // OAuth lands here on purpose — only send to signin after bootstrap confirms no session.
    if (effectiveStatus === 'unauthenticated') {
      if (hasRedirectedToSigninRef.current) {
        return;
      }
      hasRedirectedToSigninRef.current = true;
      router.replace('/auth/signin?callbackUrl=/auth/role-selection');
      return;
    }

    if (effectiveStatus === 'authenticated' && effectiveSession?.user) {
      if (!effectiveSession.user.role && effectiveSession.user.email === 'naukrimili@naukrimili.com') {
        if (hasRedirectedAway) {
          return;
        }
        setHasRedirectedAway(true);
        signOut({ callbackUrl: '/auth/signin' });
        return;
      }

      if (effectiveSession.user.role) {
        if (hasRedirectedAway) {
          return;
        }
        setHasRedirectedAway(true);

        const sessionUser = effectiveSession.user as { id?: string; email?: string };
        const ownerKey = sessionUser.id || sessionUser.email || null;
        ensureWorkspacePreferenceOwnedBy(ownerKey);

        let targetUrl = '/dashboard';
        switch (effectiveSession.user.role) {
          case 'jobseeker':
            targetUrl = getJobseekerPostLoginRedirect(ownerKey);
            break;
          case 'employer':
            targetUrl = '/dashboard/company';
            break;
          case 'admin':
            targetUrl = '/dashboard/admin';
            break;
        }

        router.push(targetUrl);
      }
    }
  }, [effectiveSession, effectiveStatus, router, hasRedirectedAway]);

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
