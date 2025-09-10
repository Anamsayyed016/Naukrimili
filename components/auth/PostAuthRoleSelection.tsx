/**
 * Post-Authentication Role Selection
 * Handles role selection and initial setup after successful authentication
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCheck, Briefcase, Upload, FileText, ArrowRight } from 'lucide-react';

interface PostAuthRoleSelectionProps {
  user: any;
  onComplete?: (user: any) => void;
}

export default function PostAuthRoleSelection({ user, onComplete }: PostAuthRoleSelectionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);

  const handleRoleSelection = async (role: 'jobseeker' | 'employer') => {
    setSelectedRole(role);
    setIsLoading(true);
    setError('');

    try {
      console.log('PostAuthRoleSelection - User data:', user);
      console.log('PostAuthRoleSelection - User ID:', user.id);
      console.log('PostAuthRoleSelection - Role to set:', role);
      
      // Check if user ID exists
      if (!user.id) {
        console.error('PostAuthRoleSelection - No user ID available');
        setError('User session is invalid. Please sign in again.');
        setIsLoading(false);
        return;
      }
      
      // Update user role in database
      const apiUrl = '/api/auth/update-role';
      console.log('PostAuthRoleSelection - Making API request to:', apiUrl);
      console.log('PostAuthRoleSelection - Request body:', JSON.stringify({
        role: role
      }));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: role
        }),
      });
      
      console.log('PostAuthRoleSelection - Response status:', response.status);
      console.log('PostAuthRoleSelection - Response headers:', response.headers);

      if (!response.ok) {
        console.error('PostAuthRoleSelection - HTTP error:', response.status, response.statusText);
        
        if (response.status === 404) {
          // Check if this is actually a user not found error from our API
          try {
            const errorData = await response.clone().json();
            if (errorData.error === "User not found") {
              setError('User session is invalid. Please sign in again.');
            } else {
              setError('API endpoint not found. Please contact support or try refreshing the page.');
            }
          } catch {
            setError('API endpoint not found. Please contact support or try refreshing the page.');
          }
        } else if (response.status === 500) {
          setError('Server error. Please try again in a few moments.');
        } else {
          setError(`Server error: ${response.status}. Please try again.`);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('PostAuthRoleSelection - Response data:', data);

      if (data.success) {
        console.log('Role updated successfully:', data.user);
        
        // Redirect to appropriate options page based on role
        if (role === 'jobseeker') {
          router.push('/jobseeker/options');
        } else {
          router.push('/employer/options');
        }
        
        if (onComplete) {
          onComplete({ ...user, role });
        }
      } else {
        console.error('Role update failed:', data);
        // Handle specific error cases
        if (data.error === 'User not found') {
          setError('User session expired. Please sign in again.');
        } else if (data.error === 'Validation failed') {
          setError('Invalid data provided. Please try again.');
        } else {
          setError(data.error || data.message || 'Failed to update role. Please try again.');
        }
      }
    } catch (error) {
      console.error('Role selection error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobSeekerOptions = (option: 'upload' | 'build') => {
    if (option === 'upload') {
      router.push('/resumes/upload');
    } else {
      router.push('/resumes/builder');
    }
  };

  const handleEmployerSetup = () => {
    router.push('/employer/post-job');
  };

  // If user already has a role, show appropriate options
  if (user.role === 'jobseeker') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome, Job Seeker!</CardTitle>
            <CardDescription>
              Let's get your profile ready. Choose how you'd like to add your resume.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <Button
                onClick={() => handleJobSeekerOptions('upload')}
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-2"
                disabled={isLoading}
              >
                <Upload className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Upload Resume</div>
                  <div className="text-sm text-muted-foreground">
                    Upload your existing resume file
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => handleJobSeekerOptions('build')}
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-2"
                disabled={isLoading}
              >
                <FileText className="h-8 w-8 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold">Build Resume</div>
                  <div className="text-sm text-muted-foreground">
                    Create a new resume from scratch
                  </div>
                </div>
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/jobseeker')}
                className="text-sm"
              >
                Skip for now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role === 'employer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome, Employer!</CardTitle>
            <CardDescription>
              Let's get your company profile set up. Start by posting your first job.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleEmployerSetup}
              className="w-full h-auto p-6 flex flex-col items-center space-y-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Briefcase className="h-8 w-8" />
              )}
              <div className="text-center">
                <div className="font-semibold">Post Your First Job</div>
                <div className="text-sm opacity-90">
                  Create a job posting to attract candidates
                </div>
              </div>
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/company')}
                className="text-sm"
              >
                Skip for now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role selection for new users - Modern Design
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
              <span className="text-gray-600">Welcome, {user.name || user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Role
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select how you want to use our platform to get started with the right features and tools.
          </p>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Role Selection Cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Job Seeker Card */}
          <Card className="border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100">
                  <UserCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">I'm a Job Seeker</h3>
                <p className="text-gray-600 mb-6">
                  Find your dream job, upload your resume, and get matched with opportunities.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">AI-powered job matching</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Resume upload & analysis</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Track applications</span>
                </div>
              </div>

              <Button
                onClick={() => handleRoleSelection('jobseeker')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                disabled={isLoading}
              >
                {isLoading && selectedRole === 'jobseeker' ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Get Started →
              </Button>
            </CardContent>
          </Card>

          {/* Employer Card */}
          <Card className="border-2 border-gray-200 hover:border-green-500 transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-green-100">
                  <Briefcase className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">I'm an Employer</h3>
                <p className="text-gray-600 mb-6">
                  Post jobs, find talent, and manage your hiring process efficiently.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Post unlimited jobs</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">AI-powered candidate matching</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">Application management</span>
                </div>
              </div>

              <Button
                onClick={() => handleRoleSelection('employer')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                disabled={isLoading}
              >
                {isLoading && selectedRole === 'employer' ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Get Started →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
