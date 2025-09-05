"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, MapPin, Building, Briefcase, Users, TrendingUp, ArrowRight, Brain, Shield, Zap, Upload, FileText, CheckCircle, Sparkles, Globe, Award, Clock, UserCheck, Building2, BriefcaseIcon, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
  const { data: session, status } = useSession();
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);
  const [showJobSeekerOptions, setShowJobSeekerOptions] = useState(false);
  const [showEmployerOptions, setShowEmployerOptions] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const router = useRouter();

  // Show role selection if user is authenticated but has no role
  useEffect(() => {
    console.log('HomePageClient - Session status:', status);
    console.log('HomePageClient - Session data:', session);
    
    if (status === 'authenticated' && session?.user) {
      console.log('HomePageClient - User authenticated:', session.user);
      if (!session.user.role) {
        console.log('HomePageClient - User has no role, showing role selection');
        setShowRoleSelection(true);
      } else {
        console.log('HomePageClient - User has role:', session.user.role);
      }
    } else if (status === 'unauthenticated') {
      console.log('HomePageClient - User not authenticated');
    } else if (status === 'loading') {
      console.log('HomePageClient - Session loading...');
    }
  }, [session, status]);

  const handleRoleSelect = async (role: 'jobseeker' | 'employer') => {
    if (!session?.user?.id) {
      console.error('HomePageClient - No user ID in session');
      alert('User session is invalid. Please sign in again.');
      return;
    }
    
    setIsUpdatingRole(true);
    setSelectedRole(role);
    
    try {
      console.log('HomePageClient - Session user:', session.user);
      console.log('HomePageClient - User ID:', session.user.id);
      console.log('HomePageClient - Role to set:', role);
      
      // Update user role in database
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          role: role
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Role updated successfully:', data.user);
        
        // Redirect to appropriate dashboard
        if (role === 'jobseeker') {
          router.push('/dashboard/jobseeker?setup=true');
        } else {
          router.push('/dashboard/company?setup=true');
        }
      } else {
        console.error('Role update failed:', data);
        alert('Failed to update role. Please try again.');
      }
    } catch (error) {
      console.error('Role selection error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setShowJobSeekerOptions(false);
    setShowEmployerOptions(false);
  };

  // Check if user is authenticated for conditional rendering
  const isAuthenticated = status === 'authenticated' && session?.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* User Profile Corner - Show if authenticated */}
      {isAuthenticated && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{session.user.name || 'User'}</div>
                <div className="text-gray-500 text-xs">{session.user.email}</div>
              </div>
              {!session.user.role && (
                <button
                  onClick={() => setShowRoleSelection(true)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose Role
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Role Selection Modal */}
      {showRoleSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Role</h3>
              <p className="text-gray-600">Select how you want to use our platform</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleRoleSelect('jobseeker')}
                disabled={isUpdatingRole}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Job Seeker</div>
                    <div className="text-sm text-gray-600">Find jobs, upload resume, build profile</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleRoleSelect('employer')}
                disabled={isUpdatingRole}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Employer</div>
                    <div className="text-sm text-gray-600">Post jobs, find candidates, manage company</div>
                  </div>
                </div>
              </button>
            </div>
            
            {isUpdatingRole && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Updating role...
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero Section - Enhanced with Authentication */}
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
              AI-Powered Job Matching Platform
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Find Your Dream Job
            <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              with NaukriMili
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
            Discover thousands of opportunities from verified companies. 
            <span className="font-semibold text-blue-600"> AI-powered matching</span> ensures you find the perfect fit.
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

          {/* Authentication Section - PROMINENTLY DISPLAYED */}
          <div className="max-w-2xl mx-auto mb-8 sm:mb-12">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 shadow-xl">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                Get Started in Seconds
              </h3>
              <p className="text-gray-600 mb-6">
                Sign in with your Google account or create a new account to access all features
              </p>
              
              {/* Direct Link to New Create Account Page */}
              <div className="mb-4">
                <Link
                  href="/auth/role-selection"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
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

      {/* Role Selection Section - STREAMLINED */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {!selectedRole ? (
            // Initial Role Selection
            <div className="text-center mb-16">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700 mb-6">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Choose Your Path
                </div>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                How would you like to use NaukriMili?
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Select your role to get started with the right features and tools
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Job Seeker Card */}
                <Link 
                  href="/auth/role-selection"
                  className="group cursor-pointer p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg block"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <UserCheck className="w-8 h-8 text-blue-600" />
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
                </Link>

                {/* Employer Card */}
                <Link 
                  href="/auth/role-selection"
                  className="group cursor-pointer p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 border-gray-200 bg-white hover:border-emerald-300 hover:shadow-lg block"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">I'm an Employer</h3>
                  <p className="text-gray-600 mb-6">
                    Post jobs, find talent, and manage your hiring process efficiently
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Post unlimited jobs
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      AI-powered candidate matching
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Application management
                    </li>
                  </ul>
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              </div>
            </div>
          ) : showJobSeekerOptions ? (
            // Job Seeker Options
            <div className="text-center">
              <div className="mb-8">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 mb-6 hover:bg-gray-200 transition-colors"
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
                      <Search className="w-4 h-4 text-purple-500" />
                      Industry optimized
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
                    Explore thousands of job opportunities from top companies
                  </p>
                  <div className="space-y-3 mb-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      Advanced filters
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-500" />
                      Company insights
                    </div>
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-green-500" />
                      Instant apply
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
            </div>
          ) : showEmployerOptions ? (
            // Employer Options
            <div className="text-center">
              <div className="mb-8">
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm font-medium text-gray-700 mb-6 hover:bg-gray-200 transition-colors"
                >
                  ← Back to Role Selection
                </button>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Welcome, Employer! 👋
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Choose how you'd like to get started with your hiring process
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Post Job Option */}
                <div className="group p-6 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 hover:border-emerald-400 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Post Job</h3>
                  <p className="text-gray-600 mb-6">
                    Create and post job openings to reach qualified candidates
                  </p>
                  <div className="space-y-3 mb-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      AI-powered matching
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      Professional templates
                    </div>
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-emerald-500" />
                      Candidate insights
                    </div>
                  </div>
                  <Link
                    href="/employer/post-job"
                    className="inline-flex items-center justify-center w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors gap-2"
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
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      Brand showcase
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Company insights
                    </div>
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-blue-500" />
                      Talent attraction
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
                    <BriefcaseIcon className="w-8 h-8 text-purple-600" />
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
                      <FileText className="w-4 h-4 text-purple-500" />
                      Application tracking
                    </div>
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-purple-500" />
                      Analytics
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
          ) : null}
        </div>
      </section>

      {/* Resume Upload Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-sm font-medium text-white mb-6">
              <FileText className="w-4 h-4" />
              AI-Powered Resume Analysis
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Get Discovered by Top Companies
          </h2>
          
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-12 max-w-3xl mx-auto">
            Upload your resume and let our AI analyze it to match you with the perfect job opportunities. 
            Get personalized insights and recommendations.
          </p>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-2xl mx-4">
            <div className="max-w-md mx-auto p-4 sm:p-6">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
                <div className="p-4 sm:p-6 pt-4 sm:pt-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Ready to Upload?</h2>
                  <p className="text-xs sm:text-sm text-blue-100 mb-3 sm:mb-4">Click the button below to upload your resume and get started</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/resumes"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-blue-600 hover:bg-gray-100 h-9 sm:h-10 px-3 sm:px-4 py-2 rounded-lg w-full sm:w-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      Manage Resumes
                    </Link>
                    <Link
                      href="/resumes/builder"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-9 sm:h-10 px-3 sm:px-4 py-2 rounded-lg w-full sm:w-auto shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      Build Resume
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 text-blue-100 text-xs sm:text-sm px-4">
            <p>Supported formats: PDF, DOC, DOCX • Max size: 10MB</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NaukriMili</span>?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience the future of job searching with our cutting-edge platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Brain className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">AI-Powered Matching</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI algorithm matches you with the perfect job opportunities based on your skills and preferences.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">Verified Companies</h3>
              <p className="text-gray-600 leading-relaxed">
                All companies are verified and legitimate, ensuring you apply to real opportunities.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">Instant Applications</h3>
              <p className="text-gray-600 leading-relaxed">
                Apply to multiple jobs with just a few clicks. No more complex application processes.
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
            {featuredJobs.length > 0 ? (
              featuredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{job.title}</h3>
                      <p className="text-gray-600 mb-2">{job.company}</p>
                    </div>
                    {job.isFeatured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {job.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Award className="w-4 h-4 flex-shrink-0" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{job.jobType}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                    >
                      View Details →
                    </Link>
                    <Link
                      href={`/jobs/${job.id}/apply`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:scale-105"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Featured Jobs Available</h3>
                <p className="text-gray-600 mb-4">Check back later for new opportunities</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Browse All Jobs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
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
            {topCompanies.length > 0 ? (
              topCompanies.map((company) => (
                <div key={company.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {company.logo ? (
                        <img 
                          src={company.logo} 
                          alt={company.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{company.name}</h3>
                      
                      {company.industry && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <BriefcaseIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{company.industry}</span>
                        </div>
                      )}
                      
                      {company.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{company.location}</span>
                        </div>
                      )}
                      
                      {company.jobCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                          <Briefcase className="w-4 h-4 flex-shrink-0" />
                          <span>{company.jobCount} open position{company.jobCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/companies/${company.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                    >
                      View Company →
                    </Link>
                    <Link 
                      href={`/companies/${company.id}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:scale-105"
                    >
                      Explore Jobs
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Companies Available</h3>
                <p className="text-gray-600 mb-4">Check back later for company listings</p>
                <Link
                  href="/companies"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Browse All Companies
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto">
            Join thousands of job seekers who have found their dream jobs through NaukriMili. 
            Start your search today and take the first step towards your career goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              <Search className="w-5 h-5 mr-2" />
              Start Job Search
            </Link>
            <Link
              href="/resumes/upload"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Resume
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
