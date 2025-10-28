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
    } catch (_error) {
      console.error('Error fetching dashboard data:', _error);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* Enhanced Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Welcome back, {(session?.user as any)?.firstName || session?.user?.name || 'Job Seeker'}! 👋
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Here's what's happening with your job search journey
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/jobs">
                  <Button className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Search className="h-4 w-4" />
                    Search Jobs
                  </Button>
                </Link>
                <Link href="/resumes/upload">
                  <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2 border-2 hover:bg-gray-50 transition-all duration-300">
                    <Upload className="h-4 w-4" />
                    Upload Resume
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-blue-700/80">Total Applications</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalApplications}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-blue-200/50 rounded-full group-hover:bg-blue-300/50 transition-colors">
                      <Send className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-green-700/80">Active Applications</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.activeApplications}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-green-200/50 rounded-full group-hover:bg-green-300/50 transition-colors">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100/50 hover:from-red-100 hover:to-red-200/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-red-700/80">Saved Jobs</p>
                      <p className="text-xl sm:text-2xl font-bold text-red-600">{stats.totalBookmarks}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-red-200/50 rounded-full group-hover:bg-red-300/50 transition-colors">
                      <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-purple-700/80">Profile Complete</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.profileCompletion}%</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-purple-200/50 rounded-full group-hover:bg-purple-300/50 transition-colors">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Enhanced Quick Actions */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <Target className="h-5 w-5 text-blue-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full justify-start h-12 hover:bg-blue-50 hover:border-blue-200 transition-all duration-300 group">
                      <Search className="h-4 w-4 mr-3 text-blue-600 group-hover:text-blue-700" />
                      <span className="font-medium">Search Jobs</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/jobseeker/applications">
                    <Button variant="outline" className="w-full justify-start h-12 hover:bg-green-50 hover:border-green-200 transition-all duration-300 group">
                      <Briefcase className="h-4 w-4 mr-3 text-green-600 group-hover:text-green-700" />
                      <span className="font-medium">My Applications</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/jobseeker/bookmarks">
                    <Button variant="outline" className="w-full justify-start h-12 hover:bg-red-50 hover:border-red-200 transition-all duration-300 group">
                      <Bookmark className="h-4 w-4 mr-3 text-red-600 group-hover:text-red-700" />
                      <span className="font-medium">Saved Jobs</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/jobseeker/resumes">
                    <Button variant="outline" className="w-full justify-start h-12 hover:bg-purple-50 hover:border-purple-200 transition-all duration-300 group">
                      <FileText className="h-4 w-4 mr-3 text-purple-600 group-hover:text-purple-700" />
                      <span className="font-medium">My Resumes</span>
                    </Button>
                  </Link>
                  <Link href="/dashboard/jobseeker/profile">
                    <Button variant="outline" className="w-full justify-start h-12 hover:bg-orange-50 hover:border-orange-200 transition-all duration-300 group">
                      <Edit className="h-4 w-4 mr-3 text-orange-600 group-hover:text-orange-700" />
                      <span className="font-medium">Edit Profile</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Enhanced Profile Completion - Moved to sidebar */}
              {stats && (
                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-blue-50/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
                      <User className="h-5 w-5 text-purple-600" />
                      Profile Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center space-y-3">
                      <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
                        {stats.profileCompletion}%
                      </span>
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200/50 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${stats.profileCompletion}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600">
                          {stats.profileCompletion < 50 ? 'Complete your profile to get better job matches' :
                           stats.profileCompletion < 80 ? 'Great progress! Keep going' :
                           'Excellent! Your profile is well-optimized'}
                        </p>
                      </div>
                    </div>
                    {stats.profileCompletion < 100 && (
                      <Link href="/dashboard/jobseeker/profile">
                        <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold">
                          Complete Profile
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Enhanced Main Content */}
            <div className="lg:col-span-9 space-y-6">
              {/* Enhanced Job Recommendations */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Recommended Jobs
                    </CardTitle>
                    <Link href="/jobs">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto hover:bg-blue-50 hover:border-blue-200 transition-all duration-300">
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
                        <div key={job.id} className="group border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 bg-white/50 hover:bg-white">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                            <div className="flex-1 space-y-1">
                              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">{job.title}</h3>
                              <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200">
                                {job.matchScore}% match
                              </Badge>
                              <Button size="sm" variant="outline" className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300">
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4 text-green-500" />
                              <span>{job.jobType}</span>
                            </div>
                            {job.salary && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-purple-600">{job.salary}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="font-medium">Why this matches:</span> {job.matchReasons.join(', ')}
                            </div>
                            <Link href={`/jobs/${job.id}/apply`}>
                              <Button size="sm" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                                View Job
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Briefcase className="h-10 w-10 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No recommendations yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">Complete your profile to get personalized job recommendations tailored to your skills and preferences</p>
                      <Link href="/dashboard/jobseeker/profile">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                          Complete Profile
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Recent Activity */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Recent Activity
                    </CardTitle>
                    <Link href="/dashboard/jobseeker/applications">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto hover:bg-blue-50 hover:border-blue-200 transition-all duration-300">
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
                        <div key={activity.id} className="group flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-200 transition-all duration-300 bg-white/50 hover:bg-white">
                          <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{activity.title}</p>
                            {activity.company && (
                              <p className="text-sm text-gray-600 font-medium">{activity.company}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          {activity.status && (
                            <Badge className={`${getStatusColor(activity.status)} border-0 shadow-sm`}>
                              {activity.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="h-10 w-10 text-gray-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No recent activity</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">Start applying to jobs to see your activity and track your progress here</p>
                      <Link href="/jobs">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                          Browse Jobs
                        </Button>
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