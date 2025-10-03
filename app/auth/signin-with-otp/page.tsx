/**
 * Enhanced Sign In Page with OTP Verification
 * Integrates OTP verification with existing Gmail OAuth system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, UserCheck, Building2, Phone, Shield } from 'lucide-react';
import Link from 'next/link';
import ConditionalOAuthButton from '@/components/auth/ConditionalOAuthButton';
import { PhoneNumberInput } from '@/components/auth/PhoneNumberInput';
import { OTPVerificationForm } from '@/components/auth/OTPVerificationForm';

type AuthMethod = 'gmail' | 'phone' | 'otp';

export default function SignInWithOTPPage() {
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
  const [email, setEmail] = useState('');
  
  const router = useRouter();

  // Handle OAuth users who are already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('User already authenticated:', session.user);
      
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
  }, [status, session, router]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // Handle Gmail OAuth sign in
  const handleGmailSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signIn('google', {
        callbackUrl: '/roles/choose',
        redirect: true
      });
    } catch (error: any) {
      console.error('Gmail sign-in error:', error);
      setError('Gmail authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle credentials sign in
  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        // Check if user needs OTP verification
        // Note: Phone verification fields will be available after database migration
        // if (session?.user?.phone && !session?.user?.phoneVerified) {
        //   setAuthMethod('otp');
        //   setPhoneNumber(session.user.phone);
        //   setEmail(session.user.email || '');
        // } else {
          router.push('/auth/role-selection');
        // }
      }
    } catch (error: any) {
      console.error('Credentials sign-in error:', error);
      setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle phone number OTP success
  const handlePhoneOTPSuccess = (data: any) => {
    console.log('Phone OTP verification successful:', data);
    
    // Here you would typically:
    // 1. Update user's phone verification status in database
    // 2. Create or update user session
    // 3. Redirect to appropriate dashboard
    
    // For now, redirect to role selection
    router.push('/auth/role-selection');
  };

  // Handle OTP verification success
  const handleOTPSuccess = (data: any) => {
    console.log('OTP verification successful:', data);
    
    // Here you would typically:
    // 1. Update user's verification status
    // 2. Create user session
    // 3. Redirect to appropriate dashboard
    
    // For now, redirect to role selection
    router.push('/auth/role-selection');
  };

  // Handle back to phone input
  const handleBackToPhone = () => {
    setAuthMethod('phone');
    setOtpData(null);
  };

  // Handle back to Gmail
  const handleBackToGmail = () => {
    setAuthMethod('gmail');
    setError(null);
  };

  // If OTP verification is in progress
  if (authMethod === 'otp' && phoneNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <OTPVerificationForm
          phoneNumber={phoneNumber}
          email={email}
          otpType="login"
          purpose="authentication"
          onSuccess={handleOTPSuccess}
          onBack={handleBackToGmail}
          expiresAt={otpData?.expiresAt || undefined}
        />
      </div>
    );
  }

  // If phone number input is selected
  if (authMethod === 'phone') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <PhoneNumberInput
          onSuccess={handlePhoneOTPSuccess}
          onBack={handleBackToGmail}
          otpType="login"
          purpose="authentication"
          title="Sign In with Phone"
          description="We'll send you a verification code via WhatsApp"
        />
      </div>
    );
  }

  // Main sign-in form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Choose your preferred sign-in method
          </p>
        </div>

        <Tabs defaultValue="gmail" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gmail" onClick={() => setAuthMethod('gmail')}>
              <Mail className="w-4 h-4 mr-2" />
              Gmail
            </TabsTrigger>
            <TabsTrigger value="phone" onClick={() => setAuthMethod('phone')}>
              <Phone className="w-4 h-4 mr-2" />
              Phone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Sign in with Gmail</CardTitle>
                <CardDescription className="text-center">
                  Quick and secure authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGmailSignIn}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Continue with Gmail
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="mt-1 relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50 text-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phone" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Sign in with Phone</CardTitle>
                <CardDescription className="text-center">
                  Secure authentication with OTP verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Secure Phone Verification
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      We'll send you a verification code via WhatsApp for secure authentication
                    </p>
                  </div>
                  <Button
                    onClick={() => setAuthMethod('phone')}
                    className="w-full"
                    size="lg"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Continue with Phone
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
