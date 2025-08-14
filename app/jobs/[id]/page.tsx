'use client';
import React from 'react';
import Link from 'next/link';
import { enhancedJobService } from '@/lib/enhanced-job-service';

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = parseInt(id);

  const job = await enhancedJobService.getJobById(jobId);

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-2">Job not found</h1>
        <p className="text-gray-600">The job you are looking for does not exist or may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
        <div className="text-gray-600 mb-6">{job.company || 'Unknown Company'} • {job.location || 'Remote'}</div>

        {job.salary && (
          <div className="mb-6 text-green-700 font-semibold">{job.salary}</div>
        )}

        <div className="prose max-w-none mb-10" dangerouslySetInnerHTML={{ __html: job.description }} />

        <div className="flex gap-3">
          <Link href={`/jobs/${job.id}/apply`} passHref>
            <a className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply Now</a>
          </Link>
          <Link href="/jobs" passHref>
            <a className="px-6 py-3 border rounded-lg hover:bg-gray-50">Back to Jobs</a>
          </Link>
        </div>
      </div>
    </div>
  );
}

