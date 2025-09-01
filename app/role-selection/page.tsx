"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Building2, ArrowRight, Sparkles, FileText, Search, Upload } from 'lucide-react';
import Link from 'next/link';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);
  const [showJobSeekerOptions, setShowJobSeekerOptions] = useState(false);
  const [showEmployerOptions, setShowEmployerOptions] = useState(false);
  const router = useRouter();

  const handleRoleSelect = (role: 'jobseeker' | 'employer') => {
    setSelectedRole(role);
    if (role === 'jobseeker') {
      setShowJobSeekerOptions(true);
      setShowEmployerOptions(false);
    } else {
      setShowEmployerOptions(true);
      setShowJobSeekerOptions(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setShowJobSeekerOptions(false);
    setShowEmployerOptions(false);
  };

  if (showJobSeekerOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <button
              onClick={handleBack}
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
                Upload your existing resume and get AI-powered analysis and matching
              </p>
              <div className="space-y-3 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  AI analysis
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  ATS optimization
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  Smart matching
                </div>
              </div>
              <Link
                href="/resumes/upload"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors gap-2"
              >
                Upload Resume <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Build Resume Option */}
            <div className="group p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Build Resume</h3>
              <p className="text-gray-600 mb-6">
                Create a professional resume from scratch with our easy-to-use builder
              </p>
              <div className="space-y-3 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Professional templates
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  AI suggestions
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  Multiple formats
                </div>
              </div>
              <Link
                href="/resumes/builder"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors gap-2"
              >
                Build Resume <ArrowRight className="w-4 h-4" />
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
                  <Search className="w-4 h-4 text-green-500" />
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
              💡 <strong>Pro tip:</strong> Upload or build your resume first for the best job matching experience!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showEmployerOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <button
              onClick={handleBack}
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
                  AI-powered matching
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-500" />
                  Quality candidates
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-green-500" />
                  Advanced analytics
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
                Set up and manage your company profile to attract top talent
              </p>
              <div className="space-y-3 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Brand showcase
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Talent attraction
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  Company insights
                </div>
              </div>
              <Link
                href="/dashboard/company"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors gap-2"
              >
                Manage Profile <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Dashboard Option */}
            <div className="group p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Search className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">View Dashboard</h3>
              <p className="text-gray-600 mb-6">
                Access your employer dashboard to manage jobs and applications
              </p>
              <div className="space-y-3 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  Job management
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  Application tracking
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-500" />
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Choose Your Path
          </div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
          How would you like to use NaukriMili?
        </h2>
        
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Select your role to get started with the right features and tools
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Job Seeker Card */}
          <div 
            className={`group cursor-pointer p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
              selectedRole === 'jobseeker' 
                ? 'border-blue-500 bg-blue-50 shadow-lg' 
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
            }`}
            onClick={() => handleRoleSelect('jobseeker')}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">I'm a Job Seeker</h3>
            <p className="text-gray-600 mb-6">
              Find your dream job, upload your resume, and get matched with opportunities
            </p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                AI-powered job matching
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Resume upload & analysis
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Track applications
              </li>
            </ul>
            <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
              Get Started <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Employer Card */}
          <div 
            className={`group cursor-pointer p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
              selectedRole === 'employer' 
                ? 'border-green-500 bg-green-50 shadow-lg' 
                : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-lg'
            }`}
            onClick={() => handleRoleSelect('employer')}
          >
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Building2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">I'm an Employer</h3>
            <p className="text-gray-600 mb-6">
              Post jobs, find talent, and manage your hiring process efficiently
            </p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Post job openings
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Review applications
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Manage company profile
              </li>
            </ul>
            <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
              Get Started <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
