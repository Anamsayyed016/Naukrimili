"use client";
import CompanyView from "@/components/dashboard/CompanyView";
import AuthGuard from "@/components/auth/AuthGuard";

export default function CompanyDashboardPage() {
  return (
    <AuthGuard allowedRoles={['employer']}>
      <CompanyView />
    </AuthGuard>
  );
} 