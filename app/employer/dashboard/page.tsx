'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { EmployerAnalytics } from '@/components/employer/EmployerAnalytics';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Building2,
  Sparkles,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const tabs = [
  { label: "Analytics", key: "analytics", icon: LayoutDashboard },
  { label: "Jobs", key: "jobs", icon: Building2 },
  { label: "Candidates", key: "candidates", icon: Users },
  { label: "Reports", key: "reports", icon: FileText },
  { label: "Settings", key: "settings", icon: Settings },
];

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      {/* Header Section */}
      <header className="border-b border-white/10 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
                Employer Dashboard
              </h1>
              <p className="text-gray-400 mt-1">
                Manage your jobs and candidates
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Recruiter
              </span>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-300" />
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuItem>
                    <span>New application for Frontend Developer</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>3 candidates shortlisted</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
                  EM
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-6 mt-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Analytics Overview</h2>
                  <p className="text-gray-400">Track your recruitment metrics and performance</p>
                </div>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  Download Report
                </Button>
              </div>
              <EmployerAnalytics />
            </div>
          )}
          
          {activeTab === "jobs" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Job Listings</h2>
              <p className="text-gray-400">Manage your active and closed positions</p>
            </div>
          )}
          
          {activeTab === "candidates" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Candidate Pool</h2>
              <p className="text-gray-400">Review and manage applications</p>
            </div>
          )}
          
          {activeTab === "reports" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Reports</h2>
              <p className="text-gray-400">View detailed recruitment analytics</p>
            </div>
          )}
          
          {activeTab === "settings" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
              <p className="text-gray-400">Configure your employer account</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>)}
