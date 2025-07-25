"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, BarChart3, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import AuthGuard from "@/components/auth/AuthGuard";

type StatKey = 'activeJobs' | 'candidates' | 'interviews' | 'companyRating';

const statMeta = [
  { title: "Active Jobs", icon: Briefcase, gradient: "from-blue-500 to-blue-600", key: 'activeJobs' as StatKey },
  { title: "Candidates", icon: Users, gradient: "from-green-500 to-green-600", key: 'candidates' as StatKey },
  { title: "Interviews", icon: BarChart3, gradient: "from-purple-500 to-purple-600", key: 'interviews' as StatKey },
  { title: "Company Rating", icon: Building2, gradient: "from-orange-500 to-orange-600", key: 'companyRating' as StatKey },
];

export default function CompanyDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  // Demo static stats data
  const stats: Record<StatKey, number> = {
    activeJobs: 12,
    candidates: 48,
    interviews: 7,
    companyRating: 4.5,
  };

  return (
    <AuthGuard allowedRoles={['company']}>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-8">Company Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statMeta.map((stat, index) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${stat.gradient} mb-4`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.title}
                    </h3>
                    <div className="text-2xl font-bold mt-2">
                      {stats[stat.key]}
                      {stat.key === 'companyRating' && '/5'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              {/* Overview content */}
            </TabsContent>
            <TabsContent value="jobs" className="space-y-4">
              {/* Jobs content */}
            </TabsContent>
            <TabsContent value="candidates" className="space-y-4">
              {/* Candidates content */}
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              {/* Analytics content */}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AuthGuard>
  );
} 