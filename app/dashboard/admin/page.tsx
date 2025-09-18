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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your job portal platform</p>
            </div>
            <Button disabled variant="outline" className="bg-white border-gray-300 text-gray-700">
              <Activity className="h-4 w-4 mr-2" />
              Loading...
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
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
            <Button onClick={fetchAdminData} variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600 mb-4">Unable to load dashboard data. This might be due to database connection issues.</p>
              <Button onClick={fetchAdminData} className="bg-blue-600 hover:bg-blue-700 text-white">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
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
          <Card className="bg-white border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">Total Users</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalUsers || 0}</div>
              <p className="text-sm text-gray-600 font-medium">
                {stats?.activeUsers || 0} active users
              </p>
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
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalJobs || 0}</div>
              <p className="text-sm text-gray-600 font-medium">
                Active job postings
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
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalCompanies || 0}</div>
              <p className="text-sm text-gray-600 font-medium">
                {stats?.pendingVerifications || 0} pending verification
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">Applications</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.totalApplications || 0}</div>
              <p className="text-sm text-gray-600 font-medium">
                Total submissions
              </p>
            </CardContent>
          </Card>
      </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Eye className="h-4 w-4 text-indigo-600" />
                Platform Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{(stats?.totalViews || 0).toLocaleString()}</div>
              <p className="text-xs text-gray-500">Total job views</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Average Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{(stats?.averageSalary || 0).toLocaleString()}</div>
              <p className="text-xs text-gray-500">Per annum</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.recentSignups?.length || 0}</div>
              <p className="text-xs text-gray-500">New users this week</p>
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
        <Card className="bg-white border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-xl font-bold">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              Recent Activity
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Latest platform activities and updates</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                {stats?.userRoleDistribution?.map((item) => (
                  <div key={item.role} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                    <span className="capitalize text-sm font-semibold text-gray-800">{item.role}</span>
                    <Badge className="bg-blue-200 text-blue-800 border-blue-300 font-bold px-3 py-1">{item._count.role}</Badge>
                  </div>
                )) || []}
                {(!stats?.userRoleDistribution || stats.userRoleDistribution.length === 0) && (
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
                {stats?.jobTypeDistribution?.map((item) => (
                  <div key={item.jobType} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                    <span className="capitalize text-sm font-semibold text-gray-800">{item.jobType || 'Not specified'}</span>
                    <Badge className="bg-green-200 text-green-800 border-green-300 font-bold px-3 py-1">{item._count.jobType}</Badge>
                  </div>
                )) || []}
                {(!stats?.jobTypeDistribution || stats.jobTypeDistribution.length === 0) && (
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
                {stats?.applicationStatusDistribution?.map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100 hover:bg-orange-100 transition-colors">
                    <span className="capitalize text-sm font-semibold text-gray-800">{item.status}</span>
                    <Badge className="bg-orange-200 text-orange-800 border-orange-300 font-bold px-3 py-1">{item._count.status}</Badge>
                  </div>
                )) || []}
                {(!stats?.applicationStatusDistribution || stats.applicationStatusDistribution.length === 0) && (
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
    </div>
  );
}
