"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Search, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Building2, 
  Clock,
  Eye,
  Bookmark,
  FileText,
  User,
  Settings,
  Bell,
  Star,
  ArrowRight,
  Plus,
  Target,
  BarChart3,
  Users,
  CheckCircle,
  AlertCircle,
  Edit,
  Upload,
  Heart,
  Send,
  Filter
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AuthGuard from "@/components/auth/AuthGuard";

interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  totalBookmarks: number;
  totalResumes: number;
  profileCompletion: number;
}

interface RecentActivity {
  id: string;
  type: 'application' | 'bookmark' | 'resume';
  title: string;
  company?: string;
  date: string;
  status?: string;
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salary?: string;
  isRemote: boolean;
  matchScore: number;
  matchReasons: string[];
  createdAt: string;
}

export default function JobSeekerDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile with stats
      const profileResponse = await fetch('/api/jobseeker/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success) {
          setStats(profileData.data.stats);
        }
      }

      // Fetch recent activity
      const applicationsResponse = await fetch('/api/jobseeker/applications?limit=5');
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        if (applicationsData.success) {
          const activities: RecentActivity[] = applicationsData.data.applications.map((app: any) => ({
            id: app.id,
            type: 'application',
            title: app.job.title,
            company: app.job.company,
            date: app.appliedAt,
            status: app.status
          }));
          setRecentActivity(activities);
        }
      }

      // Fetch job recommendations
      const recommendationsResponse = await fetch('/api/jobseeker/recommendations?limit=6');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        if (recommendationsData.success) {
          setRecommendations(recommendationsData.data.jobs);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return <Send className="h-4 w-4 text-blue-500" />;
      case 'bookmark': return <Bookmark className="h-4 w-4 text-red-500" />;
      case 'resume': return <FileText className="h-4 w-4 text-green-500" />;
      default: return <Briefcase className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {session?.user?.name || 'Job Seeker'}! 👋
                </h1>
                <p className="text-gray-600 mt-2">
                  Here's what's happening with your job search
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Link href="/jobs">
                  <Button className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Jobs
                  </Button>
                </Link>
                <Link href="/resumes/upload">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Resume
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.totalApplications}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Send className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Applications</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeApplications}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                      <p className="text-2xl font-bold text-red-600">{stats.totalBookmarks}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <Bookmark className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Profile Complete</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.profileCompletion}%</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full justify-start">
                      <Search className="h-4 w-4 mr-2" />
                      Search Jobs
                    </Button>
                  </Link>
                  <Link href="/dashboard/jobseeker/applications">
                    <Button variant="outline" className="w-full justify-start">
                      <Briefcase className="h-4 w-4 mr-2" />
                      My Applications
                    </Button>
                  </Link>
                  <Link href="/dashboard/jobseeker/bookmarks">
                    <Button variant="outline" className="w-full justify-start">
                      <Bookmark className="h-4 w-4 mr-2" />
                      Saved Jobs
                    </Button>
                  </Link>
                  <Link href="/dashboard/jobseeker/resumes">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      My Resumes
                    </Button>
                  </Link>
                  <Link href="/dashboard/jobseeker/profile">
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Profile Completion */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Profile Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Profile Completion</span>
                          <span>{stats.profileCompletion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${stats.profileCompletion}%` }}
                          ></div>
                        </div>
                      </div>
                      {stats.profileCompletion < 100 && (
                        <Link href="/dashboard/jobseeker/profile">
                          <Button size="sm" className="w-full">
                            Complete Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Recommendations */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Recommended Jobs
                    </CardTitle>
                    <Link href="/jobs">
                      <Button variant="outline" size="sm">
                        View All
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recommendations.length > 0 ? (
                    <div className="space-y-4">
                      {recommendations.map((job) => (
                        <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{job.title}</h3>
                              <p className="text-sm text-gray-600">{job.company}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">
                                {job.matchScore}% match
                              </Badge>
                              <Button size="sm" variant="outline">
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {job.jobType}
                            </div>
                            {job.salary && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{job.salary}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              {job.matchReasons.join(', ')}
                            </div>
                            <Link href={`/jobs/${job.id}`}>
                              <Button size="sm">View Job</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
                      <p className="text-gray-600 mb-4">Complete your profile to get personalized job recommendations</p>
                      <Link href="/dashboard/jobseeker/profile">
                        <Button>Complete Profile</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <Link href="/dashboard/jobseeker/applications">
                      <Button variant="outline" size="sm">
                        View All
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="p-2 bg-gray-100 rounded-full">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.title}</p>
                            {activity.company && (
                              <p className="text-sm text-gray-600">{activity.company}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString()}
                            </p>
                          </div>
                          {activity.status && (
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                      <p className="text-gray-600 mb-4">Start applying to jobs to see your activity here</p>
                      <Link href="/jobs">
                        <Button>Browse Jobs</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}