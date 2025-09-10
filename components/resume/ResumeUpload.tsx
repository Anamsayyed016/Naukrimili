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
      
      const response = await fetch('/api/resumes/simple-upload', {
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

        // Enhanced debug logging
        console.log('✅ ResumeUpload - Enhanced Profile Data:', {
          profile: result.profile,
          aiSuccess: result.aiSuccess,
          confidence: result.confidence,
          resumeId: result.resumeId,
          atsScore: result.atsScore,
          recommendedJobTitles: result.recommendedJobTitles
        });

        toast({
          title: '🎉 Resume Analyzed Successfully!',
          description: `AI extracted ${result.profile.skills?.length || 0} skills with ${result.confidence}% confidence. ATS Score: ${result.atsScore}%`,
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
      <div className="max-w-4xl mx-auto p-6">
        {/* Existing Resume Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Resume Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Resume Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Current Resume</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File:</span> {resumeStatus.latestResume?.fileName || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Last Updated:</span> {resumeStatus.latestResume?.updatedAt ? new Date(resumeStatus.latestResume.updatedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> Uploaded
                  </p>
                </div>
              </div>
              
              {/* Health Metrics */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Health Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ATS Score</span>
                    <Badge variant={resumeStatus.resumeHealth?.atsScore >= 80 ? 'default' : resumeStatus.resumeHealth?.atsScore >= 60 ? 'secondary' : 'destructive'}>
                      {resumeStatus.resumeHealth?.atsScore || 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completeness</span>
                    <Badge variant={resumeStatus.resumeHealth?.completeness >= 80 ? 'default' : resumeStatus.resumeHealth?.completeness >= 60 ? 'secondary' : 'destructive'}>
                      {resumeStatus.resumeHealth?.completeness || 0}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant={resumeStatus.resumeHealth?.needsUpdate ? 'destructive' : 'default'}>
                      {resumeStatus.resumeHealth?.needsUpdate ? 'Needs Update' : 'Up to Date'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            {resumeStatus.resumeHealth?.recommendations?.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">AI Recommendations</h4>
                <ul className="space-y-1">
                  {resumeStatus.resumeHealth.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-blue-800 flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
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
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New Version
          </Button>
          
          {resumeStatus.latestResume?.id && (
            <Link href={`/resumes/${resumeStatus.latestResume.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View Current Resume
              </Button>
            </Link>
          )}
          
          <Link href="/resumes/builder" className="w-full">
            <Button variant="outline" className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Build New Resume
            </Button>
          </Link>
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={checkResumeStatus}
            className="text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
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
      <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          {resumeStatus?.hasResumes && (
            <Button
              variant="ghost"
              onClick={() => setShowUploadInterface(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Status
            </Button>
          )}
          <div className="flex-1"></div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Resume Upload & AI Analysis</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload your resume and let our AI analyze it to extract key information, 
          calculate ATS scores, and provide personalized recommendations.
        </p>
      </div>

      {/* Input Mode Selection */}
      <div className="mb-6">
        <div className="flex justify-center gap-4">
          <Button
            variant={inputMode === 'file' ? 'default' : 'outline'}
            onClick={() => setInputMode('file')}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
          <Button
            variant={inputMode === 'text' ? 'default' : 'outline'}
            onClick={() => setInputMode('text')}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Paste Text
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {inputMode === 'file' ? <Upload className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            {inputMode === 'file' ? 'Upload Your Resume' : 'Paste Your Resume Text'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inputMode === 'file' ? (
            // File Upload Mode
            !file ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Drop your resume here</h3>
                <p className="text-gray-600 mb-4">or click to browse files</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Supported formats: PDF, DOC, DOCX • Max size: 10MB
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{file.name}</p>
                      <p className="text-sm text-green-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          ) : (
            // Text Input Mode
            <div className="space-y-4">
              <div>
                <label htmlFor="resume-text" className="block text-sm font-medium text-gray-700 mb-2">
                  Paste your resume text here
                </label>
                <textarea
                  id="resume-text"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content here... (name, contact info, experience, education, skills, etc.)"
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Character count: {resumeText.length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Button */}
      {(file || (inputMode === 'text' && resumeText.trim())) && (
        <div className="text-center mb-6">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-lg"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                {inputMode === 'file' ? 'Upload & Analyze with AI' : 'Parse & Analyze with AI'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-sm text-gray-600">
              Extract key information, skills, and experience automatically
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">ATS Optimization</h3>
            <p className="text-sm text-gray-600">
              Get ATS compatibility scores and improvement recommendations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Smart Matching</h3>
            <p className="text-sm text-gray-600">
              Connect with relevant job opportunities based on your profile
            </p>
          </CardContent>
        </Card>
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
