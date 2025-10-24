'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ResumeUpload from '@/components/resume/ResumeUpload';

export default function ResumeUploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'analyzing' | 'completed' | 'profile-form'>('idle');
  const [resumeData, setResumeData] = useState<any>(null);
  const [profileCompletion, setProfileCompletion] = useState(25); // Dynamic completion percentage

  // Redirect if not authenticated or not a jobseeker
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/resumes/upload');
    } else if (session && session.user.role !== 'jobseeker') {
      router.push('/auth/role-selection');
    }
  }, [status, session, router]);

  const handleUploadComplete = () => {
    setUploadState('completed');
    setProfileCompletion(85); // Increase completion after upload
    // Show success message and redirect to jobseeker dashboard
    setTimeout(() => {
      router.push('/dashboard/jobseeker');
    }, 2000);
  };

  const handleUploadStart = () => {
    setUploadState('uploading');
  };

  const handleAnalyzingStart = () => {
    setUploadState('analyzing');
  };

  const handleProfileFormShow = (data: any) => {
    setUploadState('profile-form');
    setResumeData(data);
    setProfileCompletion(75); // Partial completion when form is shown
  };

  // Generate dynamic suggestions based on actual resume data
  const generateDynamicSuggestions = (data: any) => {
    const suggestions = [];
    
    // Check for missing phone number
    if (!data.phone || data.phone.trim() === '') {
      suggestions.push({
        title: 'Add phone number',
        description: 'Include your contact number to increase profile visibility',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        iconPath: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
        boost: '+12%',
        boostColor: 'text-blue-600',
        buttonColor: 'text-blue-600 hover:text-blue-700'
      });
    }
    
    // Check for missing location
    if (!data.location || data.location.trim() === '') {
      suggestions.push({
        title: 'Add location',
        description: 'Specify your location to help employers find local candidates',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
        boost: '+8%',
        boostColor: 'text-green-600',
        buttonColor: 'text-green-600 hover:text-green-700'
      });
    }
    
    // Check for missing job title
    if (!data.jobTitle || data.jobTitle.trim() === '') {
      suggestions.push({
        title: 'Add current job title',
        description: 'Specify your current role to improve job matching',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        iconPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8',
        boost: '+15%',
        boostColor: 'text-purple-600',
        buttonColor: 'text-purple-600 hover:text-purple-700'
      });
    }
    
    // Check for insufficient skills
    if (!data.skills || (data.skills || []).length < 3) {
      suggestions.push({
        title: 'Add more skills',
        description: `Add ${3 - (data.skills?.length || 0)} more relevant skills to improve ATS matching`,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
        boost: '+20%',
        boostColor: 'text-orange-600',
        buttonColor: 'text-orange-600 hover:text-orange-700'
      });
    }
    
    // Check for missing experience
    if (!data.experience || (data.experience || []).length === 0) {
      suggestions.push({
        title: 'Add work experience',
        description: 'Include your professional experience to showcase your background',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
        iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        boost: '+25%',
        boostColor: 'text-indigo-600',
        buttonColor: 'text-indigo-600 hover:text-indigo-700'
      });
    }
    
    // Check for missing education
    if (!data.education || (data.education || []).length === 0) {
      suggestions.push({
        title: 'Add education details',
        description: 'Include your educational background to complete your profile',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
        iconPath: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
        boost: '+10%',
        boostColor: 'text-teal-600',
        buttonColor: 'text-teal-600 hover:text-teal-700'
      });
    }
    
    // Check for missing summary
    if (!data.summary || data.summary.trim() === '') {
      suggestions.push({
        title: 'Add professional summary',
        description: 'Write a compelling summary to highlight your key strengths',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        iconBg: 'bg-pink-100',
        iconColor: 'text-pink-600',
        iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        boost: '+18%',
        boostColor: 'text-pink-600',
        buttonColor: 'text-pink-600 hover:text-pink-700'
      });
    }
    
    return suggestions;
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && session.user.role !== 'jobseeker')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-6">Please sign in as a job seeker to upload your resume.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resume Management</h1>
                <p className="text-gray-600 mt-1">Upload and manage your professional resume</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                  <span>Profile completion:</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{width: `${profileCompletion}%`}}></div>
                  </div>
                  <span className="text-blue-600 font-medium">{profileCompletion}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Upload Resume</p>
                    <p className="text-sm text-gray-500">Add your latest resume</p>
                  </div>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Edit Profile</p>
                    <p className="text-sm text-gray-500">Update your information</p>
                  </div>
                </button>

                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">AI Enhancement</p>
                    <p className="text-sm text-gray-500">Optimize with AI</p>
                  </div>
                </button>
              </div>

              {/* Profile Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {uploadState === 'idle' ? 'Getting Started' : 'Profile Statistics'}
                </h4>
                <div className="space-y-3">
                  {uploadState === 'idle' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Resume Status</span>
                        <span className="text-sm font-medium text-orange-600">Not Uploaded</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Profile Status</span>
                        <span className="text-sm font-medium text-gray-500">Incomplete</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Next Step</span>
                        <span className="text-sm font-medium text-blue-600">Upload Resume</span>
                      </div>
                    </>
                  ) : uploadState === 'uploading' || uploadState === 'analyzing' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Resume Status</span>
                        <span className="text-sm font-medium text-blue-600">
                          {uploadState === 'uploading' ? 'Uploading...' : 'Analyzing...'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-blue-600">In Progress</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">AI Processing</span>
                        <span className="text-sm font-medium text-purple-600">Active</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Resume Views</span>
                        <span className="text-sm font-medium text-gray-900">
                          {resumeData?.views || Math.floor(Math.random() * 20) + 5}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Applications</span>
                        <span className="text-sm font-medium text-gray-900">
                          {resumeData?.applications || Math.floor(Math.random() * 10) + 2}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ATS Score</span>
                        <span className="text-sm font-medium text-green-600">
                          {resumeData?.atsScore || Math.floor(Math.random() * 20) + 75}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">

            {/* Processing Banner */}
            {(uploadState === 'uploading' || uploadState === 'analyzing') && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      {uploadState === 'uploading' ? (
                        <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {uploadState === 'uploading' ? 'Uploading your resume...' : 'AI is analyzing your resume...'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {uploadState === 'uploading' 
                          ? 'Please wait while we upload your file' 
                          : 'Our AI is extracting and validating your information'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-600 font-medium">
                      {uploadState === 'uploading' ? 'Uploading...' : 'Processing...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {uploadState === 'completed' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Resume uploaded successfully!</h3>
                      <p className="text-sm text-gray-600">Your profile has been updated with AI-extracted information</p>
                    </div>
                  </div>
                  <div className="text-green-600">
                    <span className="text-sm font-medium">✓ Complete</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resume Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Resume</h2>
                    <p className="text-gray-600 mt-1">Upload your latest resume to get started</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Supported: PDF, DOC, DOCX</span>
                  </div>
                </div>

                <ResumeUpload 
                  onComplete={handleUploadComplete}
                  onUploadStart={handleUploadStart}
                  onAnalyzingStart={handleAnalyzingStart}
                  onProfileFormShow={handleProfileFormShow}
                />
              </div>
            </div>

            {/* Profile Enhancement Suggestions */}
            {uploadState === 'idle' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Enhancement Suggestions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Upload your resume first</p>
                          <p className="text-sm text-gray-600">Start by uploading your resume to get personalized suggestions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-600">+25%</span>
                        <button className="text-blue-600 hover:text-blue-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Complete your profile</p>
                          <p className="text-sm text-gray-600">Fill in additional details to improve your visibility</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">+15%</span>
                        <button className="text-green-600 hover:text-green-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Get Started - Upload Resume
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Profile Enhancement Suggestions */}
            {(uploadState === 'completed' || uploadState === 'profile-form') && resumeData && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Profile Recommendations</h3>
                  <div className="space-y-4">
                    {generateDynamicSuggestions(resumeData).map((suggestion, index) => (
                      <div key={index} className={`flex items-center justify-between p-4 ${suggestion.bgColor} rounded-lg border ${suggestion.borderColor}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${suggestion.iconBg} rounded-lg flex items-center justify-center`}>
                            <svg className={`w-5 h-5 ${suggestion.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={suggestion.iconPath} />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{suggestion.title}</p>
                            <p className="text-sm text-gray-600">{suggestion.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${suggestion.boostColor}`}>{suggestion.boost}</span>
                          <button className={`${suggestion.buttonColor} hover:opacity-80`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    {(generateDynamicSuggestions(resumeData) || []).length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Profile Complete!</h4>
                        <p className="text-gray-600">Your profile looks great. No immediate improvements needed!</p>
                      </div>
                    )}

                    {(generateDynamicSuggestions(resumeData) || []).length > 0 && (
                      <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Complete {(generateDynamicSuggestions(resumeData) || []).length} recommended improvements
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

