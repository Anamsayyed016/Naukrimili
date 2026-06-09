'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
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
  Briefcase, DollarSign, Target, ArrowRight, Eye, Building2, Heart, Loader2, Search, Star
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
  const didPrefillRef = useRef(false);
  const isDirtyRef = useRef(false);

  const uploadReturnPath =
    intent === 'builder' ? '/resumes/upload?intent=builder' : '/resumes/upload';

  // Redirect if not authenticated — must run before protected content mounts
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.replace(
        `/auth/signin?redirect=${encodeURIComponent(uploadReturnPath)}`
      );
xsdvcvd     } else if (
      session &&
      session.user.role !== 'jobseeker' &&
      session.user.role !== 'admin'
    ) {
      router.replace('/auth/role-selection');
    }
  }, [status, session, router, uploadReturnPath]);

  // Step 1: Resume Upload Complete
  const handleUploadComplete = (data?: any) => {
    if (data?.extractedData) {
      const parsed = data.extractedData;
      console.log('UPLOAD RESPONSE PROJECT KEYS', Object.keys(data.extractedData || {}));
      console.log('UPLOAD RESPONSE PROJECTS', data.extractedData.projects);
      console.log('UPLOAD RESPONSE FULL', data.extractedData);
      const incomingResumeId = (data.resumeId || null) as string | null;
      const isNewResume = !!incomingResumeId && incomingResumeId !== resumeId;

      setExtractedData(parsed);
      setResumeId(incomingResumeId);
      
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

      // Prefill should not overwrite user edits if onComplete fires multiple times.
      // Only prefill once per upload, or when a different resumeId is received.
      if (isNewResume) {
        didPrefillRef.current = false;
        isDirtyRef.current = false;
      }

      if (!didPrefillRef.current || isNewResume) {
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
        didPrefillRef.current = true;
      } else if (!isDirtyRef.current) {
        // If user hasn't edited anything yet, keep read-only derived fields fresh.
        setProfileForm((prev) => ({
          ...prev,
          currentCompany,
          currentDesignation,
          totalExperience: expArr.length ? `${expArr.length} roles` : '',
        }));
      }
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
        currentCompany: profileForm.currentCompany || '',
        currentDesignation: profileForm.currentDesignation || '',
        totalExperience: profileForm.totalExperience || '',
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
        description: 'Redirecting to your dashboard...',
      });

      // After unified profile completion, return to the main jobseeker dashboard (recommendations live here).
      router.push('/dashboard/jobseeker');

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

  const isAuthPending =
    status === 'loading' ||
    status === 'unauthenticated' ||
    (session &&
      session.user.role !== 'jobseeker' &&
      session.user.role !== 'admin');

  if (isAuthPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {status === 'loading' ? 'Loading...' : 'Redirecting to sign in...'}
          </p>
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
            {(() => {
              const countFilled = (v: unknown) => (typeof v === "string" ? v.trim().length > 0 : Boolean(v));
              const completionFields: Array<keyof typeof profileForm> = [
                "fullName",
                "phone",
                "location",
                "currentCompany",
                "currentDesignation",
                "totalExperience",
                "expectedSalary",
                "summary",
                "skillsText",
                "educationText",
                "certificationsText",
                "languagesText",
                "linkedin",
                "github",
                "portfolio",
              ];
              const filled = completionFields.reduce((acc, key) => acc + (countFilled(profileForm[key]) ? 1 : 0), 0);
              const pct = Math.min(98, Math.max(35, Math.round((filled / completionFields.length) * 100)));

              const skillsChips = profileForm.skillsText
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 24);
              const educationLines = profileForm.educationText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6);
              const certLines = profileForm.certificationsText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6);
              const langLines = profileForm.languagesText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 10);

              const fieldBase =
                "h-12 rounded-lg bg-white shadow-sm border border-gray-200/70 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400";
              const fieldDisabled = "bg-gray-50 text-gray-700";
              const cardBase =
                "rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow";

              return (
                <div className="space-y-6">
                  {/* Premium Completion Header */}
                  <Card className="border-0 shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white">
                        <div className="p-6 sm:p-7">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-white/15 rounded-xl border border-white/20">
                                <Sparkles className="h-6 w-6" />
                              </div>
                              <div className="space-y-1">
                                <h2 className="text-xl sm:text-2xl font-bold">Complete Your Profile</h2>
                                <p className="text-sm text-white/85">
                                  Review and update the details extracted from your resume
                                </p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                  <Badge className="bg-white/15 text-white border-white/25">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Resume Uploaded
                                  </Badge>
                                  <Badge className="bg-white/15 text-white border-white/25">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    AI Extracted Information
                                  </Badge>
                                  <Badge className="bg-white/15 text-white border-white/25">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Review & Update Details
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="sm:text-right">
                              <p className="text-sm font-semibold">Profile Progress</p>
                              <p className="text-3xl font-bold">{pct}%</p>
                              <p className="text-xs text-white/80">Complete</p>
                            </div>
                          </div>

                          <div className="mt-5">
                            <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-300 via-white/80 to-blue-200"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <form onSubmit={handleProfileSubmit} className="space-y-6 pb-24">
                    {/* Personal Information */}
                    <Card className={cardBase}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-indigo-600" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              Full Name *
                            </Label>
                            <Input
                              value={profileForm.fullName}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, fullName: e.target.value }));
                              }}
                              placeholder="John Doe"
                              required
                              className={fieldBase}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              Email
                            </Label>
                            <Input value={profileForm.email} disabled className={`${fieldBase} ${fieldDisabled}`} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Target className="h-4 w-4 text-gray-500" />
                              Phone
                            </Label>
                            <Input
                              value={profileForm.phone}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, phone: e.target.value }));
                              }}
                              placeholder="+91..."
                              className={fieldBase}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              Location
                            </Label>
                            <Input
                              value={profileForm.location}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, location: e.target.value }));
                              }}
                              placeholder="Mumbai, India"
                              className={fieldBase}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Professional Information */}
                    <Card className={cardBase}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          Professional Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              Current Company
                            </Label>
                            <Input
                              value={profileForm.currentCompany}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, currentCompany: e.target.value }));
                              }}
                              placeholder="Company name"
                              className={fieldBase}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-500" />
                              Current Designation
                            </Label>
                            <Input
                              value={profileForm.currentDesignation}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, currentDesignation: e.target.value }));
                              }}
                              placeholder="Job title"
                              className={fieldBase}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-gray-500" />
                              Total Experience
                            </Label>
                            <Input
                              value={profileForm.totalExperience}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, totalExperience: e.target.value }));
                              }}
                              placeholder="e.g., 5 years"
                              className={fieldBase}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              Expected Salary
                            </Label>
                            <Input
                              value={profileForm.expectedSalary}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, expectedSalary: e.target.value }));
                              }}
                              placeholder="500000"
                              className={fieldBase}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Career Information */}
                    <Card className={cardBase}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          Career Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            Summary
                          </Label>
                          <Textarea
                            value={profileForm.summary}
                            onChange={(e) => {
                              isDirtyRef.current = true;
                              setProfileForm((prev) => ({ ...prev, summary: e.target.value }));
                            }}
                            placeholder="Write a crisp summary like LinkedIn…"
                            className="min-h-[120px] rounded-lg bg-white shadow-sm border border-gray-200/70 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Star className="h-4 w-4 text-gray-500" />
                            Skills
                          </Label>
                          <Textarea
                            value={profileForm.skillsText}
                            onChange={(e) => {
                              isDirtyRef.current = true;
                              setProfileForm((prev) => ({ ...prev, skillsText: e.target.value }));
                            }}
                            placeholder="React, Node.js, SQL…"
                            className="min-h-[90px] rounded-lg bg-white shadow-sm border border-gray-200/70 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                          />
                          {skillsChips.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {skillsChips.map((s) => (
                                <Badge key={s} className="bg-blue-50 text-blue-800 border-blue-200 px-2.5 py-1 rounded-full">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              Education
                            </Label>
                            <Textarea
                              value={profileForm.educationText}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, educationText: e.target.value }));
                              }}
                              placeholder="One per line…"
                              className="min-h-[110px] rounded-lg bg-white shadow-sm border border-gray-200/70 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                            />
                            {educationLines.length > 0 && (
                              <div className="space-y-2 pt-1">
                                {educationLines.map((line, idx) => (
                                  <div key={`${line}-${idx}`} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                                    {line}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              Certifications
                            </Label>
                            <Textarea
                              value={profileForm.certificationsText}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, certificationsText: e.target.value }));
                              }}
                              placeholder="One per line…"
                              className="min-h-[110px] rounded-lg bg-white shadow-sm border border-gray-200/70 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                            />
                            {certLines.length > 0 && (
                              <div className="space-y-2 pt-1">
                                {certLines.map((line, idx) => (
                                  <div key={`${line}-${idx}`} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-800">
                                    {line}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            Languages
                          </Label>
                          <Textarea
                            value={profileForm.languagesText}
                            onChange={(e) => {
                              isDirtyRef.current = true;
                              setProfileForm((prev) => ({ ...prev, languagesText: e.target.value }));
                            }}
                            placeholder="One per line…"
                            className="min-h-[90px] rounded-lg bg-white shadow-sm border border-gray-200/70 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-400"
                          />
                          {langLines.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {langLines.map((line, idx) => (
                                <Badge key={`${line}-${idx}`} className="bg-purple-50 text-purple-800 border-purple-200 px-2.5 py-1 rounded-full">
                                  {line}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Social Profiles */}
                    <Card className={cardBase}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <ArrowRight className="h-5 w-5 text-indigo-600" />
                          Social Profiles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-blue-700" />
                              LinkedIn
                            </Label>
                            <Input
                              value={profileForm.linkedin}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, linkedin: e.target.value }));
                              }}
                              placeholder="https://linkedin.com/in/…"
                              className={fieldBase}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Star className="h-4 w-4 text-gray-700" />
                              GitHub
                            </Label>
                            <Input
                              value={profileForm.github}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, github: e.target.value }));
                              }}
                              placeholder="https://github.com/…"
                              className={fieldBase}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Eye className="h-4 w-4 text-gray-700" />
                              Portfolio
                            </Label>
                            <Input
                              value={profileForm.portfolio}
                              onChange={(e) => {
                                isDirtyRef.current = true;
                                setProfileForm((prev) => ({ ...prev, portfolio: e.target.value }));
                              }}
                              placeholder="https://…"
                              className={fieldBase}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Sticky Bottom Action Bar */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/85 backdrop-blur">
                      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/dashboard/jobseeker')}
                            className="h-11 rounded-lg"
                          >
                            Skip for Now
                          </Button>
                          <Button
                            type="submit"
                            disabled={saving || !profileForm.fullName}
                            className="h-11 rounded-lg px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                          >
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving…
                              </>
                            ) : (
                              <>
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
