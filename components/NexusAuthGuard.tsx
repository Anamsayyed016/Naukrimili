// Nexus AuthGuard - Completely Unique Route Protection
// Features: Holographic loading, Biometric prompts, Elegant redirects, Role-based access

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useNexusAuth } from '@/hooks/use-nexus-auth';
import { NexusUserRole } from '@/lib/nexus-auth';

interface NexusAuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: NexusUserRole[];
  requireProfileCompletion?: boolean;
  redirectTo?: string;
  showBiometricPrompt?: boolean;
}

interface RedirectState {
  isRedirecting: boolean;
  targetPath: string;
  reason: string;
}

export default function NexusAuthGuard({
  children,
  allowedRoles = [],
  requireProfileCompletion = false,
  redirectTo = '/nexus/login',
  showBiometricPrompt = false
}: NexusAuthGuardProps) {
  const { user, isAuthenticated, isLoading, authMethod, authenticateWithBiometric } = useNexusAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [redirectState, setRedirectState] = useState<RedirectState>({
    isRedirecting: false,
    targetPath: '',
    reason: ''
  });
  
  const [showHolographicLoader, setShowHolographicLoader] = useState(false);
  const [biometricPromptVisible, setBiometricPromptVisible] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check access permissions
  const checkAccess = (): { hasAccess: boolean; reason: string; targetPath: string } => {
    // Not authenticated
    if (!isAuthenticated) {
      return {
        hasAccess: false,
        reason: 'Authentication required',
        targetPath: redirectTo
      };
    }

    // Role-based access
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      const roleRedirects: Record<NexusUserRole, string> = {
        talent: '/nexus/talent/dashboard',
        enterprise: '/nexus/enterprise/dashboard',
        curator: '/nexus/curator/dashboard'
      };
      
      return {
        hasAccess: false,
        reason: 'Insufficient permissions',
        targetPath: roleRedirects[user.role] || '/nexus/dashboard'
      };
    }

    // Profile completion requirement
    if (requireProfileCompletion && user && user.profileCompletion < 100) {
      return {
        hasAccess: false,
        reason: 'Profile completion required',
        targetPath: '/nexus/profile-setup'
      };
    }

    return { hasAccess: true, reason: '', targetPath: '' };
  };

  // Handle redirects with animation
  const handleRedirect = (targetPath: string, reason: string) => {
    setRedirectState({
      isRedirecting: true,
      targetPath,
      reason
    });

    setShowHolographicLoader(true);

    // Store redirect info for post-login redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nexus_redirect_path', pathname);
      sessionStorage.setItem('nexus_redirect_reason', reason);
    }

    setTimeout(() => {
      router.push(targetPath);
    }, 2000);
  };

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    setBiometricPromptVisible(true);
    
    try {
      const success = await authenticateWithBiometric();
      
      if (success) {
        setBiometricPromptVisible(false);
        // Continue with access
      } else {
        setBiometricPromptVisible(false);
        handleRedirect(redirectTo, 'Biometric authentication failed');
      }
    } catch (error) {
      setBiometricPromptVisible(false);
      handleRedirect(redirectTo, 'Biometric authentication error');
    }
  };

  // Main effect for access control
  useEffect(() => {
    if (isLoading) return;

    const accessCheck = checkAccess();
    
    if (!accessCheck.hasAccess) {
      if (showBiometricPrompt && authMethod === 'biometric' && isAuthenticated) {
        handleBiometricAuth();
      } else {
        handleRedirect(accessCheck.targetPath, accessCheck.reason);
      }
    } else {
      setShowHolographicLoader(false);
      setAccessDenied(false);
    }
  }, [isAuthenticated, isLoading, user, pathname, showBiometricPrompt, authMethod]);

  // Loading state
  if (isLoading || showHolographicLoader) {
    return <HolographicLoader reason={redirectState.reason} />;
  }

  // Access denied state
  if (accessDenied) {
    return <AccessDeniedScreen reason={redirectState.reason} />;
  }

  // Biometric prompt
  if (biometricPromptVisible) {
    return <BiometricPrompt onAuthenticate={handleBiometricAuth} />;
  }

  // Render children if access granted
  return <>{children}</>;
}

// Holographic Loading Component
function HolographicLoader({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Holographic Ring */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-4 border-purple-500/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-24 h-24 border-4 border-cyan-500/30 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-2 w-20 h-20 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full opacity-20"
          />
        </div>

        {/* Loading Text */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-white mb-4"
        >
          Nexus Security
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-purple-300 text-lg"
        >
          {reason || 'Verifying access...'}
        </motion.p>

        {/* Scanning Effect */}
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-6 w-32 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full mx-auto"
        />
      </motion.div>
    </div>
  );
}

// Access Denied Screen
function AccessDeniedScreen({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900/20 via-slate-900 to-red-900/20 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto p-8"
      >
        {/* Shield Icon */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-red-300 mb-6">{reason}</p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          onClick={() => window.history.back()}
        >
          Go Back
        </motion.button>
      </motion.div>
    </div>
  );
}

// Biometric Prompt Component
function BiometricPrompt({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    onAuthenticate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto p-8"
      >
        {/* Biometric Scanner */}
        <div className="relative mb-8">
          <motion.div
            animate={isScanning ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: isScanning ? Infinity : 0 }}
            className="w-32 h-32 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto"
          >
            <motion.div
              animate={isScanning ? { opacity: [0.5, 1, 0.5] } : {}}
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center"
            >
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Biometric Authentication</h2>
        <p className="text-purple-300 mb-6">
          Please authenticate using your biometric credentials
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg font-semibold"
          onClick={handleScan}
          disabled={isScanning}
        >
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </motion.button>
      </motion.div>
    </div>
  );
} 