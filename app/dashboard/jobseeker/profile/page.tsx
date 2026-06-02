"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Linkedin, 
  Github,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Star,
  Sparkles,
  Loader2,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Award,
  Upload,
  FileText,
  Eye,
  Home as HomeIcon,
  MapPinIcon,
  Building2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import AuthGuard from "@/components/auth/AuthGuard";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import LinkPhoneSection from "@/components/auth/LinkPhoneSection";
import { useRouter } from "next/navigation";

interface ProfileData {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  location?: string;
  bio?: string;
  skills: string[];
  experience?: string;
  education?: string;
  profilePicture?: string;
  locationPreference?: string;
  salaryExpectation?: number;
  jobTypePreference: string[];
  remotePreference: boolean;
  website?: string;
  linkedin?: string;
  github?: string;
  stats: {
    totalApplications: number;
    activeApplications: number;
    totalBookmarks: number;
    totalResumes: number;
    profileCompletion: number;
  };
}

export default function JobSeekerProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [hasResume, setHasResume] = useState(false);
  const [uploadedResumeData, setUploadedResumeData] = useState<any>(null);
  const [activeResumeParsedData, setActiveResumeParsedData] = useState<any>(null);
  const [showForm, setShowForm] = useState(true);
  
  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: string]: string[] }>({});
  const [aiLoading, setAiLoading] = useState<{ [key: string]: boolean }>({});
  const debounceTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // Popular skills by category
  const popularSkills = {
    'Technical': ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Git'],
    'Design': ['Figma', 'Adobe XD', 'Photoshop', 'UI/UX', 'Wireframing', 'Prototyping'],
    'Marketing': ['SEO', 'Google Analytics', 'Content Writing', 'Social Media', 'Email Marketing'],
    'Management': ['Project Management', 'Team Leadership', 'Agile', 'Scrum', 'Communication'],
    'Data': ['Excel', 'Power BI', 'Tableau', 'Data Analysis', 'Statistics', 'Machine Learning']
  };

  useEffect(() => {
    fetchProfile();
    checkResumeStatus();
    
    // Cleanup debounce timers on unmount
    return () => {
      Object.values(debounceTimerRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const checkResumeStatus = async () => {
    try {
      const response = await fetch('/api/jobseeker/resumes?status=active&limit=1');
      if (response.ok) {
        const data = await response.json();
        const resumes = data?.data?.resumes || data?.resumes || [];
        const hasUserResume = Array.isArray(resumes) && resumes.length > 0;
        setHasResume(hasUserResume);
        if (hasUserResume) {
          setUploadedResumeData(resumes[0]);
          setActiveResumeParsedData(resumes[0]?.parsedData || null);
        }
      }
    } catch (error) {
      console.error('Error checking resume status:', error);
    }
  };

  const fetchProfile = async (preserveFormVisibility = false) => {
    try {
      // Only set loading if we're not preserving form visibility (initial load)
      if (!preserveFormVisibility) {
        setLoading(true);
      }
      const response = await fetch('/api/jobseeker/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        // CRITICAL FIX: Ensure arrays are always arrays, never null or other types
        const profileData = {
          ...data.data,
          skills: Array.isArray(data.data.skills) ? data.data.skills : [],
          jobTypePreference: Array.isArray(data.data.jobTypePreference) ? data.data.jobTypePreference : [],
          remotePreference: data.data.remotePreference || false
        };
        setProfile(profileData);
        
        // Keep the dashboard as viewer/editor only (no separate completion flow).
      }
    } catch (_error) {
      console.error('Error fetching profile:', _error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile data',
        variant: 'destructive'
      });
    } finally {
      if (!preserveFormVisibility) {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const response = await fetch('/api/jobseeker/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      if (data.success) {
        // CRITICAL FIX: Ensure arrays are always arrays after save
        const profileData = {
          ...data.data,
          skills: Array.isArray(data.data.skills) ? data.data.skills : [],
          jobTypePreference: Array.isArray(data.data.jobTypePreference) ? data.data.jobTypePreference : [],
          remotePreference: data.data.remotePreference || false
        };
        setProfile(profileData);
        toast({
          title: '✅ Success',
          description: 'Profile updated successfully! Your job recommendations will be refreshed.',
        });
      }
    } catch (_error) {
      console.error('Error updating profile:', _error);
      toast({
        title: 'Error',
        description: _error instanceof Error ? _error.message : 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    if (!profile) {
      console.warn('⚠️ Cannot update field - profile not loaded yet');
      return;
    }
    setProfile({ ...profile, [field]: value });
    
    // Auto-trigger AI suggestions for bio and experience fields (with debounce)
    if ((field === 'bio' || field === 'experience') && typeof value === 'string' && value.length >= 10) {
      console.log(`⌨️ User typing in ${field}: ${value.length} characters`);
      
      // Clear existing timer
      if (debounceTimerRef.current[field]) {
        clearTimeout(debounceTimerRef.current[field]);
      }
      
      // Set new timer - reduced to 800ms for real-time AI suggestions
      debounceTimerRef.current[field] = setTimeout(() => {
        console.log(`⏰ Debounce complete for ${field}, triggering AI suggestions...`);
        getAiSuggestions(field as 'bio' | 'experience');
      }, 800); // 800ms debounce for faster real-time suggestions
    }
  };

  const getAiSuggestions = async (field: 'bio' | 'experience' | 'skills') => {
    if (!profile) {
      console.log('⚠️ No profile data available for AI suggestions');
      return;
    }
    
    try {
      setAiLoading(prev => ({ ...prev, [field]: true }));
      console.log(`🤖 Generating AI suggestions for ${field}...`);
      
      const currentValue = (profile as any)[field];
      const context = {
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        experience: profile.experience,
        education: profile.education,
        location: profile.location,
        jobTypePreference: Array.isArray(profile.jobTypePreference) ? profile.jobTypePreference : [],
        currentBio: profile.bio,
        userInput: currentValue // What user is typing
      };
      
      console.log(`📤 Sending request to AI API with context:`, { field, valueLength: currentValue?.length });
      
      const response = await fetch('/api/ai/form-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          value: currentValue || '',
          context
        })
      });
      
      console.log(`📥 AI API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ AI API response:`, data);
        
        if (data.success && data.suggestions && data.suggestions.length > 0) {
          setAiSuggestions(prev => ({ ...prev, [field]: data.suggestions }));
          console.log(`✨ Showing ${data.suggestions.length} AI suggestions for ${field}`);
          
          toast({
            title: '✨ AI Suggestions Ready',
            description: `Got ${data.suggestions.length} ${data.aiProvider === 'fallback-dynamic' ? 'smart' : 'AI-powered'} suggestions`,
          });
        } else {
          console.warn('⚠️ No suggestions returned from AI');
          toast({
            title: 'No suggestions available',
            description: 'Try adding more details for better AI suggestions',
            variant: 'default'
          });
        }
      } else {
        console.error(`❌ AI API error: ${response.status}`);
        toast({
          title: 'AI temporarily unavailable',
          description: 'Please try again in a moment',
          variant: 'destructive'
        });
      }
    } catch (_error) {
      console.error('❌ AI suggestions error:', _error);
      toast({
        title: 'Connection error',
        description: 'Unable to fetch AI suggestions',
        variant: 'destructive'
      });
    } finally {
      setAiLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  const applySuggestion = (field: string, suggestion: string) => {
    if (!profile) return;
    
    if (field === 'skills') {
      // Add skill if not already present
      const currentSkills = profile.skills || [];
      if (!currentSkills.includes(suggestion)) {
        setProfile({
          ...profile,
          skills: [...currentSkills, suggestion]
        });
      }
    } else {
      // Replace field value with suggestion
      setProfile({ ...profile, [field]: suggestion });
    }
    
    // Clear suggestions after applying
    setAiSuggestions(prev => ({ ...prev, [field]: [] }));
  };

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    if (value.endsWith(',') || value.endsWith(' ')) {
      const skill = value.slice(0, -1).trim();
      if (skill && profile) {
        const currentSkills = profile.skills || [];
        if (!currentSkills.includes(skill)) {
          setProfile({
            ...profile,
            skills: [...currentSkills, skill]
          });
        }
        setSkillsInput('');
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (!profile) return;
    const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
    setProfile({
      ...profile,
      skills: currentSkills.filter(skill => skill !== skillToRemove)
    });
  };

  const addPopularSkill = (skill: string) => {
    if (!profile) return;
    const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
    if (!currentSkills.includes(skill)) {
      setProfile({
        ...profile,
        skills: [...currentSkills, skill]
      });
    }
  };

  const toggleJobTypePreference = (jobType: string) => {
    if (!profile) return;
    const currentPreferences = Array.isArray(profile.jobTypePreference) ? profile.jobTypePreference : [];
    const updated = currentPreferences.includes(jobType)
      ? currentPreferences.filter(type => type !== jobType)
      : [...currentPreferences, jobType];
    setProfile({ ...profile, jobTypePreference: updated });
  };

  // Only show loading screen on initial load, not after resume upload
  if (loading && !showForm && !hasResume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h3>
              <p className="text-gray-600 mb-6">Unable to load your profile data</p>
              <Button onClick={() => fetchProfile()} className="w-full">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 max-w-7xl">
          {/* Back Button */}
          <div className="mb-4">
            <BackButton fallbackUrl="/dashboard/jobseeker" label="Back to Dashboard" />
          </div>

          {/* Enhanced Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="space-y-1 sm:space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Your Profile
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  View your resume profile and manage your job preferences
                </p>
              </div>
              {/* Save Button - Desktop Only (Mobile has bottom button) */}
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="hidden lg:flex h-11 sm:h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* No onboarding / completion flow here. Use `/resumes/upload` for completion. */}

          {/* Uploaded Resume Info - Show after upload */}
          {hasResume && uploadedResumeData && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-full">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base sm:text-lg">✅ Resume Uploaded</h3>
                        <p className="text-xs sm:text-sm text-white/90 truncate" title={uploadedResumeData.fileName || 'Your resume'}>
                          {uploadedResumeData.fileName || 'Your resume'}
                        </p>
                      </div>
                    </div>
                    <a href="/dashboard/jobseeker/resumes">
                      <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                        <Eye className="h-4 w-4 mr-2" />
                        View Resume
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Unified Profile Form Section - Single responsive form for all devices */}
          {showForm && (
            <div className="space-y-4 sm:space-y-6">
              {/* Profile Completion Banner - Show when form is visible */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-0 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 text-white shadow-xl overflow-visible">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="p-2 sm:p-3 bg-white/20 rounded-full flex-shrink-0">
                          <Target className="h-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold mb-1">Profile Completion: {profile?.stats?.profileCompletion || 0}%</h3>
                          <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${profile?.stats?.profileCompletion || 0}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="bg-white h-full rounded-full"
                            />
                          </div>
                          <p className="text-xs sm:text-sm mt-1 text-white/90">
                            {(profile?.stats?.profileCompletion || 0) < 50 ? '⚡ Complete your profile to unlock AI job matching' :
                             (profile?.stats?.profileCompletion || 0) < 80 ? '🎯 Almost there! Add more details for better matches' :
                             '🌟 Excellent! Your profile is optimized for top opportunities'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <Badge className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 sm:px-3 py-1">
                          <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {profile?.stats?.totalApplications || 0} Apps
                        </Badge>
                        <Badge className="bg-white/20 text-white border-white/30 text-xs sm:text-sm px-2 sm:px-3 py-1">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {profile?.stats?.totalBookmarks || 0} Saved
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main Profile Form - Single unified responsive layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Main Form Content - Responsive: Full width on mobile, 2/3 width on desktop */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1">
              
              {/* Basic Information - AI Enhanced */}
              <Card className="border-0 shadow-lg overflow-visible" style={{ overflow: 'visible' }}>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-visible" style={{ overflow: 'visible' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                        Full Name
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      </Label>
                      <Input
                        id="name"
                        value={profile?.name || ''}
                        disabled
                        className="bg-gray-100 h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                      <Input
                        id="email"
                        value={profile?.email || ''}
                        disabled
                        className="bg-gray-100 h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <LinkPhoneSection
                        currentPhone={profile?.phone}
                        phoneVerified={profile?.phoneVerified}
                        onLinked={() => fetchProfile(true)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={profile?.location || ''}
                        disabled
                        className="bg-gray-100 h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resume-derived Profile (read-only) */}
              <Card className="border-0 shadow-lg overflow-visible">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                    Resume Profile (Active Resume)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4">
                  {(() => {
                    const parsed = activeResumeParsedData || {};
                    const expArr = Array.isArray((parsed as any)?.experience) ? (parsed as any).experience : [];
                    const isCurrent = (e: any) =>
                      e?.current === true ||
                      /^(present|current|now|ongoing)$/i.test(String(e?.endDate || e?.end_date || e?.end || ''));
                    const latestExp =
                      expArr.length > 0 ? [...expArr].sort((a, b) => (isCurrent(b) ? 1 : 0) - (isCurrent(a) ? 1 : 0))[0] : null;
                    const currentCompany = latestExp?.company || latestExp?.Company || '';
                    const currentDesignation = latestExp?.position || latestExp?.title || latestExp?.Position || latestExp?.Title || '';

                    const summary = (parsed as any)?.summary || '';
                    const skills = Array.isArray((parsed as any)?.skills) ? (parsed as any).skills : [];
                    const education = Array.isArray((parsed as any)?.education) ? (parsed as any).education : [];
                    const certifications = Array.isArray((parsed as any)?.certifications) ? (parsed as any).certifications : [];
                    const languages = Array.isArray((parsed as any)?.languages) ? (parsed as any).languages : [];

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Current Company</p>
                            <p className="text-sm font-semibold text-gray-900">{String(currentCompany || '—')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Current Designation</p>
                            <p className="text-sm font-semibold text-gray-900">{String(currentDesignation || '—')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total Experience</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {expArr.length ? `${expArr.length} roles` : '—'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Summary</p>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(summary || '—')}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {skills.length > 0 ? (
                              skills.slice(0, 30).map((s: any, idx: number) => (
                                <Badge key={idx} className="bg-slate-100 text-slate-800 border-slate-200">
                                  {String(s)}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-gray-700">—</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Education</p>
                          {education.length > 0 ? (
                            <div className="space-y-2">
                              {education.slice(0, 8).map((e: any, idx: number) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-sm font-medium text-gray-900">
                                    {typeof e === 'string'
                                      ? e
                                      : String(e?.degree || e?.title || e?.institution || e?.school || 'Education')}
                                  </p>
                                  {typeof e !== 'string' && (e?.institution || e?.school) && (
                                    <p className="text-xs text-gray-600">{String(e?.institution || e?.school)}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700">—</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Certifications</p>
                            {certifications.length > 0 ? (
                              <ul className="text-sm text-gray-800 list-disc pl-5 space-y-1">
                                {certifications.slice(0, 8).map((c: any, idx: number) => (
                                  <li key={idx}>
                                    {typeof c === 'string' ? c : String(c?.name || c?.title || 'Certification')}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-700">—</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Languages</p>
                            {languages.length > 0 ? (
                              <ul className="text-sm text-gray-800 list-disc pl-5 space-y-1">
                                {languages.slice(0, 8).map((l: any, idx: number) => (
                                  <li key={idx}>
                                    {typeof l === 'string'
                                      ? l
                                      : `${l?.name || l?.language || ''}${l?.proficiency ? ` (${l.proficiency})` : ''}`}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-700">—</p>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Resume-derived fields are now read-only above. */}

              {/* Job Preferences */}
              <Card className="border-0 shadow-lg overflow-visible" style={{ overflow: 'visible' }}>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    Job Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-visible" style={{ overflow: 'visible' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="locationPreference" className="text-sm font-semibold flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-blue-600" />
                        Preferred Location
                      </Label>
                      <Input
                        id="locationPreference"
                        value={profile?.locationPreference || ''}
                        onChange={(e) => handleInputChange('locationPreference', e.target.value)}
                        placeholder="Where would you like to work?"
                        className="h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salaryExpectation" className="text-sm font-semibold flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Expected Salary (Annual)
                      </Label>
                      <Input
                        id="salaryExpectation"
                        type="number"
                        value={profile?.salaryExpectation || ''}
                        onChange={(e) => handleInputChange('salaryExpectation', parseInt(e.target.value) || null)}
                        placeholder="e.g., 50000"
                        className="h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                      Preferred Job Types
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Remote'].map((jobType) => {
                        const value = jobType.toLowerCase().replace(' ', '-');
                        const isChecked = (profile.jobTypePreference || []).includes(value);
                        return (
                          <label 
                            key={jobType} 
                            className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                              isChecked 
                                ? 'bg-blue-50 border-blue-400 shadow-sm' 
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                            }`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleJobTypePreference(value)}
                            />
                            <span className="text-xs sm:text-sm font-medium">{jobType}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <Checkbox
                        id="remotePreference"
                        checked={profile.remotePreference || false}
                        onCheckedChange={(checked) => handleInputChange('remotePreference', checked)}
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="remotePreference" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                          <HomeIcon className="h-4 w-4 text-green-600" />
                          Open to Remote Work
                        </Label>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Show me remote job opportunities from anywhere
                        </p>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Professional links are resume-derived and shown read-only in Resume Profile. */}

              {/* Save Button - Mobile Only (Desktop has header button) */}
              <div className="lg:hidden mt-4 sm:mt-6">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save All Changes
                    </>
                  )}
                </Button>
              </div>
                </div>

                {/* Sidebar - Responsive: Full width on mobile (below form), 1/3 width on desktop (right side) */}
                <div className="space-y-4 sm:space-y-6 order-2 lg:order-2">
                  {/* Profile Statistics */}
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30 overflow-visible" style={{ overflow: 'visible' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-blue-600" />
                        Your Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 overflow-visible" style={{ overflow: 'visible' }}>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          Applications
                        </span>
                        <span className="font-bold text-blue-600 text-lg">{profile?.stats?.totalApplications || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-100">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Active
                        </span>
                        <span className="font-bold text-green-600 text-lg">{profile?.stats?.activeApplications || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-100">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <Star className="h-4 w-4 text-red-600" />
                          Saved Jobs
                        </span>
                        <span className="font-bold text-red-600 text-lg">{profile?.stats?.totalBookmarks || 0}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-purple-100">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-purple-600" />
                          Resumes
                        </span>
                        <span className="font-bold text-purple-600 text-lg">{profile?.stats?.totalResumes || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Job Matching Score */}
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 text-white overflow-visible" style={{ overflow: 'visible' }}>
                    <CardContent className="p-4 sm:p-6 overflow-visible" style={{ overflow: 'visible' }}>
                      <div className="text-center space-y-3">
                        <Sparkles className="h-8 w-8 mx-auto" />
                        <h3 className="text-lg font-bold">AI Match Score</h3>
                        <div className="text-5xl font-bold">{profile?.stats?.profileCompletion || 0}%</div>
                        <p className="text-xs text-white/90">
                          {(profile?.stats?.profileCompletion || 0) < 50 ? 'Add more details to improve match accuracy' :
                           (profile?.stats?.profileCompletion || 0) < 80 ? 'Great! Employers can easily find you' :
                           'Perfect! You\'ll get top job recommendations'}
                        </p>
                        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mt-3">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${profile?.stats?.profileCompletion || 0}%` }}
                            transition={{ duration: 1 }}
                            className="bg-white h-full rounded-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="border-0 shadow-lg overflow-visible" style={{ overflow: 'visible' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 overflow-visible" style={{ overflow: 'visible' }}>
                      <a href="/dashboard/jobseeker/resumes">
                        <Button variant="outline" className="w-full justify-start h-11 hover:bg-purple-50 hover:border-purple-300 transition-all">
                          <Upload className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="text-sm font-medium">Upload Resume</span>
                        </Button>
                      </a>
                      <a href="/dashboard/jobseeker/applications">
                        <Button variant="outline" className="w-full justify-start h-11 hover:bg-blue-50 hover:border-blue-300 transition-all">
                          <Briefcase className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="text-sm font-medium">View Applications</span>
                        </Button>
                      </a>
                      <a href="/jobs">
                        <Button variant="outline" className="w-full justify-start h-11 hover:bg-red-50 hover:border-red-300 transition-all">
                          <Star className="h-4 w-4 mr-2 text-red-600" />
                          <span className="text-sm font-medium">Saved Jobs</span>
                        </Button>
                      </a>
                      <a href="/jobs">
                        <Button className="w-full justify-center h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all">
                          <Building2 className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">Browse Jobs</span>
                        </Button>
                      </a>
                    </CardContent>
                  </Card>

                  {/* AI Tips */}
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-l-orange-400 overflow-visible" style={{ overflow: 'visible' }}>
                    <CardContent className="p-4 overflow-visible" style={{ overflow: 'visible' }}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-full flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-orange-900 mb-1">💡 Pro Tip</h4>
                          <p className="text-xs text-orange-800 leading-relaxed">
                            Add 5-10 relevant skills and complete all sections to get 3x more job recommendations!
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
