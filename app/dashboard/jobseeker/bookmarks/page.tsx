"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { 
  Bookmark, 
  Heart, 
  MapPin, 
  Briefcase, 
  Clock, 
  DollarSign,
  ArrowRight,
  Trash2,
  Eye,
  Send
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";

interface BookmarkedJob {
  id: string;
  job_id: string;
  bookmarked_at: string;
  job: {
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
  };
}

export default function JobSeekerBookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching bookmarks...');
      const response = await fetch('/api/jobs/bookmarks');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Raw API Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        // Ensure data is an array and has proper structure
        const bookmarksData = Array.isArray(data.data) ? data.data : [];
        console.log('📋 Processed bookmarks array:', bookmarksData);
        
        // Validate each bookmark has required structure
        const validBookmarks = bookmarksData.filter((bookmark, index) => {
          console.log(`🔍 Validating bookmark ${index}:`, bookmark);
          
          if (!bookmark) {
            console.warn(`❌ Bookmark ${index} is null/undefined`);
            return false;
          }
          
          if (!bookmark.job) {
            console.warn(`❌ Bookmark ${index} missing job object:`, bookmark);
            return false;
          }
          
          if (typeof bookmark.job !== 'object') {
            console.warn(`❌ Bookmark ${index} job is not an object:`, bookmark.job);
            return false;
          }
          
          if (!bookmark.id) {
            console.warn(`❌ Bookmark ${index} missing id:`, bookmark);
            return false;
          }
          
          // Check for skills array specifically
          if (bookmark.job.skills !== undefined && !Array.isArray(bookmark.job.skills)) {
            console.warn(`❌ Bookmark ${index} skills is not an array:`, bookmark.job.skills);
            bookmark.job.skills = []; // Fix it
          }
          
          console.log(`✅ Bookmark ${index} is valid`);
          return true;
        });
        
        console.log(`📊 Valid bookmarks: ${validBookmarks.length}/${bookmarksData.length}`);
        setBookmarks(validBookmarks);
      } else {
        const errorMsg = data.error || 'No data received';
        console.error('❌ Failed to fetch bookmarks:', errorMsg);
        setError(errorMsg);
        setBookmarks([]);
      }
    } catch (error: any) {
      console.error('💥 Error fetching bookmarks:', error);
      setError(error.message || 'Failed to fetch bookmarks');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/jobs/bookmarks/${bookmarkId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      }
    } catch (_error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const getStatusBadge = (job: any) => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your saved jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
            <p className="text-gray-600">Your bookmarked job opportunities</p>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Bookmarks</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={fetchBookmarks} className="mr-4">
                Try Again
              </Button>
              <Link href="/jobs">
                <Button variant="outline">
                  Browse Jobs
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Add a safety wrapper for rendering
  const renderBookmarks = () => {
    try {
      console.log('🎨 Rendering bookmarks:', bookmarks);
      
      if (!bookmarks || !Array.isArray(bookmarks)) {
        console.warn('⚠️ Bookmarks is not an array:', bookmarks);
        return (
          <Card>
            <CardContent className="p-12 text-center">
              <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
              <p className="text-gray-600 mb-6">
                Start bookmarking jobs you're interested in
              </p>
              <Link href="/jobs">
                <Button className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Browse Jobs
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      }

      if (bookmarks.length === 0) {
        console.log('📭 No bookmarks found');
        return (
          <Card>
            <CardContent className="p-12 text-center">
              <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h3>
              <p className="text-gray-600 mb-6">
                Start bookmarking jobs you're interested in
              </p>
              <Link href="/jobs">
                <Button className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Browse Jobs
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
      }

      console.log(`🎯 Rendering ${bookmarks.length} bookmarks`);
      
      return (
        <div className="space-y-6">
          {bookmarks.map((bookmark, index) => {
            console.log(`🎨 Rendering bookmark ${index}:`, bookmark);
            
            if (!bookmark || !bookmark.job) {
              console.warn(`⚠️ Invalid bookmark at index ${index}:`, bookmark);
              return null;
            }
            
            try {
              return (
                <Card key={bookmark.id || `bookmark-${index}`} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{bookmark.job.title || 'Untitled Job'}</h3>
                          {getStatusBadge(bookmark.job)}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{bookmark.job.company || 'Unknown Company'}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {bookmark.job.location || 'Location not specified'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {bookmark.job.jobType || 'Job type not specified'}
                          </div>
                          {bookmark.job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {bookmark.job.salary}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {bookmark.job.createdAt ? new Date(bookmark.job.createdAt).toLocaleDateString() : 'Date not available'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          {bookmark.job.experienceLevel && (
                            <Badge className={getExperienceColor(bookmark.job.experienceLevel)}>
                              {bookmark.job.experienceLevel.charAt(0).toUpperCase() + bookmark.job.experienceLevel.slice(1)}
                            </Badge>
                          )}
                          {bookmark.job.isRemote && (
                            <Badge className="bg-green-100 text-green-800">Remote</Badge>
                          )}
                          {bookmark.job.isHybrid && (
                            <Badge className="bg-blue-100 text-blue-800">Hybrid</Badge>
                          )}
                        </div>

                        {bookmark.job.description && (
                          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                            {bookmark.job.description}
                          </p>
                        )}

                        {bookmark.job.skills && Array.isArray(bookmark.job.skills) && bookmark.job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {bookmark.job.skills.slice(0, 5).map((skill, skillIndex) => (
                              <Badge key={skillIndex} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {bookmark.job.skills.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{bookmark.job.skills.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Saved {bookmark.bookmarked_at ? new Date(bookmark.bookmarked_at).toLocaleDateString() : 'Unknown date'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {bookmark.job._count?.applications || 0} applications
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/jobs/${bookmark.job.id}/apply`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        
                        <Link href={`/jobs/${bookmark.job.id}/apply`}>
                          <Button size="sm">
                            <Send className="h-4 w-4 mr-1" />
                            Apply
                          </Button>
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveBookmark(bookmark.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            } catch (renderError) {
              console.error(`💥 Error rendering bookmark ${index}:`, renderError, bookmark);
              return (
                <Card key={`error-${index}`} className="border-red-200">
                  <CardContent className="p-4">
                    <p className="text-red-600 text-sm">Error displaying bookmark: {renderError.message}</p>
                  </CardContent>
                </Card>
              );
            }
          })}
        </div>
      );
    } catch (_error) {
      console.error('💥 Critical error in renderBookmarks:', error);
      return (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-500 text-6xl mb-4">💥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Rendering Error</h3>
            <p className="text-gray-600 mb-6">An error occurred while displaying bookmarks: {error.message}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          {/* Back Button */}
          <div className="mb-4">
            <BackButton fallbackUrl="/dashboard/jobseeker" label="Back to Dashboard" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
            <p className="text-gray-600">Your bookmarked job opportunities</p>
          </div>

          {/* Bookmarks List */}
          {renderBookmarks()}
        </div>
      </div>
    </AuthGuard>
  );
}
