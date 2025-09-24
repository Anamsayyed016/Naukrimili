'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  StarIcon,
  ChevronRightIcon,
  EyeIcon,
  FireIcon,
  GlobeAltIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { JobResult, JobQuickView } from '@/types/jobs';
import Image from 'next/image';
import Link from 'next/link';
import { useSEOJobUrl } from '@/components/SEOJobLink';

interface EnhancedJobCardProps {
  job: JobResult;
  isBookmarked?: boolean;
  onBookmark?: (jobId: string) => void;
  onQuickView?: (job: JobResult) => void;
  viewMode?: 'list' | 'grid' | 'compact';
  showCompanyLogo?: boolean;
  showSalaryInsights?: boolean;
}

export default function EnhancedJobCard({
  job,
  isBookmarked = false,
  onBookmark,
  onQuickView,
  viewMode = 'list',
  showCompanyLogo = true,
  showSalaryInsights = true
}: EnhancedJobCardProps) {
  const [imageError, setImageError] = useState(false);
  const seoJobUrl = useSEOJobUrl(job);

  const handleBookmark = () => {
    onBookmark?.(job.id);
  };

  const handleQuickView = () => {
    onQuickView?.(job);
  };


  // Get job type badge color
  const getJobTypeBadgeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'full-time':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'part-time':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contract':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'internship':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'freelance':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get experience level color
  const getExperienceLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'entry':
      case 'fresher':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'mid':
      case 'intermediate':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'senior':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'lead':
      case 'executive':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Compact view for mobile or dense listings
  if (viewMode === 'compact') {
    return (
      <>
        <motion.div
          className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-3 sm:p-4"
          whileHover={{ y: -2 }}
          layoutId={`job-card-${job.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {showCompanyLogo && job.companyLogo && !imageError && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={job.companyLogo}
                      alt={`${job.company} logo`}
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  {job.is_urgent && (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <FireIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Urgent</span>
                    </span>
                  )}
                  {job.is_featured && (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                      ⭐ <span className="hidden sm:inline">Featured</span>
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-600 mb-2 gap-1 sm:gap-0">
                <div className="flex items-center">
                  <BuildingOffice2Icon className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{job.company}</span>
                </div>
                <span className="hidden sm:inline mx-2">•</span>
                <div className="flex items-center">
                  <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>
              
              {job.salary_formatted && (
                <div className="text-green-600 font-medium text-xs sm:text-sm mb-2">
                  {job.salary_formatted}
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleBookmark}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isBookmarked ? (
                  <StarIconSolid className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <StarIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
              
              <Link
                href={`${seoJobUrl}/apply`}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
              >
                <span className="hidden sm:inline">Apply</span>
                <span className="sm:hidden">Apply</span>
                <ChevronRightIcon className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Full card view (list or grid)
  return (
    <>
      <motion.div
        className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden ${
          viewMode === 'grid' ? 'h-full' : ''
        }`}
        whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
        layoutId={`job-card-${job.id}`}
      >
        {/* Card Header */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {job.is_urgent && (
                  <motion.span 
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.3 }}
                  >
                    <FireIcon className="w-3 h-3" />
                    Urgent Hiring
                  </motion.span>
                )}
                {job.is_featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                    ⭐ Featured
                  </span>
                )}
                {job.is_remote && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    🏠 Remote
                  </span>
                )}
                {job.is_hybrid && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    🏢 Hybrid
                  </span>
                )}
              </div>

              {/* Company logo and title */}
              <div className="flex items-start gap-3 mb-3">
                {showCompanyLogo && job.companyLogo && !imageError && (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={job.companyLogo}
                      alt={`${job.company} logo`}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <BuildingOffice2Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-medium truncate">{job.company}</span>
                  </div>
                </div>
              </div>

              {/* Location and job details */}
              <div className="flex items-center text-gray-500 mb-3 flex-wrap gap-2">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span>{job.location}</span>
                </div>
                
                {job.job_type && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getJobTypeBadgeColor(job.job_type)}`}>
                      {job.job_type}
                    </span>
                  </>
                )}
                
                {job.experience_level && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getExperienceLevelColor(job.experience_level)}`}>
                      {job.experience_level}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bookmark button */}
            <button
              onClick={handleBookmark}
              className={`p-3 rounded-full transition-all duration-200 ${
                isBookmarked
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 scale-110'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isBookmarked ? (
                <StarIconSolid className="w-5 h-5" />
              ) : (
                <StarIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Salary */}
          {job.salary_formatted && (
            <div className="flex items-center text-green-600 font-semibold mb-4">
              <CurrencyDollarIcon className="w-5 h-5 mr-1" />
              <span className="text-lg">{job.salary_formatted}</span>
              {showSalaryInsights && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  • Competitive
                </span>
              )}
            </div>
          )}

          {/* Skills */}
          {(() => {
            const skillsArray = (() => {
              if (!job.skills) return [];
              if (Array.isArray(job.skills)) return job.skills;
              if (typeof job.skills === 'string') {
                return job.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s);
              }
              return [];
            })();
            return skillsArray.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {skillsArray.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                  {skillsArray.length > 6 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                      +{skillsArray.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Description */}
          {job.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {job.description}
            </p>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>Posted {job.time_ago}</span>
            </div>
            
            {job.sector && (
              <span className="px-2 py-1 bg-gray-50 rounded-md text-xs">
                {job.sector}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <Link
            href={`${seoJobUrl}/apply`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
          >
            Apply Now
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
          
          <button 
            onClick={handleQuickView}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            title="Quick view"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          
        </div>
      </motion.div>
    </>
  );
}
