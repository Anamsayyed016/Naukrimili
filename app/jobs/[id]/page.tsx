'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Clock, DollarSign, Heart, Bookmark, Star, Building2, Calendar, ArrowRight, Sparkles, Users, Eye, ExternalLink, Search, Send, Globe } from "lucide-react";
import JobShare from "@/components/JobShare";
import JobPostingSchema from "@/components/seo/JobPostingSchema";
import { formatJobSalary } from "@/lib/currency-utils";
import { buildJobDetailContent } from "@/lib/jobs/job-detail-content";

interface Job {
  id: string;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  apply_url: string | null;
  source_url: string | null;
  postedAt: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  sector: string | null;
  views: number;
  applications: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  creator: any;
  source: string;
  isExternal: boolean;
  companyRelation?: {
    name: string;
    logo: string | null;
    location: string;
    industry: string;
    website: string | null;
  };
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false); // Prevent hydration mismatch
  const [canonicalUrl, setCanonicalUrl] = useState<string>(''); // CRITICAL: Must be declared before any returns

  // CRITICAL: Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // PRESERVE SEARCH STATE: Save current search params when navigating to job details
  useEffect(() => {
    if (!mounted) return; // Only run after mount to prevent hydration issues
    
    // Get current URL params from referrer or current location
    const currentParams = new URLSearchParams();
    
    // Check if we came from jobs page with search params
    const referrer = document.referrer;
    if (referrer && referrer.includes('/jobs?')) {
      const referrerUrl = new URL(referrer);
      referrerUrl.searchParams.forEach((value, key) => {
        currentParams.set(key, value);
      });
    }
    
    // Also check current page search params (if any)
    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (!currentParams.has(key)) {
          currentParams.set(key, value);
        }
      });
    }
    
    // Save to sessionStorage for restoration when going back
    if (currentParams.toString()) {
      sessionStorage.setItem('jobSearchParams', currentParams.toString());
      console.log('💾 Saved search params to sessionStorage:', currentParams.toString());
    }
    
    // Save the current job ID as the last viewed job
    if (params.id) {
      sessionStorage.setItem('lastViewedJobId', String(params.id));
    }
  }, [searchParams, params.id, mounted]);

  // Generate canonical URL for this job (client-side) - must be in useEffect, not during render
  useEffect(() => {
    if (job && mounted) {
      import('@/lib/seo-url-utils').then(({ generateSEOJobUrl, cleanJobDataForSEO }) => {
        import('@/lib/url-utils').then(({ getAbsoluteUrl }) => {
          const cleanJob = cleanJobDataForSEO(
            job as unknown as Record<string, unknown>
          );
          const seoUrl = generateSEOJobUrl(cleanJob);
          setCanonicalUrl(getAbsoluteUrl(seoUrl));
        });
      });
    }
  }, [job, mounted]);

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const jobId = params.id as string;
      console.log('🔍 Fetching job with ID:', jobId);

      const response = await fetch(`/api/jobs/${jobId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          setError(errorData.details || 'Job not found');
        } else {
          setError('Failed to load job details');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // CRITICAL: Validate response structure before using
      if (data && data.success && data.data) {
        // Validate job data has required fields
        if (!data.data.id || !data.data.title) {
          console.error('❌ Invalid job data structure:', data.data);
          setError('Job data is incomplete. Please try again.');
          setLoading(false);
          return;
        }
        
        console.log('✅ Job data received:', data.data.title);
        setJob(data.data);
        
        // TRACK JOB VIEW: Track when authenticated user views a job
        if (session?.user?.id) {
          try {
            await fetch('/api/jobs/views', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ jobId: data.data.id || params.id }),
            });
            console.log('✅ Job view tracked for user');
          } catch (viewError) {
            console.error('⚠️ Failed to track job view:', viewError);
            // Don't break the page if tracking fails
          }
        }
      } else {
        // Handle API errors gracefully
        const errorMessage = data?.error || data?.details || 'Failed to load job details';
        console.error('❌ Job API error:', errorMessage, data);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [params.id, session?.user?.id]);

  // Fetch job details when params.id changes - MUST be before any returns
  useEffect(() => {
    if (params.id && mounted) {
      fetchJobDetails();
    }
  }, [params.id, mounted, fetchJobDetails]);

  const handleBookmark = async () => {
    if (!job) return;

    try {
      const response = await fetch('/api/jobs/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error('Error bookmarking job:', error);
    }
  };

    const handleExternalApply = async () => {
    if (!job) {
      console.error('❌ Job data not available for external apply');
      return;
    }

    // Use smart career page finder to bypass geo-blocking
    const { generateCompanyCareerSearchUrl } = await import('@/lib/company-career-finder');
    
    // Generate Google search for company career page
    const careerSearchUrl = generateCompanyCareerSearchUrl(
      job.company || 'Company',
      job.title,
      job.location || undefined
    );
    
    console.log('🌐 Opening smart career search:', careerSearchUrl);
    console.log('📊 Job details:', {
      id: job.id,
      title: job.title,
      company: job.company,
      source: job.source
    });
    
    // Open Google search for company career page (bypasses geo-restrictions)
    window.open(careerSearchUrl, '_blank', 'noopener,noreferrer');
    
    // Track the click for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'company_career_search', {
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        source: job.source,
        method: 'google_search'
      });
    }
  };

  const handleInternalApply = () => {
    const jobIdToUse = (job as any)?.sourceId || job?.id;
    router.push(`/jobs/${jobIdToUse}/apply`);
  };

  // Show loading only if not mounted (hydration) or actively loading
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !job) {
    // Extract job ID from params for display
    const jobIdDisplay = params.id ? String(params.id).substring(String(params.id).lastIndexOf('-') + 1) : 'unknown';
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Briefcase className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
              No job found with ID: {jobIdDisplay}
            </CardTitle>
            <p className="text-base text-red-600 font-medium">
              The job may have expired or been removed.
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-900 mb-2">Why am I seeing this?</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>The job posting may have expired or been filled</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>The employer may have removed the listing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>External job listings are refreshed regularly and may become unavailable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>The URL might be incorrect or outdated</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => {
                // RESTORE SEARCH STATE: Restore saved search params when going back
                if (typeof window !== 'undefined') {
                  const savedParams = sessionStorage.getItem('jobSearchParams');
                  if (savedParams) {
                    router.push(`/jobs?${savedParams}`);
                    return;
                  }
                }
                router.push('/jobs');
              }} 
              size="lg" 
              className="flex items-center gap-2"
            >
              <Search className="h-5 w-5" />
              Browse All Jobs
            </Button>
            <Button 
              onClick={() => {
                // RESTORE SEARCH STATE: Restore saved search params when going back
                if (typeof window !== 'undefined') {
                  const savedParams = sessionStorage.getItem('jobSearchParams');
                  if (savedParams) {
                    router.push(`/jobs?${savedParams}`);
                    return;
                  }
                }
                router.back();
              }} 
              variant="outline" 
              size="lg"
              className="flex items-center gap-2"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
              Go Back
            </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Try searching for similar jobs or browse by category to find opportunities
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced logic to determine if job is external
  const isExternalJob = job ? (job.isExternal || 
                       (job.source !== 'manual' && job.source !== 'sample') ||
                       !!(job.source_url || job.applyUrl)) : false;
  const skillsArray = job ? (Array.isArray(job.skills) ? job.skills : (job.skills ? [job.skills] : [])) : [];
  const detailContent = job
    ? buildJobDetailContent({
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        sector: job.sector,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        skills: skillsArray,
        isRemote: job.isRemote,
        isHybrid: job.isHybrid,
        companyRelation: job.companyRelation
          ? {
              name: job.companyRelation.name,
              industry: job.companyRelation.industry,
              location: job.companyRelation.location,
              website: job.companyRelation.website,
            }
          : null,
      })
    : null;

  return (
    <>
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Google-compliant JobPosting structured data - only render when job is loaded */}
      {job && <JobPostingSchema job={job} />}
      
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 max-w-full">
        {/* Back Button - Prominent and Visible */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => {
              // RESTORE NAVIGATION STATE: Go back to where user came from
              if (typeof window !== 'undefined') {
                const savedParams = sessionStorage.getItem('jobSearchParams');
                const sourcePage = sessionStorage.getItem('jobDetailsSource');
                
                // If we have saved search params, restore the jobs page with filters
                if (savedParams) {
                  router.push(`/jobs?${savedParams}`);
                  return;
                }
                
                // If we have a source page (dashboard, resume upload, etc.), go back there
                if (sourcePage && sourcePage !== '/jobs') {
                  router.push(sourcePage);
                  return;
                }
              }
              router.back();
            }}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back
          </Button>
        </div>
        
        {/* Breadcrumb */}
        <nav className="mb-6 w-full overflow-x-auto">
          <div className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
            <button onClick={() => router.push('/')} className="hover:text-blue-600 flex-shrink-0">
              Home
            </button>
            <span className="flex-shrink-0">/</span>
            <button 
              onClick={() => {
                // RESTORE NAVIGATION STATE: Go back to where user came from
                if (typeof window !== 'undefined') {
                  const savedParams = sessionStorage.getItem('jobSearchParams');
                  const sourcePage = sessionStorage.getItem('jobDetailsSource');
                  
                  // If we have saved search params, restore the jobs page with filters
                  if (savedParams) {
                    router.push(`/jobs?${savedParams}`);
                    return;
                  }
                  
                  // If we have a source page, go back there
                  if (sourcePage && sourcePage !== '/jobs') {
                    router.push(sourcePage);
                    return;
                  }
                }
                router.push('/jobs');
              }} 
              className="hover:text-blue-600 flex-shrink-0"
            >
              Jobs
            </button>
            <span className="flex-shrink-0">/</span>
            <span className="text-gray-900 truncate max-w-[200px] sm:max-w-md">{job.title}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full max-w-full">
          {/* Main Content */}
          <div className="lg:col-span-2 min-w-0 w-full max-w-full overflow-x-hidden">
            <Card className="mb-4 sm:mb-6 overflow-hidden w-full">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {job.source === 'dynamic' && (
                        <Badge className="bg-orange-100 text-orange-800">
                          ⚠️ Aggregated Listing
                        </Badge>
                      )}
                      {job.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {job.isUrgent && (
                        <Badge className="bg-red-100 text-red-800">
                          Urgent
                        </Badge>
                      )}
                      {job.isRemote && (
                        <Badge className="bg-green-100 text-green-800">
                          Remote
                        </Badge>
                      )}
                      {job.isHybrid && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Hybrid
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 break-words leading-tight">
                      {job.title}
                    </CardTitle>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 mb-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium truncate">{job.company}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleBookmark}
                    className={`p-2 rounded-full transition-colors ${
                      bookmarked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              
              <CardContent className="w-full max-w-full overflow-x-hidden">
                {/* Job Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 w-full">
                  {job.salaryMin || job.salaryMax || job.salary ? (
                    <div className="group relative flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl border-2 border-emerald-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden" style={{ contain: 'layout style paint' }}>
                      <div className="relative p-2 sm:p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl shadow-inner flex-shrink-0">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-1">Salary</p>
                        <p className="font-extrabold text-emerald-900 text-sm truncate">{formatJobSalary(job)}</p>
                      </div>
                    </div>
                  ) : null}
                  
                  {job.jobType && (
                    <div className="group relative flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden" style={{ contain: 'layout style paint' }}>
                      <div className="relative p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-inner flex-shrink-0">
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Type</p>
                        <p className="font-extrabold text-blue-900 text-sm sm:text-base uppercase tracking-wide truncate">{job.jobType.replace(/-/g, ' ')}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.experienceLevel && (
                    <div className="group relative flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50 rounded-2xl border-2 border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden" style={{ contain: 'layout style paint' }}>
                      <div className="relative p-2 sm:p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-inner flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-1">Experience</p>
                        <p className="font-extrabold text-purple-900 text-sm sm:text-base uppercase tracking-wide truncate">{job.experienceLevel}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.postedAt && (
                    <div className="group relative flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl border-2 border-orange-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden" style={{ contain: 'layout style paint' }}>
                      <div className="relative p-2 sm:p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl shadow-inner flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-1">Posted</p>
                        <p className="font-extrabold text-orange-900 text-sm truncate">{new Date(job.postedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {(skillsArray || []).length > 0 && (
                  <div className="mb-6 w-full overflow-x-hidden">
                    <h3 className="text-base sm:text-lg font-semibold mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsArray.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs sm:text-sm truncate max-w-full">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Description */}
                <div className="mb-6 w-full overflow-x-hidden">
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Job Description</h3>
                  <div className="prose prose-sm sm:prose max-w-full overflow-x-hidden">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed break-words">{job.description}</p>
                  </div>
                </div>

                {/* AdSense/SEO: Rich, trustworthy sections (derived from real job fields) */}
                {detailContent && (
                  <div className="space-y-6 w-full overflow-x-hidden">
                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <h3 className="text-base sm:text-lg font-semibold mb-2">About the company</h3>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{detailContent.aboutCompany}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Role overview</h3>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{detailContent.roleOverview}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Skills required (explained)</h3>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-base">
                        {detailContent.skillsExplained.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Career growth</h3>
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{detailContent.careerGrowth}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-200 bg-white">
                      <h3 className="text-base sm:text-lg font-semibold mb-2">Why this job could be a good fit</h3>
                      <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm sm:text-base">
                        {detailContent.whyThisJobIsGood.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-500 mt-3">
                        Note: Details above are based on the job’s posted fields (title, location, type, skills). Always confirm specifics with the employer.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4 w-full">
                  {/* Primary Action: Internal Application */}
                  <Button 
                    onClick={handleInternalApply}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Apply on NaukriMili (Recommended)</span>
                    <span className="sm:hidden truncate">Apply on NaukriMili ⭐</span>
                  </Button>
                  
                  {/* Secondary Action: External Job Link */}
                  {isExternalJob && job.source_url && (
                    <div className="space-y-3">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-3 bg-white text-gray-500">Or</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleExternalApply}
                        variant="outline"
                        className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Globe className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="hidden sm:inline truncate">Search Company Career Page</span>
                        <span className="sm:hidden truncate">Company Career Page</span>
                      </Button>
                      
                      <p className="text-xs text-center text-gray-500">
                        <ExternalLink className="w-3 h-3 inline mr-1" />
                        Opens Google search for {job.company}'s career page (bypasses geo-restrictions)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-x-hidden">
            {/* Job Stats - Enhanced and Responsive */}
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200 shadow-lg overflow-hidden w-full" style={{ contain: 'layout style paint' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  📊 Job Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 w-full overflow-x-hidden">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100 hover:bg-white/80 transition-colors w-full" style={{ contain: 'layout style paint' }}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    <span className="text-slate-700 font-medium text-xs sm:text-sm truncate">Views</span>
                  </div>
                  <span className="font-bold text-blue-700 text-sm sm:text-base flex-shrink-0 ml-2">{job.views || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-green-100 hover:bg-white/80 transition-colors w-full" style={{ contain: 'layout style paint' }}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    </div>
                    <span className="text-slate-700 font-medium text-xs sm:text-sm truncate">Applications</span>
                  </div>
                  <span className="font-bold text-green-700 text-sm sm:text-base flex-shrink-0 ml-2">{job.applicationsCount || 0}</span>
                </div>
                {job.sector && (
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100 hover:bg-white/80 transition-colors w-full" style={{ contain: 'layout style paint' }}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
                        <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                      </div>
                      <span className="text-slate-700 font-medium text-xs sm:text-sm truncate">Sector</span>
                    </div>
                    <span className="font-bold text-purple-700 text-xs sm:text-sm capitalize flex-shrink-0 ml-2 truncate max-w-[100px]">{job.sector}</span>
                  </div>
                )}
                {/* Additional dynamic metrics */}
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100 w-full" style={{ contain: 'layout style paint' }}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1.5 bg-yellow-100 rounded-lg flex-shrink-0">
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                    </div>
                    <span className="text-slate-700 font-medium text-xs sm:text-sm truncate">Engagement</span>
                  </div>
                  <span className="font-bold text-yellow-700 text-sm sm:text-base flex-shrink-0 ml-2">
                    {Math.round(((job.applicationsCount || 0) / Math.max(job.views || 1, 1)) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            {job.companyRelation && (
              <Card className="w-full overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg truncate">About Company</CardTitle>
                </CardHeader>
                <CardContent className="w-full overflow-x-hidden">
                  <div className="text-center">
                    {job.companyRelation.logo && (
                      <img 
                        src={job.companyRelation.logo} 
                        alt={job.companyRelation.name}
                        className="w-16 h-16 mx-auto mb-4 rounded-lg object-cover"
                      />
                    )}
                    <h4 className="font-semibold text-base sm:text-lg mb-2 truncate">{job.companyRelation.name}</h4>
                    <p className="text-gray-600 mb-2 text-sm truncate">{job.companyRelation.location}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{job.companyRelation.industry}</p>
                    {job.companyRelation.website && (
                      <a 
                        href={job.companyRelation.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm mt-2 inline-block truncate max-w-full"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share Job */}
            <Card className="w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg truncate">Share This Job</CardTitle>
              </CardHeader>
              <CardContent className="w-full overflow-x-hidden">
                <JobShare job={job} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

