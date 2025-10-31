"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Briefcase, 
  Building2, 
  FileText, 
  TrendingUp,
  UserPlus,
  Eye,
  Calendar,
  DollarSign,
  Activity,
  Database,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalCompanies: number;
  totalApplications: number;
  activeUsers: number;
  pendingVerifications: number;
  pendingApplications: number;
  recentSignups: any[];
  jobTypeDistribution: any[];
  userRoleDistribution: any[];
  applicationStatusDistribution: any[];
  totalViews: number;
  averageSalary: number;
  activeJobs: number;
  newUsersToday: number;
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
    applications: any[];
  };
}

interface AdminActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [previousStats, setPreviousStats] = useState<AdminStats | null>(null);
  
  // CRUD Modal States
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  const fetchAdminData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const [statsRes, activitiesRes] = await Promise.all([
        fetch(`/api/admin/stats?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        }),
        fetch('/api/admin/activity')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          const apiData = statsData.data;
          const overview = apiData.overview || {};
          
          const transformedStats: AdminStats = {
            totalUsers: Number(overview.totalUsers) || 0,
            totalJobs: Number(overview.totalJobs) || 0,
            totalCompanies: Number(overview.totalCompanies) || 0,
            totalApplications: Number(overview.totalApplications) || 0,
            activeUsers: Number(overview.totalUsers) || 0,
            pendingVerifications: (Number(overview.totalCompanies) || 0) - (Number(overview.verifiedCompanies) || 0),
            pendingApplications: Number(overview.pendingApplications) || 0,
            activeJobs: Number(overview.activeJobs) || 0,
            newUsersToday: Number(apiData.growth?.newUsersThisWeek) || 0,
            totalViews: Number(overview.totalViews) || 0,
            averageSalary: Number(overview.averageSalary) || 0,
            verifiedCompanies: Number(overview.verifiedCompanies) || 0,
            systemHealth: 'healthy' as const,
            recentSignups: apiData.recent?.users || [],
            jobTypeDistribution: Object.entries(apiData.distributions?.jobTypes || {}).map(([jobType, count]) => ({
              jobType,
              _count: { jobType: count }
            })),
            userRoleDistribution: Object.entries(apiData.distributions?.userRoles || {}).map(([role, count]) => ({
              role,
              _count: { role: count }
            })),
            applicationStatusDistribution: [],
            growth: apiData.growth || {},
            distributions: apiData.distributions || {},
            recent: apiData.recent || {}
          };
          
          if (stats) setPreviousStats(stats);
          setStats(transformedStats);
          setLastUpdated(new Date());
        } else {
          throw new Error(statsData.error || 'Failed to load statistics');
        }
      } else {
        throw new Error('Failed to connect to statistics service');
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        if (activitiesData.success) {
          setActivities(activitiesData.data.activities || []);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading admin data';
      console.error('Admin data fetch error:', err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [stats]);

  useEffect(() => {
    fetchAdminData(false);
    const interval = setInterval(() => fetchAdminData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateChange = useCallback((current: number, previous: number | null): { value: number; isPositive: boolean } => {
    if (!previous || previous === 0) return { value: 0, isPositive: current > 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  }, []);

  const jobTypeChartData = useMemo(() => {
    if (!stats?.distributions?.jobTypes) return [];
    return Object.entries(stats.distributions.jobTypes)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [stats]);

  const userRoleChartData = useMemo(() => {
    if (!stats?.distributions?.userRoles) return [];
    return Object.entries(stats.distributions.userRoles)
      .map(([name, value]) => ({ name, value: Number(value) }))
      .filter(item => item.name)
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const growthTrendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => ({
      day,
      users: Math.floor((stats?.totalUsers || 0) * (0.7 + (index * 0.05))),
      jobs: Math.floor((stats?.totalJobs || 0) * (0.7 + (index * 0.05))),
      applications: Math.floor((stats?.totalApplications || 0) * (0.7 + (index * 0.05)))
    }));
  }, [stats]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { id, type } = itemToDelete;
      const endpoint = type === 'user' ? `/api/users/${id}` :
                      type === 'job' ? `/api/jobs/${id}` :
                      `/api/companies/${id}`;
      
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `${type} deleted successfully`,
        });
        fetchAdminData(true);
        setShowDeleteDialog(false);
        setItemToDelete(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to delete ${itemToDelete?.type}`,
        variant: "destructive",
      });
    }
  };

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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchAdminData(true)}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your job portal platform</p>
            </div>
            <Button onClick={() => fetchAdminData(true)} variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-4">Unable to load dashboard data. This might be due to database connection issues.</p>
              <Button onClick={() => fetchAdminData(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Real-time overview and management</p>
            {lastUpdated && (
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchAdminData(true)} 
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium text-sm">Error loading dashboard</p>
                <p className="text-red-600 text-xs mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* System Health & Growth */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2 bg-white border-2 border-gray-200 shadow-lg">
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
          
          <Card className="bg-white border-2 border-gray-200 shadow-lg">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="bg-white border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">Total Users</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers}</div>
              <div className="flex items-center gap-1">
                {previousStats && (calculateChange(stats.totalUsers, previousStats.totalUsers).isPositive ? 
                  <ArrowUp className="h-3 w-3 text-green-600" /> : 
                  <ArrowDown className="h-3 w-3 text-red-600" />)}
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {stats.activeUsers} active users
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">Total Jobs</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalJobs}</div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                {stats.activeJobs} active • {stats.totalJobs - stats.activeJobs} inactive
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">Companies</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalCompanies}</div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                {stats.verifiedCompanies} verified • {stats.pendingVerifications} pending
              </p>
            </CardContent>
          </Card>

          <Link href="/admin/applications">
            <Card className="bg-white border-2 border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-orange-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800 group-hover:text-orange-700">Applications</CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stats.totalApplications}</div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {stats.pendingApplications || 0} pending • {stats.totalApplications - (stats.pendingApplications || 0)} reviewed
                </p>
                <p className="text-xs text-orange-600 mt-1 font-medium">Click to manage →</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Charts Section */}
        {(growthTrendData.length > 0 || jobTypeChartData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {growthTrendData.length > 0 && (
              <Card className="bg-white border-2 border-gray-200 shadow-lg">
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
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Users" />
                      <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={2} name="Jobs" />
                      <Line type="monotone" dataKey="applications" stroke="#f59e0b" strokeWidth={2} name="Applications" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {jobTypeChartData.length > 0 && (
              <Card className="bg-white border-2 border-gray-200 shadow-lg">
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
          </div>
        )}

        {/* Recent Activity with CRUD */}
        {stats.recent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {stats.recent.users && stats.recent.users.length > 0 && (
              <Card className="bg-white border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Recent Users
                      </CardTitle>
                      <CardDescription>Latest registered users</CardDescription>
                    </div>
                    <Link href="/dashboard/admin/users">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.recent.users.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{user.role || 'jobseeker'}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/admin/users`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setItemToDelete({ id: user.id, name: user.email, type: 'user' });
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {stats.recent.jobs && stats.recent.jobs.length > 0 && (
              <Card className="bg-white border-2 border-gray-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Recent Jobs
                      </CardTitle>
                      <CardDescription>Latest job postings</CardDescription>
                    </div>
                    <Link href="/dashboard/admin/jobs">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.recent.jobs.slice(0, 5).map((job: any) => (
                      <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.title}</p>
                          <p className="text-xs text-gray-500 truncate">{job.company} • {job.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recent'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/admin/jobs`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setItemToDelete({ id: job.id, name: job.title, type: 'job' });
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recent Applications Section */}
        {stats?.recent?.applications && stats.recent.applications.length > 0 && (
          <Card className="bg-white border-2 border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription>Latest job applications from jobseekers</CardDescription>
                </div>
                <Link href="/admin/applications">
                  <Button size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recent.applications.slice(0, 5).map((application: any) => (
                  <div key={application.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {application.user?.firstName || application.applicantName || 'Unknown User'}
                        </p>
                        <Badge variant={application.status === 'pending' ? 'secondary' : application.status === 'shortlisted' ? 'default' : application.status === 'rejected' ? 'destructive' : 'default'} className="text-xs">
                          {application.status || 'pending'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {application.job?.title || application.jobTitle} • {application.job?.company || application.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {application.resume?.id && (
                        <Link href={`/api/admin/resumes/${application.resume.id}/download`} target="_blank">
                          <Button variant="outline" size="sm" title="View Resume">
                            <FileText className="h-4 w-4 text-orange-600" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/admin/applications/${application.id}`}>
                        <Button variant="outline" size="sm" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.location.href = `/admin/applications/${application.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {application.resume?.id && (
                            <DropdownMenuItem 
                              onClick={() => window.open(`/api/admin/resumes/${application.resume.id}/download`, '_blank')}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Resume
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            <CardDescription>Manage different aspects of your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/dashboard/admin/users">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300">
                  <Users className="h-6 w-6" />
                  <span className="font-medium">Manage Users</span>
                </Button>
              </Link>
              <Link href="/dashboard/admin/jobs">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300">
                  <Briefcase className="h-6 w-6" />
                  <span className="font-medium">Manage Jobs</span>
                </Button>
              </Link>
              <Link href="/dashboard/admin/companies">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300">
                  <Building2 className="h-6 w-6" />
                  <span className="font-medium">Manage Companies</span>
                </Button>
              </Link>
              <Link href="/admin/applications">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300">
                  <FileText className="h-6 w-6" />
                  <span className="font-medium">Applications</span>
                </Button>
              </Link>
              <Link href="/admin/resumes">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300">
                  <FileText className="h-6 w-6" />
                  <span className="font-medium">Resumes</span>
                </Button>
              </Link>
              <Link href="/admin/seed-jobs">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300">
                  <Database className="h-6 w-6" />
                  <span className="font-medium">Seed Jobs</span>
                </Button>
              </Link>
              <Link href="/admin/scrape-jobs">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300">
                  <Database className="h-6 w-6" />
                  <span className="font-medium">Scrape Jobs</span>
                </Button>
              </Link>
              <Link href="/dashboard/admin/analytics">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300">
                  <TrendingUp className="h-6 w-6" />
                  <span className="font-medium">Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-xl font-bold">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {(activities || []).slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                      {activity.type === 'user_signup' && <UserPlus className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'job_posted' && <Briefcase className="h-5 w-5 text-green-600" />}
                      {activity.type === 'company_registered' && <Building2 className="h-5 w-5 text-purple-600" />}
                      {activity.type === 'application_submitted' && <FileText className="h-5 w-5 text-orange-600" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                    {activity.user && (
                      <p className="text-xs text-gray-600 font-medium">
                        by {activity.user.name} ({activity.user.email})
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {(!activities || activities.length === 0) && (
                <div className="text-center py-12">
                  <div className="bg-gray-50 rounded-xl p-8 border-2 border-dashed border-gray-200">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
                    <p className="text-gray-600">Activity will appear here as users interact with the platform</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-white border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Users className="h-5 w-5 text-blue-700" />
                </div>
                User Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {stats.userRoleDistribution?.map((item) => (
                  <div key={item.role} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                    <span className="capitalize text-sm font-semibold text-gray-800">{item.role}</span>
                    <Badge className="bg-blue-200 text-blue-800 border-blue-300 font-bold px-3 py-1">{item._count.role}</Badge>
                  </div>
                )) || []}
                {(!stats.userRoleDistribution || stats.userRoleDistribution.length === 0) && (
                  <div className="text-center py-8">
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                      <Users className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">No user data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-green-200 rounded-lg">
                  <Briefcase className="h-5 w-5 text-green-700" />
                </div>
                Job Types
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {stats.jobTypeDistribution?.map((item) => (
                  <div key={item.jobType} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                    <span className="capitalize text-sm font-semibold text-gray-800">{item.jobType || 'Not specified'}</span>
                    <Badge className="bg-green-200 text-green-800 border-green-300 font-bold px-3 py-1">{item._count.jobType}</Badge>
                  </div>
                )) || []}
                {(!stats.jobTypeDistribution || stats.jobTypeDistribution.length === 0) && (
                  <div className="text-center py-8">
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                      <Briefcase className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">No job data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-orange-200 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-700" />
                </div>
                Application Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {stats.applicationStatusDistribution?.map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors">
                    <span className="capitalize text-sm font-semibold text-gray-800">{item.status}</span>
                    <Badge className="bg-orange-200 text-orange-800 border-orange-300 font-bold px-3 py-1">{item._count.status}</Badge>
                  </div>
                )) || []}
                {(!stats.applicationStatusDistribution || stats.applicationStatusDistribution.length === 0) && (
                  <div className="text-center py-8">
                    <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                      <FileText className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">No application data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteDialog(false);
              setItemToDelete(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
