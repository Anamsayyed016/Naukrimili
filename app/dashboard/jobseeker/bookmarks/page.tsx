"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs/bookmarks');
      if (!response.ok) throw new Error('Failed to fetch bookmarks');

      const data = await response.json();
      if (data.success) {
        setBookmarks(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
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
    } catch (error) {
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Jobs</h1>
            <p className="text-gray-600">Your bookmarked job opportunities</p>
          </div>

          {/* Bookmarks List */}
          {bookmarks.length > 0 ? (
            <div className="space-y-6">
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{bookmark.job.title}</h3>
                          {getStatusBadge(bookmark.job)}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{bookmark.job.company}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {bookmark.job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {bookmark.job.jobType}
                          </div>
                          {bookmark.job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {bookmark.job.salary}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(bookmark.job.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={getExperienceColor(bookmark.job.experienceLevel)}>
                            {bookmark.job.experienceLevel.charAt(0).toUpperCase() + bookmark.job.experienceLevel.slice(1)}
                          </Badge>
                          {bookmark.job.isRemote && (
                            <Badge className="bg-green-100 text-green-800">Remote</Badge>
                          )}
                          {bookmark.job.isHybrid && (
                            <Badge className="bg-blue-100 text-blue-800">Hybrid</Badge>
                          )}
                        </div>

                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {bookmark.job.description}
                        </p>

                        {bookmark.job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {bookmark.job.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
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
                            Saved {new Date(bookmark.bookmarked_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {bookmark.job._count.applications} applications
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/jobs/${bookmark.job.id}`}>
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
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
