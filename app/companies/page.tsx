'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Users, Globe, Search, Filter, Briefcase, ArrowRight, ExternalLink } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string;
  logo: string | null;
  location: string;
  industry: string;
  sector: string;
  website: string | null;
  careerPageUrl: string | null;
  size: string | null;
  founded: number | null;
  isGlobal: boolean;
  jobCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const sectors = [
    'All Sectors',
    'Technology',
    'IT Services',
    'Consulting & Professional Services',
    'Banking & Finance',
    'Healthcare',
    'Manufacturing & Automotive',
    'Retail & E-Commerce',
    'Education & EdTech',
    'Energy & Petrochemicals'
  ];

  useEffect(() => {
    fetchCompanies();
  }, [searchTerm, selectedSector, selectedType, pagination.page]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedSector !== 'all') params.append('sector', selectedSector);
      if (selectedType !== 'all') params.append('isGlobal', selectedType === 'global' ? 'true' : 'false');

      const response = await fetch(`/api/companies-list?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCompanies(data.companies || []);
        setPagination(data.pagination || pagination);
      } else {
        setError(data.error || 'Failed to load companies');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCompanies();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Explore Top Companies
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-3xl mx-auto mb-6 sm:mb-8">
              Discover opportunities at leading global companies and innovative startups across all sectors
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto mt-8 sm:mt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{pagination.total}</div>
                <div className="text-xs sm:text-sm text-blue-100">Companies</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">50+</div>
                <div className="text-xs sm:text-sm text-blue-100">Global Brands</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">10+</div>
                <div className="text-xs sm:text-sm text-blue-100">Sectors</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">24/7</div>
                <div className="text-xs sm:text-sm text-blue-100">Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="sticky top-0 z-40 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search companies by name, industry, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                />
              </div>
              <button
                type="submit"
                className="px-6 sm:px-8 py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl whitespace-nowrap text-sm sm:text-base"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <select
                  value={selectedSector}
                  onChange={(e) => {
                    setSelectedSector(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-sm sm:text-base"
                >
                  <option value="all">All Sectors</option>
                  {sectors.slice(1).map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all text-sm sm:text-base"
                >
                  <option value="all">All Companies</option>
                  <option value="global">Global Companies</option>
                  <option value="employer">Employer Companies</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Companies</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchCompanies}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Companies Found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSector('all');
                setSelectedType('all');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6 sm:mb-8">
              <p className="text-sm sm:text-base text-gray-600">
                Showing <span className="font-semibold text-gray-900">{companies.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total}</span> companies
              </p>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="group bg-white rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-blue-200 relative overflow-hidden"
                >
                  {/* Global Badge */}
                  {company.isGlobal && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
                        <Globe className="w-3 h-3" />
                        <span className="hidden sm:inline">Global</span>
                      </span>
                    </div>
                  )}

                  {/* Company Logo */}
                  <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-100">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                      />
                    ) : (
                      <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Company Info */}
                  <div className="mb-4">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {company.name}
                    </h3>

                    {/* Sector Badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {company.sector || company.industry}
                      </span>
                    </div>

                    {/* Description */}
                    {company.description && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                        {company.description}
                      </p>
                    )}

                    {/* Company Details */}
                    <div className="space-y-2">
                      {company.location && (
                        <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                          <span className="line-clamp-1">{company.location}</span>
                        </div>
                      )}

                      {company.size && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Users className="w-4 h-4 flex-shrink-0 text-gray-400" />
                          <span>{company.size} employees</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 flex-shrink-0 text-gray-400" />
                        <span className="font-semibold text-blue-600">
                          {company.jobCount} {company.jobCount === 1 ? 'job' : 'jobs'} available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-4">
                    {/* Primary Action - View Details */}
                    <Link
                      href={`/companies/${company.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                    
                    {/* Secondary Actions */}
                    <div className="flex flex-row gap-2">
                      <Link
                        href={`/jobs?company=${encodeURIComponent(company.name)}`}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-all duration-200"
                      >
                        <Briefcase className="w-3 h-3" />
                        <span className="hidden sm:inline">Jobs</span>
                        <span className="sm:hidden">{company.jobCount}</span>
                      </Link>

                      {company.careerPageUrl && (
                        <a
                          href={company.careerPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-all duration-200"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Career</span>
                          <span className="sm:hidden">Site</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 sm:mt-12">
                <p className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1 sm:gap-2">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-all ${
                            pagination.page === pageNum
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 sm:py-16 lg:py-20 mt-8 sm:mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
            Your Dream Company Awaits
          </h2>
          <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8">
            Explore thousands of job opportunities from the world's leading companies and innovative startups
          </p>
          <Link
            href="/jobs?unlimited=true&includeExternal=true&includeDatabase=true&limit=1000"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-xl text-sm sm:text-base"
          >
            Browse All Jobs
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
