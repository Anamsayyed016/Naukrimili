/**
 * Analytics Dashboard Page
 * Unified analytics dashboard for all user roles
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import JobSeekerDashboard from '@/components/dashboards/JobSeekerDashboard';
import EmployerDashboard from '@/components/dashboards/EmployerDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (!session.user?.role) {
      router.push('/auth/role-selection');
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const renderDashboard = () => {
    switch (session.user.role) {
      case 'jobseeker':
        return <JobSeekerDashboard />;
      case 'employer':
        return <EmployerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this dashboard.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </div>
    </div>
  );
}
