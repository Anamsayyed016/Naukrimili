'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  MapPin, 
  Users, 
  Star, 
  Building, 
  Globe, 
  Calendar, 
  Briefcase, 
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Mail,
  Phone,
  Linkedin,
  Twitter
} from 'lucide-react';

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

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) {
      fetchCompanyDetails();
    }
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/companies/${companyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch company details');
      }
      
      const data = await response.json();
      if (data.success) {
        setCompany(data.company);
      } else {
        throw new Error(data.error || 'Failed to load company details');
      }
    } catch (err: any) {
      console.error('Error fetching company details:', err);
      setError(err?.message || 'Failed to load company details');
      // Fallback to mock data
      loadMockCompanyData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockCompanyData = () => {
    const mockCompany: Company = {
      id: companyId as string,
      name: 'TechCorp India',
      industry: 'Technology',
      location: 'Bangalore, Karnataka',
      size: '1000-5000 employees',
      rating: 4.5,
      reviews: 2847,
      logo: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=200&h=200&fit=crop&crop=center',
      description: 'Leading technology company providing innovative AI and cloud solutions to global enterprises. We specialize in artificial intelligence, cloud computing, and enterprise software development, helping businesses transform their digital operations.',
      openJobs: 45,
      founded: '2010',
      headquarters: 'Bangalore, India',
      website: 'https://techcorp.in',
      specialties: ['Artificial Intelligence', 'Cloud Computing', 'Enterprise Software', 'Data Analytics', 'Machine Learning'],
      benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Learning Budget', 'Stock Options', 'Gym Membership'],
      featured: true
    };
    setCompany(mockCompany);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-600 mb-4">{error || 'Company not found'}</p>
            <Link
              href="/companies"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Companies
            </Link>
          </div>
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
            <Link href="/companies" className="text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Companies
            </Link>
            <nav className="text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/companies" className="hover:text-blue-600">Companies</Link>
              <span className="mx-2">/</span>
              <span className="text-blue-600 font-semibold">{company.name}</span>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Company Logo and Basic Info */}
            <div className="flex-shrink-0">
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="w-32 h-32 rounded-2xl object-cover border border-gray-200"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{company.name}</h1>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {company.industry}
                    </span>
                    {company.featured && (
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        FEATURED
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">{company.rating}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{company.reviews} reviews</p>
                </div>
              </div>
              
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">{company.description}</p>
              
              {/* Company Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{company.openJobs}</div>
                  <div className="text-sm text-gray-600">Open Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{company.size}</div>
                  <div className="text-sm text-gray-600">Company Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{company.founded}</div>
                  <div className="text-sm text-gray-600">Founded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{company.location}</div>
                  <div className="text-sm text-gray-600">Location</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Company */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About {company.name}</h2>
              <p className="text-gray-700 leading-relaxed mb-6">{company.description}</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Company Details
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Headquarters: {company.headquarters}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Size: {company.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Founded: {company.founded}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Website: <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {company.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Employee Benefits</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {company.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Jobs */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions</h2>
              <div className="text-center py-8">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{company.openJobs} open positions</h3>
                <p className="text-gray-600 mb-6">Explore exciting career opportunities at {company.name}</p>
                <Link
                  href={`/jobs?company=${company.name}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View All Jobs
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Company Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Follow Company
                </button>
                <button className="w-full border border-blue-600 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                  Save Company
                </button>
                <button className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Share Company
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span>Visit Website</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>careers@{company.website.replace('https://', '').replace('http://', '')}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors">
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn</span>
                </a>
                <a href="#" className="flex items-center gap-3 text-blue-400 hover:text-blue-500 transition-colors">
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
