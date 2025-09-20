'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, X, AlertCircle, Brain, RefreshCw } from 'lucide-react';
import ProfileCompletionForm from './ProfileCompletionForm';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ResumeUploadProps {
  onComplete?: () => void;
  onUploadStart?: () => void;
  onAnalyzingStart?: () => void;
  onProfileFormShow?: (data: any) => void;
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
  atsSuggestions?: string[];
  jobSuggestions?: Array<{
    title: string;
    reason: string;
  }>;
}

export default function ResumeUpload({ onComplete, onUploadStart, onAnalyzingStart, onProfileFormShow }: ResumeUploadProps) {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setAnalyzing(true);
      setError(null);
      
      // Notify parent components about state changes
      onUploadStart?.();

      console.log('🔄 Processing resume with AI...');
      
      // Notify that AI analysis is starting
      onAnalyzingStart?.();
      
      toast({
        title: 'Ultimate AI Processing',
        description: 'Using PyResparser + OpenAI + Gemini to extract and validate your resume data...',
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/resumes/ultimate-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process resume');
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('🎉 Resume analysis successful!');
        console.log('📊 Extracted profile data:', JSON.stringify(result.profile, null, 2));
        console.log('🔍 Profile keys:', Object.keys(result.profile));
        console.log('📧 Email:', result.profile.email);
        console.log('👤 Full Name:', result.profile.fullName);
        console.log('📱 Phone:', result.profile.phone);
        console.log('🏢 Location:', result.profile.location);
        console.log('💼 Job Title:', result.profile.jobTitle);
        console.log('🛠️ Skills:', result.profile.skills);
        
        setExtractedProfile(result.profile);
        setResumeId(result.resumeId);
        setAiSuccess(result.aiSuccess);
        setConfidence(result.confidence);
        setShowProfileForm(true);
        
        // Notify parent that profile form should be shown
        onProfileFormShow?.(result.profile);
        
        toast({
          title: '🎉 Resume Analyzed Successfully!',
          description: `AI extracted ${result.profile.skills?.length || 0} skills with ${result.confidence}% confidence. ATS Score: ${result.atsScore}%. Please review and save your profile.`,
          duration: 5000,
        });
      } else {
        throw new Error(result.error || 'Failed to analyze resume');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
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
    setFile(null);
    setError(null);
    setExtractedProfile(null);
    setShowProfileForm(false);
    setResumeId(null);
    setAiSuccess(false);
    setConfidence(0);
  };

  const handleProfileComplete = async () => {
    try {
      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create',
          data: {
            userId: session?.user?.id || 1,
            fileName: file?.name || 'resume',
            fileUrl: '',
            fileSize: file?.size || 0,
            mimeType: file?.type || 'application/pdf',
            parsedData: extractedProfile,
            atsScore: extractedProfile?.confidence || 0,
            isActive: true,
            isBuilder: false
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: '🎉 Successfully Uploaded Resume!',
          description: 'Your resume has been processed and profile saved successfully. Redirecting to dashboard...',
          duration: 3000,
        });

        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600 mb-4">Please sign in to upload your resume.</p>
        <Button asChild>
          <a href="/auth/signin">Sign In</a>
        </Button>
      </div>
    );
  }

  if (showProfileForm && extractedProfile) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <CheckCircle className="h-4 w-4" />
            Resume Successfully Analyzed
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Profile</h2>
          <p className="text-gray-600">
            AI extracted your information with {confidence}% confidence. Please review and save your profile.
          </p>
        </div>

        <ProfileCompletionForm
          initialData={extractedProfile}
          onComplete={onComplete}
        />

        <div className="text-center">
          <Button
            variant="outline"
            onClick={resetUpload}
            className="mr-4"
          >
            Upload Another Resume
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors bg-gray-50">
        <input
          type="file"
          id="resume-upload"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor="resume-upload"
          className="cursor-pointer flex flex-col items-center space-y-4"
        >
          <div className="p-6 bg-white rounded-full shadow-sm border border-gray-200">
            <FileText className="h-12 w-12 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 mb-1">
              {file ? file.name : 'Drop your resume here or click to browse'}
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, DOC, DOCX files up to 2MB
            </p>
          </div>
        </label>
      </div>

      {/* File Preview */}
      {file && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading || analyzing}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium shadow-sm hover:shadow-md transition-all duration-200 min-w-[200px]"
        >
          {analyzing ? (
            <>
              <Brain className="h-5 w-5 mr-2 animate-pulse" />
              AI Analyzing...
            </>
          ) : uploading ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload & Analyze
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Upload Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Features Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Brain className="h-4 w-4 text-blue-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">AI Analysis</h3>
          <p className="text-xs text-gray-600 mt-1">Smart data extraction</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">ATS Score</h3>
          <p className="text-xs text-gray-600 mt-1">Optimization tips</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="font-medium text-gray-900 text-sm">Auto-Fill</h3>
          <p className="text-xs text-gray-600 mt-1">Instant form completion</p>
        </div>
      </div>
    </div>
  );
}