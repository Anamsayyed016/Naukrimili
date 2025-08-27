"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Briefcase, 
  FileText, 
  Eye, 
  TrendingUp, 
  Clock,
  MapPin,
  Star,
  Plus,
  Search,
  Upload
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";

interface DashboardStats {
  applicationsCount: number;
  profileViews: number;
  resumeUploads: number;
  savedJobs: number;
  profileCompletion: number;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
  jobId: number;
}

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  postedAt: string;
  salary?: string;
}

export default function JobseekerPage() {
  console.log('Jobseeker dashboard page loaded');
  
  const [stats, setStats] = useState<DashboardStats>({
    applicationsCount: 0,
    profileViews: 0,
    resumeUploads: 0,
    savedJobs: 0,
    profileCompletion: 0
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Jobseeker dashboard useEffect running');
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...');
        // Fetch applications
        const applicationsRes = await fetch('/api/applications');
        const applications = applicationsRes.ok ? await applicationsRes.json() : [];
        
        // Fetch bookmarks
        const bookmarksRes = await fetch('/api/jobs/bookmarks');
        const bookmarks = bookmarksRes.ok ? await bookmarksRes.json() : [];
        
        // Fetch recommended jobs
        const jobsRes = await fetch('/api/jobs?limit=5&featured=true');
        const jobsData = jobsRes.ok ? await jobsRes.json() : {};
        
        // Fetch user profile for completion
        const profileRes = await fetch('/api/user/profile');
        const profile = profileRes.ok ? await profileRes.json() : {};

        // Calculate profile completion
        const completionFields = ['name', 'email', 'phone', 'location', 'bio', 'skills', 'experience'];
        const completedFields = completionFields.filter(field => profile[field]);
        const completion = Math.round((completedFields.length / completionFields.length) * 100);

        if (isMounted) {
          setStats({
            applicationsCount: Array.isArray(applications) ? applications.length : 0,
            profileViews: Math.floor(Math.random() * 50) + 10, // Mock data
            resumeUploads: profile.resumes?.length || 0,
            savedJobs: Array.isArray(bookmarks) ? bookmarks.length : 0,
            profileCompletion: completion
          });

          setRecentApplications(Array.isArray(applications) ? applications.slice(0, 5) : []);
          setRecommendedJobs(Array.isArray(jobsData.jobs) ? jobsData.jobs : []);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching dashboard data:', error);
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'hired': return 'bg-green-100 text-green-800';
      case 'interview': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
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
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening with your job search</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.applicationsCount}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile Views</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.profileViews}</p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.savedJobs}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile Complete</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.profileCompletion}%</p>
                </div>
                <User className="h-8 w-8 text-purple-500" />
              </div>
              <Progress value={stats.profileCompletion} className="mt-2" />
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
              <Link href="/jobs">
                <Button variant="outline" className="w-full h-16 flex flex-col">
                  <Search className="h-5 w-5 mb-1" />
                  Search Jobs
                </Button>
              </Link>
              <Link href="/resumes/upload">
                <Button variant="outline" className="w-full h-16 flex flex-col">
                  <Upload className="h-5 w-5 mb-1" />
                  Upload Resume
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full h-16 flex flex-col">
                  <User className="h-5 w-5 mb-1" />
                  Update Profile
                </Button>
              </Link>
              <Link href="/jobs?bookmarked=true">
                <Button variant="outline" className="w-full h-16 flex flex-col">
                  <Star className="h-5 w-5 mb-1" />
                  Saved Jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{application.jobTitle}</h4>
                        <p className="text-sm text-gray-600">{application.company}</p>
                        <p className="text-xs text-gray-500">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/applications">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Applications
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No applications yet</p>
                  <Link href="/jobs">
                    <Button>Start Applying</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendedJobs.length > 0 ? (
                <div className="space-y-4">
                  {recommendedJobs.map((job) => (
                    <div key={job.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Link href={`/jobs/${job.id}`}>
                        <h4 className="font-medium text-gray-900 hover:text-blue-600">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                          {job.salary && <span>{job.salary}</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(job.postedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))}
                  <Link href="/jobs">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Jobs
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No recommendations yet</p>
                  <Link href="/jobs">
                    <Button>Browse Jobs</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
