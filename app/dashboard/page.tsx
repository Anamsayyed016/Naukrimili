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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only proceed if we're not already redirecting
    if (isRedirecting) return;

    // Wait for authentication status to be determined
    if (status === "loading") return;

    // Check if user is authenticated via either NextAuth or custom auth
    if (status === "unauthenticated" && !isAuthenticated) {
      // User is not authenticated, redirect to login
      router.push("/auth/login");
      return;
    }

    // User is authenticated, now check role and redirect appropriately
    const userRole = session?.user?.role || authUser?.role || "jobseeker";
    
    setIsRedirecting(true);
    setIsLoading(false);
    
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

  // Show loading while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we verify your authentication...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message
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
