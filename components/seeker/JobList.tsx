'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, MapPin, Timer, TrendingUp } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  salary: string;
  location: string;
  postedAt?: string;
}

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/seeker/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data.jobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-4 mt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">{error}</div>
      </Card>
    );
  }

  if (!jobs.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No jobs found matching your profile. Please update your preferences to see more jobs.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <Building2 className="h-4 w-4" />
                <span>{job.company}</span>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${
                job.matchScore >= 80 
                  ? 'bg-green-50 text-green-700' 
                  : job.matchScore >= 60 
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-gray-50 text-gray-700'
              }`}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {job.matchScore}% Match
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4" />
              {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : 'Recent'}
            </div>
            <div className="font-medium text-gray-900">
              {job.salary}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
