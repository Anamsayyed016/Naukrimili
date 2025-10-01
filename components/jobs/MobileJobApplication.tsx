"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useResponsive } from '@/components/ui/use-mobile';
import { trackExternalApplication } from '@/lib/jobs/external-application-tracker';
import { ExternalLink, Briefcase, Building, MapPin, Clock, DollarSign } from 'lucide-react';

interface MobileJobApplicationProps {
  job: {
    id: string;
    title: string;
    company: string;
    location?: string;
    salary?: string;
    source: string;
    source_url?: string;
    isRemote?: boolean;
    jobType?: string;
    experienceLevel?: string;
  };
  variant?: 'default' | 'compact' | 'full';
  onApply?: () => void;
}

export const MobileJobApplication: React.FC<MobileJobApplicationProps> = ({
  job,
  variant = 'default',
  onApply
}) => {
  const { isMobile, isTablet } = useResponsive();
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    try {
      setIsApplying(true);
      
      if (job.source !== 'manual' && job.source_url) {
        // External job - track and redirect
        trackExternalApplication({
          jobId: job.id,
          source: job.source,
          company: job.company,
          title: job.title
        });
        
        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        window.open(job.source_url, '_blank', 'noopener,noreferrer');
      } else {
        // Internal job - route to details page first
        window.open(`/jobs/${job.id}`, '_blank');
      }
      
      onApply?.();
    } catch (error) {
      console.error('Error applying for job:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const isExternal = job.source !== 'manual';
  const isCompact = variant === 'compact';
  const isFull = variant === 'full';

  if (isCompact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
            <p className="text-sm text-gray-600 truncate">{job.company}</p>
          </div>
          <Button
            onClick={handleApply}
            disabled={isApplying}
            className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </Button>
        </div>
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
        {/* Job Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <Building className="w-4 h-4" />
            <span className="font-medium">{job.company}</span>
          </div>
          
          {/* Job Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>{job.salary}</span>
              </div>
            )}
            {job.jobType && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="capitalize">{job.jobType}</span>
              </div>
            )}
            {job.experienceLevel && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="capitalize">{job.experienceLevel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Application Button */}
        <div className="space-y-3">
          <Button
            onClick={handleApply}
            disabled={isApplying}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            {isApplying ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Applying...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isExternal ? <ExternalLink className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                {isExternal ? 'Apply on Company Site' : 'Apply Now'}
              </div>
            )}
          </Button>
          
          {isExternal && (
            <p className="text-xs text-gray-500 text-center">
              You'll be redirected to the company's official website
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{job.title}</h3>
        <p className="text-sm text-gray-600 mb-2">{job.company}</p>
        
        {/* Quick Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {job.salary}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleApply}
          disabled={isApplying}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          {isApplying ? 'Applying...' : 'Apply'}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Details
        </Button>
      </div>
    </div>
  );
};
