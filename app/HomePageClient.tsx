"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { safeLength, safeArray } from '@/lib/safe-array-utils';
import { Search, Building, Briefcase, Users, TrendingUp, ArrowRight, Shield, Zap, Globe, Award, Clock, User, Sparkles, Upload, FileText, Building2, BriefcaseIcon, Target, Star, MapPin, Brain } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { Button } from "@/components/ui/button";
import SEOJobLink from '@/components/SEOJobLink';
import UnifiedJobSearch from '@/components/UnifiedJobSearch';
import ErrorBoundary from '@/components/ErrorBoundary';

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
  const router = useRouter();
  

  // Remove auto-redirect logic to prevent forced authentication
  // Users can stay on homepage regardless of auth status
  useEffect(() => {
    console.log('HomePageClient - Session status:', status);
    console.log('HomePageClient - Session data:', session);
    
    // Only log auth status, don't force redirects
    if (status === 'authenticated' && session?.user) {
      console.log('HomePageClient - User authenticated:', session.user);
    } else if (status === 'unauthenticated') {
      console.log('HomePageClient - User not authenticated');
    } else if (status === 'loading') {
      console.log('HomePageClient - Session loading...');
    }
  }, [session, status]);

  // Check if user is authenticated for conditional rendering
  const isAuthenticated = status === 'authenticated' && session?.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">





      {/* Hero Section with "Discover the Career You Deserve" */}
      <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            <span className="text-white">Discover</span>
            <span className="text-blue-300"> the Career</span>
            <span className="text-purple-300"> You Deserve</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Connect with top companies worldwide through our AI-powered job matching platform
          </p>
        </div>
      </section>

      {/* Smart Job Search with Fixed Dynamic Filters */}
      <UnifiedJobSearch 
        variant="homepage"
        showAdvancedFilters={true}
        showSuggestions={true}
        showLocationCategories={true}
        autoSearch={true}
      />

      {/* Popular Locations Section */}
      <section className="relative py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto">
          <div className="mb-8 sm:mb-12">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Popular Locations</h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {(popularLocations || []).map((location, index) => (
                <Link
                  key={index}
                  href={`/jobs?location=${encodeURIComponent(location)}&unlimited=true&includeExternal=true&includeDatabase=true&includeSample=true&limit=100`}
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
              href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&includeSample=true&limit=100"
              className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200"
            >
              View All Jobs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {safeLength(featuredJobs) > 0 ? (
              (featuredJobs || []).map((job) => (
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
                    <SEOJobLink job={job} className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
                      View Details →
                    </SEOJobLink>
                    <SEOJobLink job={job} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:scale-105">
                      Apply Now
                    </SEOJobLink>
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
                  href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&includeSample=true&limit=100"
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
            {safeLength(topCompanies) > 0 ? (
              (topCompanies || []).map((company) => (
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
            <OAuthButtons 
              callbackUrl="/"
              className="!w-auto"
            />
            <Link
              href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&includeSample=true&limit=100"
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
