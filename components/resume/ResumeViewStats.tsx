"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Building, 
  User, 
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ResumeViewStats {
  totalViews: number;
  uniqueViewers: number;
  employerViews: number;
  adminViews: number;
  recentViews: Array<{
    viewerName: string;
    viewerType: string;
    companyName?: string;
    viewedAt: Date;
  }>;
}

interface ResumeViewStatsProps {
  resumeId: string;
  resumeName: string;
}

export default function ResumeViewStats({ resumeId, resumeName }: ResumeViewStatsProps) {
  const [stats, setStats] = useState<ResumeViewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [resumeId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/resumes/${resumeId}/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch view statistics",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching resume stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch view statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getViewerTypeIcon = (type: string) => {
    switch (type) {
      case 'employer':
        return <Building className="h-4 w-4 text-blue-600" />;
      case 'admin':
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getViewerTypeBadge = (type: string) => {
    switch (type) {
      case 'employer':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Employer</Badge>;
      case 'admin':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Admin</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            View Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            View Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No view statistics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            View Statistics
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="p-1"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="h-4 w-4 text-gray-600" />
              <span className="text-2xl font-bold text-gray-900">{stats.totalViews}</span>
            </div>
            <p className="text-sm text-gray-600">Total Views</p>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Building className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">{stats.employerViews}</span>
            </div>
            <p className="text-sm text-blue-600">Employer Views</p>
          </div>
        </div>

        {/* Recent Views */}
        {expanded && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Views
            </h4>
            
            {stats.recentViews.filter(view => view.viewerType === 'employer').length > 0 ? (
              <div className="space-y-3">
                {stats.recentViews.filter(view => view.viewerType === 'employer').map((view, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getViewerTypeIcon(view.viewerType)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{view.viewerName}</p>
                        {view.companyName && (
                          <p className="text-xs text-gray-600">{view.companyName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getViewerTypeBadge(view.viewerType)}
                      <span className="text-xs text-gray-500">
                        {formatDate(view.viewedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No employer views yet</p>
            )}
          </div>
        )}

        {/* View Trend Indicator */}
        {stats.totalViews > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Your resume is getting attention! 🎉
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              {stats.employerViews > 0 
                ? `${stats.employerViews} employer${stats.employerViews > 1 ? 's' : ''} have viewed your resume`
                : 'Keep applying to jobs to increase visibility'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
