'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Upload, FileText, CheckCircle, X, AlertCircle, Brain, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Globe, DollarSign, Clock, Sparkles, Zap } from 'lucide-react';
import ProfileCompletionForm from './ProfileCompletionForm';
import { toast } from '@/hooks/use-toast';

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
    if (!file) return;
    
    setUploading(true);
    setAnalyzing(true);
    setError(null);
    
    try {
      // Upload and analyze resume
      const formData = new FormData();
      formData.append('resume', file);
      
      console.log('🔄 Uploading and analyzing resume with AI...');
      
      // Show AI processing message
      toast({
        title: 'AI Processing',
        description: 'Our AI is analyzing your resume to extract comprehensive details...',
      });
      
      // Call the autofill endpoint to get AI-extracted profile
      const response = await fetch('/api/resumes/autofill', {
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
			setShowProfileForm(true);
			
			// ADDED: Debug logging to verify data structure
			console.log('✅ ResumeUpload - Extracted Profile Data:', {
				fullName: result.profile.fullName,
				email: result.profile.email,
				skillsCount: result.profile.skills?.length || 0,
				experienceCount: result.profile.experience?.length || 0,
				educationCount: result.profile.education?.length || 0,
				summary: result.profile.summary?.substring(0, 100) + '...',
				confidence: result.confidence
			});
			
			console.log('✅ Resume processed successfully:', result.profile);
        
        // Show success message based on AI success
        if (result.aiSuccess) {
          toast({
            title: 'AI Analysis Complete!',
            description: `Successfully extracted ${result.profile.skills.length} skills and ${result.profile.experience.length} experiences with ${result.confidence}% confidence`,
          });
        } else {
          toast({
            title: 'Basic Processing Complete',
            description: 'Resume processed with basic extraction. You can manually edit the details.',
            variant: 'default',
          });
        }
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(result.error || 'Failed to process resume');
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
    setUploaded(false);
    setError(null);
    setExtractedProfile(null);
    setShowProfileForm(false);
    setResumeId(null);
    setAiSuccess(false);
    setConfidence(0);
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

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
          <div className="p-6 pt-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
            <p className="text-sm text-gray-600">Please wait while we check your authentication status.</p>
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
                  <span className="text-sm font-medium text-blue-800">AI Analysis Successful</span>
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

        <ProfileCompletionForm
          initialData={extractedProfile}
          onComplete={handleProfileComplete}
          onClose={resetUpload}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 pt-6">
          {/* AI Processing Indicator */}
          {analyzing && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-sm font-medium text-blue-800">AI Processing Resume</p>
                  <p className="text-xs text-blue-600">Extracting comprehensive details...</p>
                </div>
              </div>
            </div>
          )}

          {!uploaded && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Upload Your Resume</h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Upload your resume and our AI will automatically extract all your details
              </p>

              {/* AI Features Highlight */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">AI-Powered Extraction</span>
                </div>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• Extracts skills, experience, education, and more</li>
                  <li>• Identifies contact information and social profiles</li>
                  <li>• Analyzes resume completeness and ATS compatibility</li>
                  <li>• Provides confidence scores for extracted data</li>
                </ul>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer block"
                  >
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : 'Click to select or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, or DOCX (max 10MB)
                    </p>
                  </label>
                </div>

                {file && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">{file.name}</span>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-800">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
