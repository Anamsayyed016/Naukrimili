/**
 * Post-Authentication Role Selection
 * Handles role selection and initial setup after successful authentication
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  const { update: updateSession } = useSession();
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
        
        // Update the session to reflect the new role
        await updateSession();
        
        // Small delay to ensure session is updated
        setTimeout(() => {
          // Redirect to appropriate options page based on role
          if (role === 'jobseeker') {
            router.push('/jobseeker/options');
          } else {
            router.push('/employer/options');
          }
        }, 500);
        
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
    router.push('/employer/options');
  };

  // If user already has a role, show role change options
  if (user.role) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Change Your Role
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You are currently registered as a <strong>{user.role}</strong>. You can change your role or continue with your current role.
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
            <Card className={`border-2 ${user.role === 'jobseeker' ? 'border-blue-500 bg-blue-50/80' : 'border-gray-200 hover:border-blue-500 bg-white/95'} transition-all duration-300 hover:shadow-xl backdrop-blur-sm`}>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl ${user.role === 'jobseeker' ? 'bg-blue-200' : 'bg-blue-100'}`}>
                    <UserCheck className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">I'm a Job Seeker</h3>
                  <p className="text-gray-600 mb-6">
                    Find your dream job, upload your resume, and get matched with opportunities.
                  </p>
                  {user.role === 'jobseeker' && (
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                      Current Role
                    </div>
                  )}
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

                {user.role === 'jobseeker' ? (
                  <Button
                    onClick={() => router.push('/jobseeker/options')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                  >
                    Continue as Job Seeker →
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleRoleSelection('jobseeker')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading && selectedRole === 'jobseeker' ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Switch to Job Seeker →
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Employer Card */}
            <Card className={`border-2 ${user.role === 'employer' ? 'border-green-500 bg-green-50/80' : 'border-gray-200 hover:border-green-500 bg-white/95'} transition-all duration-300 hover:shadow-xl backdrop-blur-sm`}>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl ${user.role === 'employer' ? 'bg-green-200' : 'bg-green-100'}`}>
                    <Briefcase className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">I'm an Employer</h3>
                  <p className="text-gray-600 mb-6">
                    Post jobs, find talent, and manage your hiring process efficiently.
                  </p>
                  {user.role === 'employer' && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                      Current Role
                    </div>
                  )}
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

                {user.role === 'employer' ? (
                  <Button
                    onClick={() => router.push('/employer/options')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                  >
                    Continue as Employer →
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleRoleSelection('employer')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading && selectedRole === 'employer' ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    Switch to Employer →
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Role selection for new users - Modern Design
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-[calc(100vh-4rem)]">
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
          <Card className="border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-xl bg-white/95 backdrop-blur-sm">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading && selectedRole === 'jobseeker' ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Get Started as Job Seeker →
              </Button>
            </CardContent>
          </Card>

          {/* Employer Card */}
          <Card className="border-2 border-gray-200 hover:border-green-500 transition-all duration-300 hover:shadow-xl bg-white/95 backdrop-blur-sm">
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
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading && selectedRole === 'employer' ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : null}
                Get Started as Employer →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
