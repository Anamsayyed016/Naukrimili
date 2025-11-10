"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Trash2,
  Sparkles
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
  
  // Refs for debouncing dynamic AI suggestions  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Dynamic AI suggestions as user types (debounced)
  useEffect(() => {
    const shouldAutoSuggest = (field: string, value: string) => {
      return value && value.trim().length >= 10 && !aiSuggestions[field as keyof AISuggestions];
    };

    // Auto-suggest for title
    if (formData.title && shouldAutoSuggest('title', formData.title)) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      
      debounceTimerRef.current = setTimeout(() => {
        console.log('🤖 Auto-triggering AI for title');
        getAISuggestions('title', formData.title);
      }, 2000);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData.title]);

  // Dynamic AI suggestions for description
  useEffect(() => {
    if (formData.description && formData.description.trim().length >= 20 && !aiSuggestions.description && formData.title) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      
      debounceTimerRef.current = setTimeout(() => {
        console.log('🤖 Auto-triggering AI for description');
        getAISuggestions('description', formData.description);
      }, 2500);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData.description, formData.title]);

  // Dynamic AI suggestions for requirements  
  useEffect(() => {
    if (formData.requirements && formData.requirements.trim().length >= 15 && !aiSuggestions.requirements && formData.title) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      
      debounceTimerRef.current = setTimeout(() => {
        console.log('🤖 Auto-triggering AI for requirements');
        getAISuggestions('requirements', formData.requirements);
      }, 2500);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData.requirements, formData.title]);

  // Inject mobile dropdown styles for proper z-index and positioning
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'edit-job-dropdown-styles';
    style.textContent = `
      /* Professional hover effects */
      [data-radix-select-item]:hover {
        background-color: #f8fafc !important;
        color: #1e293b !important;
      }
      
      [data-radix-select-item][data-highlighted] {
        background-color: #3b82f6 !important;
        color: white !important;
      }
      
      [data-radix-select-item][data-state="checked"] {
        background-color: #10b981 !important;
        color: white !important;
        font-weight: 600 !important;
      }
    `;
    
    // Remove existing style if it exists
    const existingStyle = document.getElementById('edit-job-dropdown-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    // Cleanup on unmount
    return () => {
      const styleToRemove = document.getElementById('edit-job-dropdown-styles');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, []);

  const fetchJob = async () => {
    if (!jobId) {
      console.log('⚠️ No job ID, cannot fetch');
      return;
    }
    
    try {
      setFetching(true);
      console.log('🔍 Fetching job details for ID:', jobId);
      
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Fetch job response status:', response.status);
      
      if (!response.ok) {
        // Parse error response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log('❌ Error response:', errorData);
        
        if (response.status === 401) {
          console.log('❌ 401 Unauthorized - redirecting to signin');
          toast.error('Session expired', {
            description: 'Please sign in again.',
            duration: 3000,
          });
          // Delay redirect to allow user to see the message
          setTimeout(() => {
            router.push('/auth/signin?redirect=/employer/jobs');
          }, 1000);
          return;
        }
        
        if (response.status === 403) {
          console.log('❌ 403 Forbidden - no permission');
          toast.error('Access Denied', {
            description: 'This job belongs to another employer.',
            duration: 3000,
          });
          // Delay redirect to allow user to see the message
          setTimeout(() => {
            router.push('/employer/jobs');
          }, 1500);
          return;
        }
        
        if (response.status === 404) {
          console.log('❌ 404 Not Found - job or company not found');
          toast.error('Job Not Found', {
            description: errorData.error || 'This job may have been deleted.',
            duration: 3000,
          });
          // Delay redirect to allow user to see the message
          setTimeout(() => {
            router.push('/employer/jobs');
          }, 1500);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to fetch job');
      }

      const data = await response.json();
      console.log('✅ Job data received:', data.success ? 'Success' : 'Failed', 'Job:', data.data?.title);
      
      if (data.success) {
        const job = data.data;
        console.log('📋 Loading job:', job.title);
        
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
          // FIXED: Map expiryDate from database to applicationDeadline in form
          applicationDeadline: job.expiryDate ? new Date(job.expiryDate).toISOString().split('T')[0] : ''
        });
      } else {
        console.error('❌ data.success is false');
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Don't redirect on network/parsing errors - let user retry
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('JSON')) {
        toast.error('Connection Error', {
          description: 'Failed to load job details. Please check your connection and try refreshing.',
          duration: 5000,
        });
      } else {
        toast.error('Failed to load job', {
          description: errorMessage,
          duration: 5000,
        });
      }
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
      console.log('⚠️ AI suggestions skipped - value too short');
      return;
    }

    setAiLoading(true);
    setActiveField(field);

    try {
      console.log('🤖 Requesting AI suggestions for field:', field, 'value length:', value.length);
      
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

      console.log('📡 AI API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ AI response data:', data);
        
        if (data.success && data.suggestions?.length > 0) {
          const suggestion = data.suggestions[0];
          setAiSuggestions(prev => ({ ...prev, [field]: suggestion }));
          toast.success('✨ AI suggestion ready!', {
            description: 'Click the suggestion box to apply it.',
            duration: 3000
          });
        } else {
          console.log('⚠️ No suggestions in response:', data);
          toast.info('No AI suggestions available', {
            description: 'You can continue with manual input.',
            duration: 2000
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ AI API error:', response.status, errorData);
        toast.info('AI unavailable', {
          description: 'Continue with manual input. AI provider may be offline.',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('❌ AI suggestion error:', error);
      // Don't show error toast for AI failures - just log it
      console.log('ℹ️ AI suggestions failed, continuing with manual input');
    } finally {
      setAiLoading(false);
      setActiveField(null);
    }
  }, [formData.jobType, formData.experienceLevel, formData.sector]);

  const applyAISuggestion = (field: keyof AISuggestions) => {
    const suggestion = aiSuggestions[field];
    if (suggestion) {
      setFormData(prev => ({ ...prev, [field]: suggestion }));
      toast.success('✨ Applied AI suggestion!', { duration: 2000 });
      setTimeout(() => {
        setAiSuggestions(prev => ({ ...prev, [field]: '' }));
      }, 300);
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
    console.log('🚀 handleSubmit called - starting job update process');
    console.log('📋 Current form data:', formData);
    setLoading(true);

    // Enhanced validation
    console.log('🔍 Validating form data...');
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
      console.log('📤 Submitting job update for ID:', jobId);
      console.log('📋 Form data:', formData);
      
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      console.log('📡 Update response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Update failed:', response.status, errorData);
        
        if (response.status === 401) {
          console.log('❌ 401 Unauthorized - session expired');
          toast.error('Session expired', {
            description: 'Please sign in again to continue.',
            duration: 3000,
          });
          // Delay redirect to allow user to see the message
          setTimeout(() => {
            router.push('/auth/signin?redirect=/employer/jobs');
          }, 1000);
          setLoading(false);
          return;
        }
        
        if (response.status === 404) {
          console.log('❌ 404 Not Found - company profile or job not found');
          toast.error('Not Found', {
            description: errorData.error || 'Company profile or job not found.',
            duration: 3000,
          });
          // Delay redirect to allow user to see the message
          setTimeout(() => {
            router.push('/employer/company/create');
          }, 1500);
          setLoading(false);
          return;
        }
        
        if (response.status === 403) {
          console.log('❌ 403 Forbidden - no permission to update this job');
          toast.error('Access Denied', {
            description: 'You do not have permission to update this job.',
            duration: 3000,
          });
          setTimeout(() => {
            router.push('/employer/jobs');
          }, 1500);
          setLoading(false);
          return;
        }
        
        throw new Error(errorData.error || errorData.details || 'Failed to update job');
      }

      const result = await response.json();
      console.log('✅ API Response received:', JSON.stringify(result, null, 2));
      console.log('✅ Result.success:', result.success);
      console.log('✅ Updated job data:', result.data);
      
      if (result.success) {
        console.log('🎉 Job update confirmed successful - showing success toast');
        toast.success('✅ Job updated successfully!', {
          description: 'Your job posting has been updated and is now live.',
          duration: 3000,
        });
        
        // FIXED: Only redirect after successful update, with proper delay
        console.log('⏱️ Waiting 2s before redirect to /employer/jobs');
        setTimeout(() => {
          console.log('🔄 Redirecting to job management page...');
          router.push('/employer/jobs');
        }, 2000);
      } else {
        console.error('❌ Result.success is false');
        const errorMsg = result.error || result.message || 'Failed to update job';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error updating job:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Better error messages for users
      if (errorMessage.includes('company') || errorMessage.includes('Company')) {
        toast.error('Company Profile Required', {
          description: 'Please create your company profile before posting jobs.',
          duration: 5000,
        });
      } else if (errorMessage.includes('permission') || errorMessage.includes('permission')) {
        toast.error('Access Denied', {
          description: 'You do not have permission to update this job.',
          duration: 5000,
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('Network Error', {
          description: 'Please check your connection and try again.',
          duration: 5000,
        });
      } else {
        toast.error('Failed to update job', {
          description: errorMessage,
          duration: 5000,
        });
      }
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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-4 sm:py-8">
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
          <Card className="shadow-2xl border-2 border-gray-200 bg-white/98 backdrop-blur-sm w-full">
            <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10 w-full">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                    style={{ overflow: 'visible' }}
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
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="title" className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                            Job Title *
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                              AI-Powered
                            </Badge>
                          </Label>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="e.g., Senior React Developer"
                            className="flex-1 w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm min-w-0"
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => requestAISuggestions('title')}
                            disabled={!formData.title.trim() || aiLoading}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium h-10 sm:h-12 w-full sm:w-auto shrink-0"
                            title="Get AI suggestions for job title"
                          >
                            {aiLoading && activeField === 'title' ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                <span className="hidden sm:inline">Generating...</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Regenerate</span>
                              </>
                            )}
                          </Button>
                        </div>
                        {formData.title && formData.title.length >= 3 && (
                          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <Brain className="h-3 w-3 animate-pulse text-purple-600" />
                            <span className={aiLoading && activeField === 'title' ? 'animate-pulse' : ''}>
                              {aiLoading && activeField === 'title' ? '🤖 AI is analyzing...' : 'AI will auto-suggest after you stop typing or click "Regenerate"'}
                            </span>
                          </p>
                        )}
                        
                        <AnimatePresence>
                          {aiSuggestions.title && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm"
                            >
                              <p className="text-xs sm:text-sm text-purple-700 font-semibold mb-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 animate-pulse" />
                                AI Suggestion:
                              </p>
                              <p className="text-sm text-gray-800 mb-3 font-medium">{aiSuggestions.title}</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => applyAISuggestion('title')}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 shadow-sm hover:shadow-md transition-all"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Apply Suggestion
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                            className="w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm mt-2 min-w-0"
                            required
                          />
                        </div>

                        <div className="min-w-0">
                          <Label htmlFor="country" className="text-sm sm:text-base font-bold text-gray-900">
                            Country
                          </Label>
                          <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                            <SelectTrigger className="w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm mt-2 min-w-0">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 bg-white border border-gray-200 rounded-xl shadow-xl">
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
                            <SelectTrigger className="w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm mt-2 min-w-0">
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 bg-white border border-gray-200 rounded-xl shadow-xl">
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
                            <SelectTrigger className="w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm mt-2 min-w-0">
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 bg-white border border-gray-200 rounded-xl shadow-xl">
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
                            <SelectTrigger className="w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm mt-2 min-w-0">
                              <SelectValue placeholder="Select sector" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 bg-white border border-gray-200 rounded-xl shadow-xl overflow-y-auto">
                              {dynamicOptions?.sectors?.length ? (
                                <>
                                  {dynamicOptions.sectors.map((sector) => (
                                    <SelectItem key={sector.value} value={sector.value}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{sector.label}</span>
                                        <span className="text-xs text-gray-500 ml-2">({sector.count})</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="other">Other</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="Technology">Technology</SelectItem>
                                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                                  <SelectItem value="Finance & Banking">Finance & Banking</SelectItem>
                                  <SelectItem value="Education">Education</SelectItem>
                                  <SelectItem value="IT & Software">IT & Software</SelectItem>
                                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="Retail & E-commerce">Retail & E-commerce</SelectItem>
                                  <SelectItem value="Marketing & Advertising">Marketing & Advertising</SelectItem>
                                  <SelectItem value="Sales">Sales</SelectItem>
                                  <SelectItem value="Customer Service & BPO">Customer Service & BPO</SelectItem>
                                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                                  <SelectItem value="Construction">Construction</SelectItem>
                                  <SelectItem value="Hospitality & Tourism">Hospitality & Tourism</SelectItem>
                                  <SelectItem value="Transportation & Logistics">Transportation & Logistics</SelectItem>
                                  <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                                  <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                                  <SelectItem value="Legal">Legal</SelectItem>
                                  <SelectItem value="Consulting">Consulting</SelectItem>
                                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                                  <SelectItem value="Energy & Utilities">Energy & Utilities</SelectItem>
                                  <SelectItem value="Government & Public Sector">Government & Public Sector</SelectItem>
                                  <SelectItem value="Non-Profit & NGO">Non-Profit & NGO</SelectItem>
                                  <SelectItem value="General">General</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
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
                          className="w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm mt-2 min-w-0"
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
                    style={{ overflow: 'visible' }}
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
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="description" className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                            Job Description *
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                              AI-Powered
                            </Badge>
                          </Label>
                        </div>
                        <div>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                            rows={6}
                            className="w-full text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
                            required
                          />
                          <div className="mt-2 flex flex-col sm:flex-row items-start gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => requestAISuggestions('description')}
                              disabled={!formData.title.trim() || aiLoading}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium w-full sm:w-auto"
                            >
                              {aiLoading && activeField === 'description' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 mr-2" />
                                  <span>Regenerate Description</span>
                                </>
                              )}
                            </Button>
                            {formData.description && formData.description.length >= 10 && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Brain className="h-3 w-3 animate-pulse text-purple-600" />
                                <span className={aiLoading && activeField === 'description' ? 'animate-pulse' : ''}>
                                  {aiLoading && activeField === 'description' ? '🤖 AI is analyzing...' : 'AI auto-suggests as you type'}
                                </span>
                              </p>
                            )}
                          </div>
                          
                          <AnimatePresence>
                            {aiSuggestions.description && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm"
                              >
                                <p className="text-xs sm:text-sm text-purple-700 font-semibold mb-2 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 animate-pulse" />
                                  AI Suggestion:
                                </p>
                                <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{aiSuggestions.description}</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAISuggestion('description')}
                                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 shadow-sm hover:shadow-md transition-all"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Apply Suggestion
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="requirements" className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                            Requirements
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                              AI-Powered
                            </Badge>
                          </Label>
                        </div>
                        <div>
                          <Textarea
                            id="requirements"
                            value={formData.requirements}
                            onChange={(e) => handleInputChange('requirements', e.target.value)}
                            placeholder="List the key requirements and qualifications..."
                            rows={4}
                            className="w-full text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
                          />
                          <div className="mt-2 flex flex-col sm:flex-row items-start gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => requestAISuggestions('requirements')}
                              disabled={!formData.title.trim() || aiLoading}
                              className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 hover:from-green-700 hover:to-blue-700 shadow-lg px-3 py-2 text-xs font-medium w-full sm:w-auto"
                            >
                              {aiLoading && activeField === 'requirements' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 mr-2" />
                                  <span>Regenerate Requirements</span>
                                </>
                              )}
                            </Button>
                            {formData.requirements && formData.requirements.length >= 10 && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Brain className="h-3 w-3 animate-pulse text-green-600" />
                                <span className={aiLoading && activeField === 'requirements' ? 'animate-pulse' : ''}>
                                  {aiLoading && activeField === 'requirements' ? '🤖 AI is analyzing...' : 'AI auto-suggests as you type'}
                                </span>
                              </p>
                            )}
                          </div>
                          
                          <AnimatePresence>
                            {aiSuggestions.requirements && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200 shadow-sm"
                              >
                                <p className="text-xs sm:text-sm text-green-700 font-semibold mb-2 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 animate-pulse" />
                                  AI Suggestion:
                                </p>
                                <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{aiSuggestions.requirements}</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAISuggestion('requirements')}
                                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 border-green-300 shadow-sm hover:shadow-md transition-all"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Apply Suggestion
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="benefits" className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                            Benefits & Perks
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              AI-Powered
                            </Badge>
                          </Label>
                        </div>
                        <div>
                          <Textarea
                            id="benefits"
                            value={formData.benefits}
                            onChange={(e) => handleInputChange('benefits', e.target.value)}
                            placeholder="List the benefits, perks, and what you offer..."
                            rows={4}
                            className="w-full text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
                          />
                          <div className="mt-2 flex flex-col sm:flex-row items-start gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => requestAISuggestions('benefits')}
                              disabled={!formData.title.trim() || aiLoading}
                              className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 hover:from-green-700 hover:to-blue-700 shadow-lg px-3 py-2 text-xs font-medium w-full sm:w-auto"
                            >
                              {aiLoading && activeField === 'benefits' ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 mr-2" />
                                  <span>Regenerate Benefits</span>
                                </>
                              )}
                            </Button>
                            {formData.benefits && formData.benefits.length >= 10 && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Brain className="h-3 w-3 animate-pulse text-green-600" />
                                <span>AI-powered suggestions</span>
                              </p>
                            )}
                          </div>
                          
                          <AnimatePresence>
                            {aiSuggestions.benefits && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-green-200 shadow-sm"
                              >
                                <p className="text-xs sm:text-sm text-green-700 font-semibold mb-2 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 animate-pulse" />
                                  AI Suggestion:
                                </p>
                                <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{aiSuggestions.benefits}</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAISuggestion('benefits')}
                                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 border-green-300 shadow-sm hover:shadow-md transition-all"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Apply Suggestion
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                    style={{ overflow: 'visible' }}
                  >
                    <div className="text-center mb-6">
                      <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                        <Target className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Job Settings & Preferences</h2>
                      <p className="text-gray-600 text-sm sm:text-base">Configure job visibility and application settings</p>
                    </div>

                    <div className="space-y-6">
                      {/* Required Skills */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label htmlFor="skills" className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                            Required Skills
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                              AI-Powered
                            </Badge>
                          </Label>
                        </div>
                        <div>
                          <Input
                            id="skills"
                            value={skillsInput}
                            onChange={(e) => handleSkillsChange(e.target.value)}
                            placeholder="Type skills and press comma to add (e.g., React, Node.js,)"
                            className="w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm min-w-0"
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
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="h-3 w-3 mr-2" />
                                  <span>AI Generate Skills</span>
                                </>
                              )}
                            </Button>
                          </div>
                          
                          <AnimatePresence>
                            {aiSuggestions.skills && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 shadow-sm"
                              >
                                <p className="text-xs sm:text-sm text-purple-700 font-semibold mb-2 flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 animate-pulse" />
                                  AI Suggestion:
                                </p>
                                <p className="text-sm text-gray-800 mb-3">{aiSuggestions.skills}</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAISuggestion('skills')}
                                  className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 border-purple-300 shadow-sm hover:shadow-md transition-all"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Apply Suggestion
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                            className="w-full h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm mt-2 min-w-0"
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