"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Search, MapPin, Building, Briefcase, Users, TrendingUp, ArrowRight, Brain, Shield, Zap, Upload, FileText, CheckCircle, Sparkles, Globe, Award, Clock, UserCheck, Building2, BriefcaseIcon, User, Building2 as BuildingIcon } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  jobType: string | null;
  isRemote: boolean;
  isFeatured: boolean;
}

interface Company {
  id: string;
  name: string;
  logo?: string | null;
  location?: string | null;
  industry?: string | null;
  jobCount: number;
}

interface HomePageClientProps {
  featuredJobs: Job[];
  topCompanies: Company[];
  trendingSearches: string[];
  popularLocations: string[];
}

export default function HomePageClient({
  featuredJobs,
  topCompanies,
  trendingSearches,
  popularLocations
}: HomePageClientProps) {
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Role Selection Section - Show first if no role selected */}
      {!selectedRole && (
        <section className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Welcome to NaukriMili
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your Dream Job
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                with NaukriMili
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
              Choose your path and let us guide you to success
            </p>

            {/* Role Selection Cards */}
            <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {/* Job Seeker Card */}
                <div 
                  onClick={() => setSelectedRole('jobseeker')}
                  className="group cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-blue-200"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm a Job Seeker</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Find your perfect job match with AI-powered recommendations. Upload your resume or build one from scratch.
                  </p>
                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>AI-powered job matching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Resume upload & builder</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Track applications</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-center text-blue-600 font-semibold group-hover:text-blue-700 transition-colors">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Employer Card */}
                <div 
                  onClick={() => setSelectedRole('employer')}
                  className="group cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-green-200"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BuildingIcon className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">I'm an Employer</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Post jobs, find top talent, and manage your hiring process efficiently with our comprehensive tools.
                  </p>
                  <div className="space-y-3 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Post jobs easily</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Manage applications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Analytics & insights</span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-center text-green-600 font-semibold group-hover:text-green-700 transition-colors">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3 mx-auto">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">10K+</div>
                  <div className="text-sm text-gray-600">Active Jobs</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3 mx-auto">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">500+</div>
                  <div className="text-sm text-gray-600">Companies</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3 mx-auto">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">50K+</div>
                  <div className="text-sm text-gray-600">Job Seekers</div>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3 mx-auto">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">95%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Job Seeker Flow */}
      {selectedRole === 'jobseeker' && (
        <>
          {/* Job Seeker Hero Section */}
          <section className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto text-center">
              <div className="mb-8">
                <button 
                  onClick={() => setSelectedRole(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg hover:bg-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back to Role Selection
                </button>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-sm font-medium text-blue-700 mb-6">
                  <User className="w-4 h-4" />
                  Job Seeker Mode
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Find Your Dream Job
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  with AI-Powered Matching
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
                Upload your resume or build one from scratch. Our AI will match you with the perfect opportunities.
              </p>

              {/* Enhanced Search Bar */}
              <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 sm:p-3">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Job title, keywords, or company"
                        className="w-full pl-12 pr-4 py-3 sm:py-4 text-gray-900 placeholder-gray-500 border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-xl text-base sm:text-lg"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Location or remote"
                        className="w-full pl-12 pr-4 py-3 sm:py-4 text-gray-900 placeholder-gray-500 border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-xl text-base sm:text-lg"
                      />
                    </div>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-base sm:text-lg"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search Jobs
                    </Link>
                  </div>
                </div>
              </div>

              {/* Resume Options */}
              <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
                <h3 className="text-xl font-semibold text-gray-700 mb-6">Get Started with Your Resume</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link
                    href="/resumes/upload"
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-blue-200 text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">Upload Resume</h4>
                    <p className="text-gray-600 mb-4">
                      Upload your existing resume and let our AI analyze it to extract all your details automatically.
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>• AI-powered analysis</div>
                      <div>• Automatic data extraction</div>
                      <div>• ATS compatibility check</div>
                    </div>
                  </Link>

                  <Link
                    href="/resumes/builder"
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-purple-200 text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">Build Resume</h4>
                    <p className="text-gray-600 mb-4">
                      Create a professional resume from scratch with our easy-to-use builder and templates.
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>• Professional templates</div>
                      <div>• Step-by-step guidance</div>
                      <div>• Real-time preview</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Trending Searches */}
              <div className="mb-8 sm:mb-12">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Trending Searches</h3>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {trendingSearches.map((search, index) => (
                    <Link
                      key={index}
                      href={`/jobs?q=${encodeURIComponent(search)}`}
                      className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      {search}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Popular Locations */}
              <div className="mb-8 sm:mb-12">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Popular Locations</h3>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  {popularLocations.map((location, index) => (
                    <Link
                      key={index}
                      href={`/jobs?location=${encodeURIComponent(location)}`}
                      className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {location}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Employer Flow */}
      {selectedRole === 'employer' && (
        <>
          {/* Employer Hero Section */}
          <section className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-400/20 to-green-400/20 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto text-center">
              <div className="mb-8">
                <button 
                  onClick={() => setSelectedRole(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg hover:bg-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Back to Role Selection
                </button>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full text-sm font-medium text-green-700 mb-6">
                  <BuildingIcon className="w-4 h-4" />
                  Employer Mode
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Find Top Talent
                <span className="block bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  for Your Company
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
                Post jobs, manage applications, and find the perfect candidates with our comprehensive hiring platform.
              </p>

              {/* Employer Actions */}
              <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link
                    href="/employer/post-job"
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-green-200 text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">Post a Job</h4>
                    <p className="text-gray-600 mb-4">
                      Create and publish job listings to reach thousands of qualified candidates.
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>• Easy job creation</div>
                      <div>• Advanced targeting</div>
                      <div>• Instant publishing</div>
                    </div>
                  </Link>

                  <Link
                    href="/auth/register?role=employer"
                    className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-teal-200 text-center"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <BuildingIcon className="w-8 h-8 text-teal-600" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">Register Company</h4>
                    <p className="text-gray-600 mb-4">
                      Set up your company profile and start managing your hiring process.
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>• Company profile setup</div>
                      <div>• Dashboard access</div>
                      <div>• Analytics & insights</div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Employer Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-3 mx-auto">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">50K+</div>
                    <div className="text-sm text-gray-600">Active Candidates</div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3 mx-auto">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">10K+</div>
                    <div className="text-sm text-gray-600">Jobs Posted</div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3 mx-auto">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">95%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 shadow-lg">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3 mx-auto">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">24h</div>
                    <div className="text-sm text-gray-600">Avg. Response</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Continue with existing sections only if role is selected */}
      {selectedRole && (
        <>
          {/* Features Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NaukriMili</span>?
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Experience the future of {selectedRole === 'jobseeker' ? 'job searching' : 'hiring'} with our cutting-edge platform
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-500 hover:scale-105">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Brain className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">AI-Powered Matching</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedRole === 'jobseeker' 
                      ? 'Our advanced AI algorithm matches you with the perfect job opportunities based on your skills and preferences.'
                      : 'Our AI helps you find the best candidates by matching job requirements with candidate profiles.'
                    }
                  </p>
                </div>
                
                <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all duration-500 hover:scale-105">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Shield className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">
                    {selectedRole === 'jobseeker' ? 'Verified Companies' : 'Verified Candidates'}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedRole === 'jobseeker'
                      ? 'All companies are verified and legitimate, ensuring you apply to real opportunities.'
                      : 'All candidates are verified with complete profiles and professional backgrounds.'
                    }
                  </p>
                </div>
                
                <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-500 hover:scale-105">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Zap className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">
                    {selectedRole === 'jobseeker' ? 'Instant Applications' : 'Quick Hiring'}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedRole === 'jobseeker'
                      ? 'Apply to multiple jobs with just a few clicks. No more complex application processes.'
                      : 'Streamlined hiring process with instant candidate matching and application management.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Jobs Section */}
          <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12">
                <div className="mb-6 sm:mb-0">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Featured Jobs</h2>
                  <p className="text-sm sm:text-base text-gray-600">Discover the latest opportunities from top companies</p>
                </div>
                <Link 
                  href="/jobs"
                  className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200"
                >
                  View All Jobs
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {featuredJobs.slice(0, 6).map((job) => (
                  <div key={job.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 mb-2">{job.company}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      {job.isFeatured && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          <Award className="w-3 h-3" />
                          Featured
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {job.jobType}
                        </span>
                        {job.isRemote && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            Remote
                          </span>
                        )}
                      </div>
                      {job.salary && (
                        <span className="text-sm font-medium text-gray-700">{job.salary}</span>
                      )}
                    </div>
                    
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Top Companies Section */}
          <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12">
                <div className="mb-6 sm:mb-0">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Top Companies</h2>
                  <p className="text-sm sm:text-base text-gray-600">Work with the best companies in the industry</p>
                </div>
                <Link 
                  href="/companies"
                  className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200"
                >
                  View All Companies
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {topCompanies.slice(0, 6).map((company) => (
                  <div key={company.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {company.logo ? (
                          <img src={company.logo} alt={company.name} className="w-8 h-8" />
                        ) : (
                          <Building className="w-6 h-6 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-600">{company.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">{company.industry}</span>
                      <span className="text-sm font-medium text-blue-600">{company.jobCount} jobs</span>
                    </div>
                    
                    <Link
                      href={`/companies/${company.id}`}
                      className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View Company
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>
            
            <div className="relative max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to {selectedRole === 'jobseeker' ? 'Find Your Dream Job' : 'Start Hiring'}?
              </h2>
              <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                {selectedRole === 'jobseeker' 
                  ? 'Join thousands of job seekers who have found their perfect match with NaukriMili.'
                  : 'Join hundreds of companies who trust NaukriMili for their hiring needs.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {selectedRole === 'jobseeker' ? (
                  <>
                    <Link
                      href="/auth/register?role=jobseeker"
                      className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/jobs"
                      className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
                    >
                      Browse Jobs
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/register?role=employer"
                      className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Register Company
                    </Link>
                    <Link
                      href="/employer/post-job"
                      className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-semibold rounded-xl border-2 border-white hover:bg-white hover:text-green-600 transition-all duration-300 transform hover:scale-105"
                    >
                      Post a Job
                    </Link>
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
