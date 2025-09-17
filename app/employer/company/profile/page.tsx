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
  ExternalLink,
  FileText,
  Briefcase
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
        } else {
          console.error('API returned error:', data.error);
          toast.error(data.error || 'Failed to load company profile');
        }
      } else if (response.status === 401) {
        // User not authenticated, redirect to login
        router.push('/auth/signin');
        return;
      } else if (response.status === 404) {
        // No company profile found, redirect to create
        router.push('/employer/company/create');
      } else {
        // Other error
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching company profile:', response.status, response.statusText, errorData);
        toast.error(errorData.error || 'Failed to load company profile');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/employer/options" 
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Options
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Company Profile</h1>
            <p className="text-slate-600 text-lg">Manage your company information and build your brand</p>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setFormData(company);
                }}
                disabled={saving}
                className="px-6 py-2 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
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
                className="border-blue-300 text-blue-700 hover:bg-blue-50 px-6 py-2 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2 shadow-sm hover:shadow-md transition-all duration-200"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Overview */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-600 rounded-2xl shadow-lg">
                      <Building2 className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold text-slate-900 mb-2">
                        {editing ? (
                          <Input
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="text-2xl font-bold border-0 p-0 h-auto bg-transparent focus:ring-0 text-slate-900"
                            placeholder="Company Name"
                          />
                        ) : (
                          company.name
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-2">
                        {company.isVerified ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3 py-1 rounded-full font-medium">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 rounded-full font-medium">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Pending Verification
                          </Badge>
                        )}
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 rounded-full font-medium">
                          {company.industry}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8 space-y-8">
                {/* Description */}
                <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100">
                  <Label className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Company Description
                  </Label>
                  {editing ? (
                    <Textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-lg"
                      placeholder="Describe your company..."
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed text-base">{company.description}</p>
                  )}
                </div>

                {/* Company Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Location
                    </Label>
                    {editing ? (
                      <Input
                        value={formData.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Company Location"
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-slate-700 text-base">
                        <MapPin className="h-5 w-5 text-slate-500" />
                        {company.location}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Industry
                    </Label>
                    {editing ? (
                      <Select 
                        value={formData.industry || ''} 
                        onValueChange={(value) => handleInputChange('industry', value)}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
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
                      <div className="flex items-center gap-3 text-slate-700 text-base">
                        <Building2 className="h-5 w-5 text-slate-500" />
                        {company.industry}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Company Size
                    </Label>
                    {editing ? (
                      <Select 
                        value={formData.size || ''} 
                        onValueChange={(value) => handleInputChange('size', value)}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
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
                      <div className="flex items-center gap-3 text-slate-700 text-base">
                        <Users className="h-5 w-5 text-slate-500" />
                        {company.size} employees
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
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
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-slate-700 text-base">
                        <Calendar className="h-5 w-5 text-slate-500" />
                        {company.founded || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      Website
                    </Label>
                    {editing ? (
                      <Input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div className="flex items-center gap-3 text-slate-700 text-base">
                        <Globe className="h-5 w-5 text-slate-500" />
                        {company.website ? (
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition-colors duration-200"
                          >
                            {company.website}
                            <ExternalLink className="h-4 w-4" />
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

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Profile Status */}
            <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-100 pb-4">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">Verification Status</span>
                    <Badge className={company.isVerified ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                      {company.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {company.isVerified ? 'Your company is verified and trusted' : 'Verification is under review'}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Created</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-slate-600">Last Updated</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {new Date(company.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card className="shadow-2xl border-0 bg-white/98 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-green-50/50 border-b border-slate-100 pb-4">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Link href="/employer/jobs/create" className="block">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Post New Job
                  </Button>
                </Link>
                <Link href="/employer/jobs" className="block">
                  <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                    <FileText className="h-5 w-5 mr-2" />
                    Manage Jobs
                  </Button>
                </Link>
                <Link href="/employer/applications" className="block">
                  <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                    <Users className="h-5 w-5 mr-2" />
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