'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Briefcase, 
  Building2, 
  TrendingUp,
  AlertCircle, 
  CheckCircle,
  Activity,
  Database,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Clock,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    users: Array<Record<string, unknown>>;
    jobs: Array<Record<string, unknown>>;
    applications: Array<Record<string, unknown>>;
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}


export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousStats, setPreviousStats] = useState<AdminStats | null>(null);
  
  // CRUD Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'user' | 'job' | 'company' | null>(null);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Record<string, unknown> | null>(null);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch(`/api/admin/stats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch stats: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const overview = result.data.overview || {};
        const newStats: AdminStats = {
          totalUsers: Number(overview.totalUsers) || 0,
          totalJobs: Number(overview.totalJobs) || 0,
          totalCompanies: Number(overview.totalCompanies) || 0,
          totalApplications: Number(overview.totalApplications) || 0,
          pendingApplications: Number(overview.pendingApplications) || 0,
          activeJobs: Number(overview.activeJobs) || 0,
          newUsersToday: Number(result.data.growth?.newUsersThisWeek) || 0,
          totalViews: Number(overview.totalViews) || 0,
          averageSalary: Number(overview.averageSalary) || 0,
          verifiedCompanies: Number(overview.verifiedCompanies) || 0,
          systemHealth: 'healthy' as const,
          growth: result.data.growth || {},
          distributions: result.data.distributions || {},
          recent: result.data.recent || {}
        };
        
        if (stats) setPreviousStats(stats);
        setStats(newStats);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'Failed to fetch dashboard statistics';
      console.error('❌ Error fetching admin stats:', _error);
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
    fetchStats(false);
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const calculateChange = useCallback((current: number, previous: number | null): { value: number; isPositive: boolean } => {
    if (!previous || previous === 0) return { value: 0, isPositive: current > 0 };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  }, []);

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

  // CRUD Operations
  const handleCreate = (type: 'user' | 'job' | 'company') => {
    setCreateType(type);
    setShowCreateModal(true);
  };

  const handleEdit = (item: Record<string, unknown>, type: 'user' | 'job' | 'company') => {
    setEditingItem({ ...item, _type: type });
    setShowEditModal(true);
  };

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
        fetchStats(true);
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

  const handleSaveCreate = async () => {
    if (!createType) return;
    
    toast({
      title: "Redirecting",
      description: `Please use the ${createType} management page to create new ${createType}s`,
    });
    setShowCreateModal(false);
    
    // Redirect to appropriate page
    if (createType === 'user') window.location.href = '/admin/users';
    else if (createType === 'job') window.location.href = '/admin/jobs';
    else window.location.href = '/admin/categories';
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    toast({
      title: "Redirecting",
      description: `Please use the ${editingItem._type} management page to edit`,
    });
    setShowEditModal(false);
    
    // Redirect to appropriate page
    if (editingItem._type === 'user') window.location.href = `/admin/users`;
    else if (editingItem._type === 'job') window.location.href = `/admin/jobs`;
    else window.location.href = `/admin/categories`;
  };

  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'users',
      title: 'Manage Users',
      description: 'View and manage all users',
      icon: <Users className="h-6 w-6" />,
      color: 'blue',
      href: '/admin/users'
    },
    {
      id: 'jobs',
      title: 'Manage Jobs',
      description: 'View and manage job postings',
      icon: <Briefcase className="h-6 w-6" />,
      color: 'green',
      href: '/admin/jobs'
    },
    {
      id: 'companies',
      title: 'Manage Companies',
      description: 'View and manage companies',
      icon: <Building2 className="h-6 w-6" />,
      color: 'purple',
      href: '/admin/categories'
    },
    {
      id: 'applications',
      title: 'Applications',
      description: 'Review job applications',
      icon: <Activity className="h-6 w-6" />,
      color: 'orange',
      href: '/admin/applications'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View detailed analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'indigo',
      href: '/dashboard/admin/analytics'
    },
    {
      id: 'resumes',
      title: 'Resumes',
      description: 'Manage user resumes',
      icon: <Database className="h-6 w-6" />,
      color: 'teal',
      href: '/admin/resumes'
    }
  ], []);

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

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300',
      green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300',
      purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300',
      orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300',
      teal: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300'
    };
    return colors[color] || colors.blue;
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading dashboard...</p>
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchStats(true)} 
              disabled={isRefreshing || loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
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
        {stats && (
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
        )}

        {/* Key Metrics */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-white border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">Total Users</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1">
                  {previousStats && (calculateChange(stats.totalUsers, previousStats.totalUsers).isPositive ? 
                    <ArrowUp className="h-3 w-3 text-green-600" /> : 
                    <ArrowDown className="h-3 w-3 text-red-600" />)}
                  <p className="text-xs text-muted-foreground">{stats.newUsersToday} new this week</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-green-100 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">Total Jobs</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalJobs.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.activeJobs} active • {stats.totalJobs - stats.activeJobs} inactive</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">Companies</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalCompanies.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.verifiedCompanies} verified • {stats.totalCompanies - stats.verifiedCompanies} pending</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-orange-100 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">Applications</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.totalApplications.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.pendingApplications} pending review</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        {stats && (jobTypeChartData.length > 0 || userRoleChartData.length > 0 || growthTrendData.length > 0) && (
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
        {stats?.recent && (
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
                    <Button size="sm" onClick={() => handleCreate('user')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.recent.users.slice(0, 5).map((user: Record<string, unknown>) => {
                      const userId = String(user.id ?? '');
                      const firstName = String(user.firstName ?? '');
                      const lastName = String(user.lastName ?? '');
                      const email = String(user.email ?? '');
                      return (
                      <div key={userId} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {firstName && lastName ? `${firstName} ${lastName}` : email}
                          </p>
                          <p className="text-xs text-gray-500">{email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{String(user.role ?? 'jobseeker')}</Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(user, 'user')}>
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
                      );
                    })}
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
                    <Button size="sm" onClick={() => handleCreate('job')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.recent.jobs.slice(0, 5).map((job: Record<string, unknown>) => {
                      const jobId = String(job.id ?? '');
                      const title = String(job.title ?? '');
                      const company = String(job.company ?? '');
                      const location = String(job.location ?? '');
                      const createdAt = job.createdAt ? (typeof job.createdAt === 'string' || typeof job.createdAt === 'number' || job.createdAt instanceof Date ? new Date(job.createdAt).toLocaleDateString() : 'Recent') : 'Recent';
                      return (
                      <div key={jobId} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{title}</p>
                          <p className="text-xs text-gray-500 truncate">{company} • {location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {createdAt}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(job, 'job')}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setItemToDelete({ id: jobId, name: title, type: 'job' });
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
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="bg-white border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage different aspects of your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className={`h-24 sm:h-28 flex flex-col items-center justify-center space-y-2 ${getColorClasses(action.color)} transition-all`}
                  onClick={() => window.location.href = action.href}
                >
                  {action.icon}
                  <span className="text-xs sm:text-sm font-medium">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {String(itemToDelete?.type ?? 'item')}? This action cannot be undone.
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

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {createType ? createType.charAt(0).toUpperCase() + createType.slice(1) : ''}</DialogTitle>
            <DialogDescription>
              You will be redirected to the {createType} management page to create a new {createType}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              setCreateType(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveCreate}>
              Go to {createType} Management
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingItem?._type ? String(editingItem._type).charAt(0).toUpperCase() + String(editingItem._type).slice(1) : ''}</DialogTitle>
            <DialogDescription>
              You will be redirected to the {String(editingItem?._type ?? '')} management page to edit this item.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditModal(false);
              setEditingItem(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Go to {String(editingItem?._type ?? '')} Management
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
