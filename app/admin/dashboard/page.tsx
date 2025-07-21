"use client";
import RoleGuard from "@/components/shared/RoleGuard";
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, Building2, DollarSign, BarChart3, Sparkles, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const adminStats = [
  { title: "Total Users", value: "12.4K", change: "+1.2K", icon: Users, gradient: "from-blue-500 to-blue-600" },
  { title: "Active Jobs", value: "2.8K", change: "+156", icon: Briefcase, gradient: "from-green-500 to-green-600" },
  { title: "Companies", value: "456", change: "+23", icon: Building2, gradient: "from-purple-500 to-purple-600" },
  { title: "Revenue", value: "$45.2K", change: "+12%", icon: DollarSign, gradient: "from-orange-500 to-orange-600" },
];

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="container mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-300 text-lg">System administration and analytics</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 px-4 py-2">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Powered
                  </Badge>
                  <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {adminStats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-300">{stat.title}</p>
                          <p className="text-3xl font-bold text-white">{stat.value}</p>
                          <p className="text-sm text-green-400">{stat.change} from last week</p>
                        </div>
                        <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.gradient} text-white`}>
                          <stat.icon className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-xl border border-white/20">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-cyan-600 text-white">Overview</TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-cyan-600 text-white">Users</TabsTrigger>
                <TabsTrigger value="jobs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-cyan-600 text-white">Jobs</TabsTrigger>
                <TabsTrigger value="companies" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-cyan-600 text-white">Companies</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Brain className="h-5 w-5 text-purple-400" />
                      System Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">System Uptime</span>
                        <span className="text-sm font-medium text-white">99.99%</span>
                      </div>
                      <Progress value={99.99} className="h-3 bg-white/20" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Active Users</p>
                          <p className="text-white font-medium">12,400</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Active Jobs</p>
                          <p className="text-white font-medium">2,800</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white">User management table goes here.</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jobs" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Job Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white">Job management table goes here.</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="companies" className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white">Company Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white">Company management table goes here.</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </RoleGuard>
  );
}

export default AdminDashboardPage; 