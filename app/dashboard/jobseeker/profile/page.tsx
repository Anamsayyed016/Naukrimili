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
import ResumeUpload from "@/components/resume/ResumeUpload";

interface ProfileData {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [hasResume, setHasResume] = useState(false);
  const [uploadedResumeData, setUploadedResumeData] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
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
      const response = await fetch('/api/jobseeker/resumes');
      if (response.ok) {
        const data = await response.json();
        const hasUserResume = data.resumes && data.resumes.length > 0;
        setHasResume(hasUserResume);
        setShowForm(hasUserResume); // Show form if resume exists
        if (hasUserResume) {
          setUploadedResumeData(data.resumes[0]);
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
        
        // If preserving form visibility, ensure it stays visible
        if (preserveFormVisibility) {
          setShowForm(true);
          setHasResume(true);
        }
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
      
      // Set new timer - reduced to 1.5 seconds for better UX
      debounceTimerRef.current[field] = setTimeout(() => {
        console.log(`⏰ Debounce complete for ${field}, triggering AI suggestions...`);
        getAiSuggestions(field as 'bio' | 'experience');
      }, 1500); // 1.5 second debounce
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

  const handleResumeUploadComplete = async (data?: any) => {
    console.log('📥 Resume upload complete callback received:', data);
    console.log('📊 Current state - hasResume:', hasResume, 'showForm:', showForm);
    
    // Always set resume status and show form FIRST (before any async operations)
    setHasResume(true);
    setShowForm(true);
    
    console.log('✅ State updated - hasResume: true, showForm: true');
    
    // Store uploaded resume data
    if (data) {
      const resumeData = {
        ...data,
        fileName: data.fileName || data.extractedData?.fileName || data.profile?.fileName || 'Resume'
      };
      setUploadedResumeData(resumeData);
      console.log('💾 Uploaded resume data stored:', resumeData);
    }
    
    if (data && (data.extractedData || data.profile)) {
      console.log('✅ Resume uploaded with extracted data, auto-filling profile...');
      
      // Auto-fill profile from extracted data (support both extractedData and profile)
      const extracted = data.extractedData || data.profile;
      
      // Wait for profile to be loaded if it's not yet available
      if (!profile) {
        console.log('⏳ Profile not loaded yet, fetching profile first...');
        await fetchProfile(true); // Preserve form visibility
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Update profile with extracted data (use current profile or create new structure)
      const currentProfile = profile || {
        id: '',
        name: '',
        email: '',
        skills: [],
        jobTypePreference: [],
        remotePreference: false,
        stats: {
          totalApplications: 0,
          activeApplications: 0,
          totalBookmarks: 0,
          totalResumes: 0,
          profileCompletion: 0
        }
      };
      
      const nameParts = extracted.fullName?.split(' ') || [];
      const updatedProfile = {
        ...currentProfile,
        name: extracted.fullName || currentProfile.name || '',
        firstName: nameParts[0] || currentProfile.firstName || '',
        lastName: nameParts.slice(1).join(' ') || currentProfile.lastName || '',
        phone: extracted.phone || currentProfile.phone || '',
        location: extracted.location || currentProfile.location || '',
        bio: extracted.summary || currentProfile.bio || '',
        skills: Array.isArray(extracted.skills) ? extracted.skills : (Array.isArray(currentProfile.skills) ? currentProfile.skills : []),
        experience: extracted.experience?.map((exp: any) => {
          const startDate = exp.startDate || exp.start_date || '';
          const endDate = exp.endDate || exp.end_date || (exp.current ? 'Present' : '');
          const duration = startDate && endDate ? `${startDate} - ${endDate}` : (startDate || endDate || 'N/A');
          return `${exp.position || exp.job_title || exp.title || 'Position'} at ${exp.company || exp.organization || 'Company'} (${duration})`;
        }).join('\n\n') || currentProfile.experience || '',
        education: extracted.education?.map((edu: any) => {
          const year = edu.endDate || edu.end_date || edu.year || 'N/A';
          return `${edu.degree || edu.qualification || 'Degree'} - ${edu.institution || edu.school || edu.university || 'Institution'} (${year})`;
        }).join('\n\n') || currentProfile.education || ''
      };
      
      setProfile(updatedProfile);
      
      console.log('✅ Profile auto-filled with extracted data');
      console.log('📋 Updated profile:', updatedProfile);
      
      // Ensure form is still visible after profile update
      setShowForm(true);
      setHasResume(true);
      
      toast({
        title: '✅ Resume Processed!',
        description: 'Your profile has been auto-filled. Review and save changes.',
        duration: 4000,
      });
      
      // Refresh to get updated stats (but preserve form visibility)
      fetchProfile(true).then(() => {
        // Ensure form stays visible after profile fetch
        setShowForm(true);
        setHasResume(true);
        console.log('✅ Profile refreshed, form visibility maintained');
      });
    } else {
      console.warn('⚠️ Resume upload completed but no extracted data found:', data);
      
      // Still ensure form is visible
      setShowForm(true);
      setHasResume(true);
      
      toast({
        title: 'Resume Uploaded',
        description: 'Resume uploaded successfully. Please fill your profile manually.',
        variant: 'default',
      });
      
      // Still refresh to get updated stats (but preserve form visibility)
      fetchProfile(true).then(() => {
        setShowForm(true);
        setHasResume(true);
        console.log('✅ Profile refreshed after upload, form visibility maintained');
      });
    }
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
              <Button onClick={fetchProfile} className="w-full">
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
                  AI-Powered Profile Management
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Optimize your profile for better job matches • AI suggestions available
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

          {/* Resume Upload Section - Show if no resume */}
          {!hasResume && !showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-0 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 text-white shadow-2xl">
                <CardContent className="p-6 sm:p-10">
                  <div className="text-center max-w-2xl mx-auto space-y-6">
                    <div className="p-4 bg-white/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                      <Upload className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold">Upload Your Resume to Get Started</h2>
                    <p className="text-base sm:text-lg text-white/90">
                      Our AI will analyze your resume and auto-fill your profile with your skills, experience, and education. Get personalized job recommendations instantly!
                    </p>
                    <div className="bg-white/10 rounded-lg p-4 text-left space-y-2">
                      <p className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> AI-powered resume parsing
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Auto-fill profile fields
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Get instant job matches
                      </p>
                      <p className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> ATS score & optimization tips
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-6 mt-6">
                      <ResumeUpload onComplete={handleResumeUploadComplete} />
                    </div>
                    <button
                      onClick={() => setShowForm(true)}
                      className="text-sm text-white/80 hover:text-white underline transition-colors"
                    >
                      Skip and fill manually →
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                          <Target className="h-5 h-5 sm:h-6 sm:w-6" />
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
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        className="h-11 sm:h-12 text-sm sm:text-base"
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
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={profile?.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="h-11 sm:h-12 text-sm sm:text-base"
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
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, State, Country"
                        className="h-11 sm:h-12 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* Bio with AI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bio" className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        Professional Bio
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => getAiSuggestions('bio')}
                        disabled={aiLoading.bio}
                        className="h-8 text-xs border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                      >
                        {aiLoading.bio ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1 text-purple-600" />
                        )}
                        AI Suggest Bio
                      </Button>
                    </div>
                    <div className="relative">
                      <Textarea
                        id="bio"
                        value={profile?.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Write a compelling bio that highlights your skills, experience, and career goals... (AI will suggest based on your profile)"
                        rows={4}
                        className="resize-none text-sm sm:text-base"
                      />
                      {aiLoading.bio && (
                        <div className="absolute top-2 right-2">
                          <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    {/* AI Suggestions for Bio */}
                    <AnimatePresence>
                      {aiSuggestions.bio && aiSuggestions.bio.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 bg-purple-50 border border-purple-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-purple-800 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI Suggested Bios:
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setAiSuggestions(prev => ({ ...prev, bio: [] }))}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          {aiSuggestions.bio.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => applySuggestion('bio', suggestion)}
                              className="w-full text-left text-xs sm:text-sm p-2 sm:p-3 bg-white hover:bg-purple-100 border border-purple-200 hover:border-purple-400 rounded-lg transition-all duration-200"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>

              {/* Skills - AI Enhanced */}
              <Card className="border-0 shadow-lg overflow-visible" style={{ overflow: 'visible' }}>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    Skills & Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 overflow-visible" style={{ overflow: 'visible' }}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="skills" className="text-sm font-semibold">
                        Add Skills (comma or space to add)
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => getAiSuggestions('skills')}
                        disabled={aiLoading.skills}
                        className="h-8 text-xs border-green-200 hover:bg-green-50 hover:border-green-300"
                      >
                        {aiLoading.skills ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1 text-green-600" />
                        )}
                        AI Suggest Skills
                      </Button>
                    </div>
                    <Input
                      id="skills"
                      value={skillsInput}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      placeholder="e.g., React, Python, Project Management (press comma or space)"
                      className="h-11 sm:h-12"
                    />
                  </div>

                  {/* Selected Skills */}
                  {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Your Skills ({profile.skills.length})</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            className="bg-green-100 text-green-800 border-green-300 px-3 py-1.5 text-sm hover:bg-green-200 transition-colors"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-2 hover:text-green-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Suggested Skills */}
                  <AnimatePresence>
                    {aiSuggestions.skills && aiSuggestions.skills.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 bg-green-50 border border-green-200 rounded-lg p-3"
                      >
                        <p className="text-xs font-semibold text-green-800 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI Suggested Skills (Click to add):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aiSuggestions.skills.map((skill, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => applySuggestion('skills', skill)}
                              className="text-xs px-3 py-1.5 bg-white hover:bg-green-100 border border-green-300 hover:border-green-500 rounded-full transition-all duration-200 font-medium"
                            >
                              + {skill}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Popular Skills by Category */}
                  <div className="space-y-3">
                    <Label className="text-xs text-gray-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Popular Skills (Quick Add)
                    </Label>
                    {Object.entries(popularSkills).map(([category, skills]) => (
                      <div key={category} className="space-y-2">
                        <p className="text-xs font-semibold text-gray-700">{category}</p>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => {
                            const alreadyAdded = (Array.isArray(profile.skills) ? profile.skills : []).includes(skill);
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => !alreadyAdded && addPopularSkill(skill)}
                                disabled={alreadyAdded}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-200 ${
                                  alreadyAdded
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-700 hover:shadow-sm'
                                }`}
                              >
                                {alreadyAdded ? '✓ ' : '+ '}{skill}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Experience - AI Enhanced */}
              <Card className="border-0 shadow-lg overflow-visible" style={{ overflow: 'visible' }}>
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 overflow-visible" style={{ overflow: 'visible' }}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="experience" className="text-sm font-semibold">
                        Describe your work experience
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => getAiSuggestions('experience')}
                        disabled={aiLoading.experience}
                        className="h-8 text-xs border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                      >
                        {aiLoading.experience ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1 text-orange-600" />
                        )}
                        AI Enhance
                      </Button>
                    </div>
                    <div className="relative">
                      <Textarea
                        id="experience"
                        value={profile?.experience || ''}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        placeholder="Share your professional journey, key achievements, and roles you've held..."
                        rows={6}
                        className="resize-none text-sm sm:text-base"
                      />
                      {aiLoading.experience && (
                        <div className="absolute top-2 right-2">
                          <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    {/* AI Suggestions for Experience */}
                    <AnimatePresence>
                      {aiSuggestions.experience && aiSuggestions.experience.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 bg-orange-50 border border-orange-200 rounded-lg p-3"
                        >
                          <p className="text-xs font-semibold text-orange-800 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Enhanced Experience Descriptions:
                          </p>
                          {aiSuggestions.experience.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => applySuggestion('experience', suggestion)}
                              className="w-full text-left text-xs sm:text-sm p-3 bg-white hover:bg-orange-100 border border-orange-200 hover:border-orange-400 rounded-lg transition-all duration-200"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>

              {/* Education */}
              <Card className="border-0 shadow-lg overflow-visible" style={{ overflow: 'visible' }}>
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 overflow-visible" style={{ overflow: 'visible' }}>
                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-sm font-semibold">
                      Educational Background
                    </Label>
                    <Textarea
                      id="education"
                      value={profile?.education || ''}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      placeholder="Share your educational qualifications, degrees, certifications..."
                      rows={4}
                      className="resize-none text-sm sm:text-base"
                    />
                  </div>
                </CardContent>
              </Card>

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

              {/* Social Links */}
              <Card className="border-0 shadow-lg overflow-visible" style={{ overflow: 'visible' }}>
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    Professional Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 overflow-visible" style={{ overflow: 'visible' }}>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      Website / Portfolio
                    </Label>
                    <Input
                      id="website"
                      value={profile?.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="h-11 sm:h-12 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-sm font-semibold flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-700" />
                      LinkedIn Profile
                    </Label>
                    <Input
                      id="linkedin"
                      value={profile?.linkedin || ''}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="h-11 sm:h-12 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-sm font-semibold flex items-center gap-2">
                      <Github className="h-4 w-4 text-gray-800" />
                      GitHub Profile
                    </Label>
                    <Input
                      id="github"
                      value={profile?.github || ''}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      placeholder="https://github.com/yourusername"
                      className="h-11 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                </CardContent>
              </Card>

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
                      <a href="/dashboard/jobseeker/bookmarks">
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
