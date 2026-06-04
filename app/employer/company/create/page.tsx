"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import EmployerOnboardingCheck from '@/components/employer/EmployerOnboardingCheck';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  Calendar,
  ArrowRight,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Brain,
  Eye,
  Star,
  TrendingUp,
  Target,
  Mail,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ef } from '@/lib/employer-form-ui';
import { EmployerAiSuggestionCards } from '@/components/employer/EmployerAiSuggestionCards';
import { cn } from '@/lib/utils';

interface CompanyFormData {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  founded: string;
  logo?: string;
  // Required address fields for Google JobPosting compliance
  streetAddress: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  benefits?: string[];
  specialties?: string[];
  culture?: string;
  mission?: string;
  vision?: string;
}

const steps = [
  { id: 1, title: 'Basic Info', description: 'Company name and description', icon: Building2 },
  { id: 2, title: 'Details', description: 'Location and industry', icon: MapPin },
  { id: 3, title: 'Culture', description: 'Mission, vision & benefits', icon: Target },
  { id: 4, title: 'Review', description: 'Review and create', icon: Eye }
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Consulting', 'Media', 'Real Estate', 'Marketing & Advertising',
  'Transportation & Logistics', 'Energy & Utilities', 'Government & Public Sector',
  'Non-profit & NGO', 'Entertainment & Sports', 'Food & Beverage',
  'Fashion & Apparel', 'Automotive', 'Construction & Engineering',
  'Legal Services', 'Travel & Tourism', 'Agriculture', 'Telecommunications', 'Other'
];

const companySizes = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'
];

const commonBenefits = [
  'Health Insurance', 'Dental Insurance', 'Vision Insurance', 'Life Insurance',
  '401(k) Matching', 'Paid Time Off', 'Remote Work', 'Flexible Hours',
  'Professional Development', 'Gym Membership', 'Free Meals', 'Stock Options',
  'Transportation Allowance', 'Childcare Support', 'Mental Health Support'
];

export default function CreateCompanyPage() {
  const router = useRouter();

  // Clean, professional dropdown styles - matching company form pattern
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'company-dropdown-styles';
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
    const existingStyle = document.getElementById('company-dropdown-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    return () => {
      const styleElement = document.getElementById('company-dropdown-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiGeneratingField, setAiGeneratingField] = useState<string | null>(null);
  const [aiSuggestionPanels, setAiSuggestionPanels] = useState<Record<string, string[]>>({});
  const [checkingExistingCompany, setCheckingExistingCompany] = useState(true);
  
  // Refs for debouncing dynamic AI suggestions in company form
  const companyNameDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const companyDescriptionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const industryDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const missionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const visionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    industry: '',
    size: '',
    founded: '',
    // Required address fields for Google JobPosting compliance
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    socialLinks: {},
    benefits: [],
    specialties: [],
    culture: '',
    mission: '',
    vision: ''
  });

  // Redirect if not authenticated or not an employer
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/employer/company/create');
    } else if (session && session.user.role !== 'employer') {
      router.push('/auth/role-selection');
    }
  }, [status, session, router]);

  // Check if user already has a company
  useEffect(() => {
    const checkExistingCompany = async () => {
      if (status === 'authenticated' && session?.user?.role === 'employer') {
        try {
          const response = await fetch('/api/employer/company-profile', {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.company) {
              // User already has a company, redirect to dashboard
              toast.info('You already have a company profile!', {
                description: `Your company "${data.data.company.name}" is already set up. Redirecting to dashboard...`,
                duration: 3000,
              });
              setTimeout(() => {
                router.push('/employer/dashboard');
              }, 2000);
            }
          }
        } catch (error) {
          console.error('Error checking existing company:', error);
          // If there's an error checking, we'll allow the form to proceed
          // This handles cases where the API might be temporarily unavailable
        } finally {
          setCheckingExistingCompany(false);
        }
      } else {
        setCheckingExistingCompany(false);
      }
    };

    checkExistingCompany();
  }, [status, session, router]);

  // REMOVED: Auto-generation on industry selection - user must manually request AI suggestions

  // REMOVED: Auto-generation for mission/vision - user must manually request AI suggestions

  // Debounced AI suggestions as user types (for description, mission, vision)
  useEffect(() => {
    if (formData.description && formData.description.trim().length >= 20 && formData.name) {
      if (companyDescriptionDebounceRef.current) clearTimeout(companyDescriptionDebounceRef.current);
      
      companyDescriptionDebounceRef.current = setTimeout(() => {
        // Don't auto-generate, just log that user is typing
        // User can click "AI Generate Description" button when ready
        console.log('📝 User is typing description, AI suggestions available on button click');
      }, 2000);
    }

    return () => {
      if (companyDescriptionDebounceRef.current) clearTimeout(companyDescriptionDebounceRef.current);
    };
  }, [formData.description, formData.name]);

  const handleInputChange = (field: keyof CompanyFormData, value: string | string[]) => {
    console.log(`Updating field ${field} with value:`, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log("Updated form data:", newData);
      return newData;
    });
  };

  const handleBenefitToggle = (benefit: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits?.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...(prev.benefits || []), benefit]
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties?.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...(prev.specialties || []), specialty]
    }));
  };

  const setPanelSuggestions = (field: string, items: string[]) => {
    const cleaned = items.map((s) => s?.trim()).filter(Boolean) as string[];
    if (!cleaned.length) return;
    setAiSuggestionPanels((prev) => {
      const merged = [...(prev[field] || [])];
      cleaned.forEach((item) => {
        if (!merged.includes(item)) merged.push(item);
      });
      return { ...prev, [field]: merged.slice(-6) };
    });
  };

  const appendCultureSuggestion = (snippet: string) => {
    const text = snippet.trim();
    if (!text) return;
    setFormData((prev) => {
      const cur = (prev.culture || '').trim();
      if (cur && cur.includes(text)) return prev;
      return { ...prev, culture: cur ? `${cur}\n\n${text}` : text };
    });
  };

  const renderSuggestionPanel = (
    field: string,
    subtitle: string,
    onSelect: (text: string) => void
  ) => (
    <EmployerAiSuggestionCards
      items={aiSuggestionPanels[field] || []}
      companyName={formData.name || undefined}
      subtitle={subtitle}
      onSelect={onSelect}
    />
  );

  const isAiGenerating = aiGeneratingField !== null;

  // AI suggestions → panels first; user clicks a card to apply (no silent overwrite)
  const generateAIContent = async (
    type: 'description' | 'benefits' | 'specialties' | 'mission' | 'vision' | 'culture',
    showToast: boolean = true,
    userInput?: string
  ) => {
    if (!formData.name) {
      if (showToast) toast.error('Please enter company name first');
      return;
    }

    if (
      (type === 'benefits' ||
        type === 'specialties' ||
        type === 'mission' ||
        type === 'vision' ||
        type === 'culture') &&
      !formData.industry
    ) {
      if (showToast) toast.error('Please select an industry first for better suggestions');
      return;
    }

    setAiGeneratingField(type);
    try {
      let currentInput = userInput;
      if (!currentInput) {
        switch (type) {
          case 'description':
            currentInput = formData.description || '';
            break;
          case 'mission':
            currentInput = formData.mission || '';
            break;
          case 'vision':
            currentInput = formData.vision || '';
            break;
          case 'culture':
            currentInput = formData.culture || '';
            break;
          case 'specialties':
            currentInput = formData.specialties?.join(', ') || '';
            break;
        }
      }

      const response = await fetch('/api/ai/company-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          companyName: formData.name,
          ...(formData.industry?.trim() ? { industry: formData.industry.trim() } : {}),
          existingData: formData,
          userInput: currentInput,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.suggestions?.length) {
          setPanelSuggestions(type, data.suggestions);
          if (showToast) toast.success('AI suggestions ready — click one to use');
        } else if (data.suggestion?.trim()) {
          setPanelSuggestions(type, [data.suggestion]);
          if (showToast) toast.success('AI suggestion ready — click to use');
        } else if (showToast) {
          toast.error('No suggestions returned. Try again.');
        }
      } else {
        const errorData = await response.json();
        if (showToast) toast.error(errorData.error || 'Failed to generate AI content');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      if (showToast) toast.error('Network error: Failed to generate AI content');
    } finally {
      setAiGeneratingField(null);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      // Check if current step is valid before proceeding
      if (!validateStep(currentStep)) {
        toast.error('Please complete all required fields before proceeding', {
          description: 'Fill out all required fields in the current step.',
          duration: 3000,
        });
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidEmail = formData.email.trim() !== '' && emailRegex.test(formData.email.trim());
        // Phone validation (at least 10 digits)
        const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
        const isValidPhone = formData.phone.trim() !== '' && phoneRegex.test(formData.phone.trim());
        
        return formData.name.trim() !== '' && 
               formData.description.trim() !== '' &&
               isValidEmail &&
               isValidPhone;
      case 2:
        return formData.location.trim() !== '' && 
               formData.industry !== '' && 
               formData.size !== '' &&
               formData.streetAddress.trim() !== '' &&
               formData.city.trim() !== '' &&
               formData.postalCode.trim() !== '';
      case 3:
        return true; // Culture step is optional
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data:", formData);
    console.log("Current step:", currentStep);
    console.log("Session status:", status);
    console.log("Session data:", session);
    console.log("User role:", session?.user?.role);
    console.log("User ID:", session?.user?.id);
    console.log("All cookies:", document.cookie);
    console.log("Validation step 1:", validateStep(1));
    console.log("Validation step 2:", validateStep(2));
    
    if (!validateStep(1) || !validateStep(2)) {
      console.log("Validation failed - showing error");
      toast.error('Please complete all required fields in steps 1 and 2', {
        description: 'Company name, description, location, industry, and size are required.',
        duration: 5000,
      });
      return;
    }

    // Check if user is authenticated
    if (status !== 'authenticated' || !session?.user) {
      console.log("User not authenticated - redirecting to sign in");
      toast.error('Please sign in to create a company');
      router.push('/auth/signin?redirect=/employer/company/create');
      return;
    }

    // Check if user is an employer
    if (session.user.role !== 'employer') {
      console.log("User is not an employer - redirecting to role selection");
      toast.error('Please select employer role to create a company');
      router.push('/auth/role-selection');
      return;
    }

    console.log("Validation passed - starting API call");
    setLoading(true);
    
    try {
      // Get session token from cookies
      console.log("Making API call to /api/employer/company-profile");
      console.log("Request body:", JSON.stringify(formData, null, 2));
      
      const response = await fetch("/api/employer/company-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      console.log("Response received - Status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        
        // Handle specific error cases
        if (response.status === 400) {
          try {
            const errorData = JSON.parse(errorText);
            console.error("Parsed error data:", errorData);
            
            if (errorData.error && errorData.error.includes("Company already exists")) {
              const companyName = errorData.existingCompany?.name || 'your company';
              toast.error('Company Profile Already Exists!', {
                description: `You already have a company profile for "${companyName}". Please use the company dashboard to manage your existing profile.`,
                duration: 5000,
                action: {
                  label: 'Go to Dashboard',
                  onClick: () => router.push('/employer/dashboard')
                }
              });
              setTimeout(() => {
                router.push('/employer/dashboard');
              }, 3000);
              return;
            } else if (errorData.missingFields && Array.isArray(errorData.missingFields)) {
              // Show which fields are missing
              const missingFieldsList = errorData.missingFields.join(', ');
              toast.error('Missing Required Fields!', {
                description: `Please fill in: ${missingFieldsList}`,
                duration: 8000,
              });
              
              // Navigate to the appropriate step
              if (errorData.missingFields.includes('name') || errorData.missingFields.includes('description') || 
                  errorData.missingFields.includes('location') || errorData.missingFields.includes('industry') || 
                  errorData.missingFields.includes('size')) {
                setCurrentStep(1);
              } else if (errorData.missingFields.includes('streetAddress') || errorData.missingFields.includes('city') || 
                         errorData.missingFields.includes('postalCode')) {
                setCurrentStep(2);
              }
              
              setLoading(false);
              return;
            } else if (errorData.error) {
              toast.error('Validation Error!', {
                description: errorData.error,
                duration: 6000,
              });
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
            toast.error(`HTTP ${response.status} Error`, {
              description: errorText,
              duration: 5000,
            });
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success && data.data && data.data.company) {
        console.log("Company created successfully - showing success message");
        const companyName = data.data.company.name;
        toast.success('🎉 Company Created Successfully!', {
          description: `"${companyName}" is now ready to attract top talent. You can start posting jobs!`,
          duration: 5000,
          action: {
            label: 'Go to Dashboard',
            onClick: () => router.push('/employer/dashboard')
          }
        });
        
        console.log("Setting redirect timeout");
        // Redirect to employer dashboard
        setTimeout(() => {
          console.log("Redirecting to /employer/dashboard");
          window.location.href = "/employer/dashboard";
        }, 2000);
      } else {
        console.error("API returned error:", data.error);
        toast.error(`Failed to create company: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Fetch error occurred:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Show more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Missing required fields')) {
        toast.error('Missing Required Fields!', {
          description: errorMessage,
          duration: 5000,
        });
      } else {
        toast.error("Failed to create company. Please check all fields and try again.", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  if (status === 'loading' || checkingExistingCompany) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {checkingExistingCompany ? 'Checking for existing company...' : 'Loading company creation form...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (session && session.user.role !== 'employer') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to role selection...</p>
        </div>
      </div>
    );
  }

  return (
    <EmployerOnboardingCheck requiredAction="none">
      <div className={cn('mobile-job-form py-4 sm:py-8', ef.pageBgSoft)}>
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link 
            href="/employer/options" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Employer Options</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2 px-2">
            <div className={ef.headerIcon}>
              <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight">
                  Company Setup
                </h1>
                <span className={ef.headerBadge}>AI Powered</span>
              </div>
              <p className="text-[#64748B] text-sm sm:text-base font-medium">
                Employer profile — attract top talent worldwide
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="mb-6 sm:mb-8 px-2">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                      ${currentStep >= step.id 
                        ? `${ef.stepActive} transform scale-105 sm:scale-110` 
                        : ef.stepInactive
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

        {/* Form Content */}
        <Card className={cn(ef.mainCard, 'mx-2 sm:mx-0')}>
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10">
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
                  <div className={ef.sectionCard}>
                  <div className="text-center sm:text-left mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className={cn(ef.sectionIconWrap, 'w-14 h-14 sm:w-16 sm:h-16 mx-auto sm:mx-0 shrink-0')}>
                      <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div>
                    <h2 className={ef.sectionTitle}>Basic Company Information</h2>
                    <p className={ef.sectionDesc}>Tell us about your company</p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-sm sm:text-base font-bold text-gray-900">
                        Company Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., TechCorp Solutions"
                        className={cn('mt-1 h-10 sm:h-12 text-sm sm:text-lg', ef.input)}
                        required
                      />
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                        <Label htmlFor="description" className="text-sm sm:text-base font-bold text-gray-900">
                          Company Description *
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('description')}
                          disabled={isAiGenerating || !formData.name.trim()}
                          className={cn(ef.aiButton, 'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium w-full sm:w-auto')}
                        >
                          {aiGeneratingField === 'description' ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                              <span className="hidden sm:inline">Generating...</span>
                              <span className="sm:hidden">AI Generate</span>
                            </>
                          ) : (
                            <>
                              <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">AI Generate Description</span>
                              <span className="sm:hidden">AI Generate</span>
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your company, mission, and what makes you unique..."
                        rows={3}
                        className={cn('mt-1 text-sm sm:text-lg', ef.textarea)}
                        required
                      />
                      {renderSuggestionPanel(
                        'description',
                        'Click a card to apply to your description',
                        (s) => handleInputChange('description', s)
                      )}
                      <div className={cn('mt-2', ef.aiHint)}>
                        <p className="flex items-center gap-2">
                          <Brain className="h-4 w-4 animate-pulse" />
                          <span>Click AI Generate, then pick a suggestion card — your text is only updated when you choose one.</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <Label htmlFor="email" className="text-sm sm:text-base font-bold text-gray-900">
                          Company Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="contact@yourcompany.com"
                          className={`mt-1 h-10 sm:h-12 text-sm sm:text-lg border-2 ${
                            formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          } rounded-lg shadow-sm`}
                          required
                        />
                        {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                          <p className="mt-1 text-xs text-red-600">Please enter a valid email address</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm sm:text-base font-bold text-gray-900">
                          Company Phone *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+91 12345 67890"
                          className={`mt-1 h-10 sm:h-12 text-sm sm:text-lg border-2 ${
                            formData.phone && !/^[\d\s\+\-\(\)]{10,}$/.test(formData.phone)
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                          } rounded-lg shadow-sm`}
                          required
                        />
                        {formData.phone && !/^[\d\s\+\-\(\)]{10,}$/.test(formData.phone) && (
                          <p className="mt-1 text-xs text-red-600">Please enter a valid phone number (at least 10 digits)</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website" className="text-sm sm:text-base font-bold text-gray-900">
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="mt-1 h-10 sm:h-12 text-sm sm:text-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
                      />
                    </div>
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
                  <div className={ef.sectionCard}>
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className={cn(ef.sectionIconWrap, 'w-14 h-14 sm:w-16 sm:h-16 mx-auto sm:mx-0 shrink-0')}>
                      <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="text-center sm:text-left">
                    <h2 className={ef.sectionTitle}>Company Details</h2>
                    <p className={ef.sectionDesc}>Location, industry & address</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Company Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                      <div className="space-y-6">
                        <div className="relative">
                          <Label htmlFor="location" className="text-sm sm:text-base font-bold text-gray-900 mb-2 block">
                            Location *
                          </Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            placeholder="e.g., Bangalore, India"
                            className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200"
                            required
                          />
                        </div>

                        <div className="relative">
                          <Label htmlFor="industry" className="text-sm sm:text-base font-bold text-gray-900 mb-2 block">
                            Industry *
                          </Label>
                          <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                            <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200">
                              <SelectValue placeholder="Select your industry" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 bg-white border border-gray-200 rounded-xl shadow-xl">
                              {industries.map((industry) => (
                                <SelectItem 
                                  key={industry} 
                                  value={industry}
                                  className="py-3 px-4 text-base hover:bg-blue-50 focus:bg-blue-100 cursor-pointer transition-colors duration-150"
                                >
                                  <div className="flex items-center gap-3">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">{industry}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="relative">
                          <Label htmlFor="size" className="text-sm sm:text-base font-bold text-gray-900 mb-2 block">
                            Company Size *
                          </Label>
                          <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                            <SelectTrigger className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200">
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60 bg-white border border-gray-200 rounded-xl shadow-xl">
                              {companySizes.map((size) => (
                                <SelectItem 
                                  key={size} 
                                  value={size}
                                  className="py-3 px-4 text-base hover:bg-blue-50 focus:bg-blue-100 cursor-pointer transition-colors duration-150"
                                >
                                  <div className="flex items-center gap-3">
                                    <Users className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">{size} employees</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="relative">
                          <Label htmlFor="founded" className="text-sm sm:text-base font-bold text-gray-900 mb-2 block">
                            Founded Year
                          </Label>
                          <Input
                            id="founded"
                            type="number"
                            value={formData.founded}
                            onChange={(e) => handleInputChange('founded', e.target.value)}
                            placeholder="e.g., 2020"
                            min="1900"
                            max={new Date().getFullYear()}
                            className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Details - Required for Google JobPosting Compliance */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Company Address *</h3>
                        <Badge variant="secondary" className="bg-blue-200 text-blue-800 text-xs">
                          Required for Google Job Listings
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-6">
                        Complete address information is required for Google job posting compliance and better job visibility.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="relative">
                            <Label htmlFor="streetAddress" className="text-sm font-bold text-gray-900 mb-2 block">
                              Street Address *
                            </Label>
                            <Input
                              id="streetAddress"
                              value={formData.streetAddress}
                              onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                              placeholder="e.g., 123 Tech Park, Sector 5"
                              className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200"
                              required
                            />
                          </div>

                          <div className="relative">
                            <Label htmlFor="city" className="text-sm font-bold text-gray-900 mb-2 block">
                              City *
                            </Label>
                            <Input
                              id="city"
                              value={formData.city}
                              onChange={(e) => handleInputChange('city', e.target.value)}
                              placeholder="e.g., Bangalore"
                              className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="relative">
                            <Label htmlFor="state" className="text-sm font-bold text-gray-900 mb-2 block">
                              State/Province
                            </Label>
                            <Input
                              id="state"
                              value={formData.state}
                              onChange={(e) => handleInputChange('state', e.target.value)}
                              placeholder="e.g., Karnataka"
                              className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200"
                            />
                          </div>

                          <div className="relative">
                            <Label htmlFor="postalCode" className="text-sm font-bold text-gray-900 mb-2 block">
                              Postal Code *
                            </Label>
                            <Input
                              id="postalCode"
                              value={formData.postalCode}
                              onChange={(e) => handleInputChange('postalCode', e.target.value)}
                              placeholder="e.g., 560001"
                              className="h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl shadow-sm transition-all duration-200"
                              required
                            />
                          </div>
                        </div>
                      </div>
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
                  <div className={ef.sectionCard}>
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className={cn(ef.sectionIconWrap, 'w-14 h-14 sm:w-16 sm:h-16 mx-auto sm:mx-0 shrink-0')}>
                      <Target className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                    </div>
                    <div className="text-center sm:text-left">
                    <h2 className={ef.sectionTitle}>Company Culture & Values</h2>
                    <p className={ef.sectionDesc}>Mission, vision, culture & benefits</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Mission & Vision */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="mission" className="text-base font-bold text-gray-900">
                              Mission Statement
                            </Label>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs hidden sm:inline-flex">
                              AI-Powered
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateAIContent('mission', true)}
                            disabled={isAiGenerating || !formData.name.trim() || !formData.industry}
                            className={cn(ef.aiButton, 'px-4 py-2 text-sm font-medium w-full sm:w-auto')}
                          >
                            {aiGeneratingField === 'mission' ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                <span className="hidden sm:inline">Generating...</span>
                                <span className="sm:hidden">AI Generate</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Regenerate Mission</span>
                                <span className="sm:hidden">Regenerate</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <Textarea
                          id="mission"
                          value={formData.mission || ''}
                          onChange={(e) => handleInputChange('mission', e.target.value)}
                          placeholder="AI will automatically generate this when you select an industry..."
                          rows={4}
                          className={cn('text-base', ef.textarea)}
                        />
                        {renderSuggestionPanel(
                          'mission',
                          'AI mission suggestions (click to use):',
                          (s) => handleInputChange('mission', s)
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="vision" className="text-base font-bold text-gray-900">
                              Vision Statement
                            </Label>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs hidden sm:inline-flex">
                              AI-Powered
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateAIContent('vision', true)}
                            disabled={isAiGenerating || !formData.name.trim() || !formData.industry}
                            className={cn(ef.aiButton, 'px-4 py-2 text-sm font-medium w-full sm:w-auto')}
                          >
                            {aiGeneratingField === 'vision' ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                <span className="hidden sm:inline">Generating...</span>
                                <span className="sm:hidden">AI Generate</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Regenerate Vision</span>
                                <span className="sm:hidden">Regenerate</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <Textarea
                          id="vision"
                          value={formData.vision || ''}
                          onChange={(e) => handleInputChange('vision', e.target.value)}
                          placeholder="AI will automatically generate this when you select an industry..."
                          rows={4}
                          className={cn('text-base', ef.textarea)}
                        />
                        {renderSuggestionPanel(
                          'vision',
                          'AI vision suggestions (click to use):',
                          (s) => handleInputChange('vision', s)
                        )}
                      </div>
                    </div>

                    {/* Company Culture */}
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <Label htmlFor="culture" className="text-base font-bold text-gray-900 block">
                          Company Culture
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('culture', true)}
                          disabled={isAiGenerating || !formData.name.trim() || !formData.industry}
                          className={cn(ef.aiButton, 'px-4 py-2 text-sm font-medium w-full sm:w-auto')}
                        >
                          {aiGeneratingField === 'culture' ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              AI Culture Suggestions
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="culture"
                        value={formData.culture || ''}
                        onChange={(e) => handleInputChange('culture', e.target.value)}
                        placeholder="Describe your company culture, values, and work environment..."
                        rows={4}
                        className="text-base border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl shadow-sm transition-all duration-200 resize-none"
                      />
                      {renderSuggestionPanel(
                        'culture',
                        'AI culture suggestions (click to append):',
                        appendCultureSuggestion
                      )}
                    </div>

                    {/* Employee Benefits */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-bold text-gray-900">
                            Employee Benefits
                          </Label>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs hidden sm:inline-flex">
                            AI-Powered
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('benefits', true)}
                          disabled={isAiGenerating || !formData.industry}
                          className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 hover:from-green-700 hover:to-blue-700 shadow-lg px-4 py-2 text-sm font-medium w-full sm:w-auto transition-all duration-200 hover:shadow-xl"
                        >
                          {aiGeneratingField === 'benefits' ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              Regenerate Benefits
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {commonBenefits.map((benefit) => (
                          <Button
                            key={benefit}
                            type="button"
                            variant={formData.benefits?.includes(benefit) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleBenefitToggle(benefit)}
                            className={cn(
                              'h-12 text-sm font-medium rounded-full px-4',
                              ef.benefitChip,
                              formData.benefits?.includes(benefit) ? ef.benefitChipOn : ef.benefitChipOff
                            )}
                          >
                            {formData.benefits?.includes(benefit) && <CheckCircle className="h-4 w-4 mr-2" />}
                            <span className="truncate">{benefit}</span>
                          </Button>
                        ))}
                      </div>
                      {renderSuggestionPanel(
                        'benefits',
                        'AI benefit suggestions (click to add):',
                        (s) => {
                          if (!formData.benefits?.includes(s)) handleBenefitToggle(s);
                        }
                      )}
                      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <Brain className="h-4 w-4 animate-pulse" />
                          <span>Use Regenerate Benefits for AI cards, or click preset benefits below. Selected benefits stay until you remove them.</span>
                        </p>
                      </div>
                    </div>

                    {/* Company Specialties */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-base font-bold text-gray-900">
                            Company Specialties
                          </Label>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs hidden sm:inline-flex">
                            AI-Powered
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('specialties', true)}
                          disabled={isAiGenerating || !formData.industry}
                          className={cn(ef.aiButton, 'px-4 py-2 text-sm font-medium w-full sm:w-auto')}
                        >
                          {aiGeneratingField === 'specialties' ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              Regenerate Specialties
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* Selected Specialties */}
                      {formData.specialties && formData.specialties.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-700">Selected Specialties:</h4>
                          <div className="flex flex-wrap gap-2">
                            {formData.specialties.map((specialty, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-300 px-3 py-2 text-sm font-medium rounded-full"
                              >
                                <Target className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{specialty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleSpecialtyToggle(specialty)}
                                  className="ml-1 hover:text-red-600 hover:bg-red-100 rounded-full p-0.5 transition-colors duration-150"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Add New Specialty - Manual Input */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            id="specialty-input"
                            placeholder="Type a specialty and press Enter or click Add..."
                            className="flex-1 h-10 text-sm border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.target as HTMLInputElement;
                                const value = input.value.trim();
                                if (value) {
                                  handleSpecialtyToggle(value);
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById('specialty-input') as HTMLInputElement;
                              if (input && input.value.trim()) {
                                handleSpecialtyToggle(input.value.trim());
                                input.value = '';
                              }
                            }}
                            className="h-10 px-4 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-colors"
                          >
                            Add
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          💡 Tip: You can manually type specialties or use AI suggestions. Both work together!
                        </p>
                      </div>
                      
                      {renderSuggestionPanel(
                        'specialties',
                        'AI specialty suggestions (click to add):',
                        (s) => {
                          if (!formData.specialties?.includes(s)) handleSpecialtyToggle(s);
                        }
                      )}
                      <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                          <Brain className="h-4 w-4 animate-pulse" />
                          <span>Regenerate for AI cards, or type your own specialties. Click a card to add without replacing existing ones.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                  style={{ overflow: 'visible' }}
                >
                  <div className="text-center mb-6 sm:mb-8">
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                      <Eye className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 px-2">
                      Review Your Company
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-gray-700 font-medium px-4">
                      Everything looks good? Let's create your company profile!
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Company Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-6 md:p-8 border-2 border-blue-300 shadow-lg">
                      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg mx-auto sm:mx-0">
                          <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h3 className="font-bold text-lg sm:text-xl md:text-2xl text-gray-900 mb-2 sm:mb-3">{formData.name}</h3>
                          <p className="text-gray-800 leading-relaxed text-sm sm:text-base md:text-lg mb-3 sm:mb-4">{formData.description}</p>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                            <Badge variant="secondary" className="bg-blue-200 text-blue-800 font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">
                              {formData.industry}
                            </Badge>
                            <Badge variant="outline" className="border-green-400 text-green-800 bg-green-50 font-bold text-xs sm:text-sm px-2 sm:px-3 py-1">
                              {formData.size} employees
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Details */}
                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-lg">
                        <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          Location & Details
                        </h4>
                        <div className="space-y-3 text-base">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-gray-800">{formData.location}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-800">{formData.size} employees</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <span className="font-medium text-gray-800">Founded {formData.founded || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <a href={`mailto:${formData.email}`} className="font-medium text-blue-700 hover:text-blue-800 hover:underline">
                              {formData.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-green-600" />
                            <a href={`tel:${formData.phone}`} className="font-medium text-gray-800 hover:text-blue-600">
                              {formData.phone}
                            </a>
                          </div>
                          {formData.website && (
                            <div className="flex items-center gap-3">
                              <Globe className="h-5 w-5 text-blue-600" />
                              <a href={formData.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 hover:text-blue-800 hover:underline">
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-lg">
                        <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <MapPin className="h-5 w-5 text-green-600" />
                          </div>
                          Company Address
                        </h4>
                        <div className="space-y-3 text-base">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-gray-800">{formData.streetAddress}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-gray-800">{formData.city}{formData.state ? `, ${formData.state}` : ''}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <span className="font-medium text-gray-800">Postal Code: {formData.postalCode}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-gray-800">Country: {formData.country || 'IN'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Mission & Vision */}
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-lg">
                        <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="h-5 w-5 text-purple-600" />
                          </div>
                          Mission & Vision
                        </h4>
                        <div className="space-y-4 text-base">
                          {formData.mission && (
                            <div>
                              <p className="font-bold text-gray-800 mb-2">Mission:</p>
                              <p className="text-gray-700 leading-relaxed">{formData.mission}</p>
                            </div>
                          )}
                          {formData.vision && (
                            <div>
                              <p className="font-bold text-gray-800 mb-2">Vision:</p>
                              <p className="text-gray-700 leading-relaxed">{formData.vision}</p>
                            </div>
                          )}
                          {!formData.mission && !formData.vision && (
                            <p className="text-gray-500 italic">No mission or vision provided</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Benefits & Specialties */}
                    {(formData.benefits?.length || formData.specialties?.length) && (
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-lg">
                        <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <Star className="h-5 w-5 text-yellow-600" />
                          </div>
                          Benefits & Specialties
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {formData.benefits?.length && (
                            <div>
                              <p className="font-bold text-gray-800 mb-3">Employee Benefits:</p>
                              <div className="flex flex-wrap gap-2">
                                {formData.benefits.map((benefit, index) => (
                                  <Badge key={index} variant="secondary" className="text-sm font-medium bg-blue-100 text-blue-800 px-3 py-1">
                                    {benefit}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {formData.specialties?.length && (
                            <div>
                              <p className="font-bold text-gray-800 mb-3">Company Specialties:</p>
                              <div className="flex flex-wrap gap-2">
                                {formData.specialties.map((specialty, index) => (
                                  <Badge key={index} variant="outline" className="text-sm font-medium border-purple-400 text-purple-800 bg-purple-50 px-3 py-1">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Company Culture */}
                    {formData.culture && (
                      <div className="bg-white rounded-xl p-6 border-2 border-gray-300 shadow-lg">
                        <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          </div>
                          Company Culture
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-base">{formData.culture}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 sm:mt-10">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold border-2 border-gray-300 hover:border-gray-400 bg-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl transform hover:scale-105 transition-all duration-200 rounded-xl"
                >
                  Next
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    console.log("=== CREATE BUTTON CLICKED ===");
                    console.log("Button disabled:", loading || !validateStep(1) || !validateStep(2));
                    console.log("Loading state:", loading);
                    console.log("Current form data:", formData);
                    handleSubmit();
                  }}
                  disabled={loading || !validateStep(1) || !validateStep(2)}
                  className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-2xl transform hover:scale-105 transition-all duration-200 rounded-xl"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span className="hidden sm:inline">Creating Company...</span>
                      <span className="sm:hidden">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      <span className="hidden sm:inline">Create Company</span>
                      <span className="sm:hidden">Create</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </EmployerOnboardingCheck>
  );
}
