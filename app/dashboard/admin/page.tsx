"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Briefcase, 
  Building2, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  BarChart3,
  Mail,
  Settings,
  Shield,
  Activity
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalCompanies: number;
  totalApplications: number;
  activeUsers: number;
  pendingVerifications: number;
  recentSignups: number;
  flaggedContent: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'job_posted' | 'application_submitted' | 'company_registered';
  description: string;
  timestamp: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalJobs: 0,
    totalCompanies: 0,
    totalApplications: 0,
    activeUsers: 0,
    pendingVerifications: 0,
    recentSignups: 0,
    flaggedContent: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch various admin statistics
        const [usersRes, jobsRes, companiesRes, applicationsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/jobs'),
          fetch('/api/companies'),
          fetch('/api/applications')
        ]);

        const users = usersRes.ok ? await usersRes.json() : [];
        const jobs = jobsRes.ok ? await jobsRes.json() : {};
        const companies = companiesRes.ok ? await companiesRes.json() : [];
        const applications = applicationsRes.ok ? await applicationsRes.json() : [];

        // Calculate stats
        const totalUsers = Array.isArray(users) ? users.length : 0;
        const totalJobs = jobs?.jobs?.length || 0;
        const totalCompanies = Array.isArray(companies) ? companies.length : 0;
        const totalApplications = Array.isArray(applications) ? applications.length : 0;

        // Mock additional stats
        const activeUsers = Math.floor(totalUsers * 0.6);
        const pendingVerifications = Math.floor(totalUsers * 0.1);
        const recentSignups = Math.floor(totalUsers * 0.2);
        const flaggedContent = Math.floor(totalJobs * 0.05);

        setStats({
          totalUsers,
          totalJobs,
          totalCompanies,
          totalApplications,
          activeUsers,
          pendingVerifications,
          recentSignups,
          flaggedContent
        });

        // Mock recent activity
        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'user_signup',
            description: 'New user registered: john.doe@example.com',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: 'pending'
          },
          {
            id: '2',
            type: 'job_posted',
            description: 'New job posted: Senior React Developer at TechCorp',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'approved'
          },
          {
            id: '3',
            type: 'company_registered',
            description: 'New company registered: Innovation Labs',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: 'pending'
          },
          {
            id: '4',
            type: 'application_submitted',
            description: 'Application submitted for Frontend Developer position',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          }
        ];

        setRecentActivity(mockActivity);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup': return <Users className="h-4 w-4" />;
      case 'job_posted': return <Briefcase className="h-4 w-4" />;
      case 'company_registered': return <Building2 className="h-4 w-4" />;
      case 'application_submitted': return <FileText className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, jobs, companies and monitor system activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-xs text-green-600">+{stats.recentSignups} this week</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                  <p className="text-xs text-green-600">+12 this week</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Companies</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
                  <p className="text-xs text-green-600">+3 this week</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
                  <p className="text-xs text-green-600">+45 this week</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  <p className="text-xs text-blue-600">Online now</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                  <p className="text-xs text-yellow-600">Needs attention</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Flagged Content</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.flaggedContent}</p>
                  <p className="text-xs text-red-600">Review required</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-green-900">Good</p>
                  <p className="text-xs text-green-600">All systems operational</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-16 flex flex-col">
                  <Users className="h-5 w-5 mb-1" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/jobs">
                <Button variant="outline" className="w-full h-16 flex flex-col">
                  <Briefcase className="h-5 w-5 mb-1" />
                  Manage Jobs
                </Button>
              </Link>
              <Link href="/admin/companies">
                <Button variant="outline" className="w-full h-16 flex flex-col">
                  <Building2 className="h-5 w-5 mb-1" />
                  Manage Companies
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full h-16 flex flex-col">
                  <BarChart3 className="h-5 w-5 mb-1" />
                  View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                    </div>
                    {activity.status && (
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                ))}
                <Link href="/admin/activity">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Activity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* System Status */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">System Status</span>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>

                {/* Database Performance */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Database Performance</span>
                    <span className="text-sm text-gray-900">Good</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                {/* Server Load */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Server Load</span>
                    <span className="text-sm text-gray-900">Normal</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <Link href="/admin/system">
                  <Button variant="outline" size="sm" className="w-full">
                    System Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}