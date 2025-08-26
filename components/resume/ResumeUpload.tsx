'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Upload, FileText, CheckCircle, X, AlertCircle, Brain, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Globe, DollarSign, Clock } from 'lucide-react';

interface ResumeUploadProps {
  onComplete?: () => void;
}

interface ExtractedProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  skills: string[];
  education: string[];
  experience: string[];
  linkedin: string;
  portfolio: string;
  expectedSalary: string;
  preferredJobType: string;
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
    setError(null);
    
    try {
      // Upload and analyze resume
      const formData = new FormData();
      formData.append('resume', file);
      
      console.log('🔄 Uploading and analyzing resume...');
      
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
        setUploaded(true);
        setFile(null);
        setShowProfileForm(true);
        
        console.log('✅ Resume processed successfully:', result.profile);
        
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
    } finally {
      setUploading(false);
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
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would save the profile to your database
    console.log('💾 Saving profile:', extractedProfile);
    
    // For now, just show success
    alert('Profile saved successfully!');
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Profile Generated!</h2>
              <p className="text-gray-600">We've analyzed your resume and extracted the following information. Please review and edit as needed.</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                <span>Confidence Score: {extractedProfile.confidence}%</span>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      defaultValue={extractedProfile.fullName}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={extractedProfile.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      defaultValue={extractedProfile.phone}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      defaultValue={extractedProfile.location}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    Professional Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                    <input
                      type="text"
                      defaultValue={extractedProfile.jobTitle}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expected Salary</label>
                    <input
                      type="text"
                      defaultValue={extractedProfile.expectedSalary}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Type</label>
                    <select
                      defaultValue={extractedProfile.preferredJobType}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                    <input
                      type="url"
                      defaultValue={extractedProfile.linkedin}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Skills ({extractedProfile.skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {extractedProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Education
                </h3>
                <div className="space-y-2">
                  {extractedProfile.education.map((edu, index) => (
                    <input
                      key={index}
                      type="text"
                      defaultValue={edu}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Experience
                </h3>
                <div className="space-y-2">
                  {extractedProfile.experience.map((exp, index) => (
                    <input
                      key={index}
                      type="text"
                      defaultValue={exp}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetUpload}
                  className="px-6 py-3 text-gray-600 border-2 border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 font-medium"
                >
                  Upload Another Resume
                </button>
                
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
          <div className="p-6 pt-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Resume Uploaded Successfully!</h2>
            <p className="text-sm text-gray-600 mb-4">Your resume has been uploaded and is being analyzed by our AI.</p>
            <button
              onClick={resetUpload}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"
            >
              Upload Another Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 pt-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Resume</h2>
            <p className="text-sm text-gray-600">Get AI-powered analysis and job matching</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

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
                {file ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 text-blue-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">
                      Click to select file
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, or DOCX up to 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  disabled={uploading}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              By uploading, you agree to our terms and privacy policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
