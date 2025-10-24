"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Calendar,
  Eye,
  Bookmark,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";

interface AnalyticsData {
  overview: {
    totalJobs: number;
    totalApplications: number;
    period: string;
  };
  breakdowns: {
    status: Record<string, number>;
    jobType: Record<string, number>;
    experience: Record<string, number>;
  };
  trends: {
    jobs: Array<{ month: string; job_count: number }>;
    applications: Array<{ month: string; application_count: number }>;
  };
  topJobs: Array<{
    id: number;
    title: string;
    _count: {
      applications: number;
      bookmarks: number;
    };
  }>;
  recentApplications: Array<{
    id: number;
    appliedAt: string;
    status: string;
    user: {
      id: string;
      name: string;
      email: string;
      profilePicture?: string;
    };
    job: {
      id: number;
      title: string;
    };
  }>;
}

export default function EmployerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employer/analytics?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-blue-100 text-blue-800';
      case 'mid': return 'bg-yellow-100 text-yellow-800';
      case 'senior': return 'bg-orange-100 text-orange-800';
      case 'lead': return 'bg-purple-100 text-purple-800';
      case 'executive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
          <p className="text-gray-600">Start posting jobs to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['employer']}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">Insights into your job postings and applications</p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold">{analytics.overview.totalJobs}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold">{analytics.overview.totalApplications}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Application Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics.overview.totalJobs > 0 
                        ? Math.round((analytics.overview.totalApplications / analytics.overview.totalJobs) * 100)
                        : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Period</p>
                    <p className="text-2xl font-bold">{analytics.overview.period}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Application Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.breakdowns.status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`}></div>
                        <span className="capitalize">{status}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Job Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Job Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.breakdowns.jobType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type.replace('-', ' ')}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience Level Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Experience Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.breakdowns.experience).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getExperienceColor(level).split(' ')[0]}`}></div>
                        <span className="capitalize">{level}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topJobs.map((job, index) => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{job.title}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {job._count.applications} applications
                          </span>
                          <span className="flex items-center gap-1">
                            <Bookmark className="h-3 w-3" />
                            {job._count.bookmarks} bookmarks
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentApplications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {application.user.profilePicture ? (
                          <img 
                            src={application.user.profilePicture} 
                            alt={application.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {application.user.name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{application.user.name}</p>
                        <p className="text-sm text-gray-600">{application.job.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                      <Link href={`/employer/applications/${application.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
