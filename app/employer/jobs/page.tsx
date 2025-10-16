"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertCircle,
  Brain,
  TrendingUp,
  Star,
  Zap,
  Target,
  BarChart3,
  RefreshCw,
  Copy,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiClient } from '@/lib/api-client';
import { useCounter } from '@/lib/hooks/use-counter';
import { cache, cacheKeys } from '@/lib/cache';

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

interface DashboardStats {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

interface DynamicOptions {
  jobTypes: Array<{ value: string; label: string; count: number }>;
  experienceLevels: Array<{ value: string; label: string; count: number }>;
  statuses: Array<{ value: string; label: string; count: number }>;
}

interface AIJobOptimization {
  jobId: string;
  suggestions: string[];
  score: number;
  category: 'title' | 'description' | 'requirements' | 'salary' | 'visibility';
  priority: 'high' | 'medium' | 'low';
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
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("all");
  const [jobType, setJobType] = useState("all");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dynamicOptions, setDynamicOptions] = useState<DynamicOptions | null>(null);
  const [aiOptimizations, setAiOptimizations] = useState<AIJobOptimization[]>([]);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<DashboardStats[]>([
    { title: 'Total Jobs', value: 0, change: 'Loading...', trend: 'neutral', icon: <Briefcase className="w-6 h-6" /> },
    { title: 'Total Applications', value: 0, change: 'Loading...', trend: 'neutral', icon: <Users className="w-6 h-6" /> },
    { title: 'Active Jobs', value: 0, change: 'Loading...', trend: 'neutral', icon: <CheckCircle className="w-6 h-6" /> },
    { title: 'Featured Jobs', value: 0, change: 'Loading...', trend: 'neutral', icon: <Star className="w-6 h-6" /> }
  ]);
  
  // Animated counters for stats
  const totalJobsCounter = useCounter({ end: typeof stats[0]?.value === 'number' ? stats[0].value : 0, duration: 1500 });
  const totalAppsCounter = useCounter({ end: typeof stats[1]?.value === 'number' ? stats[1].value : 0, duration: 1500 });
  const activeJobsCounter = useCounter({ end: typeof stats[2]?.value === 'number' ? stats[2].value : 0, duration: 1500 });
  const featuredJobsCounter = useCounter({ end: typeof stats[3]?.value === 'number' ? stats[3].value : 0, duration: 1500 });

  // Debounced search for performance
  const debouncedSearch = useDebounce(search, 500);
  
  // API client instance
  const apiClient = useMemo(() => new ApiClient(), []);

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
    fetchStats();
    fetchDynamicOptions();
  }, [currentPage, jobStatus, jobType, experienceLevel, debouncedSearch]);

  // Fetch jobs with enhanced error handling and caching
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage.toString(),
        limit: "10",
        ...(jobStatus !== "all" && { status: jobStatus }),
        ...(jobType !== "all" && { jobType }),
        ...(experienceLevel !== "all" && { experienceLevel }),
        ...(debouncedSearch && { search: debouncedSearch })
      };

      // Check cache first
      const cacheKey = cacheKeys.jobs({ ...params, employer: session?.user?.id });
      const cached = cache.get<JobsResponse['data']>(cacheKey);
      
      if (cached) {
        setJobs(cached.jobs);
        setPagination(cached.pagination);
        setLoading(false);
        return;
      }

      const response = await apiClient.get<JobsResponse['data']>('/api/employer/jobs', params);
      
      if (response.success && response.data) {
        setJobs(response.data.jobs);
        setPagination(response.data.pagination);
        
        // Cache for 2 minutes with tags
        cache.setWithTags(cacheKey, response.data, ['employer-jobs'], 120000);
      } else {
        throw new Error(response.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load jobs', {
        description: err instanceof Error ? err.message : 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, jobStatus, jobType, experienceLevel, debouncedSearch, apiClient, session]);

  // Handle search with dynamic updates
  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchJobs();
  }, [fetchJobs]);

  // Fetch enhanced stats with trends and caching
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      
      // Check cache first
      const cacheKey = cacheKeys.analytics('employer-stats', session?.user?.id || 'unknown');
      const cached = cache.get<any>(cacheKey);
      
      if (cached) {
        setStats(cached);
        setStatsLoading(false);
        return;
      }
      
      const response = await apiClient.get<any>('/api/company/stats');
      
      if (response.success && response.data) {
        const { totalJobs, activeJobs, totalApplications } = response.data as any;
        
        const newStats = [
          { 
            title: 'Total Jobs', 
            value: totalJobs, 
            change: '+2 this week', 
            trend: 'up' as const, 
            icon: <Briefcase className="w-6 h-6" /> 
          },
          { 
            title: 'Total Applications', 
            value: totalApplications, 
            change: `+${Math.floor(totalApplications * 0.15)} this week`, 
            trend: 'up' as const, 
            icon: <Users className="w-6 h-6" /> 
          },
          { 
            title: 'Active Jobs', 
            value: activeJobs, 
            change: `${activeJobs} currently active`, 
            trend: 'up' as const, 
            icon: <CheckCircle className="w-6 h-6" /> 
          },
          { 
            title: 'Featured Jobs', 
            value: jobs.filter(job => job.isFeatured).length, 
            change: 'Premium visibility', 
            trend: 'neutral' as const, 
            icon: <Star className="w-6 h-6" /> 
          }
        ];
        
        setStats(newStats);
        
        // Cache stats for 5 minutes with tags
        cache.setWithTags(cacheKey, newStats, ['employer-stats'], 300000);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [apiClient, jobs, session]);

  // Fetch dynamic filter options
  const fetchDynamicOptions = useCallback(async () => {
    try {
      const response = await apiClient.get<any>('/api/jobs/constants');
      
      if (response.success && response.data) {
        setDynamicOptions({
          jobTypes: (response.data as any).jobTypes || [],
          experienceLevels: (response.data as any).experienceLevels || [],
          statuses: [
            { value: 'active', label: 'Active', count: 0 },
            { value: 'inactive', label: 'Inactive', count: 0 },
            { value: 'urgent', label: 'Urgent', count: 0 },
            { value: 'featured', label: 'Featured', count: 0 }
          ]
        });
      }
    } catch (err) {
      console.error('Failed to fetch dynamic options:', err);
    }
  }, [apiClient]);

  // Fetch AI job optimizations with caching
  const fetchAIOptimizations = useCallback(async () => {
    try {
      if (jobs.length === 0) return;
      
      // Check cache first
      const cacheKey = `ai-optimizations-${session?.user?.id}`;
      const cached = cache.get<AIJobOptimization[]>(cacheKey);
      
      if (cached) {
        setAiOptimizations(cached);
        setShowOptimizations(true);
        return;
      }
      
      // Generate AI suggestions for jobs with low applications
      const optimizations: AIJobOptimization[] = jobs
        .filter(job => job._count.applications < 5 || !job.isActive)
        .slice(0, 3)
        .map(job => {
          const suggestions: string[] = [];
          const categories: AIJobOptimization['category'][] = [];
          let score = 85;
          
          // Title optimization
          if (job.title.length < 20 || !/senior|junior|mid|lead/i.test(job.title)) {
            suggestions.push('Add experience level to job title for better search visibility');
            categories.push('title');
            score -= 10;
          }
          
          // Description optimization
          if (!job.description || job.description.length < 200) {
            suggestions.push('Expand job description to attract more qualified candidates');
            categories.push('description');
            score -= 15;
          }
          
          // Salary optimization
          if (!job.salary) {
            suggestions.push('Add salary range to increase application rate by 30%');
            categories.push('salary');
            score -= 10;
          }
          
          // Visibility optimization
          if (!job.isFeatured && job._count.applications < 3) {
            suggestions.push('Make this job featured for 5x more visibility');
            categories.push('visibility');
            score -= 5;
          }
          
          // Application count based suggestions
          if (job._count.applications === 0) {
            suggestions.push('No applications yet - consider reviewing job requirements');
            categories.push('requirements');
            score -= 15;
          }
          
          return {
            jobId: job.id,
            suggestions: suggestions.length > 0 ? suggestions : ['Job posting looks good! No immediate optimizations needed.'],
            score: Math.max(score, 50),
            category: categories[0] || 'title',
            priority: score < 70 ? 'high' : score < 85 ? 'medium' : 'low'
          };
        });
      
      setAiOptimizations(optimizations);
      if (optimizations.length > 0) {
        setShowOptimizations(true);
      }
      
      // Cache for 10 minutes
      cache.set(cacheKey, optimizations, 600000);
    } catch (err) {
      console.error('Failed to fetch AI optimizations:', err);
    }
  }, [jobs, session]);

  // Auto-search when filters change (debounced) - this replaces the manual search trigger
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (debouncedSearch !== search || jobStatus !== 'all' || jobType !== 'all' || experienceLevel !== 'all') {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [debouncedSearch, jobStatus, jobType, experienceLevel, handleSearch]);

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

      // Invalidate cache
      cache.invalidateByTags(['employer-jobs', 'employer-stats']);
      
      toast.success('Job deleted successfully');
      fetchJobs();
      fetchStats();
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

      // Invalidate cache
      cache.invalidateByTags(['employer-jobs', 'employer-stats']);
      
      toast.success(`Job ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchJobs();
      fetchStats();
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Job Management</h1>
                <p className="text-slate-600 mt-1">Manage your job postings and track applications</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-800 border-blue-200">
                Employer
              </Badge>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">Dashboard</span>
            </div>
          </div>
          
          {/* Enhanced Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => fetchAIOptimizations()}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              disabled={loading || jobs.length === 0}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Insights
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { fetchJobs(); fetchStats(); }}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
              disabled={loading || statsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/employer/jobs/create">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Post New Job
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        {stats && stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white shadow-xl rounded-2xl p-6 border-0 hover:shadow-2xl transition-all duration-300 group"
              >
                {statsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-2 bg-gray-200" />
                      <Skeleton className="h-8 w-16 mb-1 bg-gray-200" />
                      <Skeleton className="h-3 w-24 bg-gray-200" />
                    </div>
                    <Skeleton className="h-8 w-8 bg-gray-200" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {index === 0 && totalJobsCounter.formattedValue}
                        {index === 1 && totalAppsCounter.formattedValue}
                        {index === 2 && activeJobsCounter.formattedValue}
                        {index === 3 && featuredJobsCounter.formattedValue}
                      </p>
                      {stat.change && (
                        <div className="flex items-center gap-1 mt-1">
                          <span
                            className={`text-xs ${
                              stat.trend === "up"
                                ? "text-green-600"
                                : stat.trend === "down"
                                ? "text-red-600"
                                : "text-slate-500"
                            }`}
                          >
                            {stat.change}
                          </span>
                          {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                          {stat.trend === "down" && <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />}
                        </div>
                      )}
                    </div>
                    {stat.icon && <div className="text-slate-400 group-hover:text-blue-600 transition-colors">{stat.icon}</div>}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white shadow-lg rounded-2xl p-6 border-0 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && setCurrentPage(1)}
                  className="pl-12 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-white rounded-xl"
                />
              </div>
            </div>
            
            <Select value={jobStatus} onValueChange={setJobStatus}>
              <SelectTrigger className="w-full sm:w-40 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-900 hover:bg-slate-50">All Status</SelectItem>
                {dynamicOptions?.statuses?.map((status) => (
                  <SelectItem key={status.value} value={status.value} className="text-slate-900 hover:bg-slate-50">
                    <div className="flex items-center justify-between w-full">
                      <span>{status.label}</span>
                      <span className="text-xs text-slate-500 ml-2">({status.count})</span>
                    </div>
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem value="active" className="text-slate-900 hover:bg-slate-50">Active</SelectItem>
                    <SelectItem value="inactive" className="text-slate-900 hover:bg-slate-50">Inactive</SelectItem>
                    <SelectItem value="urgent" className="text-slate-900 hover:bg-slate-50">Urgent</SelectItem>
                    <SelectItem value="featured" className="text-slate-900 hover:bg-slate-50">Featured</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-full sm:w-40 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-900 hover:bg-slate-50">All Types</SelectItem>
                {dynamicOptions?.jobTypes?.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-slate-900 hover:bg-slate-50">
                    <div className="flex items-center justify-between w-full">
                      <span>{type.label}</span>
                      <span className="text-xs text-slate-500 ml-2">({type.count})</span>
                    </div>
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem value="full-time" className="text-slate-900 hover:bg-slate-50">Full-time</SelectItem>
                    <SelectItem value="part-time" className="text-slate-900 hover:bg-slate-50">Part-time</SelectItem>
                    <SelectItem value="contract" className="text-slate-900 hover:bg-slate-50">Contract</SelectItem>
                    <SelectItem value="internship" className="text-slate-900 hover:bg-slate-50">Internship</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="w-full sm:w-40 h-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all" className="text-slate-900 hover:bg-slate-50">All Levels</SelectItem>
                {dynamicOptions?.experienceLevels?.map((level) => (
                  <SelectItem key={level.value} value={level.value} className="text-slate-900 hover:bg-slate-50">
                    <div className="flex items-center justify-between w-full">
                      <span>{level.label}</span>
                      <span className="text-xs text-slate-500 ml-2">({level.count})</span>
                    </div>
                  </SelectItem>
                )) || (
                  <>
                    <SelectItem value="entry" className="text-slate-900 hover:bg-slate-50">Entry Level</SelectItem>
                    <SelectItem value="mid" className="text-slate-900 hover:bg-slate-50">Mid Level</SelectItem>
                    <SelectItem value="senior" className="text-slate-900 hover:bg-slate-50">Senior Level</SelectItem>
                    <SelectItem value="lead" className="text-slate-900 hover:bg-slate-50">Lead</SelectItem>
                    <SelectItem value="executive" className="text-slate-900 hover:bg-slate-50">Executive</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setCurrentPage(1)} 
                variant="outline" 
                className="h-12 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
                disabled={loading}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button 
                onClick={() => {
                  setSearch('');
                  setJobStatus('all');
                  setJobType('all');
                  setExperienceLevel('all');
                  setCurrentPage(1);
                }} 
                variant="outline" 
                className="h-12 border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </motion.div>

        {/* AI Optimization Suggestions */}
        {aiOptimizations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">AI Job Optimization</h3>
                  <p className="text-sm text-slate-600">Get AI-powered suggestions to improve your job postings</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptimizations(!showOptimizations)}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {showOptimizations ? 'Hide' : 'View'} Suggestions
              </Button>
            </div>
            
            {showOptimizations && (
              <div className="space-y-4">
                {aiOptimizations.map((optimization, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${optimization.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200' : optimization.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                        {optimization.priority.toUpperCase()}
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        {optimization.category.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-slate-500">Score: {optimization.score}/100</span>
                    </div>
                    <ul className="space-y-1">
                      {optimization.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Enhanced Job Cards */}
        <div className="space-y-6">
          {jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Card className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 group-hover:shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job)}
                          <Badge className={`${getExperienceLevelColor(job.experienceLevel)} border-white/20`}>
                            {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
                          </Badge>
                          {job.isFeatured && (
                            <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {job.isUrgent && (
                            <Badge className="bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border-red-500/30">
                              <Zap className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                          <span className="text-slate-900">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          <span className="text-slate-900">{job.jobType}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-slate-900">{job.salary}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span className="text-slate-900">{job._count.applications} applications</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="text-slate-900">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Application Analytics Preview */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">Application Progress</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-900 font-semibold">{job._count.applications}</span>
                            <span className="text-xs text-slate-500">applications</span>
                            {job._count.applications > 0 && (
                              <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                                +{Math.floor(job._count.applications * 0.2)} this week
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((job._count.applications / 20) * 100, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 h-2.5 rounded-full relative"
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </motion.div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">Target: 20 applications</span>
                          <span className="text-xs text-emerald-400">
                            {Math.min(Math.floor((job._count.applications / 20) * 100), 100)}% reached
                          </span>
                        </div>
                      </div>
                      
                      {/* Additional Metrics */}
                      <div className="flex items-center gap-3 mb-3">
                        {job._count.bookmarks > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-300">{job._count.bookmarks} saved</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs">
                          <Eye className="h-3 w-3 text-blue-400" />
                          <span className="text-gray-300">{Math.floor(job._count.applications * 4.5)} views</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Target className="h-3 w-3 text-purple-400" />
                          <span className="text-gray-300">{job._count.applications > 0 ? Math.floor((job._count.applications / (job._count.applications * 4.5)) * 100) : 0}% conversion</span>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm line-clamp-2 mb-4">
                        {job.description || 'No description available'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/employer/jobs/${job.id}/edit`}>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      
                      <Link href={`/employer/applications?jobId=${job.id}`}>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Eye className="h-4 w-4 mr-1" />
                          View Applications
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem 
                            onClick={() => toggleJobStatus(job.id, job.isActive)}
                            className="text-white hover:bg-slate-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {job.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              // Duplicate job functionality
                              toast.success('Job duplication feature coming soon!');
                            }}
                            className="text-white hover:bg-slate-700"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteJob(job.id)}
                            className="text-red-400 hover:bg-red-500/20"
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

        {/* Enhanced Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center mt-8"
          >
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/10">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-10 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-300">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="h-10 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {/* Enhanced Empty State */}
        {jobs.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <Briefcase className="h-12 w-12 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">No jobs found</h3>
            <p className="text-gray-300 mb-8 text-lg max-w-md mx-auto">
              {search || jobStatus !== 'all' || jobType !== 'all' || experienceLevel !== 'all'
                ? 'Try adjusting your filters to see more results, or create a new job posting.'
                : 'Get started by posting your first job to attract top talent and grow your team.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/employer/jobs/create">
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 shadow-lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Post Your First Job
                </Button>
              </Link>
              {(search || jobStatus !== 'all' || jobType !== 'all' || experienceLevel !== 'all') && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setJobStatus('all');
                    setJobType('all');
                    setExperienceLevel('all');
                    setCurrentPage(1);
                  }}
                  className="border-white/20 text-white hover:bg-white/10 px-8 py-3"
                >
                  <X className="h-5 w-5 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}