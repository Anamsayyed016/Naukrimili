'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ResumeUpload from '@/components/resume/ResumeUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, FileText, Sparkles, TrendingUp, CheckCircle, User, MapPin, 
  Briefcase, DollarSign, Target, ArrowRight, Eye, Building2, Heart, Loader2, Search
} from 'lucide-react';
import Link from 'next/link';
import { clearJobseekerRecommendationsCache } from '@/lib/jobseeker/recommendations-cache';

export default function ResumeUploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent'); // 'builder' or null (default job matching)
  
  // Flow states
  const [currentStep, setCurrentStep] = useState<'upload' | 'profile'>('upload');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    expectedSalary: '',
    summary: '',
    skillsText: '',
    educationText: '',
    certificationsText: '',
    languagesText: '',
    linkedin: '',
    github: '',
    portfolio: '',
    currentCompany: '',
    currentDesignation: '',
    totalExperience: '',
  });
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/resumes/upload');
    } else if (session && session.user.role !== 'jobseeker') {
      router.push('/auth/role-selection');
    }
  }, [status, session, router]);

  // Step 1: Resume Upload Complete
  const handleUploadComplete = (data?: any) => {
    if (data?.extractedData) {
      const parsed = data.extractedData;
      setExtractedData(parsed);
      setResumeId(data.resumeId || null);
      
      // Check if intent is resume builder
      if (intent === 'builder') {
        console.log('🎯 Intent is builder - storing data for resume builder');
        console.log('📊 Extracted data received:', {
          hasFullName: !!data.extractedData.fullName,
          hasName: !!data.extractedData.name,
          fullName: data.extractedData.fullName || data.extractedData.name || 'MISSING',
          email: data.extractedData.email || 'MISSING',
          phone: data.extractedData.phone || 'MISSING',
          skillsCount: data.extractedData.skills?.length || 0,
          experienceCount: data.extractedData.experience?.length || 0,
          educationCount: data.extractedData.education?.length || 0
        });
        
        // Store full extracted data in sessionStorage for resume builder
        const dataToStore = {
          ...data.extractedData,
          resumeId: data.resumeId,
        };
        
        sessionStorage.setItem('resume-import-data', JSON.stringify(dataToStore));
        console.log('💾 Data stored in sessionStorage');
        
        toast({
          title: '✅ Resume Imported!',
          description: 'Select a template to build your professional resume...',
          duration: 3000,
        });
        
        // Navigate to template selection with import flag
        router.push('/resume-builder/templates?source=import');
        return;
      }

      // Default flow: unified profile builder prefill from parsedData
      const expArr = Array.isArray(parsed?.experience) ? parsed.experience : [];
      const isCurrent = (e: any) =>
        e?.current === true ||
        /^(present|current|now|ongoing)$/i.test(String(e?.endDate || e?.end_date || e?.end || ''));
      const latestExp =
        expArr.length > 0 ? [...expArr].sort((a, b) => (isCurrent(b) ? 1 : 0) - (isCurrent(a) ? 1 : 0))[0] : null;
      const currentCompany = (latestExp?.company || latestExp?.Company || '').toString();
      const currentDesignation = (latestExp?.position || latestExp?.title || latestExp?.Position || latestExp?.Title || '').toString();

      const skillsArr = Array.isArray(parsed?.skills) ? parsed.skills : [];
      const eduArr = Array.isArray(parsed?.education) ? parsed.education : [];
      const certArr = Array.isArray(parsed?.certifications) ? parsed.certifications : [];
      const langArr = Array.isArray(parsed?.languages) ? parsed.languages : [];

      const skillsText = skillsArr.filter((s: any) => typeof s === 'string' && s.trim()).join(', ');
      const educationText = eduArr
        .map((e: any) => (typeof e === 'string' ? e : (e?.degree || e?.title || e?.institution || e?.school || '')))
        .filter((s: any) => typeof s === 'string' && s.trim())
        .join('\n');
      const certificationsText = certArr
        .map((c: any) => (typeof c === 'string' ? c : (c?.name || c?.title || '')))
        .filter((s: any) => typeof s === 'string' && s.trim())
        .join('\n');
      const languagesText = langArr
        .map((l: any) =>
          typeof l === 'string'
            ? l
            : `${l?.name || l?.language || ''}${l?.proficiency ? ` (${l.proficiency})` : ''}`
        )
        .filter((s: any) => typeof s === 'string' && s.trim())
        .join('\n');

      setProfileForm({
        fullName: (parsed.fullName || parsed.name || '').toString(),
        email: (parsed.email || session?.user?.email || '').toString(),
        phone: (parsed.phone || '').toString(),
        location: (parsed.location || '').toString(),
        expectedSalary: (parsed.expectedSalary || '').toString(),
        summary: (parsed.summary || '').toString(),
        skillsText,
        educationText,
        certificationsText,
        languagesText,
        linkedin: (parsed.linkedin || '').toString(),
        github: (parsed.github || '').toString(),
        portfolio: (parsed.portfolio || parsed.website || '').toString(),
        currentCompany,
        currentDesignation,
        totalExperience: expArr.length ? `${expArr.length} roles` : '',
      });
    }
    
    clearJobseekerRecommendationsCache();

    toast({
      title: '✅ Resume Uploaded!',
      description: 'Review and confirm your complete profile...',
    });
    
    setCurrentStep('profile');
  };

  // Step 2: Unified Profile Builder Submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      if (!resumeId) {
        throw new Error('Resume ID missing. Please re-upload your resume to continue.');
      }

      const fullName = profileForm.fullName.trim();
      const nameParts = fullName.split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ');

      const skills = profileForm.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const experienceString =
        (Array.isArray(extractedData?.experience) ? extractedData.experience : [])
          .map((exp: any) => {
            const company = exp?.company || exp?.Company || '';
            const title = exp?.position || exp?.title || exp?.Position || exp?.Title || '';
            const duration = exp?.duration || exp?.Duration || '';
            const bits = [title, company].filter(Boolean).join(' at ');
            return [bits, duration].filter(Boolean).join(' — ');
          })
          .filter(Boolean)
          .join('\n') || '';

      const educationString = profileForm.educationText || '';
      
      const response = await fetch('/api/jobseeker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: profileForm.phone,
          location: profileForm.location,
          salaryExpectation: profileForm.expectedSalary ? parseInt(profileForm.expectedSalary) : undefined,
          bio: profileForm.summary,
          skills,
          experience: experienceString,
          education: educationString,
          website: profileForm.portfolio,
          linkedin: profileForm.linkedin,
          github: profileForm.github,
        })
      });
      
      console.log('✅ Profile save response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      // Sync Active Resume.parsedData with edited profile fields (reuse existing resume update endpoint)
      const parsedPatch = {
        fullName: profileForm.fullName.trim(),
        name: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone || '',
        location: profileForm.location || '',
        summary: profileForm.summary || '',
        skills,
        expectedSalary: profileForm.expectedSalary ? String(profileForm.expectedSalary) : '',
        linkedin: profileForm.linkedin || '',
        github: profileForm.github || '',
        portfolio: profileForm.portfolio || '',
        website: profileForm.portfolio || '',
      };

      const updatedParsedData = {
        ...(extractedData || {}),
        ...parsedPatch,
      };

      const resumeSyncRes = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedData: updatedParsedData,
        }),
      });

      if (!resumeSyncRes.ok) {
        const errData = await resumeSyncRes.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to sync resume profile');
      }

      toast({
        title: '✅ Profile Saved!',
        description: 'Redirecting to your profile...',
      });

      router.push('/dashboard/jobseeker/profile');

    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currentStep === 'upload' && 'Upload Your Resume'}
                {currentStep === 'profile' && 'Complete Your Profile'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                {currentStep === 'upload' && 'AI-powered resume analysis'}
                {currentStep === 'profile' && 'Review and confirm your full profile'}
              </p>
            </div>
            {currentStep === 'upload' && (
              <Link href="/dashboard/jobseeker">
                <Button variant="outline" className="hidden sm:inline-flex">
                  <FileText className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`h-2 w-2 rounded-full ${currentStep === 'upload' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <div className={`h-2 w-2 rounded-full ${currentStep === 'profile' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* STEP 1: Resume Upload */}
        {currentStep === 'upload' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <Card className="shadow-2xl border-0">
              <CardContent className="p-8 lg:p-12">
                <ResumeUpload onComplete={handleUploadComplete} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2: Single Dynamic Profile Form */}
        {currentStep === 'profile' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-right duration-500">
            <Card className="shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      Complete Your Profile
                      <Badge className="bg-blue-600 text-white">Review</Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Confirm the details extracted from your active resume
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Personal */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900">Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Full Name *</Label>
                        <Input
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                          placeholder="John Doe"
                          required
                          className="h-11 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email</Label>
                        <Input value={profileForm.email} disabled className="h-11 bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Phone</Label>
                        <Input
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          placeholder="+91..."
                          className="h-11 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Location</Label>
                        <Input
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          placeholder="Mumbai, India"
                          className="h-11 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional */}
                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="text-sm font-semibold text-gray-900">Professional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Current Company</Label>
                        <Input value={profileForm.currentCompany} disabled className="h-11 bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Current Designation</Label>
                        <Input value={profileForm.currentDesignation} disabled className="h-11 bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Total Experience</Label>
                        <Input value={profileForm.totalExperience} disabled className="h-11 bg-gray-50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Expected Salary</Label>
                        <Input
                          value={profileForm.expectedSalary}
                          onChange={(e) => setProfileForm({ ...profileForm, expectedSalary: e.target.value })}
                          placeholder="500000"
                          className="h-11 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Career */}
                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="text-sm font-semibold text-gray-900">Career</h3>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Summary</Label>
                      <Textarea
                        value={profileForm.summary}
                        onChange={(e) => setProfileForm({ ...profileForm, summary: e.target.value })}
                        placeholder="Professional summary..."
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Skills (comma-separated)</Label>
                      <Textarea
                        value={profileForm.skillsText}
                        onChange={(e) => setProfileForm({ ...profileForm, skillsText: e.target.value })}
                        placeholder="React, Node.js, SQL..."
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Education (one per line)</Label>
                      <Textarea
                        value={profileForm.educationText}
                        onChange={(e) => setProfileForm({ ...profileForm, educationText: e.target.value })}
                        placeholder="B.Tech — University — 2020"
                        className="bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Certifications (one per line)</Label>
                        <Textarea
                          value={profileForm.certificationsText}
                          onChange={(e) => setProfileForm({ ...profileForm, certificationsText: e.target.value })}
                          placeholder="AWS Certified..."
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Languages (one per line)</Label>
                        <Textarea
                          value={profileForm.languagesText}
                          onChange={(e) => setProfileForm({ ...profileForm, languagesText: e.target.value })}
                          placeholder="English (Fluent)"
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="text-sm font-semibold text-gray-900">Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">LinkedIn</Label>
                        <Input
                          value={profileForm.linkedin}
                          onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                          className="h-11 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">GitHub</Label>
                        <Input
                          value={profileForm.github}
                          onChange={(e) => setProfileForm({ ...profileForm, github: e.target.value })}
                          placeholder="https://github.com/..."
                          className="h-11 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Portfolio</Label>
                        <Input
                          value={profileForm.portfolio}
                          onChange={(e) => setProfileForm({ ...profileForm, portfolio: e.target.value })}
                          placeholder="https://..."
                          className="h-11 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI Pre-fill Banner */}
                  {extractedData && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">AI extracted your information</p>
                          <p className="text-xs text-green-700 mt-1">Review and update any details before continuing</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard/jobseeker')}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      Skip for Now
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !profileForm.fullName}
                      className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg order-1 sm:order-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
