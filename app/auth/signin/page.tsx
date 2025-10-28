"use client";

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, UserCheck, Building2, Phone, Shield, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import ConditionalOAuthButton from '@/components/auth/ConditionalOAuthButton';
import { PhoneNumberInput } from '@/components/auth/PhoneNumberInput';
import { OTPVerificationForm } from '@/components/auth/OTPVerificationForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

type AuthMethod = 'gmail' | 'phone' | 'otp' | 'email';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('gmail');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleLockError, setRoleLockError] = useState<any>(null);
  const [otpData, setOtpData] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Handle OAuth users who are already authenticated
  useEffect(() => {
    if (status === 'loading' || hasRedirected) {
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      console.log('User already authenticated:', session.user);
      setHasRedirected(true);
      
      // If user has no role, redirect to role selection
      if (!session.user.role) {
        console.log('User has no role, redirecting to role selection');
        router.push('/auth/role-selection');
      } else {
        // User has a role, redirect to appropriate dashboard
        switch (session.user.role) {
          case 'admin':
            router.push('/dashboard/admin');
            break;
          case 'jobseeker':
            router.push('/dashboard/jobseeker');
            break;
          case 'employer':
            router.push('/dashboard/company');
            break;
          default:
            router.push('/auth/role-selection');
        }
      }
    }
  }, [session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRoleLockError(null);

    try {
      // First, try to authenticate with credentials
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        // Redirect to role selection or dashboard based on user role
        router.push('/auth/role-selection');
      } else {
        // Check if the error is related to role lock
        if (result?.error && result.error.includes('Cannot login as')) {
          setRoleLockError({
            success: false,
            canLogin: false,
            error: result.error,
            currentRole: (result as any).currentRole,
            lockedRole: (result as any).lockedRole,
            reason: (result as any).reason
          });
        } else {
          setError('Invalid email or password. Please try again.');
        }
      }
    } catch (_error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle phone OTP flow
  const handlePhoneOTPStart = () => {
    setAuthMethod('phone');
    setError('');
  };

  const handleOTPSent = (data: any) => {
    console.log('handleOTPSent - data:', data);
    setPhoneNumber(data.phoneNumber);
    setOtpData({ 
      otpId: data.otpId, 
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null 
    });
    setAuthMethod('otp');
    setError('');
  };

  const handleOTPVerified = async (data: Record<string, unknown>) => {
    try {
      // Verify phone number in database
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Create a session for the phone-verified user
        // For now, redirect to role selection
        router.push('/auth/role-selection');
      } else {
        setError('Phone verification failed. Please try again.');
      }
    } catch (_error) {
      console.error('Phone verification error:', _error);
      setError('Phone verification failed. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          otpType: 'login',
          purpose: 'verification'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpData({
          otpId: data.data.otpId,
          expiresAt: data.data.expiresAt
        });
        setError('');
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (_error) {
      console.error('Resend OTP error:', error);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const handleBack = () => {
    if (authMethod === 'otp') {
      setAuthMethod('phone');
    } else if (authMethod === 'phone') {
      setAuthMethod('gmail');
    }
    setError('');
  };

  // Show loading if session is being checked
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-6">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md lg:max-w-4xl space-y-8 relative z-10">
        {/* Header with enhanced branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <h1 className="text-4xl font-bold font-heading gradient-text">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">
            Sign in to your NaukriMili account
          </p>
        </div>

        {/* Enhanced Sign In Card with glass morphism */}
        <Card className="auth-card shadow-2xl border-0 rounded-3xl overflow-hidden modern-card">
          <CardHeader className="text-center pb-8 pt-8 px-8">
            <CardTitle className="text-3xl font-bold font-heading text-gray-900 mb-2">
              Sign In
            </CardTitle>
            <CardDescription className="text-gray-600 text-base">
              Access your personalized job portal experience
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-8 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0">
            {/* Left Column - Errors */}
            <div className="lg:col-span-2 space-y-4">
              {error && (
                <Alert className="alert-error border-0 rounded-xl">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              )}

              {roleLockError && (
                <Alert className="border-amber-200 bg-amber-50 border-0 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-base">
                    <div className="space-y-2">
                      <p className="font-medium text-amber-800">{roleLockError.error}</p>
                      {roleLockError.currentRole && (
                        <p className="text-sm text-amber-700">
                          Current role: <span className="font-medium">{roleLockError.currentRole}</span>
                        </p>
                      )}
                      {roleLockError.reason && (
                        <p className="text-sm text-amber-700">
                          {roleLockError.reason}
                        </p>
                      )}
                      <div className="mt-3">
                        <Link 
                          href="/auth/signin" 
                          className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                        >
                          Try logging in as {roleLockError.lockedRole}
                        </Link>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Left Column - OAuth Methods */}
            <div className="space-y-4">
              <OAuthButtons 
                callbackUrl="/auth/role-selection"
              />
              
              <Button
                onClick={handlePhoneOTPStart}
                disabled={loading}
                className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700 text-white transition-all duration-200 rounded-xl"
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Continue with WhatsApp OTP
              </Button>
            </div>

            {/* Right Column - Email/Password Form */}
            <div className="space-y-6">
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or use email & password</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="auth-input pl-12 h-14 text-base rounded-xl border-2 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-input pl-12 pr-12 h-14 text-base rounded-xl border-2 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg"
                  />
                  <label htmlFor="remember-me" className="text-sm font-medium text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="btn-primary w-full h-14 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </div>
                )}
              </Button>
              </form>

              {/* Sign Up Links */}
              <div className="text-center space-y-6">
                <p className="text-base text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                    Create account
                  </Link>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/auth/register/jobseeker"
                    className="group inline-flex items-center justify-center px-6 py-4 border-2 border-blue-200 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <UserCheck className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Job Seeker
                  </Link>
                  <Link
                    href="/auth/register/employer"
                    className="group inline-flex items-center justify-center px-6 py-4 border-2 border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    <Building2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Employer
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OTP Flow Components */}
        {authMethod === 'phone' && (
          <div className="w-full max-w-md mx-auto">
            <PhoneNumberInput
              onSuccess={handleOTPSent}
              onBack={handleBack}
              otpType="login"
              purpose="verification"
              title="Enter Your Phone Number"
              description="We'll send you a verification code via WhatsApp"
            />
          </div>
        )}

        {authMethod === 'otp' && (
          <div className="w-full max-w-md mx-auto">
            <OTPVerificationForm
              phoneNumber={phoneNumber}
              onSuccess={handleOTPVerified}
              onBack={handleBack}
              onResend={handleResendOTP}
              otpType="login"
              purpose="verification"
              expiresAt={otpData?.expiresAt || undefined}
            />
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-blue-600 hover:underline transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-blue-600 hover:underline transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © 2024 NaukriMili. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
