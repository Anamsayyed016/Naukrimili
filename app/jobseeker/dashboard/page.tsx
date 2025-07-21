"use client";

import JobSeekerDashboard from "@/components/JobSeekerDashboard";
import RoleGuard from "@/components/shared/RoleGuard";

export default function Page() {
  return (
    <RoleGuard allowedRoles={["jobseeker"]}>
      <JobSeekerDashboard />
    </RoleGuard>
  );
} 