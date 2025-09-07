'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import OnboardingFlow from '@/components/auth/OnboardingFlow';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // If user already has role, redirect to dashboard
    if (session.user?.role) {
      if (session.user.role === 'jobseeker') {
        router.push('/dashboard/jobseeker');
      } else if (session.user.role === 'employer') {
        router.push('/dashboard/company');
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

  if (!session) {
    return null;
  }

  return <OnboardingFlow user={session.user} />;
}