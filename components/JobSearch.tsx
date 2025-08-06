import React, { useState } from 'react';

interface SearchFilters {
  search: string;
  location: string;
  type: string;
  level: string;
  remote: boolean}

interface JobSearchProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean}

export default function JobSearch({ onSearch, loading = false }: JobSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    location: '',
    type: '',
    level: '',
    remote: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters)};

  const handleInputChange = (field: keyof SearchFilters, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))};

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Input */}
        <div>
          <input
            type="text"
            placeholder="Job title, keywords, or company"
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Location */}
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Job Type */}
          <select
            value={filters.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>

          {/* Experience Level */}
          <select
            value={filters.level}
            onChange={(e) => handleInputChange('level', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="executive">Executive</option>
          </select>

          {/* Remote Checkbox */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.remote}
              onChange={(e) => handleInputChange('remote', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Remote Only</span>
          </label>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search Jobs'}
        </button>
      </form>
    </div>)}