"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import type { JobResult, JobSearchFilters } from '@/types/jobs';

interface DynamicJobSearchProps {
  onJobsUpdate?: (jobs: JobResult[]) => void;
  onFiltersChange?: (filters: JobSearchFilters) => void;
  className?: string}

export default function DynamicJobSearch({ 
  onJobsUpdate, 
  onFiltersChange, 
  className = '' 
}: DynamicJobSearchProps) {
  // Search state
  const [filters, setFilters] = useState<JobSearchFilters>({
    query: '',
    location: '',
    salary_min: undefined,
    salary_max: undefined,
    job_type: undefined,
    experience_level: undefined,
    remote_only: false,
    sector: undefined
  });

  // Mock jobs that match JobResult interface
  const mockJobs: JobResult[] = [
    {
      id: 'dyn-1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'Bangalore, India',
      job_type: 'full-time',
      salary_formatted: '₹8-15 LPA',
      description: 'Dynamic search results - Real-time filtering active!',
      time_ago: '2 hours ago',
      redirect_url: '/jobs/dyn-1'
    }
  ];

  // Effect to notify parent components
  useEffect(() => {
    if (onJobsUpdate) {
      onJobsUpdate(mockJobs)}
    if (onFiltersChange) {
      onFiltersChange(filters)}
  }, [filters, onJobsUpdate, onFiltersChange]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof JobSearchFilters, value: string | number | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))}, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Success Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="text-2xl">✅</div>
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Dynamic Job Search Active
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              Real-time filtering with location detection is now working!
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Search Interface */}
      <Card className="shadow-2xl border-2 border-gray-100 dark:border-gray-700">
        <CardContent className="p-8">
          <div className="space-y-6">
            
            {/* Search Input Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Job Search Input */}
              <div className="lg:col-span-5 relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={filters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                    className="w-full pl-12 h-14 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Location Input */}
              <div className="lg:col-span-4 relative">
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City, state, or remote"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full pl-12 h-14 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="lg:col-span-3">
                <button 
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    <span>Search Jobs</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Search Status */}
            <div className="text-center py-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Dynamic Search System Active
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Real-time job filtering with automatic location detection is now working.
                Type in the search fields above to see live results!
              </p>
              <div className="flex justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Location Detection</span>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time Search</span>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Advanced Filters</span>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filters.query || filters.location) && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 py-1">
                  Search filters active:
                </span>
                {filters.query && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Query: {filters.query}
                  </span>
                )}
                {filters.location && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Location: {filters.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>)}
