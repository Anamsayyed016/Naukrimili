"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Clock, DollarSign, Heart, Bookmark, Star, Building2, Calendar, ArrowRight, Sparkles, Users, Eye, ExternalLink, Search } from "lucide-react";
import JobShare from "@/components/JobShare";
import { parseSEOJobUrl, cleanJobDataForSEO } from "@/lib/seo-url-utils";
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

export default function SEOJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false); // Prevent hydration mismatch

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
  }, [searchParams, mounted]);

  const fetchJobFromSEOUrl = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Parse the slug to extract job ID
      const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug;
      const jobId = parseSEOJobUrl(slug);

      if (!jobId) {
        setError('Invalid job URL');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching job with ID:', jobId);

      // Fetch job data using the extracted ID
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
      
      if (data.success && data.data) {
        setJob(data.data);
        
        // TRACK JOB VIEW: Track when authenticated user views a job
        if (session?.user?.id) {
          try {
            await fetch('/api/jobs/views', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ jobId: data.data.id || jobId }),
            });
            console.log('✅ Job view tracked for user');
          } catch (viewError) {
            console.error('⚠️ Failed to track job view:', viewError);
            // Don't break the page if tracking fails
          }
        }
        
        // Save the job ID for highlighting when returning
        if (typeof window !== 'undefined') {
          const jobIdToSave = String(data.data.id || jobId || '');
          if (jobIdToSave) {
            sessionStorage.setItem('lastViewedJobId', jobIdToSave);
          }
        }
        
        // Update page title and meta for SEO
        if (typeof window !== 'undefined') {
          document.title = `${data.data.title} at ${data.data.company} - NaukriMili`;
          
          // Update meta description
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', 
              `${data.data.title} at ${data.data.company} in ${data.data.location}. ${data.data.description.substring(0, 160)}...`
            );
          }
        }
      } else {
        // Handle API errors gracefully
        const errorMessage = data?.error || data?.details || 'Job data not available';
        console.error('❌ Job API error:', errorMessage, data);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [params.slug, session?.user?.id]);

  // Fetch job details when params.slug changes - MUST be before any returns
  useEffect(() => {
    if (params.slug && mounted) {
      fetchJobFromSEOUrl();
    }
  }, [params.slug, mounted, fetchJobFromSEOUrl]);

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

  const handleExternalApply = () => {
    if (job?.source_url) {
      window.open(job.source_url, '_blank', 'noopener,noreferrer');
    }
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Briefcase className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              {error || 'Job not found'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              The job you're looking for might have been removed or the URL might be incorrect.
            </p>
            <Button 
              onClick={() => {
                // RESTORE SEARCH STATE: Restore saved search params
                if (typeof window !== 'undefined') {
                  const savedParams = sessionStorage.getItem('jobSearchParams');
                  if (savedParams) {
                    router.push(`/jobs?${savedParams}`);
                    return;
                  }
                }
                router.push('/jobs');
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExternalJob = job.isExternal || job.source !== 'manual';
  const detailContent = job
    ? buildJobDetailContent({
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        sector: job.sector,
        jobType: job.jobType,
        experienceLevel: job.experienceLevel,
        skills: job.skills,
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
      {/* Google-compliant JobPosting structured data - only render when job is loaded */}
      {job && <JobPostingSchema job={job} />}
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
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
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={() => router.push('/')} className="hover:text-blue-600">
              Home
            </button>
            <span>/</span>
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
              className="hover:text-blue-600"
            >
              Jobs
            </button>
            <span>/</span>
            <span className="text-gray-900">{job.title}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {job.companyRelation?.logo ? (
                        <img
                          src={job.companyRelation.logo}
                          alt={job.company}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 break-words leading-tight">
                          {job.title}
                        </h1>
                        <p className="text-lg text-gray-700 font-medium">
                          {job.company || job.companyRelation?.name}
                        </p>
                      </div>
                    </div>

                    {/* Job Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      {job.experienceLevel && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.experienceLevel}</span>
                        </div>
                      )}
                      {(job.salaryMin || job.salaryMax || job.salary) && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatJobSalary(job)}</span>
                        </div>
                      )}
                      {job.postedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            Posted {new Date(job.postedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Job Tags */}
                    <div className="flex flex-wrap gap-2">
                      {job.jobType && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          {job.jobType}
                        </Badge>
                      )}
                      {job.sector && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {job.sector}
                        </Badge>
                      )}
                      {job.isRemote && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          Remote
                        </Badge>
                      )}
                      {job.isHybrid && (
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Hybrid
                        </Badge>
                      )}
                      {job.isUrgent && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Urgent
                        </Badge>
                      )}
                      {job.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBookmark}
                      className={`${bookmarked ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                      {bookmarked ? 'Saved' : 'Save'}
                    </Button>
                    <JobShare job={job} />
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Job Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {job.description}
                    </p>
                  </div>
                </div>

                {/* AdSense/SEO: Rich, trustworthy sections (derived from real job fields) */}
                {detailContent && (
                  <div className="space-y-6">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">About the company</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{detailContent.aboutCompany}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Role overview</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{detailContent.roleOverview}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills required (explained)</h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                        {detailContent.skillsExplained.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Career growth</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{detailContent.careerGrowth}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Why this job could be a good fit</h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                        {detailContent.whyThisJobIsGood.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-500 mt-3">
                        Note: Details above are based on the job’s posted fields. Always confirm specifics with the employer.
                      </p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {job.skills && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(job.skills) ? (
                        job.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary">{job.skills}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Company Information */}
                {job.companyRelation && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Company</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Industry:</strong> {job.companyRelation.industry}</p>
                      <p><strong>Location:</strong> {job.companyRelation.location}</p>
                      {job.companyRelation.website && (
                        <p>
                          <strong>Website:</strong>{' '}
                          <a
                            href={job.companyRelation.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {job.companyRelation.website}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isExternalJob ? (
                <div className="flex-1 space-y-4">
                  <Button 
                    onClick={handleExternalApply}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-8 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Apply on Company Website
                  </Button>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      This job is posted on {job.source === 'external' ? 'external platform' : job.source}
                    </p>
                    <p className="text-xs text-gray-500">
                      You'll be redirected to the company's official website
                    </p>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => router.push(`/jobs/${job.sourceId || job.id}/apply`)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Apply Now
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Views</span>
                  </div>
                  <span className="font-semibold">{job.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Applications</span>
                  </div>
                  <span className="font-semibold">{job.applicationsCount || 0}</span>
                </div>
                {job.postedAt && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Posted</span>
                    </div>
                    <span className="font-semibold">
                      {new Date(job.postedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Similar jobs will be shown here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
