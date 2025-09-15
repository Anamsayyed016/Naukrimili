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
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  Star,
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface CompanyData {
  id: string;
  name: string;
  description: string;
  website: string;
  location: string;
  industry: string;
  size: string;
  founded: number | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyData>>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/employer/company/profile');
      return;
    }
    
    fetchCompanyProfile();
  }, [status, router]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await fetch('/api/company/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompany(data.data);
          setFormData(data.data);
        } else if (response.status === 404) {
          // No company profile found, redirect to create
          router.push('/employer/company/create');
        }
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanyData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.location || !formData.industry || !formData.size) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
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
        toast.success('Company profile updated successfully!');
        setCompany({ ...company!, ...formData });
        setEditing(false);
        await fetchCompanyProfile(); // Refresh data
      } else {
        throw new Error(data.error || 'Failed to update company');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your company profile? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/company/profile', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Company profile deleted successfully');
        router.push('/employer/company/create');
      } else {
        throw new Error(data.error || 'Failed to delete company');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company profile');
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Company Profile Found</h2>
          <p className="text-gray-600 mb-6">You need to create a company profile first.</p>
          <Link href="/employer/company/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create Company Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/employer/options" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
              <p className="text-gray-600">Manage your company information</p>
            </div>
          </div>
          <div className="flex gap-3">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setFormData(company);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Overview */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">
                        {editing ? (
                          <Input
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="text-xl font-bold border-0 p-0 h-auto bg-transparent focus:ring-0"
                            placeholder="Company Name"
                          />
                        ) : (
                          company.name
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {company.isVerified ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pending Verification
                          </Badge>
                        )}
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {company.industry}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Company Description
                  </Label>
                  {editing ? (
                    <Textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full"
                      placeholder="Describe your company..."
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{company.description}</p>
                  )}
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Location
                    </Label>
                    {editing ? (
                      <Input
                        value={formData.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Company Location"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Industry
                    </Label>
                    {editing ? (
                      <Select 
                        value={formData.industry || ''} 
                        onValueChange={(value) => handleInputChange('industry', value)}
                      >
                        <SelectTrigger>
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
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Building2 className="h-4 w-4" />
                        {company.industry}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Company Size
                    </Label>
                    {editing ? (
                      <Select 
                        value={formData.size || ''} 
                        onValueChange={(value) => handleInputChange('size', value)}
                      >
                        <SelectTrigger>
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
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="h-4 w-4" />
                        {company.size} employees
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Founded Year
                    </Label>
                    {editing ? (
                      <Input
                        type="number"
                        value={formData.founded || ''}
                        onChange={(e) => handleInputChange('founded', parseInt(e.target.value))}
                        placeholder="Founded Year"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4" />
                        {company.founded || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Website
                    </Label>
                    {editing ? (
                      <Input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Globe className="h-4 w-4" />
                        {company.website ? (
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {company.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          'No website'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Status */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Verification Status</span>
                  <Badge variant={company.isVerified ? "default" : "secondary"}>
                    {company.isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm text-gray-900">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">
                    {new Date(company.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/employer/jobs/create" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Post New Job
                  </Button>
                </Link>
                <Link href="/employer/jobs" className="block">
                  <Button variant="outline" className="w-full">
                    Manage Jobs
                  </Button>
                </Link>
                <Link href="/employer/applications" className="block">
                  <Button variant="outline" className="w-full">
                    View Applications
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}