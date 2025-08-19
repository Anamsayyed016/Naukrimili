"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Building, Briefcase, Globe, Filter, RefreshCw } from 'lucide-react';
import { useGoogleFallback } from '@/hooks/useGoogleFallback';

interface Job {
  id: string | number;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  postedAt: string | null;
  salary: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[];
  isRemote: boolean;
  isFeatured: boolean;
  source: string;
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
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || 'IN');
  const [isRemote, setIsRemote] = useState(searchParams.get('isRemote') === 'true');
  const [includeExternal, setIncludeExternal] = useState(true);
  const [source, setSource] = useState<'all' | 'db' | 'external'>('all');

  // Google fallback hook
  const googleFallback = useGoogleFallback(searchQuery, selectedLocation, jobs.length, {
    enabled: true,
    autoTrigger: true,
    minJobCount: 3
  });

  const locations = ['All Locations', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'New York', 'London', 'Dubai', 'Toronto', 'Sydney'];
  const jobTypes = ['All Types', 'full-time', 'part-time', 'contract', 'internship'];
  const experienceLevels = ['All Levels', 'entry', 'mid', 'senior', 'executive'];
  const countries = [
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'United States' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'AE', name: 'UAE' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' }
  ];

  useEffect(() => {
    fetchJobs();
  }, [searchQuery, selectedLocation, selectedJobType, selectedExperience, isRemote, selectedCountry, includeExternal, source]);

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
      if (selectedCountry) params.append('country', selectedCountry);
      if (includeExternal) params.append('includeExternal', 'true');
      if (source) params.append('source', source);

      // Use the new unified API
      const response = await fetch(`/api/jobs/unified?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
        console.log(`✅ Fetched ${data.jobs.length} jobs from ${data.sources.database ? 'database' : ''}${data.sources.external ? ' and external APIs' : ''}`);
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
    setSelectedCountry('IN');
    setIncludeExternal(true);
    setSource('all');
  };

  const importJobsFromCountry = async (countryCode: string) => {
    try {
      setLoading(true);
      console.log(`🚀 Importing jobs from ${countryCode}...`);
      
      const response = await fetch('/api/jobs/import-multi-country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countries: [countryCode],
          maxJobsPerCountry: 100
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Imported ${result.summary.totalPersisted} jobs from ${countryCode}`);
        // Refresh jobs after import
        fetchJobs();
      } else {
        console.error('Failed to import jobs');
      }
    } catch (error) {
      console.error('Error importing jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Dream Job</h1>
          <p className="text-xl text-gray-600">Discover thousands of opportunities across multiple countries</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={(e) => setIsRemote(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">Remote Only</label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeExternal}
                  onChange={(e) => setIncludeExternal(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">Include External Jobs</label>
              </div>

              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>

              <select
                value={source}
                onChange={(e) => setSource(e.target.value as 'all' | 'db' | 'external')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Sources</option>
                <option value="db">Database Only</option>
                <option value="external">External APIs Only</option>
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
                <span className="text-sm text-gray-700">Remote Only</span>
              </label>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filters
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search Jobs
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Quick Import Buttons */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Quick Job Import
          </h3>
          <div className="flex flex-wrap gap-2">
            {countries.slice(0, 4).map((country) => (
              <button
                key={country.code}
                onClick={() => importJobsFromCountry(country.code)}
                disabled={loading}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Import from {country.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching for jobs...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-8">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or import jobs from different countries.</p>
            </div>
          )}

          {!loading && !error && jobs.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Found {jobs.length} jobs
                </h2>
                <div className="text-sm text-gray-600">
                  Showing jobs from {source === 'all' ? 'all sources' : source === 'db' ? 'database' : 'external APIs'}
                </div>
              </div>

              <div className="grid gap-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          {job.isFeatured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              Featured
                            </span>
                          )}
                          {job.source !== 'database' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {job.source}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {job.company || 'Company not specified'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location || 'Location not specified'}
                          </span>
                          {job.jobType && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {job.jobType}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {job.salary && (
                              <span className="text-sm font-medium text-green-600">
                                {job.salary}
                              </span>
                            )}
                            {job.isRemote && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                Remote
                              </span>
                            )}
                          </div>
                          
                          {job.applyUrl && (
                            <a
                              href={job.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Apply Now
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
