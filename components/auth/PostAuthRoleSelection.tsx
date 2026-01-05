/**
 * Post-Authentication Role Selection
 * Handles role selection and initial setup after successful authentication
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCheck, Briefcase } from 'lucide-react';
import SmoothTransition from '@/components/auth/SmoothTransition';

interface PostAuthRoleSelectionProps {
  user: Record<string, unknown>;
  onComplete?: (user: Record<string, unknown>) => void;
}

export default function PostAuthRoleSelection({ user, onComplete }: PostAuthRoleSelectionProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Debug logging
  console.log('🔍 PostAuthRoleSelection - User object:', user);
  console.log('🔍 PostAuthRoleSelection - User role:', user?.role);
  console.log('🔍 PostAuthRoleSelection - User ID:', user?.id);

  // Check if user already has a role and redirect immediately
  React.useEffect(() => {
    // --- ADMIN LOOP FIX: If user is admin by email but session role is missing, force session reload ---
    const adminEmails = [
      'anamsayyed58@gmail.com', // Add more admin emails as needed
    ];
    if (!user?.role && user?.email && adminEmails.includes(user.email as string)) {
      // If the user is an admin by email but role is missing, force session reload
      console.log('⚡ Forcing session reload for admin user with missing role');
      if (typeof window !== 'undefined' && updateSession) {
        updateSession().then(() => {
          // After session update, reload the page to trigger redirect
          window.location.reload();
        });
      }
      return;
    }

    if (user?.role) {
      console.log('User already has role:', user.role, '- checking if should redirect');
      // If user has jobseeker or employer role, redirect to appropriate dashboard
      if (user.role === 'jobseeker' || user.role === 'employer') {
        let targetUrl = '/dashboard';
        switch (user.role) {
          case 'jobseeker':
            targetUrl = '/dashboard/jobseeker';
            break;
          case 'employer':
            targetUrl = '/dashboard/company';
            break;
        }
        console.log('🔄 Redirecting user with existing role to:', targetUrl);
        router.push(targetUrl);
        return;
      }
      // Handle other roles (admin, etc.)
      if (user.role !== 'jobseeker' && user.role !== 'employer') {
        console.log('User has non-standard role:', user.role, '- redirecting to admin dashboard');
        let targetUrl = '/dashboard';
        switch (user.role) {
          case 'admin':
            targetUrl = '/dashboard/admin';
            break;
          default:
            targetUrl = '/dashboard';
        }
        console.log('🔄 Immediate redirect URL:', targetUrl);
        router.push(targetUrl);
      }
    }
    // If user is role-locked, redirect them to their appropriate dashboard
    if (user?.roleLocked && user?.lockedRole) {
      console.log('🔒 User is role-locked, redirecting to locked role dashboard:', user.lockedRole);
      let targetUrl = '/dashboard';
      switch (user.lockedRole) {
        case 'jobseeker':
          targetUrl = '/dashboard/jobseeker';
          break;
        case 'employer':
          targetUrl = '/dashboard/company';
          break;
        case 'admin':
          targetUrl = '/dashboard/admin';
          break;
        default:
          targetUrl = '/dashboard';
      }
      console.log('🔄 Role-locked redirect URL:', targetUrl);
      router.push(targetUrl);
    }
  }, [user?.role, user?.roleLocked, user?.lockedRole, user?.email, router, updateSession]);

  const handleRoleSelection = async (role: 'jobseeker' | 'employer') => {
    setSelectedRole(role);
    setIsLoading(true);
    setError('');
    setIsRedirecting(true);

    try {
      console.log('🎯 PostAuthRoleSelection - Starting role selection process');
      console.log('PostAuthRoleSelection - User data:', user);
      console.log('PostAuthRoleSelection - User ID:', user.id);
      console.log('PostAuthRoleSelection - Role to set:', role);
      
      // Check if user ID exists
      if (!user.id) {
        console.error('❌ PostAuthRoleSelection - No user ID available');
        setError('User session is invalid. Please sign in again.');
        setIsLoading(false);
        setIsRedirecting(false);
        return;
      }
      
      // Update user role in database
      const apiUrl = '/api/auth/set-role';
      console.log('📡 PostAuthRoleSelection - Making API request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ role: role }),
      });
      
      console.log('📊 PostAuthRoleSelection - Response status:', response.status);

      if (!response.ok) {
        console.error('❌ PostAuthRoleSelection - HTTP error:', response.status, response.statusText);
        
        let errorMessage = 'Failed to update role. Please try again.';
        if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please contact support.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again in a few moments.';
        } else if (response.status === 401) {
          errorMessage = 'User session expired. Please sign in again.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
        setIsRedirecting(false);
        return;
      }

      const data = await response.json();
      console.log('✅ PostAuthRoleSelection - Response data:', data);

      if (data.success) {
        console.log('🎉 Role updated successfully:', data.user);
        
        // Update the session to reflect the new role
        console.log('🔄 Updating session...');
        await updateSession();
        console.log('✅ Session updated');
        
        // Minimal delay to ensure session update completes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check for redirect parameter from URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        
        // Determine target URL - use redirect parameter if available, otherwise default
        let targetUrl = '/dashboard';
        
        if (redirectParam && (redirectParam.startsWith('/') || redirectParam.startsWith('http'))) {
          // Validate redirect URL is safe (same origin)
          try {
            const redirectUrl = new URL(redirectParam, window.location.origin);
            if (redirectUrl.origin === window.location.origin) {
              targetUrl = redirectParam;
              console.log('🚀 Using redirect parameter:', targetUrl);
            } else {
              console.log('⚠️ Invalid redirect URL (different origin), using default');
            }
          } catch {
            console.log('⚠️ Invalid redirect URL format, using default');
          }
        }
        
        // If no valid redirect parameter, use default based on role
        if (targetUrl === '/dashboard') {
          switch (role) {
            case 'jobseeker':
              targetUrl = '/dashboard/jobseeker';
              break;
            case 'employer':
              targetUrl = '/dashboard/company';
              break;
            default:
              targetUrl = '/dashboard';
          }
        }
        
        console.log('🚀 Redirecting to:', targetUrl);
        
        // Use router.push for smooth client-side navigation
        router.push(targetUrl);
        
        if (onComplete) {
          onComplete({ ...user, role });
        }
      } else {
        console.error('❌ Role update failed:', data);
        setError(data.error || data.message || 'Failed to update role. Please try again.');
        setIsLoading(false);
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('💥 Role selection error:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your connection and try again.`);
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };


  // If user is role-locked, show locked message
  if (user.roleLocked && user.lockedRole) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Role Locked
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your account is locked as a <strong>{String(user.lockedRole)}</strong>. Role switching is not allowed after initial selection.
            </p>
            {user.roleLockReason && (
              <p className="text-lg text-gray-500 mt-4">
                Reason: {String(user.roleLockReason)}
              </p>
            )}
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100">
                  <UserCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Continue as {user.lockedRole === 'jobseeker' ? 'Job Seeker' : 'Employer'}
                </h3>
                <p className="text-gray-600 mb-6">
                  You can continue using the platform with your current role.
                </p>
              </div>

                <Button
                  onClick={() => {
                    const targetUrl = user.lockedRole === 'jobseeker' ? '/dashboard/jobseeker' : '/dashboard/company';
                    router.push(targetUrl);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg"
                >
                  Continue to Dashboard →
                </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              You are currently registered as a <strong>{String(user.role)}</strong>. You can change your role or continue with your current role.
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">I&apos;m a Job Seeker</h3>
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
                    onClick={() => {
                      console.log('Direct redirect to jobseeker dashboard');
                      router.push('/dashboard/jobseeker');
                    }}
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">I&apos;m an Employer</h3>
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
                    onClick={() => {
                      console.log('Direct redirect to employer dashboard');
                      router.push('/dashboard/company');
                    }}
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

  // Show smooth transition during redirect
  if (isRedirecting && selectedRole) {
    return <SmoothTransition role={selectedRole} />;
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">I&apos;m a Job Seeker</h3>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">I&apos;m an Employer</h3>
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
