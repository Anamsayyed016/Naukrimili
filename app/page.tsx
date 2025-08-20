"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, MapPin, Building, Briefcase, Users, TrendingUp, ArrowRight, Brain, Shield, Zap, Upload, FileText, CheckCircle, Sparkles, Globe, Award, Clock } from 'lucide-react';
import ResumeUpload from '@/components/resume/ResumeUpload';

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

export default function HomePage() {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch featured jobs
      const jobsResponse = await fetch('/api/jobs?limit=6');
      const jobsData = await jobsResponse.json();
      
      // Fetch top companies
      const companiesResponse = await fetch('/api/companies?limit=6');
      const companiesData = await companiesResponse.json();

      if (jobsData.success) {
        setFeaturedJobs(jobsData.jobs);
      }
      
      if (companiesData.success) {
        setTopCompanies(companiesData.companies);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const trendingSearches = [
    'Software Engineer',
    'Data Analyst',
    'Product Manager',
    'UI/UX Designer',
    'DevOps Engineer',
    'Marketing Manager'
  ];

  const popularLocations = [
    'Bangalore',
    'Mumbai',
    'Delhi',
    'Hyderabad',
    'Chennai',
    'Pune'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Hero Section - Enhanced */}
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
              in India
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Discover thousands of opportunities across top companies. AI-powered matching, 
            real-time updates, and seamless application process.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center mb-12">
            <Link
              href="/jobs"
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              <Search className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              Search Jobs
            </Link>
            <Link
              href="/auth/register"
              className="group border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center hover:shadow-xl"
            >
              <Users className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              Get Started
            </Link>
            <button
              onClick={() => document.getElementById('resume-upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              <Upload className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              Upload Resume
            </button>
          </div>

          {/* Enhanced Trending Searches */}
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            <span className="text-gray-600 font-medium">Trending:</span>
            {trendingSearches.map((search, index) => (
              <Link
                key={index}
                href={`/jobs?query=${encodeURIComponent(search)}`}
                className="group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-white/40 hover:border-blue-200 hover:shadow-lg hover:scale-105"
              >
                {search}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Upload Section - Enhanced Design */}
      <section id="resume-upload-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="mb-10">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Upload className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Upload Your Resume & Get Discovered
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Let AI analyze your resume and match you with the perfect job opportunities. 
              Get instant feedback and improve your chances of getting hired.
            </p>
            
            {/* Enhanced Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
              <div className="flex items-center justify-center gap-3 text-blue-100 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <CheckCircle className="w-6 h-6 text-green-300" />
                <span className="font-medium">ATS Compatible</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-blue-100 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Brain className="w-6 h-6 text-purple-300" />
                <span className="font-medium">AI Analysis</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-blue-100 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <Zap className="w-6 h-6 text-yellow-300" />
                <span className="font-medium">Instant Matching</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Resume Upload Component */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
            <ResumeUpload />
          </div>
          
          <div className="mt-8 text-blue-100 text-sm">
            <p>Supported formats: PDF, DOC, DOCX • Max size: 10MB</p>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
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

      {/* Featured Jobs Section - Enhanced */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Featured Jobs</h2>
              <p className="text-gray-600">Discover the latest opportunities from top companies</p>
            </div>
            <Link 
              href="/jobs"
              className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mt-4 sm:mt-0 px-6 py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              View All Jobs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredJobs.map((job) => (
                <Link 
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200 hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg lg:text-xl text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    {job.isFeatured && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{job.company || 'Unknown Company'}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{job.jobType.replace('-', ' ')}</span>
                      </div>
                    )}
                  </div>
                  
                  {job.salary && (
                    <div className="text-green-600 font-semibold text-lg">{job.salary}</div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Apply Now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Companies Section - Enhanced */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Top Companies</h2>
              <p className="text-gray-600">Join leading organizations across industries</p>
            </div>
            <Link 
              href="/companies"
              className="group flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mt-4 sm:mt-0 px-6 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105"
            >
              View All Companies
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {topCompanies.map((company) => (
                <Link 
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="group block bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200 hover:border-blue-200 hover:scale-105"
                >
                  <div className="flex items-center gap-4 mb-6">
                    {company.logo ? (
                      <img 
                        src={company.logo} 
                        alt={company.name} 
                        className="w-16 h-16 object-contain rounded-2xl border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Building className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg lg:text-xl text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {company.name}
                      </h3>
                      {company.industry && (
                        <p className="text-sm text-gray-600 truncate">{company.industry}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    {company.location && (
                      <span className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{company.location}</span>
                      </span>
                    )}
                    <span className="text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                      {company.jobCount} open positions
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Locations Section - Enhanced */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Popular Job Locations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore opportunities in India's most vibrant tech hubs
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {popularLocations.map((location) => (
              <Link
                key={location}
                href={`/jobs?location=${encodeURIComponent(location)}`}
                className="group bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:scale-105"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{location}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Find Your Next Career Move?
          </h2>
          <p className="text-xl lg:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join thousands of professionals who have found their dream jobs through NaukriMili
          </p>
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center">
            <Link
              href="/auth/register"
              className="group bg-white text-blue-600 px-8 py-4 lg:px-10 lg:py-5 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 inline-flex items-center justify-center"
            >
              <Users className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              Get Started
            </Link>
            <Link
              href="/jobs"
              className="group border-2 border-white text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 inline-flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Resume Upload Button - Enhanced */}
      <FloatingResumeButton />
    </div>
  );
}

// Enhanced Floating Resume Upload Button
function FloatingResumeButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => document.getElementById('resume-upload-section')?.scrollIntoView({ behavior: 'smooth' })}
        className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white p-4 lg:p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95"
        title="Upload Resume"
      >
        <Upload className="w-6 h-6 lg:w-7 lg:h-7" />
        <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
          Upload Resume
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </button>
    </div>
  );
}
