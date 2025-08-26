import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Disable static generation for this dynamic route
// Cache job pages briefly for speed while staying fresh
export const revalidate = 60; // seconds

// Generate static params for build (empty for dynamic routes)
export async function generateStaticParams() {
  // This route is dynamic and should not be statically generated
  return [];
}

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
}

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  // Fetch job data server-side
  let job: Job | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch job');
    }

    const data = await response.json();
    if (data.success) {
      job = data.job;
    } else {
      error = data.error || 'Failed to load job';
    }
  } catch (err) {
    error = 'Failed to load job details';
    console.error('Error fetching job:', err);
  }

  // Show loading state while fetching
  if (!job && !error) {
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{job.title}</h1>
              <div className="text-gray-600 flex items-center gap-4">
                <span>{job.company || 'Unknown Company'}</span>
                <span>•</span>
                <span>{job.location || 'Remote'}</span>
              </div>
            </div>
            {job.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Featured
              </span>
            )}
          </div>

          {job.salary && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-700 font-semibold">💰 {job.salary}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Job Type:</span>
              <span className="font-medium">{job.jobType || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Experience:</span>
              <span className="font-medium">{job.experienceLevel || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Remote:</span>
              <span className="font-medium">{job.isRemote ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Views:</span>
              <span className="font-medium">{job.views}</span>
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="prose max-w-none mb-10" dangerouslySetInnerHTML={{ __html: job.description }} />

          <div className="flex gap-3 pt-6 border-t border-gray-200">
            {job.id.toString().startsWith('ext-') ? (
              <a 
                href={job.applyUrl || `/jobs/external/${job.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Apply on External Site
              </a>
            ) : (
              <Link 
                href={`/jobs/${job.id}/apply`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                Apply Now
              </Link>
            )}
            <Link 
              href="/jobs"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-700"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

