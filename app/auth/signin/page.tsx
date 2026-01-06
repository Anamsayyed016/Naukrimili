"use client";

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User } from 'lucide-react';
import Link from 'next/link';
// Google OAuth removed - using manual registration only

export default function SignInPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [showSignIn, setShowSignIn] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleLockError, setRoleLockError] = useState<any>(null);
  const [oauthPasswordRequired, setOauthPasswordRequired] = useState(false);
  const [requestingPasswordSet, setRequestingPasswordSet] = useState(false);
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Extract callbackUrl and redirect from URL query parameters
  const callbackUrl = searchParams?.get('callbackUrl');
  const redirectParam = searchParams?.get('redirect');
  const finalRedirect = callbackUrl || redirectParam;
  
  // Handle OAuth users who are already authenticated - instant redirect
  useEffect(() => {
    if (status === 'loading' || hasRedirected) return;
    
    if (status === 'authenticated' && session?.user) {
      console.log('User already authenticated:', session.user);
      setHasRedirected(true);
      
      // Check if user needs payment (came from resume builder export)
      const needsPayment = typeof window !== 'undefined' 
        ? sessionStorage.getItem('resume-builder-needs-payment') === 'true'
        : false;
      
      if (!session.user.role) {
        // Preserve redirect when redirecting to role-selection
        const redirectQuery = finalRedirect ? `?redirect=${encodeURIComponent(finalRedirect)}` : '';
        router.replace(`/auth/role-selection${redirectQuery}`);
      } else if (needsPayment && finalRedirect && finalRedirect.startsWith('/resume-builder/')) {
        // User needs payment - redirect to pricing page with return URL
        console.log('💳 [SignIn] Already authenticated user needs payment, redirecting to pricing');
        const pricingUrl = `/pricing?return=${encodeURIComponent(finalRedirect)}&auto-download=true`;
        router.replace(pricingUrl);
      } else {
        // Use redirect parameter if available, otherwise use default dashboard
        if (finalRedirect && (finalRedirect.startsWith('/') || finalRedirect.startsWith('http'))) {
          // Validate redirect URL is safe (same origin)
          try {
            const redirectUrl = new URL(finalRedirect, window.location.origin);
            if (redirectUrl.origin === window.location.origin) {
              router.replace(finalRedirect);
              return;
            }
          } catch {
            // Invalid URL, check for resume builder intent
            const resumeBuilderData = typeof window !== 'undefined' 
              ? sessionStorage.getItem('resume-builder-payment-flow')
              : null;
            const resumeReturnUrl = typeof window !== 'undefined'
              ? sessionStorage.getItem('resume-builder-return-url')
              : null;
            
            if (resumeBuilderData && resumeReturnUrl && resumeReturnUrl.startsWith('/resume-builder/')) {
              console.log('💾 [SignIn] Resume builder intent detected (auto-redirect, invalid URL), redirecting to resume builder');
              router.replace(resumeReturnUrl);
              return;
            }
            // Fall through to default
          }
        }
        
        // Check for resume builder intent if no redirect param
        const resumeBuilderData = typeof window !== 'undefined' 
          ? sessionStorage.getItem('resume-builder-payment-flow')
          : null;
        const resumeReturnUrl = typeof window !== 'undefined'
          ? sessionStorage.getItem('resume-builder-return-url')
          : null;
        
        if (resumeBuilderData && resumeReturnUrl && resumeReturnUrl.startsWith('/resume-builder/')) {
          console.log('💾 [SignIn] Resume builder intent detected (auto-redirect, no redirect param), redirecting to resume builder');
          router.replace(resumeReturnUrl);
          return;
        }
        
        // Default redirects based on role
        switch (session.user.role) {
          case 'admin':
            router.replace('/dashboard/admin');
            break;
          case 'jobseeker':
            router.replace('/dashboard/jobseeker');
            break;
          case 'employer':
            router.replace('/dashboard/company');
            break;
          default:
            router.replace('/auth/role-selection');
        }
      }
    }
  }, [session, status, router, hasRedirected, finalRedirect]);

  // Helper function to get default redirect based on role
  const getDefaultRedirect = (role?: string) => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'employer':
        return '/dashboard/company';
      case 'jobseeker':
        return '/dashboard/jobseeker';
      default:
        return '/auth/role-selection';
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRoleLockError(null);
    setOauthPasswordRequired(false); // Reset OAuth password required state

    try {
      console.log('🔐 [SignIn] Attempting credentials login for:', formData.email);
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log('🔐 [SignIn] SignIn result:', {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url
      });

      if (result?.ok) {
        // CRITICAL: Small delay to ensure session is fully established before fetching
        // This prevents race conditions where session might not be ready immediately
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch session with retry logic for reliability
        let sessionData;
        let sessionResponse;
        let retries = 3;
        
        while (retries > 0) {
          try {
            sessionResponse = await fetch('/api/auth/session');
            if (sessionResponse.ok) {
              sessionData = await sessionResponse.json();
              break;
            }
          } catch (sessionError) {
            console.warn(`⚠️ [SignIn] Session fetch attempt ${4 - retries} failed:`, sessionError);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        }
        
        // If session fetch failed after retries, wait a bit more and try useSession hook
        if (!sessionData) {
          console.warn('⚠️ [SignIn] Session fetch failed after retries, waiting for useSession hook update');
          // Wait a bit more for useSession to update
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Try one more time with direct fetch
          try {
            const finalSessionResponse = await fetch('/api/auth/session');
            if (finalSessionResponse.ok) {
              sessionData = await finalSessionResponse.json();
            } else if (session?.user) {
              // Last resort: use useSession hook data
              console.log('⚠️ [SignIn] Using useSession hook data as fallback');
              sessionData = { user: session.user };
            }
          } catch (finalError) {
            console.error('❌ [SignIn] Final session fetch failed:', finalError);
            if (session?.user) {
              sessionData = { user: session.user };
            }
          }
        }
        
        // If we still don't have session data, something is wrong
        if (!sessionData || !sessionData.user) {
          console.error('❌ [SignIn] Could not retrieve session data after login');
          setError('Login successful but session could not be retrieved. Please refresh the page.');
          setLoading(false);
          return;
        }
        
        // Check for redirect parameter
        const redirectParam = searchParams?.get('redirect');
        const callbackUrlParam = searchParams?.get('callbackUrl');
        const finalRedirect = callbackUrlParam || redirectParam;
        
        // Check if user needs payment (came from resume builder export)
        const needsPayment = typeof window !== 'undefined' 
          ? sessionStorage.getItem('resume-builder-needs-payment') === 'true'
          : false;
        
        if (!sessionData?.user?.role) {
          // No role - redirect to role-selection, preserving redirect and payment flag
          const redirectQuery = finalRedirect ? `?redirect=${encodeURIComponent(finalRedirect)}` : '';
          router.push(`/auth/role-selection${redirectQuery}`);
        } else if (needsPayment && finalRedirect && finalRedirect.startsWith('/resume-builder/')) {
          // User needs payment - redirect to pricing page with return URL
          console.log('💳 [SignIn] User needs payment, redirecting to pricing page');
          const pricingUrl = `/pricing?return=${encodeURIComponent(finalRedirect)}&auto-download=true`;
          router.push(pricingUrl);
        } else if (finalRedirect && (finalRedirect.startsWith('/') || finalRedirect.startsWith('http'))) {
          // Use redirect parameter if available and valid
          try {
            const redirectUrl = new URL(finalRedirect, window.location.origin);
            if (redirectUrl.origin === window.location.origin) {
              router.push(finalRedirect);
            } else {
              // Invalid redirect, check for resume builder intent
              const resumeBuilderData = typeof window !== 'undefined' 
                ? sessionStorage.getItem('resume-builder-payment-flow')
                : null;
              const resumeReturnUrl = typeof window !== 'undefined'
                ? sessionStorage.getItem('resume-builder-return-url')
                : null;
              
              if (resumeBuilderData && resumeReturnUrl && resumeReturnUrl.startsWith('/resume-builder/')) {
                console.log('💾 [SignIn] Resume builder intent detected (invalid redirect param), redirecting to resume builder');
                router.push(resumeReturnUrl);
              } else {
                router.push(getDefaultRedirect(sessionData.user.role));
              }
            }
          } catch {
            // Invalid URL, check for resume builder intent
            const resumeBuilderData = typeof window !== 'undefined' 
              ? sessionStorage.getItem('resume-builder-payment-flow')
              : null;
            const resumeReturnUrl = typeof window !== 'undefined'
              ? sessionStorage.getItem('resume-builder-return-url')
              : null;
            
            if (resumeBuilderData && resumeReturnUrl && resumeReturnUrl.startsWith('/resume-builder/')) {
              console.log('💾 [SignIn] Resume builder intent detected (catch block), redirecting to resume builder');
              router.push(resumeReturnUrl);
            } else {
              router.push(getDefaultRedirect(sessionData.user.role));
            }
          }
        } else {
          // No redirect param - check for resume builder intent
          const resumeBuilderData = typeof window !== 'undefined' 
            ? sessionStorage.getItem('resume-builder-payment-flow')
            : null;
          const resumeReturnUrl = typeof window !== 'undefined'
            ? sessionStorage.getItem('resume-builder-return-url')
            : null;
          
          if (resumeBuilderData && resumeReturnUrl && resumeReturnUrl.startsWith('/resume-builder/')) {
            console.log('💾 [SignIn] Resume builder intent detected (no redirect param), redirecting to resume builder');
            router.push(resumeReturnUrl);
          } else {
            // Use default redirects based on role
            router.push(getDefaultRedirect(sessionData.user.role));
          }
        }
      } else {
        if (result?.error && result.error.includes('Cannot login as')) {
          setRoleLockError({
            error: result.error,
            currentRole: (result as any).currentRole,
            lockedRole: (result as any).lockedRole,
            reason: (result as any).reason
          });
        } else {
          // Check if this is an OAuth user without password
          // We'll check by making an API call to verify
          let isOAuthUser = false;
          try {
            const checkResponse = await fetch('/api/auth/check-oauth-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email })
            });
            
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              if (checkData.success && checkData.requiresPasswordSet) {
                isOAuthUser = true;
                setOauthPasswordRequired(true);
                setError(null);
                setRoleLockError(null);
              }
            }
          } catch (checkError) {
            console.error('Error checking OAuth password status:', checkError);
            // If check fails, show generic error
          }
          
          // Only set generic error if OAuth check didn't find OAuth user
          if (!isOAuthUser) {
            setError('Invalid email or password. Please try again.');
          }
        }
      }
    } catch (_error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          // Preserve redirect parameter after registration
          const redirectParam = searchParams?.get('redirect');
          const callbackUrlParam = searchParams?.get('callbackUrl');
          const finalRedirect = callbackUrlParam || redirectParam;
          const redirectQuery = finalRedirect ? `?redirect=${encodeURIComponent(finalRedirect)}` : '';
          router.push(`/auth/role-selection${redirectQuery}`);
        } else {
          setError('Registration successful! Please sign in.');
          setShowSignIn(true);
        }
      } else {
        setError(data.error || 'Registration failed');
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

  // Show loading if session is being checked
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
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
      {/* Background decorative elements - Matching existing design */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        {/* Split Panel Card - Matching NaukriMili Design */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-0">
          <div className="grid md:grid-cols-5">
            
            {/* Sign In Mode */}
            {showSignIn ? (
              <>
                {/* Left Panel - Welcome (40% width on desktop) */}
                <div className="md:col-span-2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-6 sm:p-8 lg:p-12 flex flex-col items-center justify-center text-white relative overflow-hidden min-h-[280px] md:min-h-[600px]">
                  {/* Decorative Pattern - Matching existing design */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rotate-45"></div>
                    <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-white rotate-12"></div>
                    <div className="absolute top-1/2 left-1/4 w-16 h-16 border-4 border-white -rotate-12"></div>
                  </div>
                  
                  <div className="relative z-10 text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg mb-2">
                      <span className="text-3xl font-bold text-white">N</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-heading leading-tight">
                      Welcome to NaukriMili
                    </h1>
                    <p className="text-sm sm:text-base lg:text-lg text-white/90 max-w-sm mx-auto leading-relaxed px-4">
                      Sign in to access your personalized job portal
                    </p>
                    <div className="space-y-3 w-full max-w-xs mx-auto">
                      <Link
                        href="/auth/register/jobseeker"
                        className="block w-full px-6 py-2.5 border-2 border-white text-white hover:bg-white hover:text-purple-600 rounded-full font-semibold transition-all duration-300 text-sm uppercase tracking-wide shadow-lg hover:shadow-xl text-center"
                      >
                        Register as Jobseeker
                      </Link>
                      <Link
                        href="/auth/register/employer"
                        className="block w-full px-6 py-2.5 border-2 border-white text-white hover:bg-white hover:text-purple-600 rounded-full font-semibold transition-all duration-300 text-sm uppercase tracking-wide shadow-lg hover:shadow-xl text-center"
                      >
                        Register as Employer
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Sign In Form (60% width on desktop) */}
                <div className="md:col-span-3 p-4 sm:p-6 lg:p-10 bg-white">
                  <div className="max-w-md mx-auto">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                      Sign In
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">Welcome back! Please sign in to continue</p>

                    {error && (
                      <Alert className="mb-6 border-red-200 bg-red-50 border-0 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    {roleLockError && (
                      <Alert className="mb-6 border-amber-200 bg-amber-50 border-0 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <p className="font-medium">{roleLockError.error}</p>
                          {roleLockError.reason && <p className="text-sm mt-1">{roleLockError.reason}</p>}
                        </AlertDescription>
                      </Alert>
                    )}

                    {oauthPasswordRequired && (
                      <Alert className="mb-6 border-blue-200 bg-blue-50 border-0 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          <p className="font-medium mb-2">Your account was created using Google.</p>
                          <p className="text-sm mb-3">Please set a password to continue using your account with email and password.</p>
                          <Button
                            onClick={async () => {
                              setRequestingPasswordSet(true);
                              try {
                                const response = await fetch('/api/auth/request-password-set', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: formData.email })
                                });
                                const data = await response.json();
                                if (data.success) {
                                  setError(null);
                                  setOauthPasswordRequired(false);
                                  alert('Password set email sent! Please check your inbox and click the link to set your password.');
                                } else {
                                  setError(data.error || 'Failed to send password set email');
                                }
                              } catch (_err) {
                                setError('Failed to send password set email. Please try again.');
                              } finally {
                                setRequestingPasswordSet(false);
                              }
                            }}
                            disabled={requestingPasswordSet}
                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                          >
                            {requestingPasswordSet ? 'Sending...' : 'Set Password'}
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Google OAuth removed - using manual registration only */}

                    <form onSubmit={handleSignIn} className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          name="email"
                          type="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 h-10 sm:h-11 bg-gray-50 border-gray-200 rounded-xl text-sm"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-10 h-10 sm:h-11 bg-gray-50 border-gray-200 rounded-xl text-sm"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center space-x-1.5">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Remember me</span>
                        </label>
                        <Link
                          href="/auth/forgot-password"
                          className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-0"
                        style={{ 
                          background: 'linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))',
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = 'linear-gradient(to right, rgb(29 78 216), rgb(126 34 206))';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = 'linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))';
                          }
                        }}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </button>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-center text-xs sm:text-sm text-gray-600 mb-3">
                          Don't have an account? Choose your role:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href="/auth/register/jobseeker"
                            className="px-4 py-2 text-xs sm:text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors text-center border border-blue-200"
                          >
                            Register as Jobseeker
                          </Link>
                          <Link
                            href="/auth/register/employer"
                            className="px-4 py-2 text-xs sm:text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors text-center border border-purple-200"
                          >
                            Register as Employer
                          </Link>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Left Panel - Create Account Form (60% width) */}
                <div className="md:col-span-3 p-4 sm:p-6 lg:p-10 bg-white order-2 md:order-1">
                  <div className="max-w-md mx-auto">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                      Create Account
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">Join thousands of job seekers and employers</p>

                    {error && (
                      <Alert className="mb-4 border-red-200 bg-red-50 border-0 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSignUp} className="space-y-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          name="name"
                          type="text"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10 h-10 sm:h-11 bg-gray-50 border-gray-200 rounded-xl text-sm"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          name="email"
                          type="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 h-10 sm:h-11 bg-gray-50 border-gray-200 rounded-xl text-sm"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-10 h-10 sm:h-11 bg-gray-50 border-gray-200 rounded-xl text-sm"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </Button>
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10 pr-10 h-10 sm:h-11 bg-gray-50 border-gray-200 rounded-xl text-sm"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
                        </Button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 sm:h-11 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-0"
                        style={{ 
                          background: 'linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))',
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = 'linear-gradient(to right, rgb(29 78 216), rgb(126 34 206))';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!loading) {
                            e.currentTarget.style.background = 'linear-gradient(to right, rgb(37 99 235), rgb(147 51 234))';
                          }
                        }}
                      >
                        {loading ? 'Creating...' : 'Create Account'}
                      </button>
                    </form>

                    {/* Google OAuth removed - using manual registration only */}

                    <p className="mt-4 text-center text-xs sm:text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        onClick={() => {
                          setShowSignIn(true);
                          setError(null);
                          setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </div>

                {/* Right Panel - Professional Welcome (40% width) */}
                <div className="md:col-span-2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-6 sm:p-8 lg:p-12 flex flex-col items-center justify-center text-white relative overflow-hidden min-h-[280px] md:min-h-[600px] order-1 md:order-2">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-32 h-32 border-4 border-white -rotate-45"></div>
                    <div className="absolute bottom-20 left-10 w-24 h-24 border-4 border-white rotate-12"></div>
                  </div>
                  
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg mb-4">
                      <span className="text-4xl font-bold text-white">N</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading leading-tight">
                      Join NaukriMili
                    </h1>
                    <p className="text-base sm:text-lg text-white/90 max-w-sm mx-auto leading-relaxed px-4">
                      Already have an account? Sign in to access your personalized job portal and career opportunities
                    </p>
                    <button
                      onClick={() => {
                        setShowSignIn(true);
                        setError(null);
                        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                      }}
                      className="px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-purple-600 rounded-full font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4 mt-8">
          <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-500">
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
