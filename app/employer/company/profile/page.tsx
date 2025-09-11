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
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface CompanyProfileData {
  name: string;
  description: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  founded: string;
}

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

export default function CompanyProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<CompanyProfileData>({
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
      router.push('/auth/login?redirect=/employer/company/profile');
      return;
    }
    if (session?.user?.role !== 'employer') {
      router.push('/dashboard');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setInitialLoading(true);
      const response = await fetch('/api/company/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData({
            name: data.data.name || '',
            description: data.data.description || '',
            website: data.data.website || '',
            location: data.data.location || '',
            industry: data.data.industry || '',
            size: data.data.size || '',
            founded: data.data.founded?.toString() || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanyProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Enhanced validation
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Company description is required');
      setLoading(false);
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Company location is required');
      setLoading(false);
      return;
    }

    if (!formData.industry) {
      toast.error('Please select an industry');
      setLoading(false);
      return;
    }

    if (!formData.size) {
      toast.error('Please select company size');
      setLoading(false);
      return;
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      toast.error('Please enter a valid website URL (e.g., https://company.com)');
      setLoading(false);
      return;
    }

    if (formData.founded && (parseInt(formData.founded) < 1800 || parseInt(formData.founded) > new Date().getFullYear())) {
      toast.error('Please enter a valid founding year');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🎉 Company profile updated successfully!', {
          description: 'Your company information is now current and attractive to job seekers.',
          duration: 5000,
        });
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/employer/dashboard');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to update company profile');
      }
    } catch (error) {
      console.error('Error updating company profile:', error);
      toast.error('Failed to update company profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    const fields = ['name', 'description', 'location', 'industry', 'size'];
    const completed = fields.filter(field => formData[field as keyof CompanyProfileData].trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  if (status === 'loading' || initialLoading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-100 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'employer') {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-100 min-h-[calc(100vh-4rem)] py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/employer/dashboard" 
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Profile</h1>
          <p className="text-gray-600 text-lg">Complete your company profile to attract top talent</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Building2 className="h-6 w-6 text-orange-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Company Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., TechCorp Solutions"
                      className="mt-1 h-12 text-lg"
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
                      placeholder="Describe your company, mission, and culture..."
                      rows={4}
                      className="mt-1 text-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://company.com"
                        className="mt-1 h-12 text-lg"
                      />
                    </div>

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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Profile Completion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm font-bold text-green-600">{getCompletionPercentage()}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    ></div>
                  </div>

                  <div className="space-y-2">
                    {[
                      { field: 'name', label: 'Company Name' },
                      { field: 'description', label: 'Description' },
                      { field: 'location', label: 'Location' },
                      { field: 'industry', label: 'Industry' },
                      { field: 'size', label: 'Company Size' }
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{label}</span>
                        <span className={formData[field as keyof CompanyProfileData] ? 'text-green-600' : 'text-gray-400'}>
                          {formData[field as keyof CompanyProfileData] ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Link href="/employer/jobs/create">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Building2 className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </Link>
                
                <Link href="/employer/dashboard">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Profile Tips</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Complete profiles get 3x more applications</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Include your company culture and values</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Add a professional website link</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Keep information up to date</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
