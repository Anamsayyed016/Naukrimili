"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign,
  Heart,
  Bookmark,
  Star,
  Building2,
  Calendar,
  ArrowRight,
  X,
  SlidersHorizontal,
  TrendingUp,
  Users,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useResponsive } from "@/components/ui/use-mobile";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary?: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  createdAt: string;
  description: string;
  skills: string[];
  _count: {
    applications: number;
    bookmarks: number;
  };
}

export default function JobsPage() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    jobType: 'all',
    experienceLevel: 'all',
    isRemote: false,
    salaryMin: '',
    salaryMax: ''
  });
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchJobs();
    fetchBookmarks();
  }, [currentPage, filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(filters.query && { query: filters.query }),
        ...(filters.location && { location: filters.location }),
        ...(filters.jobType !== 'all' && { jobType: filters.jobType }),
        ...(filters.experienceLevel !== 'all' && { experienceLevel: filters.experienceLevel }),
        ...(filters.isRemote && { isRemote: 'true' }),
        ...(filters.salaryMin && { salaryMin: filters.salaryMin }),
        ...(filters.salaryMax && { salaryMax: filters.salaryMax })
      });

      const response = await fetch(`/api/jobs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      if (data.success) {
        setJobs(data.data.jobs);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/jobs/bookmarks');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookmarkedJobs(data.data.map((bookmark: any) => bookmark.job_id));
        }
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const handleBookmark = async (jobId: string) => {
    try {
      const isBookmarked = bookmarkedJobs.includes(jobId);
      
      const response = await fetch('/api/jobs/bookmarks', {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        if (isBookmarked) {
          setBookmarkedJobs(prev => prev.filter(id => id !== jobId));
        } else {
          setBookmarkedJobs(prev => [...prev, jobId]);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      jobType: 'all',
      experienceLevel: 'all',
      isRemote: false,
      salaryMin: '',
      salaryMax: ''
    });
  };

  const getStatusBadge = (job: Job) => {
    if (job.isFeatured) return <Badge className="bg-purple-100 text-purple-800">Featured</Badge>;
    if (job.isUrgent) return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
    return null;
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

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative container mx-auto px-4 py-12 sm:py-16 lg:py-20">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                Find Your Dream Job
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-12 max-w-2xl mx-auto">
                Discover opportunities from top companies worldwide with our AI-powered job matching platform
              </p>
              
              {/* Enhanced Search Bar */}
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 sm:p-3">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Job title, keywords, or company"
                        value={filters.query}
                        onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 text-gray-900 placeholder-gray-500 border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-xl text-base sm:text-lg"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Location or remote"
                        value={filters.location}
                        onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 sm:py-4 text-gray-900 placeholder-gray-500 border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-xl text-base sm:text-lg"
                      />
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-base sm:text-lg"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Search Jobs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Advanced Filters */}
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full sm:w-auto"
                >
                  {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>

              {showAdvancedFilters && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Select value={filters.jobType} onValueChange={(value) => setFilters(prev => ({ ...prev, jobType: value }))}>
                      <SelectTrigger className="h-12">
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

                    <Select value={filters.experienceLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Experience Level" />
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

                    <Input
                      placeholder="Min Salary"
                      value={filters.salaryMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
                      type="number"
                      className="h-12"
                    />

                    <Input
                      placeholder="Max Salary"
                      value={filters.salaryMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
                      type="number"
                      className="h-12"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote"
                        checked={filters.isRemote}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, isRemote: !!checked }))}
                      />
                      <Label htmlFor="remote" className="text-sm font-medium">Remote Work</Label>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium">{jobs.length} jobs found</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Jobs Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Finding the best jobs for you...</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              isMobile ? 'grid-cols-1' : 
              isTablet ? 'grid-cols-1 sm:grid-cols-2' : 
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {jobs.map((job) => (
                <Card key={job.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-0 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          {getStatusBadge(job)}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="text-gray-600 truncate">{job.company}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark(job.id)}
                        className={`p-2 hover:bg-red-50 transition-colors ${
                          bookmarkedJobs.includes(job.id) ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${bookmarkedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-green-500" />
                          <span className="capitalize">{job.jobType}</span>
                        </div>
                      </div>
                      
                      {job.salary && (
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge className={`${getExperienceColor(job.experienceLevel)} font-medium`}>
                        {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
                      </Badge>
                      {job.isRemote && (
                        <Badge className="bg-green-100 text-green-800 font-medium">Remote</Badge>
                      )}
                      {job.isHybrid && (
                        <Badge className="bg-blue-100 text-blue-800 font-medium">Hybrid</Badge>
                      )}
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>

                    {job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {job.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs font-medium border-gray-200 hover:border-blue-300 transition-colors">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs font-medium border-gray-200">
                            +{job.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{job._count.applications} applications</span>
                      </div>
                      <Link href={`/jobs/${job.id}`}>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          View Details
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg p-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg ${
                          currentPage === pageNum 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {jobs.length === 0 && !loading && (
            <Card className="mt-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full blur-3xl opacity-50"></div>
                  <Briefcase className="relative h-20 w-20 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No jobs found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We couldn't find any jobs matching your criteria. Try adjusting your search filters or browse all available positions.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(true)}
                    className="px-6 py-3 rounded-lg font-medium"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Adjust Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}