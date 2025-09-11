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
  ArrowLeft
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
}

const steps = [
  { id: 1, title: 'Basic Info', description: 'Company name and description' },
  { id: 2, title: 'Details', description: 'Location and industry' },
  { id: 3, title: 'Review', description: 'Review and create' }
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

export default function CreateCompanyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '',
    founded: ''
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/employer/company/create');
    }
  }, [status, router]);

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        return true;
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

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                    ${currentStep >= step.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {currentStep > step.id ? <CheckCircle className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
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

                  <div className="space-y-4">
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
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                        Company Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your company, mission, and what makes you unique..."
                        rows={4}
                        className="mt-1 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
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
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Review Your Company</h2>
                    <p className="text-gray-600">Everything looks good? Let's create your company profile!</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg">{formData.name}</h3>
                        <p className="text-gray-600">{formData.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{formData.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{formData.size} employees</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span>{formData.website || 'No website'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formData.founded || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-blue-600 bg-blue-100">
                        {formData.industry}
                      </Badge>
                    </div>
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