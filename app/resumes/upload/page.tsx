'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import ResumeUpload from '@/components/resume/ResumeUpload';
import { Upload, FileText, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
    // Show success toast
    toast({
      title: '✅ Resume Uploaded Successfully!',
      description: 'Redirecting to your resumes...',
      variant: 'default',
    });
    
    // Redirect to resume management page with success parameter
    setTimeout(() => {
      router.push('/resumes?uploaded=true');
    }, 1500);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && session.user.role !== 'jobseeker')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
          <p className="text-gray-600 mb-6">Please sign in as a job seeker to upload your resume.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Upload Your Resume
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                AI-powered resume analysis for better job matches
              </p>
            </div>
            <button
              onClick={() => router.push('/resumes')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <FileText className="w-4 h-4" />
              My Resumes
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-12">
            <ResumeUpload 
              onComplete={handleUploadComplete}
            />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Why Upload Your Resume?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Benefit 1 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600 text-sm">
                Our AI extracts and validates your information instantly, saving you time.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">ATS Optimization</h3>
              <p className="text-gray-600 text-sm">
                Get your ATS score and recommendations to improve your chances.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quick Apply</h3>
              <p className="text-gray-600 text-sm">
                Apply to jobs faster with your resume auto-filled in applications.
              </p>
            </div>
          </div>
        </div>

        {/* Supported Formats */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Supported formats: <span className="font-medium text-gray-700">PDF, DOC, DOCX</span> • 
            Max size: <span className="font-medium text-gray-700">2MB</span>
          </p>
        </div>
      </div>
    </div>
  );
}
