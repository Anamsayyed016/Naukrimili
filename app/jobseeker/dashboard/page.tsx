"use client";

import JobSeekerDashboard from "@/components/JobSeekerDashboard";
import AuthGuard from "@/components/auth/AuthGuard";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["jobseeker"]}>
      <JobSeekerDashboard />
    </AuthGuard>
  );
} 