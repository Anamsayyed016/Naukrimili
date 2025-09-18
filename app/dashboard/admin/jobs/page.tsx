"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Star,
  Filter,
  Search,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Edit,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";

interface Job {
  id: number;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  country: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sector?: string;
  views: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  companyVerified: boolean;
  companyIndustry?: string;
  creator?: {
    name?: string;
    email: string;
    role: string;
  };
  applicationsCount: number;
  bookmarksCount: number;
}

interface JobFilters {
  status: string;
  company: string;
  location: string;
  jobType: string;
  isRemote: boolean;
  isFeatured: boolean;
  isUrgent: boolean;
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [filters, setFilters] = useState<JobFilters>({
    status: 'all',
    company: '',
    location: '',
    jobType: 'all',
    isRemote: false,
    isFeatured: false,
    isUrgent: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchJobs();
  }, [filters, currentPage, sortBy, sortOrder]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.company && { company: filters.company }),
        ...(filters.location && { location: filters.location }),
        ...(filters.jobType && filters.jobType !== 'all' && { jobType: filters.jobType }),
        ...(filters.isRemote && { isRemote: 'true' }),
        ...(filters.isFeatured && { isFeatured: 'true' }),
        ...(filters.isUrgent && { isUrgent: 'true' })
      });

      const response = await fetch(`/api/admin/jobs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setJobs(data.data.jobs || []);
          setTotalPages(data.data.pagination?.totalPages || 1);
          setTotalJobs(data.data.pagination?.total || 0);
        } else {
          console.error('API returned error:', data.error);
          setJobs([]);
          setTotalPages(1);
          setTotalJobs(0);
        }
      } else {
        console.error('Failed to fetch jobs:', response.status, response.statusText);
        setJobs([]);
        setTotalPages(1);
        setTotalJobs(0);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setTotalPages(1);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedJobs.length === 0) return;

    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          jobIds: selectedJobs,
          reason: `Bulk ${action} by admin`
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedJobs([]);
          await fetchJobs();
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const toggleJobSelection = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(job => job.id));
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      company: '',
      location: '',
      jobType: 'all',
      isRemote: false,
      isFeatured: false,
      isUrgent: false
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (job: Job) => {
    if (!job.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (job.isFeatured) {
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Featured</Badge>;
    }
    if (job.isUrgent) {
      return <Badge variant="destructive">Urgent</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-4 mt-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600 mt-2">Manage and moderate all job postings</p>
          </div>
          <Button 
            onClick={refreshJobs} 
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Job Type</label>
                <Select value={filters.jobType} onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Company</label>
                <Input
                  placeholder="Search company..."
                  value={filters.company}
                  onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  placeholder="Search location..."
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remote"
                  checked={filters.isRemote}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isRemote: !!checked }))}
                />
                <label htmlFor="remote" className="text-sm">Remote Only</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={filters.isFeatured}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isFeatured: !!checked }))}
                />
                <label htmlFor="featured" className="text-sm">Featured Only</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urgent"
                  checked={filters.isUrgent}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isUrgent: !!checked }))}
                />
                <label htmlFor="urgent" className="text-sm">Urgent Only</label>
              </div>

              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedJobs.length} job(s) selected
                  </span>
                  <Button
                    onClick={() => setSelectedJobs([])}
                    variant="outline"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleBulkAction('approve')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('reject')}
                    size="sm"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('feature')}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Feature
                  </Button>
                  <Button
                    onClick={() => handleBulkAction('delete')}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Jobs ({totalJobs})</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="views">Views</SelectItem>
                    <SelectItem value="applicationsCount">Applications</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  variant="outline"
                  size="sm"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-500">Try adjusting your filters or check back later.</p>
                </div>
              ) : (
                jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedJobs.includes(job.id)}
                      onCheckedChange={() => toggleJobSelection(job.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {job.title}
                            </h3>
                            {getStatusBadge(job)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {job.company}
                              {job.companyVerified && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(job.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        {job.jobType && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.jobType.replace('-', ' ')}
                          </span>
                        )}
                        {job.experienceLevel && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {job.experienceLevel}
                          </span>
                        )}
                        {job.isRemote && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Remote
                          </span>
                        )}
                        {job.salary && (
                          <span className="text-green-700 font-medium">
                            {job.salary}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {job.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.applicationsCount} applications
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {job.bookmarksCount || 0} bookmarks
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link href={`/jobs/${job.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages} ({totalJobs} total jobs)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
