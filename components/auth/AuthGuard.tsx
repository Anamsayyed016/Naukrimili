"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireProfileCompletion?: boolean;
  redirectTo?: string;
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
  redirectTo = "/auth/login"
}: AuthGuardProps) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const pathname = usePathname();

  const [redirectState, setRedirectState] = useState<RedirectState>({
    isRedirecting: false,
    targetPath: "",
    reason: ""
  });
  const [showLoader, setShowLoader] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const evaluateAccess = useCallback(() => {
    if (status === "unauthenticated") {
      return { hasAccess: false, reason: "Authentication required", targetPath: redirectTo };
    }
    if (status === "loading") {
      return { hasAccess: false, reason: "Loading", targetPath: "" };
    }
    if (allowedRoles.length > 0 && session?.user) {
      const userRole = (session.user as any)?.role;
      if (userRole && !allowedRoles.includes(userRole)) {
        const roleRedirects: Record<string, string> = {
          jobseeker: "/dashboard/jobseeker",
          employer: "/dashboard/company",
          admin: "/dashboard/admin"
        };
        return { hasAccess: false, reason: "Insufficient permissions", targetPath: roleRedirects[userRole] || "/dashboard" };
      }
    }
    if (requireProfileCompletion && session?.user) {
      const profileCompletion = (session.user as any)?.profileCompletion || 0;
      if (profileCompletion < 100) {
        return { hasAccess: false, reason: "Profile completion required", targetPath: "/profile-setup" };
      }
    }
    return { hasAccess: true, reason: "", targetPath: "" };
  }, [status, session, allowedRoles, requireProfileCompletion, redirectTo]);

  const handleRedirect = useCallback((path: string, reason: string) => {
    if (!path) return;
    setRedirectState({ isRedirecting: true, targetPath: path, reason });
    setShowLoader(true);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("auth_redirect_path", pathname);
        sessionStorage.setItem("auth_redirect_reason", reason);
      } catch {}
    }
    // Immediate redirect without delay
    router.push(path);
  }, [router, pathname]);

  useEffect(() => {
    const result = evaluateAccess();
    if (!result.hasAccess) {
      if (result.reason !== "Loading") {
        handleRedirect(result.targetPath, result.reason);
        setAccessDenied(result.reason !== "Loading");
      }
    } else {
      setShowLoader(false);
      setAccessDenied(false);
    }
  }, [evaluateAccess, handleRedirect]);

  // Only show loading during initial status check, not during redirects
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm font-medium text-gray-600">
            Loading...
          </p>
        </motion.div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-white text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-300 text-sm">
            {redirectState.reason || "You don't have permission to view this page."}
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
