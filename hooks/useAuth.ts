"use client";
import { useSession, signOut as nextAuthSignOut, signIn as nextAuthSignIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import type { AuthState, BiometricState, User } from "@/types/auth";

export function useAuth(): AuthState {
  const { data: session, status } = useSession();
  const [biometric, setBiometric] = useState<BiometricState>({
    isAvailable: false,
    isEnabled: false,
    toggle: async () => false,
    verify: async () => false
  });

  // Check biometric availability
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        if (window.PublicKeyCredential) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setBiometric(prev => ({ ...prev, isAvailable: available }));
        }
      } catch (error) {
        console.error("Biometric check failed:", error);
      }
    };

    checkBiometricAvailability();
  }, []);

  // Sign in function
  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const result = await nextAuthSignIn("credentials", {
        redirect: false,
        ...credentials,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  // Enable/disable biometric
  const toggleBiometric = useCallback(async () => {
    if (!biometric.isAvailable) return false;

    try {
      if (!biometric.isEnabled) {
        // Register biometric
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: {
              name: "Job Portal",
              id: window.location.hostname
            },
            user: {
              id: new Uint8Array(16),
              name: session?.user?.email || "",
              displayName: session?.user?.name || ""
            },
            pubKeyCredParams: [{
              type: "public-key",
              alg: -7 // ES256
            }],
            timeout: 60000,
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            }
          }
        });

        if (credential) {
          setBiometric(prev => ({ ...prev, isEnabled: true }));
          return true;
        }
      } else {
        // Disable biometric
        setBiometric(prev => ({ ...prev, isEnabled: false }));
        return true;
      }
    } catch (error) {
      console.error("Biometric toggle failed:", error);
      return false;
    }

    return false;
  }, [biometric.isAvailable, biometric.isEnabled, session]);

  // Verify biometric
  const verifyBiometric = useCallback(async () => {
    if (!biometric.isEnabled) return false;

    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: "required"
        }
      });

      return !!assertion;
    } catch (error) {
      console.error("Biometric verification failed:", error);
      return false;
    }
  }, [biometric.isEnabled]);

  // Transform session user to our User type
  const user: User | null = session?.user ? {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image || null,
    role: 'role' in session.user && typeof session.user.role === 'string' ? session.user.role as User['role'] : 'jobseeker',
    profileCompletion: 'profileCompletion' in session.user && typeof session.user.profileCompletion === 'number' ? session.user.profileCompletion : 0,
    createdAt: 'createdAt' in session.user && typeof session.user.createdAt === 'string' ? new Date(session.user.createdAt) : undefined,
    updatedAt: 'updatedAt' in session.user && typeof session.user.updatedAt === 'string' ? new Date(session.user.updatedAt) : undefined
  } : null;

  return {
    user,
    signIn,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    biometric: {
      ...biometric,
      toggle: toggleBiometric,
      verify: verifyBiometric
    }
  };
}
