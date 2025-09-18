"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Upload,
  Edit,
  Trash2,
  Save,
  Eye,
  Star,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface CompanyFormData {
  name: string;
  description: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  founded: string;
  logo?: string;
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

const aiSuggestions = {
  description: "AI can help generate a compelling company description based on your industry and mission.",
  benefits: "Based on your industry, here are popular benefits that attract top talent.",
  specialties: "AI can suggest relevant specialties based on your company name and industry."
};

export default function CreateCompanyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '',
    founded: '',
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

  // AI-powered content generation
  const generateAIContent = async (type: 'description' | 'benefits' | 'specialties' | 'mission' | 'vision') => {
    if (!formData.name) {
      toast.error('Please enter company name first');
      return;
    }

    if ((type === 'benefits' || type === 'specialties' || type === 'mission' || type === 'vision') && !formData.industry) {
      toast.error('Please select an industry first for better suggestions');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/company-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          companyName: formData.name,
          industry: formData.industry || 'Technology', // Default fallback
          existingData: formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        switch (type) {
          case 'description':
            setFormData(prev => ({ ...prev, description: data.suggestion }));
            toast.success('🎉 AI-generated description added!');
            break;
          case 'benefits':
            setFormData(prev => ({ ...prev, benefits: data.suggestions }));
            toast.success('🎉 AI-suggested benefits added!');
            break;
          case 'specialties':
            setFormData(prev => ({ ...prev, specialties: data.suggestions }));
            toast.success('🎉 AI-suggested specialties added!');
            break;
          case 'mission':
            setFormData(prev => ({ ...prev, mission: data.suggestion }));
            toast.success('🎉 AI-generated mission statement added!');
            break;
          case 'vision':
            setFormData(prev => ({ ...prev, vision: data.suggestion }));
            toast.success('🎉 AI-generated vision statement added!');
            break;
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate AI content');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Network error: Failed to generate AI content');
    } finally {
      setAiGenerating(false);
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
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 2:
        return formData.location.trim() !== '' && formData.industry !== '' && formData.size !== '';
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

    console.log("Validation passed - starting API call");
    setLoading(true);
    
    try {
      // Get session token from cookies
      const token = document.cookie
        .split("; ")
        .find(row => row.startsWith("next-auth.session-token="))
        ?.split("=")[1];
      
      console.log("Session token found:", !!token);
      console.log("Making API call to /api/company/profile");
      console.log("Request body:", JSON.stringify(formData, null, 2));
      
      const response = await fetch("/api/company/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      console.log("Response received - Status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        console.log("Company created successfully - showing success message");
        toast.success('🎉 Company created successfully! You can now start posting jobs.', {
          description: 'Your company profile is ready to attract top talent.',
          duration: 5000,
        });
        
        console.log("Setting redirect timeout");
        // Redirect to employer dashboard
        setTimeout(() => {
          console.log("Redirecting to /employer/dashboard");
          window.location.href = "/employer/dashboard";
        }, 2000);
      } else {
        console.error("API returned error:", data.error);
        toast.error(`Failed to create company: ${data.error}`);
      }
    } catch (error) {
      console.error("Fetch error occurred:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      toast.error("Failed to create company. Please try again.");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };
  if (status === 'loading') {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company creation form...</p>
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
    <>
      <div id="select-portal" className="fixed inset-0 pointer-events-none z-[9998]" />
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen py-4 sm:py-8">
      <style jsx global>{`
        [data-radix-popper-content-wrapper] {
          z-index: 9999 !important;
          position: fixed !important;
        }
        [data-radix-select-content] {
          z-index: 9999 !important;
          position: relative !important;
          transform: none !important;
        }
        [data-radix-select-viewport] {
          z-index: 9999 !important;
        }
        [data-radix-select-content] {
          z-index: 9999 !important;
          position: relative !important;
        }
        .select-content {
          z-index: 9999 !important;
        }
        /* Ensure dropdowns are always visible */
        [role="listbox"] {
          z-index: 9999 !important;
        }
        /* Fix for any container overflow issues */
        .overflow-hidden {
          overflow: visible !important;
        }
        /* Ensure proper stacking context */
        .relative {
          z-index: 1;
        }
        /* Force dropdown visibility */
        [data-state="open"] {
          z-index: 9999 !important;
        }
        /* Additional dropdown visibility fixes */
        [data-radix-popper-content-wrapper][data-side="bottom"] {
          z-index: 9999 !important;
          position: fixed !important;
        }
        [data-radix-select-content][data-side="bottom"] {
          z-index: 9999 !important;
        }
        /* Ensure dropdown appears above all other elements */
        .radix-select-content {
          z-index: 9999 !important;
        }
        /* Fix for mobile and tablet visibility */
        @media (max-width: 768px) {
          [data-radix-popper-content-wrapper] {
            z-index: 9999 !important;
            position: fixed !important;
            max-width: calc(100vw - 32px) !important;
          }
        }
        /* Additional specific fixes for Radix Select */
        [data-radix-select-content][data-state="open"] {
          z-index: 9999 !important;
          position: fixed !important;
        }
        [data-radix-select-viewport] {
          z-index: 9999 !important;
        }
        /* Ensure dropdown items are visible */
        [data-radix-select-item] {
          z-index: 9999 !important;
        }
        /* Fix for any parent container clipping */
        .overflow-hidden {
          overflow: visible !important;
        }
        /* Ensure proper stacking context for all dropdown elements */
        [data-radix-popper-content-wrapper],
        [data-radix-select-content],
        [data-radix-select-viewport],
        [data-radix-select-item] {
          z-index: 9999 !important;
        }
      `}</style>
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 max-w-4xl relative" style={{ overflow: 'visible' }}>
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 px-2">
            Create Your Company Profile
          </h1>
          <p className="text-gray-600 text-base sm:text-lg px-4">
            Build your company's presence and start attracting top talent
          </p>
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

        {/* Form Content */}
        <Card className="shadow-2xl border-2 border-gray-200 bg-white/98 backdrop-blur-sm mx-2 sm:mx-0 relative z-10" style={{ overflow: 'visible' }}>
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10 relative z-10" style={{ overflow: 'visible' }}>
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
                      <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Basic Company Information</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Tell us about your company</p>
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
                        className="mt-1 h-10 sm:h-12 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
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
                          disabled={aiGenerating || !formData.name.trim()}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium w-full sm:w-auto"
                        >
                          {aiGenerating ? (
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
                        className="mt-1 text-sm sm:text-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg shadow-sm"
                        required
                      />
                      <div className="mt-2 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <p className="text-xs sm:text-sm text-blue-700 font-medium">
                          💡 {aiSuggestions.description}
                        </p>
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
                      <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Company Details</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Help job seekers find you</p>
                  </div>

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
                          <SelectContent 
                            className="max-h-60 overflow-y-auto z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
                            position="popper"
                            sideOffset={8}
                            align="start"
                            avoidCollisions={true}
                            collisionPadding={16}
                            side="bottom"
                            sticky="always"
                          >
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
                          <SelectContent 
                            className="max-h-60 overflow-y-auto z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
                            position="popper"
                            sideOffset={8}
                            align="start"
                            avoidCollisions={true}
                            collisionPadding={16}
                            side="bottom"
                            sticky="always"
                          >
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
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Company Culture & Values</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Showcase what makes your company special</p>
                  </div>

                  <div className="space-y-8">
                    {/* Mission & Vision */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <Label htmlFor="mission" className="text-base font-bold text-gray-900">
                            Mission Statement
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateAIContent('mission')}
                            disabled={aiGenerating || !formData.name.trim() || !formData.industry}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-4 py-2 text-sm font-medium w-full sm:w-auto transition-all duration-200 hover:shadow-xl"
                          >
                            {aiGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                <span className="hidden sm:inline">Generating...</span>
                                <span className="sm:hidden">AI Generate</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">AI Generate Mission</span>
                                <span className="sm:hidden">AI Generate</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <Textarea
                          id="mission"
                          value={formData.mission || ''}
                          onChange={(e) => handleInputChange('mission', e.target.value)}
                          placeholder="What is your company's purpose?"
                          rows={4}
                          className="text-base border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl shadow-sm transition-all duration-200 resize-none"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <Label htmlFor="vision" className="text-base font-bold text-gray-900">
                            Vision Statement
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => generateAIContent('vision')}
                            disabled={aiGenerating || !formData.name.trim() || !formData.industry}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-4 py-2 text-sm font-medium w-full sm:w-auto transition-all duration-200 hover:shadow-xl"
                          >
                            {aiGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                <span className="hidden sm:inline">Generating...</span>
                                <span className="sm:hidden">AI Generate</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">AI Generate Vision</span>
                                <span className="sm:hidden">AI Generate</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <Textarea
                          id="vision"
                          value={formData.vision || ''}
                          onChange={(e) => handleInputChange('vision', e.target.value)}
                          placeholder="What does your company aspire to achieve?"
                          rows={4}
                          className="text-base border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl shadow-sm transition-all duration-200 resize-none"
                        />
                      </div>
                    </div>

                    {/* Company Culture */}
                    <div className="space-y-4">
                      <Label htmlFor="culture" className="text-base font-bold text-gray-900 block">
                        Company Culture
                      </Label>
                      <Textarea
                        id="culture"
                        value={formData.culture || ''}
                        onChange={(e) => handleInputChange('culture', e.target.value)}
                        placeholder="Describe your company culture, values, and work environment..."
                        rows={4}
                        className="text-base border-2 border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-xl shadow-sm transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* Employee Benefits */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <Label className="text-base font-bold text-gray-900">
                          Employee Benefits
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('benefits')}
                          disabled={aiGenerating || !formData.industry}
                          className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0 hover:from-green-700 hover:to-blue-700 shadow-lg px-4 py-2 text-sm font-medium w-full sm:w-auto transition-all duration-200 hover:shadow-xl"
                        >
                          {aiGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              AI Suggest Benefits
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
                            className={`h-12 text-sm font-medium transition-all duration-200 rounded-xl ${
                              formData.benefits?.includes(benefit)
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105 hover:scale-110'
                                : 'hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-400 hover:shadow-md'
                            }`}
                          >
                            {formData.benefits?.includes(benefit) && <CheckCircle className="h-4 w-4 mr-2" />}
                            <span className="truncate">{benefit}</span>
                          </Button>
                        ))}
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                        <p className="text-sm text-green-700 font-medium">
                          💡 {aiSuggestions.benefits}
                        </p>
                      </div>
                    </div>

                    {/* Company Specialties */}
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <Label className="text-base font-bold text-gray-900">
                          Company Specialties
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('specialties')}
                          disabled={aiGenerating || !formData.industry}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700 shadow-lg px-4 py-2 text-sm font-medium w-full sm:w-auto transition-all duration-200 hover:shadow-xl"
                        >
                          {aiGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              AI Suggest Specialties
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
                      
                      {/* Add New Specialty */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a specialty..."
                          className="flex-1 h-10 text-sm border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              if (input.value.trim()) {
                                handleSpecialtyToggle(input.value.trim());
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 px-4 border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          Add
                        </Button>
                      </div>
                      
                      <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-700 font-medium">
                          💡 {aiSuggestions.specialties}
                        </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </>
  );
}
