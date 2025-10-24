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
import { CheckCircle, Mail, User, Shield, ArrowRight, ArrowLeft, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';

export default function GmailProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { socket, isConnected, notifications, unreadCount } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

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
      
      // Check if user already has a role and redirect them after showing profile
      if (user.role && user.role !== 'jobseeker' && user.role !== 'employer') {
        console.log('User already has role:', user.role, '- will redirect after profile display');
        // Don't redirect immediately, let the user see their profile first
        // The continue button will handle the redirect
      }
      
      // Show welcome notification for new OAuth users
      if (user.isNewUser) {
        console.log('🎉 New OAuth user detected - showing welcome notification');
        toast.success("🎉 Welcome to Naukrimili!", {
          description: "You've successfully connected with Google! Start exploring job opportunities.",
          duration: 5000,
        });
      }
    }
  }, [session, status, router]);

  // Debug socket connection and notifications
  useEffect(() => {
    console.log('🔌 Socket Debug - Connected:', isConnected);
    console.log('🔌 Socket Debug - Socket:', socket);
    console.log('🔔 Notifications Debug - Count:', notifications.length);
    console.log('🔔 Notifications Debug - Unread:', unreadCount);
    console.log('🔔 Notifications Debug - List:', notifications);
    
    if (notifications && notifications.length > 0 && notifications[0]) {
      console.log('🔔 Latest notification:', notifications[0]);
    }
  }, [socket, isConnected, notifications, unreadCount]);

  const handleContinue = async () => {
    setIsLoading(true);
    
    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = session?.user as any;
    
    // Check if user already has a role
    if (user?.role && user.role !== 'jobseeker' && user.role !== 'employer') {
      console.log('User already has role:', user.role, '- redirecting to dashboard');
      let targetUrl = '/dashboard';
      
      switch (user.role) {
        case 'admin':
          targetUrl = '/dashboard/admin';
          break;
        default:
          targetUrl = '/dashboard';
      }
      
      const finalUrl = `${targetUrl}?role_selected=true&timestamp=${Date.now()}`;
      console.log('🔄 Redirecting to dashboard:', finalUrl);
      window.location.href = finalUrl;
    } else {
      // New user or no role - go to role selection
      console.log('New user or no role - redirecting to role selection');
      router.push('/auth/role-selection');
    }
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
            
            {/* Show notification for Gmail details */}
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  Gmail Account Connected Successfully!
                </p>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Your Google account information is displayed below for verification.
              </p>
            </div>

            {/* Socket and Notification Status */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">
                    Real-time Notifications
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-blue-700">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {notifications && notifications.length > 0 
                  ? `${notifications.length} notifications received` 
                  : 'No notifications yet'
                }
              </p>
              <div className="flex space-x-2 mt-2">
                {notifications && notifications.length > 0 && (
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {showNotifications ? 'Hide' : 'Show'} Notifications
                  </button>
                )}
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'TEST',
                          title: 'Test Notification',
                          message: 'This is a test notification to verify the system is working!',
                          data: { test: true }
                        })
                      });
                      const result = await response.json();
                      console.log('Test notification result:', result);
                      toast.success('Test notification sent!');
                    } catch (error) {
                      console.error('Test notification error:', error);
                      toast.error('Failed to send test notification');
                    }
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Test Notification
                </button>
              </div>
            </div>
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
                    <span>{user?.role && user.role !== 'jobseeker' && user.role !== 'employer' ? 'Continue to Dashboard' : 'Continue to Role Selection'}</span>
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

            {/* Notifications Display */}
            {showNotifications && notifications && notifications.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Notifications</h3>
                {notifications.slice(0, 3).map((notification, index) => (
                  <div key={notification.id || index} className="bg-white p-3 rounded border">
                    <div className="flex items-start space-x-2">
                      <Bell className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}