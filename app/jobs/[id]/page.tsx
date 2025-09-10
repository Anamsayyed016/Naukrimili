"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Clock, DollarSign, Heart, Bookmark, Star, Building2, Calendar, ArrowRight, Sparkles, Users, Eye, ExternalLink } from "lucide-react";
import JobShare from "@/components/JobShare";

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
  const id = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enhancedJobData, setEnhancedJobData] = useState<any>(null);
  const [enhancing, setEnhancing] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Invalid job ID');
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job');
        }

        const data = await response.json();
        if (data.success) {
          setJob(data.job);
          
          // Fetch AI-enhanced data for better job insights
          if (data.job && data.job.title) {
            fetchEnhancedJobData(data.job);
          }
        } else {
          setError(data.error || 'Failed to load job');
        }
      } catch (err) {
        setError('Failed to load job details');
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const fetchEnhancedJobData = async (jobData: Job) => {
    setEnhancing(true);
    try {
      const response = await fetch('/api/jobs/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: jobData.title,
          company: jobData.company,
          description: jobData.description,
          skills: Array.isArray(jobData.skills) ? jobData.skills : (jobData.skills ? [jobData.skills] : []),
          location: jobData.location,
          salary: jobData.salary,
          experienceLevel: jobData.experienceLevel,
          jobType: jobData.jobType,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setEnhancedJobData(data.data);
      } else {
        console.warn('Failed to fetch enhanced job data:', data.error);
      }
    } catch (err) {
      console.error('Error fetching enhanced job data:', err);
    } finally {
      setEnhancing(false);
    }
  };

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Job not found</h1>
            <p className="text-gray-600 mb-6">The job you are looking for does not exist or may have been removed.</p>
            <Link 
              href="/jobs" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Parse skills properly - handle both array and string formats
  const skills = Array.isArray(job.skills) ? job.skills : 
    (typeof job.skills === 'string' ? 
      (job.skills.startsWith('{') ? JSON.parse(job.skills) : job.skills.split(',').map(s => s.trim()).filter(Boolean)) : 
      []);

  // Format salary display
  const formatSalary = () => {
    if (job.salary) return job.salary;
    if (job.salaryMin && job.salaryMax) {
      return `${job.salaryCurrency || 'INR'} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) {
      return `${job.salaryCurrency || 'INR'} ${job.salaryMin.toLocaleString()}+`;
    }
    return null;
  };

  // Format experience level
  const formatExperienceLevel = () => {
    if (job.experienceLevel) return job.experienceLevel;
    return 'Not specified';
  };

  // Format job type
  const formatJobType = () => {
    if (job.jobType) return job.jobType;
    return 'Not specified';
  };

  // Format posted date
  const formatPostedDate = () => {
    if (job.postedAt) {
      return new Date(job.postedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    if (job.createdAt) {
      return new Date(job.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Recently posted';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Job Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header with Gradient Background */}
              <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 lg:p-12">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 text-white">
                      <div className="flex items-center gap-3 mb-6">
                        {job.isFeatured && (
                          <Badge className="bg-yellow-400 text-yellow-900 border-0 font-bold px-4 py-2 rounded-xl">
                            <Star className="w-4 h-4 mr-2" />
                            Featured
                          </Badge>
                        )}
                        {job.isUrgent && (
                          <Badge className="bg-red-400 text-red-900 border-0 font-bold px-4 py-2 rounded-xl">
                            <Clock className="w-4 h-4 mr-2" />
                            Urgent
                          </Badge>
                        )}
                        {job.isExternal && (
                          <Badge className="bg-blue-400 text-blue-900 border-0 font-bold px-4 py-2 rounded-xl">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            External
                          </Badge>
                        )}
                      </div>
                      
                      <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                        {job.title}
                      </h1>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Company</p>
                            <p className="text-xl font-bold">{job.company || 'Unknown Company'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-blue-100 text-sm font-medium">Location</p>
                            <p className="text-xl font-bold">{job.location || 'Remote'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white font-bold px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 rounded-xl transition-all duration-300 text-xs sm:text-sm md:text-base min-w-0 flex-1 xs:flex-none"
                      >
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">Save Job</span>
                        <span className="sm:hidden">Save</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white font-bold px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 rounded-xl transition-all duration-300 text-xs sm:text-sm md:text-base min-w-0 flex-1 xs:flex-none"
                      >
                        <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">Bookmark</span>
                        <span className="sm:hidden">Bookmark</span>
                      </Button>
                      <JobShare 
                        job={{
                          id: job.id,
                          title: job.title,
                          company: job.company,
                          location: job.location
                        }}
                        className="flex-1 xs:flex-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Job Type</p>
                    <p className="text-xl font-bold text-gray-900">{formatJobType()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Experience</p>
                    <p className="text-xl font-bold text-gray-900">{formatExperienceLevel()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Remote</p>
                    <p className="text-xl font-bold text-gray-900">
                      {job.isRemote ? 'Yes' : job.isHybrid ? 'Hybrid' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Views</p>
                    <p className="text-xl font-bold text-gray-900">{job.views || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Applications</p>
                    <p className="text-xl font-bold text-gray-900">{job.applications || job.applicationsCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Posted</p>
                    <p className="text-xl font-bold text-gray-900">{formatPostedDate()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Salary Section */}
          {formatSalary() && (
            <Card className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 border-0 shadow-2xl rounded-2xl p-8 mb-8 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Salary Range</p>
                    <p className="text-3xl font-bold text-green-800">{formatSalary()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <Card className="bg-white shadow-2xl rounded-2xl border-0 p-8 mb-8">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Required Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill, index) => (
                    <Badge 
                      key={index}
                      className="px-4 py-3 text-sm font-bold border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-800 hover:bg-purple-200 hover:border-purple-300 transition-all duration-300 rounded-xl"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Description */}
          <Card className="bg-white shadow-md rounded-lg p-6 mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </CardContent>
          </Card>

          {/* AI-Enhanced Insights Section */}
          {enhancing ? (
            <Card className="bg-white shadow-md rounded-lg p-6 mb-8">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ) : enhancedJobData && (
            <div className="space-y-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="text-purple-500" />
                AI-Powered Insights
              </h2>
              
              {enhancedJobData.keyResponsibilities && (
                <Card className="bg-white shadow-md rounded-lg p-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800">Key Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {enhancedJobData.keyResponsibilities.map((resp: string, i: number) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {enhancedJobData.requirements && (
                <Card className="bg-white shadow-md rounded-lg p-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800">Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {enhancedJobData.requirements.map((req: string, i: number) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {enhancedJobData.benefits && (
                <Card className="bg-white shadow-md rounded-lg p-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-800">Benefits & Perks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {enhancedJobData.benefits.map((benefit: string, i: number) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            {job.isExternal ? (
              <div className="flex-1 space-y-4">
                <Button 
                  onClick={() => {
                    if (job.source_url) {
                      window.open(job.source_url, '_blank', 'noopener,noreferrer');
                    }
                  }}
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
              <Link 
                href={`/jobs/${job.id}/apply`}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-center"
              >
                Apply Now
              </Link>
            )}
            
            <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4 flex-1 sm:flex-none">
              <JobShare 
                job={{
                  id: job.id,
                  title: job.title,
                  company: job.company,
                  location: job.location
                }}
                className="flex-1 xs:flex-none"
              />
              
              <Link 
                href="/jobs"
                className="flex-1 xs:flex-none border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 py-3 sm:py-4 px-4 sm:px-6 md:px-8 rounded-lg font-semibold text-sm sm:text-base md:text-lg transition-all duration-200 text-center flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Back to Jobs</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}