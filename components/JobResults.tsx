"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPinIcon,
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ClockIcon,
  BookmarkIcon,
  ShareIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  StarIcon,
  ChevronRightIcon,
  FireIcon,
  HomeIcon,
  AdjustmentsHorizontalIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import {
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Job } from '@/hooks/useRealTimeJobSearch';

interface JobResultsProps {
  jobs: Job[];
  isLoading: boolean;
  className?: string}

type ViewMode = 'list' | 'grid';
type SortOption = 'relevance' | 'date' | 'salary' | 'company';

// Skeleton loader component
const JobCardSkeleton = ({ viewMode }: { viewMode: ViewMode }) => (
  <Card className={`animate-pulse ${viewMode === 'grid' ? 'h-64' : 'h-32'}`}>
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        {viewMode === 'grid' && (
          <>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </>
        )}
      </div>
    </CardContent>
  </Card>
);

// Job card component
const JobCard = ({ 
  job, 
  viewMode, 
  isBookmarked, 
  onBookmark, 
  onShare, 
  onView 
}: { 
  job: Job;
  viewMode: ViewMode;
  isBookmarked: boolean;
  onBookmark: (id: string) => void;
  onShare: (job: Job) => void;
  onView: (job: Job) => void}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(job.redirect_url, '_blank', 'noopener,noreferrer')};

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark(job.id)};

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(job)};

  const cardClass = viewMode === 'grid' 
    ? 'h-full cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1'
    : 'cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1.005 }}
    >
      <Card
        className={cardClass}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onView(job)}
      >
        <CardContent className={`p-4 ${viewMode === 'grid' ? 'h-full flex flex-col' : 'flex items-center'}`}>
          {/* Grid View Layout */}
          {viewMode === 'grid' && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={job.companyLogo} alt={job.company} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-semibold">
                      {job.company.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {job.isUrgent && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          <FireIcon className="h-3 w-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                      {job.isRemote && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <HomeIcon className="h-3 w-3 mr-1" />
                          Remote
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {job.company}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBookmark}
                  className={`p-1 rounded-full transition-colors ${
                    isBookmarked
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {isBookmarked ? (
                    <BookmarkSolidIcon className="h-4 w-4" />
                  ) : (
                    <BookmarkIcon className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                
                {job.salaryFormatted && (
                  <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    <span>{job.salaryFormatted}</span>
                  </div>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {job.description}
                </p>

                {job.skills && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {job.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center text-xs text-gray-500">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  <span>{job.timeAgo}</span>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleShare}
                    className="h-7 w-7 p-0"
                  >
                    <ShareIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    className="text-xs px-3 h-7"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* List View Layout */}
          {viewMode === 'list' && (
            <div className="flex items-center w-full space-x-4">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={job.companyLogo} alt={job.company} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {job.company.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {job.title}
                      </h3>
                      {job.isUrgent && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          <FireIcon className="h-3 w-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                      {job.isRemote && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <HomeIcon className="h-3 w-3 mr-1" />
                          Remote
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <BuildingOffice2Icon className="h-4 w-4 mr-1" />
                        {job.company}
                      </span>
                      <span className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {job.location}
                      </span>
                      {job.salaryFormatted && (
                        <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          {job.salaryFormatted}
                        </span>
                      )}
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {job.timeAgo}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={handleBookmark}
                      className={`p-2 rounded-full transition-colors ${
                        isBookmarked
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {isBookmarked ? (
                        <BookmarkSolidIcon className="h-4 w-4" />
                      ) : (
                        <BookmarkIcon className="h-4 w-4" />
                      )}
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleShare}
                    >
                      <ShareIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApply}
                    >
                      Apply
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>)};

export default function JobResults({ jobs, isLoading, className = '' }: JobResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());

  // Sort jobs based on selected option
  const sortedJobs = useMemo(() => {
    const jobsCopy = [...jobs];
    
    switch (sortBy) {
      case 'date':
        return jobsCopy.sort((a, b) => {
          // Parse timeAgo and sort by most recent;
          const aTime = parseTimeAgo(a.timeAgo);
          const bTime = parseTimeAgo(b.timeAgo);
          return aTime - bTime});
      case 'salary':
        return jobsCopy.sort((a, b) => {;
          const aSalary = extractSalary(a.salaryFormatted);
          const bSalary = extractSalary(b.salaryFormatted);
          return bSalary - aSalary});
      case 'company':
        return jobsCopy.sort((a, b) => a.company.localeCompare(b.company));
      default:
        return jobsCopy; // Keep original relevance order
    }
  }, [jobs, sortBy]);

  // Handle bookmark toggle
  const handleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(jobId)) {
        newBookmarks.delete(jobId)} else {
        newBookmarks.add(jobId)}
      
      // Save to localStorage
      localStorage.setItem('bookmarkedJobs', JSON.stringify([...newBookmarks]));
      return newBookmarks})};

  // Handle job share
  const handleShare = async (job: Job) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} at ${job.company}`,
          text: `Check out this job opportunity: ${job.title} at ${job.company}`,
          url: window.location.href + `?job=${job.id}`
        })} catch (error) {copyToClipboard(job)}
    } else {
      copyToClipboard(job)}
  };

  // Fallback copy to clipboard
  const copyToClipboard = (job: Job) => {
    const text = `${job.title} at ${job.company} - ${window.location.href}?job=${job.id}`;
    navigator.clipboard.writeText(text).then(() => {
      // You might want to show a toast notification here
    }).then(() => {
      // Success
    })};

  // Handle job view
  const handleView = (job: Job) => {
    // Navigate to job details or open in modal
    window.open(`/jobs/${job.id}`, '_blank')};

  // Load bookmarks from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('bookmarkedJobs');
    if (saved) {
      setBookmarkedJobs(new Set(JSON.parse(saved)))}
  }, []);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {Array.from({ length: 6 }).map((_, index) => (
            <JobCardSkeleton key={index} viewMode={viewMode} />
          ))}
        </div>
      </div>)}

  if (jobs.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <BuildingOffice2Icon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No jobs found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try adjusting your search criteria or filters to find more opportunities.
          </p>
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <p>💡 Try broader search terms</p>
            <p>🌍 Expand your location search</p>
            <p>⚙️ Remove some filters</p>
          </div>
        </div>
      </div>)}

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Updated in real-time as you search
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Sort Options */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-40">
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="date">Date Posted</SelectItem>
              <SelectItem value="salary">Salary</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <ListBulletIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Job Results */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${sortBy}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }
        >
          {sortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              viewMode={viewMode}
              isBookmarked={bookmarkedJobs.has(job.id)}
              onBookmark={handleBookmark}
              onShare={handleShare}
              onView={handleView}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>)}

// Utility functions
function parseTimeAgo(timeAgo: string): number {
  const now = Date.now();
  const match = timeAgo.match(/(\d+)\s*(hour|day|week|month)s?\s*ago/i);
  
  if (!match) return now;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000
  };
  
  return now - (value * (multipliers[unit as keyof typeof multipliers] || 0))}

function extractSalary(salaryStr?: string): number {
  if (!salaryStr) return 0;
  
  // Extract numbers from salary string
  const matches = salaryStr.match(/[\d,]+/g);
  if (!matches) return 0;
  
  // Get the highest number (assuming it's the max salary)
  const numbers = matches.map(s => parseInt(s.replace(/,/g, '')));
  return Math.max(...numbers)}
