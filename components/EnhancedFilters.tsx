'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FunnelIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CalendarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { JobSearchFilters, FilterOption } from '@/types/jobs';

interface EnhancedFiltersProps {
  filters: JobSearchFilters;
  onFiltersChange: (filters: Partial<JobSearchFilters>) => void;
  onReset: () => void;
  availableFilters?: {
    jobTypes: FilterOption[];
    experienceLevels: FilterOption[];
    sectors: FilterOption[];
    locations: FilterOption[];
    companies: FilterOption[];
  };
  isLoading?: boolean;
  className?: string;
}

export default function EnhancedFilters({
  filters,
  onFiltersChange,
  onReset,
  availableFilters,
  isLoading = false,
  className = ''
}: EnhancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Job type options
  const jobTypeOptions = [
    { value: 'full-time', label: 'Full-time', count: availableFilters?.jobTypes?.find(jt => jt.value === 'full-time')?.count || 0 },
    { value: 'part-time', label: 'Part-time', count: availableFilters?.jobTypes?.find(jt => jt.value === 'part-time')?.count || 0 },
    { value: 'contract', label: 'Contract', count: availableFilters?.jobTypes?.find(jt => jt.value === 'contract')?.count || 0 },
    { value: 'internship', label: 'Internship', count: availableFilters?.jobTypes?.find(jt => jt.value === 'internship')?.count || 0 },
    { value: 'freelance', label: 'Freelance', count: availableFilters?.jobTypes?.find(jt => jt.value === 'freelance')?.count || 0 }
  ];

  // Experience level options
  const experienceOptions = [
    { value: 'entry', label: 'Entry Level (0-2 years)', count: availableFilters?.experienceLevels?.find(el => el.value === 'entry')?.count || 0 },
    { value: 'mid', label: 'Mid Level (2-5 years)', count: availableFilters?.experienceLevels?.find(el => el.value === 'mid')?.count || 0 },
    { value: 'senior', label: 'Senior Level (5-10 years)', count: availableFilters?.experienceLevels?.find(el => el.value === 'senior')?.count || 0 },
    { value: 'lead', label: 'Lead/Executive (10+ years)', count: availableFilters?.experienceLevels?.find(el => el.value === 'lead')?.count || 0 }
  ];

  // Date posted options
  const datePostedOptions = [
    { value: '1', label: 'Last 24 hours' },
    { value: '7', label: 'Last week' },
    { value: '30', label: 'Last month' },
    { value: 'any', label: 'Any time' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'salary_high', label: 'Highest Salary' },
    { value: 'salary_low', label: 'Lowest Salary' }
  ];

  // Salary ranges for different currencies
  const salaryRanges = {
    INR: [
      { min: 0, max: 300000, label: 'Up to ₹3 LPA' },
      { min: 300000, max: 500000, label: '₹3-5 LPA' },
      { min: 500000, max: 800000, label: '₹5-8 LPA' },
      { min: 800000, max: 1200000, label: '₹8-12 LPA' },
      { min: 1200000, max: 2000000, label: '₹12-20 LPA' },
      { min: 2000000, max: null, label: '₹20+ LPA' }
    ],
    USD: [
      { min: 0, max: 40000, label: 'Up to $40K' },
      { min: 40000, max: 60000, label: '$40K-60K' },
      { min: 60000, max: 80000, label: '$60K-80K' },
      { min: 80000, max: 120000, label: '$80K-120K' },
      { min: 120000, max: 200000, label: '$120K-200K' },
      { min: 200000, max: null, label: '$200K+' }
    ]
  };

  const currentSalaryRanges = salaryRanges[filters.country === 'US' ? 'USD' : 'INR'];

  // Count active filters
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'query' || key === 'location') return count; // Don't count main search fields
    if (value && value !== '' && value !== 'any' && value !== 'relevance') {
      return count + 1;
    }
    return count;
  }, 0);

  const handleFilterChange = (key: keyof JobSearchFilters, value: string | number | string[] | boolean | undefined) => {
    onFiltersChange({ [key]: value });
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const FilterSection = ({ 
    title, 
    icon, 
    sectionKey, 
    children 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    sectionKey: string; 
    children: React.ReactNode; 
  }) => (
    <motion.div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform ${
            activeSection === sectionKey ? 'rotate-180' : ''
          }`} 
        />
      </button>
      <AnimatePresence>
        {activeSection === sectionKey && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Filters Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={onReset}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronDownIcon 
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`} 
              />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {/* Remote toggle */}
          <button
            onClick={() => handleFilterChange('remote_only', !filters.remote_only)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.remote_only
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            🏠 Remote
          </button>

          {/* Popular job types */}
          {['full-time', 'part-time', 'contract'].map(type => (
            <button
              key={type}
              onClick={() => handleFilterChange('job_type', filters.job_type === type ? '' : type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filters.job_type === type
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {type.replace('-', ' ')}
            </button>
          ))}

          {/* Popular experience levels */}
          {['entry', 'mid', 'senior'].map(level => (
            <button
              key={level}
              onClick={() => handleFilterChange('experience_level', filters.experience_level === level ? '' : level)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                filters.experience_level === level
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {level} Level
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Sort By */}
              <FilterSection
                title="Sort By"
                icon={                  <CpuChipIcon className="w-4 h-4" />}
                sectionKey="sort"
              >
                <div className="grid grid-cols-1 gap-2">
                  {sortOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sort_by"
                        value={option.value}
                        checked={filters.sort_by === option.value}
                        onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Job Type */}
              <FilterSection
                title="Job Type"
                icon={<BriefcaseIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                sectionKey="jobType"
              >
                <div className="grid grid-cols-1 gap-2">
                  {jobTypeOptions.map(option => (
                    <label key={option.value} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="job_type"
                          value={option.value}
                          checked={filters.job_type === option.value}
                          onChange={(e) => handleFilterChange('job_type', e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      </div>
                      {option.count && (
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {option.count}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Experience Level */}
              <FilterSection
                title="Experience Level"
                icon={<AcademicCapIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                sectionKey="experience"
              >
                <div className="grid grid-cols-1 gap-2">
                  {experienceOptions.map(option => (
                    <label key={option.value} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="experience_level"
                          value={option.value}
                          checked={filters.experience_level === option.value}
                          onChange={(e) => handleFilterChange('experience_level', e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                      </div>
                      {option.count && (
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {option.count}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Salary Range */}
              <FilterSection
                title="Salary Range"
                icon={<CurrencyDollarIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                sectionKey="salary"
              >
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {currentSalaryRanges.map((range, index) => (
                      <label key={index} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="salary_range"
                          value={`${range.min}-${range.max}`}
                          checked={filters.salary_min === range.min && filters.salary_max === range.max}
                          onChange={() => {
                            handleFilterChange('salary_min', range.min);
                            handleFilterChange('salary_max', range.max);
                          }}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{range.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Custom salary range */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Min Salary
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 500000"
                          value={filters.salary_min || ''}
                          onChange={(e) => handleFilterChange('salary_min', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Max Salary
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 1200000"
                          value={filters.salary_max || ''}
                          onChange={(e) => handleFilterChange('salary_max', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Date Posted */}
              <FilterSection
                title="Date Posted"
                icon={<CalendarIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                sectionKey="date"
              >
                <div className="grid grid-cols-1 gap-2">
                  {datePostedOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="date_posted"
                        value={option.value}
                        checked={filters.date_posted === option.value}
                        onChange={(e) => handleFilterChange('date_posted', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isLoading && (
        <div className="p-4 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            Updating filters...
          </div>
        </div>
      )}
    </div>
  );
}
