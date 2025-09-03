/**
 * OTP Verification Page
 * Standalone page for OTP verification after registration
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OTPVerification from '@/components/auth/OTPVerification';

export default function OTPVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState<'login' | 'registration' | 'verification'>('registration');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const purposeParam = searchParams.get('purpose') as 'login' | 'registration' | 'verification';
    
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Redirect to create account if no email provided
      router.push('/auth/role-selection');
      return;
    }
    
    if (purposeParam) {
      setPurpose(purposeParam);
    }
  }, [searchParams, router]);

  const handleVerificationSuccess = (data: any) => {
    console.log('OTP verification successful:', data);
    
    if (purpose === 'registration') {
      // Get registration data from session storage
      const registrationData = sessionStorage.getItem('registrationData');
      if (registrationData) {
        const formData = JSON.parse(registrationData);
        
        // Complete the registration process
        completeRegistration(formData, data);
      } else {
        // Fallback: redirect to role selection
        router.push('/auth/role-selection');
      }
    } else if (purpose === 'login') {
      // Handle login success
      if (data.user?.role) {
        // User has role, redirect to appropriate dashboard
        if (data.user.role === 'jobseeker') {
          router.push('/dashboard/jobseeker');
        } else if (data.user.role === 'employer') {
          router.push('/dashboard/company');
        }
      } else {
        // No role set, redirect to role selection
        router.push('/auth/role-selection');
      }
    }
  };

  const completeRegistration = async (formData: any, otpData: any) => {
    try {
      const endpoint = formData.role === 'candidate' 
        ? '/api/auth/register/jobseeker' 
        : '/api/auth/register/employer';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.name.split(' ')[0] || '',
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          password: formData.password,
          role: formData.role === 'candidate' ? 'jobseeker' : 'employer',
          authMethod: 'email'
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear registration data from session storage
        sessionStorage.removeItem('registrationData');
        
        // Redirect to role selection for final setup
        router.push('/auth/role-selection');
      } else {
        console.error('Registration completion failed:', data.message);
        // Redirect back to create account on error
        router.push('/auth/role-selection');
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      // Redirect back to create account on error
      router.push('/auth/role-selection');
    }
  };

  const handleBack = () => {
    router.push('/auth/role-selection');
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <OTPVerification
          email={email}
          purpose={purpose}
          onVerificationSuccess={handleVerificationSuccess}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
