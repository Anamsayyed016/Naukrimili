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
      // Update user role in database
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          role: role
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect based on role
        if (role === 'jobseeker') {
          router.push('/dashboard/jobseeker?setup=true');
        } else {
          router.push('/dashboard/company?setup=true');
        }
        
        if (onComplete) {
          onComplete({ ...user, role });
        }
      } else {
        setError(data.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Role selection error:', error);
      setError('Network error. Please try again.');
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <UserCheck className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Choose Your Role</CardTitle>
          <CardDescription>
            Select how you want to use our platform
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
              onClick={() => handleRoleSelection('jobseeker')}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-2"
              disabled={isLoading}
            >
              <UserCheck className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold">Job Seeker</div>
                <div className="text-sm text-muted-foreground">
                  Find jobs, upload resume, build profile
                </div>
              </div>
            </Button>

            <Button
              onClick={() => handleRoleSelection('employer')}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-2"
              disabled={isLoading}
            >
              <Briefcase className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-semibold">Employer</div>
                <div className="text-sm text-muted-foreground">
                  Post jobs, find candidates, manage company
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
