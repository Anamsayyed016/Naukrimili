"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  Briefcase,
  Sparkles,
  Mail,
  Phone,
  Upload,
  X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getCompanyProfileCompletion } from '@/lib/companies/company-profile-completion';
import { CompanyLogoLarge } from '@/components/companies/CompanyLogo';
import { ef } from '@/lib/employer-form-ui';
import { cn } from '@/lib/utils';

const LOGO_MAX_BYTES = 2 * 1024 * 1024;

async function fileToCompressedDataUrl(file: File, maxDim = 320, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image'));
    };
    img.src = url;
  });
}

interface CompanyData {
  id: string;
  name: string;
  description: string;
  email?: string | null;
  phone?: string | null;
  website: string;
  location: string;
  industry: string;
  size: string;
  founded: number | null;
  logo?: string | null;
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
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{[key: string]: string}>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'loading') {
      console.log('⏳ Session loading...');
      return;
    }
    
    if (status === 'unauthenticated') {
      console.log('❌ Unauthenticated - redirecting to signin');
      router.push('/auth/signin?redirect=/employer/company/profile');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'employer') {
      console.log('❌ Not an employer - redirecting to dashboard');
      router.push('/dashboard');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.id) {
      console.log('✅ Authenticated employer - fetching profile');
      fetchCompanyProfile();
    }
  }, [status, session, router]);

  const fetchCompanyProfile = async () => {
    // Don't make API calls if not authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log('⏸️ Skipping API call - not authenticated yet');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching company profile...');
      const response = await fetch('/api/employer/company-profile', {
        credentials: 'include',
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log('✅ Company profile loaded:', data.data.name);
          setCompany(data.data);
          setFormData(data.data);
        } else {
          console.error('API returned error:', data.error);
          toast.error(data.error || 'Failed to load company profile');
        }
      } else if (response.status === 401) {
        // User not authenticated, redirect to login
        console.log('❌ 401 Unauthorized - redirecting to signin');
        toast.error('Session expired', {
          description: 'Please sign in again to continue.',
          duration: 3000,
        });
        router.push('/auth/signin?redirect=/employer/company/profile');
        return;
      } else if (response.status === 404) {
        // No company profile found, redirect to create
        console.log('ℹ️ No company profile found - redirecting to create');
        toast.info('No company profile found', {
          description: 'Let\'s create your company profile first.',
          duration: 3000,
        });
        router.push('/employer/company/create');
        return;
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

  // AI-powered content generation
  const generateAIContent = async (type: 'description') => {
    if (!formData.name) {
      toast.error('Please enter company name first');
      return;
    }

    if (!formData.industry) {
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
          industry: formData.industry,
          existingData: formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestion) {
          setAiSuggestions(prev => ({ ...prev, [type]: data.suggestion }));
          toast.success('AI suggestion generated!', {
            description: 'Click the suggestion to apply it.',
            duration: 3000
          });
        } else {
          toast.error('No suggestions available');
        }
      } else {
        throw new Error('Failed to get AI suggestions');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast.error('Failed to get AI suggestions', {
        description: 'Please try again or continue with manual input.',
        duration: 3000
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAISuggestion = (field: string) => {
    if (aiSuggestions[field]) {
      setFormData(prev => ({ ...prev, [field]: aiSuggestions[field] }));
      setAiSuggestions(prev => ({ ...prev, [field]: '' }));
      toast.success('AI suggestion applied!');
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.location || !formData.industry || !formData.size) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/employer/company-profile', {
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

  const persistCompanyPatch = async (patch: Partial<CompanyData>, successMessage: string) => {
    if (!company) return false;
    setSaving(true);
    try {
      const payload = {
        name: patch.name ?? company.name,
        description: patch.description ?? company.description,
        location: patch.location ?? company.location,
        industry: patch.industry ?? company.industry,
        size: patch.size ?? company.size,
        website: patch.website ?? company.website ?? '',
        founded: patch.founded ?? company.founded,
        email: patch.email !== undefined ? patch.email : company.email,
        phone: patch.phone !== undefined ? patch.phone : company.phone,
        logo: patch.logo !== undefined ? patch.logo : company.logo,
      };
      const response = await fetch('/api/employer/company-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(successMessage);
        await fetchCompanyProfile();
        return true;
      }
      throw new Error(data.error || 'Update failed');
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company profile');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !company) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a PNG, JPG, or WebP image');
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error('Logo must be under 2 MB');
      return;
    }
    setLogoUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setFormData((prev) => ({ ...prev, logo: dataUrl }));
      const ok = await persistCompanyPatch({ logo: dataUrl }, 'Company logo updated');
      if (ok) setEditing(false);
    } catch {
      toast.error('Could not process image. Try another file.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!company) return;
    if (!confirm('Remove your company logo?')) return;
    setLogoUploading(true);
    try {
      setFormData((prev) => ({ ...prev, logo: null }));
      await persistCompanyPatch({ logo: null }, 'Logo removed');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your company profile? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/employer/company-profile', {
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

  const display = editing ? { ...company, ...formData } : company;
  const profileSource = display;
  const { percent: completionPercent, missing: completionMissing } =
    getCompanyProfileCompletion(profileSource);

  return (
    <div className={cn('min-h-screen', ef.pageBgSoft)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/employer/options"
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition-colors bg-white/90 px-4 py-2 rounded-xl border border-[#2563EB]/12 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Link>
          <span className={ef.headerBadge}>Employer Dashboard</span>
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

        {completionPercent < 100 && (
          <Card className={cn(ef.sectionCard, 'mb-6 border-[#2563EB]/15')}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-semibold text-[#64748B] uppercase tracking-wider">
                    Profile completion
                  </p>
                  <p className="text-2xl font-bold text-[#0F172A]">{completionPercent}% complete</p>
                </div>
                {completionMissing.includes('Logo') && (
                  <Button
                    type="button"
                    size="sm"
                    className={ef.aiButton}
                    onClick={() => logoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Add logo
                  </Button>
                )}
              </div>
              <div className="w-full bg-[#2563EB]/10 rounded-full h-2.5 mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              {completionMissing.length > 0 && (
                <p className="text-sm text-[#64748B]">
                  <span className="font-semibold text-[#0F172A]">Still needed:</span>{' '}
                  {completionMissing.join(' · ')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className={cn(ef.mainCard, 'overflow-hidden')}>
              <CardHeader className="border-b border-[#2563EB]/10 bg-gradient-to-r from-white via-[#2563EB]/[0.03] to-[#06B6D4]/[0.03] pb-6">
                <div
                  ref={logoSectionRef}
                  className="flex flex-col sm:flex-row gap-5 sm:gap-6"
                >
                  <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
                    <div className="relative rounded-2xl ring-2 ring-[#2563EB]/15 shadow-[0_8px_24px_-8px_rgba(37,99,235,0.2)] overflow-hidden bg-white">
                      <CompanyLogoLarge
                        name={display.name}
                        logo={display.logo}
                        website={display.website}
                      />
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={handleLogoFile}
                      aria-label="Upload company logo"
                    />
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={logoUploading || saving}
                        className="border-[#2563EB]/25 text-[#2563EB] hover:bg-[#2563EB]/5"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {logoUploading ? (
                          <span className="animate-spin h-4 w-4 border-2 border-[#2563EB] border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1.5" />
                            {display.logo ? 'Change' : 'Upload'} logo
                          </>
                        )}
                      </Button>
                      {display.logo ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={logoUploading || saving}
                          className="text-[#64748B] hover:text-red-600"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#64748B] text-center sm:text-left max-w-[200px]">
                      PNG, JPG or WebP · max 2 MB · shown on jobs & company cards
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-[#0F172A] mb-2 tracking-tight">
                      {editing ? (
                        <Input
                          value={formData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className={cn('text-2xl font-bold', ef.input)}
                          placeholder="Company Name"
                        />
                      ) : (
                        display.name
                      )}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {display.isVerified ? (
                        <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Pending verification
                        </Badge>
                      )}
                      {display.industry ? (
                        <Badge variant="secondary" className={ef.aiBadge}>
                          {display.industry}
                        </Badge>
                      ) : null}
                      {display.size ? (
                        <Badge variant="outline" className="border-[#2563EB]/15 text-[#64748B] font-medium">
                          {display.size} employees
                        </Badge>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-[#475569] min-w-0">
                        <Mail className="h-4 w-4 shrink-0 text-[#2563EB]" />
                        {editing ? (
                          <Input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="contact@company.com"
                            className={cn('h-9', ef.input)}
                          />
                        ) : (
                          <span className="truncate font-medium text-[#0F172A]">
                            {display.email || '—'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[#475569] min-w-0">
                        <Phone className="h-4 w-4 shrink-0 text-[#2563EB]" />
                        {editing ? (
                          <Input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+91 …"
                            className={cn('h-9', ef.input)}
                          />
                        ) : (
                          <span className="truncate font-medium text-[#0F172A]">
                            {display.phone || '—'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[#475569] sm:col-span-2 min-w-0">
                        <MapPin className="h-4 w-4 shrink-0 text-[#2563EB]" />
                        <span className="truncate font-medium text-[#0F172A]">
                          {display.location || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className={cn(ef.sectionCard, '!p-5 sm:!p-6 !shadow-none border-[#2563EB]/10')}>
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <Label className={cn(ef.label, 'flex items-center gap-2 text-lg')}>
                      <FileText className="h-5 w-5 text-[#2563EB]" />
                      Company Description
                    </Label>
                    {editing && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => generateAIContent('description')}
                        disabled={aiGenerating}
                        className={ef.aiButton}
                      >
                        {aiGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI Suggest
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {editing && aiSuggestions.description && (
                    <div className={cn('mb-4', ef.suggestionPanel)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#0F172A] flex items-center gap-2 mb-2">
                            <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
                            AI Suggestion
                          </p>
                          <p className="text-sm text-[#475569] leading-relaxed">{aiSuggestions.description}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => applyAISuggestion('description')}
                          className={cn(ef.aiButton, 'shrink-0')}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  )}

                  {editing ? (
                    <Textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className={ef.textarea}
                      placeholder="Describe your company..."
                    />
                  ) : (
                    <p className="text-[#475569] leading-relaxed text-base">{display.description}</p>
                  )}
                </div>

                <div>
                  <h3 className={cn(ef.sectionTitle, 'text-lg mb-4 flex items-center gap-2')}>
                    <Building2 className="h-5 w-5 text-[#2563EB]" />
                    Company Details
                  </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={cn(ef.sectionCard, '!p-4 sm:!p-5')}>
                    <Label className={cn(ef.label, 'mb-2 flex items-center gap-2')}>
                      <MapPin className="h-4 w-4 text-[#2563EB]" />
                      Location
                    </Label>
                    {editing ? (
                      <Input
                        value={formData.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Company Location"
                        className={ef.input}
                      />
                    ) : (
                      <p className="text-[#0F172A] font-medium">{display.location}</p>
                    )}
                  </div>

                  <div className={cn(ef.sectionCard, '!p-4 sm:!p-5')}>
                    <Label className={cn(ef.label, 'mb-2 flex items-center gap-2')}>
                      <Building2 className="h-4 w-4 text-[#2563EB]" />
                      Industry
                    </Label>
                    {editing ? (
                      <Select 
                        value={formData.industry || ''} 
                        onValueChange={(value) => handleInputChange('industry', value)}
                      >
                        <SelectTrigger className={ef.selectTrigger}>
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
                      <p className="text-[#0F172A] font-medium">{display.industry}</p>
                    )}
                  </div>

                  <div className={cn(ef.sectionCard, '!p-4 sm:!p-5')}>
                    <Label className={cn(ef.label, 'mb-2 flex items-center gap-2')}>
                      <Users className="h-4 w-4 text-[#2563EB]" />
                      Company Size
                    </Label>
                    {editing ? (
                      <Select 
                        value={formData.size || ''} 
                        onValueChange={(value) => handleInputChange('size', value)}
                      >
                        <SelectTrigger className={ef.selectTrigger}>
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
                      <p className="text-[#0F172A] font-medium">{display.size} employees</p>
                    )}
                  </div>

                  <div className={cn(ef.sectionCard, '!p-4 sm:!p-5')}>
                    <Label className={cn(ef.label, 'mb-2 flex items-center gap-2')}>
                      <Calendar className="h-4 w-4 text-[#2563EB]" />
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
                        className={ef.input}
                      />
                    ) : (
                      <p className="text-[#0F172A] font-medium">{display.founded || 'Not specified'}</p>
                    )}
                  </div>

                  <div className={cn(ef.sectionCard, '!p-4 sm:!p-5 md:col-span-2')}>
                    <Label className={cn(ef.label, 'mb-2 flex items-center gap-2')}>
                      <Globe className="h-4 w-4 text-[#2563EB]" />
                      Website
                    </Label>
                    {editing ? (
                      <Input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://yourcompany.com"
                        className={ef.input}
                      />
                    ) : display.website ? (
                      <a
                        href={display.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] hover:text-[#1d4ed8] inline-flex items-center gap-2 font-medium"
                      >
                        {display.website}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <p className="text-[#64748B]">No website</p>
                    )}
                  </div>

                  <div className={cn(ef.sectionCard, '!p-4 sm:!p-5')}>
                    <Label className={cn(ef.label, 'mb-2 flex items-center gap-2')}>
                      <Mail className="h-4 w-4 text-[#2563EB]" />
                      Company Email
                    </Label>
                    {editing ? (
                      <Input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={ef.input}
                      />
                    ) : (
                      <p className="text-[#0F172A] font-medium break-all">{display.email || '—'}</p>
                    )}
                  </div>

                  <div className={cn(ef.sectionCard, '!p-4 sm:!p-5')}>
                    <Label className={cn(ef.label, 'mb-2 flex items-center gap-2')}>
                      <Phone className="h-4 w-4 text-[#2563EB]" />
                      Company Phone
                    </Label>
                    {editing ? (
                      <Input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={ef.input}
                      />
                    ) : (
                      <p className="text-[#0F172A] font-medium">{display.phone || '—'}</p>
                    )}
                  </div>
                </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className={ef.mainCard}>
              <CardHeader className="border-b border-[#2563EB]/10 pb-4">
                <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-3">
                  <div className={cn(ef.sectionIconWrap, 'w-10 h-10 p-2')}>
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className={cn(ef.sectionCard, '!p-4 !shadow-none')}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#0F172A]">Verification</span>
                    <Badge
                      className={
                        display.isVerified
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }
                    >
                      {display.isVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    {display.isVerified
                      ? 'Your company is verified and trusted'
                      : 'Verification is under review'}
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-[#2563EB]/10">
                    <span className="text-[#64748B]">Completion</span>
                    <span className="font-bold text-[#2563EB]">{completionPercent}%</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2563EB]/10">
                    <span className="text-[#64748B]">Created</span>
                    <span className="font-semibold text-[#0F172A]">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#64748B]">Updated</span>
                    <span className="font-semibold text-[#0F172A]">
                      {new Date(company.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={ef.mainCard}>
              <CardHeader className="border-b border-[#2563EB]/10 pb-4">
                <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-3">
                  <div className={cn(ef.sectionIconWrap, 'w-10 h-10 p-2')}>
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6 space-y-3">
                <Link href="/employer/jobs/create" className="block">
                  <Button className={cn('w-full', ef.aiButton, 'py-2.5')}>
                    <Briefcase className="h-5 w-5 mr-2" />
                    Post New Job
                  </Button>
                </Link>
                <Link href="/employer/applications" className="block">
                  <Button className={cn('w-full', ef.aiButton, 'py-2.5 opacity-95')}>
                    <Users className="h-5 w-5 mr-2" />
                    View Applications
                  </Button>
                </Link>
                <Link href="/employer/jobs" className="block">
                  <Button variant="outline" className="w-full border-[#2563EB]/20 text-[#0F172A] py-2.5 rounded-xl font-semibold hover:bg-[#2563EB]/5">
                    <FileText className="h-5 w-5 mr-2" />
                    Manage Jobs
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