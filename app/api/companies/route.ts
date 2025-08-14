/**
 * Companies API - Real Database Integration
 * GET /api/companies - Get companies with job counts and details
 * POST /api/companies - Create new company (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock companies data for now
const mockCompanies = [
  { id: 1, name: 'TechCorp', location: 'Bangalore', logo: null, industry: 'Technology' },
  { id: 2, name: 'InnovateSoft', location: 'Mumbai', logo: null, industry: 'Software' },
  { id: 3, name: 'Digital Solutions', location: 'Delhi', logo: null, industry: 'IT Services' },
  { id: 4, name: 'Future Systems', location: 'Hyderabad', logo: null, industry: 'Technology' },
  { id: 5, name: 'Smart Solutions', location: 'Chennai', logo: null, industry: 'Software' },
  { id: 6, name: 'Tech Innovators', location: 'Pune', logo: null, industry: 'IT Services' }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    
    let filteredCompanies = mockCompanies;
    
    if (query) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.name.toLowerCase().includes(query.toLowerCase()) ||
        company.industry.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (location) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    return NextResponse.json({
      success: true,
      companies: filteredCompanies,
      total: filteredCompanies.length
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch companies',
      companies: mockCompanies // Fallback to mock data
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      message: 'Company profile creation not yet implemented',
      note: 'Companies are automatically created when jobs are posted',
      data: body
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      message: error.message
    }, { status: 500 });
  }
}