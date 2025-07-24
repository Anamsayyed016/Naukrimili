import React, { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, FileText, BarChart3, Sparkles, User, ClipboardList, Star } from "lucide-react";

function ResumeManagerPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-white">
      <FileText className="h-8 w-8 text-blue-400 mb-2" />
      <p className="text-lg font-semibold">Resume management coming soon!</p>
    </div>
  );
}

const stats = [
  { title: "Applications", value: "24", change: "+3", icon: ClipboardList, gradient: "from-blue-500 to-blue-600" },
  { title: "Interviews", value: "5", change: "+1", icon: Briefcase, gradient: "from-green-500 to-green-600" },
  { title: "Saved Jobs", value: "12", change: "+2", icon: Star, gradient: "from-purple-500 to-purple-600" },
  { title: "Profile Score", value: "85%", change: "+5%", icon: User, gradient: "from-orange-500 to-orange-600" },
];

const tabs = [
  { label: "Overview", key: "overview" },
  { label: "Resume", key: "resume" },
  { label: "Applications", key: "applications" },
  { label: "Profile", key: "profile" },
];

export default function JobSeekerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-8">
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent mb-2 brand-logo">
              Your NaukriMili Dashboard
            </h1>
            <p className="text-gray-300 text-lg brand-tagline">Manage your job search all in one place</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-2 rounded-xl font-semibold text-sm shadow">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Powered
            </span>
            <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-xl font-semibold shadow flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Stats
            </button>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-2xl shadow-lg">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-green-400">{stat.change} this month</p>
                  </div>
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.gradient} text-white`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Tabs Navigation */}
        <div className="mb-8">
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
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-400" /> Resume Manager</h2>
                <ResumeManagerPlaceholder />
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Briefcase className="h-5 w-5 text-cyan-400" /> Job Search</h2>
                <p className="text-gray-300 text-center">Find jobs tailored to your profile and interests.</p>
              </div>
            </div>
          )}
          {activeTab === "resume" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-400" /> Resume Manager</h2>
              <ResumeManagerPlaceholder />
            </div>
          )}
          {activeTab === "applications" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-green-400" /> Applications</h2>
              <p className="text-gray-300">Your job applications will appear here.</p>
            </div>
          )}
          {activeTab === "profile" && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><User className="h-5 w-5 text-orange-400" /> Profile</h2>
              <p className="text-gray-300">Manage your profile and settings here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 