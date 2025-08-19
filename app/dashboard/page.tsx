"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Redirect based on user role
    const userRole = session.user?.role || "jobseeker";
    
    switch (userRole) {
      case "admin":
        router.push("/dashboard/admin");
        break;
      case "employer":
      case "company":
        router.push("/dashboard/company");
        break;
      case "jobseeker":
      default:
        router.push("/dashboard/jobseeker");
        break;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
      <p className="text-gray-600">Taking you to your dashboard...</p>
    </div>
  );
}
