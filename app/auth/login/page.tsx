"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Get stored redirect path or use role-based default
      const storedPath = sessionStorage.getItem("auth_redirect_path");
      if (storedPath) {
        router.replace(storedPath);
        sessionStorage.removeItem("auth_redirect_path");
        return;
      }

      // Role-based redirect
      const role = (user as any)?.role;
      if (role === "company") router.replace("/company/dashboard");
      else if (role === "admin") router.replace("/admin/dashboard");
      else if (role === "jobseeker") router.replace("/jobseeker/dashboard");
      else router.replace("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
