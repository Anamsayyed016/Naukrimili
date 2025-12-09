"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";

function AdminPageContent() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin</h1>
      <p className="text-gray-600 mb-4">This page is under development.</p>
      <button 
        onClick={() => router.push('/dashboard/admin')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Admin Dashboard
      </button>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/auth/signin">
      <AdminPageContent />
    </AuthGuard>
  );
}
