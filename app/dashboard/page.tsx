"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import AuthGuard from "@/components/auth/AuthGuard";
import JobSeekerDashboard from "@/components/JobSeekerDashboard";
import CompanyDashboardPage from "../companies/dashboard/page";
import AdminDashboardPage from "../admin/dashboard/page";

export default function Page() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role || "jobseeker");

  const DashboardContent = () => {
    switch (user?.role) {
      case "company":
        return <CompanyDashboardPage />;
      case "admin":
        return <AdminDashboardPage />;
      case "jobseeker":
      default:
        return <JobSeekerDashboard />;
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

          <Card>
            <CardContent className="p-6">
              <DashboardContent />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AuthGuard>
  );
}
