/**
 * Unified Authentication Flow
 * Complete flow: Gmail → Create Account → OTP → Login → Role Choose → Jobseeker/Employer options
 */

'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, User, ArrowLeft, CheckCircle, Briefcase, UserCheck } from 'lucide-react';
import OTPVerification from './OTPVerification';

interface UnifiedAuthFlowProps {
  onAuthSuccess?: (user: any) => void;
}

type AuthStep = 'welcome' | 'otp-verification' | 'role-selection' | 'complete-profile';

export default function UnifiedAuthFlow({ onAuthSuccess }: UnifiedAuthFlowProps) {
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
  
  // OTP verification state
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'registration' | 'verification'>('registration');

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // First, get user info from Google
      const result = await signIn('google', {
        callbackUrl: '/auth/unified',
        redirect: false
      });

      if (result?.error) {
        setError('Google authentication failed. Please try again.');
        setIsLoading(false);
      } else if (result?.ok) {
        // Google auth successful, now send OTP to user's email
        setSuccess('Google authentication successful! Sending OTP to your email...');
        
        // Extract email from Google response or use a placeholder
        const email = 'user@gmail.com'; // This will be replaced with actual email from Google
        
        // Send OTP for verification
        const otpResponse = await fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            purpose: 'verification',
            userName: 'User'
          }),
        });

        const otpData = await otpResponse.json();

        if (otpData.success) {
          setUserData(prev => ({ ...prev, email, authMethod: 'google' }));
          setOtpPurpose('verification');
          setCurrentStep('otp-verification');
        } else {
          setError('Failed to send OTP. Please try again.');
        }
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Send OTP for registration
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          purpose: 'registration',
          userName: userData.name
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpPurpose('registration');
        setCurrentStep('otp-verification');
        setSuccess('OTP sent to your email!');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerificationSuccess = async (data: any) => {
    setSuccess('Email verified successfully!');
    
    if (otpPurpose === 'registration' || otpPurpose === 'verification') {
      // Move to role selection after OTP verification
      setCurrentStep('role-selection');
    } else if (otpPurpose === 'login') {
      // Handle login success - redirect to role selection or dashboard
      if (data.user?.role) {
        // User has role, redirect to appropriate dashboard
        if (onAuthSuccess) {
          onAuthSuccess(data.user);
        }
      } else {
        // No role set, redirect to role selection
        setCurrentStep('role-selection');
      }
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
          role: userData.role,
          authMethod: userData.authMethod
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Registration completed successfully!');
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess(data.user);
          }
        }, 1000);
      } else {
        setError(data.message || 'Registration failed');
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

  // OTP Verification Step
  if (currentStep === 'otp-verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <OTPVerification
            email={userData.email}
            purpose={otpPurpose}
            userName={userData.name}
            onVerificationSuccess={handleOTPVerificationSuccess}
            onBack={handleBackToWelcome}
          />
        </div>
      </div>
    );
  }

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

  // Welcome Step (Initial) - Clean flow with Google and Email options
  return (
    <div className="space-y-4">
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

      {/* Google Auth Button */}
      <Button
        onClick={handleGoogleAuth}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
        )}
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email Login Form */}
      <form onSubmit={handleEmailRegistration} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={userData.email}
            onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !userData.email}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending OTP...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send OTP
            </>
          )}
        </Button>
      </form>

      {/* Forgot Password Link */}
      <div className="text-center">
        <Button
          variant="ghost"
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={() => {
            // Handle forgot password - send OTP for password reset
            if (userData.email) {
              setOtpPurpose('login');
              setCurrentStep('otp-verification');
            } else {
              setError('Please enter your email first');
            }
          }}
        >
          Forgot Password?
        </Button>
      </div>
    </div>
  );
}
