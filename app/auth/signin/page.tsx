"use client";

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User } from 'lucide-react';
import Link from 'next/link';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function SignInPage() {
  const { data: session, status } = useSession();
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
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  // Handle OAuth users who are already authenticated - instant redirect
  useEffect(() => {
    if (status === 'loading' || hasRedirected) return;
    
    if (status === 'authenticated' && session?.user) {
      console.log('User already authenticated:', session.user);
      setHasRedirected(true);
      
      if (!session.user.role) {
        router.replace('/auth/role-selection');
      } else {
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
  }, [session, status, router, hasRedirected]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRoleLockError(null);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (sessionData?.user?.role === 'admin') {
          router.push('/dashboard/admin');
        } else if (sessionData?.user?.role === 'employer') {
          router.push('/dashboard/company');
        } else if (sessionData?.user?.role === 'jobseeker') {
          router.push('/dashboard/jobseeker');
        } else {
          router.push('/auth/role-selection');
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
          setError('Invalid email or password. Please try again.');
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
          router.push('/auth/role-selection');
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
                <div className="md:col-span-2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-8 sm:p-12 lg:p-16 flex flex-col items-center justify-center text-white relative overflow-hidden min-h-[400px] md:min-h-[600px]">
                  {/* Decorative Pattern - Matching existing design */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rotate-45"></div>
                    <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-white rotate-12"></div>
                    <div className="absolute top-1/2 left-1/4 w-16 h-16 border-4 border-white -rotate-12"></div>
                  </div>
                  
                  <div className="relative z-10 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg mb-4">
                      <span className="text-4xl font-bold text-white">N</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading leading-tight">
                      Welcome to NaukriMili
                    </h1>
                    <p className="text-base sm:text-lg text-white/90 max-w-sm mx-auto leading-relaxed px-4">
                      Sign in to access your personalized job portal and unlock career opportunities
                    </p>
                    <button
                      onClick={() => {
                        setShowSignIn(false);
                        setError(null);
                        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                      }}
                      className="px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-purple-600 rounded-full font-semibold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                {/* Right Panel - Sign In Form (60% width on desktop) */}
                <div className="md:col-span-3 p-6 sm:p-8 lg:p-12 bg-white">
                  <div className="max-w-md mx-auto">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
                      Sign In to Account
                    </h2>

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

                    {/* OAuth Buttons */}
                    <div className="mb-6">
                      <OAuthButtons callbackUrl="/auth/role-selection" />
                    </div>

                    <div className="relative flex items-center justify-center my-6">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-4 text-xs sm:text-sm text-gray-500 font-medium">or use your email for login</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="pl-10 sm:pl-12 h-12 sm:h-14 bg-gray-50 border-gray-200 rounded-xl text-sm sm:text-base"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="pl-10 sm:pl-12 pr-12 h-12 sm:h-14 bg-gray-50 border-gray-200 rounded-xl text-sm sm:text-base"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

                      <Button 
                        type="submit" 
                        className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-wide"
                        disabled={loading}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Left Panel - Create Account Form (60% width) */}
                <div className="md:col-span-3 p-6 sm:p-8 lg:p-12 bg-white order-2 md:order-1">
                  <div className="max-w-md mx-auto">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
                      Create Account
                    </h2>

                    {error && (
                      <Alert className="mb-6 border-red-200 bg-red-50 border-0 rounded-xl">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* OAuth Buttons */}
                    <div className="mb-6">
                      <OAuthButtons callbackUrl="/auth/role-selection" />
                    </div>

                    <div className="relative flex items-center justify-center my-6">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-4 text-xs sm:text-sm text-gray-500 font-medium">or use your email for registration</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="relative">
                        <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="name"
                          type="text"
                          placeholder="Name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10 sm:pl-12 h-12 sm:h-14 bg-gray-50 border-gray-200 rounded-xl text-sm sm:text-base"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="email"
                          type="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 sm:pl-12 h-12 sm:h-14 bg-gray-50 border-gray-200 rounded-xl text-sm sm:text-base"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 sm:pl-12 pr-12 h-12 sm:h-14 bg-gray-50 border-gray-200 rounded-xl text-sm sm:text-base"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
                        </Button>
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10 sm:pl-12 pr-12 h-12 sm:h-14 bg-gray-50 border-gray-200 rounded-xl text-sm sm:text-base"
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

                      <Button 
                        type="submit" 
                        className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 uppercase tracking-wide"
                        disabled={loading}
                      >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Right Panel - Professional Welcome (40% width) */}
                <div className="md:col-span-2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-8 sm:p-12 lg:p-16 flex flex-col items-center justify-center text-white relative overflow-hidden min-h-[400px] md:min-h-[600px] order-1 md:order-2">
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
