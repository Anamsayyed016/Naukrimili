"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import AuthGuard from "@/components/auth/AuthGuard";
import UserModerationTable from "@/components/admin/UserModerationTable";
import JobVerificationQueue from "@/components/admin/JobVerificationQueue";
import FraudDetectionReports from "@/components/admin/FraudDetectionReports";
import SystemHealthWidgets from "@/components/admin/SystemHealthWidgets";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AuthGuard allowedRoles={["admin"]} requireProfileCompletion={true}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          <SystemHealthWidgets className="mb-8" />

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="jobs">Job Verification</TabsTrigger>
              <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">System Overview</h2>
                  {/* Overview content */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">User Management</h2>
                  <UserModerationTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Job Verification Queue</h2>
                  <JobVerificationQueue />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fraud" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Fraud Detection</h2>
                  <FraudDetectionReports />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AuthGuard>
  );
} 