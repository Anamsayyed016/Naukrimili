"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  Calendar,
  Save,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface CompanyProfileData {
  name: string;
  description: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  founded: string;
}

export default function CompanyProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setCompanyProfileData] = useState<CompanyProfileData>({
    name: '',
    description: '',
    website: '',
    location: '',
    industry: '',
    size: '',
    founded: ''
  });

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch('/api/company/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompanyProfileData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const handleInputChange = (field: keyof CompanyProfileData, value: string) => {
    setCompanyProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Enhanced validation
    if (!formData.name.trim()) {
      alert('Company name is required');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      alert('Company description is required');
      setLoading(false);
      return;
    }

    if (!formData.location.trim()) {
      alert('Company location is required');
      setLoading(false);
      return;
    }

    if (!formData.industry) {
      alert('Please select an industry');
      setLoading(false);
      return;
    }

    if (!formData.size) {
      alert('Please select company size');
      setLoading(false);
      return;
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      alert('Please enter a valid website URL (e.g., https://company.com)');
      setLoading(false);
      return;
    }

    if (formData.founded && (parseInt(formData.founded) < 1800 || parseInt(formData.founded) > new Date().getFullYear())) {
      alert('Please enter a valid founding year');
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company profile');
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Company profile updated successfully!');
        router.push('/dashboard/company');
      } else {
        throw new Error(result.error || 'Failed to update company profile');
      }
    } catch (error) {
      console.error('Error updating company profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to update company profile');
    } finally {
      setLoading(false);
    }
  };

  const industryOptions = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Media',
    'Real Estate',
    'Marketing & Advertising',
    'Transportation & Logistics',
    'Energy & Utilities',
    'Government & Public Sector',
    'Non-profit & NGO',
    'Entertainment & Sports',
    'Food & Beverage',
    'Fashion & Apparel',
    'Automotive',
    'Construction & Engineering',
    'Legal Services',
    'Travel & Tourism',
    'Agriculture',
    'Telecommunications',
    'Other'
  ];

  const sizeOptions = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1001-5000',
    '5001-10000',
    '10000+'
  ];

  return (
    <AuthGuard allowedRoles={['employer']}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Link href="/dashboard/company" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Profile</h1>
          <p className="text-gray-600">Complete your company profile to attract top talent</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., TechCorp Solutions"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Company Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your company, mission, and culture..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://company.com"
                        type="url"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Bangalore, India"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry *</Label>
                      <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industryOptions.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="size">Company Size *</Label>
                      <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size} employees
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="founded">Founded Year</Label>
                      <Input
                        id="founded"
                        value={formData.founded}
                        onChange={(e) => handleInputChange('founded', e.target.value)}
                        placeholder="e.g., 2020"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                  
                  <Button type="button" variant="outline" className="w-full" onClick={() => router.push('/employer/post-job')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Basic Info</span>
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Description</span>
                      <span className={formData.description ? 'text-green-600' : 'text-gray-400'}>
                        {formData.description ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Location</span>
                      <span className={formData.location ? 'text-green-600' : 'text-gray-400'}>
                        {formData.location ? '✓' : '○'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Industry</span>
                      <span className={formData.industry ? 'text-green-600' : 'text-gray-400'}>
                        {formData.industry ? '✓' : '○'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
