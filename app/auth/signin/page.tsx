"use client";

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const [showSignIn, setShowSignIn] = useState(true); // true = Sign In, false = Sign Up
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
  
  // Handle OAuth users who are already authenticated
  useEffect(() => {
    if (status === 'loading' || hasRedirected) {
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      console.log('User already authenticated:', session.user);
      setHasRedirected(true);
      
      if (!session.user.role) {
        router.push('/auth/role-selection');
      } else {
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
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {/* Split Panel Card - Reference Design Inspired */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2 min-h-[600px]">
            
            {/* Left Panel - Welcome Back (Sign In) */}
            {showSignIn ? (
              <>
                {/* Mobile: Sign In Form */}
                <div className="md:hidden p-8 sm:p-12">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                      <span className="text-2xl font-bold text-white">N</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                    <p className="text-gray-600">Access your personalized job portal</p>
                  </div>

                  {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email-mobile" className="text-sm font-medium text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="email-mobile"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 h-12 rounded-xl border-gray-300"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-mobile" className="text-sm font-medium text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password-mobile"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-12 h-12 rounded-xl border-gray-300"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'SIGN IN'}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="relative flex items-center justify-center my-6">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-4 text-xs text-gray-500">Or sign in with</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>
                    <OAuthButtons callbackUrl="/auth/role-selection" />
                  </div>

                  <p className="text-center text-sm text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setShowSignIn(false)}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Create account
                    </button>
                  </p>
                </div>

                {/* Desktop: Left Panel - Welcome Gradient */}
                <div className="hidden md:flex bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-12 lg:p-16 flex-col items-center justify-center text-white relative overflow-hidden">
                  {/* Decorative Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rotate-45"></div>
                    <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-white rotate-12"></div>
                    <div className="absolute top-1/2 left-1/4 w-16 h-16 border-4 border-white -rotate-12"></div>
                  </div>
                  
                  {/* Accent Shapes */}
                  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-400/30 rounded-full blur-3xl"></div>
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg mb-4">
                      <span className="text-4xl font-bold text-white">N</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                      Welcome Back!
                    </h1>
                    <p className="text-lg lg:text-xl text-white/90 max-w-md mx-auto leading-relaxed">
                      To keep connected with us please login with your personal info
                    </p>
                    <button
                      onClick={() => setShowSignIn(false)}
                      className="px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-teal-600 rounded-full font-semibold transition-all duration-300 uppercase tracking-wide"
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                {/* Desktop: Right Panel - Sign In Form */}
                <div className="hidden md:block p-8 lg:p-12 bg-white relative">
                  {/* Decorative Accent */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-pink-400/30 to-orange-400/30 rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10 max-w-md mx-auto">
                    <h2 className="text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-8">
                      Sign In to Account
                    </h2>

                    {error && (
                      <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    {roleLockError && (
                      <Alert className="mb-6 border-amber-200 bg-amber-50">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <p className="font-medium">{roleLockError.error}</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Social Login */}
                    <div className="mb-6">
                      <OAuthButtons callbackUrl="/auth/role-selection" />
                    </div>

                    <div className="relative flex items-center justify-center my-6">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-4 text-sm text-gray-500">or use your email for login</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="pl-10 pr-12 h-12 bg-gray-50 border-gray-200 rounded-lg"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </Button>
                        </div>
                      </div>

                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-gray-600 hover:text-blue-600 inline-block"
                      >
                        Forgot password?
                      </Link>

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-semibold uppercase tracking-wide"
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
                {/* Mobile: Sign Up Form */}
                <div className="md:hidden p-8 sm:p-12">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                      <span className="text-2xl font-bold text-white">N</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                    <p className="text-gray-600">Join NaukriMili today</p>
                  </div>

                  {error && (
                    <Alert className="mb-6 border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        name="name"
                        type="text"
                        placeholder="Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 h-12 rounded-xl"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 h-12 rounded-xl"
                        required
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-12 h-12 rounded-xl"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10 pr-12 h-12 rounded-xl"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'SIGN UP'}
                    </Button>
                  </form>

                  <div className="mt-6">
                    <div className="relative flex items-center justify-center my-6">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-4 text-xs text-gray-500">Or sign up with</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>
                    <OAuthButtons callbackUrl="/auth/role-selection" />
                  </div>

                  <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account?{' '}
                    <button 
                      onClick={() => setShowSignIn(true)}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>

                {/* Desktop: Right Panel - Sign Up Form */}
                <div className="hidden md:block p-8 lg:p-12 bg-white relative order-2">
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-pink-400/30 to-orange-400/30 rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10 max-w-md mx-auto">
                    <h2 className="text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-8">
                      Create Account
                    </h2>

                    {error && (
                      <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="mb-6">
                      <OAuthButtons callbackUrl="/auth/role-selection" />
                    </div>

                    <div className="relative flex items-center justify-center my-6">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-4 text-sm text-gray-500">or use your email for registration</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="name"
                          type="text"
                          placeholder="Name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="email"
                          type="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-lg"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-12 h-12 bg-gray-50 border-gray-200 rounded-lg"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10 pr-12 h-12 bg-gray-50 border-gray-200 rounded-lg"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-semibold uppercase tracking-wide"
                        disabled={loading}
                      >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Desktop: Left Panel - Welcome Gradient (Sign Up Mode) */}
                <div className="hidden md:flex bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 p-12 lg:p-16 flex-col items-center justify-center text-white relative overflow-hidden order-1">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-32 h-32 border-4 border-white -rotate-45"></div>
                    <div className="absolute bottom-20 left-10 w-24 h-24 border-4 border-white rotate-12"></div>
                  </div>
                  
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-pink-400/30 rounded-full blur-3xl"></div>
                  <div className="absolute -top-20 -left-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg mb-4">
                      <span className="text-4xl font-bold text-white">N</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                      Hello, Friend!
                    </h1>
                    <p className="text-lg lg:text-xl text-white/90 max-w-md mx-auto leading-relaxed">
                      Enter your personal details and start your journey with us
                    </p>
                    <button
                      onClick={() => setShowSignIn(true)}
                      className="px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-purple-600 rounded-full font-semibold transition-all duration-300 uppercase tracking-wide"
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
