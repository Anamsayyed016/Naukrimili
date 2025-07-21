"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import JobSeekerDashboard from "@/components/JobSeekerDashboard";
import CompanyDashboardPage from "../companies/dashboard/page";
import AdminDashboardPage from "../admin/dashboard/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const tabs = [
  { label: "Jobseeker Dashboard", key: "jobseeker" },
  { label: "Company Dashboard", key: "company" },
  { label: "Admin Dashboard", key: "admin" },
];

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("jobseeker");

  // Redirect to login if not authenticated
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      {/* User Welcome Section */}
      <Card className="mb-8 bg-gradient-to-r from-purple-50 to-cyan-50 border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <img 
              src={session.user?.image || "/placeholder-user.jpg"} 
              alt={session.user?.name || "User avatar"} 
              className="w-16 h-16 rounded-full border-2 border-purple-200" 
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Welcome, {session.user?.name || 'User'}! 🎉
              </h1>
              <p className="text-gray-600 mb-2">{session.user?.email}</p>
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white">
                  Authenticated
                </Badge>
                <Badge variant="outline">
                  Last login: Today
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <Link href="/profile">
                <button className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-200">
                  Edit Profile
                </button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        {tabs.map(tab => (
              <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: activeTab === tab.key ? "#3E92CC" : "#f3f4f6",
              color: activeTab === tab.key ? "white" : "#1f2937",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: activeTab === tab.key ? "0 2px 8px rgba(62,146,204,0.15)" : undefined,
              transition: "all 0.2s"
            }}
          >
            {tab.label}
              </button>
            ))}
          </div>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", padding: 32 }}>
        {activeTab === "jobseeker" && <JobSeekerDashboard />}
        {activeTab === "company" && <CompanyDashboardPage />}
        {activeTab === "admin" && <AdminDashboardPage />}
      </div>
    </div>
  );
}
