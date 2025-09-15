"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign,
  Heart,
  Building2,
  Calendar,
  ArrowRight,
  TrendingUp,
  Users
} from "lucide-react";
import Link from "next/link";
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
  distance?: number | null;
  _count: {
    applications: number;
    bookmarks: number;
  };
}

export default function JobsPage() {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const searchParams = useSearchParams();

  // Extract search parameters from URL
  const getSearchParams = useCallback(() => {
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const jobType = searchParams.get('jobType') || 'all';
    const experienceLevel = searchParams.get('experienceLevel') || 'all';
    const isRemote = searchParams.get('isRemote') === 'true';
    const salaryMin = searchParams.get('salaryMin') || '';
    const salaryMax = searchParams.get('salaryMax') || '';
    const lat = searchParams.get('lat') || '';
    const lng = searchParams.get('lng') || '';
    const radius = searchParams.get('radius') || '25';
    const sortByDistance = searchParams.get('sortByDistance') === 'true';

    return {
      query,
      location,
      jobType,
      experienceLevel,
      isRemote,
      salaryMin,
      salaryMax,
      lat,
      lng,
      radius,
      sortByDistance
    };
  }, [searchParams]);

  const fetchJobs = useCallback(async () => {
    try {
      console.log('🔄 Starting fetchJobs...');
      setLoading(true);
      const searchParams = getSearchParams();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        query: searchParams.query,
        location: searchParams.location,
        jobType: searchParams.jobType,
        experienceLevel: searchParams.experienceLevel,
        isRemote: searchParams.isRemote.toString(),
        salaryMin: searchParams.salaryMin,
        salaryMax: searchParams.salaryMax,
        lat: searchParams.lat,
        lng: searchParams.lng,
        radius: searchParams.radius,
        sortByDistance: searchParams.sortByDistance.toString()
      });

      const apiUrl = `/api/jobs/unified?${params}&includeExternal=true`;
      console.log('🔍 Fetching jobs from:', apiUrl);
      console.log('📋 Search params:', Object.fromEntries(params.entries()));

      const response = await fetch(apiUrl);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);

      if (data.success && data.jobs) {
        setJobs(data.jobs);
        setTotalPages(Math.ceil(data.total / 12) || 1);
        console.log('📋 Jobs data:', data.jobs);
      } else {
        console.error('❌ API returned error:', data.error);
        setJobs([]);
      }
    } catch (error) {
      console.error('💥 Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
      console.log('🏁 fetchJobs completed');
    }
  }, [currentPage, getSearchParams]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/jobs/bookmarks');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookmarkedJobs(data.bookmarks || []);
        }
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const toggleBookmark = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBookmarkedJobs(prev => 
            prev.includes(jobId) 
              ? prev.filter(id => id !== jobId)
              : [...prev, jobId]
          );
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchBookmarks();
  }, []);

  // Fetch jobs when page or search params change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Reset page when search params change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-blue-100 text-blue-800 border-2 border-blue-200';
      case 'mid': return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200';
      case 'senior': return 'bg-orange-100 text-orange-800 border-2 border-orange-200';
      case 'lead': return 'bg-purple-100 text-purple-800 border-2 border-purple-200';
      case 'executive': return 'bg-red-100 text-red-800 border-2 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-2 border-gray-200';
    }
  };

  // Error boundary for job rendering - ensure all jobs are valid
  React.useEffect(() => {
    if (jobs.some(job => !job || !job.id || typeof job.id !== 'string')) {
      console.error('❌ Invalid job data detected:', jobs);
      const validJobs = jobs.filter(job => 
        job && 
        job.id && 
        typeof job.id === 'string' && 
        typeof job.title === 'string'
      );
      setJobs(validJobs);
    }
  }, [jobs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Job Listings
          </h1>
          <p className="text-blue-100 text-lg">
            {jobs.length > 0 
              ? `Found ${jobs.length} jobs matching your criteria`
              : 'Discover amazing job opportunities'
            }
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-4 border-blue-300 opacity-20"></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Finding the best jobs for you...</h3>
              <p className="text-gray-600">Our AI is analyzing thousands of opportunities</p>
            </div>
          </div>
        )}

        {/* No Jobs Found */}
        {!loading && jobs.length === 0 && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Search className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">No jobs found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or location filters</p>
              <Link
                href="/"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Try New Search
              </Link>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && jobs.length > 0 && (
          <>
            <div className={`grid gap-6 ${
              isMobile ? 'grid-cols-1' :
              isTablet ? 'grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {jobs.map((job, index) => {
                try {
                  return (
                    <Card key={job.id} className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-white shadow-xl rounded-2xl overflow-hidden">
                      <CardContent className="p-0">
                        {/* Job Header */}
                        <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 border-b border-gray-100">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3">
                                {job.isFeatured && (
                                  <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-0 text-xs font-bold">
                                    ⭐ Featured
                                  </Badge>
                                )}
                                {job.isUrgent && (
                                  <Badge className="bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-0 text-xs font-bold">
                                    🔥 Urgent
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
                                {job.title}
                              </h3>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-white" />
                            </div>
                            <p className="text-gray-700 font-semibold truncate">{job.company || 'Company'}</p>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleBookmark(job.id)}
                            className={`absolute top-4 right-4 h-10 w-10 p-0 rounded-xl transition-all duration-200 ${
                              bookmarkedJobs.includes(job.id)
                                ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-red-300 hover:text-red-600'
                            }`}
                          >
                            <Heart className={`h-5 w-5 ${bookmarkedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                          </Button>
                        </div>

                        {/* Job Details */}
                        <div className="p-6 space-y-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <span className="text-gray-700 font-medium truncate">{job.location || 'Location'}</span>
                                {job.distance && (
                                  <Badge className="ml-2 bg-blue-100 text-blue-700 border-0 text-xs font-bold px-2 py-1">
                                    {job.distance.toFixed(1)} km
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                                <Briefcase className="h-4 w-4 text-green-600" />
                                <span className="text-gray-700 font-medium capitalize">{job.jobType || 'Full-time'}</span>
                              </div>
                              
                              {job.salary && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="text-green-700 font-bold">{job.salary}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600 text-sm">Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Experience and Work Type Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${getExperienceColor(job.experienceLevel)} font-bold px-3 py-1 rounded-lg`}>
                              {job.experienceLevel || 'All Levels'}
                            </Badge>
                            {job.isRemote && (
                              <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-0 font-bold px-3 py-1 rounded-lg">Remote</Badge>
                            )}
                            {job.isHybrid && (
                              <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 font-bold px-3 py-1 rounded-lg">Hybrid</Badge>
                            )}
                          </div>
                          
                          {/* Job Description */}
                          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                            {job.description || 'Job description not available'}
                          </p>
                          
                          {/* Skills */}
                          {job.skills && job.skills.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {job.skills.slice(0, 3).map((skill, skillIndex) => (
                                  <Badge key={skillIndex} variant="outline" className="text-xs font-medium border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 px-3 py-1 rounded-lg">
                                    {skill}
                                  </Badge>
                                ))}
                                {job.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs font-medium border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-3 py-1 rounded-lg">
                                    +{job.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Job Footer */}
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="font-semibold">{job._count?.applications || 0} applications</span>
                            </div>
                            <Link href={`/jobs/${job.id}`}>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-6 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                              >
                                View Details
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } catch (error) {
                  console.error(`❌ Error rendering job at index ${index}:`, error, job);
                  return null;
                }
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center gap-2 bg-white rounded-xl shadow-xl border-2 border-gray-200 p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 font-medium"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : 'border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 font-medium"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}