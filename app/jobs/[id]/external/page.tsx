'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, ArrowLeft, Building2, MapPin, Clock, DollarSign, Briefcase, Globe } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobType?: string;
  experienceLevel?: string;
  isRemote?: boolean;
  source_url?: string;
  skills?: string[];
  postedAt?: string;
}

export default function ExternalJobApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setJob(data.job);
        } else {
          setError(data.error || 'Failed to fetch job details');
        }
      } else {
        setError('Failed to fetch job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const handleExternalApply = () => {
    if (job?.source_url) {
      window.open(job.source_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 mb-6">
            <h1 className="text-3xl font-bold mb-4 text-red-900">Job Not Found</h1>
            <p className="text-lg text-red-700 mb-6">{error || 'The job you are looking for could not be found.'}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/jobs" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/jobs/${jobId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Job Details
          </Link>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ExternalLink className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-blue-900 mb-2">External Job Application</h1>
                <p className="text-blue-700">
                  This job was sourced from an external platform. You will apply directly on the company's website.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{job.company}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
            
            {job.jobType && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{job.jobType}</span>
              </div>
            )}
            
            {job.experienceLevel && (
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span>{job.experienceLevel}</span>
              </div>
            )}
            
            {job.isRemote && (
              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="w-4 h-4" />
                <span>Remote</span>
              </div>
            )}
            
            {job.salary && (
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>{job.salary}</span>
              </div>
            )}
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
            <div className="prose max-w-none text-gray-700">
              <p>{job.description}</p>
            </div>
          </div>

          {job.postedAt && (
            <div className="text-sm text-gray-500 mb-6">
              Posted: {new Date(job.postedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleExternalApply}
            disabled={!job.source_url}
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center gap-2 text-lg"
          >
            <ExternalLink className="w-5 h-5" />
            Apply on Company Site
          </button>
          
          <Link 
            href={`/jobs/${jobId}`}
            className="px-8 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-700 font-medium text-center text-lg"
          >
            View Job Details
          </Link>
          
          <Link 
            href="/jobs" 
            className="px-8 py-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-700 font-medium text-center text-lg"
          >
            Back to Jobs
          </Link>
        </div>

        {/* Additional Information */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About External Applications</h3>
          <div className="text-gray-700 space-y-2">
            <p>• You will be redirected to the company's official website to complete your application</p>
            <p>• Make sure to have your resume and cover letter ready</p>
            <p>• The application process may vary depending on the company's requirements</p>
            <p>• You can always return to our job portal to search for more opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );
}
