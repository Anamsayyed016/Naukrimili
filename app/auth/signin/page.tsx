'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OAuthButtons from '@/components/auth/OAuthButtons';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role) {
        // User has role, redirect to dashboard
        if (session.user.role === 'jobseeker') {
          router.push('/dashboard/jobseeker');
        } else if (session.user.role === 'employer') {
          router.push('/dashboard/company');
        }
      } else {
        // User authenticated but no role, go to role selection
        router.push('/auth/role-selection');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <h1 className="text-3xl font-bold text-blue-600">NaukriMili</h1>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-gray-600">Sign in to continue to your account</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <OAuthButtons 
            callbackUrl="/auth/role-selection"
          />

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <a 
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up here
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
