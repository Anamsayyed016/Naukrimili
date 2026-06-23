'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EmployerAnalyticsCharts = dynamic(() => import('./EmployerAnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 h-80 animate-pulse bg-gray-50" />
      <Card className="p-6 h-80 animate-pulse bg-gray-50" />
    </div>
  ),
});

interface AnalyticsData {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalViews: number;
    applications: number;
    hireRate: string;
    topSkills: string[];
  };
  trending: {
    date: string;
    views: number;
  }[];
  jobsBreakdown: {
    id: string;
    title: string;
    views: number;
    applications: number;
    status: string;
  }[];
}

export function EmployerAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/employer/analytics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        
        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 300000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold">{data.overview.totalJobs}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold">{data.overview.activeJobs}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold">{data.overview.totalViews}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold">{data.overview.applications}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <EmployerAnalyticsCharts
        trending={data.trending}
        jobsBreakdown={data.jobsBreakdown}
      />

      {/* Top Skills */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Top Skills in Demand</h3>
        <div className="flex flex-wrap gap-2">
          {data.overview.topSkills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="px-3 py-1">
              {skill}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
