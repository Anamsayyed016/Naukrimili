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

export default function ResumeUpload({ onComplete }: ResumeUploadProps) {
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

      console.log('🔄 Processing resume with AI...');
      
      toast({
        title: 'AI Processing',
        description: 'Our AI is analyzing your resume to extract comprehensive details...',
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/resumes/enhanced-upload', {
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
        setExtractedProfile(result.profile);
        setResumeId(result.resumeId);
        setAiSuccess(result.aiSuccess);
        setConfidence(result.confidence);
        setShowProfileForm(true);
        
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upload Section */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Upload className="h-6 w-6 text-blue-600" />
            Upload Your Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Area */}
          <div className="text-center">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
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
                <div className="p-4 bg-blue-50 rounded-full">
                  <FileText className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {file ? file.name : 'Click to select your resume'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports PDF, DOC, DOCX, and TXT files
                  </p>
                </div>
              </label>
            </div>

            {file && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{file.name}</p>
                      <p className="text-sm text-green-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="text-center">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || analyzing}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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
                  Upload & Analyze with AI
                </>
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Error</p>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">AI Analysis</h3>
              <p className="text-sm text-gray-600">Extract skills, experience, and education</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">ATS Optimization</h3>
              <p className="text-sm text-gray-600">Get ATS score and improvement tips</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Auto-Fill Form</h3>
              <p className="text-sm text-gray-600">Automatically populate your profile</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}