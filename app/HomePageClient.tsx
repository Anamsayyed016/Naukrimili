"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { safeLength } from '../lib/safe-array-utils';
import { Search, ArrowRight, Award, Clock, MapPin, Upload, BriefcaseIcon, Building2, Briefcase } from 'lucide-react';
import { useSession } from 'next-auth/react';
import OAuthButtons from '../components/auth/OAuthButtons';
import SEOJobLink from '../components/SEOJobLink';
import JobSearchHero from '../components/JobSearchHero';

interface HomePageJob {
  id: number | string;
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
  featuredJobs: HomePageJob[];
  topCompanies: Company[];
  trendingSearches: string[];
  popularLocations: string[];
}

export default function HomePageClient({
  featuredJobs,
  topCompanies,
  popularLocations
}: HomePageClientProps) {
  const { data: session, status } = useSession();
  const [locationJobCounts, setLocationJobCounts] = useState<Record<string, number>>({});
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

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

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute('data-animate-id');
            if (elementId) {
              setVisibleElements(prev => new Set([...prev, elementId]));
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe all elements with data-animate-id
    const animatedElements = document.querySelectorAll('[data-animate-id]');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  // Check if user is authenticated for conditional rendering
  // Remove unused authentication check

  // Utility function to get animation delay class
  const getDelayClass = (index: number) => {
    const delays = ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500', 'delay-600'];
    return delays[index] || 'delay-700';
  };

  // Fetch job counts for popular locations
  useEffect(() => {
    const fetchJobCounts = async () => {
      try {
        const counts: Record<string, number> = {};
        
        // Set initial counts for all locations to show them immediately
        for (const location of popularLocations || []) {
          counts[location] = 0; // Will be updated when API responds
        }
        setLocationJobCounts(counts);
        
        // Then fetch actual counts with timeout
        for (const location of popularLocations || []) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            // Determine country hint to improve counts (e.g., Dubai → AE)
            let country = 'IN';
            const ll = location.toLowerCase();
            if (ll.includes('new york') || ll.includes('san francisco') || ll.includes('los angeles') || ll.includes('chicago') || ll.includes('boston') || ll.includes('seattle')) {
              country = 'US';
            } else if (ll.includes('london') || ll.includes('manchester') || ll.includes('birmingham') || ll.includes('edinburgh')) {
              country = 'GB';
            } else if (ll.includes('dubai') || ll.includes('abu dhabi') || ll.includes('sharjah')) {
              country = 'AE';
            }

            // First try with country+location (lenient OR on server). If 0, retry with country only.
            const urlWithCountry = `/api/jobs?location=${encodeURIComponent(location)}&country=${country}&view=list&days=60&limit=1`;
            let response = await fetch(urlWithCountry, { signal: controller.signal });
            
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            if (response.ok) {
              const data = await response.json();
              console.log(`🔍 API response for ${location}:`, data);
              
              // Handle different response structures
              let jobCount = 0;
              if (data.success && data.data?.pagination?.total) {
                jobCount = data.data.pagination.total;
              } else if (data.pagination?.total) {
                jobCount = data.pagination.total;
              } else if (data.total) {
                jobCount = data.total;
              } else if (data.data?.total) {
                jobCount = data.data.total;
              }

              // If no jobs found and we supplied a location, retry with country-only
              if (jobCount === 0 && country !== 'IN') {
                try {
                  const fallbackResp = await fetch(`/api/jobs?country=${country}&view=list&days=60&limit=1`);
                  if (fallbackResp.ok) {
                    const fallbackData = await fallbackResp.json();
                    if (fallbackData?.success && fallbackData.data?.pagination?.total) {
                      jobCount = fallbackData.data.pagination.total;
                    }
                  }
                } catch {}
              }
              
              console.log(`✅ Job count for ${location}:`, jobCount);
              setLocationJobCounts(prev => {
                const newCounts = {
                  ...prev,
                  [location]: jobCount
                };
                console.log(`🔄 Updated locationJobCounts:`, newCounts);
                return newCounts;
              });
            } else {
              console.warn(`API response not ok for ${location}:`, response.status);
              // Set count to 0 if API call fails
              setLocationJobCounts(prev => ({
                ...prev,
                [location]: 0
              }));
            }
          } catch (_error) {
            console.warn(`Failed to fetch job count for ${location}:`, error);
            // Set count to 0 if API call fails
            setLocationJobCounts(prev => ({
              ...prev,
              [location]: 0
            }));
          }
        }
      } catch (_error) {
        console.error('Failed to fetch location job counts:', error);
      }
    };

    if (popularLocations && popularLocations.length > 0) {
      fetchJobCounts();
    }
  }, [popularLocations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">





      {/* Smart Job Search with Advanced Dynamic Filters */}
      <JobSearchHero 
        showAdvancedFilters={true}
      />

      {/* Popular Locations Section */}
      <section className="relative py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto">
          <div className="mb-8 sm:mb-12">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Popular Locations</h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {(popularLocations || []).map((location, index) => {
                // Determine country based on location
                let country = 'IN'; // Default to India
                const locationLower = location.toLowerCase();
                
                if (locationLower.includes('new york') || locationLower.includes('san francisco') || 
                    locationLower.includes('los angeles') || locationLower.includes('chicago') || 
                    locationLower.includes('boston') || locationLower.includes('seattle')) {
                  country = 'US';
                } else if (locationLower.includes('london') || locationLower.includes('manchester') || 
                           locationLower.includes('birmingham') || locationLower.includes('edinburgh')) {
                  country = 'GB';
                } else if (locationLower.includes('dubai') || locationLower.includes('abu dhabi') || 
                           locationLower.includes('sharjah')) {
                  country = 'AE';
                }
                
                return (
                  <Link
                    key={index}
                    href={`/jobs?location=${encodeURIComponent(location)}&country=${country}&limit=1000`}
                    className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{location}</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {locationJobCounts[location] !== undefined ? `${locationJobCounts[location]} Jobs` : 'Jobs'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* Featured Jobs Section */}
      <section 
        className={`py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30 transition-all duration-1000 ease-out ${
          visibleElements.has('featured-jobs') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        data-animate-id="featured-jobs"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12">
            <div className="mb-6 sm:mb-0">
              <h2 
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 transition-all duration-1000 ease-out delay-200 ${
                  visibleElements.has('featured-jobs-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                data-animate-id="featured-jobs-title"
              >
                Featured Jobs
              </h2>
              <p 
                className={`text-sm sm:text-base text-gray-600 transition-all duration-1000 ease-out delay-300 ${
                  visibleElements.has('featured-jobs-subtitle') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                data-animate-id="featured-jobs-subtitle"
              >
                Discover the latest opportunities from top companies
              </p>
            </div>
            <Link 
              href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&limit=1000"
              className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200"
            >
              View All Jobs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {safeLength(featuredJobs) > 0 ? (
              (featuredJobs || []).map((job, index) => (
                <div 
                  key={job.id} 
                  className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 transform transition-all duration-700 ease-out hover:scale-105 ${getDelayClass(index)} ${
                    visibleElements.has(`job-card-${job.id}`) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                  }`}
                  data-animate-id={`job-card-${job.id}`}
                >
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
                  href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&limit=1000"
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
                  
                  <div className="flex items-center justify-end">
                    {/* Check if it's a fallback company (with specific IDs) or real company from database */}
                    {company.id.includes('fallback') || company.id.includes('techcorp') || company.id.includes('innovate') || company.id.includes('dataflow') || company.id.includes('cloudtech') || company.id.includes('creative') || company.id.includes('fintech') ? (
                      // External links for fallback companies
                      company.id.includes('techcorp') ? (
                        <a 
                          href="https://careers.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : company.id.includes('innovate') ? (
                        <a 
                          href="https://careers.microsoft.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : company.id.includes('dataflow') ? (
                        <a 
                          href="https://www.amazon.jobs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : company.id.includes('cloudtech') ? (
                        <a 
                          href="https://careers.google.com/cloud"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : company.id.includes('creative') ? (
                        <a 
                          href="https://careers.adobe.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : company.id.includes('fintech') ? (
                        <a 
                          href="https://jobs.jpmorgan.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm font-medium">
                          View Company →
                        </span>
                      )
                    ) : (
                      // Internal link for real companies from database
                      <Link 
                        href={`/companies/${company.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                      >
                        View Company →
                      </Link>
                    )}
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
              href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&limit=1000"
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
