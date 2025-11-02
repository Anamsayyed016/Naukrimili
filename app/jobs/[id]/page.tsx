'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Clock, DollarSign, Heart, Bookmark, Star, Building2, Calendar, ArrowRight, Sparkles, Users, Eye, ExternalLink, Search, Send, Globe } from "lucide-react";
import JobShare from "@/components/JobShare";
import JobPostingSchema from "@/components/seo/JobPostingSchema";
import { formatJobSalary } from "@/lib/currency-utils";

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
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchJobDetails();
    }
  }, [params.id]);

  const fetchJobDetails = async () => {
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
      
      if (data.success && data.data) {
        console.log('✅ Job data received:', data.data.title);
        setJob(data.data);
      } else {
        console.error('❌ Job API error:', data.error);
        setError(data.error || 'Failed to load job details');
      }
    } catch (_error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (_error) {
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
    router.push(`/jobs/${job?.id}/apply`);
  };

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
            <Button onClick={() => router.push('/jobs')}>
              <Search className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

    // Enhanced logic to determine if job is external
  const isExternalJob = job.isExternal || 
                       (job.source !== 'manual' && job.source !== 'sample') ||
                       !!(job.source_url || job.applyUrl);
  const skillsArray = Array.isArray(job.skills) ? job.skills : (job.skills ? [job.skills] : []);

  return (
    <>
      {/* Google-compliant JobPosting structured data */}
      <JobPostingSchema job={job} />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={() => router.push('/')} className="hover:text-blue-600">
              Home
            </button>
            <span>/</span>
            <button onClick={() => router.push('/jobs')} className="hover:text-blue-600">
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
                    <div className="flex items-center gap-2 mb-2">
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
                    
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {job.title}
                    </CardTitle>
                    
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{job.company}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
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
              
              <CardContent>
                {/* Job Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {job.salaryMin || job.salaryMax || job.salary ? (
                    <div className="group relative flex items-center gap-3 p-4 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl border-2 border-emerald-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden" style={{ willChange: 'transform', transform: 'translateZ(0)', contain: 'layout style' }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      <div className="relative p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl shadow-inner">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider mb-1">Salary</p>
                        <p className="font-extrabold text-emerald-900 text-sm">{formatJobSalary(job)}</p>
                      </div>
                    </div>
                  ) : null}
                  
                  {job.jobType && (
                    <div className="group relative flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 rounded-2xl border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden" style={{ willChange: 'transform', transform: 'translateZ(0)', contain: 'layout style' }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      <div className="relative p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-inner">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Type</p>
                        <p className="font-extrabold text-blue-900 text-base uppercase tracking-wide">{job.jobType.replace(/-/g, ' ')}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.experienceLevel && (
                    <div className="group relative flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50 rounded-2xl border-2 border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden" style={{ willChange: 'transform', transform: 'translateZ(0)', contain: 'layout style' }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      <div className="relative p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-inner">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mb-1">Experience</p>
                        <p className="font-extrabold text-purple-900 text-base uppercase tracking-wide">{job.experienceLevel}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.postedAt && (
                    <div className="group relative flex items-center gap-3 p-4 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl border-2 border-orange-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden" style={{ willChange: 'transform', transform: 'translateZ(0)', contain: 'layout style' }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                      <div className="relative p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl shadow-inner">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <p className="text-xs text-orange-600 font-semibold uppercase tracking-wider mb-1">Posted</p>
                        <p className="font-extrabold text-orange-900 text-sm">{new Date(job.postedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {(skillsArray || []).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsArray.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  {/* Primary Action: Internal Application */}
                  <Button 
                    onClick={handleInternalApply}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Apply on NaukriMili (Recommended)
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
                        className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 py-4 px-8 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Globe className="w-5 h-5" />
                        Search Company Career Page
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
          <div className="space-y-6">
            {/* Job Stats - Enhanced and Responsive */}
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200 shadow-lg" style={{ willChange: 'transform', transform: 'translateZ(0)', contain: 'layout style' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  📊 Job Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100 hover:bg-white/80 transition-all" style={{ contain: 'layout style' }}>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-slate-700 font-medium">Views</span>
                  </div>
                  <span className="font-bold text-blue-700 text-lg">{job.views || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-green-100 hover:bg-white/80 transition-all" style={{ contain: 'layout style' }}>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-slate-700 font-medium">Applications</span>
                  </div>
                  <span className="font-bold text-green-700 text-lg">{job.applicationsCount || 0}</span>
                </div>
                {job.sector && (
                  <div className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100 hover:bg-white/80 transition-all" style={{ contain: 'layout style' }}>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Building2 className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-slate-700 font-medium">Sector</span>
                    </div>
                    <span className="font-bold text-purple-700 text-sm capitalize">{job.sector}</span>
                  </div>
                )}
                {/* Additional dynamic metrics */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-100" style={{ contain: 'layout style' }}>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-100 rounded-lg">
                      <Sparkles className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-slate-700 font-medium">Engagement</span>
                  </div>
                  <span className="font-bold text-yellow-700 text-lg">
                    {Math.round(((job.applicationsCount || 0) / Math.max(job.views || 1, 1)) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}
            {job.companyRelation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {job.companyRelation.logo && (
                      <img 
                        src={job.companyRelation.logo} 
                        alt={job.companyRelation.name}
                        className="w-16 h-16 mx-auto mb-4 rounded-lg object-cover"
                      />
                    )}
                    <h4 className="font-semibold text-lg mb-2">{job.companyRelation.name}</h4>
                    <p className="text-gray-600 mb-2">{job.companyRelation.location}</p>
                    <p className="text-sm text-gray-500">{job.companyRelation.industry}</p>
                    {job.companyRelation.website && (
                      <a 
                        href={job.companyRelation.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share Job */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share This Job</CardTitle>
              </CardHeader>
              <CardContent>
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

