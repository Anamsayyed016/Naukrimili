'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Building2, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { isAuthDisabled } from '@/lib/auth-bypass';

export default function AuthBypassPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if auth is not disabled
  if (!isAuthDisabled()) {
    router.push('/auth/signin');
    return null;
  }

  const handleRoleSelection = async (role: 'jobseeker' | 'employer') => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setSelectedRole(role);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/bypass-set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), role }),
      });

      const data = await response.json();

      if (data.success) {
        // Store bypass user in localStorage
        localStorage.setItem('bypass-user', JSON.stringify(data.user));
        
        // Redirect to appropriate dashboard
        const dashboardUrl = role === 'jobseeker' ? '/dashboard/jobseeker' : '/dashboard/company';
        router.push(dashboardUrl);
      } else {
        setError(data.error || 'Failed to set up account. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error setting up bypass account:', error);
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-8 pt-8 px-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
              <span className="text-2xl font-bold text-white">N</span>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Get Started
            </CardTitle>
            <p className="text-gray-600 text-base">
              Enter your email and choose your role to continue
            </p>
            <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              Guest Mode Active
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 text-base rounded-xl border-2 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedRole === 'jobseeker' 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => !isLoading && setSelectedRole('jobseeker')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Seeker</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Find your dream job and advance your career
                  </p>
                  {selectedRole === 'jobseeker' && (
                    <Button 
                      onClick={() => handleRoleSelection('jobseeker')}
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
                          Continue as Job Seeker
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedRole === 'employer' 
                    ? 'ring-2 ring-green-500 bg-green-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => !isLoading && setSelectedRole('employer')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Employer</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Post jobs and find the best talent
                  </p>
                  {selectedRole === 'employer' && (
                    <Button 
                      onClick={() => handleRoleSelection('employer')}
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
                          Continue as Employer
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                This choice will be permanent and cannot be changed later
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
