"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Job {
  id: number;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  postedAt: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[];
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  sector: string | null;
  views: number;
  applications: number;
  createdAt: string;
  updatedAt: string;
  creator: any;
  source: string; // Added source field
  source_url: string | null; // Added source_url field
}

export default function JobDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid job ID');
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        // Use relative URL to avoid CORS issues
        const response = await fetch(`/api/jobs/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job');
        }

        const data = await response.json();
        if (data.success) {
          setJob(data.job);
        } else {
          setError(data.error || 'Failed to load job');
        }
      } catch (err) {
        setError('Failed to load job details');
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // Show loading state while fetching
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Job not found</h1>
          <p className="text-gray-600 mb-6">The job you are looking for does not exist or may have been removed.</p>
          <Link 
            href="/jobs" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 line-clamp-3">{job.title}</h1>
              <div className="text-gray-600 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-medium">{job.company || 'Unknown Company'}</span>
                <span className="hidden sm:inline">•</span>
                <span>{job.location || 'Remote'}</span>
              </div>
            </div>
            {job.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                Featured
              </span>
            )}
          </div>

          {job.salary && (
            <div className="mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-700 font-semibold text-lg">💰 {job.salary}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-gray-500 text-sm sm:text-base">Job Type:</span>
              <span className="font-medium text-sm sm:text-base">{job.jobType || 'Not specified'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-gray-500 text-sm sm:text-base">Experience:</span>
              <span className="font-medium text-sm sm:text-base">{job.experienceLevel || 'Not specified'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-gray-500 text-sm sm:text-base">Remote:</span>
              <span className="font-medium text-sm sm:text-base">{job.isRemote ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-gray-500 text-sm sm:text-base">Views:</span>
              <span className="font-medium text-sm sm:text-base">{job.views}</span>
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="prose max-w-none mb-6 sm:mb-10 text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: job.description }} />

          <div className="flex flex-col gap-3 pt-6 border-t border-gray-200">
            {job.source !== 'manual' ? (
              // External job - show enhanced external application flow
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    if (job.source_url) {
                      // Track external application click
                      try {
                        import('@/lib/jobs/external-application-tracker').then(({ trackExternalApplication }) => {
                          trackExternalApplication({
                            jobId: job.id.toString(),
                            source: job.source,
                            company: job.company || 'Unknown Company',
                            title: job.title
                          });
                        });
                      } catch (error) {
                        console.log('External tracking not available:', error);
                      }
                      window.open(job.source_url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Apply on Company Website</span>
                </button>
                
                {/* Additional info for external jobs */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">
                    This job is posted on {job.source === 'adzuna' ? 'Adzuna' : 'external platform'}
                  </p>
                  <p className="text-xs text-gray-500">
                    You'll be redirected to the company's official website
                  </p>
                </div>
              </div>
            ) : (
              // Internal job - route to internal application page
              <Link 
                href={`/jobs/${job.id}/apply`}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-base"
              >
                Apply Now
              </Link>
            )}
            
            <Link 
              href="/jobs"
              className="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-gray-700 text-center text-base"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}