"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  MapPin, 
  Building2, 
  Clock, 
  DollarSign, 
  Users, 
  Eye, 
  Calendar,
  ExternalLink,
  Star,
  TrendingUp,
  Award,
  Briefcase,
  Globe,
  Heart,
  Share2,
  Bookmark,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  postedAt: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[];
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  sector: string | null;
  views: number;
  applications: number;
  createdAt: string;
  updatedAt: string;
  creator: any;
  source: string;
  source_url: string | null;
}

interface EnhancedJobData {
  keyResponsibilities: string[];
  requirements: string[];
  benefits: string[];
  companyCulture: string;
  growthOpportunities: string[];
  interviewProcess: string[];
  salaryInsights: string;
  marketTrends: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enhancedData, setEnhancedData] = useState<EnhancedJobData | null>(null);
  const [loadingEnhanced, setLoadingEnhanced] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
          // Fetch enhanced data using OpenAI
          fetchEnhancedJobData(data.job);
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
    setLoadingEnhanced(true);
    try {
      const response = await fetch('/api/jobs/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: jobData.title,
          company: jobData.company,
          description: jobData.description,
          skills: jobData.skills,
          location: jobData.location,
          salary: jobData.salary,
          experienceLevel: jobData.experienceLevel,
          jobType: jobData.jobType
        })
      });

      if (response.ok) {
        const enhanced = await response.json();
        setEnhancedData(enhanced.data);
      }
    } catch (error) {
      console.error('Failed to fetch enhanced job data:', error);
    } finally {
      setLoadingEnhanced(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSalaryRange = () => {
    if (job?.salary) return job.salary;
    if (job?.salaryMin && job?.salaryMax) {
      return `₹${(job.salaryMin / 100000).toFixed(1)}L - ₹${(job.salaryMax / 100000).toFixed(1)}L PA`;
    }
    return 'Salary not disclosed';
  };

  const getExperienceBadge = (level: string) => {
    const colors = {
      'Entry': 'bg-green-100 text-green-800',
      'Mid': 'bg-blue-100 text-blue-800',
      'Senior': 'bg-purple-100 text-purple-800',
      'Executive': 'bg-orange-100 text-orange-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getJobTypeBadge = (type: string) => {
    const colors = {
      'Full-time': 'bg-blue-100 text-blue-800',
      'Part-time': 'bg-green-100 text-green-800',
      'Contract': 'bg-yellow-100 text-yellow-800',
      'Internship': 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Enhanced loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              {/* Header skeleton */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-16 bg-gray-200 rounded-lg mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
              
              {/* Content skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-2xl shadow-xl p-6">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-6">
                  {[1,2].map(i => (
                    <div key={i} className="bg-white rounded-2xl shadow-xl p-6">
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
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
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-gray-900">Job not found</h1>
            <p className="text-gray-600 mb-6">The job you are looking for does not exist or may have been removed.</p>
            <Link 
              href="/jobs" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/jobs" className="hover:text-blue-600 transition-colors">Jobs</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Job Details</span>
            </div>
          </nav>

          {/* Main Job Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {job.isFeatured && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </span>
                  )}
                  {job.isUrgent && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Urgent
                    </span>
                  )}
                  {job.isRemote && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Globe className="w-3 h-3 mr-1" />
                      Remote
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {job.title}
                </h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <Building2 className="w-5 h-5 mr-2" />
                    <span className="font-medium text-lg">{job.company || 'Unknown Company'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{job.location || 'Remote'}</span>
                  </div>
                </div>

                {/* Key Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Salary</span>
                    </div>
                    <p className="text-lg font-bold text-green-900">{getSalaryRange()}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">Type</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">{job.jobType || 'Not specified'}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Award className="w-5 h-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-800">Experience</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900">{job.experienceLevel || 'Not specified'}</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center mb-2">
                      <Eye className="w-5 h-5 text-orange-600 mr-2" />
                      <span className="text-sm font-medium text-orange-800">Views</span>
                    </div>
                    <p className="text-lg font-bold text-orange-900">{job.views}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:min-w-[280px]">
                {job.source !== 'manual' ? (
                  <button 
                    onClick={() => {
                      if (job.source_url) {
                        window.open(job.source_url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Apply on Company Website
                  </button>
                ) : (
                  <Link 
                    href={`/jobs/${job.id}/apply`}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    Apply Now
                  </Link>
                )}
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      isBookmarked 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    {isBookmarked ? 'Saved' : 'Save'}
                  </button>
                  <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Description */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Info className="w-6 h-6 mr-3 text-blue-600" />
                  Job Description
                </h2>
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: job.description }} />
              </div>

              {/* Enhanced Content from OpenAI */}
              {loadingEnhanced && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Enhancing job details with AI...</span>
                  </div>
                </div>
              )}

              {enhancedData && (
                <>
                  {/* Key Responsibilities */}
                  {enhancedData.keyResponsibilities && enhancedData.keyResponsibilities.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Target className="w-6 h-6 mr-3 text-green-600" />
                        Key Responsibilities
                      </h2>
                      <ul className="space-y-3">
                        {enhancedData.keyResponsibilities.map((responsibility, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Requirements */}
                  {enhancedData.requirements && enhancedData.requirements.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Award className="w-6 h-6 mr-3 text-purple-600" />
                        Requirements
                      </h2>
                      <ul className="space-y-3">
                        {enhancedData.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Benefits */}
                  {enhancedData.benefits && enhancedData.benefits.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <Star className="w-6 h-6 mr-3 text-yellow-600" />
                        Benefits & Perks
                      </h2>
                      <ul className="space-y-3">
                        {enhancedData.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Sparkles className="w-6 h-6 mr-3 text-indigo-600" />
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm font-medium rounded-full border border-indigo-200 hover:from-indigo-200 hover:to-purple-200 transition-all duration-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Company Info */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Company Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{job.location}</span>
                  </div>
                  {job.sector && (
                    <div className="flex items-center text-gray-600">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span>{job.sector}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Stats */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Job Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Views</span>
                    <span className="font-semibold text-gray-900">{job.views}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Applications</span>
                    <span className="font-semibold text-gray-900">{job.applications}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Posted</span>
                    <span className="font-semibold text-gray-900">{formatDate(job.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Market Insights */}
              {enhancedData?.salaryInsights && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-6 border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                    Market Insights
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{enhancedData.salaryInsights}</p>
                </div>
              )}

              {/* Back to Jobs */}
              <Link 
                href="/jobs"
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 text-center font-medium flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}