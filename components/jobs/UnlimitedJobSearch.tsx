/**
 * Unlimited Job Search Component
 * Provides comprehensive job search across all sectors with advanced filtering
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Briefcase, DollarSign, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

interface UnlimitedSearchProps {
  onSearch: (params: SearchParams) => void;
  loading?: boolean;
  totalJobs?: number;
  sectors?: string[];
  countries?: string[];
}

interface SearchParams {
  query: string;
  location: string;
  country: string;
  jobType: string;
  experienceLevel: string;
  isRemote: boolean;
  salaryMin: number;
  salaryMax: number;
  sector: string;
  page: number;
  limit: number;
}

const JOB_TYPES = [
  'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary'
];

const EXPERIENCE_LEVELS = [
  'Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Intern'
];

const SECTORS = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales',
  'Engineering', 'Retail', 'Hospitality', 'Manufacturing', 'Consulting',
  'Government', 'Nonprofit', 'All Sectors'
];

const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'UAE' }
];

export default function UnlimitedJobSearch({ 
  onSearch, 
  loading = false, 
  totalJobs = 0,
  sectors = [],
  countries = []
}: UnlimitedSearchProps) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    location: '',
    country: 'IN',
    jobType: '',
    experienceLevel: '',
    isRemote: false,
    salaryMin: 0,
    salaryMax: 200000,
    sector: '',
    page: 1,
    limit: 50
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Update active filters when search params change
  useEffect(() => {
    const filters: string[] = [];
    if (searchParams.jobType) filters.push(`Job Type: ${searchParams.jobType}`);
    if (searchParams.experienceLevel) filters.push(`Experience: ${searchParams.experienceLevel}`);
    if (searchParams.isRemote) filters.push('Remote');
    if (searchParams.salaryMin > 0) filters.push(`Min Salary: $${searchParams.salaryMin.toLocaleString()}`);
    if (searchParams.salaryMax < 200000) filters.push(`Max Salary: $${searchParams.salaryMax.toLocaleString()}`);
    if (searchParams.sector) filters.push(`Sector: ${searchParams.sector}`);
    setActiveFilters(filters);
  }, [searchParams]);

  const handleSearch = () => {
    onSearch(searchParams);
  };

  const handleClearFilters = () => {
    setSearchParams({
      query: searchParams.query,
      location: searchParams.location,
      country: searchParams.country,
      jobType: '',
      experienceLevel: '',
      isRemote: false,
      salaryMin: 0,
      salaryMax: 200000,
      sector: '',
      page: 1,
      limit: 50
    });
  };

  const removeFilter = (filterToRemove: string) => {
    if (filterToRemove.includes('Job Type:')) {
      setSearchParams(prev => ({ ...prev, jobType: '' }));
    } else if (filterToRemove.includes('Experience:')) {
      setSearchParams(prev => ({ ...prev, experienceLevel: '' }));
    } else if (filterToRemove === 'Remote') {
      setSearchParams(prev => ({ ...prev, isRemote: false }));
    } else if (filterToRemove.includes('Min Salary:')) {
      setSearchParams(prev => ({ ...prev, salaryMin: 0 }));
    } else if (filterToRemove.includes('Max Salary:')) {
      setSearchParams(prev => ({ ...prev, salaryMax: 200000 }));
    } else if (filterToRemove.includes('Sector:')) {
      setSearchParams(prev => ({ ...prev, sector: '' }));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Main Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Query */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search for any job, company, or keyword..."
                  value={searchParams.query}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, query: e.target.value }))}
                  className="pl-10 h-12 text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Location */}
            <div className="w-full lg:w-64">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Location"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch}
              disabled={loading}
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search Jobs
                </div>
              )}
            </Button>
          </div>

          {/* Quick Stats */}
          {totalJobs > 0 && (
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">{totalJobs.toLocaleString()} jobs available</span>
              {sectors.length > 0 && (
                <span>across {sectors.length} sectors</span>
              )}
              {countries.length > 0 && (
                <span>in {countries.length} countries</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {activeFilters.map((filter, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                {filter}
                <button
                  onClick={() => removeFilter(filter)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* Advanced Filters Toggle */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Advanced Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <Select
                  value={searchParams.country}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <Select
                  value={searchParams.jobType}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, jobType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any job type</SelectItem>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <Select
                  value={searchParams.experienceLevel}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, experienceLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any experience level</SelectItem>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sector
                </label>
                <Select
                  value={searchParams.sector}
                  onValueChange={(value) => setSearchParams(prev => ({ ...prev, sector: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any sector</SelectItem>
                    {SECTORS.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remote Work */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remote"
                  checked={searchParams.isRemote}
                  onCheckedChange={(checked) => setSearchParams(prev => ({ ...prev, isRemote: !!checked }))}
                />
                <label htmlFor="remote" className="text-sm font-medium text-gray-700">
                  Remote work only
                </label>
              </div>
            </div>

            {/* Salary Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Range (USD)
              </label>
              <div className="px-4">
                <Slider
                  value={[searchParams.salaryMin, searchParams.salaryMax]}
                  onValueChange={([min, max]) => setSearchParams(prev => ({ 
                    ...prev, 
                    salaryMin: min, 
                    salaryMax: max 
                  }))}
                  max={200000}
                  min={0}
                  step={5000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>${searchParams.salaryMin.toLocaleString()}</span>
                  <span>${searchParams.salaryMax.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Results Per Page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results Per Page
              </label>
              <Select
                value={searchParams.limit.toString()}
                onValueChange={(value) => setSearchParams(prev => ({ 
                  ...prev, 
                  limit: parseInt(value),
                  page: 1 
                }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Suggestions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Popular Searches</h3>
        <div className="flex flex-wrap gap-2">
          {[
            'Software Engineer', 'Data Scientist', 'Marketing Manager', 'Sales Representative',
            'Nurse', 'Teacher', 'Accountant', 'Project Manager', 'Designer', 'Developer',
            'Remote Jobs', 'Entry Level', 'Senior Level', 'Part Time', 'Full Time'
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchParams(prev => ({ ...prev, query: suggestion }));
                handleSearch();
              }}
              className="text-sm"
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
