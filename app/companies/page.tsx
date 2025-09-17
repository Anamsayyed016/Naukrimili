'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Building2, MapPin, Users, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  location: string | null;
  industry: string | null;
  size: string | null;
  founded: number | null;
  isVerified: boolean;
  _count: {
    jobs: number;
  };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchTerm, selectedIndustry, companies]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies/public');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompanies(data.data.companies || []);
        } else {
          console.error('API returned error:', data.error);
          setCompanies([]);
        }
      } else {
        console.error('API request failed:', response.status, response.statusText);
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by industry
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(company => company.industry === selectedIndustry);
    }

    setFilteredCompanies(filtered);
  };

  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Amazing Companies
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore top companies across various industries and find your next career opportunity
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search companies by name, description, industry, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Industries</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {filteredCompanies.length} of {companies.length} companies
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="w-12 h-12 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {company.name}
                    </CardTitle>
                    {company.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Description */}
              {company.description && (
                <p className="text-gray-600 text-sm line-clamp-3">
                  {company.description}
                </p>
              )}

              {/* Company Details */}
              <div className="space-y-2 text-sm text-gray-600">
                {company.industry && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>{company.industry}</span>
                  </div>
                )}
                
                {company.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{company.location}</span>
                  </div>
                )}
                
                {company.size && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{company.size} employees</span>
                  </div>
                )}
                
                {company.founded && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Founded {company.founded}</span>
                  </div>
                )}
              </div>

              {/* Job Count and Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-semibold text-blue-600">
                    {company._count.jobs}
                  </span>
                  <span className="text-gray-600 ml-1">
                    {company._count.jobs === 1 ? 'job' : 'jobs'} available
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  {company.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Website
                      </a>
                    </Button>
                  )}
                  
                  <Button size="sm" asChild>
                    <Link href={`/companies/${company.id}`}>
                      View Company
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or filters to find more companies.
          </p>
        </div>
      )}
    </div>
  );
}
