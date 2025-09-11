'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, X, AlertCircle, Brain, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Globe, DollarSign, Clock, Sparkles, Zap, RefreshCw, TrendingUp, Target, Eye } from 'lucide-react';
import ProfileCompletionForm from './ProfileCompletionForm';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ResumeUploadProps {
  onComplete?: () => void;
}

interface ExtractedProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
  summary: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    startDate?: string;
    endDate?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    url?: string;
  }>;
  languages?: string[];
  expectedSalary?: string;
  preferredJobType?: string;
  confidence: number;
  rawText: string;
  // Enhanced ResumeAI fields
  atsSuggestions?: string[];
  jobSuggestions?: Array<{
    title: string;
    reason: string;
  }>;
}

interface ResumeStatus {
  hasResumes: boolean;
  resumeCount: number;
  latestResume: any;
  resumeHealth: any;
  recommendations: any;
}

export default function ResumeUpload({ onComplete }: ResumeUploadProps) {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [resumeText, setResumeText] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [showUploadInterface, setShowUploadInterface] = useState(false);

  // Check for existing resumes on component mount
  useEffect(() => {
    if (session?.user) {
      checkResumeStatus();
    }
  }, [session]);

  const checkResumeStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch('/api/resumes/check');
      
      if (response.ok) {
        const result = await response.json();
        setResumeStatus(result.data);
      }
    } catch (error) {
      console.error('Error checking resume status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a valid file type (PDF, DOC, or DOCX)');
        return;
      }
      
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file && !resumeText.trim()) return;
    
    setUploading(true);
    setAnalyzing(true);
    setError(null);
    
    try {
      console.log('🔄 Processing resume with enhanced AI...');
      
      // Show AI processing message
      toast({
        title: 'AI Processing',
        description: 'Our AI is analyzing your resume to extract comprehensive details...',
      });
      
      // Prepare form data based on input mode
      const formData = new FormData();
      
      if (inputMode === 'file' && file) {
        formData.append('file', file);
      } else if (inputMode === 'text' && resumeText.trim()) {
        formData.append('resumeText', resumeText.trim());
      }
      
      const response = await fetch('/api/resumes/enhanced-upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to process resume');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setExtractedProfile(result.profile);
        setAiSuccess(result.aiSuccess || false);
        setConfidence(result.confidence || 0);
        setUploaded(true);
        setFile(null);
        setResumeText('');
        setShowProfileForm(true);


        toast({
          title: '🎉 Resume Analyzed Successfully!',
          description: `AI extracted ${result.profile.skills?.length || 0} skills with ${result.confidence}% confidence. ATS Score: ${result.atsScore}%. Please review and save your profile.`,
          duration: 5000,
        });

        // Refresh resume status after successful upload
        await checkResumeStatus();
        
        // Reset upload interface state
        setShowUploadInterface(false);
      } else {
        throw new Error(result.error || 'Failed to analyze resume');
      }
    } catch (err: any) {
      console.error('Enhanced upload error:', err);
      setError(err?.message || 'Upload failed. Please try again.');
      toast({
        title: 'Processing Failed',
        description: err?.message || 'Failed to process resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const resetUpload = () => {
    setUploaded(false);
    setError(null);
    setExtractedProfile(null);
    setShowProfileForm(false);
    setResumeId(null);
    setAiSuccess(false);
    setConfidence(0);
    setShowUploadInterface(false);
  };

  const handleProfileComplete = async () => {
    try {
      // Save profile to database
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          data: {
            userId: session?.user?.id || 1, // Use actual user ID from session
            fileName: file?.name || 'resume',
            fileUrl: '', // Will be set by the API
            fileSize: file?.size || 0,
            mimeType: file?.type || 'application/pdf',
            parsedData: extractedProfile,
            atsScore: extractedProfile?.confidence || 0,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile to database');
      }

      const result = await response.json();
      if (result.success) {
        setResumeId(result.resume.id);
        toast({
          title: 'Profile Saved!',
          description: 'Your profile has been saved to the database successfully',
        });
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(result.error?.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save profile to database. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || checkingStatus) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
          <div className="p-6 pt-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
            <p className="text-sm text-gray-600">Please wait while we check your resume status.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
          <div className="p-6 pt-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-sm text-gray-600 mb-4">Please sign in to upload your resume.</p>
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show existing resume status if available and not uploading new version
  if (resumeStatus?.hasResumes && !showProfileForm && !uploaded && !showUploadInterface) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Resume Status */}
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resume Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Enhanced Resume Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Current Resume</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">File</p>
                        <p className="text-sm text-gray-600">{resumeStatus.latestResume?.fileName || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Last Updated</p>
                        <p className="text-sm text-gray-600">{resumeStatus.latestResume?.updatedAt ? new Date(resumeStatus.latestResume.updatedAt).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Upload className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Type</p>
                        <p className="text-sm text-gray-600">Uploaded</p>
                      </div>
                    </div>
                  </div>
                </div>
              
                {/* Enhanced Health Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Health Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">ATS Score</span>
                      </div>
                      <Badge variant={resumeStatus.resumeHealth?.atsScore >= 80 ? 'default' : resumeStatus.resumeHealth?.atsScore >= 60 ? 'secondary' : 'destructive'} className="border-0">
                        {resumeStatus.resumeHealth?.atsScore || 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Completeness</span>
                      </div>
                      <Badge variant={resumeStatus.resumeHealth?.completeness >= 80 ? 'default' : resumeStatus.resumeHealth?.completeness >= 60 ? 'secondary' : 'destructive'} className="border-0">
                        {resumeStatus.resumeHealth?.completeness || 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Status</span>
                      </div>
                      <Badge variant={resumeStatus.resumeHealth?.needsUpdate ? 'destructive' : 'default'} className="border-0">
                        {resumeStatus.resumeHealth?.needsUpdate ? 'Needs Update' : 'Up to Date'}
                      </Badge>
                    </div>
                  </div>
                </div>
            </div>
            
              {/* Enhanced Recommendations */}
              {resumeStatus.resumeHealth?.recommendations?.length > 0 && (
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-4 text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    AI Recommendations
                  </h4>
                  <ul className="space-y-3">
                    {resumeStatus.resumeHealth.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start gap-3 p-3 bg-white/50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => {
                setShowUploadInterface(true);
                setUploaded(false);
                setShowProfileForm(false);
                setFile(null);
                setResumeText('');
                setError(null);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Version
            </Button>
            
            {resumeStatus.latestResume?.id && (
              <Link href={`/resumes/${resumeStatus.latestResume.id}`} className="w-full">
                <Button variant="outline" className="w-full hover:bg-blue-50 hover:border-blue-200 transition-all duration-300">
                  <Eye className="w-4 h-4 mr-2" />
                  View Current Resume
                </Button>
              </Link>
            )}
            
            <Link href="/resumes/builder" className="w-full">
              <Button variant="outline" className="w-full hover:bg-green-50 hover:border-green-200 transition-all duration-300">
                <FileText className="w-4 h-4 mr-2" />
                Build New Resume
              </Button>
            </Link>
          </div>

          {/* Enhanced Refresh Button */}
          <div className="text-center mt-8">
            <Button
              variant="ghost"
              onClick={checkResumeStatus}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-6 py-3 rounded-lg transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showProfileForm && extractedProfile) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* AI Processing Results Header */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {aiSuccess ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">ResumeAI Analysis Complete</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Basic Processing</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Confidence:</span>
              <span className={`text-sm font-medium ${confidence >= 80 ? 'text-green-600' : confidence >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {confidence}%
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {aiSuccess 
              ? `Extracted ${extractedProfile.skills.length} skills, ${extractedProfile.experience.length} experiences, and ${extractedProfile.education.length} education entries.`
              : 'Basic information extracted. You can manually edit and enhance the details below.'
            }
          </p>
        </div>

        {/* Enhanced ResumeAI Features */}
        {(extractedProfile.atsSuggestions?.length > 0 || extractedProfile.jobSuggestions?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* ATS Suggestions */}
            {extractedProfile.atsSuggestions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-green-600" />
                    ATS Optimization Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {extractedProfile.atsSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Job Suggestions */}
            {extractedProfile.jobSuggestions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Recommended Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {extractedProfile.jobSuggestions.map((job, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-900">{job.title}</h4>
                        <p className="text-sm text-blue-700 mt-1">{job.reason}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Profile Completion Form */}
        <ProfileCompletionForm
          initialData={extractedProfile}
          onComplete={handleProfileComplete}
          onClose={() => setShowProfileForm(false)}
        />
      </div>
    );
  }

  // Main Upload Interface (show if no resumes exist OR user wants to upload new version)
  if (!resumeStatus?.hasResumes || showUploadInterface) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              {resumeStatus?.hasResumes && (
                <Button
                  variant="ghost"
                  onClick={() => setShowUploadInterface(false)}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-300"
                >
                  ← Back to Status
                </Button>
              )}
              <div className="flex-1"></div>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
              Resume Upload & AI Analysis
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Upload your resume and let our AI analyze it to extract key information, 
              calculate ATS scores, and provide personalized recommendations.
            </p>
          </div>

          {/* Enhanced Input Mode Selection */}
          <div className="mb-8">
            <div className="flex justify-center gap-4">
              <Button
                variant={inputMode === 'file' ? 'default' : 'outline'}
                onClick={() => setInputMode('file')}
                className={`flex items-center gap-2 px-6 py-3 transition-all duration-300 ${
                  inputMode === 'file' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg' 
                    : 'hover:bg-blue-50 hover:border-blue-200'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </Button>
              <Button
                variant={inputMode === 'text' ? 'default' : 'outline'}
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-2 px-6 py-3 transition-all duration-300 ${
                  inputMode === 'text' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg' 
                    : 'hover:bg-blue-50 hover:border-blue-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                Paste Text
              </Button>
            </div>
          </div>

          {/* Enhanced Upload Area */}
          <Card className="mb-8 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                {inputMode === 'file' ? <Upload className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
                {inputMode === 'file' ? 'Upload Your Resume' : 'Paste Your Resume Text'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inputMode === 'file' ? (
                // Enhanced File Upload Mode
                !file ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-300 group">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop your resume here</h3>
                    <p className="text-gray-600 mb-6">or click to browse files</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Choose File
                    </label>
                    <p className="text-sm text-gray-500 mt-4">
                      Supported formats: PDF, DOC, DOCX • Max size: 10MB
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 text-lg">{file.name}</p>
                          <p className="text-sm text-green-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-300"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                // Enhanced Text Input Mode
                <div className="space-y-4">
                  <div>
                    <label htmlFor="resume-text" className="block text-sm font-semibold text-gray-700 mb-3">
                      Paste your resume text here
                    </label>
                    <textarea
                      id="resume-text"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume content here... (name, contact info, experience, education, skills, etc.)"
                      className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white text-gray-900 placeholder:text-gray-500"
                    />
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                      <span>Character count: {resumeText.length}</span>
                      {resumeText.length > 0 && (
                        <span className="text-green-600">✓ Ready to analyze</span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Upload Button */}
          {(file || (inputMode === 'text' && resumeText.trim())) && (
            <div className="text-center mb-8">
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-3" />
                    {inputMode === 'file' ? 'Upload & Analyze with AI' : 'Parse & Analyze with AI'}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Enhanced Error Display */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">AI-Powered Analysis</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Extract key information, skills, and experience automatically with advanced AI
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">ATS Optimization</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Get ATS compatibility scores and improvement recommendations
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">Smart Matching</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Connect with relevant job opportunities based on your profile
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
        <div className="p-6 pt-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 mb-4">Please refresh the page and try again.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
