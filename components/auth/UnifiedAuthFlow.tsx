/**
 * Unified Authentication Flow
 * Clean registration and login flow without OTP
 */

'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession, getSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, User, ArrowLeft, CheckCircle, Briefcase, UserCheck } from 'lucide-react';

interface UnifiedAuthFlowProps {
  onAuthSuccess?: (user: any) => void;
}

type AuthStep = 'welcome' | 'role-selection' | 'complete-profile';

export default function UnifiedAuthFlow({ onAuthSuccess }: UnifiedAuthFlowProps) {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<AuthStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User data state
  const [userData, setUserData] = useState({
    email: '',
    name: '',
    password: '',
    role: '',
    authMethod: 'email' // 'email' or 'google'
  });

  // Check if user is already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('User already authenticated:', session.user);
      if (session.user.role) {
        // User has a role, redirect to dashboard
        if (session.user.role === 'jobseeker') {
          window.location.href = '/dashboard/jobseeker';
        } else if (session.user.role === 'employer') {
          window.location.href = '/dashboard/company';
        }
      } else {
        // User authenticated but no role, show role selection step
        console.log('User authenticated but no role, showing role selection');
        setCurrentStep('role-selection');
        setUserData(prev => ({
          ...prev,
          email: session.user.email || '',
          name: session.user.name || '',
          authMethod: 'google'
        }));
      }
    }
  }, [session, status]);

  const handleGoogleAuth = async () => {
    if (isLoading) {
      console.log('OAuth already in progress, ignoring click');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Starting Google OAuth...');
      
      // Use redirect: true for proper OAuth flow
      await signIn('google', {
        callbackUrl: '/auth/role-selection',
        redirect: true
      });
      
    } catch (error) {
      console.error('Google auth error:', error);
      setError('Network error during authentication. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  const handleEmailRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Move to role selection after basic info collection
      setCurrentStep('role-selection');
      setSuccess('Please select your role to continue');
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = (role: 'jobseeker' | 'employer') => {
    setUserData(prev => ({ ...prev, role }));
    setCurrentStep('complete-profile');
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = userData.role === 'jobseeker' 
        ? '/api/auth/register/jobseeker' 
        : '/api/auth/register/employer';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.name.split(' ')[0] || '',
          lastName: userData.name.split(' ').slice(1).join(' ') || '',
          email: userData.email,
          password: userData.password,
          role: userData.role
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Registration completed successfully! Redirecting to dashboard...');
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess(data.user);
          }
          // Redirect to appropriate dashboard
          if (userData.role === 'jobseeker') {
            window.location.href = '/dashboard/jobseeker';
          } else {
            window.location.href = '/dashboard/company';
          }
        }, 1500);
      } else {
        console.error('Registration failed:', data);
        setError(data.error || data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToWelcome = () => {
    setCurrentStep('welcome');
    setError('');
    setSuccess('');
  };

  const handleBackToRoleSelection = () => {
    setCurrentStep('role-selection');
    setError('');
    setSuccess('');
  };

  // Role Selection Step
  if (currentStep === 'role-selection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
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

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <Button
                onClick={() => handleRoleSelection('jobseeker')}
                variant="outline"
                className="h-auto p-6 flex flex-col items-center space-y-2"
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

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleBackToWelcome}
                className="text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Welcome
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Complete Profile Step
  if (currentStep === 'complete-profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              {userData.role === 'jobseeker' ? (
                <UserCheck className="h-6 w-6 text-blue-600" />
              ) : (
                <Briefcase className="h-6 w-6 text-green-600" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              Complete Your {userData.role === 'jobseeker' ? 'Job Seeker' : 'Employer'} Profile
            </CardTitle>
            <CardDescription>
              Set your password to complete registration
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={userData.name}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={userData.password}
                  onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !userData.password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={handleBackToRoleSelection}
                className="text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Role Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Welcome Step (Initial) - Clean, modern UI
  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        {/* Left Panel - Authentication Form */}
        <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Brand */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">NaukriMili</h2>
            </div>

            {/* Main Heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-600">Join thousands of professionals finding their dream jobs</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Sign up with section */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Sign up with</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="h-12 border-gray-300 hover:border-gray-400 text-gray-700 bg-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-gray-600 mr-2" />
                      <span className="text-sm font-medium">Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span className="text-sm font-medium">Google</span>
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 border-gray-300 hover:border-gray-400 text-gray-700 bg-white"
                  disabled
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </Button>
              </div>
            </div>

            {/* Or continue with email */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>
            </div>

            {/* Email Registration Form */}
            <form onSubmit={handleEmailRegistration} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Full name"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={userData.email}
                  onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                  className="h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={isLoading || !userData.name || !userData.email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Dark Blue Background */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative">
          <div className="flex items-center justify-center w-full">
            <div className="text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                <UserCheck className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Find Your Dream Job</h3>
              <p className="text-blue-100 text-lg">Join thousands of professionals who found their perfect career match</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}