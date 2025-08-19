'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Building, Briefcase, Clock, Star } from 'lucide-react';
import EnhancedGoogleFallback from '@/components/EnhancedGoogleFallback';
import { useGoogleFallback } from '@/hooks/useGoogleFallback';

interface Job {
  id: number;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  salary: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  sector: string | null;
  skills: string[];
  postedAt: string | null;
  views: number;
  applications: number;
  createdAt: string;
}

export default function JobsPage() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [selectedJobType, setSelectedJobType] = useState(searchParams.get('jobType') || '');
  const [selectedExperience, setSelectedExperience] = useState(searchParams.get('experienceLevel') || '');
  const [isRemote, setIsRemote] = useState(searchParams.get('isRemote') === 'true');

  // Google fallback hook
  const googleFallback = useGoogleFallback(searchQuery, selectedLocation, jobs.length, {
    enabled: true,
    autoTrigger: true,
    minJobCount: 3
  });

  const locations = ['All Locations', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];
  const jobTypes = ['All Types', 'full-time', 'part-time', 'contract', 'internship'];
  const experienceLevels = ['All Levels', 'entry', 'mid', 'senior', 'executive'];

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, selectedLocation, selectedJobType, selectedExperience, isRemote]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedLocation && selectedLocation !== 'All Locations') params.append('location', selectedLocation);
      if (selectedJobType && selectedJobType !== 'All Types') params.append('jobType', selectedJobType);
      if (selectedExperience && selectedExperience !== 'All Levels') params.append('experienceLevel', selectedExperience);
      if (isRemote) params.append('isRemote', 'true');

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      } else {
        setError(data.error || 'Failed to load jobs');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedJobType('');
    setSelectedExperience('');
    setIsRemote(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Dream Job</h1>
          <p className="text-xl text-gray-600">Discover thousands of opportunities across India</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {locations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <select
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {jobTypes.map((type) => (
                  <option key={type} value={type}>{type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Remote jobs only</span>
              </label>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear filters
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for jobs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchJobs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {!loading && !error && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link 
                key={job.id} 
                href={`/jobs/${job.id}`}
                className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  {job.companyLogo ? (
                    <img 
                      src={job.companyLogo} 
                      alt={job.company || 'Company'} 
                      className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {job.company || 'Unknown Company'}
                          </span>
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.isFeatured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                        {job.isUrgent && (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm text-gray-600">
                      {job.jobType && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.jobType.replace('-', ' ')}</span>
                        </div>
                      )}
                      {job.experienceLevel && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          <span>{job.experienceLevel}</span>
                        </div>
                      )}
                      {job.isRemote && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>Remote</span>
                        </div>
                      )}
                      {job.postedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(job.postedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="text-gray-500 text-xs">+{job.skills.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {job.salary && (
                        <span className="text-green-700 font-semibold">{job.salary}</span>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{job.views} views</span>
                        <span>{job.applications} applications</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State - Replace with Enhanced Google Fallback */}
        {!loading && !error && jobs.length === 0 && (
          <EnhancedGoogleFallback
            searchQuery={searchQuery}
            location={selectedLocation}
            jobCount={jobs.length}
            onTryNewSearch={(newQuery, newLocation) => {
              setSearchQuery(newQuery);
              setSelectedLocation(newLocation);
              // Trigger new search
              setTimeout(() => fetchJobs(), 100);
            }}
          />
        )}
      </div>
    </div>
  );
}
