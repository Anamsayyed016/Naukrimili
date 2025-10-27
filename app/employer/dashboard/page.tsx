"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp, 
  Eye,
  Star,
  BarChart3,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  DollarSign,
  Calendar,
  Sparkles,
  Bell,
  BellRing,
  Trash2,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

export default function EmployerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasCompany, setHasCompany] = useState(false);
  const [deletingJob, setDeletingJob] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const shouldRefresh = useRef(true);

  const quickActions: QuickAction[] = [
    {
      title: 'Post New Job',
      description: 'Create a job posting to attract candidates',
      href: '/employer/jobs/create',
      icon: Briefcase,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100'
    },
    {
      title: 'Manage Jobs',
      description: 'View and edit your job postings',
      href: '/employer/jobs',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Review Applications',
      description: 'Check and manage job applications',
      href: '/employer/applications',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      title: 'Company Profile',
      description: 'Update your company information',
      href: '/employer/company/profile',
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    }
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if company exists
      const companyResponse = await fetch('/api/employer/company-profile');
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        if (companyData.success) {
          setHasCompany(true);
          
          // Fetch stats if company exists - use working API
          const statsResponse = await fetch('/api/stats');
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success) {
              // Transform data to match expected format
              const transformedStats = {
                totalJobs: statsData.data.totalJobs,
                activeJobs: statsData.data.activeJobs,
                totalApplications: statsData.data.totalApplications,
                pendingApplications: statsData.data.pendingApplications || 0,
                profileViews: statsData.data.profileViews || 0,
                companyRating: statsData.data.companyRating || 0,
                recentJobs: [], // Will be fetched separately
                jobTypeDistribution: [], // Will be fetched separately
                applicationStatusDistribution: [] // Will be fetched separately
              };
              setStats(transformedStats);
              
              // Fetch additional data
              await fetchAdditionalData();
              
              // Generate AI insights
              setTimeout(() => generateAIInsights(), 1000);
            }
          }
        } else {
          setHasCompany(false);
        }
      } else if (companyResponse.status === 401) {
        // User not authenticated, stop retrying and redirect to login
        console.error('User not authenticated, redirecting to login');
        shouldRefresh.current = false; // Stop the auto-refresh loop
        setError('Session expired. Please sign in again.');
        setLoading(false);
        router.push('/auth/signin');
        return;
      } else if (companyResponse.status === 404) {
        // Company not found
        setHasCompany(false);
      } else {
        // Other error
        console.error('Error fetching company profile:', companyResponse.status, companyResponse.statusText);
        setHasCompany(false);
        setError(`Failed to load dashboard: ${companyResponse.status}`);
      }
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      shouldRefresh.current = false; // Stop refreshing on logout
      router.push('/auth/login?redirect=/employer/dashboard');
      return;
    }
    if (session?.user?.role !== 'employer') {
      shouldRefresh.current = false; // Stop refreshing if not employer
      router.push('/dashboard');
      return;
    }
    
    // Only make API calls if we have an authenticated session with a user ID
    if (session?.user?.id) {
      shouldRefresh.current = true; // Enable refreshing for valid session
      fetchDashboardData();
      fetchNotifications();
      
      // Set up auto-refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        // Only refresh if shouldRefresh flag is true
        if (shouldRefresh.current && session?.user?.id && session?.user?.role === 'employer') {
          fetchDashboardData();
          fetchNotifications();
        }
      }, 30000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [status, session]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (_error) {
      console.error('Error fetching notifications:', _error);
    }
  };

  const fetchAdditionalData = async () => {
    try {
      // Fetch recent jobs
      const jobsResponse = await fetch('/api/jobs?limit=5');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        if (jobsData.success) {
          setStats(prev => prev ? {
            ...prev,
            recentJobs: jobsData.data.jobs || []
          } : null);
        }
      }

      // Fetch job type distribution
      const jobTypesResponse = await fetch('/api/jobs/constants');
      if (jobTypesResponse.ok) {
        const jobTypesData = await jobTypesResponse.json();
        if (jobTypesData.success) {
          const jobTypeDistribution = jobTypesData.data.jobTypes.map((item: any) => ({
            jobType: item.value,
            _count: { jobType: item.count }
          }));
          
          setStats(prev => prev ? {
            ...prev,
            jobTypeDistribution
          } : null);
        }
      }
    } catch (_error) {
      console.error('Error fetching additional data:', _error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    setDeletingJob(jobId);

    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete job');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Job deleted successfully!', {
          description: 'The job posting has been removed.',
          duration: 5000,
        });
        
        // Refresh dashboard data
        await fetchDashboardData();
      } else {
        throw new Error(result.error || 'Failed to delete job');
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      toast.error('Failed to delete job', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        duration: 5000,
      });
    } finally {
      setDeletingJob(null);
    }
  };

  const generateAIInsights = async () => {
    try {
      // Generate AI insights based on current stats
      const insights = [];
      
      if (stats) {
        // Job performance insights
        if (stats.totalJobs > 0) {
          const avgApplicationsPerJob = stats.totalApplications / stats.totalJobs;
          
          if (avgApplicationsPerJob < 5) {
            insights.push({
              type: 'warning',
              title: 'Low Application Rate',
              message: `Your jobs average ${avgApplicationsPerJob.toFixed(1)} applications each. Consider improving job titles or descriptions.`,
              action: 'Improve Job Descriptions',
              icon: '📈'
            });
          }
          
          if (stats.activeJobs === 0) {
            insights.push({
              type: 'info',
              title: 'No Active Jobs',
              message: 'You have no active job postings. Post a new job to start attracting candidates.',
              action: 'Post New Job',
              icon: '💼'
            });
          }
          
          if (stats.totalApplications > 0 && stats.pendingApplications > stats.totalApplications * 0.8) {
            insights.push({
              type: 'success',
              title: 'High Application Volume',
              message: `You have ${stats.pendingApplications} pending applications. Review them to find great candidates.`,
              action: 'Review Applications',
              icon: '👥'
            });
          }
        }
      }
      
      setAiInsights(insights);
    } catch (err) {
      console.error('Error generating AI insights:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (session?.user?.role !== 'employer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        {/* Enhanced Header */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-5xl font-bold text-slate-900">
                Welcome back, {(session?.user as any)?.firstName || 'Employer'}! 👋
              </h1>
              {/* Notification Bell */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-3 hover:bg-blue-50 rounded-full"
                  onClick={() => {
                    // Toggle notification panel or redirect to notifications
                    router.push('/messages');
                  }}
                >
                  {unreadCount > 0 ? (
                    <BellRing className="h-6 w-6 text-orange-500" />
                  ) : (
                    <Bell className="h-6 w-6 text-slate-600" />
                  )}
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-slate-600 text-xl">
              {hasCompany ? 'Manage your company and job postings' : 'Let\'s get your company set up'}
            </p>
            {unreadCount > 0 && (
              <div className="mt-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  <Bell className="h-3 w-3 mr-1" />
                  {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Company Setup Prompt */}
        {!hasCompany && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-6">Create Your Company Profile</h3>
                  <p className="text-slate-600 mb-8 text-xl max-w-2xl mx-auto leading-relaxed">
                    Get started by creating your company profile. This helps job seekers learn about your company and builds trust in your brand.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <Link href="/employer/company/create">
                      <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                        <Building2 className="h-6 w-6 mr-3" />
                        Create Company Profile
                      </Button>
                    </Link>
                    <Link href="/employer/jobs/create">
                      <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-10 py-4 text-lg rounded-xl font-semibold shadow-sm hover:shadow-md transition-all duration-200">
                        <Briefcase className="h-6 w-6 mr-3" />
                        Post Job First
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Enhanced Stats Cards */}
        {hasCompany && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10"
          >
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-800">Total Jobs</CardTitle>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-slate-900 mb-2">{stats.totalJobs}</div>
                <p className="text-slate-600 font-medium">
                  {stats.activeJobs} active
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-800">Applications</CardTitle>
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-slate-900 mb-2">{stats.totalApplications}</div>
                <p className="text-slate-600 font-medium">
                  {stats.pendingApplications} pending
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-800">Profile Views</CardTitle>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-slate-900 mb-2">{stats.profileViews}</div>
                <p className="text-slate-600 font-medium">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-800">Company Rating</CardTitle>
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl group-hover:scale-110 transition-transform duration-200">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-slate-900 mb-2">{stats.companyRating}</div>
                <p className="text-slate-600 font-medium">
                  out of 5
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Insights */}
        {hasCompany && aiInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              AI Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiInsights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Card className={`${
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    insight.type === 'success' ? 'bg-green-50 border-green-200' :
                    'bg-blue-50 border-blue-200'
                  } hover:shadow-lg transition-all duration-300`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{insight.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{insight.message}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`${
                              insight.type === 'warning' ? 'text-yellow-700 border-yellow-300 hover:bg-yellow-100' :
                              insight.type === 'success' ? 'text-green-700 border-green-300 hover:bg-green-100' :
                              'text-blue-700 border-blue-300 hover:bg-blue-100'
                            }`}
                          >
                            {insight.action}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Link href={action.href}>
                  <Card className={`${action.bgColor} hover:shadow-lg transition-all duration-300 cursor-pointer group`}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg bg-white/50 group-hover:bg-white/80 transition-colors`}>
                          <action.icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-gray-800">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600 group-hover:text-gray-700">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Jobs */}
        {hasCompany && stats && stats.recentJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recent Jobs</h2>
              <Link href="/employer/jobs">
                <Button variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {stats.recentJobs.slice(0, 3).map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {job._count?.applications || 0} applications
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={job.isActive ? "default" : "secondary"}>
                            {job.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {job.isUrgent && <Badge variant="destructive">Urgent</Badge>}
                          {job.isFeatured && <Badge className="bg-purple-100 text-purple-800">Featured</Badge>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/employer/jobs/${job.id}/edit`}>
                          <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={deletingJob === job.id}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          {deletingJob === job.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics */}
        {hasCompany && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Job Type Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.jobTypeDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {stats.jobTypeDistribution.map((item, index) => {
                      const total = stats.jobTypeDistribution.reduce((sum, i) => sum + i._count.jobType, 0);
                      const percentage = total > 0 ? (item._count.jobType / total) * 100 : 0;
                      return (
                        <div key={item.jobType} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="capitalize text-gray-700 font-medium">
                              {item.jobType || 'Not specified'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {item._count.jobType}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No job type data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Application Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.applicationStatusDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {stats.applicationStatusDistribution.map((item, index) => {
                      const total = stats.applicationStatusDistribution.reduce((sum, i) => sum + i._count.status, 0);
                      const percentage = total > 0 ? (item._count.status / total) * 100 : 0;
                      const statusColors = {
                        'submitted': 'from-yellow-500 to-yellow-600',
                        'reviewed': 'from-blue-500 to-blue-600',
                        'shortlisted': 'from-purple-500 to-purple-600',
                        'hired': 'from-green-500 to-green-600',
                        'rejected': 'from-red-500 to-red-600'
                      };
                      const colorClass = statusColors[item.status as keyof typeof statusColors] || 'from-gray-500 to-gray-600';
                      
                      return (
                        <div key={item.status} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="capitalize text-gray-700 font-medium">
                              {item.status}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                              <Badge 
                                variant="secondary" 
                                className={`${
                                  item.status === 'hired' ? 'bg-green-100 text-green-800' :
                                  item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  item.status === 'shortlisted' ? 'bg-purple-100 text-purple-800' :
                                  item.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {item._count.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`bg-gradient-to-r ${colorClass} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No application data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State for New Employers */}
        {hasCompany && stats && stats.totalJobs === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-900 mb-4">Ready to Post Your First Job?</h3>
                <p className="text-emerald-700 mb-6 text-lg">
                  Create your first job posting and start attracting qualified candidates to your company.
                </p>
                <Link href="/employer/jobs/create">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Post Your First Job
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}