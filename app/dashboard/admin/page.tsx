"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuthGuard from "@/components/auth/AuthGuard";
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
  ArrowDown,
  Mail,
  Ticket,
  ArrowRight,
  LucideIcon,
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
  recentSignups: Array<Record<string, unknown>>;
  jobTypeDistribution: Array<{
    jobType?: string;
    _count?: { jobType?: number };
  }>;
  userRoleDistribution: Array<{
    role?: string;
    _count?: { role?: number };
  }>;
  applicationStatusDistribution: Array<{
    status?: string;
    _count?: { status?: number };
  }>;
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
    users: Array<{
      id: string | number;
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: string;
    }>;
    jobs: Array<{
      id: string | number;
      title?: string;
      company?: string;
      location?: string;
      createdAt?: string | Date;
    }>;
    applications: Array<{
      id: string | number;
      status?: string;
      user?: {
        firstName?: string;
        lastName?: string;
      };
      applicantName?: string;
      job?: {
        title?: string;
        company?: string;
      };
      jobTitle?: string;
      company?: string;
      resume?: {
        id: string | number;
      };
    }>;
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

const adminSurfaceCard =
  'rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200';

type QuickActionItem = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  metric?: string;
  iconTone: string;
};

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  metric,
  iconTone,
}: QuickActionItem) {
  return (
    <Link href={href} className="group block h-full">
      <div
        className={`${adminSurfaceCard} flex h-full flex-col p-5 hover:-translate-y-1 hover:shadow-lg`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className={`rounded-lg p-2.5 ${iconTone}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-indigo-600"
            aria-hidden
          />
        </div>
        <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm leading-snug text-gray-500">{description}</p>
        {metric ? (
          <p className="mt-3 text-2xl font-bold tabular-nums text-gray-900">{metric}</p>
        ) : null}
        <span className="mt-auto pt-4 text-sm font-medium text-indigo-600">Open →</span>
      </div>
    </Link>
  );
}

type StatOverviewItem = {
  href: string;
  icon: LucideIcon;
  title: string;
  value: number;
  subtitle: string;
  iconTone: string;
};

function StatOverviewCard({ href, icon: Icon, title, value, subtitle, iconTone }: StatOverviewItem) {
  return (
    <Link href={href} className="group block h-full">
      <div className={`${adminSurfaceCard} h-full p-5 hover:-translate-y-1 hover:shadow-lg`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">{value.toLocaleString()}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${iconTone}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">{subtitle}</p>
        <span className="mt-3 inline-flex text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
          Open →
        </span>
      </div>
    </Link>
  );
}

function AdminDashboardContent() {
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
          headers: { 'Cache-Control': 'no-cache' },
          credentials: 'include'
        }),
        fetch('/api/admin/activity', {
          credentials: 'include'
        })
      ]);

      // CRITICAL FIX: Handle authentication/authorization errors
      if (statsRes.status === 401 || statsRes.status === 403) {
        const errorData = await statsRes.json().catch(() => ({}));
        setError(errorData.error || 'Access denied. Admin privileges required.');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname);
        }
        return;
      }

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
              _count: { jobType: Number(count) || 0 }
            })),
            userRoleDistribution: Object.entries(apiData.distributions?.userRoles || {}).map(([role, count]) => ({
              role,
              _count: { role: Number(count) || 0 }
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
        // CRITICAL FIX: Better error handling for API failures
        const errorData = await statsRes.json().catch(() => ({ error: 'Unknown error' }));
        if (statsRes.status === 401 || statsRes.status === 403) {
          throw new Error(errorData.error || 'Access denied. Admin privileges required.');
        } else {
          throw new Error(errorData.error || `Failed to connect to statistics service (${statsRes.status})`);
        }
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

  const quickActions = useMemo<QuickActionItem[]>(() => {
    if (!stats) return [];
    return [
      {
        href: '/dashboard/admin/users',
        icon: Users,
        title: 'Manage Users',
        description: 'Manage employers and job seekers',
        metric: `${stats.totalUsers.toLocaleString()} users`,
        iconTone: 'bg-blue-50 text-blue-600',
      },
      {
        href: '/dashboard/admin/jobs',
        icon: Briefcase,
        title: 'Manage Jobs',
        description: 'Review and moderate job listings',
        metric: `${stats.totalJobs.toLocaleString()} jobs`,
        iconTone: 'bg-emerald-50 text-emerald-600',
      },
      {
        href: '/dashboard/admin/companies',
        icon: Building2,
        title: 'Manage Companies',
        description: 'Verify employers and company profiles',
        metric: `${stats.totalCompanies.toLocaleString()} companies`,
        iconTone: 'bg-violet-50 text-violet-600',
      },
      {
        href: '/dashboard/admin/resume-builder',
        icon: FileText,
        title: 'Resume Builder',
        description: 'Credits, plans, and builder access',
        metric: `${stats.activeUsers.toLocaleString()} active`,
        iconTone: 'bg-amber-50 text-amber-600',
      },
      {
        href: '/dashboard/admin/coupons',
        icon: Ticket,
        title: 'Coupons',
        description: 'Create and manage discount codes',
        iconTone: 'bg-indigo-50 text-indigo-600',
      },
      {
        href: '/admin/applications',
        icon: FileText,
        title: 'Applications',
        description: 'Track candidate applications',
        metric: `${stats.totalApplications.toLocaleString()} applications`,
        iconTone: 'bg-orange-50 text-orange-600',
      },
      {
        href: '/admin/contact-messages',
        icon: Mail,
        title: 'Contact Messages',
        description: 'Customer inquiries and support',
        metric: 'Inbox',
        iconTone: 'bg-pink-50 text-pink-600',
      },
      {
        href: '/admin/resumes',
        icon: FileText,
        title: 'Resumes',
        description: 'Browse uploaded resumes',
        iconTone: 'bg-teal-50 text-teal-600',
      },
      {
        href: '/admin/seed-jobs',
        icon: Database,
        title: 'Seed Jobs',
        description: 'Populate sample job listings',
        iconTone: 'bg-slate-50 text-slate-600',
      },
      {
        href: '/admin/scrape-jobs',
        icon: Database,
        title: 'Scrape Jobs',
        description: 'Import jobs from external sources',
        iconTone: 'bg-yellow-50 text-yellow-700',
      },
      {
        href: '/dashboard/admin/analytics',
        icon: BarChart3,
        title: 'Analytics',
        description: 'Platform performance and trends',
        metric: `${stats.newUsersToday.toLocaleString()} new this week`,
        iconTone: 'bg-indigo-50 text-indigo-600',
      },
    ];
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
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <Card className={`${adminSurfaceCard} lg:col-span-2`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Activity className="h-5 w-5 text-indigo-600" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="mb-2 text-sm text-gray-500">Current system status</p>
                  {getSystemHealthBadge(stats.systemHealth)}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold tabular-nums text-gray-900">{stats.activeJobs}</p>
                  <p className="text-sm text-gray-500">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={adminSurfaceCard}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
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

        {/* Overview Stats */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Platform Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <StatOverviewCard
              href="/dashboard/admin/users"
              icon={Users}
              title="Total Users"
              value={stats.totalUsers}
              subtitle={`${stats.activeUsers.toLocaleString()} active users`}
              iconTone="bg-blue-50 text-blue-600"
            />
            <StatOverviewCard
              href="/dashboard/admin/jobs"
              icon={Briefcase}
              title="Total Jobs"
              value={stats.totalJobs}
              subtitle={`${stats.activeJobs.toLocaleString()} active • ${(stats.totalJobs - stats.activeJobs).toLocaleString()} inactive`}
              iconTone="bg-emerald-50 text-emerald-600"
            />
            <StatOverviewCard
              href="/dashboard/admin/companies"
              icon={Building2}
              title="Companies"
              value={stats.totalCompanies}
              subtitle={`${stats.verifiedCompanies.toLocaleString()} verified • ${stats.pendingVerifications.toLocaleString()} pending`}
              iconTone="bg-violet-50 text-violet-600"
            />
            <StatOverviewCard
              href="/admin/applications"
              icon={FileText}
              title="Applications"
              value={stats.totalApplications}
              subtitle={`${(stats.pendingApplications || 0).toLocaleString()} pending • ${(stats.totalApplications - (stats.pendingApplications || 0)).toLocaleString()} reviewed`}
              iconTone="bg-orange-50 text-orange-600"
            />
          </div>
        </div>

        {/* Charts Section */}
        {(growthTrendData.length > 0 || jobTypeChartData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {growthTrendData.length > 0 && (
              <Card className={adminSurfaceCard}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    7-Day Growth Trend
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">Weekly activity overview</CardDescription>
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
              <Card className={adminSurfaceCard}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    Job Types Distribution
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">Breakdown by job type</CardDescription>
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
              <Card className={adminSurfaceCard}>
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <Users className="h-5 w-5 text-indigo-600" />
                        Recent Users
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500">Latest registered users</CardDescription>
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
                    {stats.recent.users.slice(0, 5).map((user) => (
                      <div key={String(user.id)} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email || ''}</p>
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
              <Card className={adminSurfaceCard}>
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <Briefcase className="h-5 w-5 text-indigo-600" />
                        Recent Jobs
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500">Latest job postings</CardDescription>
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
                    {stats.recent.jobs.slice(0, 5).map((job) => (
                      <div key={String(job.id)} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.title || 'Untitled Job'}</p>
                          <p className="text-xs text-gray-500 truncate">{job.company || ''} • {job.location || ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {job.createdAt ? new Date(job.createdAt as string | Date).toLocaleDateString() : 'Recent'}
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
          <Card className={adminSurfaceCard}>
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500">Latest job applications from jobseekers</CardDescription>
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
                {stats.recent.applications.slice(0, 5).map((application) => (
                  <div key={String(application.id)} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
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
                        {application.job?.title || application.jobTitle || ''} • {application.job?.company || application.company || ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {application.resume?.id && (
                        <Link href={`/api/admin/resumes/${String(application.resume.id)}/download`} target="_blank">
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
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-gray-500">Manage different aspects of your platform</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <QuickActionCard key={action.href + action.title} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className={adminSurfaceCard}>
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Activity className="h-5 w-5 text-indigo-600" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">Latest platform activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {(activities || []).slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      {activity.type === 'user_signup' && <UserPlus className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'job_posted' && <Briefcase className="h-5 w-5 text-emerald-600" />}
                      {activity.type === 'company_registered' && <Building2 className="h-5 w-5 text-violet-600" />}
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
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <Card className={adminSurfaceCard}>
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <div className="rounded-lg bg-blue-50 p-2">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                User Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {stats.userRoleDistribution?.map((item) => {
                  const role = (item.role || 'unknown') as string;
                  const count = (item._count?.role || 0) as number;
                  return (
                    <div
                      key={String(role)}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      <span className="text-sm font-medium capitalize text-gray-800">{String(role)}</span>
                      <Badge variant="secondary" className="font-semibold tabular-nums">
                        {Number(count)}
                      </Badge>
                    </div>
                  );
                }) || []}
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

          <Card className={adminSurfaceCard}>
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                </div>
                Job Types
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {stats.jobTypeDistribution?.map((item) => {
                  const jobType = (item.jobType || 'unknown') as string;
                  const count = (item._count?.jobType || 0) as number;
                  return (
                    <div
                      key={String(jobType)}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      <span className="text-sm font-medium capitalize text-gray-800">{String(jobType)}</span>
                      <Badge variant="secondary" className="font-semibold tabular-nums">
                        {Number(count)}
                      </Badge>
                    </div>
                  );
                }) || []}
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

          <Card className={adminSurfaceCard}>
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <div className="rounded-lg bg-orange-50 p-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                Application Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {stats.applicationStatusDistribution?.map((item) => {
                  const status = (item.status || 'unknown') as string;
                  const count = (item._count?.status || 0) as number;
                  return (
                    <div
                      key={String(status)}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                    >
                      <span className="text-sm font-medium capitalize text-gray-800">{String(status)}</span>
                      <Badge variant="secondary" className="font-semibold tabular-nums">
                        {Number(count)}
                      </Badge>
                    </div>
                  );
                }) || []}
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

export default function AdminDashboard() {
  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/auth/signin">
      <AdminDashboardContent />
    </AuthGuard>
  );
}
