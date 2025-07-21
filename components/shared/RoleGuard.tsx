import React from "react";
import { useAuth } from "@/hooks/use-auth";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
} 