'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  Building, 
  Clock, 
  DollarSign,
  Upload,
  Send,
  CheckCircle,
  Loader2,
  Star,
  FileText,
  User,
  Mail,
  Phone,
  ExternalLink,
  AlertCircle,
  Globe,
  Heart,
  Bookmark,
  Users,
  Eye,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import { parseSEOJobUrl } from '@/lib/seo-url-utils';
import { normalizeJobData, validateJobData } from '@/lib/job-data-normalizer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  salary_formatted?: string;
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

interface ResumeProfile {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  skills: string[];
  education: string[];
  experience: string[];
}

interface JobApplicationForm {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  coverLetter: string;
  expectedSalary: string;
  availability: string;
  resume: File | null;
  resumeProfile: ResumeProfile | null;
}

export default function JobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const rawId = params.id as string;
  
  // Parse job ID from SEO URL if needed
  const jobId = parseSEOJobUrl(rawId) || rawId;
  // const { socket, isConnected, notifications } = useSocket();
  const socket = null;
  const isConnected = false;
  const notifications = [];
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedJobData, setEnhancedJobData] = useState<any>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<any[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
    }
  }, [status, router]);

  // Fetch job details function - memoized to prevent infinite re-renders
  const fetchJobDetails = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Apply page - Raw ID:', rawId);
      console.log('🔍 Apply page - Parsed Job ID:', jobId);
      
      // Check if this is a sample job
      if (jobId.startsWith('sample-')) {
        console.log('❌ Sample job detected - redirecting to jobs page');
        setError('This is a sample job and cannot be applied to. Please search for real jobs.');
        setLoading(false);
        return;
      }
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/jobs/${jobId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 API Response:', data);
        if (data.success && data.data) {
          // Normalize and validate job data
          const normalizedJob = normalizeJobData(data.data);
          
          if (validateJobData(normalizedJob)) {
            console.log('✅ Setting normalized job data:', normalizedJob);
            setJob(normalizedJob as any);
            setError(null); // Clear any previous errors
            
            // Fetch AI-enhanced data for better job insights
            if (normalizedJob && normalizedJob.title) {
              fetchEnhancedJobData(normalizedJob as any);
            }
          } else {
            console.log('❌ Invalid job data after normalization:', normalizedJob);
            setError('Invalid job data received');
          }
        } else {
          console.log('❌ API returned error:', data.error);
          setError(data.error || 'Failed to load job details');
        }
      } else {
        setError(`HTTP ${response.status}: Failed to fetch job details`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(error?.message || 'Failed to load job details');
      }
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId, rawId]);

  const fetchEnhancedJobData = React.useCallback(async (jobData: Job) => {
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
  }, []);

  // Parse skills properly - handle both array and string formats with better error handling
  const skills = React.useMemo(() => {
    try {
      if (!job?.skills) return [];
      if (Array.isArray(job.skills)) return job.skills;
      if (typeof job.skills === 'string') {
        // Try to parse as JSON first
        if (typeof job.skills === 'string' && (job.skills.startsWith('{') || job.skills.startsWith('['))) {
          const parsed = JSON.parse(job.skills);
          return Array.isArray(parsed) ? parsed : [];
        }
        // Otherwise split by comma
        return job.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      return [];
    } catch (error) {
      console.warn('Failed to parse skills:', error);
      return [];
    }
  }, [job?.skills]);

  // Format salary display with better error handling
  const formatSalary = () => {
    try {
      if (!job) return null;
      if (job.salary) return job.salary;
      if (job.salary_formatted) return job.salary_formatted;
      if (job.salaryMin && job.salaryMax) {
        const currency = job.salaryCurrency || '₹';
        return `${currency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`;
      }
      if (job.salaryMin) {
        const currency = job.salaryCurrency || '₹';
        return `${currency} ${job.salaryMin.toLocaleString()}+`;
      }
      return null;
    } catch (error) {
      console.warn('Error formatting salary:', error);
      return null;
    }
  };

  // Format experience level with error handling
  const formatExperienceLevel = () => {
    try {
      if (!job) return 'Not specified';
      return job.experienceLevel || 'Not specified';
    } catch (error) {
      console.warn('Error formatting experience level:', error);
      return 'Not specified';
    }
  };

  // Format job type with error handling
  const formatJobType = () => {
    try {
      if (!job) return 'Not specified';
      return job.jobType || 'Not specified';
    } catch (error) {
      console.warn('Error formatting job type:', error);
      return 'Not specified';
    }
  };

  // Format posted date with error handling
  const formatPostedDate = () => {
    try {
      if (!job) return 'Recently posted';
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
    } catch (error) {
      console.warn('Error formatting posted date:', error);
      return 'Recently posted';
    }
  };

  
  // Enhanced form state
  const [formData, setFormData] = useState<JobApplicationForm>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    coverLetter: '',
    expectedSalary: '',
    availability: 'Immediate',
    resume: null,
    resumeProfile: null
  });

  // Resume analysis state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [skillsMatch, setSkillsMatch] = useState<string[]>([]);

  // Direct job fetching on component mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 Component rendering - rawId:', rawId);
      console.log('🔍 Component rendering - jobId:', jobId);
      console.log('🔍 Client-side useEffect triggered - jobId:', jobId);
      if (jobId) {
        console.log('🔍 About to call fetchJobDetails');
        fetchJobDetails();
      } else {
        console.log('❌ No jobId, setting error');
        setError('No job ID provided');
        setLoading(false);
      }
    }
  }, [jobId, rawId]); // Removed fetchJobDetails to prevent infinite loop

  // Add a timeout fallback to prevent infinite loading
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timeout = setTimeout(() => {
        if (loading && !job) {
          console.log('⏰ Timeout reached, setting error');
          setError('Request timed out. Please try again.');
          setLoading(false);
        }
      }, 15000); // 15 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, job]);

  // Socket notification handling
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification: any) => {
        console.log('🔔 New notification received:', notification);
        toast.success(notification.title, {
          description: notification.message,
          duration: 5000,
        });
      };

      socket.on('new_notification', handleNewNotification);
      
      return () => {
        socket.off('new_notification', handleNewNotification);
      };
    }
  }, [socket]);


  const handleInputChange = (field: keyof JobApplicationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleResumeChange = async (file: File | null) => {
    setFormData(prev => ({ ...prev, resume: file }));
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload and analyze resume
      const formData = new FormData();
      formData.append('resume', file);
      
      const res = await fetch('/api/resumes/autofill', { 
        method: 'POST', 
        body: formData 
      });
      
      const data = await res.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.ok && data?.success && data?.profile) {
        const profile = data.profile;
        const analysis = data.analysis;
        
        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          fullName: profile.fullName || prev.fullName,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          location: profile.location || prev.location,
          resumeProfile: profile
        }));

        // Use enhanced AI analysis for ATS score and skills match
        if (analysis) {
          setAtsScore(analysis.atsScore);
          
          // Calculate skills match using enhanced analysis
          const matchedSkills = profile.skills.filter(skill => 
            skills.some(required => 
              required.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(required.toLowerCase())
            )
          );
          setSkillsMatch(matchedSkills);
        } else {
          // Fallback to basic calculation
          calculateATSAndSkills(profile, skills);
        }
        
        // Show success message
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 1000);

      } else {
        throw new Error(data?.error || 'Failed to analyze resume');
      }

    } catch (err: any) {
      console.error('Resume analysis failed:', err);
      setUploadProgress(0);
      setIsUploading(false);
      // Continue without auto-fill - user can fill manually
    }
  };

  const calculateATSAndSkills = (profile: ResumeProfile, requiredSkills: string[]) => {
    // Calculate ATS score based on completeness
    let score = 0;
    if (profile.fullName) score += 20;
    if (profile.email) score += 20;
    if (profile.phone) score += 15;
    if (profile.location) score += 15;
    if (profile.skills.length > 0) score += 20;
    if (profile.education.length > 0) score += 10;
    
    setAtsScore(score);

    // Calculate skills match
    const matchedSkills = profile.skills.filter(skill => 
      requiredSkills.some(required => 
        required.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(required.toLowerCase())
      )
    );
    setSkillsMatch(matchedSkills);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!formData.fullName.trim()) {
        throw new Error('Full name is required');
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!jobId) {
        throw new Error('Job ID is missing');
      }

      console.log('🚀 Submitting application for job:', jobId);

      const form = new FormData();
      form.append("jobId", jobId);
      form.append("fullName", formData.fullName.trim());
      form.append("email", formData.email.trim());
      form.append("phone", formData.phone.trim());
      form.append("location", formData.location.trim());
      form.append("coverLetter", formData.coverLetter.trim());
      form.append("expectedSalary", formData.expectedSalary.trim());
      form.append("availability", formData.availability.trim());
      if (formData.resume) form.append("resume", formData.resume);
      
      const res = await fetch(`/api/applications`, { 
        method: "POST", 
        body: form 
      });
      
      const data = await res.json();
      
      console.log('📡 Application response:', { status: res.status, data });
      
      if (!res.ok) {
        console.error('❌ Application failed:', data);
        throw new Error(data?.error || data?.details || "Failed to apply");
      }
      
      setSubmitted(true);
      
      // Show success notification
      toast.success('🎉 Application Submitted!', {
        description: `Your application for ${job?.title} has been submitted successfully. You'll hear back from the employer soon!`,
        duration: 5000,
      });
      
      // Redirect to jobs listing instead of job details to avoid potential errors
      setTimeout(() => router.push('/jobs'), 2000);
      
    } catch (err: any) {
      console.error('Error submitting application:', err);
      
      // Handle specific error types
      let errorMessage = err?.message || "Failed to submit application";
      
      if (err?.message?.includes('Authentication required')) {
        errorMessage = "Please log in to submit your application";
        // Redirect to login
        setTimeout(() => {
          router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
        }, 2000);
      } else if (err?.message?.includes('Job not found')) {
        errorMessage = "This job is no longer available";
      } else if (err?.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      }
      
      setError(errorMessage);
      toast.error('Application Failed', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExternalApply = () => {
    if (job?.source_url) {
      window.open(job.source_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Check if this is an external job
  const isExternalJob = job?.isExternal || job?.source !== 'manual';

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
            <p className="text-gray-600">You need to be logged in to apply for this job.</p>
          </div>
          <div className="space-y-3">
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Sign In to Apply
            </Link>
            <Link
              href="/jobs"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors inline-block"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading job details...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch the job information</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    console.log('🚨 Showing error page - Error:', error, 'Job:', job);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">
              {error?.includes('sample job') ? 'Sample Job' : 'Job Not Found'}
            </h2>
            <p className="text-red-600 mb-6">
              {error || 'The job you are looking for does not exist or may have been removed.'}
            </p>
            <div className="space-y-3">
              <Link
                href="/jobs"
                className="block w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {error?.includes('sample job') ? 'Browse Real Jobs' : 'Back to Jobs'}
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="block w-full border border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="bg-white border border-green-200 rounded-2xl p-8 shadow-xl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-green-800 mb-3">Application Submitted!</h2>
            <p className="text-green-700 mb-6 text-lg">
              Your application has been submitted successfully.
            </p>
            <div className="space-y-3">
              <Link
                href="/jobs"
                className="block w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Browse More Jobs
              </Link>
              <Link
                href="/dashboard"
                className="block w-full border border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">You will be redirected to the jobs page in a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  // Safety check to prevent errors
  if (!job && !loading && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading job details...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch the job information</p>
        </div>
      </div>
    );
  }

  // Additional safety check for job data integrity
  if (job && (!job.title || !job.company)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-xl">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-red-800 mb-3">Invalid Job Data</h2>
            <p className="text-red-700 mb-6 text-lg">
              The job information appears to be incomplete or corrupted. Please try again.
            </p>
            <div className="space-y-3">
              <Link
                href="/jobs"
                className="block w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Browse Other Jobs
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="block w-full border border-red-600 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/jobs" className="text-blue-600 hover:text-blue-700 transition-all duration-300 flex items-center gap-3 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl font-medium">
              <ArrowLeft className="h-5 w-5" />
              Back to Jobs
            </Link>
            <nav className="text-sm text-gray-600 flex items-center gap-2">
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <span className="text-gray-400">/</span>
              <Link href="/jobs" className="hover:text-blue-600 transition-colors">Jobs</Link>
              <span className="text-gray-400">/</span>
              <span className="text-blue-600 font-bold">Apply</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      {job?.isFeatured && (
                        <Badge className="bg-yellow-400 text-yellow-900 border-0 font-bold px-4 py-2 rounded-xl">
                          <Star className="w-4 h-4 mr-2" />
                          Featured
                        </Badge>
                      )}
                      {job?.isUrgent && (
                        <Badge className="bg-red-400 text-red-900 border-0 font-bold px-4 py-2 rounded-xl">
                          <Clock className="w-4 h-4 mr-2" />
                          Urgent
                        </Badge>
                      )}
                      {job?.isExternal && (
                        <Badge className="bg-blue-400 text-blue-900 border-0 font-bold px-4 py-2 rounded-xl">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          External
                        </Badge>
                      )}
                    </div>
                    
                    <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                      {job?.title || 'Job Title'}
                    </h1>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Company</p>
                          <p className="text-xl font-bold">{job?.company || 'Unknown Company'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Location</p>
                          <p className="text-xl font-bold">{job?.location || 'Remote'}</p>
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
                        id: job?.id || '',
                        title: job?.title || '',
                        company: job?.company || '',
                        location: job?.location || ''
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
                    {job?.isRemote ? 'Yes' : job?.isHybrid ? 'Hybrid' : 'No'}
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
                  <p className="text-xl font-bold text-gray-900">{job?.views || 0}</p>
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
                  <p className="text-xl font-bold text-gray-900">{job?.applications || job?.applicationsCount || 0}</p>
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
              dangerouslySetInnerHTML={{ __html: job?.description || 'No description available' }}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Application Form */}
          <div className="lg:col-span-2">
            {/* Job Summary */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 -m-8 mb-8 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">Apply for {job?.title || 'this position'}</h1>
                    <p className="text-blue-100 text-lg">Join {job?.company || 'this company'} and advance your career</p>
                  </div>
                  {isExternalJob && (
                    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg text-sm font-bold">
                      External Job
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Company</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{job?.company || 'Company'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{job?.location || 'Remote'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Job Type</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{job?.jobType || 'Full-time'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Salary</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{job?.salary || 'Competitive'}</p>
                  </div>
                </div>
              </div>
              
              {skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {skills.slice(0, 6).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-bold px-4 py-2 rounded-xl border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 6 && (
                      <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl border border-gray-300">
                        +{skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* External Job Notice */}
            {isExternalJob && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <ExternalLink className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-900 mb-2">External Job Application</h3>
                    <p className="text-yellow-700 mb-4">
                      This job is posted on an external platform. You will apply directly on the company's website.
                    </p>
                    <button
                      onClick={handleExternalApply}
                      disabled={!job?.source_url}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Apply on Company Site
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Application Form - Only show for internal jobs */}
            {!isExternalJob && (
              <div className="bg-white rounded-3xl shadow-2xl p-8 border-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Application Form
                </h2>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange('fullName')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="Enter your full name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange('email')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="Enter your email"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={handleInputChange('phone')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          id="location"
                          value={formData.location}
                          onChange={handleInputChange('location')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="Enter your location"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Resume Upload
                    </h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleResumeChange(e.target.files?.[0] || null)}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        {isUploading ? (
                          <div className="space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                            <p className="text-sm text-gray-600">Analyzing resume...</p>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        ) : formData.resume ? (
                          <div className="space-y-2">
                            <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                            <p className="font-medium">{formData.resume.name}</p>
                            <p className="text-sm text-gray-600">Click to change</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                            <p className="font-medium">Upload your resume</p>
                            <p className="text-sm text-gray-600">PDF, DOC, or DOCX (Max 10MB)</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Additional Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expectedSalary" className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Salary
                        </label>
                        <input
                          type="text"
                          id="expectedSalary"
                          value={formData.expectedSalary}
                          onChange={handleInputChange('expectedSalary')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="e.g., ₹10 LPA"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                          Availability
                        </label>
                        <select
                          id="availability"
                          value={formData.availability}
                          onChange={handleInputChange('availability')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                        >
                          <option value="Immediate">Immediate</option>
                          <option value="2 weeks">2 weeks</option>
                          <option value="1 month">1 month</option>
                          <option value="2 months">2 months</option>
                          <option value="3 months">3 months</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Letter
                      </label>
                      <textarea
                        id="coverLetter"
                        rows={4}
                        value={formData.coverLetter}
                        onChange={handleInputChange('coverLetter')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                        placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-6 w-6" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Resume Analysis Sidebar - Only show for internal jobs */}
          {!isExternalJob && (
            <div className="space-y-6">
              {/* Socket Connection Status */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 border-0">
                <h3 className="text-xl font-bold flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  Real-time Status
                </h3>
                <p className="text-sm text-gray-600">
                  {isConnected ? 'Connected to notifications' : 'Disconnected from notifications'}
                </p>
                {notifications.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent Notifications:</p>
                    <div className="space-y-2">
                      {notifications.slice(0, 3).map((notification, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-lg text-sm">
                          <p className="font-medium text-blue-900">{notification.title}</p>
                          <p className="text-blue-700">{notification.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ATS Score */}
              {atsScore !== null && (
                <div className="bg-white rounded-2xl shadow-2xl p-6 border-0">
                  <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    ATS Score
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-4">
                      {atsScore}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-500 ${
                          atsScore >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                          atsScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${atsScore}%` }}
                      ></div>
                    </div>
                    <p className={`text-lg font-bold ${
                      atsScore >= 80 ? 'text-green-600' : 
                      atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {atsScore >= 80 ? 'Excellent' : 
                       atsScore >= 60 ? 'Good' : 'Needs improvement'}
                    </p>
                  </div>
                </div>
              )}

              {/* Skills Match */}
              {skillsMatch.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Skills Match
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-3">
                      Your resume matches {skillsMatch.length} of {skills.length} required skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skillsMatch.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Profile Preview */}
              {formData.resumeProfile && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5" />
                    Resume Summary
                  </h3>
                  <div className="space-y-3">
                    {formData.resumeProfile.skills.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Skills</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.resumeProfile.skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formData.resumeProfile.experience.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Experience</label>
                        <p className="text-sm text-gray-600 mt-1">
                          {formData.resumeProfile.experience.length} positions found
                        </p>
                      </div>
                    )}
                    
                    {formData.resumeProfile.education.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Education</label>
                        <p className="text-sm text-gray-600 mt-1">
                          {formData.resumeProfile.education.length} degrees found
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}