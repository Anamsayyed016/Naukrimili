"use client";

import React, { useState, useEffect } from 'react';
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
  Sparkles
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
  const [hasCompany, setHasCompany] = useState(false);

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

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/employer/dashboard');
      return;
    }
    if (session?.user?.role !== 'employer') {
      router.push('/dashboard');
      return;
    }
    
    fetchDashboardData();
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if company exists
      const companyResponse = await fetch('/api/company/profile');
      if (companyResponse.ok) {
        setHasCompany(true);
        
        // Fetch stats if company exists
        const statsResponse = await fetch('/api/company/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }
      } else {
        setHasCompany(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Employer'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            {hasCompany ? 'Manage your company and job postings' : 'Let\'s get your company set up'}
          </p>
        </div>

        {/* Company Setup Prompt */}
        {!hasCompany && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-900 mb-4">Create Your Company Profile</h3>
                  <p className="text-blue-700 mb-6 text-lg">
                    Get started by creating your company profile. This helps job seekers learn about your company and builds trust.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/employer/company/create">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                        <Building2 className="h-5 w-5 mr-2" />
                        Create Company Profile
                      </Button>
                    </Link>
                    <Link href="/employer/jobs/create">
                      <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 px-8 py-3 text-lg">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Post Job First
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        {hasCompany && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
                <Briefcase className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalJobs}</div>
                <p className="text-sm text-gray-600">
                  {stats.activeJobs} active
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
                <Users className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalApplications}</div>
                <p className="text-sm text-gray-600">
                  {stats.pendingApplications} pending
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Profile Views</CardTitle>
                <Eye className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.profileViews}</div>
                <p className="text-sm text-gray-600">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Company Rating</CardTitle>
                <Star className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.companyRating}</div>
                <p className="text-sm text-gray-600">
                  out of 5
                </p>
              </CardContent>
            </Card>
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
                            {job._count.applications} applications
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
                      <Link href={`/employer/jobs/${job.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
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
                <div className="space-y-3">
                  {stats.jobTypeDistribution.map((item) => (
                    <div key={item.jobType} className="flex items-center justify-between">
                      <span className="capitalize text-gray-700">{item.jobType || 'Not specified'}</span>
                      <Badge variant="secondary">{item._count.jobType}</Badge>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {stats.applicationStatusDistribution.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="capitalize text-gray-700">{item.status}</span>
                      <Badge variant="secondary">{item._count.status}</Badge>
                    </div>
                  ))}
                </div>
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