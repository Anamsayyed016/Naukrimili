/**
 * Gmail Profile Confirmation Page
 * Shows user's Google account details before role selection
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Mail, User, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GmailProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('🔍 Gmail Profile Page - Status:', status);
    console.log('🔍 Gmail Profile Page - Session:', session);
    
    if (status === 'loading') {
      console.log('Session is loading...');
      return;
    }

    if (status === 'unauthenticated') {
      console.log('User is not authenticated, redirecting to signin');
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      console.log('Gmail Profile Page - User authenticated:', user);
      console.log('Gmail Profile Page - User email:', user.email);
      console.log('Gmail Profile Page - User name:', user.name);
      console.log('Gmail Profile Page - User picture:', user.picture);
    }
  }, [session, status, router]);

  const handleContinue = async () => {
    setIsLoading(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Redirect to role selection
    router.push('/auth/role-selection');
  };

  const handleGoBack = () => {
    router.push('/auth/signin');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const user = session.user as any & { picture?: string };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome to NaukriMili!
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              You've successfully signed in with Google. Please review your account details below.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Account Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google" 
                    className="w-5 h-5"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Signed in with Google</p>
                  <p className="text-sm text-gray-700">Secure OAuth authentication</p>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.picture || ''} alt={user.name || ''} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{user.name || 'User'}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>

              {/* Access Information */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">NaukriMili will access:</p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Name and profile picture</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Email address</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleContinue}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Continuing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Continue to Role Selection</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Use Different Account</span>
                </div>
              </Button>
            </div>

            {/* Privacy Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                By continuing, you agree to our{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}