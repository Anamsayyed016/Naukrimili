/**
 * Job Seeker Dashboard Component
 * Real-time dashboard for job seekers with analytics and recommendations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { 
  Briefcase, 
  Bookmark, 
  Search, 
  User, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Star,
  Eye,
  Send
} from 'lucide-react';

interface JobSeekerMetrics {
  profileCompletion: number;
  applicationsCount: number;
  bookmarksCount: number;
  searchCount: number;
  recommendedJobs: number;
  recentApplications: Array<{
    id: string;
    jobTitle: string;
    company: string;
    status: string;
    appliedAt: string;
  }>;
  savedJobs: Array<{
    id: string;
    jobTitle: string;
    company: string;
    bookmarkedAt: string;
  }>;
}

interface RealTimeMetrics {
  timestamp: string;
  activeUsers: number;
  jobViews: number;
  applications: number;
  searches: number;
}

interface JobSeekerDashboardProps {
  initialMetrics?: JobSeekerMetrics;
}

export default function JobSeekerDashboard({ initialMetrics }: JobSeekerDashboardProps) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const [metrics, setMetrics] = useState<JobSeekerMetrics | null>(initialMetrics || null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(!initialMetrics);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/dashboard?realtime=true');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data.metrics.jobseeker);
        setRealTimeMetrics(data.data.realTime);
      } else {
        setError(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleDashboardUpdate = (data: any) => {
      if (data.type === 'metrics' && data.data.jobseeker) {
        setMetrics(data.data.jobseeker);
      }
      if (data.type === 'metrics' && data.data.timestamp) {
        setRealTimeMetrics(data.data);
      }
    };

    const handleDashboardMetrics = (data: { data?: Record<string, unknown> }) => {
      setRealTimeMetrics(data.data);
    };

    socket.on('dashboard_update', handleDashboardUpdate);
    socket.on('dashboard_metrics', handleDashboardMetrics);

    return () => {
      socket.off('dashboard_update', handleDashboardUpdate);
      socket.off('dashboard_metrics', handleDashboardMetrics);
    };
  }, [socket, isConnected]);

  // Initial data fetch
  useEffect(() => {
    if (!initialMetrics) {
      fetchMetrics();
    }
  }, [initialMetrics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {(session?.user as any)?.firstName || session?.user?.name || 'Job Seeker'}!</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Profile Completion */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profile Completion</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.profileCompletion}%</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.profileCompletion}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Applications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.applicationsCount}</p>
            </div>
          </div>
        </div>

        {/* Bookmarks */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Bookmark className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.bookmarksCount}</p>
            </div>
          </div>
        </div>

        {/* Searches */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Search className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Searches</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.searchCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity */}
      {realTimeMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Activity</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{realTimeMetrics.activeUsers}</p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{realTimeMetrics.jobViews}</p>
              <p className="text-sm text-gray-600">Job Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{realTimeMetrics.applications}</p>
              <p className="text-sm text-gray-600">Applications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{realTimeMetrics.searches}</p>
              <p className="text-sm text-gray-600">Searches</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {metrics.recentApplications.length > 0 ? (
            metrics.recentApplications.map((application) => (
              <div key={application.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{application.jobTitle}</h4>
                  <p className="text-sm text-gray-600">{application.company}</p>
                  <p className="text-xs text-gray-500">
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                    application.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                    application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {application.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No applications yet</p>
              <p className="text-sm">Start applying to jobs to see them here</p>
            </div>
          )}
        </div>
      </div>

      {/* Saved Jobs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Saved Jobs</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {metrics.savedJobs.length > 0 ? (
            metrics.savedJobs.map((job) => (
              <div key={job.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{job.jobTitle}</h4>
                  <p className="text-sm text-gray-600">{job.company}</p>
                  <p className="text-xs text-gray-500">
                    Saved {new Date(job.bookmarkedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Apply
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Bookmark className="h-4 w-4 fill-current" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No saved jobs yet</p>
              <p className="text-sm">Bookmark jobs to save them for later</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
