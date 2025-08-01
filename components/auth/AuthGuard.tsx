"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert, Fingerprint } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireProfileCompletion?: boolean;
  redirectTo?: string;
  useBiometric?: boolean;
}

interface RedirectState {
  isRedirecting: boolean;
  targetPath: string;
  reason: string;
}

export default function AuthGuard({
  children,
  allowedRoles = [],
  requireProfileCompletion = false,
  redirectTo = "/auth/login",
  useBiometric = false
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [redirectState, setRedirectState] = useState<RedirectState>({
    isRedirecting: false,
    targetPath: "",
    reason: ""
  });
  
  const [showLoader, setShowLoader] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Check access permissions
  const checkAccess = useCallback(() => {
    // Not authenticated
    if (status === "unauthenticated") {
      return {
        hasAccess: false,
        reason: "Authentication required",
        targetPath: redirectTo
      };
    }

    // Loading state
    if (status === "loading") {
      return {
        hasAccess: false,
        reason: "Loading",
        targetPath: ""
      };
    }

    // Role-based access
    if (allowedRoles.length > 0 && session?.user) {
      const userRole = (session.user as any)?.role;
      if (!allowedRoles.includes(userRole)) {
        const roleRedirects: Record<string, string> = {
          jobseeker: "/jobseeker/dashboard",
          company: "/company/dashboard",
          admin: "/admin/dashboard"
        };
        
        return {
          hasAccess: false,
          reason: "Insufficient permissions",
          targetPath: roleRedirects[userRole] || "/dashboard"
        };
      }
    }

    // Profile completion requirement
    if (requireProfileCompletion && session?.user) {
      const profileCompletion = (session.user as any)?.profileCompletion || 0;
      if (profileCompletion < 100) {
        return {
          hasAccess: false,
          reason: "Profile completion required",
          targetPath: "/profile-setup"
        };
      }
    }

    return { hasAccess: true, reason: "", targetPath: "" };
  }, [status, session?.user?.role, allowedRoles, requireProfileCompletion, useBiometric, redirectTo]);

  // Handle redirects with animation
  const handleRedirect = useCallback((path: string, reason: string) => {
    if (!path) return;
    
    setRedirectState({
      isRedirecting: true,
      targetPath: path,
      reason
    });

    setShowLoader(true);

    // Store current path for post-login redirect
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_redirect_path", pathname);
      sessionStorage.setItem("auth_redirect_reason", reason);
    }

    // Animated redirect
    setTimeout(() => {
      router.push(path);
    }, 1000);
  }, [router, pathname, setRedirectState, setShowLoader]);

  // Main effect for access control
  useEffect(() => {
    const accessCheck = checkAccess();
    
    if (!accessCheck.hasAccess) {
      if (accessCheck.reason !== "Loading") {
        handleRedirect(accessCheck.targetPath, accessCheck.reason);
      }
    } else {
      setShowLoader(false);
      setAccessDenied(false);
    }
  }, [checkAccess, handleRedirect]);

  // Loading state
  if (status === "loading" || showLoader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-center"
        >
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">{redirectState.reason || "Loading..."}</p>
        </motion.div>
      </div>
    );
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-center"
        >
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-300">{redirectState.reason}</p>
        </motion.div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
} 