"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar,
  MapPin,
  DollarSign,
  Briefcase,
  MoreHorizontal,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary?: string;
  description?: string;
  isActive: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  createdAt: string;
  applications: Array<{
    id: string;
    status: string;
    appliedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count: {
    applications: number;
    bookmarks: number;
  };
}

interface JobsResponse {
  success: boolean;
  data: {
    jobs: Job[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      totalJobs: number;
      totalApplications: number;
    };
  };
}

export default function EmployerJobsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/employer/jobs');
      return;
    }
    if (session?.user?.role !== 'employer') {
      router.push('/dashboard');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchJobs();
  }, [currentPage, jobStatus, jobType, experienceLevel]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(jobStatus !== "all" && { status: jobStatus }),
        ...(jobType !== "all" && { jobType }),
        ...(experienceLevel !== "all" && { experienceLevel }),
        ...(search && { search })
      });

      const response = await fetch(`/api/employer/jobs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data: JobsResponse = await response.json();
      if (data.success) {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
        setStats(data.data.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const toggleJobStatus = async (jobId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      toast.success(`Job ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  const getStatusBadge = (job: Job) => {
    if (job.isFeatured) return <Badge className="bg-purple-100 text-purple-800">Featured</Badge>;
    if (job.isUrgent) return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
    if (job.isActive) return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-blue-100 text-blue-800';
      case 'mid': return 'bg-yellow-100 text-yellow-800';
      case 'senior': return 'bg-orange-100 text-orange-800';
      case 'lead': return 'bg-purple-100 text-purple-800';
      case 'executive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-100 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'employer') {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-100 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Management</h1>
              <p className="text-gray-600 text-lg">Manage your job postings and track applications</p>
            </div>
            <Link href="/employer/jobs/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3">
                <Plus className="h-5 w-5 mr-2" />
                Post New Job
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-3xl font-bold text-gray-900">{jobs ? jobs.filter(job => job.isActive).length : 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search jobs..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <Select value={jobStatus} onValueChange={setJobStatus}>
                  <SelectTrigger className="w-full sm:w-40 h-12">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger className="w-full sm:w-40 h-12">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger className="w-full sm:w-40 h-12">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} variant="outline" className="h-12">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                        {getStatusBadge(job)}
                        <Badge className={getExperienceLevelColor(job.experienceLevel)}>
                          {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
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
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {job._count.applications} applications
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm line-clamp-2">
                        {job.description || 'No description available'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/employer/jobs/${job.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      
                      <Link href={`/employer/applications?jobId=${job.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Applications
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleJobStatus(job.id, job.isActive)}>
                            {job.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-10"
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="h-10"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {jobs.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No jobs found</h3>
            <p className="text-gray-600 mb-8 text-lg">
              {search || jobStatus !== 'all' || jobType !== 'all' || experienceLevel !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by posting your first job to attract top talent.'
              }
            </p>
            <Link href="/employer/jobs/create">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3">
                <Plus className="h-5 w-5 mr-2" />
                Post Your First Job
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}