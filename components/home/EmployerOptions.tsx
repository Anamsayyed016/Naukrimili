"use client";

import Link from 'next/link';
import { Building2, FileText, Users, ArrowRight, Sparkles, Briefcase } from 'lucide-react';

interface EmployerOptionsProps {
  onBack: () => void;
}

export default function EmployerOptions({ onBack }: EmployerOptionsProps) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg hover:bg-white transition-colors"
        >
          ← Back to Role Selection
        </button>
      </div>
      
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
        Welcome, Employer! 🏢
      </h2>
      
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Choose how you'd like to start your hiring process
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Post Job Option */}
        <div className="group p-6 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Post a Job</h3>
          <p className="text-gray-600 mb-6">
            Create and publish job openings to reach qualified candidates
          </p>
          <div className="space-y-3 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              Easy job creation
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-500" />
              AI-powered matching
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              Reach top talent
            </div>
          </div>
          <Link
            href="/employer/post-job"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors gap-2"
          >
            Post Job <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Company Profile Option */}
        <div className="group p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Company Profile</h3>
          <p className="text-gray-600 mb-6">
            Set up and manage your company profile to attract better candidates
          </p>
          <div className="space-y-3 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Brand showcase
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Company culture
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Attract talent
            </div>
          </div>
          <Link
            href="/employer/company-profile"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors gap-2"
          >
            Manage Profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dashboard Option */}
        <div className="group p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <Briefcase className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Dashboard</h3>
          <p className="text-gray-600 mb-6">
            Access your employer dashboard to manage jobs and applications
          </p>
          <div className="space-y-3 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Job management
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-500" />
              Application review
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Analytics & insights
            </div>
          </div>
          <Link
            href="/dashboard/company"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors gap-2"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
        <p className="text-sm text-green-800">
          💡 <strong>Pro tip:</strong> Complete your company profile first to attract better candidates!
        </p>
      </div>
    </div>
  );
}
