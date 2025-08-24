"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, MapPin, Building, Briefcase, Users, TrendingUp, ArrowRight, Brain, Shield, Zap, Upload, FileText, CheckCircle, Sparkles, Globe, Award, Clock } from 'lucide-react';

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
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles w-4 h-4 text-blue-600" aria-hidden="true">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>
                <path d="M20 3v4"></path>
                <path d="M22 5h-4"></path>
                <path d="M4 17v2"></path>
                <path d="M5 18H3"></path>
              </svg>
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
            Discover thousands of opportunities across top companies. AI-powered matching, real-time updates, and seamless application process.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center mb-12">
            <a 
              href="/jobs"
              className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search w-5 h-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true">
                <path d="m21 21-4.34-4.34"></path>
                <circle cx="11" cy="11" r="8"></circle>
              </svg>
              Search Jobs
            </a>
            
            <a 
              href="/auth/register"
              className="group border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center hover:shadow-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              Get Started
            </a>
            
            <a 
              href="/resumes/upload"
              className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl text-lg font-semibold transition-all duration-300 inline-flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-5 h-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true">
                <path d="M12 3v12"></path>
                <path d="m17 8-5-5-5 5"></path>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              </svg>
              Upload Resume
            </a>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            <span className="text-gray-600 font-medium">Trending:</span>
            <a href="/jobs?query=Software%20Engineer" className="group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-white/40 hover:border-blue-200 hover:shadow-lg hover:scale-105">
              Software Engineer
            </a>
            <a href="/jobs?query=Data%20Analyst" className="group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-white/40 hover:border-blue-200 hover:shadow-lg hover:scale-105">
              Data Analyst
            </a>
            <a href="/jobs?query=Product%20Manager" className="group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-white/40 hover:border-blue-200 hover:shadow-lg hover:scale-105">
              Product Manager
            </a>
            <a href="/jobs?query=UI%2FUX%20Designer" className="group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-white/40 hover:border-blue-200 hover:shadow-lg hover:scale-105">
              UI/UX Designer
            </a>
            <a href="/jobs?query=DevOps%20Engineer" className="group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-white/40 hover:border-blue-200 hover:shadow-lg hover:scale-105">
              DevOps Engineer
            </a>
            <a href="/jobs?query=Marketing%20Manager" className="group bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 border border-white/40 hover:border-blue-200 hover:shadow-lg hover:scale-105">
              Marketing Manager
            </a>
          </div>
        </div>
      </section>

      {/* Resume Upload Section - Simplified */}
      <section id="resume-upload-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="mb-10">
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-10 h-10 lg:w-12 lg:h-12 text-white" aria-hidden="true">
                <path d="M12 3v12"></path>
                <path d="m17 8-5-5-5 5"></path>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              </svg>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Upload Your Resume & Get Discovered
            </h2>
            
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Let AI analyze your resume and match you with the perfect job opportunities. Get instant feedback and improve your chances of getting hired.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
              <div className="flex items-center justify-center gap-3 text-blue-100 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-big w-6 h-6 text-green-300" aria-hidden="true">
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
                <span className="font-medium">ATS Compatible</span>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-blue-100 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain w-6 h-6 text-purple-300" aria-hidden="true">
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path>
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path>
                  <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path>
                  <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path>
                  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"></path>
                  <path d="M3.477 10.896a4 4 0 0 1 .585-.396"></path>
                  <path d="M19.938 10.5a4 4 0 0 1 .585.396"></path>
                  <path d="M6 18a4 4 0 0 1-1.967-.516"></path>
                  <path d="M19.967 17.484A4 4 0 0 1 18 18"></path>
                </svg>
                <span className="font-medium">AI Analysis</span>
              </div>
              
              <div className="flex items-center justify-center gap-3 text-blue-100 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-6 h-6 text-yellow-300" aria-hidden="true">
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                </svg>
                <span className="font-medium">Instant Matching</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
            <div className="max-w-md mx-auto p-6">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
                <div className="p-6 pt-6">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">Ready to Upload?</h2>
                  <p className="text-sm text-blue-100 mb-4">Click the button below to go to the resume upload page</p>
                  <a
                    href="/resumes/upload"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-blue-600 hover:bg-gray-100 h-10 px-4 py-2 rounded-lg"
                  >
                    Go to Upload Page
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-blue-100 text-sm">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain w-10 h-10 text-blue-600" aria-hidden="true">
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"></path>
                  <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"></path>
                  <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"></path>
                  <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"></path>
                  <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"></path>
                  <path d="M3.477 10.896a4 4 0 0 1 .585-.396"></path>
                  <path d="M19.938 10.5a4 4 0 0 1 .585.396"></path>
                  <path d="M6 18a4 4 0 0 1-1.967-.516"></path>
                  <path d="M19.967 17.484A4 4 0 0 1 18 18"></path>
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">AI-Powered Matching</h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI algorithm matches you with the perfect job opportunities based on your skills and preferences.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield w-10 h-10 text-green-600" aria-hidden="true">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                </svg>
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">Verified Companies</h3>
              <p className="text-gray-600 leading-relaxed">
                All companies are verified and legitimate, ensuring you apply to real opportunities.
              </p>
            </div>
            
            <div className="group text-center p-8 rounded-2xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 transition-all duration-500 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-10 h-10 text-purple-600" aria-hidden="true">
                  <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                </svg>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Featured Jobs</h2>
              <p className="text-gray-600">Discover the latest opportunities from top companies</p>
            </div>
            <a 
              href="/jobs"
              className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mt-4 sm:mt-0 px-6 py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              View All Jobs
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Placeholder job cards with loading animation */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Companies Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Top Companies</h2>
              <p className="text-gray-600">Join leading organizations across industries</p>
            </div>
            <a 
              href="/companies"
              className="group flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mt-4 sm:mt-0 px-6 py-3 bg-white rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105"
            >
              View All Companies
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Placeholder company cards with loading animation */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Locations Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Popular Job Locations</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore opportunities in India's most vibrant tech hubs
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {[
              'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'
            ].map((city) => (
              <a 
                key={city}
                href={`/jobs?location=${city}`}
                className="group bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:scale-105"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin w-6 h-6 text-blue-600" aria-hidden="true">
                    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {city}
                </h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
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
            <a 
              href="/auth/register"
              className="group bg-white text-blue-600 px-8 py-4 lg:px-10 lg:py-5 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 inline-flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              Get Started
            </a>
            
            <a 
              href="/jobs"
              className="group border-2 border-white text-white px-8 py-4 lg:px-10 lg:py-5 rounded-2xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 inline-flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search w-5 h-5 mr-3 group-hover:scale-110 transition-transform" aria-hidden="true">
                <path d="m21 21-4.34-4.34"></path>
                <circle cx="11" cy="11" r="8"></circle>
              </svg>
              Browse Jobs
            </a>
          </div>
        </div>
      </section>

      {/* Floating Upload Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <a
          href="/resumes/upload"
          className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white p-4 lg:p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95 block"
          title="Upload Resume"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-6 h-6 lg:w-7 lg:h-7" aria-hidden="true">
            <path d="M12 3v12"></path>
            <path d="m17 8-5-5-5 5"></path>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          </svg>
          
          <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
            Upload Resume
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        </a>
      </div>
    </div>
  );
}
