import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  BarChart3,
  Briefcase,
  FileText,
  Search,
  SlidersHorizontal,
  Plus,
  TrendingUp,
  Brain,
  Target,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import DashboardStats from "./dashboard/DashboardStats";
import DashboardHeader from "./dashboard/DashboardHeader";

const stats = [
  { title: "Active Jobs", value: "12", change: "+2", icon: Briefcase, gradient: "from-blue-500 to-blue-600" },
  { title: "Total Applicants", value: "156", change: "+24", icon: Users, gradient: "from-green-500 to-green-600" },
  { title: "Interviews", value: "28", change: "+5", icon: Target, gradient: "from-purple-500 to-purple-600" },
  { title: "Hiring Rate", value: "68%", change: "+12%", icon: TrendingUp, gradient: "from-orange-500 to-orange-600" },
];

const tabs = [
  { label: "Overview", key: "overview" },
  { label: "Jobs", key: "jobs" },
  { label: "Candidates", key: "candidates" },
  { label: "Analytics", key: "analytics" },
];

export default function CompanyDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    department: "",
    location: "",
    status: "",
  });
  const [activeTab, setActiveTab] = useState("overview");

  const handlePostJob = () => {
    // Implement job posting logic
    console.log("Post job clicked");
  };

  const handleViewAnalytics = () => {
    setActiveTab("analytics");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-8">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <DashboardHeader
          title="Company Dashboard"
          subtitle="Manage your jobs and candidates"
          actions={[
            {
              icon: Plus,
              label: "Post Job",
              onClick: handlePostJob,
            },
            {
              icon: BarChart3,
              label: "Analytics",
              onClick: handleViewAnalytics,
            },
          ]}
        />

        {/* Stats */}
        <DashboardStats stats={stats} />

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8"
        >
          <div className="relative w-full md:w-96">
            <Input
              type="search"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Candidates</SheetTitle>
                <SheetDescription>
                  Refine your candidate search
                </SheetDescription>
              </SheetHeader>
              {/* Add filter controls here */}
            </SheetContent>
          </Sheet>
        </motion.div>

        {/* Tabs Navigation */}
        <div className="mb-8 mt-8">
          <div className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 font-semibold text-white transition-all ${activeTab === tab.key ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-400" /> Active Jobs
                </h2>
                {/* Add active jobs list */}
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-400" /> Recent Applications
                </h2>
                {/* Add recent applications list */}
              </div>
            </div>
          )}
          {activeTab === "jobs" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-400" /> Job Listings
              </h2>
              {/* Add job listings table/grid */}
            </div>
          )}
          {activeTab === "candidates" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-green-400" /> Candidate Pool
              </h2>
              {/* Add candidates table/grid */}
            </div>
          )}
          {activeTab === "analytics" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-400" /> Analytics
              </h2>
              {/* Add analytics charts/graphs */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 