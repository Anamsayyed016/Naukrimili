"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp, 
  Building2,
  Eye,
  Star,
  BarChart3
} from "lucide-react";
import Link from "next/link";

interface CompanyStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  profileViews: number;
  companyRating: number;
  recentJobs: any[];
  jobTypeDistribution: any[];
  applicationStatusDistribution: any[];
}

export default function CompanyDashboard() {
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyStats();
  }, []);

  const fetchCompanyStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/company/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch company stats');
      }
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading company dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchCompanyStats}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Company Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/employer/post-job">
            <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
              <Briefcase className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </Link>
          <Button onClick={fetchCompanyStats} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Welcome Message for New Users */}
      {stats && stats.totalJobs === 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Welcome to Your Company Dashboard!</h3>
              <p className="text-blue-700 mb-4">
                Get started by posting your first job and building your company profile to attract top talent.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/employer/post-job">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Post Your First Job
                  </Button>
                </Link>
                <Link href="/employer/company-profile">
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Building2 className="h-4 w-4 mr-2" />
                    Complete Company Profile
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeJobs} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApplications} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileViews}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companyRating}</div>
            <p className="text-xs text-muted-foreground">
              out of 5
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/employer/post-job">
              <Button>
                <Briefcase className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </Link>
            <Link href="/employer/jobs">
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Manage Jobs
              </Button>
            </Link>
            <Link href="/employer/applications">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Review Applications
              </Button>
            </Link>
            <Link href="/employer/company-profile">
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Edit Company Profile
              </Button>
            </Link>
            <Link href="/employer/analytics">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.location}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={job.isActive ? "default" : "secondary"}>
                      {job.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {job._count.applications} applications
                    </span>
                  </div>
                </div>
                <Link href={`/employer/jobs/${job.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.jobTypeDistribution.map((item) => (
                <div key={item.jobType} className="flex items-center justify-between">
                  <span className="capitalize">{item.jobType || 'Not specified'}</span>
                  <Badge variant="secondary">{item._count.jobType}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.applicationStatusDistribution.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="capitalize">{item.status}</span>
                  <Badge variant="secondary">{item._count.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
