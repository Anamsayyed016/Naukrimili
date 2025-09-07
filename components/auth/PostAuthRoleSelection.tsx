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
        userId: user.id,
        role: role
      }));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
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
        
        // Update the session with new role
        if (typeof window !== 'undefined') {
          // Force session refresh
          window.location.reload();
        }
        
        // Redirect to profile setup forms based on role
        setTimeout(() => {
          if (role === 'jobseeker') {
            router.push('/auth/register/jobseeker?setup=true');
          } else {
            router.push('/auth/register/employer?setup=true');
          }
        }, 1000);
        
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

  // Role selection for new users
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Select how you want to use our platform
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {error && (
              <Alert className="border-red-200 bg-red-50 mb-6">
                <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6">
              <Button
                onClick={() => handleRoleSelection('jobseeker')}
                variant="outline"
                className="h-auto p-8 flex flex-col items-center space-y-4 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                disabled={isLoading}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <UserCheck className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-900 mb-2">Job Seeker</div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    Find jobs, upload resume, build profile
                  </div>
                </div>
                {isLoading && selectedRole === 'jobseeker' && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                )}
              </Button>

              <Button
                onClick={() => handleRoleSelection('employer')}
                variant="outline"
                className="h-auto p-8 flex flex-col items-center space-y-4 border-2 hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                disabled={isLoading}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Briefcase className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-gray-900 mb-2">Employer</div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    Post jobs, find candidates, manage company
                  </div>
                </div>
                {isLoading && selectedRole === 'employer' && (
                  <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
