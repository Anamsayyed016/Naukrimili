"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Database
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalCompanies: number;
  totalApplications: number;
  activeUsers: number;
  pendingVerifications: number;
  recentSignups: any[];
  jobTypeDistribution: any[];
  userRoleDistribution: any[];
  applicationStatusDistribution: any[];
  totalViews: number;
  averageSalary: number;
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsRes, activitiesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          const apiData = statsData.data;
          // Transform API response to match AdminStats interface
          const transformedStats: AdminStats = {
            totalUsers: apiData.overview?.totalUsers || 0,
            totalJobs: apiData.overview?.totalJobs || 0,
            totalCompanies: apiData.overview?.totalCompanies || 0,
            totalApplications: apiData.overview?.totalApplications || 0,
            activeUsers: apiData.overview?.totalUsers || 0, // Using total users as active users
            pendingVerifications: (apiData.overview?.totalCompanies || 0) - (apiData.overview?.verifiedCompanies || 0),
            recentSignups: apiData.recent?.users || [],
            jobTypeDistribution: Object.entries(apiData.distributions?.jobTypes || {}).map(([jobType, count]) => ({
              jobType,
              _count: { jobType: count }
            })),
            userRoleDistribution: Object.entries(apiData.distributions?.userRoles || {}).map(([role, count]) => ({
              role,
              _count: { role: count }
            })),
            applicationStatusDistribution: [], // Not provided by API
            totalViews: 0, // Not provided by API
            averageSalary: 0 // Not provided by API
          };
          setStats(transformedStats);
        } else {
          console.error('Stats API returned error:', statsData.error);
          setError('Failed to load statistics');
        }
      } else {
        console.error('Stats API request failed:', statsRes.status, statsRes.statusText);
        setError('Failed to connect to statistics service');
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        if (activitiesData.success) {
          setActivities(activitiesData.data.activities || []);
        } else {
          console.error('Activities API returned error:', activitiesData.error);
        }
      } else {
        console.error('Activities API request failed:', activitiesRes.status, activitiesRes.statusText);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading admin data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchAdminData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your job portal platform</p>
          </div>
          <Button onClick={fetchAdminData} variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-gray-500">
                {stats?.activeUsers || 0} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalJobs || 0}</div>
              <p className="text-xs text-gray-500">
                Across all companies
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalCompanies || 0}</div>
              <p className="text-xs text-gray-500">
                {stats?.pendingVerifications || 0} pending verification
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Applications</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</div>
              <p className="text-xs text-gray-500">
                Total submissions
              </p>
            </CardContent>
          </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Platform Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.totalViews || 0).toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total job views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Average Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{(stats?.averageSalary || 0).toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Per annum</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.recentSignups?.length || 0}</div>
            <p className="text-sm text-muted-foreground">New users this week</p>
          </CardContent>
        </Card>
      </div>

        {/* Quick Actions */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            <p className="text-sm text-gray-600">Manage different aspects of your platform</p>
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
              <Link href="/dashboard/admin/content">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300">
                  <FileText className="h-6 w-6" />
                  <span className="font-medium">Manage Content</span>
                </Button>
              </Link>
              <Link href="/admin/seed-jobs">
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300">
                  <Database className="h-6 w-6" />
                  <span className="font-medium">Seed Jobs</span>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(activities || []).slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {activity.type === 'user_signup' && <UserPlus className="h-4 w-4 text-primary" />}
                    {activity.type === 'job_posted' && <Briefcase className="h-4 w-4 text-primary" />}
                    {activity.type === 'company_registered' && <Building2 className="h-4 w-4 text-primary" />}
                    {activity.type === 'application_submitted' && <FileText className="h-4 w-4 text-primary" />}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  {activity.user && (
                    <p className="text-xs text-muted-foreground">
                      by {activity.user.name} ({activity.user.email})
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.userRoleDistribution?.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span className="capitalize">{item.role}</span>
                  <Badge variant="secondary">{item._count.role}</Badge>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.jobTypeDistribution?.map((item) => (
                <div key={item.jobType} className="flex items-center justify-between">
                  <span className="capitalize">{item.jobType || 'Not specified'}</span>
                  <Badge variant="secondary">{item._count.jobType}</Badge>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.applicationStatusDistribution?.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="capitalize">{item.status}</span>
                  <Badge variant="secondary">{item._count.status}</Badge>
                </div>
              )) || []}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
