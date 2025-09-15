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

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/employer/company/create');
    }
  }, [status, router]);

  const handleInputChange = (field: keyof CompanyFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
  const generateAIContent = async (type: 'description' | 'benefits' | 'specialties') => {
    if (!formData.name || !formData.industry) {
      toast.error('Please enter company name and industry first');
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
          industry: formData.industry,
          existingData: formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        switch (type) {
          case 'description':
            setFormData(prev => ({ ...prev, description: data.suggestion }));
            toast.success('AI-generated description added!');
            break;
          case 'benefits':
            setFormData(prev => ({ ...prev, benefits: data.suggestions }));
            toast.success('AI-suggested benefits added!');
            break;
          case 'specialties':
            setFormData(prev => ({ ...prev, specialties: data.suggestions }));
            toast.success('AI-suggested specialties added!');
            break;
        }
      } else {
        toast.error('Failed to generate AI content');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate AI content');
    } finally {
      setAiGenerating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
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
    if (!validateStep(1) || !validateStep(2)) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/company/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🎉 Company created successfully! You can now start posting jobs.', {
          description: 'Your company profile is ready to attract top talent.',
          duration: 5000,
        });
        
        // Redirect to company dashboard
        setTimeout(() => {
          router.push('/dashboard/company');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company. Please try again.');
    } finally {
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
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/dashboard/company" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Your Company Profile</h1>
          <p className="text-gray-600 text-lg">Build your company's presence and start attracting top talent</p>
        </div>

        {/* Enhanced Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                      ${currentStep >= step.id 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 mx-2 sm:mx-4 ${currentStep > step.id ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
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
                    <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Basic Company Information</h2>
                    <p className="text-gray-600">Tell us about your company</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                        Company Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., TechCorp Solutions"
                        className="mt-1 h-12 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                          Company Description *
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('description')}
                          disabled={aiGenerating || !formData.name || !formData.industry}
                          className="text-xs"
                        >
                          {aiGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-3 w-3 mr-1" />
                              AI Generate
                            </>
                          )}
                        </Button>
                      </div>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your company, mission, and what makes you unique..."
                        rows={4}
                        className="mt-1 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 {aiSuggestions.description}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="mt-1 h-12 text-lg"
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
                    <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Company Details</h2>
                    <p className="text-gray-600">Help job seekers find you</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                        Location *
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Bangalore, India"
                        className="mt-1 h-12 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="industry" className="text-sm font-semibold text-gray-700">
                        Industry *
                      </Label>
                      <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                        <SelectTrigger className="mt-1 h-12 text-lg">
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="size" className="text-sm font-semibold text-gray-700">
                        Company Size *
                      </Label>
                      <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                        <SelectTrigger className="mt-1 h-12 text-lg">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size} employees
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="founded" className="text-sm font-semibold text-gray-700">
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
                        className="mt-1 h-12 text-lg"
                      />
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
                    <Target className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Company Culture & Values</h2>
                    <p className="text-gray-600">Showcase what makes your company special</p>
                  </div>

                  <div className="space-y-6">
                    {/* Mission & Vision */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="mission" className="text-sm font-semibold text-gray-700">
                          Mission Statement
                        </Label>
                        <Textarea
                          id="mission"
                          value={formData.mission || ''}
                          onChange={(e) => handleInputChange('mission', e.target.value)}
                          placeholder="What is your company's purpose?"
                          rows={3}
                          className="mt-1 text-lg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vision" className="text-sm font-semibold text-gray-700">
                          Vision Statement
                        </Label>
                        <Textarea
                          id="vision"
                          value={formData.vision || ''}
                          onChange={(e) => handleInputChange('vision', e.target.value)}
                          placeholder="What does your company aspire to achieve?"
                          rows={3}
                          className="mt-1 text-lg"
                        />
                      </div>
                    </div>

                    {/* Company Culture */}
                    <div>
                      <Label htmlFor="culture" className="text-sm font-semibold text-gray-700">
                        Company Culture
                      </Label>
                      <Textarea
                        id="culture"
                        value={formData.culture || ''}
                        onChange={(e) => handleInputChange('culture', e.target.value)}
                        placeholder="Describe your company culture, values, and work environment..."
                        rows={3}
                        className="mt-1 text-lg"
                      />
                    </div>

                    {/* Employee Benefits */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-semibold text-gray-700">
                          Employee Benefits
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('benefits')}
                          disabled={aiGenerating}
                          className="text-xs"
                        >
                          {aiGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-3 w-3 mr-1" />
                              AI Suggest
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {commonBenefits.map((benefit) => (
                          <Button
                            key={benefit}
                            type="button"
                            variant={formData.benefits?.includes(benefit) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleBenefitToggle(benefit)}
                            className={`text-xs h-8 ${
                              formData.benefits?.includes(benefit)
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-blue-50'
                            }`}
                          >
                            {formData.benefits?.includes(benefit) && <CheckCircle className="h-3 w-3 mr-1" />}
                            {benefit}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 {aiSuggestions.benefits}
                      </p>
                    </div>

                    {/* Company Specialties */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-semibold text-gray-700">
                          Company Specialties
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateAIContent('specialties')}
                          disabled={aiGenerating}
                          className="text-xs"
                        >
                          {aiGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-3 w-3 mr-1" />
                              AI Suggest
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.specialties?.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {specialty}
                            <button
                              type="button"
                              onClick={() => handleSpecialtyToggle(specialty)}
                              className="ml-1 hover:text-red-600"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        <Input
                          placeholder="Add specialty..."
                          className="w-32 h-8 text-xs"
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
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 {aiSuggestions.specialties}
                      </p>
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
                  <div className="text-center mb-6">
                    <Eye className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Review Your Company</h2>
                    <p className="text-gray-600">Everything looks good? Let's create your company profile!</p>
                  </div>

                  <div className="space-y-6">
                    {/* Company Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                          <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 mb-2">{formData.name}</h3>
                          <p className="text-gray-700 leading-relaxed">{formData.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-semibold">
                              {formData.industry}
                            </Badge>
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              {formData.size} employees
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          Location & Details
                        </h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{formData.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{formData.size} employees</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Founded {formData.founded || 'Not specified'}</span>
                          </div>
                          {formData.website && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mission & Vision */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          Mission & Vision
                        </h4>
                        <div className="space-y-3 text-sm">
                          {formData.mission && (
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Mission:</p>
                              <p className="text-gray-600">{formData.mission}</p>
                            </div>
                          )}
                          {formData.vision && (
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Vision:</p>
                              <p className="text-gray-600">{formData.vision}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Benefits & Specialties */}
                    {(formData.benefits?.length || formData.specialties?.length) && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-600" />
                          Benefits & Specialties
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.benefits?.length && (
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Employee Benefits:</p>
                              <div className="flex flex-wrap gap-1">
                                {formData.benefits.map((benefit, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {benefit}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {formData.specialties?.length && (
                            <div>
                              <p className="font-medium text-gray-700 mb-2">Company Specialties:</p>
                              <div className="flex flex-wrap gap-1">
                                {formData.specialties.map((specialty, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-purple-300 text-purple-700">
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
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          Company Culture
                        </h4>
                        <p className="text-gray-600">{formData.culture}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3"
              >
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !validateStep(1) || !validateStep(2)}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Company
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}