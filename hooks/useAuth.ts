/**
 * Enhanced Session Management Hook
 * Provides session state, user data, and authentication methods with OAuth support
 */

"use client";

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole, AuthState, BiometricState, Credentials } from '@/types/auth';

interface ExtendedUser extends User {
  role: UserRole; // Use the correct UserRole type
  isActive: boolean;
  isVerified: boolean;
  profilePicture?: string;
  location?: string;
  skills?: string[];
  phone?: string;
  bio?: string;
  experience?: string;
  education?: string;
  provider?: string;
  firstName?: string;
  lastName?: string;
}

export interface ExtendedSession {
  user: ExtendedUser;
  expires: string;
}

// Enhanced auth hook with OAuth support
export function useAuth(): AuthState & {
  // OAuth-specific methods
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  redirectToSignIn: (callbackUrl?: string) => void;
  requireAuth: (callbackUrl?: string) => boolean;
  requireRole: (role: string, fallbackUrl?: string) => boolean;
  
  // Role checks
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isEmployer: () => boolean;
  isJobSeeker: () => boolean;
  
  // OAuth info
  getAuthProvider: () => string;
  isOAuthUser: () => boolean;
  
  // Utility
  fullName: string;
  initials: string;
} {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session;
  const user = session?.user as ExtendedUser | undefined;

  // Biometric (WebAuthn) state – graceful degradation if unsupported.
  const [biometric, setBiometric] = useState<BiometricState>({
    isAvailable: false,
    isEnabled: false,
    toggle: async () => false,
    verify: async () => false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== 'undefined' && 'PublicKeyCredential' in window) {
          const available = await (window as any).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
          if (!cancelled) setBiometric(b => ({ ...b, isAvailable: !!available }));
        }
      } catch (e) {
        // Silent fail – availability remains false
        console.warn('Biometric availability check failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sign in with credentials
  const signIn = useCallback(async (credentials: Credentials) => {
    const result = await nextAuthSignIn('credentials', { redirect: false, ...credentials });
    if (result?.error) throw new Error(result.error);
    return result;
  }, []);

  // Sign out with redirect
  const logout = useCallback(async (callbackUrl?: string) => {
    try {
      await nextAuthSignOut({
        callbackUrl: callbackUrl || '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Refresh session data
  const refreshSession = useCallback(async () => {
    try {
      await update();
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, [update]);

  // Check if user has specific role
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user?.role]);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  // Check if user is employer
  const isEmployer = useCallback(() => {
    return hasRole('employer');
  }, [hasRole]);

  // Check if user is job seeker
  const isJobSeeker = useCallback(() => {
    return hasRole('jobseeker');
  }, [hasRole]);

  // Get OAuth provider info
  const getAuthProvider = useCallback(() => {
    return user?.provider || 'credentials';
  }, [user?.provider]);

  // Check if user signed in via OAuth
  const isOAuthUser = useCallback(() => {
    const provider = getAuthProvider();
    return provider === 'google' || provider === 'linkedin';
  }, [getAuthProvider]);

  // Redirect to sign-in page
  const redirectToSignIn = useCallback((callbackUrl?: string) => {
    const url = `/auth/signin${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`;
    router.push(url);
  }, [router]);

  // Require authentication (redirect if not authenticated)
  const requireAuth = useCallback((callbackUrl?: string) => {
    if (!isLoading && !isAuthenticated) {
      redirectToSignIn(callbackUrl || window.location.pathname);
      return false;
    }
    return isAuthenticated;
  }, [isLoading, isAuthenticated, redirectToSignIn]);

  // Require specific role
  const requireRole = useCallback((role: string, fallbackUrl?: string) => {
    if (!requireAuth()) return false;
    
    if (!hasRole(role)) {
      router.push(fallbackUrl || '/unauthorized');
      return false;
    }
    
    return true;
  }, [requireAuth, hasRole, router]);

  const toggleBiometric = useCallback(async () => {
    // For now just flip enabled if available; real WebAuthn registration can be added later.
    if (!biometric.isAvailable) return false;
    setBiometric(b => ({ ...b, isEnabled: !b.isEnabled }));
    return true;
  }, [biometric.isAvailable, biometric.isEnabled]);

  const verifyBiometric = useCallback(async () => {
    // Placeholder: would call navigator.credentials.get with proper challenge.
    if (!biometric.isEnabled) return false;
    return true; // Assume success for stub.
  }, [biometric.isEnabled]);

  // Patch in real toggle/verify implementations into state object (kept stable via derived object below)
  const biometricState: BiometricState = {
    ...biometric,
    toggle: toggleBiometric,
    verify: verifyBiometric,
  };

  const authUser = session?.user as ExtendedUser | undefined;

  return {
    // Core auth state
    user: authUser || null,
    signIn,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    biometric: biometricState,
    
    // OAuth-specific methods
    logout,
    refreshSession,
    redirectToSignIn,
    requireAuth,
    requireRole,
    
    // Role checks
    hasRole,
    isAdmin,
    isEmployer,
    isJobSeeker,
    
    // OAuth info
    getAuthProvider,
    isOAuthUser,
    
    // Utility
    fullName: authUser ? 
      `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.name || '' : '',
    initials: authUser ? 
      (authUser.firstName?.[0] || '') + (authUser.lastName?.[0] || '') || 
      authUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 
      authUser.email?.[0]?.toUpperCase() || '?' : '',
  };
}
