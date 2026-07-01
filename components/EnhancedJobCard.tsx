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
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { JobResult } from '@/types/jobs';
import Image from 'next/image';
import Link from 'next/link';
import { useSEOJobUrl } from '@/components/SEOJobLink';
import { normalizeJobData } from '@/lib/job-data-normalizer';
import { formatJobSalary } from '@/lib/currency-utils';
import {
  JOB_NAV_KEYS,
  saveJobNavigationSource,
  saveJobSearchContext,
} from '@/lib/job-navigation-state';
import {
  cleanJobDescription,
  getJobDescriptionPreview,
} from '@/lib/jobs/clean-job-description';
import {
  formatJobCardLocation,
  normalizeJobLocationText,
} from '@/lib/jobs/format-job-location';
const jc = {
  card:
    'group bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_28px_-10px_rgba(15,23,42,0.09)] hover:border-blue-200/60 hover:shadow-[0_12px_32px_-8px_rgba(37,99,235,0.14),0_4px_16px_-6px_rgba(124,58,237,0.08)] hover:-translate-y-0.5 transition-all duration-200 ease-out',
  cardCompact:
    'group bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_20px_-8px_rgba(15,23,42,0.08)] hover:border-blue-200/50 hover:shadow-[0_8px_24px_-8px_rgba(37,99,235,0.12)] hover:-translate-y-0.5 transition-all duration-200 ease-out',
  cardViewed: 'border-blue-300/70 ring-2 ring-blue-100/90 bg-gradient-to-br from-blue-50/30 to-white',
  header: 'p-4 sm:p-5 lg:p-6',
  title:
    'text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors duration-200 antialiased',
  titleCompact:
    'font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors duration-200 antialiased mb-1',
  company: 'text-sm text-slate-500/90 font-medium truncate tracking-tight',
  companyCompact: 'text-xs text-slate-500/90 font-medium truncate tracking-tight',
  meta: 'text-xs sm:text-sm text-slate-500/90',
  metaIcon: 'w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400/90 flex-shrink-0',
  logo: 'rounded-xl overflow-hidden bg-white ring-1 ring-slate-200/80 shadow-sm flex-shrink-0',
  statusChip:
    'inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-slate-700 bg-gradient-to-r from-slate-50 to-slate-100/80 border border-slate-200/70 rounded-full shadow-sm',
  metaChip:
    'inline-flex items-center px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-slate-600 bg-gradient-to-r from-slate-50/90 to-blue-50/40 border border-slate-200/60 rounded-full whitespace-nowrap capitalize',
  skillChip:
    'px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-slate-700 bg-gradient-to-r from-slate-50 to-violet-50/50 border border-slate-200/60 rounded-full whitespace-nowrap',
  salaryWrap:
    'inline-flex items-center gap-2 py-1.5 px-3 sm:py-2 sm:px-3.5 bg-gradient-to-r from-slate-50/90 to-cyan-50/30 border border-slate-200/60 rounded-xl mb-3 sm:mb-4 shadow-sm',
  salaryText: 'text-sm sm:text-base font-bold text-slate-800 tracking-tight antialiased',
  footer: 'px-4 sm:px-5 lg:px-6 py-3 sm:py-4 border-t border-slate-100/80 bg-gradient-to-b from-slate-50/50 to-white flex gap-2 sm:gap-3',
  btnPrimary:
    'flex-1 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6d28d9] text-white font-semibold py-2 sm:py-2.5 lg:py-3 px-4 sm:px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-[0_4px_14px_-4px_rgba(37,99,235,0.45)] hover:shadow-[0_6px_20px_-4px_rgba(124,58,237,0.4)] hover:-translate-y-px active:translate-y-0',
  btnSecondary:
    'px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200/80 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-slate-50 hover:border-slate-300/80 text-slate-600 transition-all duration-200 flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow',
  bookmark:
    'p-2 sm:p-2.5 rounded-xl border border-slate-200/70 bg-white/90 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300/70 transition-all duration-200 flex-shrink-0 shadow-sm',
  bookmarkActive: 'bg-amber-50/90 border-amber-200/80 text-amber-600 hover:bg-amber-50 shadow-sm',
} as const;

/** Card location: responsive clamp + full text in native tooltip. */
function JobCardLocation({
  location,
  className = '',
}: {
  location?: string;
  className?: string;
}) {
  const full = normalizeJobLocationText(location);
  const label = formatJobCardLocation(location);
  return (
    <span
      className={`min-w-0 max-w-full break-words line-clamp-2 sm:line-clamp-1 sm:truncate ${className}`}
      title={full || undefined}
    >
      {label}
    </span>
  );
}

/** Shared job card surface tokens (UI only). */
function JobCardDescription({
  description,
  maxLines,
  jobUrl,
}: {
  description: string;
  maxLines: 2 | 3;
  jobUrl: string;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const text = getJobDescriptionPreview(description, maxLines === 3 ? 280 : 220);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const check = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [text, maxLines]);

  const clampClass = maxLines === 3 ? 'line-clamp-3 max-h-[4.8rem]' : 'line-clamp-2 max-h-[3.2rem]';

  if (!text) return null;

  return (
    <div className="mt-1.5 min-w-0 w-full max-w-full overflow-hidden">
      <p
        ref={textRef}
        className={`text-sm text-slate-500/95 leading-[1.7] font-normal tracking-normal break-words overflow-hidden ${clampClass}`}
      >
        {text}
      </p>
      {isTruncated && (
        <Link
          href={jobUrl}
          className="text-xs font-semibold text-[#2563EB] hover:text-[#7C3AED] mt-1 inline-block transition-colors duration-200"
        >
          … Read More
        </Link>
      )}
    </div>
  );
}

/** Full job description body for detail pages — never truncated or line-clamped. */
export function JobDescriptionView({
  description,
  className = '',
}: {
  description: string;
  className?: string;
}) {
  const text = cleanJobDescription(description);
  if (!text) return null;

  return (
    <div
      className={`text-sm sm:text-base text-slate-600/95 leading-[1.75] tracking-normal break-words whitespace-pre-wrap min-w-0 max-w-full overflow-visible ${className}`}
    >
      {text}
    </div>
  );
}

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
      const lastViewedJobId = sessionStorage.getItem(JOB_NAV_KEYS.lastViewedJobId);
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
              sessionStorage.removeItem(JOB_NAV_KEYS.lastViewedJobId);
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


  // Compact view for mobile or dense listings
  if (viewMode === 'compact') {
    return (
      <>
        <motion.div
          ref={cardRef}
          className={`${jc.cardCompact} p-3 sm:p-4 min-w-0 overflow-hidden ${
            isViewedJob ? jc.cardViewed : ''
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
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 ${jc.logo}`}>
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
                    <span className={`${jc.statusChip} text-rose-700 bg-rose-50/80 border-rose-200/70`}>
                      <FireIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">Urgent</span>
                    </span>
                  )}
                  {normalizedJob.is_featured && (
                    <span className={jc.statusChip}>
                      <span className="hidden sm:inline">Featured</span>
                      <span className="sm:hidden">★</span>
                    </span>
                  )}
                  {isSampleJob && (
                    <span className={jc.statusChip}>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      <span className="hidden sm:inline">Sample</span>
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className={jc.titleCompact}>{normalizedJob.title}</h3>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 min-w-0">
                <div className="flex items-center min-w-0 max-w-full">
                  <BuildingOffice2Icon className="w-3 h-3 mr-1.5 text-slate-400 flex-shrink-0" />
                  <span className={jc.companyCompact}>{normalizedJob.company}</span>
                </div>
                <span className="hidden sm:inline text-slate-300">·</span>
                <div className="flex items-start min-w-0 max-w-full gap-1.5 overflow-hidden">
                  <MapPinIcon className="w-3 h-3 mr-0.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <JobCardLocation location={normalizedJob.location} className={jc.companyCompact} />
                </div>
              </div>

              {normalizedJob.description && (
                <JobCardDescription
                  description={normalizedJob.description}
                  maxLines={2}
                  jobUrl={seoJobUrl}
                />
              )}
              
              {formatJobSalary(normalizedJob) !== 'Salary not specified' && (
                <div className={`${jc.salaryWrap} mb-2`}>
                  <span className={`${jc.salaryText} text-xs sm:text-sm`}>
                    {formatJobSalary(normalizedJob)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleBookmark}
                className={`${jc.bookmark} p-1.5 sm:p-2 ${isBookmarked ? jc.bookmarkActive : ''}`}
                title={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
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
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-300 text-white text-xs font-medium rounded-lg cursor-not-allowed flex items-center gap-1"
                  title="Sample job - not available for application"
                >
                  <span className="hidden sm:inline">Sample</span>
                  <span className="sm:hidden">Sample</span>
                  <ChevronRightIcon className="w-3 h-3" />
                </button>
              ) : (
                <Link
                  href={`${seoJobUrl}/apply`}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1d4ed8] hover:to-[#6d28d9] text-white text-xs font-semibold rounded-xl transition-all duration-200 flex items-center gap-1 shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]"
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
        className={`${jc.card} overflow-hidden ${
          viewMode === 'grid' ? 'h-full flex flex-col w-full min-w-0' : 'w-full min-w-0'
        } ${isViewedJob ? jc.cardViewed : ''}`}
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
        <div className={`${jc.header} ${viewMode === 'grid' ? 'flex-1 flex flex-col min-h-0' : ''}`}>
          <div className={`flex items-start justify-between mb-3 sm:mb-4 ${viewMode === 'grid' ? 'flex-shrink-0' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                {job.is_urgent && (
                  <span className={`${jc.statusChip} text-rose-700 bg-rose-50/80 border-rose-200/70`}>
                    <FireIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="hidden min-[475px]:inline">Urgent</span>
                    <span className="min-[475px]:hidden">Urgent</span>
                  </span>
                )}
                {job.is_featured && (
                  <span className={jc.statusChip}>
                    <span className="hidden min-[475px]:inline">Featured</span>
                    <span className="min-[475px]:hidden">★</span>
                  </span>
                )}
                {isSampleJob && (
                  <span className={jc.statusChip}>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slate-400 rounded-full" />
                    <span className="hidden min-[475px]:inline">Sample</span>
                    <span className="min-[475px]:hidden">Sample</span>
                  </span>
                )}
                {job.is_remote && (
                  <span className={jc.statusChip}>
                    <span className="hidden min-[475px]:inline">Remote</span>
                    <span className="min-[475px]:hidden">Remote</span>
                  </span>
                )}
                {job.is_hybrid && (
                  <span className={jc.statusChip}>
                    <span className="hidden min-[475px]:inline">Hybrid</span>
                    <span className="min-[475px]:hidden">Hybrid</span>
                  </span>
                )}
              </div>

              {/* Company logo and title */}
              <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                {showCompanyLogo && job.companyLogo && !imageError && (
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 ${jc.logo}`}>
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
                  <h3 className={`${jc.title} mb-1 sm:mb-1.5`}>{job.title}</h3>
                  <div className="flex items-center gap-1.5 min-w-0 mb-1.5 sm:mb-2">
                    <BuildingOffice2Icon className={jc.metaIcon} />
                    <span className={jc.company}>{job.company}</span>
                  </div>
                </div>
              </div>

              {/* Location and job details */}
              <div className={`flex items-center flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3 min-w-0 max-w-full overflow-hidden ${jc.meta}`}>
                <div className="flex items-start min-w-0 max-w-full gap-1.5 overflow-hidden">
                  <MapPinIcon className={jc.metaIcon} />
                  <JobCardLocation location={job.location} />
                </div>
                
                {job.job_type && (
                  <span className={jc.metaChip}>
                    {job.job_type.replace(/-/g, ' ')}
                  </span>
                )}
                
                {job.experience_level && (
                  <span className={jc.metaChip}>
                    {job.experience_level}
                  </span>
                )}
              </div>
            </div>

            {/* Bookmark button */}
            <button
              type="button"
              onClick={handleBookmark}
              className={`${jc.bookmark} ${isBookmarked ? jc.bookmarkActive : ''}`}
              title={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
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
            <div className={`${jc.salaryWrap} flex-wrap`}>
              <span className={jc.salaryText}>{formatJobSalary(job)}</span>
              {showSalaryInsights && (
                <span className={`${jc.metaChip} normal-case`}>Competitive</span>
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
                    <span key={index} className={jc.skillChip}>
                      {skill}
                    </span>
                  ))}
                  {(skillsArray || []).length > 6 && (
                    <span className={`${jc.skillChip} text-slate-400`}>
                      +{(skillsArray || []).length - 6} more
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Description */}
          {job.description && (
            <div className="mb-3 sm:mb-4 min-w-0 overflow-hidden">
              <JobCardDescription
                description={job.description}
                maxLines={viewMode === 'grid' ? 3 : 2}
                jobUrl={seoJobUrl}
              />
            </div>
          )}

          {/* Footer info */}
          <div className={`flex items-center justify-between flex-wrap gap-2 sm:gap-2.5 pt-2 sm:pt-2.5 border-t border-slate-100/70 ${jc.meta}`}>
            <div className="flex items-center min-w-0 gap-1.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100/80 border border-slate-200/60 flex-shrink-0">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
              </span>
              <span className="truncate font-medium text-slate-600">Posted {job.time_ago}</span>
            </div>
            
            {job.sector && (
              <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-violet-700 bg-gradient-to-r from-violet-50 to-blue-50/60 border border-violet-200/50 rounded-full capitalize shadow-sm">
                {job.sector}
              </span>
            )}
          </div>
        </div>

        <div className={`${jc.footer} ${viewMode === 'grid' ? 'flex-shrink-0' : ''}`}>
          {isSampleJob ? (
            <button
              disabled
              className="flex-1 bg-slate-300 text-white font-medium py-2 sm:py-2.5 rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5 text-xs sm:text-sm"
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
                if (typeof window !== 'undefined') {
                  const currentUrl = new URL(window.location.href);
                  const params = new URLSearchParams(currentUrl.searchParams);
                  const listPage = sessionStorage.getItem(JOB_NAV_KEYS.listPage);
                  if (listPage && listPage !== '1') {
                    params.set('page', listPage);
                  }
                  const qs = params.toString();
                  saveJobSearchContext(qs, listPage ? parseInt(listPage, 10) : undefined);
                  saveJobNavigationSource(
                    qs ? `${window.location.pathname}?${qs}` : window.location.pathname
                  );
                  sessionStorage.setItem(
                    JOB_NAV_KEYS.lastViewedJobId,
                    String(normalizedJob.id || normalizedJob.sourceId || '')
                  );
                }
              }}
              className={jc.btnPrimary}
            >
              <span className="hidden min-[475px]:inline">View Details</span>
              <span className="min-[475px]:hidden">View</span>
              <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            </Link>
          )}
          
          <button
            type="button"
            onClick={handleQuickView}
            className={jc.btnSecondary}
            title="Quick view"
            aria-label="Quick view"
          >
            <EyeIcon className="w-4 h-4 text-slate-500" />
          </button>
          
        </div>
      </motion.div>
    </>
  );
}
