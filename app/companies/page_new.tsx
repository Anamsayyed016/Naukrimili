"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Users, Star, Building, Filter, ChevronDown, Briefcase, TrendingUp } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  size: string;
  rating: number;
  reviews: number;
  logo: string;
  description: string;
  openJobs: number;
  founded: string;
  headquarters: string;
  website: string;
  specialties: string[];
  benefits: string[];
  featured: boolean;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  // Enhanced company data with comprehensive information
  useEffect(() => {
    const mockCompanies: Company[] = [
      // Tech Giants
      {
        id: '1',
        name: 'TechCorp India',
        industry: 'Technology',
        location: 'Bangalore',
        size: '1000-5000 employees',
        rating: 4.5,
        reviews: 2847,
        logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop&crop=center',
        description: 'Leading technology company providing innovative AI and cloud solutions to global enterprises.',
        openJobs: 45,
        founded: '2010',
        headquarters: 'Bangalore, India',
        website: 'techcorp.in',
        specialties: ['Artificial Intelligence', 'Cloud Computing', 'Enterprise Software', 'Data Analytics'],
        benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Learning Budget', 'Stock Options'],
        featured: true
      },
      {
        id: '2',
        name: 'InnovateTech Solutions',
        industry: 'Technology',
        location: 'Pune',
        size: '500-1000 employees',
        rating: 4.3,
        reviews: 1523,
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
        description: 'Cutting-edge software development company specializing in mobile and web applications.',
        openJobs: 28,
        founded: '2015',
        headquarters: 'Pune, India',
        website: 'innovatetech.com',
        specialties: ['Mobile Development', 'Web Development', 'UI/UX Design', 'DevOps'],
        benefits: ['Health Insurance', 'Gym Membership', 'Team Outings', 'Professional Development'],
        featured: true
      },
      // Finance & Banking
      {
        id: '3',
        name: 'FinTech Solutions Hub',
        industry: 'Finance',
        location: 'Mumbai',
        size: '200-500 employees',
        rating: 4.4,
        reviews: 892,
        logo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop&crop=center',
        description: 'Revolutionary fintech company transforming digital banking and payment solutions.',
        openJobs: 22,
        founded: '2018',
        headquarters: 'Mumbai, India',
        website: 'fintechsolutions.in',
        specialties: ['Digital Banking', 'Payment Systems', 'Blockchain', 'Risk Management'],
        benefits: ['Competitive Salary', 'Performance Bonus', 'Health Coverage', 'Flexible Work'],
        featured: true
      },
      {
        id: '4',
        name: 'InvestBank Corp',
        industry: 'Banking',
        location: 'Mumbai',
        size: '5000+ employees',
        rating: 4.1,
        reviews: 3254,
        logo: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=100&h=100&fit=crop&crop=center',
        description: 'Premier investment banking institution providing comprehensive financial services.',
        openJobs: 67,
        founded: '1995',
        headquarters: 'Mumbai, India',
        website: 'investbank.com',
        specialties: ['Investment Banking', 'Corporate Finance', 'Wealth Management', 'Trading'],
        benefits: ['High Compensation', 'Bonuses', 'International Exposure', 'Career Growth'],
        featured: false
      },
      // Healthcare & Pharmaceuticals
      {
        id: '5',
        name: 'HealthCare Innovations',
        industry: 'Healthcare',
        location: 'Hyderabad',
        size: '1000-5000 employees',
        rating: 4.6,
        reviews: 1876,
        logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=100&h=100&fit=crop&crop=center',
        description: 'Leading healthcare technology company revolutionizing patient care and medical solutions.',
        openJobs: 34,
        founded: '2012',
        headquarters: 'Hyderabad, India',
        website: 'healthcareinnovations.in',
        specialties: ['Medical Technology', 'Telemedicine', 'Healthcare Analytics', 'Drug Development'],
        benefits: ['Medical Benefits', 'Research Opportunities', 'Flexible Schedule', 'Learning Support'],
        featured: true
      },
      {
        id: '6',
        name: 'PharmaLife Sciences',
        industry: 'Pharmaceuticals',
        location: 'Ahmedabad',
        size: '500-1000 employees',
        rating: 4.2,
        reviews: 654,
        logo: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=100&h=100&fit=crop&crop=center',
        description: 'Pharmaceutical company focused on developing life-saving medications and treatments.',
        openJobs: 19,
        founded: '2008',
        headquarters: 'Ahmedabad, India',
        website: 'pharmalife.com',
        specialties: ['Drug Discovery', 'Clinical Research', 'Regulatory Affairs', 'Quality Assurance'],
        benefits: ['Research Environment', 'Health Coverage', 'Professional Growth', 'Innovation Culture'],
        featured: false
      },
      // E-commerce & Retail
      {
        id: '7',
        name: 'E-Commerce Hub',
        industry: 'E-commerce',
        location: 'Bangalore',
        size: '2000-5000 employees',
        rating: 4.0,
        reviews: 2145,
        logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop&crop=center',
        description: 'Major e-commerce platform connecting millions of buyers and sellers across India.',
        openJobs: 89,
        founded: '2014',
        headquarters: 'Bangalore, India',
        website: 'ecommercehub.in',
        specialties: ['E-commerce Platform', 'Logistics', 'Digital Marketing', 'Customer Experience'],
        benefits: ['Employee Discounts', 'Flexible Work', 'Career Advancement', 'Team Events'],
        featured: true
      },
      // Consulting & Professional Services
      {
        id: '8',
        name: 'Global Consulting Partners',
        industry: 'Consulting',
        location: 'Delhi',
        size: '500-1000 employees',
        rating: 4.3,
        reviews: 987,
        logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center',
        description: 'Premier management consulting firm helping organizations transform and grow.',
        openJobs: 31,
        founded: '2005',
        headquarters: 'Delhi, India',
        website: 'globalconsulting.com',
        specialties: ['Strategy Consulting', 'Digital Transformation', 'Operations', 'Technology Consulting'],
        benefits: ['International Projects', 'Learning Opportunities', 'Travel Allowance', 'Mentorship'],
        featured: false
      },
      // Manufacturing & Engineering
      {
        id: '9',
        name: 'Advanced Manufacturing Co.',
        industry: 'Manufacturing',
        location: 'Chennai',
        size: '1000-5000 employees',
        rating: 4.1,
        reviews: 756,
        logo: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=100&h=100&fit=crop&crop=center',
        description: 'Leading manufacturing company specializing in automotive and aerospace components.',
        openJobs: 42,
        founded: '1998',
        headquarters: 'Chennai, India',
        website: 'advancedmfg.com',
        specialties: ['Automotive Parts', 'Aerospace Components', 'Precision Engineering', 'Quality Control'],
        benefits: ['Skill Development', 'Safety Programs', 'Performance Incentives', 'Retirement Plans'],
        featured: false
      },
      // Media & Entertainment
      {
        id: '10',
        name: 'Creative Media House',
        industry: 'Media',
        location: 'Mumbai',
        size: '200-500 employees',
        rating: 4.4,
        reviews: 543,
        logo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=100&h=100&fit=crop&crop=center',
        description: 'Dynamic media production company creating content for digital and traditional platforms.',
        openJobs: 18,
        founded: '2016',
        headquarters: 'Mumbai, India',
        website: 'creativemedia.in',
        specialties: ['Content Creation', 'Video Production', 'Digital Marketing', 'Brand Strategy'],
        benefits: ['Creative Environment', 'Flexible Hours', 'Project Variety', 'Industry Networking'],
        featured: true
      },
      // Education & EdTech
      {
        id: '11',
        name: 'EduTech Innovations',
        industry: 'Education',
        location: 'Bangalore',
        size: '500-1000 employees',
        rating: 4.5,
        reviews: 1234,
        logo: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop&crop=center',
        description: 'EdTech company revolutionizing online learning and educational technology.',
        openJobs: 26,
        founded: '2017',
        headquarters: 'Bangalore, India',
        website: 'edutechinnovations.com',
        specialties: ['Online Learning', 'Educational Content', 'Learning Analytics', 'Mobile Education'],
        benefits: ['Learning Culture', 'Professional Development', 'Work-Life Balance', 'Impact-Driven Work'],
        featured: true
      },
      // Startups & Emerging Companies
      {
        id: '12',
        name: 'GreenTech Startup',
        industry: 'Clean Technology',
        location: 'Pune',
        size: '50-200 employees',
        rating: 4.7,
        reviews: 87,
        logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop&crop=center',
        description: 'Innovative startup developing sustainable technology solutions for environmental challenges.',
        openJobs: 12,
        founded: '2020',
        headquarters: 'Pune, India',
        website: 'greentechstartup.in',
        specialties: ['Renewable Energy', 'Sustainability', 'IoT Solutions', 'Environmental Tech'],
        benefits: ['Equity Participation', 'Flexible Culture', 'Innovation Freedom', 'Rapid Growth'],
        featured: false
      }
    ];

    setCompanies(mockCompanies);
    setLoading(false);
  }, []);

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === '' || company.industry.toLowerCase().includes(industryFilter.toLowerCase());
    return matchesSearch && matchesIndustry;
  });

  const featuredCompanies = filteredCompanies.filter(company => company.featured);
  const regularCompanies = filteredCompanies.filter(company => !company.featured);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:text-blue-700 transition-colors">
              ← Back to Home
            </Link>
            <nav className="text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/companies" className="text-blue-600 font-semibold">Companies</Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover Top Companies
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore leading companies across various industries. Find your ideal workplace and start your career journey.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-12">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Company name or industry..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <option value="">All Industries</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Healthcare">Healthcare</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Consulting">Consulting</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Media">Media</option>
                <option value="Education">Education</option>
              </select>
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center">
              <Search className="h-5 w-5 mr-2" />
              Search Companies
            </button>
          </div>
        </div>

        {/* Featured Companies */}
        {featuredCompanies.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Companies</h2>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium ml-3">
                {featuredCompanies.length}
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCompanies.map((company) => (
                <div key={company.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 text-xs font-semibold">
                    FEATURED
                  </div>
                  <div className="flex items-center mb-4">
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="w-16 h-16 rounded-xl object-cover mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{company.name}</h3>
                      <p className="text-blue-600 font-medium">{company.industry}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{company.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{company.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{company.size}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Star className="h-4 w-4 mr-1 text-blue-400 fill-current" />
                      <span className="font-semibold text-gray-700">{company.rating}</span>
                      <span className="text-gray-500 ml-1">({company.reviews} reviews)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-green-600 font-semibold">{company.openJobs} open jobs</span>
                    </div>
                    <Link
                      href={`/companies/${company.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      View Company
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Companies */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                All Companies ({filteredCompanies.length})
              </h2>
              <p className="text-gray-600">
                {searchQuery || industryFilter ? 'Filtered results' : 'Browse all companies'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Sort by
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="text-center py-16">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No companies found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or explore different industries.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {regularCompanies.map((company) => (
                <div key={company.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center flex-1">
                      <img
                        src={company.logo}
                        alt={`${company.name} logo`}
                        className="w-20 h-20 rounded-xl object-cover mr-6"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-800">{company.name}</h3>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {company.industry}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{company.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{company.location}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{company.size}</span>
                          </div>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-blue-400 fill-current" />
                            <span className="font-semibold text-gray-700">{company.rating}</span>
                            <span className="ml-1">({company.reviews})</span>
                          </div>
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1 text-green-600" />
                            <span className="text-green-600 font-semibold">{company.openJobs} jobs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                        Follow
                      </button>
                      <Link
                        href={`/companies/${company.id}`}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                      >
                        View Company
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {filteredCompanies.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
              Load More Companies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
