"use client";

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import type { AuthState, BiometricState, Credentials, User } from "@/types/auth";

// Clean minimal reimplementation of the corrupted auth hook.
export function useAuth(): AuthState {
  const { data: session, status } = useSession();

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

  const signIn = useCallback(async (credentials: Credentials) => {
    const result = await nextAuthSignIn('credentials', { redirect: false, ...credentials });
    if (result?.error) throw new Error(result.error);
    return result;
  }, []);

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

  const su: any = session?.user;
  const user: User | null = su ? {
    id: su.id || '',
    name: su.name || null,
    email: su.email || null,
    image: su.image || null,
    role: su.role && typeof su.role === 'string' ? su.role : 'jobseeker',
    profileCompletion: typeof su.profileCompletion === 'number' ? su.profileCompletion : 0,
    createdAt: su.createdAt ? new Date(su.createdAt) : undefined,
    updatedAt: su.updatedAt ? new Date(su.updatedAt) : undefined,
  } : null;

  return {
    user,
    signIn,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    biometric: biometricState,
  };
}