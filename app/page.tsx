'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  timeAgo?: string;
  isUrgent?: boolean;
  isRemote?: boolean;
}

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  location: string;
  openJobs: number;
  rating: number;
}

interface Stats {
  jobs: number;
  companies: number;
  seekers: number;
  successRate: number;
}

export default function HomePage() {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [topCompanies, setTopCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats>({
    jobs: 10000,
    companies: 5000,
    seekers: 50000,
    successRate: 95
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured jobs
        const jobsResponse = await fetch('/api/jobs?limit=6');
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          if (jobsData.success) {
            setFeaturedJobs(jobsData.jobs.slice(0, 6));
          }
        }

        // Fetch top companies
        const companiesResponse = await fetch('/api/companies?limit=8');
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          if (companiesData.success) {
            setTopCompanies(companiesData.companies.slice(0, 8));
            // Update stats based on real data
            setStats(prev => ({
              ...prev,
              companies: companiesData.total || prev.companies,
              jobs: companiesData.companies.reduce((sum: number, company: Company) => sum + company.openJobs, 0) || prev.jobs
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-blue-600">
              NaukriMili
            </div>
            <div className="space-x-6">
              <Link href="/jobs" className="text-gray-700 hover:text-blue-600 font-medium">
                Jobs
              </Link>
              <Link href="/companies" className="text-gray-700 hover:text-blue-600 font-medium">
                Companies
              </Link>
              <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Find Your Dream Job with{' '}
            <span className="text-yellow-400">AI Power</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Connect with top employers, get AI-powered job recommendations, 
            and accelerate your career growth with NaukriMili.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/jobs" 
              className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105"
            >
              🔍 Browse Jobs
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition-all"
            >
              🚀 Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800">Featured Jobs</h2>
            <Link href="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
              View All Jobs →
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 p-6 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4 w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <div key={job.id} className="bg-white border border-gray-200 p-6 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{job.title}</h3>
                    {job.isUrgent && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">Urgent</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{job.company}</p>
                  <p className="text-gray-500 text-sm mb-2">📍 {job.location}</p>
                  {job.salary && (
                    <p className="text-green-600 font-medium mb-3">💰 {job.salary}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">{job.timeAgo || 'Recently posted'}</span>
                    <Link 
                      href={`/jobs/${job.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Companies Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800">Top Companies</h2>
            <Link href="/companies" className="text-blue-600 hover:text-blue-700 font-medium">
              View All Companies →
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg animate-pulse">
                  <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {topCompanies.map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`} className="bg-white p-6 rounded-lg hover:shadow-lg transition-shadow text-center">
                  <img 
                    src={company.logo} 
                    alt={company.name}
                    className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-logo.png';
                    }}
                  />
                  <h3 className="font-semibold text-gray-800 mb-1">{company.name}</h3>
                  <p className="text-gray-500 text-sm mb-2">{company.industry}</p>
                  <p className="text-blue-600 text-sm font-medium">{company.openJobs} open jobs</p>
                  <div className="flex items-center justify-center mt-2">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-gray-600 text-sm ml-1">{company.rating}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            Why Choose NaukriMili?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">AI-Powered Matching</h3>
              <p className="text-gray-600">
                Get personalized job recommendations based on your skills, experience, and career goals.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Verified Companies</h3>
              <p className="text-gray-600">
                All companies are screened and verified for authenticity, quality, and legitimacy.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Smart Search</h3>
              <p className="text-gray-600">
                Find jobs faster with our intelligent search, filtering, and recommendation system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">{stats.jobs.toLocaleString()}+</div>
              <div className="text-blue-100">Active Jobs</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.companies.toLocaleString()}+</div>
              <div className="text-blue-100">Companies</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.seekers.toLocaleString()}+</div>
              <div className="text-blue-100">Job Seekers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.successRate}%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">NaukriMili</div>
            <p className="text-gray-400 mb-4">Your AI-powered career companion</p>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-gray-400">
                © 2025 NaukriMili. All rights reserved. | 
                <Link href="/privacy" className="hover:text-white ml-1">Privacy Policy</Link> | 
                <Link href="/terms" className="hover:text-white ml-1">Terms of Service</Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
