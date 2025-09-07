'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCheck, Briefcase, Upload, FileText, Building, Plus } from 'lucide-react';

interface OnboardingFlowProps {
  user: any;
}

type Step = 'role-selection' | 'jobseeker-options' | 'employer-options';

export default function OnboardingFlow({ user }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('role-selection');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelection = async (role: 'jobseeker' | 'employer') => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (data.success) {
        if (role === 'jobseeker') {
          setCurrentStep('jobseeker-options');
        } else {
          setCurrentStep('employer-options');
        }
      } else {
        setError(data.message || 'Failed to update role');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobseekerOption = (option: 'upload' | 'build') => {
    if (option === 'upload') {
      router.push('/resumes/upload');
    } else {
      router.push('/resumes/builder');
    }
  };

  const handleEmployerOption = (option: 'company' | 'job') => {
    if (option === 'company') {
      router.push('/employer/company/create');
    } else {
      router.push('/employer/jobs/create');
    }
  };

  const skipToProfile = () => {
    if (currentStep === 'jobseeker-options') {
      router.push('/dashboard/jobseeker');
    } else {
      router.push('/dashboard/company');
    }
  };

  if (currentStep === 'jobseeker-options') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Job Seeker!</CardTitle>
            <p className="text-gray-600">Let's set up your profile</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleJobseekerOption('upload')}
              className="w-full h-16 flex items-center justify-start space-x-4 bg-white border-2 border-blue-200 hover:border-blue-400 text-gray-700"
              variant="outline"
            >
              <Upload className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Upload Resume</div>
                <div className="text-sm text-gray-500">I have an existing resume</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleJobseekerOption('build')}
              className="w-full h-16 flex items-center justify-start space-x-4 bg-white border-2 border-green-200 hover:border-green-400 text-gray-700"
              variant="outline"
            >
              <FileText className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">Build Resume</div>
                <div className="text-sm text-gray-500">Create a new resume</div>
              </div>
            </Button>

            <Button
              onClick={skipToProfile}
              variant="ghost"
              className="w-full text-gray-500"
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'employer-options') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Employer!</CardTitle>
            <p className="text-gray-600">Let's get you started</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleEmployerOption('company')}
              className="w-full h-16 flex items-center justify-start space-x-4 bg-white border-2 border-blue-200 hover:border-blue-400 text-gray-700"
              variant="outline"
            >
              <Building className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold">Create Company Profile</div>
                <div className="text-sm text-gray-500">Set up your company details</div>
              </div>
            </Button>
            
            <Button
              onClick={() => handleEmployerOption('job')}
              className="w-full h-16 flex items-center justify-start space-x-4 bg-white border-2 border-green-200 hover:border-green-400 text-gray-700"
              variant="outline"
            >
              <Plus className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <div className="font-semibold">Post a Job</div>
                <div className="text-sm text-gray-500">Start hiring immediately</div>
              </div>
            </Button>

            <Button
              onClick={skipToProfile}
              variant="ghost"
              className="w-full text-gray-500"
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
            <UserCheck className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Choose Your Path</CardTitle>
          <p className="text-gray-600 text-lg">How do you want to use NaukriMili?</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={() => handleRoleSelection('jobseeker')}
            disabled={isLoading}
            className="w-full h-20 flex items-center justify-start space-x-6 bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700"
            variant="outline"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">Job Seeker</div>
              <div className="text-sm text-gray-500">Find jobs and build your career</div>
            </div>
            {isLoading && <Loader2 className="h-5 w-5 animate-spin ml-auto" />}
          </Button>

          <Button
            onClick={() => handleRoleSelection('employer')}
            disabled={isLoading}
            className="w-full h-20 flex items-center justify-start space-x-6 bg-white border-2 border-green-200 hover:border-green-400 hover:bg-green-50 text-gray-700"
            variant="outline"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg">Employer</div>
              <div className="text-sm text-gray-500">Post jobs and find talent</div>
            </div>
            {isLoading && <Loader2 className="h-5 w-5 animate-spin ml-auto" />}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}