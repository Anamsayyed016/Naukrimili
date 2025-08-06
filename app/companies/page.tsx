'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  location: string;
  employees: string;
  openJobs: number;
  rating: number;
  description: string;
  benefits: string[];
  techStack: string[];
  category: string}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Record<string, number>>({});

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedCategory 
        ? `/api/companies?category=${selectedCategory}`
        : '/api/companies';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies);
        setCategories(data.categories)}
    } catch (error) {
    console.error("Error:", error);
    throw error}
      console.error('Error fetching companies:', error)} finally {
      setLoading(false)}
  }, [selectedCategory]);

  // Fetch companies when component mounts or category changes
  useEffect(() => {
    fetchCompanies()}, [fetchCompanies]);

  const categoryNames = {
    'tech-giants': 'Tech Giants',
    'unicorns': 'Indian Unicorns',
    'it-services': 'IT Services',
    'banking': 'Banking & Finance'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading companies...</p>
        </div>
      </div>)}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Top Companies</h1>
          <p className="mt-2 text-gray-600">Discover amazing companies and their open positions</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Companies ({Object.values(categories).reduce((a, b) => a + b, 0)})
            </button>
            {Object.entries(categoryNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {name} ({categories[key] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow">
              {/* Company Header */}
              <div className="flex items-center mb-4">
                <Image 
                  src={company.logo} 
                  alt={`${company.name} logo`}
                  width={48}
                  height={48}
                  className="rounded-lg mr-4"
                  onError={(e) => {
                    // @ts-ignore - Type 'string' is not assignable to type 'never';
                    e.currentTarget.src = '/placeholder-logo.png'}}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                  <p className="text-sm text-gray-600">{company.industry}</p>
                </div>
              </div>

              {/* Company Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>📍 {company.location}</span>
                  <span>⭐ {company.rating}/5</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>👥 {company.employees}</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    {company.openJobs} Open Jobs
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-4">{company.description}</p>
              </div>

              {/* Tech Stack */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Tech Stack:</h4>
                <div className="flex flex-wrap gap-1">
                  {company.techStack.slice(0, 4).map((tech) => (
                    <span key={tech} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {tech}
                    </span>
                  ))}
                  {company.techStack.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{company.techStack.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Benefits:</h4>
                <div className="flex flex-wrap gap-1">
                  {company.benefits.slice(0, 3).map((benefit) => (
                    <span key={benefit} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {benefit}
                    </span>
                  ))}
                  {company.benefits.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{company.benefits.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => window.open(`/companies/${company.id}`, '_blank')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                View Jobs & Details
              </button>
            </div>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No companies found in this category.</p>
          </div>
        )}
      </div>
    </div>
  )}