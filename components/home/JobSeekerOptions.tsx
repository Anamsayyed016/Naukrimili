"use client";

import Link from 'next/link';
import { Upload, FileText, Search, User, ArrowRight, Sparkles, Brain } from 'lucide-react';

interface JobSeekerOptionsProps {
  onBack: () => void;
}

export default function JobSeekerOptions({ onBack }: JobSeekerOptionsProps) {
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
        Welcome, Job Seeker! 👋
      </h2>
      
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Choose how you'd like to get started with your job search journey
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Upload Resume Option */}
        <div className="group p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Resume</h3>
          <p className="text-gray-600 mb-6">
            Upload your existing resume and let our AI analyze it for better job matching
          </p>
          <div className="space-y-3 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              AI-powered analysis
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-500" />
              Skills extraction
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              ATS optimization
            </div>
          </div>
          <Link
            href="/resumes/upload"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors gap-2"
          >
            Upload Resume <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Browse Jobs Option */}
        <div className="group p-6 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <Search className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Browse Jobs</h3>
          <p className="text-gray-600 mb-6">
            Start exploring thousands of job opportunities from top companies
          </p>
          <div className="space-y-3 mb-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              Advanced filters
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-green-500" />
              Smart matching
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-green-500" />
              Verified companies
            </div>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors gap-2"
          >
            Browse Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-800">
          💡 <strong>Pro tip:</strong> Upload your resume first for the best job matching experience!
        </p>
      </div>
    </div>
  );
}
