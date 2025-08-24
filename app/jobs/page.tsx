"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Building, Briefcase, TrendingUp, Filter, ChevronDown } from 'lucide-react';
import { useGoogleFallback } from '@/hooks/useGoogleFallback';
import ErrorBoundary from '@/components/ErrorBoundary';

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
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg">
                {/* <Sparkles className="w-4 h-4 text-blue-600" /> */}
                AI-Powered Job Search
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Find Your Dream Job
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Discover thousands of opportunities across multiple countries with intelligent matching
              </p>
            </div>

            {/* Enhanced Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 mb-8">
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Main Search Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-6">
                  <div className="lg:col-span-2">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search jobs, companies, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 text-lg placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-700"
                  >
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-700"
                  >
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === 'All Types' ? 'All Types' : type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-700"
                  >
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {level === 'All Levels' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Advanced Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRemote}
                      onChange={(e) => setIsRemote(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <label className="text-gray-700 font-medium cursor-pointer">Remote Only</label>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeExternal}
                      onChange={(e) => setIncludeExternal(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <label className="text-gray-700 font-medium cursor-pointer">Include External Jobs</label>
                  </div>

                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-700"
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
                    className="px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 text-gray-700"
                  >
                    <option value="all">All Sources</option>
                    <option value="db">Database Only</option>
                    <option value="external">External APIs Only</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="px-6 py-3 text-gray-600 border border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium"
                    >
                      Clear Filters
                    </button>
                  </div>
                  
                  <button
                    type="submit"
                    className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Search Jobs
                  </button>
                </div>
              </form>
            </div>

            {/* Enhanced Quick Import Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 lg:p-8 mb-8 border border-blue-200/50">
              <h3 className="text-xl lg:text-2xl font-semibold text-blue-900 mb-6 flex items-center gap-3">
                {/* <Globe className="h-6 w-6" /> */}
                Quick Job Import
              </h3>
              <p className="text-blue-700 mb-6 max-w-2xl">
                Instantly populate your job search with opportunities from different countries and regions.
              </p>
              <div className="flex flex-wrap gap-3">
                {countries.slice(0, 4).map((country) => (
                  <button
                    key={country.code}
                    onClick={() => importJobsFromCountry(country.code)}
                    disabled={loading}
                    className="group px-6 py-3 bg-white text-blue-700 rounded-2xl hover:bg-blue-50 disabled:opacity-50 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-200"
                  >
                    {/* <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} /> */}
                    Import from {country.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Results Section */}
            <div className="space-y-6">
              {loading && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center gap-3 mb-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="text-xl font-medium text-gray-600">Searching for jobs...</span>
                  </div>
                  <p className="text-gray-500">This may take a few moments</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm">!</span>
                    </div>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {!loading && !error && jobs.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">No jobs found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Try adjusting your search criteria or import jobs from different countries to discover more opportunities.
                  </p>
                  <button
                    onClick={() => importJobsFromCountry('IN')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors"
                  >
                    {/* <RefreshCw className="h-4 w-4" /> */}
                    Import Sample Jobs
                  </button>
                </div>
              )}

              {!loading && !error && jobs.length > 0 && (
                <>
                  {/* Results Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20">
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        Found {jobs.length} jobs
                      </h2>
                      <div className="flex items-center gap-2 text-gray-600">
                        {/* <Zap className="w-4 h-4 text-yellow-500" /> */}
                        <span className="text-sm">
                          Showing jobs from {source === 'all' ? 'all sources' : source === 'db' ? 'database' : 'external APIs'}
                        </span>
                      </div>
                    </div>
                    
                    {googleFallback.shouldShowFallback && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
                        <TrendingUp className="w-4 h-4" />
                        Enhanced with Google Jobs
                      </div>
                    )}
                  </div>

                  {/* Enhanced Job Cards Grid */}
                  <div className="grid gap-6 lg:gap-8">
                    {jobs.map((job) => (
                      <div key={job.id} className="group bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 lg:p-8 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex-1">
                            {/* Job Title and Badges */}
                            <div className="flex items-start gap-4 mb-4">
                              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {job.title}
                              </h3>
                              <div className="flex flex-wrap gap-2 flex-shrink-0">
                                {job.isFeatured && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold rounded-full shadow-sm">
                                    ⭐ Featured
                                  </span>
                                )}
                                {job.source !== 'database' && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-400 to-indigo-400 text-white text-xs font-semibold rounded-full shadow-sm">
                                    {job.source}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Company and Location Info */}
                            <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-4">
                              <span className="flex items-center gap-2 font-medium">
                                <Building className="w-5 h-5 text-gray-400" />
                                {job.company || 'Company not specified'}
                              </span>
                              {job.location && (
                                <span className="flex items-center gap-2">
                                  <MapPin className="w-5 h-5 text-gray-400" />
                                  {job.location}
                                </span>
                              )}
                              {job.jobType && (
                                <span className="flex items-center gap-2">
                                  <Briefcase className="w-5 h-5 text-gray-400" />
                                  <span className="capitalize">{job.jobType}</span>
                                </span>
                              )}
                            </div>

                            {/* Job Description */}
                            <p className="text-gray-700 mb-6 line-clamp-3 leading-relaxed">
                              {job.description}
                            </p>

                            {/* Bottom Row */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                {job.salary && (
                                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-semibold text-lg">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {job.salary}
                                  </span>
                                )}
                                {job.isRemote && (
                                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium">
                                    🏠 Remote
                                  </span>
                                )}
                              </div>
                              
                              {job.applyUrl && (
                                <a
                                  href={job.applyUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                                >
                                  Apply Now
                                  <span className="group-hover:translate-x-1 transition-transform">→</span>
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
      </div>
    </ErrorBoundary>
  );
}
