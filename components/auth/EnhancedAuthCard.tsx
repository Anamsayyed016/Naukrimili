/**
 * Enhanced Authentication Card with OTP Integration
 * Integrates Google OAuth with Postmark OTP verification
 */

'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User, ArrowLeft, CheckCircle } from 'lucide-react';
import OTPVerification from './OTPVerification';

interface EnhancedAuthCardProps {
  onAuthSuccess?: (user: any) => void;
}

type AuthStep = 'auth' | 'otp-verification' | 'registration';
type AuthMethod = 'google' | 'email';

export default function EnhancedAuthCard({ onAuthSuccess }: EnhancedAuthCardProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('auth');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Email auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  
  // OTP verification state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'registration' | 'verification'>('login');

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false
      });

      if (result?.error) {
        setError('Google authentication failed. Please try again.');
      } else if (result?.ok) {
        setSuccess('Google authentication successful!');
        // After Google OAuth, we'll send OTP for additional verification
        setOtpEmail(result.url?.split('email=')[1]?.split('&')[0] || '');
        setOtpPurpose('verification');
        setCurrentStep('otp-verification');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // First, try to send OTP for email authentication
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          purpose: 'login',
          userName
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpEmail(email);
        setOtpPurpose('login');
        setCurrentStep('otp-verification');
        setSuccess('OTP sent to your email!');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Email auth error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
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
          email,
          purpose: 'registration',
          userName
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpEmail(email);
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
    setSuccess('Authentication successful!');
    
    if (otpPurpose === 'login' && data.user) {
      // Handle login success
      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
    } else if (otpPurpose === 'registration') {
      // Handle registration completion
      setCurrentStep('registration');
    } else if (otpPurpose === 'verification') {
      // Handle email verification success
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        if (onAuthSuccess) {
          onAuthSuccess({ email: otpEmail, verified: true });
        }
      }, 1000);
    }
  };

  const handleBackToAuth = () => {
    setCurrentStep('auth');
    setError('');
    setSuccess('');
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userName.split(' ')[0] || '',
          lastName: userName.split(' ').slice(1).join(' ') || '',
          email: otpEmail,
          password,
          role: 'jobseeker'
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

  if (currentStep === 'otp-verification') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <OTPVerification
            email={otpEmail}
            purpose={otpPurpose}
            userName={userName}
            onVerificationSuccess={handleOTPVerificationSuccess}
            onBack={handleBackToAuth}
          />
        </div>
      </div>
    );
  }

  if (currentStep === 'registration') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Complete Registration</CardTitle>
            <CardDescription>
              Email verified! Set your password to complete registration.
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

            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={otpEmail}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password}
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
                onClick={handleBackToAuth}
                className="text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
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

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-4">
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

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !email}
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
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleRegistration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email || !userName}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
