/**
 * Job Seeker Options Page
 * Shows options for resume upload vs resume builder
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JobSeekerOptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // Check if user has jobseeker role
      if (session.user.role !== 'jobseeker') {
        // Only redirect to role selection if user has no role
        // Don't redirect employers here to avoid redirect loops
        if (!session.user.role) {
          router.push('/auth/role-selection');
        }
        return;
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'jobseeker') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Seeker Access Required</h2>
          <p className="text-gray-600 mb-6">
            {session?.user?.role === 'employer' 
              ? "You're currently registered as an employer. To access job seeker features, please change your role."
              : "Please select your role as a job seeker to access this page."
            }
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/auth/role-selection')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Role Selection
            </Button>
            {session?.user?.role === 'employer' && (
              <Button 
                variant="outline" 
                onClick={() => router.push('/employer/options')}
                className="w-full"
              >
                Continue as Employer
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">NaukriMili</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {session.user.name || session.user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Let's Get Your Resume Ready
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose how you'd like to create or upload your resume to get started with job applications.
          </p>
        </div>

        {/* Resume Options */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Upload Resume Card */}
          <Card className="border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Resume</h3>
                <p className="text-gray-600 mb-6">
                  Upload your existing resume and let our AI analyze it for better job matching.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">AI-powered analysis</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Skills extraction</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">ATS optimization</span>
                </div>
              </div>

              <Link href="/resumes/upload">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors">
                  Upload Resume <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Build Resume Card */}
          <Card className="border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-purple-100">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Build Resume</h3>
                <p className="text-gray-600 mb-6">
                  Create a professional resume from scratch using our modern resume builder.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Professional templates</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Real-time preview</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">PDF export</span>
                </div>
              </div>

              <Link href="/resumes/builder">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors">
                  Build Resume <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Button
            variant="ghost"
            onClick={() => router.push('/auth/role-selection')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Role Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
