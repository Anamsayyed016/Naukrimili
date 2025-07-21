'use client';

import RoleGuard from '@/components/shared/RoleGuard';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, BarChart3, Building2, Sparkles, FileText, ClipboardList, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import JobPostWizard from '@/features/company/components/JobPostWizard/JobPostWizard';
import CandidatePipeline from '@/features/company/components/CandidatePipeline/CandidatePipeline';
const HiringAnalytics = dynamic(() => import('@/features/company/components/Analytics/HiringAnalytics'), { loading: () => <div className="h-[300px] bg-company-50 animate-pulse rounded" /> });
import CompanyProfileEditor from '@/features/company/components/CompanyProfileEditor';
import EmptyState from '@/features/company/components/EmptyState';
import { useCompanyStats } from '@/features/company/hooks/useCompanyStats';

const tabs = [
  { label: 'Overview', key: 'overview' },
  { label: 'Jobs', key: 'jobs' },
  { label: 'Candidates', key: 'candidates' },
  { label: 'Analytics', key: 'analytics' },
  { label: 'Profile', key: 'profile' },
];

const statMeta = [
  { title: "Active Jobs", icon: Briefcase, gradient: "from-blue-500 to-blue-600", key: 'activeJobs' },
  { title: "Candidates", icon: Users, gradient: "from-green-500 to-green-600", key: 'candidates' },
  { title: "Interviews", icon: BarChart3, gradient: "from-purple-500 to-purple-600", key: 'interviews' },
  { title: "Company Rating", icon: Building2, gradient: "from-orange-500 to-orange-600", key: 'companyRating' },
];

export default function CompanyDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  // Replace with real companyId from auth/session
  const companyId = 'mock-company-id';
  const { stats, isLoading, isError } = useCompanyStats(companyId);

  return (
    <RoleGuard allowedRoles={['company']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-8">
        <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent mb-2">
                Company Dashboard
              </h1>
              <p className="text-gray-300 text-lg">Manage your company, jobs, and hiring pipeline</p>
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
            {statMeta.map((meta, index) => (
              <motion.div
                key={meta.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all duration-300 rounded-2xl shadow-lg">
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">{meta.title}</p>
                      {isLoading ? (
                        <div className="h-8 w-20 bg-company-200 animate-pulse rounded mb-2" />
                      ) : isError ? (
                        <p className="text-red-400">Error</p>
                      ) : (
                        <p className="text-3xl font-bold text-white">{meta.key === 'companyRating' ? stats?.[meta.key]?.toFixed(1) : stats?.[meta.key]}</p>
                      )}
                      {/* For demo, show change as static or you can add real change logic */}
                      <p className="text-sm text-green-400">{isLoading ? <span className="inline-block w-10 h-3 bg-company-200 animate-pulse rounded" /> : '+0' } this month</p>
                    </div>
                    <div className={`p-4 rounded-xl bg-gradient-to-r ${meta.gradient} text-white`}>
                      <meta.icon className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Tabs Navigation */}
          <div className="mb-8">
            <div className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden">
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
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-400" /> Post a Job</h2>
                  <JobPostWizard />
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center">
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-cyan-400" /> Candidate Pipeline</h2>
                  <CandidatePipeline />
                </div>
              </div>
            )}
            {activeTab === 'jobs' && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-blue-400" /> Job Management</h2>
                <JobPostWizard />
              </div>
            )}
            {activeTab === 'candidates' && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-green-400" /> Candidates</h2>
                <CandidatePipeline />
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-purple-400" /> Analytics</h2>
                <HiringAnalytics />
              </div>
            )}
            {activeTab === 'profile' && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><User className="h-5 w-5 text-orange-400" /> Company Profile</h2>
                <CompanyProfileEditor />
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
} 