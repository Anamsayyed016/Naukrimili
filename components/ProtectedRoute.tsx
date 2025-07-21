import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    } else if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
        // Redirect to dashboard based on role
        if (role === "jobseeker") router.replace("/jobseeker/dashboard");
        else if (role === "company") router.replace("/dashboard");
        else if (role === "admin") router.replace("/admin");
        else router.replace("/dashboard");
      }
    }
  }, [status, session, allowedRoles, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;
  const role = (session?.user as any)?.role;
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    // Optionally show a message or null while redirecting
    return null;
  }
  return <>{children}</>;
} 