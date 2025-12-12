'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  CalendarIcon,
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
import { normalizeJobData } from '@/lib/job-data-normalizer';
import { formatJobSalary } from '@/lib/currency-utils';

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
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Normalize job data to ensure consistency
  const normalizedJob = normalizeJobData(job);
  // Generate SEO-friendly URL for the job
  const seoJobUrl = useSEOJobUrl(
    normalizedJob as unknown as Record<string, unknown> & { id?: string | number }
  );
  
  // Check if this is a sample job - CRITICAL FIX: Ensure ID is string before calling startsWith
  const jobIdStr = String(normalizedJob.id || '');
  const isSampleJob = jobIdStr.startsWith('sample-') || normalizedJob.source === 'sample';
  
  // Check if this is the last viewed job for highlighting
  const [isViewedJob, setIsViewedJob] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastViewedJobId = sessionStorage.getItem('lastViewedJobId');
      const currentJobId = String(normalizedJob.id || normalizedJob.sourceId || '');
      
      if (lastViewedJobId && (lastViewedJobId === currentJobId || lastViewedJobId.includes(currentJobId) || currentJobId.includes(lastViewedJobId))) {
        setIsViewedJob(true);
        
        // Scroll to this job and highlight it
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Remove the highlight after 5 seconds
            setTimeout(() => {
              setIsViewedJob(false);
              sessionStorage.removeItem('lastViewedJobId');
            }, 5000);
          }
        }, 300);
      }
    }
  }, [normalizedJob.id, normalizedJob.sourceId]);

  const handleBookmark = () => {
    onBookmark?.(normalizedJob.id);
  };

  const handleQuickView = () => {
    onQuickView?.(normalizedJob);
  };


  // Get job type badge color - Enhanced with gradients
  const getJobTypeBadgeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'full-time':
        return 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm';
      case 'part-time':
        return 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-800 border-blue-300 shadow-sm';
      case 'contract':
        return 'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-800 border-orange-300 shadow-sm';
      case 'internship':
        return 'bg-gradient-to-br from-purple-100 to-pink-100 text-purple-800 border-purple-300 shadow-sm';
      case 'freelance':
        return 'bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-800 border-indigo-300 shadow-sm';
      default:
        return 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm';
    }
  };

  // Get experience level color - Enhanced with modern colors
  const getExperienceLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'entry':
      case 'fresher':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 border-green-300 shadow-sm';
      case 'mid':
      case 'intermediate':
        return 'bg-gradient-to-br from-blue-50 to-sky-50 text-blue-700 border-blue-300 shadow-sm';
      case 'senior':
        return 'bg-gradient-to-br from-purple-50 to-fuchsia-50 text-purple-700 border-purple-300 shadow-sm';
      case 'lead':
      case 'executive':
        return 'bg-gradient-to-br from-orange-50 to-red-50 text-orange-700 border-orange-300 shadow-sm';
      default:
        return 'bg-gradient-to-br from-gray-50 to-slate-50 text-gray-700 border-gray-300 shadow-sm';
    }
  };

  // Compact view for mobile or dense listings
  if (viewMode === 'compact') {
    return (
      <>
        <motion.div
          ref={cardRef}
          className={`group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border p-3 sm:p-4 ${
            isViewedJob 
              ? 'border-blue-500 border-2 ring-2 ring-blue-200 bg-blue-50/30' 
              : 'border-gray-200'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          style={{ 
            contain: 'layout style paint',
            contentVisibility: 'auto'
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {showCompanyLogo && normalizedJob.companyLogo && !imageError && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={normalizedJob.companyLogo}
                      alt={`${normalizedJob.company} logo`}
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  {normalizedJob.is_urgent && (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      <FireIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Urgent</span>
                    </span>
                  )}
                  {normalizedJob.is_featured && (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                      ⭐ <span className="hidden sm:inline">Featured</span>
                    </span>
                  )}
                  {isSampleJob && (
                    <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                      <span className="hidden sm:inline">Sample</span>
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {normalizedJob.title}
              </h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-600 mb-2 gap-1 sm:gap-0">
                <div className="flex items-center">
                  <BuildingOffice2Icon className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{normalizedJob.company}</span>
                </div>
                <span className="hidden sm:inline mx-2">•</span>
                <div className="flex items-center">
                  <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{normalizedJob.location}</span>
                </div>
              </div>
              
              {formatJobSalary(normalizedJob) !== 'Salary not specified' && (
                <div className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg mb-2">
                  <span className="font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {formatJobSalary(normalizedJob)}
                  </span>
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
              
              {isSampleJob ? (
                <button
                  disabled
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-400 text-white text-xs font-medium rounded-lg cursor-not-allowed flex items-center gap-1"
                  title="Sample job - not available for application"
                >
                  <span className="hidden sm:inline">Sample</span>
                  <span className="sm:hidden">Sample</span>
                  <ChevronRightIcon className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  href={`${seoJobUrl}/apply`}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Apply</span>
                  <span className="sm:hidden">Apply</span>
                  <ChevronRightIcon className="w-3 h-3" />
                </Link>
              )}
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
        ref={cardRef}
        className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border overflow-hidden ${
          viewMode === 'grid' ? 'h-full flex flex-col w-full min-w-0' : 'w-full'
        } ${
          isViewedJob 
            ? 'border-blue-500 border-2 ring-4 ring-blue-200 bg-blue-50/30' 
            : 'border-gray-200'
        }`}
        style={{ 
          contain: 'layout style paint',
          contentVisibility: 'auto',
          ...(viewMode === 'grid' ? { maxWidth: '100%' } : {})
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Card Header */}
        <div className={`p-4 sm:p-5 lg:p-6 bg-gradient-to-br from-white to-slate-50/50 ${viewMode === 'grid' ? 'flex-1 flex flex-col min-h-0' : ''}`}>
          <div className={`flex items-start justify-between mb-3 sm:mb-4 ${viewMode === 'grid' ? 'flex-shrink-0' : ''}`}>
            <div className="flex-1 min-w-0">
              {/* Status badges - Enhanced with gradients */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                {job.is_urgent && (
                  <span 
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-300 text-[10px] sm:text-xs font-semibold rounded-full shadow-sm"
                  >
                    <FireIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden min-[475px]:inline">Urgent Hiring</span>
                    <span className="min-[475px]:hidden">Urgent</span>
                  </span>
                )}
                {job.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300 text-[10px] sm:text-xs font-semibold rounded-full shadow-sm">
                    ⭐ <span className="hidden min-[475px]:inline">Featured</span>
                  </span>
                )}
                {isSampleJob && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-300 text-[10px] sm:text-xs font-semibold rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-500 rounded-full animate-pulse"></span>
                    <span className="hidden min-[475px]:inline">Sample Job</span>
                    <span className="min-[475px]:hidden">Sample</span>
                  </span>
                )}
                {job.is_remote && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300 text-[10px] sm:text-xs font-semibold rounded-full shadow-sm">
                    🏠 <span className="hidden min-[475px]:inline">Remote</span>
                  </span>
                )}
                {job.is_hybrid && (
                  <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-300 text-[10px] sm:text-xs font-semibold rounded-full shadow-sm">
                    🏢 <span className="hidden min-[475px]:inline">Hybrid</span>
                  </span>
                )}
              </div>

              {/* Company logo and title */}
              <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                {showCompanyLogo && job.companyLogo && !imageError && (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
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
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                    {job.title}
                  </h3>
                  <div className="flex items-center text-gray-600 mb-1.5 sm:mb-2">
                    <BuildingOffice2Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="font-medium truncate text-sm sm:text-base">{job.company}</span>
                  </div>
                </div>
              </div>

              {/* Location and job details */}
              <div className="flex items-center text-gray-500 mb-2 sm:mb-3 flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <div className="flex items-center min-w-0">
                  <MapPinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                
                {job.job_type && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full border font-semibold whitespace-nowrap ${getJobTypeBadgeColor(job.job_type)}`}>
                      {job.job_type.replace(/-/g, ' ').toUpperCase()}
                    </span>
                  </>
                )}
                
                {job.experience_level && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full border font-semibold whitespace-nowrap ${getExperienceLevelColor(job.experience_level)}`}>
                      {job.experience_level.toUpperCase()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bookmark button */}
            <button
              onClick={handleBookmark}
              className={`p-2 sm:p-2.5 lg:p-3 rounded-full transition-all duration-200 flex-shrink-0 ${
                isBookmarked
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 scale-110'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
              title={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isBookmarked ? (
                <StarIconSolid className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <StarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          {/* Salary - Enhanced with gradient */}
          {formatJobSalary(job) !== 'Salary not specified' && (
            <div className="flex items-center flex-wrap gap-2 p-2.5 sm:p-3 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-lg sm:rounded-xl border border-emerald-200 mb-3 sm:mb-4">
              <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                {formatJobSalary(job)}
              </span>
              {showSalaryInsights && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 whitespace-nowrap">
                  Competitive
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
            return (skillsArray || []).length > 0 && (
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {skillsArray.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-700 text-[10px] sm:text-xs rounded-md whitespace-nowrap"
                    >
                      {skill}
                    </span>
                  ))}
                  {(skillsArray || []).length > 6 && (
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-500 text-[10px] sm:text-xs rounded-md">
                      +{(skillsArray || []).length - 6} more
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Description */}
          {job.description && (
            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
              {job.description
                .replace(/<[^>]*>/g, '') // Strip HTML tags
                .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
                .replace(/&amp;/g, '&') // Replace &amp; with &
                .replace(/&lt;/g, '<') // Replace &lt; with <
                .replace(/&gt;/g, '>') // Replace &gt; with >
                .replace(/&quot;/g, '"') // Replace &quot; with "
                .trim()
              }
            </p>
          )}

          {/* Footer info */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 flex-wrap gap-1 sm:gap-2">
            <div className="flex items-center min-w-0">
              <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">Posted {job.time_ago}</span>
            </div>
            
            {job.sector && (
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-50 rounded-md text-[10px] sm:text-xs whitespace-nowrap">
                {job.sector}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Actions - Enhanced with gradients */}
        <div className={`px-4 sm:px-5 lg:px-6 py-3 sm:py-4 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 flex gap-2 sm:gap-3 ${viewMode === 'grid' ? 'flex-shrink-0' : ''}`}>
          {isSampleJob ? (
            <button
              disabled
              className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold py-2 sm:py-2.5 lg:py-3 px-4 sm:px-5 lg:px-6 rounded-lg sm:rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm text-xs sm:text-sm"
              title="Sample job - not available for application"
            >
              <span className="hidden min-[475px]:inline">Sample Job</span>
              <span className="min-[475px]:hidden">Sample</span>
              <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            </button>
          ) : (
            <Link
              href={seoJobUrl}
              onClick={() => {
                // PRESERVE SEARCH STATE: Save current search params and job ID before navigating
                if (typeof window !== 'undefined') {
                  const currentUrl = new URL(window.location.href);
                  const searchParams = currentUrl.searchParams.toString();
                  if (searchParams) {
                    sessionStorage.setItem('jobSearchParams', searchParams);
                    console.log('💾 Saved search params before navigation:', searchParams);
                  }
                  // Save the job ID that was clicked for highlighting when returning
                  sessionStorage.setItem('lastViewedJobId', String(normalizedJob.id || normalizedJob.sourceId || ''));
                  // Save source page
                  sessionStorage.setItem('jobDetailsSource', window.location.pathname);
                }
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-semibold py-2 sm:py-2.5 lg:py-3 px-4 sm:px-5 lg:px-6 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 hover:scale-105 hover:shadow-lg shadow-md text-xs sm:text-sm"
            >
              <span className="hidden min-[475px]:inline">View Details</span>
              <span className="min-[475px]:hidden">View</span>
              <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            </Link>
          )}
          
          <button 
            onClick={handleQuickView}
            className="px-3 sm:px-4 py-2 sm:py-2.5 lg:py-3 border border-indigo-200 bg-white rounded-lg sm:rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md flex-shrink-0"
            title="Quick view"
          >
            <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
          </button>
          
        </div>
      </motion.div>
    </>
  );
}
