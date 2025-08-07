import React from "react";

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  salaryFormatted?: string;
  timeAgo?: string;
  description?: string;
  redirect_url: string;
  isUrgent?: boolean;
  isRemote?: boolean;
  jobType?: string;
}

interface JobResultsProps {
  jobs: Job[];
  isLoading: boolean;
  className?: string;
}

export default function JobResults({ jobs, isLoading, className = "" }: JobResultsProps) {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Jobs Found</h3>
        <p className="text-gray-600">Try adjusting your search criteria or filters</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {jobs.map((job) => (
        <div key={job.id} className="bg-white rounded-xl shadow-md border p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
            <div className="text-gray-700 font-medium mb-1">{job.company}</div>
            {job.location && <div className="text-gray-500 text-sm mb-2">{job.location}</div>}
            {job.salaryFormatted && <div className="text-green-600 font-semibold mb-2">{job.salaryFormatted}</div>}
            {job.description && <div className="text-gray-600 text-sm line-clamp-2 mb-2">{job.description}</div>}
          </div>
          <div className="flex items-center justify-between mt-4">
            {job.timeAgo && <div className="text-gray-400 text-xs">{job.timeAgo}</div>}
            <a
              href={job.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold"
            >
              Apply Now
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
