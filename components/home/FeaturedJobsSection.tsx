'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Clock, MapPin, Briefcase } from 'lucide-react';
import { safeLength } from '@/lib/safe-array-utils';
import SEOJobLink from '@/components/SEOJobLink';
import type { HomePageJob } from './home-types';

export interface FeaturedJobsSectionProps {
  featuredJobs: HomePageJob[];
  visibleElements: Set<string>;
  getDelayClass: (index: number) => string;
}

export default memo(function FeaturedJobsSection({
  featuredJobs,
  visibleElements,
  getDelayClass,
}: FeaturedJobsSectionProps) {
  return (
    <section
      className={`py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50/30 transition-all duration-1000 ease-out ${
        visibleElements.has('featured-jobs') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      data-animate-id="featured-jobs"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12">
          <div className="mb-6 sm:mb-0">
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 transition-all duration-1000 ease-out delay-200 ${
                visibleElements.has('featured-jobs-title') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              data-animate-id="featured-jobs-title"
            >
              Featured Jobs
            </h2>
            <p
              className={`text-sm sm:text-base text-gray-600 transition-all duration-1000 ease-out delay-300 ${
                visibleElements.has('featured-jobs-subtitle') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              data-animate-id="featured-jobs-subtitle"
            >
              Discover the latest opportunities from top companies
            </p>
          </div>
          <Link
            href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&limit=1000"
            className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200"
          >
            View All Jobs
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {safeLength(featuredJobs) > 0 ? (
            (featuredJobs || []).map((job, index) => (
              <div
                key={job.id}
                className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 transform transition-all duration-700 ease-out hover:scale-105 ${getDelayClass(index)} ${
                  visibleElements.has(`job-card-${job.id}`) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                }`}
                data-animate-id={`job-card-${job.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{job.title}</h3>
                    <p className="text-gray-600 mb-2">{job.company}</p>
                  </div>
                  {job.isFeatured && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {job.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                  {job.salary && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4 flex-shrink-0" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                  {job.jobType && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{job.jobType}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <SEOJobLink job={job as unknown as Record<string, unknown> & { id?: string | number }} className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
                    View Details →
                  </SEOJobLink>
                  <SEOJobLink job={job as unknown as Record<string, unknown> & { id?: string | number }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 hover:scale-105">
                    Apply Now
                  </SEOJobLink>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Featured Jobs Available</h3>
              <p className="text-gray-600 mb-4">Check back later for new opportunities</p>
              <Link
                href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&limit=1000"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
              >
                Browse All Jobs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});
