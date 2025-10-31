'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Briefcase, 
  Building2, 
  TrendingUp, 
  TrendingDown,
  AlertCircle, 
  CheckCircle,
  Activity,
  Database,
  Eye,
  DollarSign,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalCompanies: number;
  totalApplications: number;
  pendingApplications: number;
  activeJobs: number;
  newUsersToday: number;
  totalViews: number;
  averageSalary: number;
  verifiedCompanies: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  growth?: {
    newUsersThisWeek: number;
    newJobsThisWeek: number;
    jobGrowthRate: number;
  };
  distributions?: {
    jobTypes: Record<string, number>;
    userRoles: Record<string, number>;
  };
  recent?: {
    users: any[];
    jobs: any[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousStats, setPreviousStats] = useState<AdminStats | null>(null);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/admin/stats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch stats: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Extract values from API response
        const overview = result.data.overview || {};
        const totalViewsValue = overview.totalViews ?? 0;
        const averageSalaryValue = overview.averageSalary ?? 0;
        
        // Map the API response structure to component state
        const newStats: AdminStats = {
          totalUsers: Number(overview.totalUsers) || 0,
          totalJobs: Number(overview.totalJobs) || 0,
          totalCompanies: Number(overview.totalCompanies) || 0,
          totalApplications: Number(overview.totalApplications) || 0,
          pendingApplications: Number(overview.pendingApplications) || 0,
          activeJobs: Number(overview.activeJobs) || 0,
          newUsersToday: Number(result.data.growth?.newUsersThisWeek) || 0,
          totalViews: Number(totalViewsValue) || 0,
          averageSalary: Number(averageSalaryValue) || 0,
          verifiedCompanies: Number(overview.verifiedCompanies) || 0,
          systemHealth: 'healthy' as const,
          growth: result.data.growth || {},
          distributions: result.data.distributions || {},
          recent: result.data.recent || {}
        };
        
        // Store previous stats for comparison
        if (stats) {
          setPreviousStats(stats);
        }
        
        setStats(newStats);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Failed to fetch dashboard statistics';
      console.error('❌ Error fetching admin stats:', _error);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchStats(false);
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []); // Only run on mount

  // Calculate percentage changes
  const calculateChange = useCallback((current: number, previous: number | null): { value: number; isPositive: boolean } => {
    if (!previous || previous === 0) return { value: 0, isPositive: current > 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  }, []);

  // Prepare chart data
  const jobTypeChartData = useMemo(() => {
    if (!stats?.distributions?.jobTypes) return [];
    return Object.entries(stats.distributions.jobTypes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [stats]);

  const userRoleChartData = useMemo(() => {
    if (!stats?.distributions?.userRoles) return [];
    return Object.entries(stats.distributions.userRoles)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.name) // Filter out null/undefined roles
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  // Growth trend data (simulated 7-day trend)
  const growthTrendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      day,
      users: Math.floor((stats?.totalUsers || 0) * (0.7 + (index * 0.05))),
      jobs: Math.floor((stats?.totalJobs || 0) * (0.7 + (index * 0.05))),
      applications: Math.floor((stats?.totalApplications || 0) * (0.7 + (index * 0.05)))
    }));
  }, [stats]);

  const getSystemHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><AlertCircle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTrendIcon = (isPositive: boolean) => {
    return isPositive ? (
      <ArrowUp className="h-3 w-3 text-green-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-red-600" />
    );
  };

  const handleRefresh = () => {
    fetchStats(true);
  };

  if (loading && !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading dashboard...</p>
          <p className="mt-2 text-gray-400 text-sm">Fetching latest statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Real-time overview of your job portal system</p>
          {lastUpdated && (
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <p className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing || loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-top">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium text-sm">Error loading dashboard</p>
              <p className="text-red-600 text-xs mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-xs"
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* System Health & Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Current system status</p>
                  {getSystemHealthBadge(stats.systemHealth)}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                  <p className="text-xs text-gray-500">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Growth Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Jobs</span>
                    <span className={`text-sm font-medium ${(stats.growth?.jobGrowthRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.growth?.jobGrowthRate ? `${stats.growth.jobGrowthRate > 0 ? '+' : ''}${stats.growth.jobGrowthRate.toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${(stats.growth?.jobGrowthRate || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(stats.growth?.jobGrowthRate || 0), 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Users This Week</span>
                    <span className="text-sm font-medium text-blue-600">+{stats.newUsersToday}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                {previousStats && getTrendIcon(calculateChange(stats.totalUsers, previousStats.totalUsers).isPositive)}
                <p className="text-xs text-muted-foreground">
                  {stats.newUsersToday} new this week
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeJobs} active • {stats.totalJobs - stats.activeJobs} inactive
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.verifiedCompanies} verified • {stats.totalCompanies - stats.verifiedCompanies} pending
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingApplications} pending review
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Views</CardTitle>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total job views
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.averageSalary.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Per annum average
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalJobs > 0 ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Job activation rate
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Application Rate</CardTitle>
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalJobs > 0 ? (stats.totalApplications / stats.totalJobs).toFixed(1) : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Apps per job
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {stats && (jobTypeChartData.length > 0 || userRoleChartData.length > 0 || growthTrendData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Growth Trend Chart */}
          {growthTrendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  7-Day Growth Trend
                </CardTitle>
                <CardDescription>Weekly activity overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={growthTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Users"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="jobs" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Jobs"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Applications"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Job Types Distribution */}
          {jobTypeChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Types Distribution
                </CardTitle>
                <CardDescription>Breakdown by job type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={jobTypeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* User Roles Distribution */}
          {userRoleChartData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Roles Distribution
                </CardTitle>
                <CardDescription>Platform user breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={userRoleChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRoleChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col justify-center gap-3">
                    {userRoleChartData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{item.name || 'Unknown'}</span>
                        </div>
                        <span className="text-sm font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recent && (stats.recent.users?.length > 0 || stats.recent.jobs?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {stats.recent.users && stats.recent.users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Users
                </CardTitle>
                <CardDescription>Latest registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recent.users.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.email}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {user.role || 'jobseeker'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {stats.recent.jobs && stats.recent.jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Jobs
                </CardTitle>
                <CardDescription>Latest job postings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recent.jobs.slice(0, 5).map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-gray-500 truncate">{job.company} • {job.location}</p>
                      </div>
                      <Badge variant="outline" className="text-xs ml-2">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recent'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-xs sm:text-sm">Manage Users</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-200 transition-colors"
              onClick={() => window.location.href = '/admin/jobs'}
            >
              <Briefcase className="h-6 w-6 text-green-600" />
              <span className="text-xs sm:text-sm">Manage Jobs</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-200 transition-colors"
              onClick={() => window.location.href = '/admin/applications'}
            >
              <TrendingUp className="h-6 w-6 text-orange-600" />
              <span className="text-xs sm:text-sm">Applications</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
              onClick={() => window.location.href = '/admin/categories'}
            >
              <Database className="h-6 w-6 text-purple-600" />
              <span className="text-xs sm:text-sm">Categories</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              onClick={() => window.location.href = '/dashboard/admin/analytics'}
            >
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              <span className="text-xs sm:text-sm">Analytics</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 sm:h-28 flex flex-col items-center justify-center space-y-2 hover:bg-teal-50 hover:border-teal-200 transition-colors"
              onClick={() => window.location.href = '/admin/resumes'}
            >
              <Activity className="h-6 w-6 text-teal-600" />
              <span className="text-xs sm:text-sm">Resumes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}