"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { user: authUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // Still loading

    // Check if user is authenticated via either NextAuth or custom auth
    if (status === "unauthenticated" && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // Prevent multiple redirects
    if (isRedirecting) return;

    // Get user role from either NextAuth session or custom auth
    const userRole = session?.user?.role || authUser?.role || "jobseeker";
    
    setIsRedirecting(true);
    
    // Redirect based on user role
    switch (userRole) {
      case "admin":
        router.push("/dashboard/admin");
        break;
      case "employer":
        router.push("/dashboard/company");
        break;
      case "jobseeker":
      default:
        router.push("/dashboard/jobseeker");
        break;
    }
  }, [session, status, authUser, isAuthenticated, router, isRedirecting]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600">Taking you to your dashboard...</p>
      </div>
    </div>
  );
}
