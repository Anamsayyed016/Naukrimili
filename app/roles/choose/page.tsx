'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  Briefcase, 
  Upload, 
  Search, 
  Plus, 
  BarChart3,
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

export default function RoleChoosePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // If user already has a role, redirect to appropriate dashboard
      if (session.user.role) {
        const dashboardUrl = getDashboardUrl(session.user.role);
        router.push(dashboardUrl);
        return;
      }
    }
  }, [session, status, router]);

  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'jobseeker':
        return '/dashboard/jobseeker';
      case 'employer':
        return '/dashboard/company';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  };

  const handleRoleSelection = async (role: 'jobseeker' | 'employer') => {
    setSelectedRole(role);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Role set successfully, updating session...');
        
        // Update the session to reflect the new role
        await updateSession();
        
        // Wait a moment for session to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect to appropriate dashboard
        const dashboardUrl = getDashboardUrl(role);
        console.log('🔄 Redirecting to dashboard:', dashboardUrl);
        router.push(dashboardUrl);
      } else {
        console.error('❌ Role selection failed:', data.error);
        setError(data.error || 'Failed to set role. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error setting role:', error);
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Role
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Welcome to NaukriMili! Please select how you'd like to use our platform.
            </p>
            <p className="text-sm text-gray-500">
              This choice will be permanent and cannot be changed later.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Job Seeker Card */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedRole === 'jobseeker' 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => !isLoading && setSelectedRole('jobseeker')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Job Seeker</CardTitle>
                <p className="text-gray-600">
                  Find your dream job and advance your career
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Search and apply to jobs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Upload and manage resumes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Track applications</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">Get job recommendations</span>
                  </div>
                </div>
                
                {selectedRole === 'jobseeker' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoleSelection('jobseeker');
                      }}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          Choose Job Seeker
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employer Card */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedRole === 'employer' 
                  ? 'ring-2 ring-green-500 bg-green-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => !isLoading && setSelectedRole('employer')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Employer</CardTitle>
                <p className="text-gray-600">
                  Post jobs and find the best talent
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Post job openings</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Search and filter candidates</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Manage applications</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">View analytics and insights</span>
                  </div>
                </div>
                
                {selectedRole === 'employer' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoleSelection('employer');
                      }}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          Choose Employer
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selection Instructions */}
          {!selectedRole && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Click on a card above to select your role
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <CheckCircle className="w-4 h-4" />
                <span>This choice is permanent and cannot be changed later</span>
              </div>
            </div>
          )}

          {/* Back to Sign In */}
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => router.push('/auth/signin')}
              disabled={isLoading}
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
