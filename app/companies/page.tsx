'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Search, MapPin, Building, Users, Calendar } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  logo?: string | null;
  location?: string | null;
  industry?: string | null;
  description?: string | null;
  website?: string | null;
  employeeCount?: number | null;
  foundedYear?: number | null;
  isVerified: boolean;
  jobCount: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  const locations = ['All Locations', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];
  const industries = ['All Industries', 'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Consulting'];

  useEffect(() => {
    fetchCompanies();
  }, [searchTerm, selectedLocation, selectedIndustry]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedLocation && selectedLocation !== 'All Locations') params.append('location', selectedLocation);
      if (selectedIndustry && selectedIndustry !== 'All Industries') params.append('industry', selectedIndustry);

      const res = await fetch(`/api/companies?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
      } else {
        setError(data.error || 'Failed to load companies');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Top Companies</h1>
          <p className="text-xl text-gray-600">Discover amazing companies and career opportunities</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {locations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading companies...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchCompanies}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Companies Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link 
                key={company.id} 
                href={`/companies/${company.id}`} 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  {company.logo ? (
                    <img 
                      src={company.logo} 
                      alt={company.name} 
                      className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">{company.name}</h3>
                      {company.isVerified && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {company.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{company.location}</span>
                        </div>
                      )}
                      {company.industry && (
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span>{company.industry}</span>
                        </div>
                      )}
                      {company.employeeCount && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{company.employeeCount}+ employees</span>
                        </div>
                      )}
                      {company.foundedYear && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Founded {company.foundedYear}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-blue-600 font-medium">{company.jobCount} open positions</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && companies.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
              <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search criteria or check back later.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLocation('');
                  setSelectedIndustry('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
