'use client';

import Link from 'next/link';
import { ArrowRight, MapPin, BriefcaseIcon, Briefcase, Building2 } from 'lucide-react';
import { safeLength } from '@/lib/safe-array-utils';
import CompanyLogo from '@/components/companies/CompanyLogo';
import type { HomePageCompany } from './home-types';

export interface TopCompaniesSectionProps {
  topCompanies: HomePageCompany[];
}

export default function TopCompaniesSection({ topCompanies }: TopCompaniesSectionProps) {
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
