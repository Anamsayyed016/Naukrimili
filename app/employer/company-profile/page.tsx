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
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Calendar,
  Save,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Eye,
  Edit3
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface CompanyProfile {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: string;
  founded: number;
  website: string;
  location: string;
  country: string;
  phone: string;
  email: string;
  logo: string;
  banner: string;
  about: string;
  mission: string;
  values: string[];
  benefits: string;
  culture: string;
  isVerified: boolean;
}

export default function CompanyProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile>({
    id: '1',
    name: 'TechCorp India',
    description: 'Leading technology company specializing in innovative solutions',
    industry: 'technology',
    size: '100-500',
    founded: 2015,
    website: 'https://techcorp-india.com',
    location: 'Bangalore',
    country: 'IN',
    phone: '+91 80 1234 5678',
    email: 'contact@techcorp-india.com',
    logo: '/logos/techcorp-logo.png',
    banner: '/banners/techcorp-banner.jpg',
    about: 'TechCorp India is a forward-thinking technology company that has been at the forefront of digital innovation since 2015. We specialize in developing cutting-edge software solutions that help businesses transform and grow in the digital age.',
    mission: 'To empower businesses with innovative technology solutions that drive growth and create lasting value.',
    values: ['Innovation', 'Excellence', 'Integrity', 'Collaboration', 'Customer Focus'],
    benefits: 'Competitive salary, health insurance, flexible work hours, remote work options, professional development, team events',
    culture: 'We foster a collaborative and inclusive work environment where creativity thrives. Our team members enjoy flexible work arrangements, continuous learning opportunities, and a supportive atmosphere that encourages innovation.',
    isVerified: true
  });

  const [newValue, setNewValue] = useState('');

  const handleInputChange = (field: keyof CompanyProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: keyof CompanyProfile, value: string) => {
    if (value.endsWith(',')) {
      const item = value.slice(0, -1).trim();
      if (item && !profile[field].includes(item)) {
        setProfile(prev => ({ 
          ...prev, 
          [field]: [...(prev[field] as string[]), item] 
        }));
        setNewValue('');
      }
    }
  };

  const removeValue = (field: keyof CompanyProfile, valueToRemove: string) => {
    setProfile(prev => ({ 
      ...prev, 
      [field]: (prev[field] as string[]).filter(item => item !== valueToRemove) 
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // For now, just log the data - implement API call later
      console.log('Saving company profile:', profile);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error('Error saving company profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    setIsEditing(false);
  };

  const currentYear = new Date().getFullYear();

  return (
    <AuthGuard allowedRoles={['employer']}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Link href="/dashboard/company" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Profile</h1>
              <p className="text-gray-600">Manage your company information and branding</p>
            </div>
            <div className="flex items-center gap-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your company name"
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry *</Label>
                    <Select 
                      value={profile.industry} 
                      onValueChange={(value) => handleInputChange('industry', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="size">Company Size</Label>
                    <Select 
                      value={profile.size} 
                      onValueChange={(value) => handleInputChange('size', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-100">51-100 employees</SelectItem>
                        <SelectItem value="100-500">100-500 employees</SelectItem>
                        <SelectItem value="500-1000">500-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="founded">Founded Year</Label>
                    <Select 
                      value={profile.founded.toString()} 
                      onValueChange={(value) => handleInputChange('founded', parseInt(value))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i).map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourcompany.com"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Company Description *</Label>
                  <Textarea
                    id="description"
                    value={profile.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of your company"
                    rows={3}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@company.com"
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 80 1234 5678"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">City *</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Bangalore"
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select 
                      value={profile.country} 
                      onValueChange={(value) => handleInputChange('country', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">India</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="UK">United Kingdom</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="about">About Us</Label>
                  <Textarea
                    id="about"
                    value={profile.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    placeholder="Tell the story of your company..."
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Textarea
                    id="mission"
                    value={profile.mission}
                    onChange={(e) => handleInputChange('mission', e.target.value)}
                    placeholder="Your company's mission..."
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="values">Company Values</Label>
                  <Input
                    id="values"
                    value={newValue}
                    onChange={(e) => handleArrayChange('values', e.target.value)}
                    placeholder="Add a value and press comma (e.g., Innovation,)"
                    disabled={!isEditing}
                  />
                  {profile.values.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.values.map((value, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {value}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => removeValue('values', value)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="culture">Company Culture</Label>
                  <Textarea
                    id="culture"
                    value={profile.culture}
                    onChange={(e) => handleInputChange('culture', e.target.value)}
                    placeholder="Describe your company culture..."
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="benefits">Benefits & Perks</Label>
                  <Textarea
                    id="benefits"
                    value={profile.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    placeholder="List the benefits and perks you offer..."
                    rows={3}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Logo & Banner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Company Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo">Company Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {profile.logo ? (
                      <img 
                        src={profile.logo} 
                        alt="Company Logo" 
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="banner">Company Banner</Label>
                  <div className="mt-2">
                    {profile.banner ? (
                      <img 
                        src={profile.banner} 
                        alt="Company Banner" 
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {isEditing && (
                      <Button variant="outline" size="sm" className="mt-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Banner
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {profile.isVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Verified Company</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium">Pending Verification</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {profile.isVerified 
                    ? 'Your company has been verified and is trusted by job seekers.'
                    : 'Complete your profile to get verified and build trust with job seekers.'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Basic Information</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Contact Details</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Company Details</span>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Company Logo</span>
                    <span className="text-green-600">✓</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">100%</div>
                    <div className="text-sm text-gray-500">Profile Complete</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tips for Better Profile</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Use high-quality company logo and banner</p>
                <p>• Write compelling company description</p>
                <p>• Highlight unique company culture</p>
                <p>• List specific benefits and perks</p>
                <p>• Keep information up-to-date</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
