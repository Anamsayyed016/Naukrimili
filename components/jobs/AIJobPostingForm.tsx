'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, ArrowRight, CheckCircle, Sparkles, ArrowLeft, X, Users, FileText, Mail, Phone, Loader2, Search } from 'lucide-react';
import EnhancedLocationSearch from '@/components/EnhancedLocationSearch';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  multipleLocations: string[];
  country: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  skills: string[];
  benefits: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  openings: string;
  locationRadiusKm?: number;
  contactEmail: string;
  contactPhone: string;
}

const steps = [
  { id: 1, title: 'Details', description: 'Job information' },
  { id: 2, title: 'Requirements & Skills', description: 'What you need' },
  { id: 3, title: 'Location', description: 'Job location' },
  { id: 4, title: 'Review', description: 'Review & publish' }
];

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const experienceLevels = ['Entry Level (0-2 years)', 'Mid Level (3-5 years)', 'Senior Level (6-10 years)', 'Lead (11-15 years)', 'Executive (15+ years)'];
const popularSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Git', 'SQL', 'MongoDB'];
const locations = ['Mumbai, Maharashtra', 'Bangalore, Karnataka', 'Delhi, NCR', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Chennai, Tamil Nadu'];

export default function AIJobPostingForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<{ name: string; description: string; industry: string } | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [aiLoading, setAiLoading] = useState<{ [k: string]: boolean }>({});
  const [aiSuggestions, setAiSuggestions] = useState<{ [k: string]: string[] }>({});
  const [locationSalarySuggestions, setLocationSalarySuggestions] = useState<string[]>([]);
  const [loadingSalarySuggestions, setLoadingSalarySuggestions] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    multipleLocations: [],
    country: 'India',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    salary: '',
    skills: [],
    benefits: '',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    openings: '1',
    contactEmail: '',
    contactPhone: ''
  });

  // Debounce timers for auto AI suggestions
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const skillsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const benefitsDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch company profile on mount
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        console.log('🔍 Fetching company profile for job form...');
        const response = await fetch('/api/employer/company-profile', {
          credentials: 'include',
        });
        
        console.log('📡 Company profile response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log('✅ Company profile loaded:', data.data.name);
            setCompanyProfile({
              name: data.data.name || '',
              description: data.data.description || '',
              industry: data.data.industry || 'Technology'
            });
          }
        } else if (response.status === 404) {
          // No company profile - this is OK, user can still use generic AI suggestions
          console.log('ℹ️ No company profile found - using generic AI');
          setCompanyProfile({
            name: 'Your Company',
            description: '',
            industry: 'Technology'
          });
        } else if (response.status === 401) {
          console.log('❌ 401 Unauthorized - user needs to login');
          toast.error('Session expired', {
            description: 'Please sign in again to continue.',
            duration: 3000,
          });
        } else {
          console.error('Error loading company profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      } finally {
        setLoadingCompany(false);
      }
    };
    fetchCompanyProfile();
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (skillsDebounceRef.current) {
        clearTimeout(skillsDebounceRef.current);
      }
      if (benefitsDebounceRef.current) {
        clearTimeout(benefitsDebounceRef.current);
      }
    };
  }, []);

  // Fetch location-based salary suggestions when locations change
  useEffect(() => {
    const fetchLocationSalary = async () => {
      if (formData.multipleLocations.length === 0 && !formData.location.trim()) {
        setLocationSalarySuggestions([]);
        return;
      }

      setLoadingSalarySuggestions(true);
      try {
        const locations = formData.multipleLocations.length > 0 
          ? formData.multipleLocations 
          : [formData.location].filter(Boolean);

        // Get salary stats for each location
        const salaryPromises = locations.map(async (loc) => {
          try {
            const response = await fetch(`/api/locations?q=${encodeURIComponent(loc)}&limit=1`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.locations && data.locations.length > 0) {
                const locationData = data.locations[0];
                const salaryStats = locationData.salary_stats;
                const currency = salaryStats?.currency || 'INR';
                const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'AED' ? 'AED' : currency === 'GBP' ? '£' : '₹';
                
                if (salaryStats?.average_min && salaryStats?.average_max) {
                  const min = Math.round(salaryStats.average_min / 1000) * 1000;
                  const max = Math.round(salaryStats.average_max / 1000) * 1000;
                  return `${loc}: ${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}/year`;
                } else if (salaryStats?.lowest && salaryStats?.highest) {
                  return `${loc}: ${symbol}${salaryStats.lowest.toLocaleString()} - ${symbol}${salaryStats.highest.toLocaleString()}/year`;
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching salary for ${loc}:`, error);
          }
          return null;
        });

        const salaries = await Promise.all(salaryPromises);
        const validSalaries = salaries.filter(Boolean) as string[];
        
        if (validSalaries.length === 0) {
          // Fallback to default salary ranges based on country
          const defaultSalaries = generateDefaultSalaryRanges(locations, formData.country);
          setLocationSalarySuggestions(defaultSalaries);
        } else {
          setLocationSalarySuggestions(validSalaries);
        }
      } catch (error) {
        console.error('Error fetching location salaries:', error);
        const defaultSalaries = generateDefaultSalaryRanges(
          formData.multipleLocations.length > 0 ? formData.multipleLocations : [formData.location].filter(Boolean),
          formData.country
        );
        setLocationSalarySuggestions(defaultSalaries);
      } finally {
        setLoadingSalarySuggestions(false);
      }
    };

    fetchLocationSalary();
  }, [formData.multipleLocations, formData.location, formData.country]);

  // Generate default salary ranges based on location and country
  const generateDefaultSalaryRanges = (locations: string[], country: string): string[] => {
    const currency = country === 'India' || country === 'IN' ? '₹' : 
                     country === 'US' || country === 'USA' ? '$' :
                     country === 'UAE' || country === 'AE' ? 'AED' :
                     country === 'UK' || country === 'GB' ? '£' : '₹';
    
    const multipliers: { [key: string]: number } = {
      'India': 1,
      'IN': 1,
      'US': 80,
      'USA': 80,
      'UAE': 22,
      'AE': 22,
      'UK': 100,
      'GB': 100
    };

    const multiplier = multipliers[country] || 1;
    
    // Base salary ranges by city (in INR, then converted)
    const cityRanges: { [key: string]: { min: number; max: number } } = {
      'Mumbai': { min: 600000, max: 2500000 },
      'Bangalore': { min: 700000, max: 3000000 },
      'Delhi': { min: 550000, max: 2200000 },
      'Hyderabad': { min: 500000, max: 2000000 },
      'Pune': { min: 550000, max: 2200000 },
      'Chennai': { min: 500000, max: 2000000 },
      'Kolkata': { min: 400000, max: 1500000 },
      'Ahmedabad': { min: 400000, max: 1500000 }
    };

    return locations.map(loc => {
      const cityName = loc.split(',')[0].trim();
      const range = cityRanges[cityName] || { min: 400000, max: 1500000 };
      const min = Math.floor((range.min * multiplier) / 1000) * 1000;
      const max = Math.floor((range.max * multiplier) / 1000) * 1000;
      return `${loc}: ${currency}${min.toLocaleString()} - ${currency}${max.toLocaleString()}/year`;
    });
  };

  // Auto-generate skills when title or requirements change
  useEffect(() => {
    if ((formData.title || formData.requirements) && formData.skills.length === 0) {
      if (skillsDebounceRef.current) {
        clearTimeout(skillsDebounceRef.current);
      }
      
      skillsDebounceRef.current = setTimeout(() => {
        console.log('🤖 Auto-generating skills based on title/requirements');
        getAiSuggestions('skills');
      }, 2000); // 2 second debounce
    }

    return () => {
      if (skillsDebounceRef.current) {
        clearTimeout(skillsDebounceRef.current);
      }
    };
  }, [formData.title, formData.requirements]);

  const handleInputChange = (field: keyof JobFormData, value: string | string[] | boolean | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-trigger AI suggestions for title, description, and requirements as user types
    if (field === 'title' || field === 'description' || field === 'requirements') {
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Only trigger if there's actual content (at least 3 characters)
      if (typeof value === 'string' && value.trim().length >= 3) {
        debounceTimerRef.current = setTimeout(() => {
          getAiSuggestions(field);
        }, 1500); // Wait 1.5 seconds after user stops typing
      } else {
        // Clear suggestions if input is too short
        setAiSuggestions(prev => ({ ...prev, [field]: [] }));
      }
    }
  };

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = formData.contactEmail.trim() !== '' && emailRegex.test(formData.contactEmail.trim());
        // Phone validation (at least 10 digits)
        const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
        const isValidPhone = formData.contactPhone.trim() !== '' && phoneRegex.test(formData.contactPhone.trim());
        
        return formData.title.trim() !== '' && 
               formData.description.trim() !== '' &&
               isValidEmail &&
               isValidPhone;
      case 2:
        // FIXED: Skills are now optional, only requirements required
        return formData.requirements.trim() !== '';
      case 3:
        return (formData.multipleLocations.length > 0 || formData.location.trim() !== '') && formData.country.trim() !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const clearFormData = () => {
    if (confirm('Are you sure you want to clear all form data?')) {
      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        country: 'India',
        jobType: 'Full-time',
        experienceLevel: 'Mid Level (3-5 years)',
        salary: '',
        skills: [],
        benefits: '',
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        openings: '1'
      });
      setCurrentStep(1);
      toast.success('Form cleared');
    }
  };

  const getAiSuggestions = async (
    field: 'title' | 'description' | 'requirements' | 'skills'
  ) => {
    try {
      setAiLoading(prev => ({ ...prev, [field]: true }));
      
      // CRITICAL: Get current field value - this is what user is typing!
      const currentFieldValue = (formData as any)[field];
      const hasUserInput = currentFieldValue && String(currentFieldValue).trim().length > 0;
      
      // Enhanced context with company information AND user's current input
      const context = {
        jobType: formData.jobType,
        experienceLevel: formData.experienceLevel,
        industry: companyProfile?.industry || 'Technology',
        companyName: companyProfile?.name || '',
        companyDescription: companyProfile?.description || '',
        skills: formData.skills,
        jobTitle: formData.title, // Current job title user is typing
        jobDescription: formData.description, // Current description
        userInput: hasUserInput ? String(currentFieldValue).trim() : '', // CRITICAL: The exact keywords user typed
      };
      
      // Dynamic seed defaults - but ALWAYS prefer user input!
      const seedDefaults: Record<string, string> = {
        title: formData.title || `${formData.jobType} position`,
        description: formData.description || `Job description for ${formData.title || 'this position'}`,
        requirements: formData.requirements || `Requirements for ${formData.title || 'this position'}`,
        skills: JSON.stringify(formData.skills.length ? formData.skills : [])
      };
      
      // ALWAYS use user input if available, never override with generic defaults
      const value = hasUserInput 
        ? String(currentFieldValue).trim() 
        : (field === 'skills' ? seedDefaults.skills : seedDefaults[field]);
              
      const res = await fetch('/api/ai/form-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ field, _value: value, context }),
      });
      
      const data = await res.json();
      if (data?.success && Array.isArray(data.suggestions)) {
        setAiSuggestions(prev => ({ ...prev, [field]: data.suggestions.slice(0, 6) }));
        toast.success(`✨ AI suggestions ready based on ${companyProfile?.name || 'your company'}`);
      } else {
        toast.error('Could not fetch suggestions');
      }
    } catch (_e) {
      toast.error('AI suggestion error');
    } finally {
      setAiLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const applySuggestion = (
    field: 'title' | 'description' | 'requirements',
    value: string
  ) => {
    handleInputChange(field as keyof JobFormData, value);
    // Clear suggestions with a small delay for better UX
    toast.success('✨ Applied AI suggestion!', { duration: 2000 });
    setTimeout(() => {
      setAiSuggestions(prev => ({ ...prev, [field]: [] }));
    }, 300);
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Combine multiple locations or use single location
      const finalLocation = formData.multipleLocations.length > 0 
        ? formData.multipleLocations.join(', ')
        : formData.location;

      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: finalLocation,
        multipleLocations: formData.multipleLocations.length > 0 ? formData.multipleLocations : [formData.location].filter(Boolean),
        country: 'IN',
        jobType: formData.jobType.toLowerCase().replace('-', '_'),
        experienceLevel: formData.experienceLevel.toLowerCase().split(' ')[0],
        salary: formData.salary,
        skills: formData.skills,
        benefits: formData.benefits,
        isRemote: formData.isRemote,
        isHybrid: formData.isHybrid,
        isUrgent: formData.isUrgent,
        isFeatured: formData.isFeatured,
        openings: parseInt(formData.openings),
        currencyCode: 'INR',
        currencySymbol: '₹',
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        locationRadiusKm: formData.locationRadiusKm || 25
      };

      console.log('📤 Posting job with payload:', payload);
      
      const response = await fetch('/api/employer/post-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('📡 Post job response:', response.status);
      const data = await response.json();
      console.log('📋 Response data:', data);

      if (data.success) {
        toast.success('🎉 Job posted successfully!', {
          description: 'Your job is now live on the platform.',
          duration: 5000,
        });
        setTimeout(() => {
          router.push('/employer/jobs');
        }, 1500);
      } else if (response.status === 401) {
        toast.error('Session expired', {
          description: 'Please sign in again to continue.',
          duration: 5000,
        });
        router.push('/auth/signin?redirect=/employer/jobs/create');
      } else if (response.status === 400 && data.error?.includes('Company not found')) {
        toast.error('Company profile required', {
          description: 'Please create your company profile first.',
          duration: 5000,
          action: {
            label: 'Create Company',
            onClick: () => router.push('/employer/company/create')
          }
        });
      } else {
        toast.error(data.error || 'Failed to post job', {
          description: 'Please try again or contact support.',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-job-form min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Post a Job</h1>
          </div>
          <p className="text-slate-600 text-sm sm:text-base">
            {companyProfile ? (
              <>AI-powered job posting for <span className="font-semibold text-blue-600">{companyProfile.name}</span></>
            ) : (
              'Create a job posting to find the perfect candidates'
            )}
          </p>
          {loadingCompany && (
            <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              Loading company profile for AI suggestions...
            </p>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-2 font-medium ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block h-0.5 flex-1 mx-2 ${currentStep > step.id ? 'bg-blue-600' : 'bg-slate-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <Card className="shadow-xl bg-white/95 rounded-2xl border border-slate-200 backdrop-blur-sm overflow-visible">
          <CardContent className="p-6 overflow-visible">
            <AnimatePresence mode="wait">
              {/* Step 1: Job Details */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 overflow-visible"
                  style={{ overflow: 'visible' }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        Job Title *
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                          AI-Powered
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="e.g., BPO Team Leader, Software Engineer, Marketing Manager..."
                          className="h-12 w-full"
                        />
                        {formData.title && formData.title.length >= 3 && aiLoading.title && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => getAiSuggestions('title')}
                        disabled={aiLoading.title || !formData.title || formData.title.length < 3}
                        className="whitespace-nowrap bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-3 sm:px-4"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {aiLoading.title ? 'Generating…' : 'AI Suggest'}
                      </Button>
                    </div>
                    {formData.title && formData.title.length >= 3 && (
                      <p className="text-xs text-slate-500 mt-1">
                        💡 AI will auto-suggest in 1.5s after you stop typing, or click "AI Suggest" now
                      </p>
                    )}
                    <AnimatePresence>
                      {aiSuggestions.title?.length ? (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200"
                        >
                          <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-2">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            AI Suggested Titles:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.title.map((s, idx) => (
                              <motion.div
                                key={s}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <Button 
                                  type="button" 
                                  variant="secondary" 
                                  size="sm" 
                                  className="bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm"
                                  onClick={() => applySuggestion('title', s)}
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {s}
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        Job Description *
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                          AI-Powered
                        </Badge>
                      </Label>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start gap-2">
                      <div className="flex-1 w-full relative">
                        <Textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Describe the role, responsibilities, and what you're looking for..."
                          rows={6}
                          className="resize-none w-full"
                        />
                        {formData.description && formData.description.length >= 3 && aiLoading.description && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={() => getAiSuggestions('description')}
                        disabled={aiLoading.description || !formData.description || formData.description.length < 3}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-3 sm:px-4"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {aiLoading.description ? 'Generating…' : 'AI Suggest'}
                      </Button>
                    </div>
                    {formData.description && formData.description.length >= 3 && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span className={aiLoading.description ? 'animate-pulse' : ''}>
                          {aiLoading.description ? '🤖 AI is analyzing...' : '💡 AI analyzing your input... Suggestions appear below after you stop typing'}
                        </span>
                      </p>
                    )}
                    <AnimatePresence>
                      {aiSuggestions.description?.length ? (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="mt-3 space-y-2"
                        >
                          <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-2">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            AI Generated Descriptions (click to use):
                          </p>
                          {aiSuggestions.description.map((s, idx) => (
                            <motion.button
                              key={s}
                              type="button"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              onClick={() => applySuggestion('description', s)}
                              className="w-full text-left text-sm p-4 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-white to-purple-50 hover:from-purple-50 hover:to-blue-50 hover:border-purple-400 transition-all shadow-sm hover:shadow-md group"
                            >
                              <span className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 group-hover:animate-pulse flex-shrink-0" />
                                <span className="flex-1">{s}</span>
                              </span>
                            </motion.button>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Job Type
                    </Label>
                    <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        sideOffset={8}
                        align="start"
                        avoidCollisions
                        collisionPadding={16}
                        className="z-[10000] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl"
                      >
                        {jobTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Number of Openings
                    </Label>
                    <Input
                      type="number"
                      value={formData.openings}
                      onChange={(e) => handleInputChange('openings', e.target.value)}
                      min="1"
                      className="h-12"
                    />
                  </div>

                  {/* Contact Information - Required Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div>
                      <Label htmlFor="contactEmail" className="text-base font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Contact Email *
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        placeholder="hr@yourcompany.com"
                        className={`h-12 ${
                          formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
                        }`}
                        required
                      />
                      {formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail) && (
                        <p className="mt-1 text-xs text-red-600">Please enter a valid email address</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="contactPhone" className="text-base font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Phone *
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        placeholder="+91 12345 67890"
                        className={`h-12 ${
                          formData.contactPhone && !/^[\d\s\+\-\(\)]{10,}$/.test(formData.contactPhone)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200'
                        }`}
                        required
                      />
                      {formData.contactPhone && !/^[\d\s\+\-\(\)]{10,}$/.test(formData.contactPhone) && (
                        <p className="mt-1 text-xs text-red-600">Please enter a valid phone number (at least 10 digits)</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Requirements & Skills - Combined & Dynamic */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 overflow-visible"
                  style={{ overflow: 'visible' }}
                >
                  {/* Requirements with AI */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Job Requirements *
                        </Label>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                          AI-Powered
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => getAiSuggestions('requirements')}
                        disabled={aiLoading.requirements || loadingCompany}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                      >
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        {aiLoading.requirements ? 'Generating…' : 'AI Suggest'}
                      </Button>
                    </div>
                    <Textarea
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder={`List requirements for this ${formData.title || 'position'}...\n\nExample:\n• Bachelor's degree in relevant field\n• 3+ years of experience\n• Strong communication skills`}
                      rows={7}
                      className="resize-none bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                    />
                    <AnimatePresence>
                      {aiSuggestions.requirements?.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="mt-3 space-y-2"
                        >
                          <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-2">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            AI Suggestions based on {companyProfile?.name || 'your company'}:
                          </p>
                          {aiSuggestions.requirements.map((suggestion, idx) => (
                            <motion.button
                              key={idx}
                              type="button"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              onClick={() => applySuggestion('requirements', suggestion)}
                              className="w-full text-left text-sm p-3 rounded-lg border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm hover:shadow-md group"
                            >
                              <span className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 group-hover:animate-pulse flex-shrink-0" />
                                <span className="flex-1">{suggestion}</span>
                              </span>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Skills Section - Optional but encouraged */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-600" />
                          Required Skills
                        </Label>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                          Auto AI
                        </Badge>
                        <span className="text-xs text-slate-500 font-normal hidden sm:inline">(Optional - AI auto-suggests based on your job)</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => getAiSuggestions('skills')}
                        disabled={aiLoading.skills || loadingCompany}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                      >
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        {aiLoading.skills ? 'AI…' : 'AI Suggest Skills'}
                      </Button>
                    </div>
                    
                    {/* Selected Skills */}
                    {formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 p-3 bg-white rounded-lg border border-purple-200">
                        {formData.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200">
                            {skill}
                            <button
                              onClick={() => removeSkill(skill)}
                              className="ml-2 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Popular Skills */}
                    <div className="space-y-2">
                      <p className="text-xs text-slate-600 font-medium">Popular Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {popularSkills.filter(skill => !formData.skills.includes(skill)).map((skill) => (
                          <Button
                            key={skill}
                            variant="outline"
                            size="sm"
                            onClick={() => addSkill(skill)}
                            className="h-9 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                          >
                            + {skill}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* AI Suggested Skills */}
                    <AnimatePresence>
                      {aiSuggestions.skills?.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                        >
                          <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-2">
                            <Sparkles className="h-3 w-3 animate-pulse" />
                            AI Suggested Skills (click to add):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.skills.map((s, idx) => (
                              <motion.div
                                key={s}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                              >
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    addSkill(s);
                                    setAiSuggestions(prev => ({ ...prev, skills: (prev.skills || []).filter(x => x !== s) }));
                                    toast.success(`✨ Added ${s}`, { duration: 1500 });
                                  }}
                                  className="h-9 border-2 border-purple-300 bg-white hover:bg-purple-100 text-purple-700 transition-all shadow-sm"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {s}
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Experience & Salary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-semibold text-slate-900 mb-2 block">
                        Experience Level
                      </Label>
                      <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          sideOffset={8}
                          align="start"
                          avoidCollisions
                          collisionPadding={16}
                          className="z-[10000] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl"
                        >
                          {experienceLevels.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-base font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                        Salary Range <span className="text-xs text-slate-500 font-normal">(Optional)</span>
                        {formData.multipleLocations.length > 0 || formData.location.trim() ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            Location-based
                          </Badge>
                        ) : null}
                      </Label>
                      <Input
                        value={formData.salary}
                        onChange={(e) => handleInputChange('salary', e.target.value)}
                        placeholder="e.g., ₹50,000 - ₹70,000 per month"
                        className="h-12 border-2 border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                      />
                      
                      {/* Location-based Salary Suggestions */}
                      {(formData.multipleLocations.length > 0 || formData.location.trim()) && (
                        <div className="mt-3 space-y-2">
                          {loadingSalarySuggestions ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading salary ranges for your locations...</span>
                            </div>
                          ) : locationSalarySuggestions.length > 0 ? (
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                Average Salary Ranges by Location:
                              </Label>
                              <div className="space-y-1.5">
                                {locationSalarySuggestions.map((suggestion, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 text-sm"
                                  >
                                    <span className="text-slate-700">{suggestion}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Extract salary range from suggestion (handles various formats)
                                        const match = suggestion.match(/(?:[^:]+:\s*)?([₹$£AED]\s?[\d,]+)\s?-\s?([₹$£AED]\s?[\d,]+)/);
                                        if (match) {
                                          const salaryText = `${match[1]} - ${match[2]}/year`;
                                          handleInputChange('salary', salaryText);
                                          toast.success('Salary range applied!', { duration: 1500 });
                                        } else {
                                          // Fallback: try to extract just numbers
                                          const numMatch = suggestion.match(/([\d,]+)\s?-\s?([\d,]+)/);
                                          if (numMatch) {
                                            const currency = formData.country === 'India' || formData.country === 'IN' ? '₹' : 
                                                           formData.country === 'US' || formData.country === 'USA' ? '$' :
                                                           formData.country === 'UAE' || formData.country === 'AE' ? 'AED' :
                                                           formData.country === 'UK' || formData.country === 'GB' ? '£' : '₹';
                                            const salaryText = `${currency}${numMatch[1]} - ${currency}${numMatch[2]}/year`;
                                            handleInputChange('salary', salaryText);
                                            toast.success('Salary range applied!', { duration: 1500 });
                                          }
                                        }
                                      }}
                                      className="ml-2 h-6 px-2 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                                    >
                                      Use
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-slate-500 italic">
                                💡 These are average salary ranges based on your selected locations. Click "Use" to apply.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Location */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 overflow-visible"
                  style={{ overflow: 'visible' }}
                >
                  {/* Enhanced Location Search with Multiple Cities Support */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold text-slate-900 mb-2 block flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Job Location(s) *
                    </Label>
                    
                    {/* Location Search Input */}
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                          <Input
                            type="text"
                            id="location-search"
                            placeholder="Type city name (e.g., Mumbai, Bangalore, Delhi)..."
                            value={formData.location}
                            onChange={(e) => {
                              handleInputChange('location', e.target.value);
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && formData.location.trim()) {
                                e.preventDefault();
                                const location = formData.location.trim();
                                if (!formData.multipleLocations.includes(location)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    multipleLocations: [...prev.multipleLocations, location],
                                    location: ''
                                  }));
                                  toast.success(`Added ${location}`, { duration: 1500 });
                                } else {
                                  toast.error(`${location} already added`, { duration: 1500 });
                                }
                              }
                            }}
                            className="pl-10 h-12 w-full border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            if (formData.location.trim()) {
                              const location = formData.location.trim();
                              if (!formData.multipleLocations.includes(location)) {
                                setFormData(prev => ({
                                  ...prev,
                                  multipleLocations: [...prev.multipleLocations, location],
                                  location: ''
                                }));
                                toast.success(`Added ${location}`, { duration: 1500 });
                              } else {
                                toast.error(`${location} already added`, { duration: 1500 });
                              }
                            }
                          }}
                          disabled={!formData.location.trim()}
                          className="h-12 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white whitespace-nowrap"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        💡 Type a city name and press Enter or click "Add" to add multiple locations
                      </p>
                    </div>

                    {/* Selected Locations Display */}
                    {formData.multipleLocations.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">
                          Selected Locations ({formData.multipleLocations.length}):
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.multipleLocations.map((loc, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-2 border-blue-200 px-3 py-1.5 text-sm font-medium rounded-full"
                            >
                              <MapPin className="h-3 w-3" />
                              <span>{loc}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    multipleLocations: prev.multipleLocations.filter((_, i) => i !== index)
                                  }));
                                  toast.success(`Removed ${loc}`, { duration: 1500 });
                                }}
                                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Cities Quick Add */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">
                        Popular Cities (Click to add):
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'].map((city) => (
                          <Button
                            key={city}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (!formData.multipleLocations.includes(city)) {
                                setFormData(prev => ({
                                  ...prev,
                                  multipleLocations: [...prev.multipleLocations, city]
                                }));
                                toast.success(`Added ${city}`, { duration: 1500 });
                              } else {
                                toast.error(`${city} already added`, { duration: 1500 });
                              }
                            }}
                            disabled={formData.multipleLocations.includes(city)}
                            className="h-9 border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-all"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {city}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Country Selection */}
                    <div className="mt-4">
                      <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                        Country *
                      </Label>
                      <Select 
                        value={formData.country} 
                        onValueChange={(value) => {
                          handleInputChange('country', value);
                          // Clear salary suggestions to recalculate with new country
                          setLocationSalarySuggestions([]);
                        }}
                      >
                        <SelectTrigger className="h-12 border-2 border-slate-300 focus:border-blue-500">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          sideOffset={8}
                          className="z-[10000] min-w-[var(--radix-select-trigger-width)] bg-white border border-slate-200 rounded-xl shadow-xl"
                        >
                          <SelectItem value="India">🇮🇳 India</SelectItem>
                          <SelectItem value="US">🇺🇸 United States</SelectItem>
                          <SelectItem value="UAE">🇦🇪 United Arab Emirates</SelectItem>
                          <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                          <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                          <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                          <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
                          <SelectItem value="SA">🇸🇦 Saudi Arabia</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 mt-1">
                        💡 Country selection affects salary currency and ranges
                      </p>
                    </div>

                    {/* Search Radius */}
                    <div className="mt-4 p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                      <Label className="text-sm font-semibold text-slate-800 mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          Search Radius (km)
                        </span>
                        <span className="text-blue-600 font-bold text-base sm:text-lg">{formData.locationRadiusKm || 25} km</span>
                      </Label>
                      <input
                        type="range"
                        min={5}
                        max={100}
                        step={5}
                        value={formData.locationRadiusKm || 25}
                        onChange={(e) => handleInputChange('locationRadiusKm', parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((formData.locationRadiusKm || 25) - 5) / 95 * 100}%, #cbd5e1 ${((formData.locationRadiusKm || 25) - 5) / 95 * 100}%, #cbd5e1 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>5 km</span>
                        <span>50 km</span>
                        <span>100 km</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 sm:p-5 rounded-xl border border-green-200">
                    <Label className="text-base font-semibold text-slate-900 mb-3 block">
                      Work Type Options
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-all cursor-pointer">
                        <Checkbox
                          id="remote"
                          checked={formData.isRemote}
                          onCheckedChange={(checked) => handleInputChange('isRemote', checked)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <Label htmlFor="remote" className="font-medium cursor-pointer text-sm sm:text-base flex-1">
                          🏠 Remote Work
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-all cursor-pointer">
                        <Checkbox
                          id="hybrid"
                          checked={formData.isHybrid}
                          onCheckedChange={(checked) => handleInputChange('isHybrid', checked)}
                          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <Label htmlFor="hybrid" className="font-medium cursor-pointer text-sm sm:text-base flex-1">
                          🏢 Hybrid Work
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5 rounded-xl border border-amber-200">
                    <Label className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                      Benefits <span className="text-xs text-slate-500 font-normal">(Optional)</span>
                    </Label>
                    <Textarea
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="List the benefits you offer...\n\nExample:\n• Health insurance\n• Flexible hours\n• Professional development"
                      rows={5}
                      className="resize-none bg-white border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-5 rounded-xl border border-purple-200">
                    <Label className="text-base font-semibold text-slate-900 mb-3 block">
                      Job Visibility Settings
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-all">
                        <Checkbox
                          id="urgent"
                          checked={formData.isUrgent}
                          onCheckedChange={(checked) => handleInputChange('isUrgent', checked)}
                          className="mt-0.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor="urgent" className="font-medium cursor-pointer text-sm sm:text-base block">
                            ⚡ Urgent Hiring
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">Mark this as an urgent position needing immediate attention</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-all">
                        <Checkbox
                          id="featured"
                          checked={formData.isFeatured}
                          onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                          className="mt-0.5 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <div className="flex-1">
                          <Label htmlFor="featured" className="font-medium cursor-pointer text-sm sm:text-base block">
                            ⭐ Featured Job Posting
                          </Label>
                          <p className="text-xs text-slate-500 mt-1">Increase visibility with premium placement on search results</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 overflow-visible"
                  style={{ overflow: 'visible' }}
                >
                  <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        {formData.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                        <p className="text-slate-600 text-sm">{formData.description}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Requirements</h4>
                        <p className="text-slate-600 text-sm">{formData.requirements}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-600">Location(s):</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {formData.multipleLocations.length > 0 ? (
                              formData.multipleLocations.map((loc, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {loc}
                                </Badge>
                              ))
                            ) : formData.location ? (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                <MapPin className="h-3 w-3 mr-1" />
                                {formData.location}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 italic">Not specified</span>
                            )}
                          </div>
                          {formData.locationRadiusKm && (
                            <p className="text-xs text-slate-500 mt-1">
                              Search radius: {formData.locationRadiusKm} km
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Country:</span>
                          <p className="text-slate-800">{formData.country || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Type:</span>
                          <p className="text-slate-800">{formData.jobType}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Experience:</span>
                          <p className="text-slate-800">{formData.experienceLevel}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Salary:</span>
                          <p className="text-slate-800 flex items-center gap-2">
                            {formData.salary || 'Not specified'}
                            {formData.salary && formData.country && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                {formData.country}
                              </Badge>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Openings:</span>
                          <p className="text-slate-800">{formData.openings}</p>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-600">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formData.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={clearFormData}
                  className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                
                {currentStep < steps.length ? (
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="w-full sm:w-auto"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Publish Job
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
