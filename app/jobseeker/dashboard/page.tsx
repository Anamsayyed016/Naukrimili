"use client";
import JobSeekerView from "@/components/dashboard/JobSeekerView";
import AuthGuard from "@/components/auth/AuthGuard";

export default function Page() {
  return (
    <AuthGuard allowedRoles={["jobseeker"]}>
      <JobSeekerView />
    </AuthGuard>
  );
} 