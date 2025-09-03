/**
 * OTP Verification Page
 * Handles OTP verification for Google OAuth users
 * Reuses existing OTP verification component
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OTPVerification from '@/components/auth/OTPVerification';
import { Loader2 } from 'lucide-react';

export default function VerifyOTPPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session?.user) {
      const user = session.user as any;
      
      // Check if user actually needs OTP verification for Google OAuth
      if (!user.requiresOTP || user.otpPurpose !== 'gmail-oauth') {
        // User doesn't need OTP verification, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      // User needs OTP verification, initialize the flow
      if (!isInitialized) {
        initializeOTPFlow();
      }
    }
  }, [session, status, isInitialized]);

  const initializeOTPFlow = async () => {
    if (!session?.user?.email) return;

    try {
      // Automatically send OTP for Google OAuth verification
      const response = await fetch('/api/auth/google-oauth-initiate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ OTP sent successfully for Google OAuth verification');
        setIsInitialized(true);
      } else {
        console.error('❌ Failed to send OTP:', data.message);
        // Redirect back to login on failure
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('❌ Error initializing OTP flow:', error);
      router.push('/auth/login');
    }
  };

  const handleOTPVerificationSuccess = async (data: any) => {
    console.log('✅ OTP verification successful:', data);
    
    if (data.sessionRefresh) {
      // Complete the Google OAuth authentication
      try {
        const response = await fetch('/api/auth/complete-google-oauth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: session?.user?.email
          }),
        });

        const completeData = await response.json();

        if (completeData.success) {
          console.log('✅ Google OAuth authentication completed successfully');
          // Refresh the page to update the NextAuth session
          window.location.href = '/dashboard';
        } else {
          console.error('❌ Failed to complete Google OAuth:', completeData.message);
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('❌ Error completing Google OAuth:', error);
        router.push('/auth/login');
      }
    } else {
      // Fallback redirect
      if (data.user?.role) {
        router.push('/dashboard');
      } else {
        router.push('/auth/role-selection');
      }
    }
  };

  const handleBack = () => {
    router.push('/auth/login');
  };

  if (status === 'loading' || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {status === 'loading' ? 'Loading...' : 'Sending verification code...'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  const user = session.user as any;
  if (!user.requiresOTP || user.otpPurpose !== 'gmail-oauth') {
    return null; // Will redirect
  }

  return (
    <OTPVerification
      email={user.email}
      purpose="gmail-oauth"
      userName={user.name}
      onVerificationSuccess={handleOTPVerificationSuccess}
      onBack={handleBack}
    />
  );
}
