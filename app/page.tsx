"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, MapPin, Building, Briefcase, Users, TrendingUp, ArrowRight, Brain, Shield, Zap, Upload, FileText, CheckCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Dream Job
            <span className="block text-blue-600">in India</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover thousands of opportunities across top companies. AI-powered matching, 
            real-time updates, and seamless application process.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/jobs"
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 inline-flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Jobs
            </Link>
            <Link
              href="/auth/register"
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors duration-200 inline-flex items-center justify-center"
            >
              <Users className="w-5 h-5 mr-2" />
              Get Started
            </Link>
            <button
              onClick={() => document.getElementById('resume-upload-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-green-700 transition-colors duration-200 inline-flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Resume
            </button>
          </div>

          {/* Trending Searches */}
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-gray-600">Trending:</span>
            {trendingSearches.map((search, index) => (
              <Link
                key={index}
                href={`/jobs?query=${encodeURIComponent(search)}`}
                className="bg-white px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 border border-gray-200"
              >
                {search}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Upload Section - PROMINENT PLACEMENT */}
      <section id="resume-upload-section" className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Upload Your Resume & Get Discovered
            </h2>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Let AI analyze your resume and match you with the perfect job opportunities. 
              Get instant feedback and improve your chances of getting hired.
            </p>
            <div className="flex items-center justify-center gap-4 text-blue-100 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>ATS Compatible</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>AI Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Instant Matching</span>
              </div>
            </div>
          </div>
          
          {/* Resume Upload Component */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <ResumeUpload />
          </div>
          
          <div className="mt-6 text-blue-100 text-sm">
            <p>Supported formats: PDF, DOC, DOCX • Max size: 10MB</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose NaukriMili?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Our advanced AI algorithm matches you with the perfect job opportunities based on your skills and preferences.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Companies</h3>
              <p className="text-gray-600">
                All companies are verified and legitimate, ensuring you apply to real opportunities.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Applications</h3>
              <p className="text-gray-600">
                Apply to multiple jobs with just a few clicks. No more complex application processes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Jobs</h2>
            <Link 
              href="/jobs"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All Jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <Link 
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {job.title}
                    </h3>
                    {job.isFeatured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span>{job.company || 'Unknown Company'}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.jobType && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{job.jobType.replace('-', ' ')}</span>
                      </div>
                    )}
                  </div>
                  {job.salary && (
                    <div className="text-green-700 font-semibold">{job.salary}</div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Companies Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Top Companies</h2>
            <Link 
              href="/companies"
              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All Companies
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topCompanies.map((company) => (
                <Link 
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {company.logo ? (
                      <img 
                        src={company.logo} 
                        alt={company.name} 
                        className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{company.name}</h3>
                      {company.industry && (
                        <p className="text-sm text-gray-600">{company.industry}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    {company.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {company.location}
                      </span>
                    )}
                    <span className="text-blue-600 font-medium">{company.jobCount} open positions</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Locations */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Job Locations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularLocations.map((location) => (
              <Link
                key={location}
                href={`/jobs?location=${encodeURIComponent(location)}`}
                className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow duration-200 border border-gray-100"
              >
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">{location}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Next Career Move?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals who have found their dream jobs through NaukriMili
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Get Started
            </Link>
            <Link
              href="/jobs"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Resume Upload Button */}
      <FloatingResumeButton />
    </div>
  );
}

// Floating Resume Upload Button - Always Visible
function FloatingResumeButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => document.getElementById('resume-upload-section')?.scrollIntoView({ behavior: 'smooth' })}
        className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
        title="Upload Resume"
      >
        <Upload className="w-6 h-6" />
        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Upload Resume
        </div>
      </button>
    </div>
  );
}
