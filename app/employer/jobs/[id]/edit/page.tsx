"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar,
  Save,
  ArrowLeft,
  X,
  Brain,
  CheckCircle,
  ArrowRight,
  Target,
  Users,
  FileText,
  Zap,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { motion, AnimatePresence } from "framer-motion";
import { Z_INDEX } from "@/lib/utils";
import { useResponsive } from "@/components/ui/use-mobile";

interface JobFormData {
  title: string;
  location: string;
  country: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  description: string;
  requirements: string;
  benefits: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  sector: string;
  skills: string[];
  applicationDeadline: string;
}

interface DynamicOptions {
  jobTypes: Array<{ value: string; label: string; count: number }>;
  experienceLevels: Array<{ value: string; label: string; count: number }>;
  sectors: Array<{ value: string; label: string; count: number }>;
  skills: Array<{ value: string; label: string; count: number }>;
  locations: Array<{ value: string; label: string; count: number }>;
}

interface AISuggestions {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  skills: string;
}

export default function EditJobPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const urlParams = useParams();
  const { isMobile, isTablet } = useResponsive();
  // Handle both Promise and direct params for Next.js 15 compatibility
  const resolvedId = params instanceof Promise ? null : (params as { id: string }).id;
  const jobId = resolvedId || (urlParams?.id as string) || '';
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOptions | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions>({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    skills: ''
  });
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    location: '',
    country: 'IN',
    jobType: '',
    experienceLevel: '',
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: '',
    skills: [],
    applicationDeadline: ''
  });

  const [skillsInput, setSkillsInput] = useState('');

  // Enhanced progress steps
  const steps = [
    { id: 1, title: 'Basic Info', description: 'Job Details', icon: Briefcase },
    { id: 2, title: 'Description', description: 'Requirements', icon: FileText },
    { id: 3, title: 'Settings', description: 'Preferences', icon: Target }
  ];

  useEffect(() => {
    if (jobId) {
      fetchJob();
      fetchDynamicOptions();
    }
  }, [jobId]);

  const fetchJob = async () => {
    if (!jobId) return;
    
    try {
      setFetching(true);
      const response = await fetch(`/api/employer/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }

      const data = await response.json();
      if (data.success) {
        const job = data.data;
        
        // Parse requirements and benefits if they're JSON strings
        let requirements = '';
        let benefits = '';
        
        if (job.requirements) {
          try {
            const parsed = typeof job.requirements === 'string' ? JSON.parse(job.requirements) : job.requirements;
            requirements = Array.isArray(parsed) ? (parsed[0] || '') : (parsed || '');
          } catch {
            requirements = typeof job.requirements === 'string' ? job.requirements : '';
          }
        }
        
        if (job.benefits) {
          try {
            const parsed = typeof job.benefits === 'string' ? JSON.parse(job.benefits) : job.benefits;
            benefits = Array.isArray(parsed) ? (parsed[0] || '') : (parsed || '');
          } catch {
            benefits = typeof job.benefits === 'string' ? job.benefits : '';
          }
        }
        
        // Parse skills
        let skills: string[] = [];
        if (job.skills) {
          try {
            const parsed = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
            skills = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? parsed.split(',').map(s => s.trim()).filter(s => s) : []);
          } catch {
            skills = typeof job.skills === 'string' ? job.skills.split(',').map(s => s.trim()).filter(s => s) : [];
          }
        }
        
        setFormData({
          title: job.title || '',
          location: job.location || '',
          country: job.country || 'IN',
          jobType: job.jobType || '',
          experienceLevel: job.experienceLevel || '',
          salary: job.salary || '',
          description: job.description || '',
          requirements: requirements,
          benefits: benefits,
          isRemote: job.isRemote || false,
          isHybrid: job.isHybrid || false,
          isUrgent: job.isUrgent || false,
          isFeatured: job.isFeatured || false,
          sector: job.sector || '',
          skills: skills,
          applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to fetch job details', {
        description: 'Please try refreshing the page or contact support if the issue persists.',
        duration: 5000,
      });
    } finally {
      setFetching(false);
    }
  };

  const fetchDynamicOptions = async () => {
    try {
      const response = await fetch('/api/jobs/constants');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDynamicOptions(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching dynamic options:', error);
    }
  };

  // AI-powered suggestions
  const getAISuggestions = useCallback(async (field: string, value: string) => {
    if (!value.trim() || value.length < 2) {
      toast.error('Please enter some text first before requesting AI suggestions');
      return;
    }

    setAiLoading(true);
    setActiveField(field);

    try {
      const response = await fetch('/api/ai/job-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: field === 'title' ? 'jobTitle' : field,
          field,
          value,
          context: {
            jobType: formData.jobType,
            experienceLevel: formData.experienceLevel,
            industry: formData.sector
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions?.length > 0) {
          const suggestion = data.suggestions[0];
          setAiSuggestions(prev => ({ ...prev, [field]: suggestion }));
          toast.success('AI suggestion generated!', {
            description: 'Click the suggestion box to apply it.',
            duration: 3000
          });
        } else {
          toast.error('No suggestions available');
        }
      } else {
        throw new Error('Failed to get AI suggestions');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast.error('Failed to get AI suggestions', {
        description: 'Please try again or continue with manual input.',
        duration: 3000
      });
    } finally {
      setAiLoading(false);
      setActiveField(null);
    }
  }, [formData.jobType, formData.experienceLevel, formData.sector]);

  const applyAISuggestion = (field: keyof AISuggestions) => {
    const suggestion = aiSuggestions[field];
    if (suggestion) {
      setFormData(prev => ({ ...prev, [field]: suggestion }));
      setAiSuggestions(prev => ({ ...prev, [field]: '' }));
      toast.success('AI suggestion applied!');
    }
  };

  const requestAISuggestions = (field: string) => {
    const fieldValue = formData[field as keyof JobFormData];
    if (typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
      getAISuggestions(field, fieldValue);
    } else {
      toast.error('Please enter some text first before requesting AI suggestions');
    }
  };

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    if (value.endsWith(',')) {
      const skill = value.slice(0, -1).trim();
      if (skill && !formData.skills.includes(skill)) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        setSkillsInput('');
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(skill => skill !== skillToRemove) 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Enhanced validation
    if (!formData.title.trim()) {
      toast.error('Job title is required', {
        description: 'Please enter a job title to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Job description is required', {
        description: 'Please enter a job description to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Job location is required', {
        description: 'Please enter a job location to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.jobType) {
      toast.error('Please select a job type', {
        description: 'Job type is required to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.experienceLevel) {
      toast.error('Please select experience level', {
        description: 'Experience level is required to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.sector) {
      toast.error('Please select a sector', {
        description: 'Sector is required to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (formData.skills.length === 0) {
      toast.error('Please add at least one required skill', {
        description: 'Skills are required to help candidates understand the job requirements.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!jobId) {
      toast.error('Job ID is missing');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Job updated successfully!', {
          description: 'Your job posting has been updated and is now live.',
          duration: 5000,
        });
        router.push('/employer/jobs');
      } else {
        throw new Error(result.error || 'Failed to update job');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!jobId) {
      toast.error('Job ID is missing');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Job deleted successfully!', {
          description: 'Your job posting has been removed.',
          duration: 5000,
        });
        router.push('/employer/jobs');
      } else {
        throw new Error(result.error || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      });
    } finally {
      setDeleting(false);
    }
  };

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Enhanced validation for each step
  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.location.trim() && formData.jobType && formData.experienceLevel && formData.sector;
      case 2:
        return formData.description.trim();
      case 3:
        return true; // Settings are optional
      default:
        return false;
    }
  };

  const getStepProgress = () => {
    const totalFields = 6; // title, location, jobType, experienceLevel, sector, description
    const completedFields = [
      formData.title.trim(),
      formData.location.trim(),
      formData.jobType,
      formData.experienceLevel,
      formData.sector,
      formData.description.trim()
    ].filter(Boolean).length;
    return (completedFields / totalFields) * 100;
  };

  if (fetching) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['employer']}>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-4 sm:py-8 overflow-x-hidden">
        {/* Enhanced Progress Steps */}
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-4xl mb-6 sm:mb-8 w-full">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                      ${currentStep >= step.id 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl transform scale-105 sm:scale-110 border-blue-600' 
                        : 'bg-white text-gray-600 border-gray-400 shadow-md'
                      }
                    `}>
                      {currentStep > step.id ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                      ) : (
                        <StepIcon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      )}
                    </div>
                    <div className="ml-2 sm:ml-3 hidden md:block">
                      <p className={`text-sm md:text-base font-bold ${currentStep >= step.id ? 'text-blue-700' : 'text-gray-600'}`}>
                        {step.title}
                      </p>
                      <p className={`text-xs md:text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-4 sm:w-6 md:w-8 lg:w-12 h-1 mx-2 sm:mx-3 md:mx-4 rounded-full ${currentStep > step.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-4xl relative w-full">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <Link href="/employer/jobs" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors w-fit">
                <ArrowLeft className="h-4 w-4" />
                Back to Jobs
              </Link>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                variant="destructive"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Job
                  </>
                )}
              </Button>
            </div>
            <div className="text-center mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl">
                  <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">Edit Job Posting</h1>
              </div>
              <p className="text-gray-600 text-base sm:text-lg">Update your job posting with AI-powered suggestions</p>
              
              {/* Progress Bar */}
              <div className="mt-6 max-w-md mx-auto">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(getStepProgress())}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getStepProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-2xl border-2 border-gray-200 bg-white/98 backdrop-blur-sm w-full relative z-10 overflow-hidden">
            <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10 relative z-10 w-full">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                        <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Basic Job Information</h2>
                      <p className="text-gray-600 text-sm sm:text-base">Tell us about the position</p>
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <Label htmlFor="title" className="text-sm sm:text-base font-bold text-gray-900">
                          Job Title *
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2 mt-2">
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="e.g., Senior React Developer"
                            className="flex-1 w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 min-w-0"
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => requestAISuggestions('title')}
                            disabled={!formData.title.trim() || aiLoading}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-3 py-2 sm:px-2 sm:py-1 text-xs font-medium h-12 sm:min-w-fit w-full sm:w-auto shrink-0"
                            title="Get AI suggestions for job title"
                          >
                            {aiLoading && activeField === 'title' ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                <span className="hidden sm:inline">AI Generate</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">AI Generate</span>
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {aiSuggestions.title && (
                          <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                            <p className="text-xs sm:text-sm text-blue-700 font-medium mb-2">
                              💡 AI Suggestion:
                            </p>
                            <p className="text-sm text-gray-700 mb-2">{aiSuggestions.title}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyAISuggestion('title')}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
                            >
                              Apply Suggestion
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="min-w-0">
                          <Label htmlFor="location" className="text-sm sm:text-base font-bold text-gray-900">
                            Location *
                          </Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="e.g., Bangalore, India"
                            className="w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 mt-2 min-w-0"
                            required
                          />
                        </div>

                        <div className="min-w-0">
                          <Label htmlFor="country" className="text-sm sm:text-base font-bold text-gray-900">
                            Country
                          </Label>
                          <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                            <SelectTrigger className="w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 mt-2 min-w-0">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent 
                              className="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl" 
                              style={{ 
                                zIndex: Z_INDEX.TOP_LEVEL_DROPDOWN,
                                ...(isMobile && {
                                  maxWidth: 'calc(100vw - 2rem)',
                                  width: 'calc(100vw - 2rem)'
                                })
                              }}
                            >
                              <SelectItem value="IN">🇮🇳 India</SelectItem>
                              <SelectItem value="US">🇺🇸 United States</SelectItem>
                              <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                              <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                              <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                              <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                              <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="min-w-0">
                          <Label htmlFor="jobType" className="text-sm sm:text-base font-bold text-gray-900">
                            Job Type *
                          </Label>
                          <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                            <SelectTrigger className="w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 mt-2 min-w-0">
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                            <SelectContent 
                              className="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl" 
                              style={{ 
                                zIndex: Z_INDEX.TOP_LEVEL_DROPDOWN,
                                ...(isMobile && {
                                  maxWidth: 'calc(100vw - 2rem)',
                                  width: 'calc(100vw - 2rem)'
                                })
                              }}
                            >
                              {dynamicOptions?.jobTypes?.length ? (
                                dynamicOptions.jobTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{type.label}</span>
                                      <span className="text-xs text-gray-500 ml-2">({type.count})</span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="full-time">Full Time</SelectItem>
                                  <SelectItem value="part-time">Part Time</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="internship">Internship</SelectItem>
                                  <SelectItem value="freelance">Freelance</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="min-w-0">
                          <Label htmlFor="experienceLevel" className="text-sm sm:text-base font-bold text-gray-900">
                            Experience Level *
                          </Label>
                          <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                            <SelectTrigger className="w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 mt-2 min-w-0">
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                            <SelectContent 
                              className="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl" 
                              style={{ 
                                zIndex: Z_INDEX.TOP_LEVEL_DROPDOWN,
                                ...(isMobile && {
                                  maxWidth: 'calc(100vw - 2rem)',
                                  width: 'calc(100vw - 2rem)'
                                })
                              }}
                            >
                              {dynamicOptions?.experienceLevels?.length ? (
                                dynamicOptions.experienceLevels.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{level.label}</span>
                                      <span className="text-xs text-gray-500 ml-2">({level.count})</span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                                  <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                                  <SelectItem value="senior">Senior Level (5-10 years)</SelectItem>
                                  <SelectItem value="lead">Lead Level (10-15 years)</SelectItem>
                                  <SelectItem value="executive">Executive (15+ years)</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="min-w-0">
                          <Label htmlFor="sector" className="text-sm sm:text-base font-bold text-gray-900">
                            Sector *
                          </Label>
                          <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                            <SelectTrigger className="w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 mt-2 min-w-0">
                              <SelectValue placeholder="Select sector" />
                            </SelectTrigger>
                            <SelectContent 
                              className="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl" 
                              style={{ 
                                zIndex: Z_INDEX.TOP_LEVEL_DROPDOWN,
                                ...(isMobile && {
                                  maxWidth: 'calc(100vw - 2rem)',
                                  width: 'calc(100vw - 2rem)'
                                })
                              }}
                            >
                              {dynamicOptions?.sectors?.length ? (
                                dynamicOptions.sectors.map((sector) => (
                                  <SelectItem key={sector.value} value={sector.value}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{sector.label}</span>
                                      <span className="text-xs text-gray-500 ml-2">({sector.count})</span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="technology">Technology</SelectItem>
                                  <SelectItem value="healthcare">Healthcare</SelectItem>
                                  <SelectItem value="finance">Finance</SelectItem>
                                  <SelectItem value="education">Education</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="salary" className="text-sm sm:text-base font-bold text-gray-900">
                          Salary Range
                        </Label>
                        <Input
                          id="salary"
                          value={formData.salary}
                          onChange={(e) => handleInputChange('salary', e.target.value)}
                          placeholder="e.g., 50000-80000"
                          className="w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 mt-2 min-w-0"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                        <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Job Description & Requirements</h2>
                      <p className="text-gray-600 text-sm sm:text-base">Describe the role and what you're looking for</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="description" className="text-sm sm:text-base font-bold text-gray-900">
                          Job Description *
                        </Label>
                        <div className="mt-2">
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                            rows={6}
                            className="w-full text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200"
                            required
                          />
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => requestAISuggestions('description')}
                              disabled={!formData.title.trim() || aiLoading}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-3 py-2 text-xs font-medium"
                            >
                              {aiLoading && activeField === 'description' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  <span>AI Generate</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 mr-2" />
                                  <span>AI Generate Description</span>
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {aiSuggestions.description && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                              <p className="text-xs sm:text-sm text-blue-700 font-medium mb-2">
                                💡 AI Suggestion:
                              </p>
                              <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{aiSuggestions.description}</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyAISuggestion('description')}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
                              >
                                Apply Suggestion
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="requirements" className="text-sm sm:text-base font-bold text-gray-900">
                          Requirements
                        </Label>
                        <div className="mt-2">
                          <Textarea
                            id="requirements"
                            value={formData.requirements}
                            onChange={(e) => handleInputChange('requirements', e.target.value)}
                            placeholder="List the key requirements and qualifications..."
                            rows={4}
                            className="w-full text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200"
                          />
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => requestAISuggestions('requirements')}
                              disabled={!formData.title.trim() || aiLoading}
                              className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 hover:from-green-700 hover:to-blue-700 shadow-lg px-3 py-2 text-xs font-medium"
                            >
                              {aiLoading && activeField === 'requirements' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  <span>AI Generate</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 mr-2" />
                                  <span>AI Generate Requirements</span>
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {aiSuggestions.requirements && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                              <p className="text-xs sm:text-sm text-green-700 font-medium mb-2">
                                💡 AI Suggestion:
                              </p>
                              <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{aiSuggestions.requirements}</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyAISuggestion('requirements')}
                                className="text-xs bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                              >
                                Apply Suggestion
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="benefits" className="text-sm sm:text-base font-bold text-gray-900">
                          Benefits & Perks
                        </Label>
                        <div className="mt-2">
                          <Textarea
                            id="benefits"
                            value={formData.benefits}
                            onChange={(e) => handleInputChange('benefits', e.target.value)}
                            placeholder="List the benefits, perks, and what you offer..."
                            rows={4}
                            className="w-full text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200"
                          />
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => requestAISuggestions('benefits')}
                              disabled={!formData.title.trim() || aiLoading}
                              className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 hover:from-green-700 hover:to-blue-700 shadow-lg px-3 py-2 text-xs font-medium"
                            >
                              {aiLoading && activeField === 'benefits' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  <span>AI Generate</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 mr-2" />
                                  <span>AI Generate Benefits</span>
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {aiSuggestions.benefits && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                              <p className="text-xs sm:text-sm text-green-700 font-medium mb-2">
                                💡 AI Suggestion:
                              </p>
                              <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{aiSuggestions.benefits}</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyAISuggestion('benefits')}
                                className="text-xs bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                              >
                                Apply Suggestion
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                        <Target className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Job Settings & Preferences</h2>
                      <p className="text-gray-600 text-sm sm:text-base">Configure job visibility and application settings</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="skills" className="text-sm sm:text-base font-bold text-gray-900">
                          Required Skills
                        </Label>
                        <div className="mt-2">
                          <Input
                            id="skills"
                            value={skillsInput}
                            onChange={(e) => handleSkillsChange(e.target.value)}
                            placeholder="Type skills and press comma to add (e.g., React, Node.js,)"
                            className="w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 min-w-0"
                          />
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => requestAISuggestions('skills')}
                              disabled={!formData.title.trim() || aiLoading}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700 shadow-lg px-3 py-2 text-xs font-medium"
                            >
                              {aiLoading && activeField === 'skills' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  <span>AI Generate</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 mr-2" />
                                  <span>AI Generate Skills</span>
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {aiSuggestions.skills && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                              <p className="text-xs sm:text-sm text-purple-700 font-medium mb-2">
                                💡 AI Suggestion:
                              </p>
                              <p className="text-sm text-gray-700 mb-3">{aiSuggestions.skills}</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyAISuggestion('skills')}
                                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300"
                              >
                                Apply Suggestion
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {formData.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-300 px-3 py-2 rounded-full text-sm font-medium"
                            >
                              <Target className="h-3 w-3" />
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="ml-1 hover:text-blue-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                        <Target className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Job Settings & Preferences</h2>
                      <p className="text-gray-600 text-sm sm:text-base">Configure job visibility and application settings</p>
                    </div>

                    <div className="space-y-6">

                      {/* Job Settings */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Zap className="h-5 w-5 text-blue-600" />
                          Job Settings
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 min-w-0">
                            <Checkbox
                              id="isRemote"
                              checked={formData.isRemote}
                              onCheckedChange={(checked) => handleInputChange('isRemote', checked)}
                              className="h-5 w-5"
                            />
                            <Label htmlFor="isRemote" className="text-sm font-medium text-gray-900">
                              Remote Work
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 min-w-0">
                            <Checkbox
                              id="isHybrid"
                              checked={formData.isHybrid}
                              onCheckedChange={(checked) => handleInputChange('isHybrid', checked)}
                              className="h-5 w-5"
                            />
                            <Label htmlFor="isHybrid" className="text-sm font-medium text-gray-900">
                              Hybrid Work
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 min-w-0">
                            <Checkbox
                              id="isUrgent"
                              checked={formData.isUrgent}
                              onCheckedChange={(checked) => handleInputChange('isUrgent', checked)}
                              className="h-5 w-5"
                            />
                            <Label htmlFor="isUrgent" className="text-sm font-medium text-gray-900">
                              Urgent Hiring
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 min-w-0">
                            <Checkbox
                              id="isFeatured"
                              checked={formData.isFeatured}
                              onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                              className="h-5 w-5"
                            />
                            <Label htmlFor="isFeatured" className="text-sm font-medium text-gray-900">
                              Featured Job
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Application Deadline */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-green-600" />
                          Application Deadline
                        </h3>
                        <div>
                          <Label htmlFor="applicationDeadline" className="text-sm font-bold text-gray-900">
                            Deadline Date
                          </Label>
                          <Input
                            id="applicationDeadline"
                            type="date"
                            value={formData.applicationDeadline}
                            onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                            className="w-full h-12 text-sm sm:text-base rounded-xl border-2 border-gray-300 focus:border-blue-500 transition-all duration-200 mt-2 min-w-0"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
          
          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 w-full">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-white hover:bg-gray-50 w-full sm:w-auto min-h-[48px] touch-manipulation text-base font-semibold rounded-xl border-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link href="/employer/jobs" className="w-full sm:w-auto">
                <Button 
                  type="button"
                  variant="outline" 
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-white hover:bg-gray-50 w-full sm:w-auto min-h-[48px] touch-manipulation text-base font-semibold rounded-xl border-2"
                >
                  Cancel
                </Button>
              </Link>
              
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-[48px] touch-manipulation text-base font-semibold rounded-xl"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !validateStep(1) || !validateStep(2)}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto min-h-[48px] touch-manipulation text-base font-semibold rounded-xl"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Job
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
        </div>
      </div>
    </AuthGuard>
  );
}