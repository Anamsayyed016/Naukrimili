"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { safeLength } from '../lib/safe-array-utils';
import { ArrowRight, Award, Clock, MapPin, BriefcaseIcon, Building2, Briefcase } from 'lucide-react';
import SEOJobLink from '../components/SEOJobLink';
import JobSearchHero from '../components/JobSearchHero';
import CompanyLogo from '../components/companies/CompanyLogo';

const FeaturedJobsSectionLazy = dynamic(
  () =>
    import('./HomePageClient').then((mod) => ({
      default: mod.FeaturedJobsSection,
    })),
  { ssr: true }
);

const TopCompaniesSectionLazy = dynamic(
  () =>
    import('./HomePageClient').then((mod) => ({
      default: mod.TopCompaniesSection,
    })),
  { ssr: true }
);

interface HomePageJob {
  id: number | string;
  sourceId?: string | null;
  source?: string;
  title: string;
  company: string | null;
  companyLogo?: string | null;
  location: string | null;
  country?: string;
  salary: string | null;
  jobType: string | null;
  experienceLevel?: string | null;
  isRemote: boolean;
  isFeatured: boolean;
  sector?: string | null;
}

interface Company {
  id: string;
  name: string;
  logo?: string | null;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  jobCount: number;
}

interface HomePageClientProps {
  featuredJobs: HomePageJob[];
  topCompanies: Company[];
}

export default function HomePageClient({
  featuredJobs,
  topCompanies
}: HomePageClientProps) {
  const [visibleElements, setVisibleElements] = useState<Set<string>>(new Set());

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute('data-animate-id');
            if (elementId) {
              setVisibleElements(prev => new Set([...prev, elementId]));
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const animatedElements = document.querySelectorAll('[data-animate-id]');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, [featuredJobs, topCompanies]);

  const getDelayClass = (index: number) => {
    const delays = ['delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500', 'delay-600'];
    return delays[index] || 'delay-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100/40">
      <JobSearchHero />

      <FeaturedJobsSectionLazy
        featuredJobs={featuredJobs}
        visibleElements={visibleElements}
        getDelayClass={getDelayClass}
      />

      <TopCompaniesSectionLazy topCompanies={topCompanies} />
    </div>
  );
}

interface FeaturedJobsSectionProps {
  featuredJobs: HomePageJob[];
  visibleElements: Set<string>;
  getDelayClass: (index: number) => string;
}

export function FeaturedJobsSection({
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
}

interface TopCompaniesSectionProps {
  topCompanies: Company[];
}

export function TopCompaniesSection({ topCompanies }: TopCompaniesSectionProps) {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12">
          <div className="mb-6 sm:mb-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Top Companies</h2>
            <p className="text-sm sm:text-base text-gray-600">Work with the best companies in the industry</p>
          </div>
          <Link
            href="/companies"
            className="group flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200"
          >
            View All Companies
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {safeLength(topCompanies) > 0 ? (
            (topCompanies || []).map((company) => (
              <div key={company.id} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                <div className="flex items-start gap-4 mb-4">
                  <CompanyLogo
                    name={company.name}
                    logo={company.logo}
                    website={company.website}
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{company.name}</h3>

                    {company.industry && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <BriefcaseIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{company.industry}</span>
                      </div>
                    )}

                    {company.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{company.location}</span>
                      </div>
                    )}

                    {company.jobCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span>{company.jobCount} open position{company.jobCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  {(() => {
                    const companyIdStr = String(company.id || '');
                    return companyIdStr.includes('fallback') || companyIdStr.includes('techcorp') || companyIdStr.includes('innovate') || companyIdStr.includes('dataflow') || companyIdStr.includes('cloudtech') || companyIdStr.includes('creative') || companyIdStr.includes('fintech') ? (
                      companyIdStr.includes('techcorp') ? (
                        <a
                          href="https://careers.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : companyIdStr.includes('innovate') ? (
                        <a
                          href="https://careers.microsoft.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : companyIdStr.includes('dataflow') ? (
                        <a
                          href="https://www.amazon.jobs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : companyIdStr.includes('cloudtech') ? (
                        <a
                          href="https://careers.google.com/cloud"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : companyIdStr.includes('creative') ? (
                        <a
                          href="https://careers.adobe.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : companyIdStr.includes('fintech') ? (
                        <a
                          href="https://jobs.jpmorgan.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                        >
                          View Company →
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm font-medium">
                          View Company →
                        </span>
                      )
                    ) : (
                      <Link
                        href={`/companies/${company.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline"
                      >
                        View Company →
                      </Link>
                    );
                  })()}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Companies Available</h3>
              <p className="text-gray-600 mb-4">Check back later for company listings</p>
              <Link
                href="/companies"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
              >
                Browse All Companies
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
