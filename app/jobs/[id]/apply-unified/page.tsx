'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Globe,
  AlertCircle
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  salary: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  description: string;
  skills: string[];
  isRemote: boolean;
  isFeatured: boolean;
  source: string;
  source_url: string | null;
  isExternal?: boolean;
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

export default function UnifiedJobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { socket, isConnected } = useSocket();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  
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

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  // Socket notification handling
  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification: any) => {
        console.log('🔔 New notification received:', notification);
        setNotifications(prev => [notification, ...prev.slice(0, 4)]);
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

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJob(data.job);
        } else {
          setError(data.error || 'Failed to load job details');
        }
      } else {
        setError('Failed to fetch job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

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
            (job?.skills || []).some(required => 
              required.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(required.toLowerCase())
            )
          );
          setSkillsMatch(matchedSkills);
        } else {
          // Fallback to basic calculation
          calculateATSAndSkills(profile, job?.skills || []);
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
      const form = new FormData();
      form.append("jobId", jobId);
      form.append("fullName", formData.fullName);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("location", formData.location);
      form.append("coverLetter", formData.coverLetter);
      form.append("expectedSalary", formData.expectedSalary);
      form.append("availability", formData.availability);
      if (formData.resume) form.append("resume", formData.resume);
      
      const res = await fetch(`/api/applications`, { 
        method: "POST", 
        body: form 
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.error || "Failed to apply");
      
      setSubmitted(true);
      
      // Show success notification
      toast.success('Application Submitted!', {
        description: `Your application for ${job?.title} has been submitted successfully.`,
        duration: 5000,
      });
      
      setTimeout(() => router.push(`/jobs/${jobId}`), 2000);
      
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err?.message || "Failed to submit application");
      toast.error('Application Failed', {
        description: err?.message || "Failed to submit application",
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
  const isExternalJob = job?.source && job.source !== 'manual';

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Job Not Found</h2>
            <p className="text-red-600 mb-6">{error || 'The job you are looking for does not exist or may have been removed.'}</p>
            <div className="space-y-3">
              <Link
                href="/jobs"
                className="block w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to Jobs
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
            <p className="text-green-700 mb-6 text-lg">Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been submitted successfully.</p>
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
            <p className="text-sm text-gray-500 mt-4">You will be redirected to the job details page in a moment...</p>
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
            <Link href={`/jobs/${jobId}`} className="text-blue-600 hover:text-blue-700 transition-all duration-300 flex items-center gap-3 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl font-medium">
              <ArrowLeft className="h-5 w-5" />
              Back to Job
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Application Form */}
          <div className="lg:col-span-2">
            {/* Job Summary */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 -m-8 mb-8 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4">Apply for {job.title}</h1>
                    <p className="text-blue-100 text-lg">Join {job.company || 'this company'} and advance your career</p>
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
                    <p className="text-lg font-bold text-gray-900 truncate">{job.company || 'Company'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Location</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{job.location || 'Remote'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Job Type</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{job.jobType || 'Full-time'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Salary</p>
                    <p className="text-lg font-bold text-gray-900 truncate">{job.salary || 'Competitive'}</p>
                  </div>
                </div>
              </div>
              
              {job.skills && job.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {job.skills.slice(0, 6).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-bold px-4 py-2 rounded-xl border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 6 && (
                      <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl border border-gray-300">
                        +{job.skills.length - 6} more
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
                      disabled={!job.source_url}
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
                      Your resume matches {skillsMatch.length} of {job.skills?.length || 0} required skills
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
