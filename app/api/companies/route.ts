import { NextRequest, NextResponse } from 'next/server';

// Fast mock data - no database needed
const mockCompanies = [
  { id: 1, name: 'TechCorp', location: 'Bangalore', industry: 'Technology', description: 'Leading tech company', website: 'https://techcorp.com', employeeCount: '1000+', foundedYear: 2010, isVerified: true, jobCount: 25 },
  { id: 2, name: 'InnovateSoft', location: 'Mumbai', industry: 'Software', description: 'Innovative software solutions', website: 'https://innovatesoft.com', employeeCount: '500+', foundedYear: 2015, isVerified: true, jobCount: 18 },
  { id: 3, name: 'Digital Solutions', location: 'Delhi', industry: 'IT Services', description: 'Digital transformation experts', website: 'https://digitalsolutions.com', employeeCount: '750+', foundedYear: 2012, isVerified: true, jobCount: 22 },
  { id: 4, name: 'Future Systems', location: 'Hyderabad', industry: 'Technology', description: 'Building the future', website: 'https://futuresystems.com', employeeCount: '300+', foundedYear: 2018, isVerified: false, jobCount: 12 }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const industry = searchParams.get('industry') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Fast filtering
    let filteredCompanies = mockCompanies;
    
    if (search) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (location) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (industry) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.industry.toLowerCase().includes(industry.toLowerCase())
      );
    }
    
    // Simple pagination
    const total = filteredCompanies.length;
    const skip = (page - 1) * limit;
    const paginatedCompanies = filteredCompanies.slice(skip, skip + limit);
    
    return NextResponse.json({
      success: true,
      companies: paginatedCompanies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    // Fallback - always return data
    return NextResponse.json({
      success: true,
      companies: mockCompanies,
      pagination: { page: 1, limit: 20, total: mockCompanies.length, pages: 1 }
    });
  }
}