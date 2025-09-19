'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import ResumeUpload from '@/components/resume/ResumeUpload';

export default function ResumeUploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

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
    // Show success message and redirect to jobseeker dashboard
    setTimeout(() => {
      router.push('/dashboard/jobseeker');
    }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Resume
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Upload your resume and we'll automatically fill your profile with AI-powered analysis
          </p>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-lg">
            <span>🤖</span>
            <span>AI-Powered Resume Analysis</span>
          </div>
        </div>
        
        <ResumeUpload onComplete={handleUploadComplete} />
      </div>
    </div>
  );
}
