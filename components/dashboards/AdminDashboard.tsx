/**
 * Admin Dashboard Component
 * Real-time dashboard for administrators with system health and analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { 
  Users, 
  Briefcase, 
  BarChart3, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
  Database,
  Globe,
  Shield
} from 'lucide-react';

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  topSectors: Array<{
    sector: string;
    count: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface RealTimeMetrics {
  timestamp: string;
  activeUsers: number;
  jobViews: number;
  applications: number;
  searches: number;
  events: Array<{
    type: string;
    count: number;
  }>;
}

interface SystemHealth {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
  eventStats: Record<string, unknown>;
}

interface AdminDashboardProps {
  initialMetrics?: AdminMetrics;
}

export default function AdminDashboard({ initialMetrics }: AdminDashboardProps) {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(initialMetrics || null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(!initialMetrics);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/dashboard?realtime=true');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data.metrics.admin);
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

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_system_health' })
      });
      const data = await response.json();
      
      if (data.success) {
        setSystemHealth(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    }
  };

  // Set up real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleDashboardUpdate = (data: Record<string, unknown>) => {
      const dataObj = data.data as Record<string, unknown> | undefined;
      if (data.type === 'metrics' && dataObj?.admin) {
        setMetrics(dataObj.admin as Record<string, unknown>);
      }
      if (data.type === 'metrics' && dataObj?.timestamp) {
        setRealTimeMetrics(dataObj as RealTimeMetrics);
      }
    };

    const handleDashboardMetrics = (data: Record<string, unknown>) => {
      const metricsData = data.data as RealTimeMetrics;
      setRealTimeMetrics(metricsData);
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
    fetchSystemHealth();
  }, [initialMetrics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetrics();
      fetchSystemHealth();
    }, 30000);
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
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemoryUsage = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and analytics</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="p-2 bg-green-100 rounded-lg w-fit mx-auto mb-2">
                <Server className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatUptime(systemHealth.uptime)}</p>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            <div className="text-center">
              <div className="p-2 bg-blue-100 rounded-lg w-fit mx-auto mb-2">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatMemoryUsage(systemHealth.memoryUsage.heapUsed)}</p>
              <p className="text-sm text-gray-600">Memory Used</p>
            </div>
            <div className="text-center">
              <div className="p-2 bg-purple-100 rounded-lg w-fit mx-auto mb-2">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{systemHealth.activeConnections}</p>
              <p className="text-sm text-gray-600">Active Connections</p>
            </div>
            <div className="text-center">
              <div className="p-2 bg-orange-100 rounded-lg w-fit mx-auto mb-2">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{systemHealth.eventStats.totalEvents || 0}</p>
              <p className="text-sm text-gray-600">Events (1h)</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
            </div>
          </div>
        </div>

        {/* Total Jobs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalJobs}</p>
            </div>
          </div>
        </div>

        {/* Total Applications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalApplications}</p>
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

      {/* Top Sectors */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Sectors</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {metrics.topSectors.length > 0 ? (
            metrics.topSectors.map((sector, index) => (
              <div key={sector.sector} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 mr-4">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{sector.sector}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">{sector.count} jobs</span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No sector data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {metrics.recentActivity.length > 0 ? (
            metrics.recentActivity.map((activity, index) => (
              <div key={index} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activity.type.includes('application') ? 'bg-green-100 text-green-800' :
                    activity.type.includes('view') ? 'bg-blue-100 text-blue-800' :
                    activity.type.includes('search') ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
